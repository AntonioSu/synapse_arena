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

    const params = new URLSearchParams({
      client_id: config.secondme.clientId,
      redirect_uri: config.secondme.redirectUri,
      response_type: 'code',
      state,
    });

    window.location.href = `${config.secondme.authUrl}?${params.toString()}`;
  };

  return (
    <button
      onClick={handleLogin}
      className="cyber-button primary px-6 py-2"
    >
      SecondMe登录
    </button>
  );
}
