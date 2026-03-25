import { Router } from 'express';
import { config } from '../config';
import { db } from '../db/client';
import { v4 as uuidv4 } from 'uuid';
import { asyncHandler } from '../middleware/async-handler';

const router = Router();

async function exchangeCodeForTokens(code: string) {
  const response = await fetch(config.secondme.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.secondme.redirectUri,
      client_id: config.secondme.clientId,
      client_secret: config.secondme.clientSecret,
    }),
  });

  const result: any = await response.json();
  console.log('Token exchange response:', JSON.stringify(result));

  if (result.code !== 0 || !result.data?.accessToken) {
    const err: any = new Error(result.message || 'Failed to get access token');
    err.status = 400;
    err.detail = result.subCode;
    throw err;
  }

  return { accessToken: result.data.accessToken, refreshToken: result.data.refreshToken };
}

async function fetchUserProfile(accessToken: string) {
  const response = await fetch(`${config.secondme.apiUrl}/api/secondme/user/info`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const result: any = await response.json();
  console.log('User info response:', JSON.stringify(result));

  if (result.code !== 0 || !result.data) {
    const err: any = new Error('Failed to get user info');
    err.status = 400;
    throw err;
  }

  return result.data;
}

async function fetchSoftMemory(accessToken: string) {
  try {
    const response = await fetch(`${config.secondme.apiUrl}/api/secondme/user/softmemory`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const result: any = await response.json();
    return result.code === 0 ? result.data : null;
  } catch (e) {
    console.warn('Failed to fetch soft memory, continuing without it:', e);
    return null;
  }
}

async function upsertUser(
  userInfo: any,
  softMemory: any,
  accessToken: string,
  refreshToken: string
): Promise<string> {
  const existing = await db.query(`SELECT user_id FROM users WHERE secondme_id = $1`, [userInfo.userId]);

  if (existing.rows.length > 0) {
    const userId = existing.rows[0].user_id;
    await db.query(
      `UPDATE users SET soft_memory = $1, access_token = $2, refresh_token = $3, username = $4, avatar_url = $5, updated_at = NOW()
       WHERE user_id = $6`,
      [JSON.stringify(softMemory), accessToken, refreshToken, userInfo.name, userInfo.avatar, userId]
    );
    return userId;
  }

  const userId = uuidv4();
  await db.query(
    `INSERT INTO users (user_id, secondme_id, username, avatar_url, soft_memory, access_token, refresh_token)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [userId, userInfo.userId, userInfo.name, userInfo.avatar, JSON.stringify(softMemory), accessToken, refreshToken]
  );
  return userId;
}

router.post('/secondme/callback', asyncHandler(async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ success: false, error: 'Code is required' });
  }

  const { accessToken, refreshToken } = await exchangeCodeForTokens(code);
  const userInfo = await fetchUserProfile(accessToken);
  const softMemory = await fetchSoftMemory(accessToken);
  const userId = await upsertUser(userInfo, softMemory, accessToken, refreshToken);

  res.json({
    success: true,
    data: {
      user_id: userId,
      username: userInfo.name,
      avatar_url: userInfo.avatar,
      access_token: accessToken,
    },
  });
}));

router.get('/me', asyncHandler(async (req, res) => {
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
}));

export default router;
