import { db } from '../db/client';
import { aiService } from '../services/llm-service';
import { v4 as uuidv4 } from 'uuid';

/**
 * 并发安全的刷库 worker。
 *
 * 用法：WORKER_ID=w1 npx tsx src/scripts/seed-debates-worker.ts
 *
 * 工作原理：
 * 1. 在事务里用 SELECT ... FOR UPDATE SKIP LOCKED LIMIT 1 原子领取下一个未刷话题。
 * 2. 仍在事务内：同步调用 LLM 生成第一条 PRO 开场评论并插入。
 * 3. COMMIT。此后其他 worker 的 NOT EXISTS 判断为 false，自动跳过该话题。
 * 4. 事务外继续生成剩余 9 条评论（第 1 条 CON + 4 轮 PRO/CON 各 1 条）。
 *
 * 这样可以多路并发，每个话题被严格只刷一次。
 */

const WORKER_ID = process.env.WORKER_ID || 'w0';
const ROUNDS = 5;

interface Npc {
  npc_id: string;
  name: string;
  system_prompt: string;
}

interface ClaimedTopic {
  topic_id: string;
  title: string;
  pro_stance: string;
  con_stance: string;
  background: string;
  category: string;
  heat_score: number;
  firstProNpc: Npc;
  firstProContent: string;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function claimNextTopic(npcs: Npc[]): Promise<ClaimedTopic | null> {
  return await db.transaction(async (client) => {
    const topicResult = await client.query(`
      SELECT t.topic_id, t.title, t.pro_stance, t.con_stance, t.background, t.category, t.heat_score
      FROM topics t
      WHERE t.status = 'active'
        AND NOT EXISTS (SELECT 1 FROM comments c WHERE c.topic_id = t.topic_id)
      ORDER BY t.heat_score DESC NULLS LAST, t.created_at DESC
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    `);

    if (topicResult.rows.length === 0) return null;

    const topic = topicResult.rows[0];
    const firstProNpc = pickRandom(npcs);

    const firstProContent = await aiService.generateNPCResponse({
      npcPrompt: firstProNpc.system_prompt,
      npcName: firstProNpc.name,
      topicTitle: topic.title,
      stance: 'pro',
      proStance: topic.pro_stance,
      conStance: topic.con_stance,
      topicBackground: topic.background,
      recentComments: [],
      replyTo: `请从正方立场发表你的开场观点`,
    });

    await client.query(
      `INSERT INTO comments (comment_id, topic_id, author_type, author_id, author_name, content, stance, is_ai_generated)
       VALUES ($1, $2, 'npc', $3, $4, $5, 'pro', true)`,
      [uuidv4(), topic.topic_id, firstProNpc.npc_id, firstProNpc.name, firstProContent]
    );

    return { ...topic, firstProNpc, firstProContent };
  });
}

async function generateRemainingRounds(topic: ClaimedTopic, npcs: Npc[]) {
  console.log(`  [${WORKER_ID}] ✅ R1 PRO: ${topic.firstProNpc.name}`);

  for (let round = 0; round < ROUNDS; round++) {
    const recentResult = await db.query(
      `SELECT author_name, content, stance FROM comments
       WHERE topic_id = $1 ORDER BY created_at DESC LIMIT 10`,
      [topic.topic_id]
    );
    const recent = recentResult.rows;

    if (round > 0) {
      const proNpc = pickRandom(npcs);
      const proContent = await aiService.generateNPCResponse({
        npcPrompt: proNpc.system_prompt,
        npcName: proNpc.name,
        topicTitle: topic.title,
        stance: 'pro',
        proStance: topic.pro_stance,
        conStance: topic.con_stance,
        topicBackground: topic.background,
        recentComments: recent,
        replyTo: `请继续从正方立场反驳对方观点`,
      });

      await db.query(
        `INSERT INTO comments (comment_id, topic_id, author_type, author_id, author_name, content, stance, is_ai_generated)
         VALUES ($1, $2, 'npc', $3, $4, $5, 'pro', true)`,
        [uuidv4(), topic.topic_id, proNpc.npc_id, proNpc.name, proContent]
      );
      console.log(`  [${WORKER_ID}] ✅ R${round + 1} PRO: ${proNpc.name}`);

      await sleep(300);
    }

    const conNpc = pickRandom(npcs);
    const conContent = await aiService.generateNPCResponse({
      npcPrompt: conNpc.system_prompt,
      npcName: conNpc.name,
      topicTitle: topic.title,
      stance: 'con',
      proStance: topic.pro_stance,
      conStance: topic.con_stance,
      topicBackground: topic.background,
      recentComments: recent,
      replyTo: round === 0
        ? `请从反方立场针对刚才的正方开场进行犀利反驳`
        : `请继续从反方立场反驳对方观点`,
    });

    await db.query(
      `INSERT INTO comments (comment_id, topic_id, author_type, author_id, author_name, content, stance, is_ai_generated)
       VALUES ($1, $2, 'npc', $3, $4, $5, 'con', true)`,
      [uuidv4(), topic.topic_id, conNpc.npc_id, conNpc.name, conContent]
    );
    console.log(`  [${WORKER_ID}] ✅ R${round + 1} CON: ${conNpc.name}`);

    await sleep(300);
  }
}

async function main() {
  console.log(`🤖 Worker [${WORKER_ID}] starting...`);

  const npcsResult = await db.query<Npc>(`SELECT npc_id, name, system_prompt FROM npcs`);
  const npcs = npcsResult.rows;
  if (npcs.length === 0) {
    console.error(`❌ [${WORKER_ID}] No NPCs found.`);
    process.exit(1);
  }

  let processedCount = 0;
  let consecutiveEmpty = 0;

  while (true) {
    let claim: ClaimedTopic | null = null;
    try {
      claim = await claimNextTopic(npcs);
    } catch (err: any) {
      console.error(`  [${WORKER_ID}] ❌ Claim failed: ${err.message}`);
      await sleep(2000);
      continue;
    }

    if (!claim) {
      consecutiveEmpty++;
      if (consecutiveEmpty >= 3) {
        console.log(`[${WORKER_ID}] No more topics. Processed ${processedCount}. Bye.`);
        break;
      }
      await sleep(3000);
      continue;
    }

    consecutiveEmpty = 0;
    processedCount++;

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🎯 [${WORKER_ID}] [${claim.category}|热度:${claim.heat_score}] ${claim.title}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    try {
      await generateRemainingRounds(claim, npcs);
      console.log(`  [${WORKER_ID}] 🎉 Done: ${claim.title}`);
    } catch (err: any) {
      console.error(`  [${WORKER_ID}] ❌ Round failed: ${err.message}`);
    }
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(`Fatal [${WORKER_ID}]:`, err);
  process.exit(1);
});
