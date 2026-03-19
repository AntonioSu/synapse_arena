import cron from 'node-cron';
import { zhihuAPI } from './zhihu-api';
import { openaiService } from './openai-service';
import { db } from '../db/client';
import { redisClient } from './redis-client';
import { v4 as uuidv4 } from 'uuid';

class TopicCrawlerService {
  async fetchAndProcessTopics() {
    try {
      console.log('🕷️  Fetching hot topics from Zhihu...');

      // 1. 获取知乎热榜
      const billboardData = await zhihuAPI.getBillboard(50, 24);
      const hotTopics = billboardData.data.list;

      console.log(`✅ Fetched ${hotTopics.length} hot topics`);

      // 缓存热榜数据
      await redisClient.setCachedHotTopics(hotTopics, 3600);

      // 2. AI筛选争议性话题
      console.log('🤖 AI selecting controversial topics...');
      const selectedTopics = await openaiService.selectControversialTopics(
        hotTopics.map((t) => ({
          title: t.title,
          body: t.body,
          heat_score: t.heat_score,
        }))
      );

      console.log(`✅ Selected ${selectedTopics.length} controversial topics`);

      // 3. 存入数据库
      const topicIds: string[] = [];
      for (const topic of selectedTopics.slice(0, 10)) {
        const topicId = uuidv4();
        await db.query(
          `INSERT INTO topics (topic_id, title, pro_stance, con_stance, heat_score, status)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            topicId,
            topic.title,
            topic.pro_stance,
            topic.con_stance,
            topic.heat_score || 0,
            'active',
          ]
        );

        // 初始化Redis战况
        await redisClient.setBattleState(topicId, {
          pro_count: 0,
          con_count: 0,
          pro_votes: 0,
          con_votes: 0,
          human_participants: 0,
          ai_judge_result: {
            pro_score: 50,
            con_score: 50,
            last_report: '战斗尚未开始',
          },
        });

        topicIds.push(topicId);
        console.log(`✅ Created topic: ${topic.title}`);
      }

      return topicIds;
    } catch (error) {
      console.error('❌ Topic crawling failed:', error);
      throw error;
    }
  }

  startCronJob() {
    // 每天早上8点执行
    cron.schedule('0 8 * * *', async () => {
      console.log('⏰ Cron job triggered: Fetching daily topics');
      try {
        await this.fetchAndProcessTopics();
      } catch (error) {
        console.error('Cron job failed:', error);
      }
    });

    console.log('✅ Topic crawler cron job started (daily at 8:00 AM)');
  }
}

export const topicCrawler = new TopicCrawlerService();
