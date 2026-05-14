import { db } from '../db/client';

async function main() {
  const total = await db.query(`SELECT COUNT(*)::int AS c FROM topics`);
  const withLink = await db.query(
    `SELECT COUNT(*)::int AS c FROM topics WHERE zhihu_link IS NOT NULL AND zhihu_link <> ''`,
  );

  const buckets = await db.query<{
    kind: string;
    c: number;
  }>(`
    SELECT
      CASE
        WHEN zhihu_link IS NULL OR zhihu_link = '' THEN 'empty'
        WHEN zhihu_link ~ '/search\\?'                          THEN 'search'
        WHEN zhihu_link ~ '/question/[0-9]+/answer/[0-9]+'      THEN 'answer'
        WHEN zhihu_link ~ '/question/[0-9]+'                    THEN 'question'
        WHEN zhihu_link ~ 'zhuanlan\\.zhihu\\.com/p/'           THEN 'zhuanlan'
        WHEN zhihu_link ~ '/people/'                            THEN 'people'
        WHEN zhihu_link ~ '/pin/'                               THEN 'pin'
        WHEN zhihu_link ~ '/topic/'                             THEN 'topic'
        WHEN zhihu_link ~ '/collection/'                        THEN 'collection'
        WHEN zhihu_link ~ '/api/'                               THEN 'api'
        WHEN zhihu_link ~ '^https?://'                          THEN 'other_url'
        ELSE 'other'
      END AS kind,
      COUNT(*)::int AS c
    FROM topics
    GROUP BY 1
    ORDER BY c DESC
  `);

  const totalCount = total.rows[0].c;
  const withLinkCount = withLink.rows[0].c;

  console.log('========== 知乎链接统计 ==========');
  console.log(`话题总数: ${totalCount}`);
  console.log(`有 zhihu_link 的话题: ${withLinkCount} (${((withLinkCount / totalCount) * 100).toFixed(2)}%)`);
  console.log(`无 zhihu_link 的话题: ${totalCount - withLinkCount} (${(((totalCount - withLinkCount) / totalCount) * 100).toFixed(2)}%)`);
  console.log('');
  console.log('========== 链接类型分布 ==========');
  console.log('类型'.padEnd(14) + '数量'.padEnd(10) + '占总话题比'.padEnd(14) + '占有链接比');
  for (const row of buckets.rows) {
    const pct = ((row.c / totalCount) * 100).toFixed(2) + '%';
    const pctWith = withLinkCount > 0 && row.kind !== 'empty'
      ? ((row.c / withLinkCount) * 100).toFixed(2) + '%'
      : '-';
    console.log(row.kind.padEnd(14) + String(row.c).padEnd(10) + pct.padEnd(14) + pctWith);
  }

  console.log('');
  console.log('========== 各类型样本 (最多 3 条) ==========');
  for (const row of buckets.rows) {
    if (row.kind === 'empty') continue;
    const samples = await db.query<{ title: string; zhihu_link: string }>(
      `
        SELECT title, zhihu_link FROM topics
        WHERE
          CASE
            WHEN zhihu_link IS NULL OR zhihu_link = '' THEN 'empty'
            WHEN zhihu_link ~ '/search\\?'                          THEN 'search'
            WHEN zhihu_link ~ '/question/[0-9]+/answer/[0-9]+'      THEN 'answer'
            WHEN zhihu_link ~ '/question/[0-9]+'                    THEN 'question'
            WHEN zhihu_link ~ 'zhuanlan\\.zhihu\\.com/p/'           THEN 'zhuanlan'
            WHEN zhihu_link ~ '/people/'                            THEN 'people'
            WHEN zhihu_link ~ '/pin/'                               THEN 'pin'
            WHEN zhihu_link ~ '/topic/'                             THEN 'topic'
            WHEN zhihu_link ~ '/collection/'                        THEN 'collection'
            WHEN zhihu_link ~ '/api/'                               THEN 'api'
            WHEN zhihu_link ~ '^https?://'                          THEN 'other_url'
            ELSE 'other'
          END = $1
        LIMIT 3
      `,
      [row.kind],
    );
    console.log(`\n--- ${row.kind} ---`);
    for (const s of samples.rows) {
      console.log(`  • ${s.title?.slice(0, 60)} -> ${s.zhihu_link}`);
    }
  }

  await db.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
