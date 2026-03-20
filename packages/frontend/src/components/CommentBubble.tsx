'use client';

import ReactMarkdown from 'react-markdown';

interface Comment {
  comment_id: string;
  author_type: 'human' | 'npc';
  author_name: string;
  content: string;
  stance: 'pro' | 'con';
  created_at: string;
}

interface Props {
  comment: Comment;
}

function microHash(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0;
  return '0x' + ((h >>> 0) & 0xffff).toString(16).toUpperCase().padStart(4, '0');
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export default function CommentBubble({ comment }: Props) {
  const isPro = comment.stance === 'pro';
  const isHuman = comment.author_type === 'human';
  const hex = microHash(comment.comment_id);

  const borderColor = isHuman
    ? 'border-green-400/70'
    : isPro
    ? 'border-red-500/60'
    : 'border-cyan-500/60';

  const nameColor = isHuman
    ? 'text-green-400'
    : isPro
    ? 'text-red-400'
    : 'text-cyan-400';

  const textTint = isHuman ? 'text-gray-100' : 'text-gray-200';
  const glowClass = isHuman ? 'laser-glow-green' : '';
  const borderSide = isPro ? 'border-l-2' : 'border-r-2';
  const avatarOrder = isPro ? 'flex-row' : 'flex-row-reverse';
  const alignment = isPro ? 'items-start' : 'items-end';

  return (
    <article className={`flex flex-col ${alignment}`} aria-label={`${comment.author_name} 的发言`}>
      <div className={`max-w-[85%] sm:max-w-[75%] flex ${avatarOrder} gap-2 sm:gap-3`}>
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div
            className={`w-7 h-7 sm:w-8 sm:h-8 bg-gray-900 flex items-center justify-center
              text-[10px] font-mono ${nameColor} border border-white/10`}
            style={{
              clipPath: 'polygon(4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px), 0 4px)',
            }}
          >
            {comment.author_name[0]}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className={`flex items-center gap-2 mb-1 ${isPro ? '' : 'justify-end'}`}>
            <span className={`text-[11px] font-medium tracking-wide ${nameColor}`}>
              {comment.author_name}
            </span>
            <span className={`label-tag ${
              isHuman ? 'text-green-400/80 bg-green-400/10' : 'text-white/40 bg-white/[0.06]'
            }`}>
              {isHuman ? 'USER' : 'NPC'}
            </span>
            <span className="text-[8px] font-mono text-white/40">
              {formatTime(comment.created_at)}
            </span>
          </div>

          <div className={`py-2 px-3 ${borderSide} ${borderColor} ${glowClass} transition-colors`}>
            <div
              className={`text-[13px] ${textTint} leading-relaxed text-left
                prose prose-invert prose-sm max-w-none
                prose-blockquote:border-l-white/20 prose-blockquote:text-white/50
                prose-blockquote:not-italic prose-blockquote:text-[11px]
                prose-blockquote:my-1.5 prose-blockquote:py-0 prose-blockquote:pl-3
                prose-strong:text-white/90 prose-strong:font-semibold
                prose-p:my-0.5 prose-p:leading-relaxed`}
            >
              <ReactMarkdown>{comment.content}</ReactMarkdown>
            </div>
          </div>

          <div className={`flex items-center gap-2 mt-1 font-mono text-[8px] text-white/25 select-none ${isPro ? '' : 'justify-end'}`}>
            <span>HEX:{hex}</span>
            <span>·</span>
            <span>{isPro ? 'PRO' : 'CON'}</span>
            <span>·</span>
            <span>[TX_VERIFIED]</span>
          </div>
        </div>
      </div>
    </article>
  );
}
