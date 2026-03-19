'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authAPI } from '@/lib/api';
import { useStore } from '@/store/useStore';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useStore();

  useEffect(() => {
    const code = searchParams.get('code');
    
    if (!code) {
      router.push('/');
      return;
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
