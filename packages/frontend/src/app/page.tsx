'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { topicsAPI } from '@/lib/api';
import TopicSwiper from '@/components/TopicSwiper';
import BattleField from '@/components/BattleField';
import LoginButton from '@/components/LoginButton';
import SystemStats from '@/components/SystemStats';

export default function Home() {
  const { topics, setTopics, currentTopic, setCurrentTopic, user } = useStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTopics();
  }, []);

  const loadTopics = async () => {
    try {
      setIsLoading(true);
      const response = await topicsAPI.getAll();
      if (response.data.success) {
        setTopics(response.data.data);
        if (response.data.data.length > 0) {
          setCurrentTopic(response.data.data[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load topics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col relative overflow-hidden">
      <div className="fixed inset-0 bg-grid opacity-20 pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-cyan-400/25 bg-gray-950/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg sm:text-2xl font-bold text-cyber-blue text-glow tracking-wider">
              SYNAPSE_ARENA
            </h1>
            <span className="hidden sm:inline text-[8px] text-cyan-500/60 font-mono">
              v1.0 // SYS.RDY
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden sm:block">
              <SystemStats />
            </div>
            {user ? (
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center overflow-hidden"
                  style={{ clipPath: 'polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%)' }}
                >
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-cyan-400 text-xs font-bold">{user.username[0]}</span>
                  )}
                </div>
                <span className="text-cyan-400 text-sm hidden sm:inline">{user.username}</span>
              </div>
            ) : (
              <LoginButton />
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative z-10 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-16">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-[60vh] gap-6"
            >
              <div className="space-y-4 w-full max-w-md">
                <div className="skeleton h-8 rounded w-3/4 mx-auto" />
                <div className="skeleton h-4 rounded w-1/2 mx-auto" />
                <div className="skeleton h-40 rounded w-full mt-8" />
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="skeleton h-24 rounded" />
                  <div className="skeleton h-24 rounded" />
                </div>
              </div>
              <div className="text-center mt-4">
                <div className="text-cyber-blue text-sm animate-pulse-glow font-mono">
                  [信号接入中...]
                </div>
                <div className="text-cyan-500/50 text-[10px] mt-1 font-mono">LOADING_BATTLE_DATA</div>
              </div>
            </motion.div>
          ) : topics.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="flex items-center justify-center h-[60vh]"
            >
              <div className="text-center cyber-card p-10 sm:p-12 max-w-md">
                <div className="w-16 h-16 mx-auto mb-6 border border-cyan-400/20 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-cyan-400/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                  </svg>
                </div>
                <h2 className="text-cyber-blue text-xl font-bold mb-3">
                  暂无激活战场
                </h2>
                <p className="text-cyan-400/70 text-sm leading-relaxed">
                  系统正在生成新的辩题，请稍后刷新...
                </p>
                <button
                  onClick={loadTopics}
                  className="cyber-button primary px-8 py-2.5 mt-6"
                >
                  刷新
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <TopicSwiper
                topics={topics}
                currentTopic={currentTopic}
                onTopicChange={(topic) => setCurrentTopic(topic)}
              />

              <AnimatePresence mode="wait">
                {currentTopic && (
                  <motion.div
                    key={currentTopic.topic_id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3, ease: 'easeOut', delay: 0.1 }}
                    className="mt-6"
                  >
                    <BattleField topic={currentTopic} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="sticky bottom-0 z-30 border-t border-cyan-400/20 bg-gray-950/95 backdrop-blur-md" role="contentinfo">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between text-[10px] text-cyan-500/50 font-mono">
          <span>TX_OK | LATENCY: 12ms</span>
          <span className="hidden sm:inline">ONLINE_AGENTS: {topics.length * 2}</span>
          <span>POWERED_BY: ZHIHU_API</span>
        </div>
      </footer>
    </div>
  );
}
