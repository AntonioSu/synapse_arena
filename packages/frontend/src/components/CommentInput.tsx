'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { commentsAPI } from '@/lib/api';
import LoginButton from '@/components/LoginButton';
import type { Comment } from '@/types';

interface Props {
  topicId: string;
}

export default function CommentInput({ topicId }: Props) {
  const { user, addComment } = useStore();
  const [content, setContent] = useState('');
  const [stance, setStance] = useState<'pro' | 'con' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleStanceClick = (s: 'pro' | 'con') => {
    if (user) {
      setStance(s);
    } else {
      setShowLoginModal(true);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() || !stance) return;

    try {
      setIsLoading(true);
      const response = await commentsAPI.create({
        topic_id: topicId,
        content: content.trim(),
        stance,
        user_id: user?.user_id || 'anonymous',
        username: user?.username,
      });
      if (response.data.success) {
        addComment(response.data.data as Comment);
      }
      setContent('');
      setStance(null);
    } catch (error) {
      console.error('Failed to post comment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const charCount = content.length;
  const charRatio = charCount / 150;

  return (
    <div className="cyber-card p-4 sm:p-6 space-y-4">
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={() => setShowLoginModal(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="cyber-card p-6 sm:p-8 max-w-sm w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-cyan-700 text-lg font-bold mb-2 text-center">
              {'登录参与辩论'}
            </h3>
            <p className="text-gray-400 text-xs text-center mb-5">
              {'使用知乎账号登录后即可参与辩论'}
            </p>
            <div className="flex justify-center">
              <LoginButton />
            </div>
          </motion.div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {!stance && (
          <motion.div
            key="stance-select"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex gap-3 sm:gap-4 justify-center py-2"
          >
            <button
              onClick={() => handleStanceClick('pro')}
              className="cyber-button px-6 sm:px-8 py-2.5 sm:py-3 border-cyan-400 text-cyan-600 hover:bg-cyan-50"
              aria-label="support pro side"
            >
              {'\u63f4\u52a9\u6b63\u65b9'}
            </button>
            <button
              onClick={() => handleStanceClick('con')}
              className="cyber-button px-6 sm:px-8 py-2.5 sm:py-3 border-rose-400 text-rose-500 hover:bg-rose-50"
              aria-label="support con side"
            >
              {'\u63f4\u52a9\u53cd\u65b9'}
            </button>
          </motion.div>
        )}

        {stance && (
          <motion.div
            key="input-area"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium ${
                stance === 'pro' ? 'text-cyan-600' : 'text-rose-500'
              }`}>
                {stance === 'pro' ? '\u5f53\u524d\u7acb\u573a: \u6b63\u65b9' : '\u5f53\u524d\u7acb\u573a: \u53cd\u65b9'}
              </span>
              <button
                onClick={() => setStance(null)}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                {'\u5207\u6362\u7acb\u573a'}
              </button>
            </div>

            <div className="relative">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={'\u8f93\u5165\u4f60\u7684\u89c2\u70b9\uff08150\u5b57\u4ee5\u5185\uff09...'}
                maxLength={150}
                rows={4}
                className="w-full bg-gray-50 border border-gray-200 rounded p-3 sm:p-4 text-sm text-gray-800
                         placeholder:text-gray-400 resize-none transition-colors
                         focus:outline-none focus:border-cyan-400 focus:bg-white focus:ring-1 focus:ring-cyan-400/20"
                disabled={isLoading}
                aria-label="comment input"
              />
              <div
                className="absolute bottom-0 left-0 h-[2px] transition-all duration-300 rounded-full"
                style={{
                  width: `${charRatio * 100}%`,
                  background: charRatio > 0.9 ? '#ef4444' : charRatio > 0.7 ? '#eab308' : '#06b6d4',
                  opacity: charCount > 0 ? 0.8 : 0,
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <span className={`text-xs font-mono ${charRatio > 0.9 ? 'text-red-500' : 'text-gray-400'}`}>
                {charCount}/150
              </span>

              <button
                onClick={handleSubmit}
                disabled={isLoading || !content.trim()}
                className="cyber-button primary px-4 sm:px-6 py-2 text-xs sm:text-sm"
              >
                {isLoading ? '[\u53d1\u9001\u4e2d...]' : '\u53d1\u9001'}
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
