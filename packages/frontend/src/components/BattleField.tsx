'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { topicsAPI } from '@/lib/api';
import { socketService } from '@/lib/socket';
import CommentBubble from './CommentBubble';
import CommentInput from './CommentInput';
import BattleProgress from './BattleProgress';
import type { Topic } from '@/types';

interface Props {
  topic: Topic;
}

function CommentSkeleton() {
  return (
    <div className="space-y-5">
      {[1, 2, 3].map((i) => (
        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : ''}`}>
          <div className={`max-w-[75%] flex gap-3 ${i % 2 === 0 ? 'flex-row-reverse' : ''}`}>
            <div className="skeleton w-8 h-8 rounded-sm flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-3 w-24 rounded" />
              <div className="skeleton h-16 w-full rounded" />
              <div className="skeleton h-2 w-32 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function BattleField({ topic }: Props) {
  const { comments, setComments, addComment, user } = useStore();
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const skipScrollRef = useRef(false);

  useEffect(() => {
    loadComments();
    setupSocket();

    return () => {
      socketService.leaveBattle(topic.topic_id);
      socketService.off('new_comment');
      socketService.off('battle_update');
    };
  }, [topic.topic_id]);

  useEffect(() => {
    if (skipScrollRef.current) {
      skipScrollRef.current = false;
      return;
    }
    scrollToBottom();
  }, [comments]);

  const loadComments = async () => {
    try {
      setIsLoading(true);
      const response = await topicsAPI.getComments(topic.topic_id, 100);
      if (response.data.success) {
        skipScrollRef.current = true;
        setComments(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setupSocket = () => {
    socketService.connect();
    socketService.joinBattle(topic.topic_id);
    socketService.onNewComment((comment) => addComment(comment));
    socketService.onBattleUpdate(() => {});
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="space-y-4">
      <BattleProgress battleState={topic.battle_state} />

      <section className="cyber-card p-4 sm:p-6 min-h-[400px] max-h-[600px] overflow-y-auto">
        {isLoading ? (
          <CommentSkeleton />
        ) : comments.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-64 text-center"
          >
            <div className="w-12 h-12 border border-gray-200 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm mb-1">{'\u6218\u573a\u5bc2\u9759\u65e0\u58f0...'}</p>
            <p className="text-gray-400 text-xs">{'\u7b49\u5f85\u7b2c\u4e00\u4e2a\u53d1\u8a00\u8005'}</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence initial={false}>
              {comments.map((comment, index) => (
                <motion.div
                  key={comment.comment_id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut', delay: Math.min(index * 0.03, 0.3) }}
                >
                  <CommentBubble comment={comment} />
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        )}
      </section>

      {/* 允许匿名评论 */}
      <CommentInput topicId={topic.topic_id} />
    </div>
  );
}
