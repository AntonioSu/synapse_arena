import Redis from 'ioredis';
import { config } from '../config';

class RedisClient {
  private client: Redis;

  constructor() {
    this.client = new Redis(config.redis.url, {
      maxRetriesPerRequest: null,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error', err);
    });

    this.client.on('connect', () => {
      console.log('✅ Connected to Redis');
    });
  }

  async getBattleState(topicId: string) {
    const key = `battle:${topicId}:state`;
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  async setBattleState(topicId: string, state: any) {
    const key = `battle:${topicId}:state`;
    await this.client.set(key, JSON.stringify(state), 'EX', 86400); // 24 hours
  }

  async updateBattleScore(
    topicId: string,
    updates: Partial<{
      pro_count: number;
      con_count: number;
      pro_votes: number;
      con_votes: number;
      human_participants: number;
      ai_judge_result: {
        pro_score: number;
        con_score: number;
        affirmative_summary: string;
        negative_summary: string;
        human_insight: string | null;
        current_winner: string;
        verdict_reason: string;
      };
    }>
  ) {
    const key = `battle:${topicId}:state`;
    const current = await this.getBattleState(topicId);
    const newState = { ...current, ...updates };
    await this.setBattleState(topicId, newState);
    return newState;
  }

  async getCachedHotTopics() {
    const key = 'zhihu:hot_topics';
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  async setCachedHotTopics(topics: any[], ttl = 3600) {
    const key = 'zhihu:hot_topics';
    await this.client.set(key, JSON.stringify(topics), 'EX', ttl);
  }

  async close() {
    await this.client.quit();
  }

  getClient() {
    return this.client;
  }
}

export const redisClient = new RedisClient();
