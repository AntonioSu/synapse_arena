/**
 * 自动巡检服务：每 N 分钟扫描数据库，为三类缺失数据补齐：
 *   1. 缺失的对话      —— 活跃话题无任何评论 → 触发冷启动
 *   2. 缺失的战况总结  —— 有评论但 battle_states 无 judge_report → 触发 AI 裁决
 *   3. 缺失的金句弹幕  —— 有评论但 topic_quotes 无 is_featured → 触发金句提炼
 *
 * 通过环境变量调节：
 *   AUTO_MAINTENANCE_ENABLED        (默认 '1')
 *   AUTO_MAINTENANCE_CRON           (默认 '*\/30 * * * *')
 *   AUTO_MAINTENANCE_RUN_ON_STARTUP (默认 '0'，设为 '1' 则启动后立刻跑一次)
 *   AUTO_COLD_START_ROUNDS          (默认 10)
 *   AUTO_COLD_START_CONCURRENCY     (默认 2)
 *   AUTO_JUDGEMENT_CONCURRENCY      (默认 5)
 *   AUTO_QUOTE_CONCURRENCY          (默认 3)
 *   AUTO_QUOTE_MIN_COMMENTS         (默认 3)
 */
import cron, { type ScheduledTask } from 'node-cron';
import { db } from '../db/client';
import { aiService } from './llm-service';
import { redisClient } from './redis-client';
import { coldStartService } from './cold-start';
import { performJudgement } from './judgement-service';

