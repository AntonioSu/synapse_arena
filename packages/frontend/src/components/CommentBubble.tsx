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
    ? 'border-green-400/60'
    : isPro
    ? 'border-red-500/40'
    : 'border-cyan-500/40';

  const nameColor = isHuman
    ? 'text-green-400/80'
    : isPro
    ? 'text-red-400/70'
    : 'text-cyan-400/70';

  const textTint = isHuman
    ? 'text-gray-200'
    : isPro
    ? 'text-gray-300'
    : 'text-gray-300';

  const glowClass = isHuman ? 'laser-glow-green' : '';

  const alignment = isPro ? 'items-start' : 'items-end';
  const borderSide = isPro ? 'border-l' : 'border-r';
  const avatarOrder = isPro ? 'flex-row' : 'flex-row-reverse';
  const textAlign = 'text-left';

  return (
    <div className={`flex flex-col ${alignment}`}>
      <div className={`max-w-[75%] flex ${avatarOrder} gap-3`}>
        {/* Minimal avatar */}
        <div className="flex-shrink-0 relative">
          <div
            className={`w-8 h-8 bg-black flex items-center justify-center
              text-[10px] font-mono ${nameColor} border border-white/8 grayscale`}
            style={{
              clipPath: 'polygon(4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px), 0 4px)',
            }}
          >
            {comment.author_name[0]}
          </div>
        </div>

        {/* Data block */}
        <div className="flex-1 min-w-0">
          {/* Header micro-typography */}
          <div className={`flex items-center gap-2 mb-1 ${isPro ? '' : 'justify-end'}`}>
            <span className={`text-[11px] font-medium tracking-wide ${nameColor}`}>
              {comment.author_name}
            </span>
            {!isHuman && (
              <span className="text-[8px] font-mono text-white/15 tracking-widest">NPC</span>
            )}
            {isHuman && (
              <span className="text-[8px] font-mono text-green-400/30 tracking-widest">USER</span>
            )}
            <span className="text-[8px] font-mono text-white/15">
              {formatTime(comment.created_at)}
            </span>
          </div>

          {/* Content: transparent bg, single border line with Markdown */}
          <div className={`py-2 px-3 ${borderSide} ${borderColor} ${glowClass}`}>
            <div
              className={`text-[13px] ${textTint} leading-relaxed ${textAlign}
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

          {/* Footer micro-data */}
          <div className={`flex items-center gap-2 mt-1 font-mono text-[8px] text-white/10 ${isPro ? '' : 'justify-end'}`}>
            <span>HEX:{hex}</span>
            <span>·</span>
            <span>{isPro ? 'PRO' : 'CON'}</span>
            <span>·</span>
            <span>[TX_VERIFIED]</span>
          </div>
        </div>
      </div>
    </div>
  );
}
