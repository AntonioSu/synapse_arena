/**
 * 重刷所有【可能在前端显示为 DEADLOCK】的话题。
 *
 * 候选来源（取并集）：
 *   1. Redis: ai_judge_result.current_winner === 'TIE'
 *   2. Redis: ai_judge_result 缺失（一旦缓存过期，前端 fallback 可能造出假 TIE）
 *   3. PostgreSQL: 最新一条 battle_states 的 pro_score === con_score 且 judge_report 非空
 *      （fallback 时会被推断成 current_winner = 'TIE'）
 *
 * 用法：
 *   tsx src/scripts/rejudge-deadlock-topics.ts                 # 串行
 *   tsx src/scripts/rejudge-deadlock-topics.ts -c 5            # 并发 5
 *   tsx src/scripts/rejudge-deadlock-topics.ts --limit 20      # 最多处理 20 个
 *   tsx src/scripts/rejudge-deadlock-topics.ts --dry-run       # 仅列出，不实际重判
 *   tsx src/scripts/rejudge-deadlock-topics.ts --only redis-tie    # 仅处理来源 1
 *   tsx src/scripts/rejudge-deadlock-topics.ts --only redis-empty  # 仅处理来源 2
 *   tsx src/scripts/rejudge-deadlock-topics.ts --only pg-tie       # 仅处理来源 3
 *   JUDGE_DELAY_MS=3000 tsx src/scripts/rejudge-deadlock-topics.ts
 */
import { db } from '../db/client';
import { redisClient } from '../services/redis-client';
import { performJudgement } from '../services/judgement-service';

type Source = 'redis-tie' | 'redis-empty' | 'pg-tie';

interface DeadlockTopic {
  topic_id: string;
  title: string;
  pro_score: number;
  con_score: number;
  source: Source;
}

interface CliOptions {
  limit: number | null;
  delayMs: number;
  concurrency: number;
  dryRun: boolean;
  only: Source | null;
}

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = {
    limit: null,
    delayMs: parseInt(process.env.JUDGE_DELAY_MS || '2000', 10),
    concurrency: parseInt(process.env.JUDGE_CONCURRENCY || '1', 10),
    dryRun: false,
    only: null,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--dry-run') {
      opts.dryRun = true;
    } else if (arg === '--limit' || arg === '-n') {
      const v = parseInt(argv[++i] || '0', 10);
      if (v > 0) opts.limit = v;
    } else if (arg.startsWith('--limit=')) {
      const v = parseInt(arg.split('=')[1] || '0', 10);
      if (v > 0) opts.limit = v;
    } else if (arg === '--concurrency' || arg === '-c') {
      const v = parseInt(argv[++i] || '0', 10);
      if (v > 0) opts.concurrency = v;
    } else if (arg.startsWith('--concurrency=')) {
      const v = parseInt(arg.split('=')[1] || '0', 10);
      if (v > 0) opts.concurrency = v;
    } else if (arg === '--only') {
      const v = (argv[++i] || '') as Source;
      if (v === 'redis-tie' || v === 'redis-empty' || v === 'pg-tie') opts.only = v;
    }
  }
  if (opts.concurrency < 1) opts.concurrency = 1;
  return opts;
}

async function scanRedisTopics(): Promise<Array<{
  topic_id: string;
  pro_score: number;
  con_score: number;
  source: 'redis-tie' | 'redis-empty';
}>> {
  const client = redisClient.getClient();
  const found: Array<{ topic_id: string; pro_score: number; con_score: number; source: 'redis-tie' | 'redis-empty' }> = [];

  let cursor = '0';
  do {
    const [next, keys] = await client.scan(cursor, 'MATCH', 'battle:*:state', 'COUNT', 200);
    cursor = next;
    if (keys.length === 0) continue;

    const values = await client.mget(...keys);
    for (let i = 0; i < keys.length; i++) {
      const raw = values[i];
      if (!raw) continue;
      let state: any;
      try {
        state = JSON.parse(raw);
      } catch {
        continue;
      }
      const m = keys[i].match(/^battle:(.+):state$/);
      if (!m) continue;

      const judge = state?.ai_judge_result;
      const proScore = Number(judge?.pro_score) || 0;
      const conScore = Number(judge?.con_score) || 0;

      if (judge && judge.current_winner === 'TIE') {
        found.push({ topic_id: m[1], pro_score: proScore, con_score: conScore, source: 'redis-tie' });
      } else if (!judge) {
        found.push({ topic_id: m[1], pro_score: proScore, con_score: conScore, source: 'redis-empty' });
      }
    }
  } while (cursor !== '0');

  return found;
}

