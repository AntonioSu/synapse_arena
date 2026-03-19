import { Router } from 'express';
import { config } from '../config';
import { db } from '../db/client';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// SecondMe OAuth回调处理
router.post('/secondme/callback', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, error: 'Code is required' });
    }

    // 1. 用code换取access_token
    const tokenResponse = await fetch(config.secondme.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: config.secondme.clientId,
        client_secret: config.secondme.clientSecret,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      return res.status(400).json({ success: false, error: 'Failed to get access token' });
    }

    // 2. 获取用户信息和软记忆
    const userInfoResponse = await fetch(`${config.secondme.apiUrl}/api/user/info`, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const userInfo = await userInfoResponse.json();

    // 3. 获取软记忆
    const softMemoryResponse = await fetch(`${config.secondme.apiUrl}/api/user/softmemory`, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const softMemory = await softMemoryResponse.json();

    // 4. 存入或更新用户
    const existingUser = await db.query(
      `SELECT user_id FROM users WHERE secondme_id = $1`,
      [userInfo.id]
    );

    let userId: string;

    if (existingUser.rows.length > 0) {
      userId = existingUser.rows[0].user_id;
      await db.query(
        `UPDATE users 
         SET soft_memory = $1, access_token = $2, refresh_token = $3, username = $4, avatar_url = $5, updated_at = NOW()
         WHERE user_id = $6`,
        [
          JSON.stringify(softMemory),
          tokenData.access_token,
          tokenData.refresh_token,
          userInfo.username,
          userInfo.avatar,
          userId,
        ]
      );
    } else {
      userId = uuidv4();
      await db.query(
        `INSERT INTO users (user_id, secondme_id, username, avatar_url, soft_memory, access_token, refresh_token)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          userId,
          userInfo.id,
          userInfo.username,
          userInfo.avatar,
          JSON.stringify(softMemory),
          tokenData.access_token,
          tokenData.refresh_token,
        ]
      );
    }

    res.json({
      success: true,
      data: {
        user_id: userId,
        username: userInfo.username,
        avatar_url: userInfo.avatar,
        access_token: tokenData.access_token,
      },
    });
  } catch (error) {
    console.error('Auth callback error:', error);
    res.status(500).json({ success: false, error: 'Authentication failed' });
  }
});

// 获取用户信息
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, error: 'No authorization header' });
    }

    const token = authHeader.split(' ')[1];

    const result = await db.query(
      `SELECT user_id, username, avatar_url, soft_memory FROM users WHERE access_token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, error: 'Failed to get user info' });
  }
});

export default router;
