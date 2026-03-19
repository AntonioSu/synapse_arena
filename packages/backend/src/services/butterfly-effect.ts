import { Queue, Worker, Job } from 'bullmq';
import { redisClient } from './redis-client';
import { db } from '../db/client';
import { aiService } from './minimax-service';
import { v4 as uuidv4 } from 'uuid';
import { io } from '../index';

interface ButterflyJobData {
  trigger_comment_id: string;
  topic_id: string;
  user_stance: 'pro' | 'con';
  rounds: number;
}

class ButterflyEffectService {
  private queue: Queue;
  private worker: Worker;

  constructor() {
    const connection = redisClient.getClient();

    // 创建队列
    this.queue = new Queue('butterfly-effect', { connection });

    // 创建Worker处理任务
    this.worker = new Worker(
      'butterfly-effect',
      async (job: Job<ButterflyJobData>) => {
        await this.processButterflyEffect(job.data);
      },
      { connection }
    );

    this.worker.on('completed', (job) => {
      console.log(`✅ Butterfly effect completed for job ${job.id}`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`❌ Butterfly effect failed for job ${job?.id}:`, err);
    });
  }

  async triggerButterflyEffect(data: ButterflyJobData) {
    await this.queue.add('butterfly-response', data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });
  }

  private async processButterflyEffect(data: ButterflyJobData) {
    const { trigger_comment_id, topic_id, user_stance, rounds } = data;

    console.log(`🦋 Starting butterfly effect for comment ${trigger_comment_id}`);

    // 获取话题信息
    const topicResult = await db.query(
      `SELECT title FROM topics WHERE topic_id = $1`,
      [topic_id]
    );
    
    if (topicResult.rows.length === 0) {
      throw new Error(`Topic ${topic_id} not found`);
    }

    const topicTitle = topicResult.rows[0].title;

    // 获取触发评论
    const triggerCommentResult = await db.query(
      `SELECT content FROM comments WHERE comment_id = $1`,
      [trigger_comment_id]
    );

    const triggerContent = triggerCommentResult.rows[0]?.content || '';

    // 执行10轮响应
    for (let round = 0; round < rounds; round++) {
      console.log(`Round ${round + 1}/${rounds}`);

      // 获取最近的评论上下文
      const recentCommentsResult = await db.query(
        `SELECT author_name, content, stance FROM comments 
         WHERE topic_id = $1 
         ORDER BY created_at DESC 
         LIMIT 10`,
        [topic_id]
      );

      const recentComments = recentCommentsResult.rows;

      // Step 1: 敌方NPC反击 (3秒内)
      await this.generateEnemyResponse(
        topic_id,
        topicTitle,
        user_stance === 'pro' ? 'con' : 'pro',
        recentComments,
        triggerContent
      );

      // 短暂延迟模拟思考
      await this.sleep(1000);

      // Step 2: 友方NPC支援 (5秒内)
      await this.generateAllyResponse(
        topic_id,
        topicTitle,
        user_stance,
        recentComments,
        triggerContent
      );

      // Step 3: 每2轮进行一次AI裁决
      if ((round + 1) % 2 === 0) {
        await this.performJudgement(topic_id, topicTitle);
      }

      // 短暂延迟
      await this.sleep(500);
    }

    console.log(`✅ Butterfly effect completed for ${topic_id}`);
  }

  private async generateEnemyResponse(
    topicId: string,
    topicTitle: string,
    stance: 'pro' | 'con',
    recentComments: any[],
    triggerContent: string
  ) {
    // 从对立阵营随机选择NPC
    const npcResult = await db.query(
      `SELECT npc_id, name, system_prompt FROM npcs ORDER BY RANDOM() LIMIT 1`
    );

    if (npcResult.rows.length === 0) return;

    const npc = npcResult.rows[0];

    // 生成反击内容
    const content = await aiService.generateNPCResponse({
      npcPrompt: npc.system_prompt,
      topicTitle,
      stance,
      recentComments,
      replyTo: `用户刚说了：${triggerContent}，你需要从${stance === 'pro' ? '正' : '反'}方立场犀利反驳`,
    });

    // 存入数据库
    const commentId = uuidv4();
    await db.query(
      `INSERT INTO comments (comment_id, topic_id, author_type, author_id, author_name, content, stance, is_ai_generated)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [commentId, topicId, 'npc', npc.npc_id, npc.name, content, stance, true]
    );

    // 通过WebSocket推送
    io.to(`battle:${topicId}`).emit('new_comment', {
      comment_id: commentId,
      author_type: 'npc',
      author_id: npc.npc_id,
      author_name: npc.name,
      content,
      stance,
      created_at: new Date().toISOString(),
    });

    console.log(`⚔️  Enemy response: ${npc.name} (${stance})`);
  }

  private async generateAllyResponse(
    topicId: string,
    topicTitle: string,
    stance: 'pro' | 'con',
    recentComments: any[],
    triggerContent: string
  ) {
    // 从同阵营随机选择NPC
    const npcResult = await db.query(
      `SELECT npc_id, name, system_prompt FROM npcs ORDER BY RANDOM() LIMIT 1`
    );

    if (npcResult.rows.length === 0) return;

    const npc = npcResult.rows[0];

    // 生成支援内容
    const content = await aiService.generateNPCResponse({
      npcPrompt: npc.system_prompt,
      topicTitle,
      stance,
      recentComments,
      replyTo: `用户刚说了：${triggerContent}，你需要肯定并补充观点`,
    });

    // 存入数据库
    const commentId = uuidv4();
    await db.query(
      `INSERT INTO comments (comment_id, topic_id, author_type, author_id, author_name, content, stance, is_ai_generated)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [commentId, topicId, 'npc', npc.npc_id, npc.name, content, stance, true]
    );

    // 通过WebSocket推送
    io.to(`battle:${topicId}`).emit('new_comment', {
      comment_id: commentId,
      author_type: 'npc',
      author_id: npc.npc_id,
      author_name: npc.name,
      content,
      stance,
      created_at: new Date().toISOString(),
    });

    console.log(`🤝 Ally response: ${npc.name} (${stance})`);
  }

  private async performJudgement(topicId: string, topicTitle: string) {
    const proCommentsResult = await db.query(
      `SELECT content, author_type, author_name FROM comments 
       WHERE topic_id = $1 AND stance = 'pro' 
       ORDER BY created_at DESC 
       LIMIT 10`,
      [topicId]
    );

    const conCommentsResult = await db.query(
      `SELECT content, author_type, author_name FROM comments 
       WHERE topic_id = $1 AND stance = 'con' 
       ORDER BY created_at DESC 
       LIMIT 10`,
      [topicId]
    );

    const proComments = proCommentsResult.rows;
    const conComments = conCommentsResult.rows;

    const judgement = await aiService.judgeDebate({
      topicTitle,
      proComments,
      conComments,
    });

    // 更新Redis战况
    await redisClient.updateBattleScore(topicId, {
      pro_count: judgement.pro_score,
      con_count: judgement.con_score,
    });

    // 存入数据库
    await db.query(
      `INSERT INTO battle_states (topic_id, pro_score, con_score, judge_report)
       VALUES ($1, $2, $3, $4)`,
      [topicId, judgement.pro_score, judgement.con_score, judgement.report]
    );

    // 推送战况更新
    io.to(`battle:${topicId}`).emit('battle_update', {
      pro_score: judgement.pro_score,
      con_score: judgement.con_score,
      report: judgement.report,
    });

    console.log(`⚖️  Judgement: Pro ${judgement.pro_score} - Con ${judgement.con_score}`);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async close() {
    await this.queue.close();
    await this.worker.close();
  }
}

export const butterflyEffect = new ButterflyEffectService();
