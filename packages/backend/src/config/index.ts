import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

export const config = {
  port: parseInt(process.env.BACKEND_PORT || '8081', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/synapse_arena',
  },
  
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  
  zhihu: {
    appKey: process.env.ZHIHU_APP_KEY || '',
    appSecret: process.env.ZHIHU_APP_SECRET || '',
    baseURL: process.env.ZHIHU_BASE_URL || 'https://openapi.zhihu.com',
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

  zhihuOAuth: {
    appId: process.env.ZHIHU_OAUTH_APP_ID || process.env.ZHIHU_APP_KEY || '',
    appKey: process.env.ZHIHU_OAUTH_APP_KEY || process.env.ZHIHU_APP_SECRET || '',
    redirectUri: process.env.ZHIHU_OAUTH_REDIRECT_URI || 'http://localhost:3000/auth/callback',
    authUrl: process.env.ZHIHU_OAUTH_AUTH_URL || 'https://openapi.zhihu.com/authorize',
    tokenUrl: process.env.ZHIHU_OAUTH_TOKEN_URL || 'https://openapi.zhihu.com/access_token',
    userInfoUrl: process.env.ZHIHU_OAUTH_USERINFO_URL || 'https://openapi.zhihu.com/user',
  },
  
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
  },
  
  llm: {
    apiUrl: process.env.LLM_API_URL || '',
    apiKey: process.env.LLM_API_KEY || '',
    model: process.env.LLM_MODEL || '',
  },
};
