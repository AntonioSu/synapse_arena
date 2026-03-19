'use client';

import { useEffect, useState, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { topicsAPI, commentsAPI } from '@/lib/api';
import { socketService } from '@/lib/socket';
import CommentBubble from './CommentBubble';
import CommentInput from './CommentInput';
import BattleProgress from './BattleProgress';

interface Topic {
  topic_id: string;
  title: string;
  battle_state: any;
}

interface Props {
  topic: Topic;
}

export default function BattleField({ topic }: Props) {
  const { comments, setComments, addComment, user } = useStore();
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    scrollToBottom();
  }, [comments]);

  const loadComments = async () => {
    try {
      setIsLoading(true);
      const response = await topicsAPI.getComments(topic.topic_id, 100);
      if (response.data.success) {
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
    
    socketService.onNewComment((comment) => {
      addComment(comment);
    });
    
    socketService.onBattleUpdate((state) => {
      // Update battle state
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="space-y-4">
      {/* Battle Progress Bar */}
      <BattleProgress battleState={topic.battle_state} />

      {/* Comments Area */}
      <div className="cyber-card p-6 min-h-[500px] max-h-[600px] overflow-y-auto">
        <div className="text-[10px] text-cyan-500/50 mb-4">
          // BATTLE_LOG_STREAM
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-cyber-blue animate-pulse-glow">
              [加载战场数据...]
            </div>
          </div>
        ) : comments.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center text-cyan-500/50">
              战场寂静无声...
              <br />
              <span className="text-xs">等待第一个发言者</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <CommentBubble key={comment.comment_id} comment={comment} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Comment Input */}
      {user && <CommentInput topicId={topic.topic_id} />}
      
      {!user && (
        <div className="cyber-card p-4 text-center">
          <div className="text-cyan-500/50 text-sm">
            登录后方可参与辩论
          </div>
        </div>
      )}
    </div>
  );
}
