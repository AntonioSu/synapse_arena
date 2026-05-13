import { db } from '../db/client';
import { zhihuAPI } from '../services/zhihu-api';

function pickZhihuLink(items: any[]): { url: string; type: string } | null {
  let questionUrl: string | null = null;
  let zhihuUrl: string | null = null;

  for (const item of items) {
    const raw = item.link_url || item.url || item.link || '';
    const url = raw.startsWith('http') ? raw : raw ? `https://www.zhihu.com${raw}` : '';
    if (!url) continue;

    const clean = url.split('?')[0];

    if (/zhihu\.com\/question\/\d+/.test(clean)) {
      questionUrl = clean;
      break;
    }
    if (!zhihuUrl && /zhihu\.com/.test(clean)) {
      zhihuUrl = clean;
    }
  }

  if (questionUrl) return { url: questionUrl, type: 'question' };
  if (zhihuUrl) return { url: zhihuUrl, type: 'zhihu_other' };
  return null;
}

async function main() {
  try {
    // Only fix topics that have non-zhihu links or no links
    const result = await db.query(
      `SELECT topic_id, title FROM topics
       WHERE status = 'active'
         AND (zhihu_link IS NULL OR zhihu_link = '' OR zhihu_link NOT LIKE '%zhihu.com%')
       ORDER BY created_at DESC`
    );

    console.log(`📋 Found ${result.rows.length} topics with non-zhihu or missing links\n`);

    let questionLinks = 0;
    let zhihuOther = 0;
    let fallback = 0;
    let errors = 0;

    for (const topic of result.rows) {
      const shortQuery = topic.title.replace(/[「」『』【】\s]+/g, ' ').substring(0, 30);
      try {
        const searchResult: any = await zhihuAPI.globalSearch(shortQuery, 10);
        const items = searchResult?.data?.list || searchResult?.data?.items || searchResult?.data || [];
        const arr = Array.isArray(items) ? items : [];

        const picked = pickZhihuLink(arr);

        let finalUrl: string;
        if (picked) {
          finalUrl = picked.url;
          if (picked.type === 'question') questionLinks++;
          else zhihuOther++;
          console.log(`✅ [${picked.type}] ${topic.title.substring(0, 30)}...  →  ${finalUrl}`);
        } else {
          finalUrl = `https://www.zhihu.com/search?type=content&q=${encodeURIComponent(topic.title)}`;
          fallback++;
          console.log(`🔍 [search] ${topic.title.substring(0, 30)}...  →  fallback search link`);
        }

        await db.query(`UPDATE topics SET zhihu_link = $1 WHERE topic_id = $2`, [finalUrl, topic.topic_id]);
        await new Promise(r => setTimeout(r, 500));
      } catch (err: any) {
        errors++;
        console.log(`❌ ${topic.title.substring(0, 30)}...  → error: ${err.message}`);
        // On error, set a search fallback link
        const fallbackUrl = `https://www.zhihu.com/search?type=content&q=${encodeURIComponent(topic.title)}`;
        await db.query(`UPDATE topics SET zhihu_link = $1 WHERE topic_id = $2`, [fallbackUrl, topic.topic_id]);
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    // Second pass: fix zhihu links that are NOT question links (zhuanlan etc.)
    const zhihuNonQuestion = await db.query(
      `SELECT topic_id, title FROM topics
       WHERE status = 'active'
         AND zhihu_link LIKE '%zhihu.com%'
         AND zhihu_link NOT LIKE '%zhihu.com/question/%'
         AND zhihu_link NOT LIKE '%zhihu.com/search%'
       ORDER BY created_at DESC`
    );

    if (zhihuNonQuestion.rows.length > 0) {
      console.log(`\n📋 Second pass: ${zhihuNonQuestion.rows.length} zhihu links that aren't question links\n`);

      for (const topic of zhihuNonQuestion.rows) {
        const shortQuery = topic.title.replace(/[「」『』【】\s]+/g, ' ').substring(0, 30);
        try {
          const searchResult: any = await zhihuAPI.globalSearch(shortQuery, 10);
          const items = searchResult?.data?.list || searchResult?.data?.items || searchResult?.data || [];
          const arr = Array.isArray(items) ? items : [];

          const picked = pickZhihuLink(arr);

          if (picked?.type === 'question') {
            await db.query(`UPDATE topics SET zhihu_link = $1 WHERE topic_id = $2`, [picked.url, topic.topic_id]);
            questionLinks++;
            console.log(`✅ [upgraded] ${topic.title.substring(0, 30)}...  →  ${picked.url}`);
          } else {
            const fallbackUrl = `https://www.zhihu.com/search?type=content&q=${encodeURIComponent(topic.title)}`;
            await db.query(`UPDATE topics SET zhihu_link = $1 WHERE topic_id = $2`, [fallbackUrl, topic.topic_id]);
            fallback++;
            console.log(`🔍 [fallback] ${topic.title.substring(0, 30)}...  →  search link`);
          }

          await new Promise(r => setTimeout(r, 500));
        } catch (err: any) {
          errors++;
          console.log(`❌ ${topic.title.substring(0, 30)}...  → error: ${err.message}`);
          await new Promise(r => setTimeout(r, 1000));
        }
      }
    }

    console.log(`\n🎉 Done!`);
    console.log(`  知乎问题链接: ${questionLinks}`);
    console.log(`  知乎其他链接: ${zhihuOther}`);
    console.log(`  搜索兜底链接: ${fallback}`);
    console.log(`  错误: ${errors}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal:', error);
    process.exit(1);
  }
}

main();
