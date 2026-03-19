'use client';

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
    <div className="cyber-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="text-[10px] text-cyan-500/50">
          // BATTLE_STATUS_MONITOR
        </div>
        <div className="text-xs text-cyan-500/50">
          {isHumanJudge ? '人类共识模式' : 'AI裁判模式'}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-8 mb-4 overflow-hidden bg-black/50 border border-cyan-400/20">
        <div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-red-500/50 to-red-500/80 
                     transition-all duration-500 ease-out"
          style={{ width: `${proPercentage}%` }}
        >
          <div className="absolute inset-0 bg-white/10 animate-scan" />
        </div>
        <div
          className="absolute right-0 top-0 h-full bg-gradient-to-l from-blue-500/50 to-blue-500/80 
                     transition-all duration-500 ease-out"
          style={{ width: `${conPercentage}%` }}
        >
          <div className="absolute inset-0 bg-white/10 animate-scan" />
        </div>

        {/* Center Line */}
        <div className="absolute left-1/2 top-0 w-[2px] h-full bg-cyan-400/50 transform -translate-x-1/2" />

        {/* Scores */}
        <div className="absolute inset-0 flex items-center justify-between px-4 text-xs font-bold">
          <span className="text-cyber-red text-glow">{battleState.pro_count}</span>
          <span className="text-cyber-blue text-glow">{battleState.con_count}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div className="text-center">
          <div className="text-cyber-red font-bold mb-1">正方</div>
          <div className="text-cyan-500/50">
            {isHumanJudge ? `${battleState.pro_votes} 票` : `${proPercentage.toFixed(1)}%`}
          </div>
        </div>
        <div className="text-center">
          <div className="text-cyber-blue font-bold mb-1">反方</div>
          <div className="text-cyan-500/50">
            {isHumanJudge ? `${battleState.con_votes} 票` : `${conPercentage.toFixed(1)}%`}
          </div>
        </div>
      </div>

      {/* AI Judge Report */}
      {battleState.ai_judge_result && (
        <div className="mt-4 p-3 bg-black/50 border-l-2 border-cyan-400">
          <div className="text-[10px] text-cyan-400 mb-1">
            [ AI战况播报 ]
          </div>
          <div className="text-sm text-gray-300">
            {battleState.ai_judge_result.last_report}
          </div>
        </div>
      )}
    </div>
  );
}
