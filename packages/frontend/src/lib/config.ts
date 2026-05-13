export const config = {
  secondme: {
    authUrl: 'https://go.second.me/oauth/',
    redirectUri: process.env.NEXT_PUBLIC_SECONDME_REDIRECT_URI || 'http://localhost:3000/auth/callback',
    clientId: process.env.NEXT_PUBLIC_SECONDME_CLIENT_ID || '',
  },
  zhihu: {
    authUrl: process.env.NEXT_PUBLIC_ZHIHU_OAUTH_AUTH_URL || 'https://openapi.zhihu.com/authorize',
    redirectUri: process.env.NEXT_PUBLIC_ZHIHU_OAUTH_REDIRECT_URI || 'http://localhost:3000/auth/callback',
    appId: process.env.NEXT_PUBLIC_ZHIHU_OAUTH_APP_ID || '',
  },
};
