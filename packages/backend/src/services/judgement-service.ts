import { db } from '../db/client';
import { aiService } from './minimax-service';
import { redisClient } from './redis-client';

interface JudgeableComment {
  content: string;
  author_type?: string;
  author_name?: string;
}

interface JudgementOptions {
  topicId: string;
  topicTitle: string;
  proComments: JudgeableComment[];
  conComments: JudgeableComment[];
  broadcast?: (result: any) => void;
}

export async function performJudgement(opts: JudgementOptions) {
  const { topicId, topicTitle, proComments, conComments, broadcast } = opts;

  const judgement = await aiService.judgeDebate({ topicTitle, proComments, conComments });

  const judgeResult = {
    pro_score: judgement.pro_score,
    con_score: judgement.con_score,
    affirmative_summary: judgement.affirmative_summary,
    negative_summary: judgement.negative_summary,
    human_insight: judgement.human_insight,
    current_winner: judgement.current_winner,
    verdict_reason: judgement.verdict_reason,
  };

  await redisClient.updateBattleScore(topicId, {
    pro_count: judgement.pro_score,
    con_count: judgement.con_score,
    ai_judge_result: judgeResult,
  });

  await db.query(
    `INSERT INTO battle_states (topic_id, pro_score, con_score, judge_report)
     VALUES ($1, $2, $3, $4)`,
    [topicId, judgement.pro_score, judgement.con_score, judgement.verdict_reason]
  );

  broadcast?.(judgeResult);

  console.log(`⚖️  Judgement: Pro ${judgement.pro_score} - Con ${judgement.con_score}`);
  return judgeResult;
}
