'use client';

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

export default function CommentBubble({ comment }: Props) {
  const isPro = comment.stance === 'pro';
  const isNPC = comment.author_type === 'npc';
  
  return (
    <div className={`flex ${isPro ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-[70%] ${isPro ? 'flex-row' : 'flex-row-reverse'} flex gap-3`}>
        {/* Avatar */}
        <div 
          className={`w-10 h-10 flex-shrink-0 border ${
            isPro ? 'border-cyber-red' : 'border-cyber-blue'
          } bg-black/50`}
          style={{
            clipPath: 'polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%)'
          }}
        >
          <div className="w-full h-full flex items-center justify-center text-xs">
            {comment.author_name[0]}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-sm font-bold ${
              isPro ? 'text-cyber-red' : 'text-cyber-blue'
            }`}>
              {comment.author_name}
            </span>
            {isNPC && (
              <span className="text-[10px] px-2 py-0.5 border border-cyan-400/30 text-cyan-400">
                NPC
              </span>
            )}
            <span className="text-[10px] text-cyan-500/50">
              {new Date(comment.created_at).toLocaleTimeString()}
            </span>
          </div>

          <div
            className={`p-3 bg-black/50 border-l-2 ${
              isPro ? 'border-cyber-red' : 'border-cyber-blue'
            } backdrop-blur-sm`}
          >
            <p className="text-sm text-gray-200 leading-relaxed">
              {comment.content}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
