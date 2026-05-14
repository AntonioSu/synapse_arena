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
  const displayName = comment.author_name || (isHuman ? '匿名观众' : 'NPC');
  const avatarChar = displayName[0] || '?';

  const nameColor = isHuman
    ? 'text-green-600'
    : isPro
    ? 'text-cyan-600'
    : 'text-rose-500';

  const bubbleBg = isHuman
    ? 'bg-green-50'
    : isPro
    ? 'bg-cyan-50/60'
    : 'bg-rose-50/60';

  const arrowClass = isPro ? 'chat-arrow-left' : 'chat-arrow-right';
  const arrowColor = isHuman
    ? '#f0fdf4'
    : isPro
    ? 'rgba(236,254,255,0.6)'
    : 'rgba(255,241,242,0.6)';

  const avatarOrder = isPro ? 'flex-row' : 'flex-row-reverse';
  const alignment = isPro ? 'items-start' : 'items-end';

  const proseKeywordStyle = isPro
    ? 'prose-strong:text-cyan-700 prose-strong:font-semibold'
    : 'prose-strong:text-rose-600 prose-strong:font-semibold';

  return (
    <article className={`flex flex-col ${alignment}`}>
      <div className={`max-w-[85%] sm:max-w-[75%] flex ${avatarOrder} gap-2 sm:gap-3 items-start`}>
        <div className="flex-shrink-0 mt-0.5">
          <div
            className={`w-9 h-9 sm:w-10 sm:h-10 bg-gray-100 flex items-center justify-center
              text-xs font-mono ${nameColor} border border-gray-200 rounded-sm`}
          >
            {avatarChar}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className={`flex items-center gap-2 mb-1 ${isPro ? '' : 'justify-end'}`}>
            <span className={`text-[11px] font-medium ${nameColor}`}>
              {displayName}
            </span>
            <span className={`label-tag ${
              isHuman ? 'text-green-600 bg-green-50' : 'text-gray-400 bg-gray-100'
            }`}>
              {isHuman ? 'USER' : 'NPC'}
            </span>
          </div>

          <div className="relative">
            <div
              className={arrowClass}
              style={{ '--arrow-color': arrowColor } as React.CSSProperties}
            />
            <div className={`relative rounded-md py-2.5 px-3.5 ${bubbleBg} border border-gray-100`}>
              <div
                className={`text-[13px] text-gray-800 leading-relaxed text-left
                  prose prose-sm max-w-none
                  prose-blockquote:border-l-gray-300 prose-blockquote:text-gray-500
                  prose-blockquote:not-italic prose-blockquote:text-[11px]
                  prose-blockquote:my-1.5 prose-blockquote:py-0 prose-blockquote:pl-3
                  ${proseKeywordStyle}
                  prose-p:my-0.5 prose-p:leading-relaxed`}
              >
                <ReactMarkdown>{comment.content}</ReactMarkdown>
              </div>
            </div>
          </div>

          <div className={`mt-1 ${isPro ? '' : 'text-right'}`}>
            <span className="text-[9px] font-mono text-gray-400">
              {formatTime(comment.created_at)}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
