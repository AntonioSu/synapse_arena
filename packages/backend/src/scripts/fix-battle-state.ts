import { db } from '../db/client';
import { redisClient } from '../services/redis-client';
import { aiService } from '../services/minimax-service';

async function fixBattleState(topicId: string) {
  try {
    console.log(`\n🔧 Fixing battle state for topic: ${topicId}\n`);

    // 1. 获取话题信息
    const topicResult = await db.query(
      `SELECT title FROM topics WHERE topic_id = $1`,
      [topicId]
    );

    if (topicResult.rows.length === 0) {
      console.error('❌ Topic not found');
      process.exit(1);
    }

    const topicTitle = topicResult.rows[0].title;
    console.log(`📋 Topic: ${topicTitle}`);

    // 2. 统计评论数量
    const proCommentsResult = await db.query(
      `SELECT content, author_type, author_name FROM comments 
       WHERE topic_id = $1 AND stance = 'pro' 
       ORDER BY created_at DESC`,
      [topicId]
    );

    const conCommentsResult = await db.query(
      `SELECT content, author_type, author_name FROM comments 
       WHERE topic_id = $1 AND stance = 'con' 
       ORDER BY created_at DESC`,
      [topicId]
    );

    const proComments = proCommentsResult.rows;
    const conComments = conCommentsResult.rows;

    console.log(`📊 Pro comments: ${proComments.length}`);
    console.log(`📊 Con comments: ${conComments.length}`);

    // 3. 执行 AI 裁判
    console.log(`\n⚖️  Performing AI judgement...\n`);
    
    const judgement = await aiService.judgeDebate({
      topicTitle,
      proComments: proComments.slice(0, 10),
      conComments: conComments.slice(0, 10),
    });

    console.log(`\n📈 Judgement Result:`);
    console.log(`   Pro Score: ${judgement.pro_score}`);
    console.log(`   Con Score: ${judgement.con_score}`);
    console.log(`   Verdict: ${judgement.verdict_reason}\n`);

    const judgeResult = {
      pro_score: judgement.pro_score,
      con_score: judgement.con_score,
      affirmative_summary: judgement.affirmative_summary,
      negative_summary: judgement.negative_summary,
      human_insight: judgement.human_insight,
      current_winner: judgement.current_winner,
      verdict_reason: judgement.verdict_reason,
    };

    await redisClient.updateBattleScore(topicId, {
      pro_count: judgement.pro_score,
      con_count: judgement.con_score,
      ai_judge_result: judgeResult,
    });

    await db.query(
      `INSERT INTO battle_states (topic_id, pro_score, con_score, judge_report)
       VALUES ($1, $2, $3, $4)`,
      [topicId, judgement.pro_score, judgement.con_score, judgement.verdict_reason]
    );

    // 6. 验证
    const updatedState = await redisClient.getBattleState(topicId);
    console.log(`✅ Updated battle state in Redis:`);
    console.log(JSON.stringify(updatedState, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  }
}

const topicId = process.argv[2];
if (!topicId) {
  console.error('Usage: tsx fix-battle-state.ts <topic_id>');
  process.exit(1);
}

fixBattleState(topicId);
