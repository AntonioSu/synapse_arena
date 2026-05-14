/**
 * 把 zhihu_link 形如 https://www.zhihu.com/search?type=content&q=...
 * 的兜底搜索链接，尽量替换为真实的 /question/{id} 链接。
 *
 * 用法:
 *   npx tsx src/scripts/upgrade-search-to-question-links.ts          # 实际写库
 *   DRY_RUN=1 npx tsx src/scripts/upgrade-search-to-question-links.ts # 只打印不改库
 */
import { db } from '../db/client';
import { zhihuAPI } from '../services/zhihu-api';

const DRY_RUN = process.env.DRY_RUN === '1';
const SLEEP_MS = Number(process.env.SLEEP_MS ?? 500);

function pickQuestionUrl(items: any[]): string | null {
  for (const item of items) {
    const raw = item.link_url || item.url || item.link || '';
    const url = raw.startsWith('http') ? raw : raw ? `https://www.zhihu.com${raw}` : '';
    if (!url) continue;
    const clean = url.split('?')[0];
    const m = clean.match(/zhihu\.com\/question\/(\d+)/);
    if (m) return `https://www.zhihu.com/question/${m[1]}`;
  }
  return null;
}

function extractSearchQuery(zhihuLink: string): string | null {
  try {
    const u = new URL(zhihuLink);
    const q = u.searchParams.get('q');
    return q ? decodeURIComponent(q).replace(/\+/g, ' ').trim() : null;
  } catch {
    return null;
  }
}

function cleanTitleForSearch(title: string): string {
  return title
    .replace(/[「」『』【】"""'']/g, ' ')
    .replace(/\s*\/\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function trySearchOnce(query: string): Promise<string | null> {
  const result: any = await zhihuAPI.globalSearch(query, 10);
  const items = result?.data?.list || result?.data?.items || result?.data || [];
  const arr = Array.isArray(items) ? items : [];
  return pickQuestionUrl(arr);
}

async function findQuestionUrl(title: string, oldLink: string): Promise<string | null> {
  const candidates: string[] = [];
  const fromUrl = extractSearchQuery(oldLink);
  if (fromUrl) candidates.push(fromUrl);

  const cleaned = cleanTitleForSearch(title);
  if (cleaned && !candidates.includes(cleaned)) candidates.push(cleaned);

  const short = cleaned.split(/[，,。?？!！；;]/)[0]?.slice(0, 24).trim();
  if (short && !candidates.includes(short)) candidates.push(short);

  for (const q of candidates) {
    try {
      const url = await trySearchOnce(q);
      if (url) return url;
      await new Promise((r) => setTimeout(r, SLEEP_MS));
    } catch (err: any) {
      console.log(`   ⚠️ search "${q}" failed: ${err.message}`);
      await new Promise((r) => setTimeout(r, SLEEP_MS));
    }
  }
  return null;
}

async function main() {
  const result = await db.query<{ topic_id: string; title: string; zhihu_link: string }>(
    `SELECT topic_id, title, zhihu_link
     FROM topics
     WHERE zhihu_link ~ '/search\\?'
     ORDER BY heat_score DESC NULLS LAST, created_at DESC`,
  );

  console.log(`📋 待升级的搜索链接话题数: ${result.rows.length}`);
  if (DRY_RUN) console.log('🔧 DRY_RUN=1，仅试搜不写库\n');

  let upgraded = 0;
  let kept = 0;
  let errors = 0;

  for (let i = 0; i < result.rows.length; i++) {
    const topic = result.rows[i];
    const idx = `(${i + 1}/${result.rows.length})`;
    try {
      const questionUrl = await findQuestionUrl(topic.title, topic.zhihu_link);
      if (questionUrl) {
        console.log(`${idx} ✅ ${topic.title.slice(0, 36)}`);
        console.log(`        OLD: ${topic.zhihu_link}`);
        console.log(`        NEW: ${questionUrl}`);
        if (!DRY_RUN) {
          await db.query(`UPDATE topics SET zhihu_link = $1, updated_at = NOW() WHERE topic_id = $2`, [
            questionUrl,
            topic.topic_id,
          ]);
        }
        upgraded++;
      } else {
        console.log(`${idx} ⏸️  保留 (未找到问题链接) — ${topic.title.slice(0, 36)}`);
        kept++;
      }
    } catch (err: any) {
      errors++;
      console.log(`${idx} ❌ ${topic.title.slice(0, 36)} - ${err.message}`);
    }
    await new Promise((r) => setTimeout(r, SLEEP_MS));
  }

  console.log('\n========== 升级结果 ==========');
  console.log(`成功升级为 question 链接: ${upgraded}`);
  console.log(`保留搜索链接 (无匹配):    ${kept}`);
  console.log(`错误:                     ${errors}`);

  if (!DRY_RUN) {
    const stats = await db.query<{ kind: string; c: number }>(`
      SELECT
        CASE
          WHEN zhihu_link ~ '/search\\?'           THEN 'search'
          WHEN zhihu_link ~ '/question/[0-9]+'     THEN 'question'
          ELSE 'other'
        END AS kind,
        COUNT(*)::int AS c
      FROM topics
      GROUP BY 1
      ORDER BY c DESC
    `);
    console.log('\n========== 当前 topics 表链接分布 ==========');
    for (const r of stats.rows) console.log(`  ${r.kind.padEnd(12)} ${r.c}`);
  }

  await db.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
