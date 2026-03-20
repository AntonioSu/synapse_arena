import { db } from '../db/client';
import { redisClient } from '../services/redis-client';
import { aiService } from '../services/minimax-service';

async function fixAllBattleStates() {
  try {
    console.log(`\n🔧 Fixing battle states for all active topics...\n`);

    // 获取所有活跃话题
    const topicsResult = await db.query(
      `SELECT topic_id, title FROM topics WHERE status = 'active' ORDER BY created_at DESC`
    );

    const topics = topicsResult.rows;
    console.log(`📋 Found ${topics.length} active topics\n`);

    let successCount = 0;
    let skipCount = 0;
    let failCount = 0;

    for (const topic of topics) {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`🎯 Topic: ${topic.title}`);
      console.log(`📌 ID: ${topic.topic_id}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

      try {
        // 1. 检查是否有评论
        const commentCountResult = await db.query(
          `SELECT COUNT(*) as total FROM comments WHERE topic_id = $1`,
          [topic.topic_id]
        );

        const totalComments = parseInt(commentCountResult.rows[0].total);

        if (totalComments === 0) {
          console.log(`⏭️  No comments yet, skipping...\n`);
          skipCount++;
          continue;
        }

        // 2. 统计正反方评论
        const proCommentsResult = await db.query(
          `SELECT content, author_type, author_name FROM comments 
           WHERE topic_id = $1 AND stance = 'pro' 
           ORDER BY created_at DESC 
           LIMIT 10`,
          [topic.topic_id]
        );

        const conCommentsResult = await db.query(
          `SELECT content, author_type, author_name FROM comments 
           WHERE topic_id = $1 AND stance = 'con' 
           ORDER BY created_at DESC 
           LIMIT 10`,
          [topic.topic_id]
        );

        const proComments = proCommentsResult.rows;
        const conComments = conCommentsResult.rows;

        console.log(`📊 Pro comments: ${proComments.length}`);
        console.log(`📊 Con comments: ${conComments.length}`);

        if (proComments.length === 0 && conComments.length === 0) {
          console.log(`⏭️  No stance comments, skipping...\n`);
          skipCount++;
          continue;
        }

        // 4. 执行 AI 裁判
        console.log(`\n⚖️  Performing AI judgement...`);
        
        const judgement = await aiService.judgeDebate({
          topicTitle: topic.title,
          proComments,
          conComments,
        });

        console.log(`\n📈 Judgement Result:`);
        console.log(`   Pro Score: ${judgement.pro_score}`);
        console.log(`   Con Score: ${judgement.con_score}`);
        console.log(`   Verdict: ${judgement.verdict_reason}`);

        const judgeResult = {
          pro_score: judgement.pro_score,
          con_score: judgement.con_score,
          affirmative_summary: judgement.affirmative_summary,
          negative_summary: judgement.negative_summary,
          human_insight: judgement.human_insight,
          current_winner: judgement.current_winner,
          verdict_reason: judgement.verdict_reason,
        };

        await redisClient.updateBattleScore(topic.topic_id, {
          pro_count: judgement.pro_score,
          con_count: judgement.con_score,
          ai_judge_result: judgeResult,
        });

        await db.query(
          `INSERT INTO battle_states (topic_id, pro_score, con_score, judge_report)
           VALUES ($1, $2, $3, $4)`,
          [topic.topic_id, judgement.pro_score, judgement.con_score, judgement.verdict_reason]
        );

        console.log(`\n✅ Battle state updated successfully!\n`);
        successCount++;

        // 短暂延迟，避免 API 请求过快
        await sleep(2000);

      } catch (error) {
        console.error(`\n❌ Failed to fix topic ${topic.title}:`, error);
        failCount++;
        // 继续处理下一个话题
        continue;
      }
    }

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🎉 All Done!`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`✅ Success: ${successCount}`);
    console.log(`⏭️  Skipped: ${skipCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Batch fix failed:', error);
    process.exit(1);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

fixAllBattleStates();
