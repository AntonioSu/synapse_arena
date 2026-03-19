import { Router } from 'express';
import { db } from '../db/client';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { openaiService } from '../services/openai-service';
import { butterflyEffect } from '../services/butterfly-effect';
import { io } from '../index';

const router = Router();

const createCommentSchema = z.object({
  topic_id: z.string().uuid(),
  content: z.string().min(1).max(500),
  stance: z.enum(['pro', 'con']),
  reply_to: z.string().uuid().optional(),
  user_id: z.string().uuid(),
});

// 创建评论
router.post('/', async (req, res) => {
  try {
    const data = createCommentSchema.parse(req.body);

    // 获取用户信息
    const userResult = await db.query(
      `SELECT user_id, username FROM users WHERE user_id = $1`,
      [data.user_id]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    const user = userResult.rows[0];
    const commentId = uuidv4();

    await db.query(
      `INSERT INTO comments (comment_id, topic_id, author_type, author_id, author_name, content, stance, reply_to, is_ai_generated)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        commentId,
        data.topic_id,
        'human',
        data.user_id,
        user.username,
        data.content,
        data.stance,
        data.reply_to || null,
        false,
      ]
    );

    const comment = {
      comment_id: commentId,
      author_type: 'human',
      author_id: data.user_id,
      author_name: user.username,
      content: data.content,
      stance: data.stance,
      created_at: new Date().toISOString(),
    };

    // 通过WebSocket推送新评论
    io.to(`battle:${data.topic_id}`).emit('new_comment', comment);

    // 触发蝴蝶效应（10轮AI响应）
    await butterflyEffect.triggerButterflyEffect({
      trigger_comment_id: commentId,
      topic_id: data.topic_id,
      user_stance: data.stance,
      rounds: 10,
    });

    res.json({
      success: true,
      data: comment,
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ success: false, error: 'Failed to create comment' });
  }
});

// AI分身代打
router.post('/ai-assist', async (req, res) => {
  try {
    const { topic_id, stance, user_id } = req.body;

    // 获取用户软记忆
    const userResult = await db.query(
      `SELECT soft_memory FROM users WHERE user_id = $1`,
      [user_id]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    const softMemory = userResult.rows[0].soft_memory || {};

    // 获取话题信息
    const topicResult = await db.query(
      `SELECT title FROM topics WHERE topic_id = $1`,
      [topic_id]
    );

    if (topicResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Topic not found' });
    }

    const topicTitle = topicResult.rows[0].title;

    // 获取最近评论
    const commentsResult = await db.query(
      `SELECT author_name, content FROM comments 
       WHERE topic_id = $1 
       ORDER BY created_at DESC 
       LIMIT 5`,
      [topic_id]
    );

    const recentComments = commentsResult.rows;

    // 生成AI回复
    const content = await openaiService.generateUserAIResponse({
      softMemory,
      topicTitle,
      stance,
      recentComments,
    });

    res.json({ success: true, data: { content } });
  } catch (error) {
    console.error('AI assist error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate AI response' });
  }
});

export default router;
