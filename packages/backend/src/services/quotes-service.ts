import { db } from '../db/client';
import { redisClient } from './redis-client';
import { aiService } from './llm-service';

export interface FeaturedQuoteRow {
  content: string;
  stance: 'pro' | 'con';
}

export async function getFeaturedQuotesFromDb(topicId: string): Promise<FeaturedQuoteRow[]> {
  const r = await db.query<FeaturedQuoteRow>(
    `SELECT content, stance FROM topic_quotes
     WHERE topic_id = $1 AND is_featured = true
     ORDER BY created_at ASC`,
    [topicId]
  );
  return r.rows.map((row: FeaturedQuoteRow) => ({ content: row.content, stance: row.stance }));
}

/**
 * 把一批金句写入 topic_quotes：先把当前 featured 全部置 false，再把新的批量插入。
 * 三个调用方（routes/topics.ts、auto-maintenance、seed-featured-quotes）共用此实现。
 */
export async function saveFeaturedQuotes(
  topicId: string,
  quotes: FeaturedQuoteRow[]
): Promise<void> {
  if (quotes.length === 0) return;
  await db.query(`UPDATE topic_quotes SET is_featured = false WHERE topic_id = $1`, [topicId]);
  const placeholders: string[] = [];
  const params: any[] = [topicId];
  quotes.forEach((q, i) => {
    placeholders.push(`($1, $${i * 2 + 2}, $${i * 2 + 3}, true, 'llm')`);
    params.push(q.content, q.stance);
  });
  await db.query(
    `INSERT INTO topic_quotes (topic_id, content, stance, is_featured, generated_by)
     VALUES ${placeholders.join(', ')}`,
    params
  );
}

/**
 * 给一个话题提炼并写入金句。返回入库的条数；失败/无可用金句时返回 0。
 * 共用 LLM extractQuotes + saveFeaturedQuotes + Redis 缓存 三件套。
 */
export async function extractAndSaveFeaturedQuotes(opts: {
  topicId: string;
  topicTitle: string;
  proStance?: string;
  conStance?: string;
  comments: Array<{ content: string; stance: 'pro' | 'con'; author_name?: string; author_type?: string }>;
}): Promise<FeaturedQuoteRow[]> {
  const quotes = await aiService.extractQuotes({
    topicTitle: opts.topicTitle,
    proStance: opts.proStance,
    conStance: opts.conStance,
    comments: opts.comments,
  });
  if (quotes.length === 0) return [];
  await saveFeaturedQuotes(opts.topicId, quotes);
  await redisClient.setFeaturedQuotes(opts.topicId, quotes, 600);
  return quotes;
}
