'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { topicsAPI } from '@/lib/api';
import TopicSwiper from '@/components/TopicSwiper';
import BattleField from '@/components/BattleField';
import LoginButton from '@/components/LoginButton';
import CategoryTabs from '@/components/CategoryTabs';


export default function Home() {
  const { topics, setTopics, currentTopic, setCurrentTopic, user } = useStore();
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  
  // 是否启用登录验证（从环境变量读取，默认为 false）
  const enableAuth = process.env.NEXT_PUBLIC_ENABLE_AUTH === 'true';

  useEffect(() => {
    loadTopics('all');
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await topicsAPI.getCategories();
      if (response.data.success) {
        const counts: Record<string, number> = {};
        for (const item of response.data.data.categories) {
          counts[item.category] = parseInt(item.count);
        }
        setCategoryCounts(counts);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadTopics = useCallback(async (category: string) => {
    try {
      setIsLoading(true);
      const response = await topicsAPI.getAll(category);
      if (response.data.success) {
        setTopics(response.data.data);
        if (response.data.data.length > 0) {
          setCurrentTopic(response.data.data[0]);
        } else {
          setCurrentTopic(null);
        }
      }
    } catch (error) {
      console.error('Failed to load topics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [setTopics, setCurrentTopic]);

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    loadTopics(category);
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none" />

      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/85 backdrop-blur-md">
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-center gap-20 sm:gap-36">
          <h1 className="text-lg sm:text-2xl font-bold text-cyan-600 text-glow tracking-wider">
            AI{'\u8fa9\u8bba\u573a'}
          </h1>
          {user && (
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 bg-cyan-100 border border-cyan-300 flex items-center justify-center overflow-hidden"
                style={{ clipPath: 'polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%)' }}
              >
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-cyan-600 text-xs font-bold">{user.username[0]}</span>
                )}
              </div>
              <span className="text-cyan-700 text-sm hidden sm:inline">{user.username}</span>
            </div>
          )}
        </div>
      </header>

      {/* SecondMe 登录控制（通过 NEXT_PUBLIC_ENABLE_AUTH 环境变量） */}
      {enableAuth && !user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="text-center cyber-card p-10 sm:p-12 max-w-sm">
            <div className="w-16 h-16 mx-auto mb-6 border border-cyan-300 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <h2 className="text-cyan-700 text-xl font-bold mb-2">
              {'\u8eab\u4efd\u9a8c\u8bc1'}
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              {'\u767b\u5f55\u540e\u89e3\u9501\u8fa9\u8bba\u573a'}
            </p>
            <LoginButton />
          </div>
        </div>
      )}

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
                <div className="text-cyan-600 text-sm animate-pulse-glow font-mono">
                  {'[\u4fe1\u53f7\u63a5\u5165\u4e2d...]'}
                </div>
                <div className="text-cyan-500/60 text-[10px] mt-1 font-mono">LOADING_BATTLE_DATA</div>
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
                <div className="w-16 h-16 mx-auto mb-6 border border-cyan-300 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                  </svg>
                </div>
                <h2 className="text-cyan-700 text-xl font-bold mb-3">
                  {'\u6682\u65e0\u6fc0\u6d3b\u6218\u573a'}
                </h2>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {'\u7cfb\u7edf\u6b63\u5728\u751f\u6210\u65b0\u7684\u8fa9\u9898\uff0c\u8bf7\u7a0d\u540e\u5237\u65b0...'}
                </p>
                <button
                  onClick={() => loadTopics('all')}
                  className="cyber-button primary px-8 py-2.5 mt-6"
                >
                  {'\u5237\u65b0'}
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
              <div className="mb-4">
                <CategoryTabs
                  activeCategory={activeCategory}
                  onCategoryChange={handleCategoryChange}
                  categoryCounts={categoryCounts}
                />
              </div>

              {topics.length === 0 ? (
                <div className="text-center cyber-card p-8 sm:p-10">
                  <p className="text-gray-400 text-sm font-mono">{'该分类暂无话题'}</p>
                </div>
              ) : (
              <TopicSwiper
                key={activeCategory}
                topics={topics}
                currentTopic={currentTopic}
                onTopicChange={(topic) => setCurrentTopic(topic)}
              />
              )}

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

    </div>
  );
}
