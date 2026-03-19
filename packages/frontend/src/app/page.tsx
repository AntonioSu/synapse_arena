'use client';

import { useEffect, useState } from 'react';
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
    <main className="min-h-screen bg-black relative overflow-hidden">
      {/* Background grid */}
      <div className="fixed inset-0 bg-grid opacity-20 pointer-events-none" />
      
      {/* Header */}
      <header className="relative z-20 border-b border-cyan-400/20 bg-black/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-cyber-blue text-glow">
              SYNAPSE_ARENA
            </h1>
            <span className="text-[8px] text-cyan-500/50">
              // SYS.RDY v1.0
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <SystemStats />
            {user ? (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-cyan-400/20 border border-cyan-400/50" 
                     style={{ clipPath: 'polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%)' }}>
                  {user.avatar_url && (
                    <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                  )}
                </div>
                <span className="text-cyan-400 text-sm">{user.username}</span>
              </div>
            ) : (
              <LoginButton />
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center">
              <div className="text-cyber-blue text-xl animate-pulse-glow">
                [信号接入中...]
              </div>
              <div className="text-cyan-500/50 text-xs mt-2">LOADING_BATTLE_DATA</div>
            </div>
          </div>
        ) : topics.length === 0 ? (
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center cyber-card p-8">
              <div className="text-cyber-blue text-xl mb-4">
                暂无激活战场
              </div>
              <div className="text-cyan-500/50 text-sm">
                等待系统生成新的辩题...
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Topic Swiper */}
            <TopicSwiper
              topics={topics}
              currentTopic={currentTopic}
              onTopicChange={setCurrentTopic}
            />

            {/* Battle Field */}
            {currentTopic && (
              <div className="mt-8">
                <BattleField topic={currentTopic} />
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer Stats */}
      <footer className="fixed bottom-0 left-0 right-0 z-20 border-t border-cyan-400/20 bg-black/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between text-[10px] text-cyan-500/50">
          <div>TX_OK | LATENCY: 12ms</div>
          <div>ONLINE_AGENTS: {topics.length * 2}</div>
          <div>POWERED_BY: ZHIHU_API</div>
        </div>
      </footer>
    </main>
  );
}
