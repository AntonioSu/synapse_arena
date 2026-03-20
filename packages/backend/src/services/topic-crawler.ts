import cron from 'node-cron';
import { zhihuAPI } from './zhihu-api';
import { aiService } from './minimax-service';
import { db } from '../db/client';
import { redisClient } from './redis-client';
import { coldStartService } from './cold-start';
import { v4 as uuidv4 } from 'uuid';

class TopicCrawlerService {
  async fetchAndProcessTopics() {
    try {
      console.log('🕷️  Fetching hot topics from Zhihu billboard...');

      // 1. 获取知乎热榜前3个话题
      const billboardData = await zhihuAPI.getBillboard(3, 24);
      const hotTopics = billboardData.data.list;

      if (!hotTopics || hotTopics.length === 0) {
        console.log('⚠️  No hot topics fetched');
        return [];
      }

      console.log(`✅ Fetched ${hotTopics.length} hot topics from billboard`);

      // 缓存热榜数据
      await redisClient.setCachedHotTopics(hotTopics, 3600);

      // 2. AI筛选并生成可辩论的话题（正方 + 反方立场）
      console.log('🤖 AI selecting controversial topics and generating debate stances...');
      const selectedTopics = await aiService.selectControversialTopics(
        hotTopics.map((t) => ({
          title: t.title,
          body: t.body,
          heat_score: t.heat_score,
        }))
      );

      console.log(`✅ AI selected ${selectedTopics.length} controversial topics`);

      // 3. 多样性过滤：提取关键词，同一关键词的话题最多保留 2 个
      const filteredTopics = this.filterByDiversity(selectedTopics, 2);
      console.log(`🔀 After diversity filter: ${filteredTopics.length} topics (from ${selectedTopics.length})`);

      // 4. 检查现有话题数量
      const existingResult = await db.query(
        `SELECT COUNT(*) as count FROM topics WHERE status = 'active'`
      );
      const existingCount = parseInt(existingResult.rows[0]?.count || '0');
      console.log(`📊 Currently ${existingCount} active topics in database`);

      // 5. 存入数据库（补充新话题）
      const topicIds: string[] = [];
      for (const topic of filteredTopics) {
        // 检查是否已存在相似标题（精确匹配）
        const duplicateCheck = await db.query(
          `SELECT topic_id FROM topics WHERE title = $1`,
          [topic.title]
        );

        if (duplicateCheck.rows.length > 0) {
          console.log(`⏭️  Skipping duplicate topic: ${topic.title}`);
          continue;
        }

        // 检查是否已存在主题相似的话题（关键词匹配）
        const keywords = this.extractKeywords(topic.title);
        let tooSimilar = false;
        for (const kw of keywords) {
          const similarCheck = await db.query(
            `SELECT COUNT(*) as count FROM topics WHERE status = 'active' AND title LIKE $1`,
            [`%${kw}%`]
          );
          if (parseInt(similarCheck.rows[0]?.count || '0') >= 2) {
            console.log(`⏭️  Skipping topic (already 2+ similar in DB for "${kw}"): ${topic.title}`);
            tooSimilar = true;
            break;
          }
        }
        if (tooSimilar) continue;

        const validCategories = ['hot', 'controversial', 'tech', 'social', 'life'];
        const category = topic.category && validCategories.includes(topic.category) ? topic.category : 'hot';

        const topicId = uuidv4();
        await db.query(
          `INSERT INTO topics (topic_id, title, pro_stance, con_stance, heat_score, category, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            topicId,
            topic.title,
            topic.pro_stance,
            topic.con_stance,
            topic.heat_score || 0,
            category,
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
            affirmative_summary: '',
            negative_summary: '',
            human_insight: null,
            current_winner: 'TIE',
            verdict_reason: '战斗尚未开始',
          },
        });

        topicIds.push(topicId);
        console.log(`✅ Created topic: ${topic.title}`);
      }

      const finalCount = existingCount + topicIds.length;
      console.log(`📊 Total active topics: ${finalCount} (added ${topicIds.length})`);

      // 5. 为所有新话题启动冷启动（生成初始辩论并执行AI裁判）
      if (topicIds.length > 0) {
        console.log(`\n🥶 Starting cold start for ${topicIds.length} new topics...\n`);
        for (const topicId of topicIds) {
          try {
            await coldStartService.generateColdStartBattle(topicId, 20); // 20轮快速冷启动
          } catch (error) {
            console.error(`❌ Cold start failed for topic ${topicId}:`, error);
            // 继续处理下一个话题
          }
        }
        console.log(`\n✅ Cold start completed for all new topics\n`);
      }

      return topicIds;
    } catch (error) {
      console.error('❌ Topic crawling failed:', error);
      throw error;
    }
  }

  private extractKeywords(title: string): string[] {
    const stopWords = new Set(['的', '是否', '是不是', '能否', '应该', '是否应该', '是否能', '是否会', '还是', '怎么', '如何', '为什么', '有没有', '值得', '真的', '真正', '足够']);
    const cleaned = title.replace(/[？?！!，,。.、：:""''（）()【】\[\]]/g, ' ');
    const words = cleaned.split(/\s+/).filter(w => w.length >= 2 && !stopWords.has(w));
    const keywords: string[] = [];
    for (const w of words) {
      if (w.length >= 3 && !keywords.some(k => k.includes(w) || w.includes(k))) {
        keywords.push(w);
      }
    }
    return keywords.slice(0, 3);
  }

  private filterByDiversity(
    topics: Array<{ title: string; pro_stance: string; con_stance: string; heat_score: number; category?: string }>,
    maxPerKeyword: number
  ) {
    const keywordCount = new Map<string, number>();
    const result: typeof topics = [];

    for (const topic of topics) {
      const keywords = this.extractKeywords(topic.title);
      const dominated = keywords.some(kw => (keywordCount.get(kw) || 0) >= maxPerKeyword);

      if (dominated) {
        console.log(`🔀 Filtered out (diversity): ${topic.title}`);
        continue;
      }

      result.push(topic);
      for (const kw of keywords) {
        keywordCount.set(kw, (keywordCount.get(kw) || 0) + 1);
      }
    }

    return result;
  }

  startCronJob() {
    // 每天执行3次：早上8点、下午2点、晚上8点
    cron.schedule('0 8,14,20 * * *', async () => {
      console.log('⏰ Cron job triggered: Fetching daily topics');
      try {
        await this.fetchAndProcessTopics();
      } catch (error) {
        console.error('Cron job failed:', error);
      }
    });

    console.log('✅ Topic crawler cron job started (3 times daily: 8:00, 14:00, 20:00)');
  }
}

export const topicCrawler = new TopicCrawlerService();
