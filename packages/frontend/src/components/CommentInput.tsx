'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { commentsAPI } from '@/lib/api';

interface Props {
  topicId: string;
}

export default function CommentInput({ topicId }: Props) {
  const { user } = useStore();
  const [content, setContent] = useState('');
  const [stance, setStance] = useState<'pro' | 'con' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [aiContent, setAiContent] = useState('');
  const [showAiPreview, setShowAiPreview] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim() || !stance || !user) return;

    try {
      setIsLoading(true);
      await commentsAPI.create({
        topic_id: topicId,
        content: content.trim(),
        stance,
        user_id: user.user_id,
      });
      setContent('');
      setStance(null);
    } catch (error) {
      console.error('Failed to post comment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAIAssist = async () => {
    if (!stance || !user) return;

    try {
      setIsLoading(true);
      const response = await commentsAPI.aiAssist({
        topic_id: topicId,
        stance,
        user_id: user.user_id,
      });

      if (response.data.success) {
        setAiContent(response.data.data.content);
        setShowAiPreview(true);
      }
    } catch (error) {
      console.error('AI assist failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const useAIContent = () => {
    setContent(aiContent);
    setShowAiPreview(false);
  };

  const charCount = content.length;
  const charRatio = charCount / 150;

  return (
    <div className="cyber-card p-4 sm:p-6 space-y-4">
      <div className="text-[10px] text-gray-400 font-mono select-none">
        {'// USER_INPUT_TERMINAL'}
      </div>

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
              onClick={() => setStance('pro')}
              className="cyber-button px-6 sm:px-8 py-2.5 sm:py-3 border-red-400 text-red-500 hover:bg-red-50"
              aria-label="support pro side"
            >
              {'\u63f4\u52a9\u6b63\u65b9'}
            </button>
            <button
              onClick={() => setStance('con')}
              className="cyber-button px-6 sm:px-8 py-2.5 sm:py-3 border-cyan-400 text-cyan-600 hover:bg-cyan-50"
              aria-label="support con side"
            >
              {'\u63f4\u52a9\u53cd\u65b9'}
            </button>
          </motion.div>
        )}

        {stance && !showAiPreview && (
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
                stance === 'pro' ? 'text-red-500' : 'text-cyan-600'
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

              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={handleAIAssist}
                  disabled={isLoading}
                  className="cyber-button px-4 sm:px-6 py-2 text-xs sm:text-sm"
                >
                  {isLoading ? '[\u5904\u7406\u4e2d...]' : '\u5206\u8eab\u4ee3\u6253'}
                </button>

                <button
                  onClick={handleSubmit}
                  disabled={isLoading || !content.trim()}
                  className="cyber-button primary px-4 sm:px-6 py-2 text-xs sm:text-sm"
                >
                  {isLoading ? '[\u53d1\u9001\u4e2d...]' : '\u53d1\u9001'}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {showAiPreview && (
          <motion.div
            key="ai-preview"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse" />
              <span className="text-sm text-cyan-600 font-mono">
                {'AI\u5206\u8eab\u751f\u6210\u7684\u53d1\u8a00'}
              </span>
            </div>

            <div className="bg-cyan-50/60 border border-cyan-200 rounded p-3 sm:p-4">
              <p className="text-sm text-gray-800 leading-relaxed">
                {aiContent}
              </p>
            </div>

            <div className="flex gap-2 sm:gap-3 justify-end">
              <button
                onClick={() => setShowAiPreview(false)}
                className="cyber-button px-4 sm:px-6 py-2 text-xs sm:text-sm"
              >
                {'\u91cd\u65b0\u751f\u6210'}
              </button>
              <button
                onClick={useAIContent}
                className="cyber-button primary px-4 sm:px-6 py-2 text-xs sm:text-sm"
              >
                {'\u4f7f\u7528\u6b64\u5185\u5bb9'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
