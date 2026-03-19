'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authAPI } from '@/lib/api';
import { useStore } from '@/store/useStore';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useStore();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const error = searchParams.get('error');
    if (error) {
      const desc = searchParams.get('error_description') || error;
      console.error('OAuth error:', desc);
      alert(`登录失败: ${desc}`);
      router.push('/');
      return;
    }

    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code) {
      router.push('/');
      return;
    }

    const savedState = sessionStorage.getItem('oauth_state');
    if (savedState) {
      if (state !== savedState) {
        console.error('OAuth state mismatch');
        alert('登录失败: 安全验证失败，请重试');
        sessionStorage.removeItem('oauth_state');
        router.push('/');
        return;
      }
      sessionStorage.removeItem('oauth_state');
    }

    handleCallback(code);
  }, [searchParams]);

  const handleCallback = async (code: string) => {
    try {
      const response = await authAPI.callback(code);
      
      if (response.data.success) {
        const { user_id, username, avatar_url, access_token } = response.data.data;
        
        localStorage.setItem('access_token', access_token);
        
        setUser({
          user_id,
          username,
          avatar_url,
          soft_memory: {},
        });
        
        router.push('/');
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      console.error('Auth callback error:', error);
      alert('登录失败，请重试');
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="text-cyber-blue text-xl animate-pulse-glow mb-4">
          [身份验证中...]
        </div>
        <div className="text-cyan-500/50 text-xs">
          AUTHENTICATING_WITH_SECONDME
        </div>
      </div>
    </div>
  );
}
