import { Router } from 'express';
import { db } from '../db/client';
import { redisClient } from '../services/redis-client';

const router = Router();

// 获取活跃话题列表
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const params: any[] = [];
    let whereClause = `WHERE status = 'active'`;

    if (category && category !== 'all') {
      params.push(category);
      whereClause += ` AND category = $${params.length}`;
    }

    const result = await db.query(
      `SELECT topic_id, title, pro_stance, con_stance, heat_score, category, created_at 
       FROM topics 
       ${whereClause}
       ORDER BY created_at DESC 
       LIMIT 10`,
      params
    );

    const topics = await Promise.all(
      result.rows.map(async (topic) => {
        const battleState = await redisClient.getBattleState(topic.topic_id);
        return {
          ...topic,
          battle_state: battleState || {
            pro_count: 0,
            con_count: 0,
            pro_votes: 0,
            con_votes: 0,
          },
        };
      })
    );

    res.json({ success: true, data: topics });
  } catch (error) {
    console.error('Get topics error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch topics' });
  }
});

// 获取分类及各分类话题数
router.get('/categories', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT category, COUNT(*) as count 
       FROM topics 
       WHERE status = 'active' 
       GROUP BY category 
       ORDER BY count DESC`
    );
    const total = result.rows.reduce((sum, r) => sum + parseInt(r.count), 0);
    res.json({ success: true, data: { total, categories: result.rows } });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch categories' });
  }
});

// 获取话题详情
router.get('/:topicId', async (req, res) => {
  try {
    const { topicId } = req.params;

    const result = await db.query(
      `SELECT topic_id, title, pro_stance, con_stance, heat_score, created_at 
       FROM topics 
       WHERE topic_id = $1`,
      [topicId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Topic not found' });
    }

    const topic = result.rows[0];
    const battleState = await redisClient.getBattleState(topicId);

    res.json({
      success: true,
      data: {
        ...topic,
        battle_state: battleState,
      },
    });
  } catch (error) {
    console.error('Get topic detail error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch topic' });
  }
});

// 获取话题的评论列表
router.get('/:topicId/comments', async (req, res) => {
  try {
    const { topicId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const result = await db.query(
      `SELECT comment_id, author_type, author_id, author_name, content, stance, reply_to, created_at
       FROM comments 
       WHERE topic_id = $1 
       ORDER BY created_at ASC 
       LIMIT $2 OFFSET $3`,
      [topicId, Number(limit), Number(offset)]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch comments' });
  }
});

export default router;
