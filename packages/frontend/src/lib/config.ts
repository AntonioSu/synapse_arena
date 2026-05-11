export const config = {
  secondme: {
    authUrl: 'https://go.second.me/oauth/',
    redirectUri: process.env.NEXT_PUBLIC_SECONDME_REDIRECT_URI || 'http://localhost:3000/auth/callback',
    clientId: process.env.NEXT_PUBLIC_SECONDME_CLIENT_ID || '',
  },
  zhihu: {
    authUrl: process.env.NEXT_PUBLIC_ZHIHU_OAUTH_AUTH_URL || 'https://www.zhihu.com/oauth2/authorize',
    redirectUri: process.env.NEXT_PUBLIC_ZHIHU_OAUTH_REDIRECT_URI || 'http://localhost:3000/auth/callback',
    clientId: process.env.NEXT_PUBLIC_ZHIHU_OAUTH_CLIENT_ID || process.env.NEXT_PUBLIC_ZHIHU_APP_KEY || '',
  },
};
