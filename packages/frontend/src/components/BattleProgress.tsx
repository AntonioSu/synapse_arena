'use client';

import { motion } from 'framer-motion';
import type { BattleState } from '@/types';

interface Props {
  battleState: BattleState;
}

function WinnerBadge({ winner }: { winner: string }) {
  if (winner === 'TIE') {
    return <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-200 text-gray-600">DEADLOCK</span>;
  }
  const isAffirmative = winner === 'AFFIRMATIVE';
  return (
    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${isAffirmative ? 'bg-red-100 text-red-600' : 'bg-cyan-100 text-cyan-700'}`}>
      {isAffirmative ? '\u6b63\u65b9\u9886\u5148' : '\u53cd\u65b9\u9886\u5148'}
    </span>
  );
}

export default function BattleProgress({ battleState }: Props) {
  const total = battleState.pro_count + battleState.con_count || 1;
  const proPercentage = (battleState.pro_count / total) * 100;
  const conPercentage = (battleState.con_count / total) * 100;
  const isHumanJudge = (battleState.human_participants || 0) >= 10;
  const judge = battleState.ai_judge_result;

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

      {judge && (judge.verdict_reason || judge.last_report) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="mt-4 p-3 bg-cyan-50/80 border-l-2 border-cyan-400 rounded-r space-y-2.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-cyan-600 font-mono">
              {'[ AI\u6218\u51b5\u64ad\u62a5 ]'}
            </span>
            {judge.current_winner && <WinnerBadge winner={judge.current_winner} />}
          </div>

          {(judge.affirmative_summary || judge.negative_summary) && (
            <div className="grid grid-cols-2 gap-3">
              {judge.affirmative_summary && (
                <div className="text-xs">
                  <div className="text-red-500 font-bold mb-0.5 text-[10px] font-mono">{'\u6b63\u65b9\u652f\u70b9'}</div>
                  <p className="text-gray-600 leading-relaxed">{judge.affirmative_summary}</p>
                </div>
              )}
              {judge.negative_summary && (
                <div className="text-xs">
                  <div className="text-cyan-600 font-bold mb-0.5 text-[10px] font-mono">{'\u53cd\u65b9\u652f\u70b9'}</div>
                  <p className="text-gray-600 leading-relaxed">{judge.negative_summary}</p>
                </div>
              )}
            </div>
          )}

          {judge.human_insight && (
            <div className="text-xs bg-amber-50/80 border border-amber-200/60 rounded px-2 py-1.5">
              <span className="text-amber-600 font-mono text-[10px] font-bold">{'\u4eba\u7c7b\u53d8\u91cf'} </span>
              <span className="text-gray-600">{judge.human_insight}</span>
            </div>
          )}

          <p className="text-xs text-gray-500 leading-relaxed border-t border-gray-200/60 pt-2 font-mono">
            {judge.verdict_reason || judge.last_report}
          </p>
        </motion.div>
      )}
    </section>
  );
}
