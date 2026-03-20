'use client';

import { motion } from 'framer-motion';

interface BattleState {
  pro_count: number;
  con_count: number;
  pro_votes: number;
  con_votes: number;
  human_participants?: number;
  ai_judge_result?: {
    pro_score: number;
    con_score: number;
    last_report: string;
  };
}

interface Props {
  battleState: BattleState;
}

export default function BattleProgress({ battleState }: Props) {
  const total = battleState.pro_count + battleState.con_count || 1;
  const proPercentage = (battleState.pro_count / total) * 100;
  const conPercentage = (battleState.con_count / total) * 100;
  const isHumanJudge = (battleState.human_participants || 0) >= 10;

  return (
    <section className="cyber-card p-4 sm:p-6" aria-label="battle status">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] text-cyan-500/60 font-mono select-none">
          {'// BATTLE_STATUS'}
        </span>
        <span className={`label-tag ${isHumanJudge ? 'text-green-400/90 bg-green-400/10' : 'text-cyan-400/80 bg-cyan-400/10'}`}>
          {isHumanJudge ? '\u4eba\u7c7b\u5171\u8bc6' : 'AI\u88c1\u5224'}
        </span>
      </div>

      <div
        className="relative h-8 sm:h-9 overflow-hidden bg-black/50 border border-cyan-400/20 rounded-sm"
        role="progressbar"
        aria-valuenow={proPercentage}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <motion.div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-red-600/60 to-red-500/80"
          initial={{ width: 0 }}
          animate={{ width: `${proPercentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
        <motion.div
          className="absolute right-0 top-0 h-full bg-gradient-to-l from-blue-600/60 to-blue-500/80"
          initial={{ width: 0 }}
          animate={{ width: `${conPercentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />

        <div className="absolute left-1/2 top-0 w-px h-full bg-cyan-400/30 -translate-x-1/2" />

        <div className="absolute inset-0 flex items-center justify-between px-3 sm:px-4">
          <span className="text-xs sm:text-sm font-bold text-cyber-red text-glow-sm">
            {battleState.pro_count}
          </span>
          <span className="text-[10px] text-white/50 font-mono">VS</span>
          <span className="text-xs sm:text-sm font-bold text-cyber-blue text-glow-sm">
            {battleState.con_count}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4 text-xs">
        <div className="text-center">
          <div className="text-cyber-red font-bold mb-0.5">{'\u6b63\u65b9'}</div>
          <div className="text-cyan-400/70 font-mono">
            {isHumanJudge ? `${battleState.pro_votes} \u7968` : `${proPercentage.toFixed(1)}%`}
          </div>
        </div>
        <div className="text-center">
          <div className="text-cyber-blue font-bold mb-0.5">{'\u53cd\u65b9'}</div>
          <div className="text-cyan-400/70 font-mono">
            {isHumanJudge ? `${battleState.con_votes} \u7968` : `${conPercentage.toFixed(1)}%`}
          </div>
        </div>
      </div>

      {battleState.ai_judge_result && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="mt-4 p-3 bg-black/40 border-l-2 border-cyan-400/60 rounded-r-sm"
        >
          <div className="text-[10px] text-cyan-400/80 mb-1 font-mono">
            {'[ AI\u6218\u51b5\u64ad\u62a5 ]'}
          </div>
          <p className="text-sm text-gray-100 leading-relaxed">
            {battleState.ai_judge_result.last_report}
          </p>
        </motion.div>
      )}
    </section>
  );
}
