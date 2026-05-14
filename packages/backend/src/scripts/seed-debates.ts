import { db } from '../db/client';
import { aiService } from '../services/llm-service';
import { v4 as uuidv4 } from 'uuid';

async function seedDebates() {

  const topicsResult = await db.query(`
    SELECT t.topic_id, t.title, t.pro_stance, t.con_stance, t.background
    FROM topics t
    WHERE t.status = 'active'
      AND NOT EXISTS (SELECT 1 FROM comments c WHERE c.topic_id = t.topic_id)
    ORDER BY t.created_at DESC
  `);

  const emptyTopics = topicsResult.rows;
  console.log(`Found ${emptyTopics.length} topics without debates`);

  if (emptyTopics.length === 0) {
    console.log('All topics already have debates!');
    process.exit(0);
  }

  const npcsResult = await db.query(`SELECT npc_id, name, system_prompt FROM npcs`);
  const npcs = npcsResult.rows;

  if (npcs.length === 0) {
    console.error('No NPCs found! Please seed NPCs first.');
    process.exit(1);
  }

  const ROUNDS = 5;

  for (const topic of emptyTopics) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🎯 ${topic.title}`);
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

  console.log('\n✅ All done!');
  process.exit(0);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

seedDebates().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
