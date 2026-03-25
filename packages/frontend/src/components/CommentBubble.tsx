'use client';

import ReactMarkdown from 'react-markdown';
import type { Comment } from '@/types';

interface Props {
  comment: Comment;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export default function CommentBubble({ comment }: Props) {
  const isPro = comment.stance === 'pro';
  const isHuman = comment.author_type === 'human';

  const borderColor = isHuman
    ? 'border-green-400'
    : isPro
    ? 'border-red-400'
    : 'border-cyan-400';

  const nameColor = isHuman
    ? 'text-green-600'
    : isPro
    ? 'text-red-500'
    : 'text-cyan-600';

  const glowClass = isHuman ? 'laser-glow-green' : '';
  const borderSide = isPro ? 'border-l-2' : 'border-r-2';
  const avatarOrder = isPro ? 'flex-row' : 'flex-row-reverse';
  const alignment = isPro ? 'items-start' : 'items-end';

  return (
    <article className={`flex flex-col ${alignment}`}>
      <div className={`max-w-[85%] sm:max-w-[75%] flex ${avatarOrder} gap-2 sm:gap-3`}>
        <div className="flex-shrink-0">
          <div
            className={`w-7 h-7 sm:w-8 sm:h-8 bg-gray-100 flex items-center justify-center
              text-[10px] font-mono ${nameColor} border border-gray-200`}
            style={{
              clipPath: 'polygon(4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px), 0 4px)',
            }}
          >
            {comment.author_name[0]}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className={`flex items-center gap-2 mb-1 ${isPro ? '' : 'justify-end'}`}>
            <span className={`text-[11px] font-medium tracking-wide ${nameColor}`}>
              {comment.author_name}
            </span>
            <span className={`label-tag ${
              isHuman ? 'text-green-600 bg-green-50' : 'text-gray-400 bg-gray-100'
            }`}>
              {isHuman ? 'USER' : 'NPC'}
            </span>
            <span className="text-[8px] font-mono text-gray-400">
              {formatTime(comment.created_at)}
            </span>
          </div>

          <div className={`py-2 px-3 ${borderSide} ${borderColor} ${glowClass} transition-colors bg-gray-50/50 rounded-r-sm`}>
            <div
              className="text-[13px] text-gray-800 leading-relaxed text-left
                prose prose-sm max-w-none
                prose-blockquote:border-l-gray-300 prose-blockquote:text-gray-500
                prose-blockquote:not-italic prose-blockquote:text-[11px]
                prose-blockquote:my-1.5 prose-blockquote:py-0 prose-blockquote:pl-3
                prose-strong:text-gray-900 prose-strong:font-semibold
                prose-p:my-0.5 prose-p:leading-relaxed"
            >
              <ReactMarkdown>{comment.content}</ReactMarkdown>
            </div>
          </div>

        </div>
      </div>
    </article>
  );
}