async function scanPostgresTies(): Promise<Array<{
  topic_id: string;
  title: string;
  pro_score: number;
  con_score: number;
  source: 'pg-tie';
}>> {
  const result = await db.query<{ topic_id: string; title: string; pro_score: number; con_score: number }>(
    `SELECT t.topic_id::text AS topic_id, t.title, b.pro_score, b.con_score
       FROM topics t
       JOIN LATERAL (
         SELECT pro_score, con_score, judge_report
           FROM battle_states
          WHERE topic_id = t.topic_id
          ORDER BY snapshot_at DESC
          LIMIT 1
       ) b ON TRUE
      WHERE t.status = 'active'
        AND b.pro_score = b.con_score
        AND length(coalesce(btrim(b.judge_report), '')) > 0`
  );
  return result.rows.map((r: { topic_id: string; title: string; pro_score: number; con_score: number }) => ({
    ...r,
    source: 'pg-tie' as const,
  }));
}

type CandidateRow = { topic_id: string; pro_score: number; con_score: number; source: Source };

async function joinTitles(rows: CandidateRow[]): Promise<DeadlockTopic[]> {
  if (rows.length === 0) return [];
  const ids = Array.from(new Set(rows.map((r) => r.topic_id)));
  const result = await db.query<{ topic_id: string; title: string }>(
    `SELECT topic_id::text AS topic_id, title
       FROM topics
      WHERE topic_id = ANY($1::uuid[]) AND status = 'active'`,
    [ids]
  );
  const titleMap = new Map<string, string>(
    result.rows.map((r: { topic_id: string; title: string }) => [r.topic_id, r.title] as const)
  );
  const out: DeadlockTopic[] = [];
  for (const r of rows) {
    const title = titleMap.get(r.topic_id);
    if (!title) continue;
    out.push({
      topic_id: r.topic_id,
      title,
      pro_score: r.pro_score,
      con_score: r.con_score,
      source: r.source,
    });
  }
  return out;
}

