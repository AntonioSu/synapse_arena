'use client';

import { config } from '../lib/config';

function generateState(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

export default function LoginButton() {
  const handleLogin = () => {
    const state = generateState();
    sessionStorage.setItem('oauth_state', state);
    sessionStorage.setItem('oauth_provider', 'zhihu');

    const params = new URLSearchParams({
      client_id: config.zhihu.clientId,
      redirect_uri: config.zhihu.redirectUri,
      response_type: 'code',
      state,
    });

    window.location.href = `${config.zhihu.authUrl}?${params.toString()}`;
  };

  return (
    <button
      onClick={handleLogin}
      className="cyber-button primary px-4 sm:px-6 py-2 text-xs sm:text-sm"
      aria-label="Log in with Zhihu"
    >
      {'\u77e5\u4e4e\u767b\u5f55'}
    </button>
  );
}
