import { Router } from 'express';
import { db } from '../db/client';
import { redisClient } from '../services/redis-client';
import { aiService } from '../services/minimax-service';
import { asyncHandler } from '../middleware/async-handler';

const router = Router();

const ongoingExtractions = new Set<string>();

interface FeaturedQuoteRow { content: string; stance: 'pro' | 'con' }

async function getFeaturedQuotesFromDb(topicId: string): Promise<FeaturedQuoteRow[]> {
  const r = await db.query(
    `SELECT content, stance FROM topic_quotes
     WHERE topic_id = $1 AND is_featured = true
     ORDER BY created_at ASC`,
    [topicId]
  );
  return r.rows.map((row: any) => ({ content: row.content, stance: row.stance }));
}

async function saveFeaturedQuotesToDb(topicId: string, quotes: FeaturedQuoteRow[]): Promise<void> {
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

async function triggerQuoteExtraction(topicId: string): Promise<void> {
  if (ongoingExtractions.has(topicId)) return;
  ongoingExtractions.add(topicId);
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
    const quotes = await aiService.extractQuotes({
      topicTitle: topic.title,
      proStance: topic.pro_stance,
      conStance: topic.con_stance,
      comments: commentsR.rows,
    });

    if (quotes.length > 0) {
      await saveFeaturedQuotesToDb(topicId, quotes);
      await redisClient.setFeaturedQuotes(topicId, quotes, 600);
      console.log(`✅ 金句已入库 topic=${topicId} count=${quotes.length}`);
    } else {
      console.warn(`⚠️  LLM 未返回有效金句 topic=${topicId}`);
    }
  } catch (err) {
    console.error(`❌ 金句提炼失败 topic=${topicId}:`, err);
  } finally {
    ongoingExtractions.delete(topicId);
  }
}

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

  const topics = await Promise.all(
    result.rows.map(async (topic: any) => {
      let battleState = await redisClient.getBattleState(topic.topic_id);

      if (!battleState || (battleState.pro_count === 0 && battleState.con_count === 0) || !battleState.ai_judge_result) {
        const [countsResult, latestJudge] = await Promise.all([
          db.query(
            `SELECT stance, COUNT(*) as cnt FROM comments WHERE topic_id = $1 GROUP BY stance`,
            [topic.topic_id]
          ),
          db.query(
            `SELECT pro_score, con_score, judge_report FROM battle_states
             WHERE topic_id = $1 ORDER BY snapshot_at DESC LIMIT 1`,
            [topic.topic_id]
          ),
        ]);

        const counts: Record<string, number> = {};
        for (const row of countsResult.rows) counts[row.stance] = parseInt(row.cnt);

        if ((counts.pro || 0) + (counts.con || 0) > 0) {
          const judge = latestJudge.rows[0];
          let aiJudgeResult = battleState?.ai_judge_result;
          if (!aiJudgeResult && judge?.judge_report) {
            const proScore = judge.pro_score || 0;
            const conScore = judge.con_score || 0;
            aiJudgeResult = {
              pro_score: proScore,
              con_score: conScore,
              current_winner: proScore > conScore ? 'AFFIRMATIVE' : proScore < conScore ? 'NEGATIVE' : 'TIE',
              verdict_reason: judge.judge_report,
            };
          }

          const fallback = {
            pro_count: counts.pro || 0,
            con_count: counts.con || 0,
            pro_votes: battleState?.pro_votes || 0,
            con_votes: battleState?.con_votes || 0,
            human_participants: battleState?.human_participants || 0,
            ai_judge_result: aiJudgeResult,
          };
          await redisClient.setBattleState(topic.topic_id, fallback);
          battleState = fallback;
        }
      }

      return {
        ...topic,
        battle_state: battleState || { pro_count: 0, con_count: 0, pro_votes: 0, con_votes: 0 },
      };
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

  const battleState = await redisClient.getBattleState(topicId);
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
