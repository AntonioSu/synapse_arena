import { db } from '../db/client';

async function main() {
  const totalRes = await db.query(`SELECT COUNT(*) as cnt FROM topics WHERE status='active'`);
  const emptyRes = await db.query(`
    SELECT COUNT(*) as cnt FROM topics t 
    WHERE t.status='active' 
    AND NOT EXISTS (SELECT 1 FROM comments c WHERE c.topic_id=t.topic_id)
  `);
  const withRes = await db.query(`
    SELECT COUNT(*) as cnt FROM topics t 
    WHERE t.status='active' 
    AND EXISTS (SELECT 1 FROM comments c WHERE c.topic_id=t.topic_id)
  `);
  console.log(`\n=== 话题状态 ===`);
  console.log(`总活跃话题: ${totalRes.rows[0].cnt}`);
  console.log(`已有对话: ${withRes.rows[0].cnt}`);
  console.log(`无对话: ${emptyRes.rows[0].cnt}`);

  const sampleEmpty = await db.query(`
    SELECT t.title FROM topics t 
    WHERE t.status='active' 
    AND NOT EXISTS (SELECT 1 FROM comments c WHERE c.topic_id=t.topic_id)
    ORDER BY t.created_at DESC
    LIMIT 10
  `);
  if (sampleEmpty.rows.length > 0) {
    console.log(`\n=== 无对话话题示例 ===`);
    sampleEmpty.rows.forEach((r: any) => console.log(`  - ${r.title}`));
  }

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
