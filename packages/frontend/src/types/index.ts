export interface AIJudgeResult {
  pro_score: number;
  con_score: number;
  affirmative_summary?: string;
  negative_summary?: string;
  human_insight?: string | null;
  current_winner?: string;
  verdict_reason?: string;
  last_report?: string;
}

export interface BattleState {
  pro_count: number;
  con_count: number;
  pro_votes: number;
  con_votes: number;
  human_participants?: number;
  ai_judge_result?: AIJudgeResult;
}

export interface Topic {
  topic_id: string;
  title: string;
  pro_stance: string;
  con_stance: string;
  category?: string;
  battle_state: BattleState;
}

export interface Comment {
  comment_id: string;
  author_type: 'human' | 'npc';
  author_id: string;
  author_name: string;
  content: string;
  stance: 'pro' | 'con';
  reply_to?: string;
  created_at: string;
}

export interface User {
  user_id: string;
  username: string;
  avatar_url: string;
  soft_memory: any;
}
