/**
 * 为「缺少 AI 裁决」的话题补刷一次 performJudgement。
 *
 * 定义：缺少裁决 = 话题至少有一条 pro 或 con 评论，且
 *   battle_states 表中不存在 judge_report 非空的记录。
 *
 * 用法：
 *   tsx src/scripts/judge-missing-topics.ts                  # 仅补缺失（串行）
 *   tsx src/scripts/judge-missing-topics.ts -c 5             # 并发 5 个 worker
 *   tsx src/scripts/judge-missing-topics.ts --force          # 强制全部重刷
 *   tsx src/scripts/judge-missing-topics.ts --limit 10       # 最多处理 10 个
 *   JUDGE_DELAY_MS=3000 tsx src/scripts/judge-missing-topics.ts   # worker 内每次调用后的间隔
 */
import { db } from '../db/client';
import { performJudgement } from '../services/judgement-service';

interface CandidateTopic {
  topic_id: string;
  title: string;
  pro_count: number;
  con_count: number;
}

interface CliOptions {
  force: boolean;
  limit: number | null;
  delayMs: number;
  concurrency: number;
}

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = {
    force: false,
    limit: null,
    delayMs: parseInt(process.env.JUDGE_DELAY_MS || '2000', 10),
    concurrency: parseInt(process.env.JUDGE_CONCURRENCY || '1', 10),
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--force' || arg === '-f') {
      opts.force = true;
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
    }
  }
  if (opts.concurrency < 1) opts.concurrency = 1;
  return opts;
}

async function findCandidates(force: boolean): Promise<CandidateTopic[]> {
  const havingMissingJudge = force
    ? ''
    : `AND NOT EXISTS (
         SELECT 1 FROM battle_states b
          WHERE b.topic_id = t.topic_id
            AND b.judge_report IS NOT NULL
            AND length(btrim(b.judge_report)) > 0
       )`;

  const result = await db.query<CandidateTopic>(
    `SELECT t.topic_id,
            t.title,
            COUNT(*) FILTER (WHERE c.stance = 'pro')::int AS pro_count,
            COUNT(*) FILTER (WHERE c.stance = 'con')::int AS con_count
       FROM topics t
       JOIN comments c ON c.topic_id = t.topic_id
      WHERE t.status = 'active'
        ${havingMissingJudge}
      GROUP BY t.topic_id, t.title, t.created_at
     HAVING COUNT(*) FILTER (WHERE c.stance IN ('pro', 'con')) > 0
      ORDER BY t.created_at DESC`
  );
  return result.rows;
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
  done: number;
  failures: Array<{ topic_id: string; title: string; error: string }>;
}

async function processOne(
  t: CandidateTopic,
  idx: number,
  total: number,
  workerId: number,
  stats: RunStats,
  delayMs: number
) {
  const tag = `[w${workerId} ${idx + 1}/${total}]`;
  console.log(`${tag} ▶ ${t.title}  (pro=${t.pro_count} con=${t.con_count})`);

  try {
    const [proComments, conComments] = await Promise.all([
      fetchStanceComments(t.topic_id, 'pro'),
      fetchStanceComments(t.topic_id, 'con'),
    ]);

    if (proComments.length === 0 && conComments.length === 0) {
      console.log(`${tag} ⏭️  正反方均无评论，跳过`);
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
    const preview = result.verdict_reason
      ? ` | ${result.verdict_reason.replace(/\s+/g, ' ').slice(0, 60)}${result.verdict_reason.length > 60 ? '…' : ''}`
      : '';
    console.log(
      `${tag} ✅ Pro ${result.pro_score} - Con ${result.con_score} | ${result.current_winner} [${stats.done}/${total} done]${preview}`
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
  candidates: CandidateTopic[],
  concurrency: number,
  delayMs: number
): Promise<RunStats> {
  const stats: RunStats = { success: 0, fail: 0, done: 0, failures: [] };
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
  console.log(`🔎 扫描${opts.force ? '所有活跃话题（强制重刷）' : '缺少 AI 裁决的话题'}...`);
  console.log(
    `   并发: ${opts.concurrency}  间隔: ${opts.delayMs}ms${opts.limit ? `  上限: ${opts.limit}` : ''}`
  );
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  let candidates = await findCandidates(opts.force);

  if (opts.limit && candidates.length > opts.limit) {
    candidates = candidates.slice(0, opts.limit);
  }

  if (candidates.length === 0) {
    console.log('\n✅ 没有需要补刷的话题，提前退出');
    process.exit(0);
  }

  console.log(`\n📋 待处理 ${candidates.length} 个话题（并发 ${opts.concurrency}）`);

  const startedAt = Date.now();
  const stats = await runWithConcurrency(candidates, opts.concurrency, opts.delayMs);
  const elapsedSec = ((Date.now() - startedAt) / 1000).toFixed(1);

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(
    `🎉 完成：成功 ${stats.success} | 失败 ${stats.fail} | 共 ${candidates.length} | 耗时 ${elapsedSec}s`
  );
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (stats.failures.length > 0) {
    console.log('\n失败详情：');
    for (const f of stats.failures) {
      console.log(`   ❌ ${f.title} (${f.topic_id})`);
      console.log(`      ${f.error}`);
    }
  }

  process.exit(stats.fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('❌ 脚本异常退出:', err);
  process.exit(1);
});
