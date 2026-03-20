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

    // 1. 用code换取access_token (application/x-www-form-urlencoded格式)
    const tokenResponse = await fetch(config.secondme.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: config.secondme.redirectUri,
        client_id: config.secondme.clientId,
        client_secret: config.secondme.clientSecret,
      }),
    });

    const tokenResult = await tokenResponse.json();
    console.log('Token exchange response:', JSON.stringify(tokenResult));

    // API返回格式: { code: 0, data: { accessToken, refreshToken, expiresIn, scope } }
    if (tokenResult.code !== 0 || !tokenResult.data?.accessToken) {
      console.error('Token exchange failed:', tokenResult);
      return res.status(400).json({
        success: false,
        error: tokenResult.message || 'Failed to get access token',
        detail: tokenResult.subCode,
      });
    }

    const accessToken = tokenResult.data.accessToken;
    const refreshToken = tokenResult.data.refreshToken;

    // 2. 获取用户信息 (SecondMe API: /api/secondme/user/info)
    const userInfoResponse = await fetch(`${config.secondme.apiUrl}/api/secondme/user/info`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const userInfoResult = await userInfoResponse.json();
    console.log('User info response:', JSON.stringify(userInfoResult));

    if (userInfoResult.code !== 0 || !userInfoResult.data) {
      console.error('Failed to get user info:', userInfoResult);
      return res.status(400).json({ success: false, error: 'Failed to get user info' });
    }

    // API返回: { code: 0, data: { userId, name, avatar, email, bio, ... } }
    const userInfo = userInfoResult.data;

    // 3. 获取软记忆 (SecondMe API: /api/secondme/user/softmemory)
    let softMemoryData = null;
    try {
      const softMemoryResponse = await fetch(`${config.secondme.apiUrl}/api/secondme/user/softmemory`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const softMemoryResult = await softMemoryResponse.json();
      if (softMemoryResult.code === 0) {
        softMemoryData = softMemoryResult.data;
      }
    } catch (e) {
      console.warn('Failed to fetch soft memory, continuing without it:', e);
    }

    // 4. 存入或更新用户
    const existingUser = await db.query(
      `SELECT user_id FROM users WHERE secondme_id = $1`,
      [userInfo.userId]
    );

    let userId: string;

    if (existingUser.rows.length > 0) {
      userId = existingUser.rows[0].user_id;
      await db.query(
        `UPDATE users 
         SET soft_memory = $1, access_token = $2, refresh_token = $3, username = $4, avatar_url = $5, updated_at = NOW()
         WHERE user_id = $6`,
        [
          JSON.stringify(softMemoryData),
          accessToken,
          refreshToken,
          userInfo.name,
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
          userInfo.userId,
          userInfo.name,
          userInfo.avatar,
          JSON.stringify(softMemoryData),
          accessToken,
          refreshToken,
        ]
      );
    }

    res.json({
      success: true,
      data: {
        user_id: userId,
        username: userInfo.name,
        avatar_url: userInfo.avatar,
        access_token: accessToken,
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
