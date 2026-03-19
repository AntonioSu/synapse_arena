export const config = {
  secondme: {
    authUrl: 'https://go.second.me/oauth/',
    redirectUri: process.env.NEXT_PUBLIC_SECONDME_REDIRECT_URI || 'http://localhost:3000/auth/callback',
    clientId: process.env.NEXT_PUBLIC_SECONDME_CLIENT_ID || '',
  },
};
