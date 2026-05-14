/**
 * 删除所有 zhihu_link 仍然是 /search?... 兜底搜索链接的话题。
 * 关联的 comments / battle_states / topic_quotes / user_votes 会通过 ON DELETE CASCADE 一起清理。
 *
 * 用法:
 *   DRY_RUN=1 npx tsx src/scripts/delete-search-link-topics.ts  # 只列出
 *   npx tsx src/scripts/delete-search-link-topics.ts             # 真删
 */
import { db } from '../db/client';

const DRY_RUN = process.env.DRY_RUN === '1';

async function main() {
  const targets = await db.query<{ topic_id: string; title: string; zhihu_link: string }>(
    `SELECT topic_id, title, zhihu_link
     FROM topics
     WHERE zhihu_link ~ '/search\\?'
     ORDER BY created_at DESC`,
  );

  console.log(`📋 待删除话题数: ${targets.rows.length}`);
  for (const t of targets.rows) {
    const counts = await db.query<{ comments: number; battles: number; quotes: number; votes: number }>(
      `SELECT
         (SELECT COUNT(*) FROM comments       WHERE topic_id = $1)::int AS comments,
         (SELECT COUNT(*) FROM battle_states  WHERE topic_id = $1)::int AS battles,
         (SELECT COUNT(*) FROM topic_quotes   WHERE topic_id = $1)::int AS quotes,
         (SELECT COUNT(*) FROM user_votes     WHERE topic_id = $1)::int AS votes
      `,
      [t.topic_id],
    );
    const c = counts.rows[0];
    console.log(`  • ${t.title}`);
    console.log(`      link=${t.zhihu_link}`);
    console.log(`      cascade -> comments=${c.comments} battle_states=${c.battles} quotes=${c.quotes} votes=${c.votes}`);
  }

  if (DRY_RUN) {
    console.log('\n🔧 DRY_RUN=1，不执行删除');
    await db.close();
    return;
  }

  if (targets.rows.length === 0) {
    console.log('✅ 没有需要删除的话题');
    await db.close();
    return;
  }

  const result = await db.query(`DELETE FROM topics WHERE zhihu_link ~ '/search\\?' RETURNING topic_id`);
  console.log(`\n🗑️  实际删除话题数: ${result.rowCount}`);

  const remaining = await db.query<{ kind: string; c: number }>(`
    SELECT
      CASE
        WHEN zhihu_link ~ '/search\\?'       THEN 'search'
        WHEN zhihu_link ~ '/question/[0-9]+' THEN 'question'
        WHEN zhihu_link IS NULL OR zhihu_link = '' THEN 'empty'
        ELSE 'other'
      END AS kind,
      COUNT(*)::int AS c
    FROM topics
    GROUP BY 1
    ORDER BY c DESC
  `);
  console.log('\n========== 当前 topics 表链接分布 ==========');
  for (const r of remaining.rows) console.log(`  ${r.kind.padEnd(12)} ${r.c}`);

  await db.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
