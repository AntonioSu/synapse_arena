import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

export const config = {
  port: parseInt(process.env.BACKEND_PORT || '8080', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/synapse_arena',
  },
  
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  
  zhihu: {
    appKey: process.env.ZHIHU_APP_KEY || 'stan-saber',
    appSecret: process.env.ZHIHU_APP_SECRET || 'mjcgMVerUfH5H6gzmuiAKSdxQk2IH3SH',
    baseURL: 'https://openapi.zhihu.com',
    ringIds: ['2001009660925334090', '2015023739549529606'],
  },
  
  secondme: {
    clientId: process.env.SECONDME_CLIENT_ID || '',
    clientSecret: process.env.SECONDME_CLIENT_SECRET || '',
    redirectUri: process.env.SECONDME_REDIRECT_URI || 'http://localhost:3000/auth/callback',
    authUrl: 'https://go.second.me/oauth/',
    tokenUrl: 'https://api.mindverse.com/gate/lab/api/oauth/token/code',
    tokenRefreshUrl: 'https://api.mindverse.com/gate/lab/api/oauth/token/refresh',
    apiUrl: 'https://api.mindverse.com/gate/lab',
  },
  
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
  },
  
  minimax: {
    apiKey: process.env.MINIMAX_API_KEY || '',
    groupId: process.env.MINIMAX_GROUP_ID || '',
    baseURL: 'https://api.minimax.io/v1',
  },
};
