import { Router } from 'express';
import { db } from '../db/client';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { aiService } from '../services/minimax-service';
import { butterflyEffect } from '../services/butterfly-effect';
import { io } from '../index';
import { asyncHandler } from '../middleware/async-handler';

const router = Router();

const createCommentSchema = z.object({
  topic_id: z.string().uuid(),
  content: z.string().min(1).max(500),
  stance: z.enum(['pro', 'con']),
  reply_to: z.string().uuid().optional(),
  user_id: z.string(), // 允许 "anonymous"
});

router.post('/', asyncHandler(async (req, res) => {
  const data = createCommentSchema.parse(req.body);

  let user: { user_id: string; username: string };
  
  if (data.user_id === 'anonymous') {
    // 匿名用户
    user = {
      user_id: 'anonymous',
      username: '匿名观众',
    };
  } else {
    // 已登录用户
    const userResult = await db.query(
      `SELECT user_id, username FROM users WHERE user_id = $1`,
      [data.user_id]
    );
    if (userResult.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }
    user = userResult.rows[0];
  }

  const commentId = uuidv4();

  await db.query(
    `INSERT INTO comments (comment_id, topic_id, author_type, author_id, author_name, content, stance, reply_to, is_ai_generated)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [commentId, data.topic_id, 'human', user.user_id, user.username, data.content, data.stance, data.reply_to || null, false]
  );

  const comment = {
    comment_id: commentId,
    author_type: 'human' as const,
    author_id: user.user_id,
    author_name: user.username,
    content: data.content,
    stance: data.stance,
    created_at: new Date().toISOString(),
  };

  io.to(`battle:${data.topic_id}`).emit('new_comment', comment);

  await butterflyEffect.triggerButterflyEffect({
    trigger_comment_id: commentId,
    topic_id: data.topic_id,
    user_stance: data.stance,
    rounds: 10,
  });

  res.json({ success: true, data: comment });
}));

router.post('/ai-assist', asyncHandler(async (req, res) => {
  const { topic_id, stance, user_id } = req.body;

  let softMemory = {};
  
  if (user_id !== 'anonymous') {
    const userResult = await db.query(`SELECT soft_memory FROM users WHERE user_id = $1`, [user_id]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }
    softMemory = userResult.rows[0].soft_memory || {};
  }

  const topicResult = await db.query(`SELECT title FROM topics WHERE topic_id = $1`, [topic_id]);
  if (topicResult.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Topic not found' });
  }

  const commentsResult = await db.query(
    `SELECT author_name, content FROM comments WHERE topic_id = $1 ORDER BY created_at DESC LIMIT 5`,
    [topic_id]
  );

  const content = await aiService.generateUserAIResponse({
    softMemory,
    topicTitle: topicResult.rows[0].title,
    stance,
    recentComments: commentsResult.rows,
  });

  res.json({ success: true, data: { content } });
}));

export default router;
