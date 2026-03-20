import { db } from '../db/client';
import { coldStartService } from '../services/cold-start';
import { redisClient } from '../services/redis-client';

async function main() {
  try {
    const rounds = parseInt(process.argv[2] || '10', 10);
    console.log(`\n🚀 Starting cold start with ${rounds} rounds per topic...\n`);

    const result = await db.query<{ topic_id: string; title: string }>(
      `SELECT topic_id, title FROM topics WHERE status = 'active' ORDER BY created_at`
    );

    const topics = result.rows;
    console.log(`📋 Found ${topics.length} active topics\n`);

    for (const topic of topics) {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`🎯 Topic: ${topic.title}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

      const existingComments = await db.query(
        `SELECT count(*) as cnt FROM comments WHERE topic_id = $1`,
        [topic.topic_id]
      );

      if (parseInt(existingComments.rows[0].cnt) > 0) {
        console.log(`⏭️  Topic already has comments, skipping...`);
        continue;
      }

      await coldStartService.generateColdStartBattle(topic.topic_id, rounds);

      await redisClient.setBattleState(topic.topic_id, {
        pro_count: 0,
        con_count: 0,
        pro_votes: 0,
        con_votes: 0,
        human_participants: 0,
        ai_judge_result: {
          pro_score: 50,
          con_score: 50,
          affirmative_summary: '',
          negative_summary: '',
          human_insight: null,
          current_winner: 'TIE',
          verdict_reason: '战斗刚刚开始',
        },
      });

      console.log(`✅ Cold start + Redis init done for: ${topic.title}\n`);
    }

    const commentCount = await db.query(`SELECT count(*) as cnt FROM comments`);
    console.log(`\n🎉 All done! Total comments in DB: ${commentCount.rows[0].cnt}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Cold start failed:', error);
    process.exit(1);
  }
}

main();
