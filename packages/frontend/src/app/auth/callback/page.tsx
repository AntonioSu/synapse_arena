'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
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
        setUser({ user_id, username, avatar_url, soft_memory: {} });
        router.push('/');
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      console.error('Auth callback error:', error);
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center"
      >
        <div className="w-12 h-12 mx-auto mb-6 border border-cyan-400/20 rounded-full flex items-center justify-center">
          <div className="w-3 h-3 bg-cyan-400/60 rounded-full animate-pulse" />
        </div>
        <div className="text-cyber-blue text-lg animate-pulse-glow mb-3 font-mono">
          {'\u8eab\u4efd\u9a8c\u8bc1\u4e2d...'}
        </div>
        <div className="text-cyan-500/30 text-[10px] font-mono">
          AUTHENTICATING_WITH_SECONDME
        </div>
      </motion.div>
    </div>
  );
}
