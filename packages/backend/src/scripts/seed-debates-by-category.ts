import { db } from '../db/client';
import { aiService } from '../services/llm-service';
import { v4 as uuidv4 } from 'uuid';

/**
 * 并行刷库脚本：优先刷每个分类下 top 2 热度（且尚无对话）的话题。
 * 与 seed-debates.ts 并发运行；写入前 double-check 已有评论数避免重复。
 */
async function seedByCategory() {
  const ROUNDS = 5;

  const topicsResult = await db.query(`
    WITH ranked AS (
      SELECT t.topic_id, t.title, t.pro_stance, t.con_stance, t.background, t.category, t.heat_score,
             ROW_NUMBER() OVER (PARTITION BY t.category ORDER BY t.heat_score DESC, t.created_at DESC) AS rn
      FROM topics t
      WHERE t.status = 'active'
        AND NOT EXISTS (SELECT 1 FROM comments c WHERE c.topic_id = t.topic_id)
    )
    SELECT topic_id, title, pro_stance, con_stance, background, category, heat_score
    FROM ranked
    WHERE rn <= 2
    ORDER BY heat_score DESC
  `);

  const targetTopics = topicsResult.rows;
  console.log(`📊 Selected ${targetTopics.length} topics across categories (top 2 per category)`);
  targetTopics.forEach((t: any) => {
    console.log(`  [${t.category}] (热度:${t.heat_score}) ${t.title}`);
  });

  if (targetTopics.length === 0) {
    console.log('✅ All categories already covered.');
    process.exit(0);
  }

  const npcsResult = await db.query(`SELECT npc_id, name, system_prompt FROM npcs`);
  const npcs = npcsResult.rows;

  if (npcs.length === 0) {
    console.error('❌ No NPCs found! Please seed NPCs first.');
    process.exit(1);
  }

  for (const topic of targetTopics) {
    // double-check：另一路可能已经开始或完成
    const existing = await db.query(
      `SELECT COUNT(*)::int AS cnt FROM comments WHERE topic_id = $1`,
      [topic.topic_id]
    );
    if (existing.rows[0].cnt > 0) {
      console.log(`⏭️  Skip (already has comments): ${topic.title}`);
      continue;
    }

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🎯 [${topic.category}] ${topic.title}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    try {
      for (let round = 0; round < ROUNDS; round++) {
        const recentResult = await db.query(
          `SELECT author_name, content, stance FROM comments
           WHERE topic_id = $1 ORDER BY created_at DESC LIMIT 10`,
          [topic.topic_id]
        );

        const proNpc = npcs[Math.floor(Math.random() * npcs.length)];
        const conNpc = npcs[Math.floor(Math.random() * npcs.length)];

        const proContent = await aiService.generateNPCResponse({
          npcPrompt: proNpc.system_prompt,
          npcName: proNpc.name,
          topicTitle: topic.title,
          stance: 'pro',
          proStance: topic.pro_stance,
          conStance: topic.con_stance,
          topicBackground: topic.background,
          recentComments: recentResult.rows,
          replyTo: round === 0
            ? `请从正方立场发表你的开场观点`
            : `请继续从正方立场反驳对方观点`,
        });

        const proCommentId = uuidv4();
        await db.query(
          `INSERT INTO comments (comment_id, topic_id, author_type, author_id, author_name, content, stance, is_ai_generated)
           VALUES ($1, $2, 'npc', $3, $4, $5, 'pro', true)`,
          [proCommentId, topic.topic_id, proNpc.npc_id, proNpc.name, proContent]
        );
        console.log(`  ✅ Round ${round + 1} PRO: ${proNpc.name}`);

        await sleep(500);

        const conContent = await aiService.generateNPCResponse({
          npcPrompt: conNpc.system_prompt,
          npcName: conNpc.name,
          topicTitle: topic.title,
          stance: 'con',
          proStance: topic.pro_stance,
          conStance: topic.con_stance,
          topicBackground: topic.background,
          recentComments: [...recentResult.rows, { author_name: proNpc.name, content: proContent, stance: 'pro' }],
          replyTo: round === 0
            ? `请从反方立场发表你的开场观点`
            : `请继续从反方立场反驳对方观点`,
        });

        const conCommentId = uuidv4();
        await db.query(
          `INSERT INTO comments (comment_id, topic_id, author_type, author_id, author_name, content, stance, is_ai_generated)
           VALUES ($1, $2, 'npc', $3, $4, $5, 'con', true)`,
          [conCommentId, topic.topic_id, conNpc.npc_id, conNpc.name, conContent]
        );
        console.log(`  ✅ Round ${round + 1} CON: ${conNpc.name}`);

        await sleep(500);
      }

      console.log(`  🎉 Done! ${ROUNDS * 2} comments generated`);
    } catch (error: any) {
      console.error(`  ❌ Failed: ${error.message}`);
    }
  }

  console.log('\n✅ Category-priority pass done!');
  process.exit(0);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

seedByCategory().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
