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
      <div
        className="relative h-9 sm:h-10 overflow-hidden bg-gray-100 border border-gray-200 rounded"
        role="progressbar"
        aria-valuenow={proPercentage}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <motion.div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-red-400 to-red-500"
          initial={{ width: 0 }}
          animate={{ width: `${proPercentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
        <motion.div
          className="absolute right-0 top-0 h-full bg-gradient-to-l from-cyan-400 to-cyan-500"
          initial={{ width: 0 }}
          animate={{ width: `${conPercentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />

        <div className="absolute left-1/2 top-0 w-px h-full bg-white/60 -translate-x-1/2" />

        <div className="absolute inset-0 flex items-center justify-between px-3 sm:px-4">
          <span className="text-sm font-bold text-white drop-shadow">
            {battleState.pro_count}
          </span>
          <span className="text-[10px] text-gray-500 font-mono bg-white/70 px-1.5 py-0.5 rounded">VS</span>
          <span className="text-sm font-bold text-white drop-shadow">
            {battleState.con_count}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4 text-xs">
        <div className="text-center">
          <div className="text-red-500 font-bold mb-0.5">{'\u6b63\u65b9'}</div>
          <div className="text-gray-500 font-mono">
            {isHumanJudge ? `${battleState.pro_votes} \u7968` : `${proPercentage.toFixed(1)}%`}
          </div>
        </div>
        <div className="text-center">
          <div className="text-cyan-600 font-bold mb-0.5">{'\u53cd\u65b9'}</div>
          <div className="text-gray-500 font-mono">
            {isHumanJudge ? `${battleState.con_votes} \u7968` : `${conPercentage.toFixed(1)}%`}
          </div>
        </div>
      </div>

      {battleState.ai_judge_result && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="mt-4 p-3 bg-cyan-50/80 border-l-2 border-cyan-400 rounded-r"
        >
          <div className="text-[10px] text-cyan-600 mb-1 font-mono">
            {'[ AI\u6218\u51b5\u64ad\u62a5 ]'}
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">
            {battleState.ai_judge_result.last_report}
          </p>
        </motion.div>
      )}
    </section>
  );
}
