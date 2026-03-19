'use client';

import { useState } from 'react';
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
      alert('发送失败，请重试');
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
      alert('分身代打失败');
    } finally {
      setIsLoading(false);
    }
  };

  const useAIContent = () => {
    setContent(aiContent);
    setShowAiPreview(false);
  };

  return (
    <div className="cyber-card p-6 space-y-4">
      <div className="text-[10px] text-cyan-500/50">
        // USER_INPUT_TERMINAL
      </div>

      {/* Stance Selection */}
      {!stance && (
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => setStance('pro')}
            className="cyber-button px-8 py-3 border-cyber-red text-cyber-red hover:border-cyber-red"
          >
            援助正方
          </button>
          <button
            onClick={() => setStance('con')}
            className="cyber-button px-8 py-3 border-cyber-blue text-cyber-blue hover:border-cyber-blue"
          >
            援助反方
          </button>
        </div>
      )}

      {/* Input Area */}
      {stance && !showAiPreview && (
        <>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm ${
              stance === 'pro' ? 'text-cyber-red' : 'text-cyber-blue'
            }`}>
              当前立场: {stance === 'pro' ? '正方' : '反方'}
            </span>
            <button
              onClick={() => setStance(null)}
              className="text-xs text-cyan-500/50 hover:text-cyan-500"
            >
              切换立场
            </button>
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="输入你的观点（150字以内）..."
            maxLength={150}
            rows={4}
            className="w-full bg-black/50 border border-cyan-400/30 p-4 text-sm text-gray-200 
                     placeholder:text-cyan-500/30 focus:outline-none focus:border-cyan-400/50
                     resize-none"
            disabled={isLoading}
          />

          <div className="flex items-center justify-between">
            <span className="text-xs text-cyan-500/50">
              {content.length}/150
            </span>
            
            <div className="flex gap-3">
              <button
                onClick={handleAIAssist}
                disabled={isLoading}
                className="cyber-button px-6 py-2 border-cyan-400 text-cyan-400 disabled:opacity-50"
              >
                {isLoading ? '[处理中...]' : '分身代打'}
              </button>
              
              <button
                onClick={handleSubmit}
                disabled={isLoading || !content.trim()}
                className="cyber-button primary px-6 py-2 disabled:opacity-50"
              >
                {isLoading ? '[发送中...]' : '发送'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* AI Preview */}
      {showAiPreview && (
        <div className="space-y-4">
          <div className="text-sm text-cyan-400 mb-2">
            AI分身生成的发言：
          </div>
          
          <div className="bg-black/50 border border-cyan-400/30 p-4">
            <p className="text-sm text-gray-200 leading-relaxed">
              {aiContent}
            </p>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowAiPreview(false)}
              className="cyber-button px-6 py-2"
            >
              重新生成
            </button>
            <button
              onClick={useAIContent}
              className="cyber-button primary px-6 py-2"
            >
              使用此内容
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
