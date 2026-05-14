import { db } from '../db/client';

export interface StanceComment {
  content: string;
  author_type: string;
  author_name: string;
}

/**
 * 拉取话题最近 N 条 stance=pro/con 的评论，按时间倒序。
 * judgement / rejudge / butterfly-effect / auto-maintenance 五处共用，参数完全一致。
 */
export async function fetchRecentStanceComments(
  topicId: string,
  stance: 'pro' | 'con',
  limit = 10
): Promise<StanceComment[]> {
  const r = await db.query<StanceComment>(
    `SELECT content, author_type, author_name
       FROM comments
      WHERE topic_id = $1 AND stance = $2
      ORDER BY created_at DESC
      LIMIT $3`,
    [topicId, stance, limit]
  );
  return r.rows;
}

/** 同时拉取正反方最近 N 条评论（仍走两条独立 SQL，但调用方只需一行）。 */
export async function fetchProConRecent(
  topicId: string,
  limit = 10
): Promise<{ pro: StanceComment[]; con: StanceComment[] }> {
  const [pro, con] = await Promise.all([
    fetchRecentStanceComments(topicId, 'pro', limit),
    fetchRecentStanceComments(topicId, 'con', limit),
  ]);
  return { pro, con };
}
