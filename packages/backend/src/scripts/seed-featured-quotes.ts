import { db } from '../db/client';
import { aiService } from '../services/llm-service';
import { redisClient } from '../services/redis-client';

function readArg(name: string, fallback: number): number {
  const arg = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (!arg) return fallback;
  const n = parseInt(arg.split('=')[1], 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

const MIN_COMMENTS = readArg('min', 5);
const CONCURRENCY = readArg('concurrency', 2);
const FORCE = process.argv.includes('--force');

interface QuoteRow {
  content: string;
  stance: 'pro' | 'con';
}

async function saveQuotes(topicId: string, quotes: QuoteRow[]): Promise<void> {
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
    params,
  );
}

async function processTopic(topic: { topic_id: string; title: string; pro_stance: string; con_stance: string; cnt: number }) {
  const { topic_id, title, cnt } = topic;
  const tag = `[${topic_id.slice(0, 8)}]`;
  console.log(`${tag} 🔍 ${title.slice(0, 36)} (${cnt} comments) — extracting...`);
  try {
    const cR = await db.query(
      `SELECT content, stance, author_name, author_type
       FROM comments WHERE topic_id = $1
       ORDER BY created_at DESC LIMIT 60`,
      [topic_id],
    );

    const quotes = await aiService.extractQuotes({
      topicTitle: title,
      proStance: topic.pro_stance,
      conStance: topic.con_stance,
      comments: cR.rows,
    });

    if (quotes.length === 0) {
      console.warn(`${tag} ⚠️  LLM 未返回有效金句`);
      return { ok: false, count: 0 };
    }

    await saveQuotes(topic_id, quotes);
    await redisClient.setFeaturedQuotes(topic_id, quotes, 600);
    console.log(`${tag} ✅ saved ${quotes.length} quotes`);
    quotes.slice(0, 3).forEach((q) => console.log(`${tag}    [${q.stance}] ${q.content}`));
    return { ok: true, count: quotes.length };
  } catch (err) {
    console.error(`${tag} ❌ failed:`, err);
    return { ok: false, count: 0 };
  }
}

async function main() {
  console.log(`\n🚀 Seeding featured quotes (concurrency=${CONCURRENCY}, force=${FORCE})\n`);

  const filter = FORCE
    ? `WHERE t.status = 'active' GROUP BY t.topic_id HAVING COUNT(c.comment_id) >= ${MIN_COMMENTS}`
    : `WHERE t.status = 'active'
         AND NOT EXISTS (
           SELECT 1 FROM topic_quotes tq
           WHERE tq.topic_id = t.topic_id AND tq.is_featured = true
         )
       GROUP BY t.topic_id HAVING COUNT(c.comment_id) >= ${MIN_COMMENTS}`;

  const r = await db.query(`
    SELECT t.topic_id, t.title, t.pro_stance, t.con_stance, COUNT(c.comment_id)::int as cnt
    FROM topics t
    LEFT JOIN comments c ON c.topic_id = t.topic_id
    ${filter}
    ORDER BY cnt DESC
  `);

  const topics = r.rows;
  console.log(`Found ${topics.length} topic(s) needing quotes.\n`);
  if (topics.length === 0) {
    console.log('Nothing to do.');
    process.exit(0);
  }

  const results = { ok: 0, skipped: 0, totalQuotes: 0 };
  let cursor = 0;

  async function worker(workerId: number) {
    while (cursor < topics.length) {
      const idx = cursor++;
      const topic = topics[idx];
      const res = await processTopic(topic);
      if (res.ok) {
        results.ok += 1;
        results.totalQuotes += res.count;
      } else {
        results.skipped += 1;
      }
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, (_, i) => worker(i + 1));
  await Promise.all(workers);

  console.log(`\n📊 Done. ok=${results.ok}, skipped=${results.skipped}, total_quotes=${results.totalQuotes}\n`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