async function fetchStanceComments(topicId: string, stance: 'pro' | 'con') {
  const result = await db.query(
    `SELECT content, author_type, author_name
       FROM comments
      WHERE topic_id = $1 AND stance = $2
      ORDER BY created_at DESC
      LIMIT 10`,
    [topicId, stance]
  );
  return result.rows;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface RunStats {
  success: number;
  fail: number;
  skipped: number;
  done: number;
  stillTie: number;
  failures: Array<{ topic_id: string; title: string; error: string }>;
}

async function processOne(
  t: DeadlockTopic,
  idx: number,
  total: number,
  workerId: number,
  stats: RunStats,
  delayMs: number
) {
  const tag = `[w${workerId} ${idx + 1}/${total}]`;
  console.log(`${tag} ▶ [${t.source}] ${t.title}  (旧战况 ${t.pro_score}-${t.con_score})`);

  try {
    const [proComments, conComments] = await Promise.all([
      fetchStanceComments(t.topic_id, 'pro'),
      fetchStanceComments(t.topic_id, 'con'),
    ]);

    if (proComments.length === 0 && conComments.length === 0) {
      console.log(`${tag} ⏭️  正反方均无评论，跳过`);
      stats.skipped++;
      stats.done++;
      return;
    }

    const result = await performJudgement({
      topicId: t.topic_id,
      topicTitle: t.title,
      proComments,
      conComments,
    });

    stats.success++;
    stats.done++;
    if (result.current_winner === 'TIE') stats.stillTie++;

    const preview = result.verdict_reason
      ? ` | ${result.verdict_reason.replace(/\s+/g, ' ').slice(0, 60)}${result.verdict_reason.length > 60 ? '…' : ''}`
      : '';
    const winnerIcon =
      result.current_winner === 'AFFIRMATIVE' ? '🔵 正方'
      : result.current_winner === 'NEGATIVE' ? '🔴 反方'
      : '⚪ TIE';
    console.log(
      `${tag} ✅ Pro ${result.pro_score} - Con ${result.con_score} | ${winnerIcon} [${stats.done}/${total} done]${preview}`
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    stats.fail++;
    stats.done++;
    stats.failures.push({ topic_id: t.topic_id, title: t.title, error: message });
    console.error(`${tag} ❌ 失败: ${message} [${stats.done}/${total} done]`);
  }

  if (delayMs > 0) await sleep(delayMs);
}

async function runWithConcurrency(
  candidates: DeadlockTopic[],
  concurrency: number,
  delayMs: number
): Promise<RunStats> {
  const stats: RunStats = { success: 0, fail: 0, skipped: 0, done: 0, stillTie: 0, failures: [] };
  let cursor = 0;
  const total = candidates.length;

  const worker = async (workerId: number) => {
    while (true) {
      const idx = cursor++;
      if (idx >= total) return;
      await processOne(candidates[idx], idx, total, workerId, stats, delayMs);
    }
  };

  const workers = Array.from({ length: concurrency }, (_, i) => worker(i + 1));
  await Promise.all(workers);
  return stats;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🔎 扫描所有可能渲染为 DEADLOCK 的话题...`);
  console.log(
    `   并发: ${opts.concurrency}  间隔: ${opts.delayMs}ms${opts.limit ? `  上限: ${opts.limit}` : ''}${opts.dryRun ? '  DRY-RUN' : ''}${opts.only ? `  仅来源: ${opts.only}` : ''}`
  );
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const [redisRows, pgRows] = await Promise.all([
    opts.only && opts.only !== 'redis-tie' && opts.only !== 'redis-empty' ? Promise.resolve([]) : scanRedisTopics(),
    opts.only && opts.only !== 'pg-tie' ? Promise.resolve([]) : scanPostgresTies(),
  ]);

  const filteredRedis = opts.only
    ? redisRows.filter((r) => r.source === opts.only)
    : redisRows;
  const filteredPg = opts.only && opts.only !== 'pg-tie' ? [] : pgRows;

  console.log('\n🧊 候选分布:');
  console.log(`   • Redis TIE       : ${filteredRedis.filter((r) => r.source === 'redis-tie').length}`);
  console.log(`   • Redis 缺 judge  : ${filteredRedis.filter((r) => r.source === 'redis-empty').length}`);
  console.log(`   • PG 最新平分     : ${filteredPg.length}`);

  // 按 topic_id 去重，优先级 redis-tie > pg-tie > redis-empty
  const priority: Record<Source, number> = { 'redis-tie': 3, 'pg-tie': 2, 'redis-empty': 1 };
  const merged = new Map<string, { topic_id: string; pro_score: number; con_score: number; source: Source }>();
  for (const r of [...filteredRedis, ...filteredPg]) {
    const cur = merged.get(r.topic_id);
    if (!cur || priority[r.source] > priority[cur.source]) merged.set(r.topic_id, r);
  }

  let candidates = await joinTitles(Array.from(merged.values()));
  const droppedInactive = merged.size - candidates.length;
  if (droppedInactive > 0) {
    console.log(`   （其中 ${droppedInactive} 个话题已不在 active，跳过）`);
  }

  if (opts.limit && candidates.length > opts.limit) {
    candidates = candidates.slice(0, opts.limit);
  }

  if (candidates.length === 0) {
    console.log('\n✅ 没有需要重刷的话题，提前退出');
    await redisClient.close();
    process.exit(0);
  }

  if (opts.dryRun) {
    console.log(`\n📋 DRY-RUN 模式，仅列出 ${candidates.length} 个待重判话题：`);
    for (const t of candidates) {
      console.log(`   • [${t.source}] ${t.title}  (${t.pro_score}-${t.con_score})  [${t.topic_id}]`);
    }
    await redisClient.close();
    process.exit(0);
  }

  console.log(`\n📋 待重判 ${candidates.length} 个话题（并发 ${opts.concurrency}）`);

  const startedAt = Date.now();
  const stats = await runWithConcurrency(candidates, opts.concurrency, opts.delayMs);
  const elapsedSec = ((Date.now() - startedAt) / 1000).toFixed(1);

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(
    `🎉 完成：成功 ${stats.success} (其中仍判平局 ${stats.stillTie}) | 跳过 ${stats.skipped} | 失败 ${stats.fail} | 共 ${candidates.length} | 耗时 ${elapsedSec}s`
  );
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (stats.failures.length > 0) {
    console.log('\n失败详情：');
    for (const f of stats.failures) {
      console.log(`   ❌ ${f.title} (${f.topic_id})`);
      console.log(`      ${f.error}`);
    }
  }

  await redisClient.close();
  process.exit(stats.fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('❌ 脚本异常退出:', err);
  process.exit(1);
});
