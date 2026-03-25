import { Queue, Worker, Job } from 'bullmq';
import { redisClient } from './redis-client';
import { db } from '../db/client';
import { aiService } from './minimax-service';
import { performJudgement } from './judgement-service';
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

    const topicResult = await db.query(
      `SELECT title, pro_stance, con_stance, background FROM topics WHERE topic_id = $1`,
      [topic_id]
    );
    
    if (topicResult.rows.length === 0) {
      throw new Error(`Topic ${topic_id} not found`);
    }

    const { title: topicTitle, pro_stance: proStance, con_stance: conStance, background: topicBackground } = topicResult.rows[0];

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

      await this.generateNPCResponse(
        topic_id, topicTitle,
        user_stance === 'pro' ? 'con' : 'pro',
        recentComments, triggerContent,
        'enemy', proStance, conStance, topicBackground
      );

      await this.sleep(1000);

      await this.generateNPCResponse(
        topic_id, topicTitle,
        user_stance,
        recentComments, triggerContent,
        'ally', proStance, conStance, topicBackground
      );

      // Step 3: 每2轮进行一次AI裁决
      if ((round + 1) % 2 === 0) {
        await this.runJudgement(topic_id, topicTitle);
      }

      // 短暂延迟
      await this.sleep(500);
    }

    console.log(`✅ Butterfly effect completed for ${topic_id}`);
  }

  private async generateNPCResponse(
    topicId: string,
    topicTitle: string,
    stance: 'pro' | 'con',
    recentComments: any[],
    triggerContent: string,
    role: 'enemy' | 'ally',
    proStance?: string,
    conStance?: string,
    topicBackground?: string
  ) {
    const npcResult = await db.query(
      `SELECT npc_id, name, system_prompt FROM npcs ORDER BY RANDOM() LIMIT 1`
    );

    if (npcResult.rows.length === 0) return;

    const npc = npcResult.rows[0];
    const replyTo = role === 'enemy'
      ? `用户刚说了：${triggerContent}，你需要从${stance === 'pro' ? '正' : '反'}方立场犀利反驳`
      : `用户刚说了：${triggerContent}，你需要肯定并补充观点`;

    const content = await aiService.generateNPCResponse({
      npcPrompt: npc.system_prompt,
      npcName: npc.name,
      topicTitle, stance, proStance, conStance, topicBackground,
      recentComments, replyTo,
    });

    const commentId = uuidv4();
    await db.query(
      `INSERT INTO comments (comment_id, topic_id, author_type, author_id, author_name, content, stance, is_ai_generated)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [commentId, topicId, 'npc', npc.npc_id, npc.name, content, stance, true]
    );

    io.to(`battle:${topicId}`).emit('new_comment', {
      comment_id: commentId,
      author_type: 'npc',
      author_id: npc.npc_id,
      author_name: npc.name,
      content, stance,
      created_at: new Date().toISOString(),
    });

    const icon = role === 'enemy' ? '⚔️' : '🤝';
    console.log(`${icon}  ${role} response: ${npc.name} (${stance})`);
  }

  private async runJudgement(topicId: string, topicTitle: string) {
    const [proResult, conResult] = await Promise.all([
      db.query(
        `SELECT content, author_type, author_name FROM comments 
         WHERE topic_id = $1 AND stance = 'pro' ORDER BY created_at DESC LIMIT 10`,
        [topicId]
      ),
      db.query(
        `SELECT content, author_type, author_name FROM comments 
         WHERE topic_id = $1 AND stance = 'con' ORDER BY created_at DESC LIMIT 10`,
        [topicId]
      ),
    ]);

    await performJudgement({
      topicId, topicTitle,
      proComments: proResult.rows,
      conComments: conResult.rows,
      broadcast: (judgeResult) => {
        io.to(`battle:${topicId}`).emit('battle_update', {
          pro_score: judgeResult.pro_score,
          con_score: judgeResult.con_score,
          ai_judge_result: judgeResult,
        });
      },
    });
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
