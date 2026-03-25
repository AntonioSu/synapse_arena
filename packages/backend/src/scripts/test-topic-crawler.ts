import { topicCrawler } from '../services/topic-crawler';
import { db } from '../db/client';
import { redisClient } from '../services/redis-client';

async function testTopicCrawler() {
  try {
    console.log('\n🧪 Testing topic crawler with cold start...\n');

    // 执行话题抓取（会自动触发冷启动）
    const newTopicIds = await topicCrawler.fetchAndProcessTopics();

    if (newTopicIds.length === 0) {
      console.log('\n✅ No new topics created (all topics are duplicates or no topics fetched)\n');
    } else {
      console.log(`\n✅ Created ${newTopicIds.length} new topics with cold start\n`);

      // 验证每个新话题的 Redis 状态
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📊 Verification: Redis Battle States');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      for (const topicId of newTopicIds) {
        const topicResult = await db.query(
          `SELECT title FROM topics WHERE topic_id = $1`,
          [topicId]
        );
        const title = topicResult.rows[0]?.title || 'Unknown';

        const battleState = await redisClient.getBattleState(topicId);
        
        console.log(`📌 ${title}`);
        console.log(`   Topic ID: ${topicId}`);
        console.log(`   Pro Score: ${battleState?.pro_count || 0}`);
        console.log(`   Con Score: ${battleState?.con_count || 0}`);
        console.log(`   Status: ${battleState?.pro_count > 0 ? '✅ Initialized' : '❌ Not Initialized'}\n`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testTopicCrawler();
