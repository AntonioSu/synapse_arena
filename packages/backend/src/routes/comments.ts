import { Router } from 'express';
import { db } from '../db/client';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { butterflyEffect } from '../services/butterfly-effect';
import { io } from '../index';
import { asyncHandler } from '../middleware/async-handler';

const router = Router();

const createCommentSchema = z.object({
  topic_id: z.string().uuid(),
  content: z.string().min(1).max(500),
  stance: z.enum(['pro', 'con']),
  reply_to: z.string().uuid().optional(),
  user_id: z.string(),
  username: z.string().optional(),
});

router.post('/', asyncHandler(async (req, res) => {
  const data = createCommentSchema.parse(req.body);

  // 可选 Bearer token：带 token 时一定要查出对应用户；
  // 不带 token 时只允许 user_id === 'anonymous'，避免匿名通道被滥用伪造任意 user_id。
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  let user: { user_id: string; username: string };

  if (token) {
    const r = await db.query<{ user_id: string; username: string | null }>(
      `SELECT user_id, username FROM users WHERE access_token = $1 LIMIT 1`,
      [token]
    );
    if (r.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid access token' });
    }
    const row = r.rows[0];
    if (data.user_id !== 'anonymous' && data.user_id !== row.user_id) {
      return res.status(403).json({ success: false, error: 'user_id does not match token' });
    }
    user = {
      user_id: row.user_id,
      username: row.username || data.username || '知乎用户',
    };
  } else {
    if (data.user_id !== 'anonymous') {
      return res.status(401).json({
        success: false,
        error: 'Authentication required for non-anonymous comment',
      });
    }
    user = {
      user_id: 'anonymous',
      username: data.username || '匿名观众',
    };
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

  res.json({ success: true, data: comment });

  butterflyEffect.triggerButterflyEffect({
    trigger_comment_id: commentId,
    topic_id: data.topic_id,
    user_stance: data.stance,
    rounds: 10,
  }).catch((err) => console.error('Failed to trigger butterfly effect:', err));
}));

export default router;
