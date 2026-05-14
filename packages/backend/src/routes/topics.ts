import { Router } from 'express';
import { db } from '../db/client';
import { redisClient } from '../services/redis-client';
import {
  extractAndSaveFeaturedQuotes,
  getFeaturedQuotesFromDb,
} from '../services/quotes-service';
import { asyncHandler } from '../middleware/async-handler';

const router = Router();

const QUOTE_LOCK_TTL_SECONDS = 180;
const quoteLockKey = (topicId: string) => `lock:topic:${topicId}:quote-extract`;

async function triggerQuoteExtraction(topicId: string): Promise<void> {
  // 跨进程的 SETNX 锁，避免多实例 / HMR 场景下同一话题并发触发昂贵的 LLM extractQuotes。
  const lockKey = quoteLockKey(topicId);
  const acquired = await redisClient.acquireLock(lockKey, QUOTE_LOCK_TTL_SECONDS);
  if (!acquired) {
    console.log(`⏳ Topic ${topicId} 金句提炼已在进行，跳过本次触发`);
    return;
  }
  try {
    const [topicR, commentsR] = await Promise.all([
      db.query(
        `SELECT title, pro_stance, con_stance FROM topics WHERE topic_id = $1`,
        [topicId]
      ),
      db.query(
        `SELECT content, stance, author_name, author_type
         FROM comments WHERE topic_id = $1
         ORDER BY created_at DESC LIMIT 60`,
        [topicId]
      ),
    ]);
    if (topicR.rows.length === 0) return;
    if (commentsR.rows.length < 3) {
      console.log(`⏭️  Topic ${topicId} 评论数 < 3，跳过金句提炼`);
      return;
    }

    const topic = topicR.rows[0];
    console.log(`🔍 开始提炼金句 topic=${topicId} comments=${commentsR.rows.length}`);
    const quotes = await extractAndSaveFeaturedQuotes({
      topicId,
      topicTitle: topic.title,
      proStance: topic.pro_stance,
      conStance: topic.con_stance,
      comments: commentsR.rows,
    });

    if (quotes.length > 0) {
      console.log(`✅ 金句已入库 topic=${topicId} count=${quotes.length}`);
    } else {
      console.warn(`⚠️  LLM 未返回有效金句 topic=${topicId}`);
    }
  } catch (err) {
    console.error(`❌ 金句提炼失败 topic=${topicId}:`, err);
  } finally {
    await redisClient.releaseLock(lockKey).catch(() => {});
  }
}

// 列表/详情接口在缓存缺失时给前端的最小 battle_state（不含 ai_judge_result，由调用处按需补）。
const EMPTY_BATTLE_STATE = {
  pro_count: 0,
  con_count: 0,
  pro_votes: 0,
  con_votes: 0,
  human_participants: 0,
} as const;

router.get('/categories', asyncHandler(async (req, res) => {
  const result = await db.query(
    `SELECT category, COUNT(*) as count 
     FROM topics WHERE status = 'active' 
     GROUP BY category ORDER BY count DESC`
  );
  const total = result.rows.reduce((sum: number, r: any) => sum + parseInt(r.count), 0);
  res.json({ success: true, data: { total, categories: result.rows } });
}));