function intEnv(name: string, fallback: number): number {
  const v = parseInt(process.env[name] || '', 10);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

const ENABLED = (process.env.AUTO_MAINTENANCE_ENABLED || '1') !== '0';
const CRON_EXPRESSION = process.env.AUTO_MAINTENANCE_CRON || '*/30 * * * *';
const RUN_ON_STARTUP = (process.env.AUTO_MAINTENANCE_RUN_ON_STARTUP || '0') === '1';
const COLD_START_ROUNDS = intEnv('AUTO_COLD_START_ROUNDS', 10);
const COLD_START_CONCURRENCY = intEnv('AUTO_COLD_START_CONCURRENCY', 2);
const JUDGEMENT_CONCURRENCY = intEnv('AUTO_JUDGEMENT_CONCURRENCY', 5);
const QUOTE_CONCURRENCY = intEnv('AUTO_QUOTE_CONCURRENCY', 3);
const QUOTE_MIN_COMMENTS = intEnv('AUTO_QUOTE_MIN_COMMENTS', 3);

interface PhaseStats {
  processed: number;
  failed: number;
}

interface QuoteStats extends PhaseStats {
  totalQuotes: number;
}

interface MaintenanceStats {
  dialogs: PhaseStats;
  judgements: PhaseStats;
  quotes: QuoteStats;
  elapsedMs: number;
}

async function runWorkerPool<T>(
  items: T[],
  concurrency: number,
  worker: (item: T, workerId: number) => Promise<void>
): Promise<void> {
  let cursor = 0;
  const total = items.length;
  const run = async (workerId: number) => {
    while (true) {
      const idx = cursor++;
      if (idx >= total) return;
      await worker(items[idx], workerId);
    }
  };
  const handles = Array.from({ length: Math.min(concurrency, total) }, (_, i) => run(i + 1));
  await Promise.all(handles);
}

class AutoMaintenanceService {
  private isRunning = false;
  private cronTask: ScheduledTask | null = null;
  private lastRunAt: Date | null = null;
  private lastStats: MaintenanceStats | null = null;

  getStatus() {
    return {
      isRunning: this.isRunning,
      lastRunAt: this.lastRunAt,
      lastStats: this.lastStats,
      cronExpression: CRON_EXPRESSION,
      enabled: ENABLED,
    };
  }

  async runOnce(): Promise<MaintenanceStats | null> {
    if (this.isRunning) {
      console.log('⏳ Auto-maintenance still running, skipping this tick');
      return null;
    }
    this.isRunning = true;
    const startedAt = Date.now();

    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🤖 Auto-maintenance start  ${new Date().toISOString()}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const stats: MaintenanceStats = {
      dialogs: { processed: 0, failed: 0 },
      judgements: { processed: 0, failed: 0 },
      quotes: { processed: 0, failed: 0, totalQuotes: 0 },
      elapsedMs: 0,
    };

    try {
      stats.dialogs = await this.fillMissingDialogs();
    } catch (err) {
      console.error('❌ dialogs phase fatal:', err);
    }
    try {
      stats.judgements = await this.fillMissingJudgements();
    } catch (err) {
      console.error('❌ judgements phase fatal:', err);
    }
    try {
      stats.quotes = await this.fillMissingQuotes();
    } catch (err) {
      console.error('❌ quotes phase fatal:', err);
    }

    stats.elapsedMs = Date.now() - startedAt;
    this.isRunning = false;
    this.lastRunAt = new Date();
    this.lastStats = stats;

    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🤖 Auto-maintenance done in ${(stats.elapsedMs / 1000).toFixed(1)}s`);
    console.log(
      `   📦 dialogs    ok=${stats.dialogs.processed} fail=${stats.dialogs.failed}`
    );
    console.log(
      `   ⚖️  judgements ok=${stats.judgements.processed} fail=${stats.judgements.failed}`
    );
    console.log(
      `   💬 quotes     ok=${stats.quotes.processed} fail=${stats.quotes.failed} total=${stats.quotes.totalQuotes}`
    );
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    return stats;
  }

  /* ────────────────── 阶段 1：缺失的对话（冷启动） ────────────────── */
  private async fillMissingDialogs(): Promise<PhaseStats> {
    const r = await db.query<{ topic_id: string; title: string }>(
      `SELECT t.topic_id, t.title
         FROM topics t
        WHERE t.status = 'active'
          AND NOT EXISTS (
            SELECT 1 FROM comments c WHERE c.topic_id = t.topic_id
          )
        ORDER BY t.created_at DESC`
    );
    const topics = r.rows;
    if (topics.length === 0) {
      console.log('📦 dialogs:    无缺失');
      return { processed: 0, failed: 0 };
    }

    console.log(
      `📦 dialogs:    ${topics.length} 个话题无评论 → 冷启动 (rounds=${COLD_START_ROUNDS}, c=${COLD_START_CONCURRENCY})`
    );

    let processed = 0;
    let failed = 0;

    await runWorkerPool(topics, COLD_START_CONCURRENCY, async (t, workerId) => {
      const tag = `[w${workerId} dialogs ${t.topic_id.slice(0, 8)}]`;
      try {
        await coldStartService.generateColdStartBattle(t.topic_id, COLD_START_ROUNDS);
        processed++;
        console.log(`${tag} ✅ ${t.title.slice(0, 30)}`);
      } catch (err) {
        failed++;
        console.error(`${tag} ❌`, err instanceof Error ? err.message : err);
      }
    });

    return { processed, failed };
  }

  /* ────────────────── 阶段 2：缺失的战况总结（AI 裁决） ────────────────── */
  private async fillMissingJudgements(): Promise<PhaseStats> {
    const r = await db.query<{ topic_id: string; title: string }>(
      `SELECT t.topic_id, t.title
         FROM topics t
         JOIN comments c ON c.topic_id = t.topic_id
        WHERE t.status = 'active'
          AND NOT EXISTS (
            SELECT 1 FROM battle_states b
             WHERE b.topic_id = t.topic_id
               AND b.judge_report IS NOT NULL
               AND length(btrim(b.judge_report)) > 0
          )
        GROUP BY t.topic_id, t.title, t.created_at
       HAVING COUNT(*) FILTER (WHERE c.stance IN ('pro', 'con')) > 0
        ORDER BY t.created_at DESC`
    );
    const topics = r.rows;
    if (topics.length === 0) {
      console.log('⚖️  judgements: 无缺失');
      return { processed: 0, failed: 0 };
    }

    console.log(
      `⚖️  judgements: ${topics.length} 个话题缺裁决 → performJudgement (c=${JUDGEMENT_CONCURRENCY})`
    );

    // 懒加载 io，避免与 index.ts 形成静态循环依赖时的初始化问题
    const { io } = await import('../index');

    let processed = 0;
    let failed = 0;

    await runWorkerPool(topics, JUDGEMENT_CONCURRENCY, async (t, workerId) => {
      const tag = `[w${workerId} judge ${t.topic_id.slice(0, 8)}]`;
      try {
        const [pro, con] = await Promise.all([
          db.query(
            `SELECT content, author_type, author_name FROM comments
              WHERE topic_id = $1 AND stance = 'pro'
              ORDER BY created_at DESC LIMIT 10`,
            [t.topic_id]
          ),
          db.query(
            `SELECT content, author_type, author_name FROM comments
              WHERE topic_id = $1 AND stance = 'con'
              ORDER BY created_at DESC LIMIT 10`,
            [t.topic_id]
          ),
        ]);

        if (pro.rows.length === 0 && con.rows.length === 0) {
          console.log(`${tag} ⏭️  无正反方评论，跳过`);
          return;
        }

        const result = await performJudgement({
          topicId: t.topic_id,
          topicTitle: t.title,
          proComments: pro.rows,
          conComments: con.rows,
          broadcast: (judgeResult) => {
            io.to(`battle:${t.topic_id}`).emit('battle_update', {
              pro_score: judgeResult.pro_score,
              con_score: judgeResult.con_score,
              ai_judge_result: judgeResult,
            });
          },
        });
        processed++;
        console.log(
          `${tag} ✅ Pro ${result.pro_score} - Con ${result.con_score} | ${result.current_winner}`
        );
      } catch (err) {
        failed++;
        console.error(`${tag} ❌`, err instanceof Error ? err.message : err);
      }
    });

    return { processed, failed };
  }

  /* ────────────────── 阶段 3：缺失的金句弹幕 ────────────────── */
  private async fillMissingQuotes(): Promise<QuoteStats> {
    const r = await db.query<{
      topic_id: string;
      title: string;
      pro_stance: string;
      con_stance: string;
      cnt: number;
    }>(
      `SELECT t.topic_id, t.title, t.pro_stance, t.con_stance, COUNT(c.comment_id)::int AS cnt
         FROM topics t
         JOIN comments c ON c.topic_id = t.topic_id
        WHERE t.status = 'active'
          AND NOT EXISTS (
            SELECT 1 FROM topic_quotes tq
             WHERE tq.topic_id = t.topic_id AND tq.is_featured = true
          )
        GROUP BY t.topic_id, t.title, t.pro_stance, t.con_stance
       HAVING COUNT(c.comment_id) >= $1
        ORDER BY cnt DESC`,
      [QUOTE_MIN_COMMENTS]
    );
    const topics = r.rows;
    if (topics.length === 0) {
      console.log('💬 quotes:     无缺失');
      return { processed: 0, failed: 0, totalQuotes: 0 };
    }

    console.log(
      `💬 quotes:     ${topics.length} 个话题缺金句 → extractQuotes (c=${QUOTE_CONCURRENCY}, min=${QUOTE_MIN_COMMENTS})`
    );

    let processed = 0;
    let failed = 0;
    let totalQuotes = 0;

    await runWorkerPool(topics, QUOTE_CONCURRENCY, async (t, workerId) => {
      const tag = `[w${workerId} quotes ${t.topic_id.slice(0, 8)}]`;
      try {
        const cR = await db.query(
          `SELECT content, stance, author_name, author_type FROM comments
            WHERE topic_id = $1 ORDER BY created_at DESC LIMIT 60`,
          [t.topic_id]
        );

        const quotes = await aiService.extractQuotes({
          topicTitle: t.title,
          proStance: t.pro_stance,
          conStance: t.con_stance,
          comments: cR.rows,
        });

        if (quotes.length === 0) {
          failed++;
          console.warn(`${tag} ⚠️  LLM 未返回有效金句`);
          return;
        }

        await this.saveQuotes(t.topic_id, quotes);
        await redisClient.setFeaturedQuotes(t.topic_id, quotes, 600);
        processed++;
        totalQuotes += quotes.length;
        console.log(`${tag} ✅ saved ${quotes.length} quotes`);
      } catch (err) {
        failed++;
        console.error(`${tag} ❌`, err instanceof Error ? err.message : err);
      }
    });

    return { processed, failed, totalQuotes };
  }

  private async saveQuotes(
    topicId: string,
    quotes: Array<{ content: string; stance: 'pro' | 'con' }>
  ): Promise<void> {
    if (quotes.length === 0) return;
    await db.query(`UPDATE topic_quotes SET is_featured = false WHERE topic_id = $1`, [topicId]);
    const placeholders: string[] = [];
    const params: any[] = [topicId];
    quotes.forEach((q, i) => {
      placeholders.push(`($1, $${i * 2 + 2}, $${i * 2 + 3}, true, 'llm')`);
      params.push(q.content, q.stance);
    });
    await db.query(
      `INSERT INTO topic_quotes (topic_id, content, stance, is_featured, generated_by)
       VALUES ${placeholders.join(', ')}`,
      params
    );
  }

  /* ────────────────── Cron 调度 ────────────────── */
  startCronJob(): void {
    if (!ENABLED) {
      console.log('⏸️  Auto-maintenance disabled by AUTO_MAINTENANCE_ENABLED=0');
      return;
    }
    if (this.cronTask) {
      console.log('⏰ Auto-maintenance cron already started');
      return;
    }

    this.cronTask = cron.schedule(CRON_EXPRESSION, () => {
      console.log(`⏰ Cron tick: auto-maintenance @ ${new Date().toISOString()}`);
      this.runOnce().catch((err) => console.error('Cron tick failed:', err));
    });

    console.log(`✅ Auto-maintenance cron started (${CRON_EXPRESSION})`);

    if (RUN_ON_STARTUP) {
      setTimeout(() => {
        console.log('🚀 Initial auto-maintenance run on startup');
        this.runOnce().catch((err) => console.error('Startup run failed:', err));
      }, 5000);
    }
  }

  stopCronJob(): void {
    if (this.cronTask) {
      this.cronTask.stop();
      this.cronTask = null;
      console.log('🛑 Auto-maintenance cron stopped');
    }
  }
}

export const autoMaintenance = new AutoMaintenanceService();
