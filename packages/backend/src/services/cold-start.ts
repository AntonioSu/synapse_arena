import { db } from '../db/client';
import { aiService } from './minimax-service';
import { v4 as uuidv4 } from 'uuid';

interface NPC {
  npc_id: string;
  name: string;
  system_prompt: string;
}

class ColdStartService {
  async selectRandomNPCs(count: number): Promise<NPC[]> {
    const result = await db.query<NPC>(
      `SELECT npc_id, name, system_prompt FROM npcs ORDER BY RANDOM() LIMIT $1`,
      [count]
    );
    return result.rows;
  }

  async generateColdStartBattle(topicId: string, rounds = 80) {
    try {
      console.log(`🥶 Starting cold start for topic ${topicId} (${rounds} rounds)`);

      // 1. 获取话题信息
      const topicResult = await db.query(
        `SELECT topic_id, title, pro_stance, con_stance FROM topics WHERE topic_id = $1`,
        [topicId]
      );

      if (topicResult.rows.length === 0) {
        throw new Error(`Topic ${topicId} not found`);
      }

      const topic = topicResult.rows[0];

      // 2. 随机选择2个NPC（正反方各一个）
      const npcs = await this.selectRandomNPCs(2);
      const proNPC = npcs[0];
      const conNPC = npcs[1];

      console.log(`⚔️  ${proNPC.name} (正方) VS ${conNPC.name} (反方)`);

      // 3. 开始80轮对战
      const comments: Array<{ content: string; npc: NPC; stance: 'pro' | 'con' }> = [];

      for (let i = 0; i < rounds; i++) {
        const isProTurn = i % 2 === 0;
        const currentNPC = isProTurn ? proNPC : conNPC;
        const stance = isProTurn ? 'pro' : 'con';

        // 获取最近的对话上下文
        const recentComments = comments.slice(-10).map((c) => ({
          author_name: c.npc.name,
          content: c.content,
          stance: c.stance,
        }));

        // 如果是回复上一条，传入上一条内容
        const replyTo = comments.length > 0 ? comments[comments.length - 1].content : undefined;

        // 生成AI回复
        const content = await aiService.generateNPCResponse({
          npcPrompt: currentNPC.system_prompt,
          topicTitle: topic.title,
          stance,
          recentComments,
          replyTo,
        });

        // 存入数据库
        const commentId = uuidv4();
        await db.query(
          `INSERT INTO comments (comment_id, topic_id, author_type, author_id, author_name, content, stance, is_ai_generated, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
          [commentId, topicId, 'npc', currentNPC.npc_id, currentNPC.name, content, stance, true]
        );

        comments.push({ 
          content, 
          npc: currentNPC, 
          stance,
          author_type: 'npc',
          author_name: currentNPC.name
        });

        console.log(`Round ${i + 1}/${rounds}: ${currentNPC.name} (${stance})`);

        // 每10轮进行一次AI裁决
        if ((i + 1) % 10 === 0) {
          await this.performJudgement(topicId, comments);
        }
      }

      console.log(`✅ Cold start completed for topic ${topicId}`);
    } catch (error) {
      console.error(`❌ Cold start failed for topic ${topicId}:`, error);
      throw error;
    }
  }

  private async performJudgement(
    topicId: string,
    comments: Array<{ content: string; stance: 'pro' | 'con'; author_type?: string; author_name?: string }>
  ) {
    const proComments = comments.filter((c) => c.stance === 'pro');
    const conComments = comments.filter((c) => c.stance === 'con');

    const topicResult = await db.query(`SELECT title FROM topics WHERE topic_id = $1`, [topicId]);
    const topicTitle = topicResult.rows[0]?.title || '';

    const judgement = await aiService.judgeDebate({
      topicTitle,
      proComments,
      conComments,
    });

    // 存入数据库
    await db.query(
      `INSERT INTO battle_states (topic_id, pro_score, con_score, judge_report)
       VALUES ($1, $2, $3, $4)`,
      [topicId, judgement.pro_score, judgement.con_score, judgement.report]
    );

    console.log(`⚖️  Judgement: Pro ${judgement.pro_score} - Con ${judgement.con_score}`);
    console.log(`📢 Report: ${judgement.report}`);
  }

  async startColdStartForAllNewTopics() {
    const result = await db.query<{ topic_id: string }>(
      `SELECT topic_id FROM topics 
       WHERE status = 'active' 
       AND NOT EXISTS (SELECT 1 FROM comments WHERE comments.topic_id = topics.topic_id LIMIT 1)`
    );

    for (const row of result.rows) {
      await this.generateColdStartBattle(row.topic_id, 80);
    }
  }
}

export const coldStartService = new ColdStartService();
);