router.get('/', asyncHandler(async (req, res) => {
  const { category } = req.query;
  const params: any[] = [];
  let whereClause = `WHERE status = 'active'`;

  if (category && category !== 'all') {
    params.push(category);
    whereClause += ` AND category = $${params.length}`;
  }

  const result = await db.query(
    `SELECT topic_id, title, pro_stance, con_stance, heat_score, category, zhihu_link, created_at 
     FROM topics ${whereClause} ORDER BY heat_score DESC, created_at DESC LIMIT 50`,
    params
  );

  const topicIds: string[] = result.rows.map((t: any) => t.topic_id);

  // 一次性拿 Redis 战况 + 一次性拿评论计数 / 最新裁决，避免 N+1 查询。
  const cachedStates = await Promise.all(topicIds.map((id) => redisClient.getBattleState(id)));
  const cachedMap = new Map<string, any>();
  topicIds.forEach((id, i) => cachedMap.set(id, cachedStates[i]));

  let countsByTopic = new Map<string, { pro: number; con: number }>();
  let latestJudgeByTopic = new Map<string, { pro_score: number; con_score: number; judge_report: string | null }>();

  if (topicIds.length > 0) {
    const [countsRes, judgeRes] = await Promise.all([
      db.query<{ topic_id: string; stance: string; cnt: string }>(
        `SELECT topic_id, stance, COUNT(*)::int AS cnt FROM comments
          WHERE topic_id = ANY($1::uuid[]) GROUP BY topic_id, stance`,
        [topicIds]
      ),
      db.query<{ topic_id: string; pro_score: number; con_score: number; judge_report: string | null }>(
        `SELECT DISTINCT ON (topic_id) topic_id, pro_score, con_score, judge_report
           FROM battle_states
          WHERE topic_id = ANY($1::uuid[])
          ORDER BY topic_id, snapshot_at DESC`,
        [topicIds]
      ),
    ]);
    for (const row of countsRes.rows) {
      const cur = countsByTopic.get(row.topic_id) || { pro: 0, con: 0 };
      if (row.stance === 'pro') cur.pro = Number(row.cnt);
      else if (row.stance === 'con') cur.con = Number(row.cnt);
      countsByTopic.set(row.topic_id, cur);
    }
    for (const row of judgeRes.rows) {
      latestJudgeByTopic.set(row.topic_id, row);
    }
  }

  const topics = await Promise.all(
    result.rows.map(async (topic: any) => {
      const cached = cachedMap.get(topic.topic_id);
      const counts = countsByTopic.get(topic.topic_id) || { pro: 0, con: 0 };
      const judge = latestJudgeByTopic.get(topic.topic_id);

      // 重新构造一份权威 battle_state：
      //  - count 永远以 comments 表为准；
      //  - 投票 / 人类参与数沿用缓存值；
      //  - ai_judge_result 优先用缓存的（带完整 summary），否则从 PG 回填一个最小版本。
      let aiJudgeResult = cached?.ai_judge_result;
      if (!aiJudgeResult && judge?.judge_report) {
        const proScore = judge.pro_score || 0;
        const conScore = judge.con_score || 0;
        const inferredWinner =
          proScore > conScore ? 'AFFIRMATIVE'
          : proScore < conScore ? 'NEGATIVE'
          : undefined;
        aiJudgeResult = {
          pro_score: proScore,
          con_score: conScore,
          ...(inferredWinner ? { current_winner: inferredWinner } : {}),
          verdict_reason: judge.judge_report,
        };
      }

      const battleState = {
        ...EMPTY_BATTLE_STATE,
        pro_votes: cached?.pro_votes || 0,
        con_votes: cached?.con_votes || 0,
        human_participants: cached?.human_participants || 0,
        pro_count: counts.pro,
        con_count: counts.con,
        ai_judge_result: aiJudgeResult,
      };

      // 顺手把权威值写回缓存，让下一次请求直接命中。
      if (counts.pro + counts.con > 0 || aiJudgeResult) {
        await redisClient.setBattleState(topic.topic_id, battleState);
      }

      return { ...topic, battle_state: battleState };
    })
  );

  res.json({ success: true, data: topics });
}));

router.get('/:topicId', asyncHandler(async (req, res) => {
  const { topicId } = req.params;
  const result = await db.query(
    `SELECT topic_id, title, pro_stance, con_stance, heat_score, zhihu_link, created_at 
     FROM topics WHERE topic_id = $1`,
    [topicId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Topic not found' });
  }

  const battleState = (await redisClient.getBattleState(topicId)) || { ...EMPTY_BATTLE_STATE };
  res.json({ success: true, data: { ...result.rows[0], battle_state: battleState } });
}));

router.get('/:topicId/quotes', asyncHandler(async (req, res) => {
  const { topicId } = req.params;

  const dbQuotes = await getFeaturedQuotesFromDb(topicId);

  if (dbQuotes.length === 0) {
    triggerQuoteExtraction(topicId).catch(() => {});
    return res.json({ success: true, data: [], pending: true });
  }

  res.json({ success: true, data: dbQuotes });
}));

router.post('/:topicId/quotes/refresh', asyncHandler(async (req, res) => {
  const { topicId } = req.params;
  triggerQuoteExtraction(topicId).catch(() => {});
  res.json({ success: true, data: { topic_id: topicId, refresh_triggered: true } });
}));

router.get('/:topicId/comments', asyncHandler(async (req, res) => {
  const { topicId } = req.params;
  const { limit = 50, offset = 0 } = req.query;

  const result = await db.query(
    `SELECT comment_id, author_type, author_id, author_name, content, stance, reply_to, created_at
     FROM comments WHERE topic_id = $1 ORDER BY created_at ASC LIMIT $2 OFFSET $3`,
    [topicId, Number(limit), Number(offset)]
  );

  res.json({ success: true, data: result.rows });
}));

export default router;
