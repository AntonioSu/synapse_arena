'use client';

import { config } from '../lib/config';

export default function LoginButton() {
  const handleLogin = () => {
    const authUrl = `${config.secondme.authUrl}?client_id=${config.secondme.clientId}&redirect_uri=${encodeURIComponent(config.secondme.redirectUri)}&scope=user.info.softmemory`;
    window.location.href = authUrl;
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
