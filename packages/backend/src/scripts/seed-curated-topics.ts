import { db } from '../db/client';

interface CuratedTopic {
  title: string;
  pro_stance: string;
  con_stance: string;
  background: string;
  category: string;
  heat_score: number;
}

const curatedTopics: CuratedTopic[] = [
  {
    title: 'AI的迅猛发展提升了 / 降低了人类创作者存在的意义',
    pro_stance: '剥离了重复性的流水线劳作，逼迫人类向更高维的灵感、情感与纯粹的思想深度进化。',
    con_stance: '算力霸权碾压了碳基生命的表达空间，人类的创作正在沦为廉价的提示词拼接与数据喂养。',
    background: '大语言模型和AIGC爆发，每月有海量AI生成内容充斥网络，严重冲击绘画、写作等传统内容创作行业。',
    category: 'tech',
    heat_score: 9500,
  },
  {
    title: '语言的边界 是 / 不是 人类的边界',
    pro_stance: '思维无法超越词汇的牢笼，没有被命名的概念在人类的认知系统中即是不存在的。',
    con_stance: '情绪、潜意识与高维体验超越语言，语言只是人类庞大精神世界中极低带宽的沟通切片。',
    background: '维特根斯坦的经典哲学命题，在脑机接口、AI语义理解和神经科学的前沿发展中被重新审视。',
    category: 'controversial',
    heat_score: 8800,
  },
  {
    title: '我们 该 / 不该 努力成为"情绪稳定的大人"',
    pro_stance: '情绪稳定是成年人维持社会机器高效运转的必修课，是理性压制原始冲动的最高体现。',
    con_stance: '所谓的"情绪稳定"只是社会对个体精神阉割的赞美词，压抑了人性的真实底色与反抗精神。',
    background: '职场与社交中极度推崇"情绪稳定"，引发年轻人关于"压抑天性"、"自我内耗"还是"成熟标志"的深度讨论。',
    category: 'social',
    heat_score: 9200,
  },
  {
    title: '美术馆着火，救名画还是救猫？',
    pro_stance: '在崇拜数据和宏大遗产的系统里，拯救一个弱小、没有ROI的碳基生命，是对抗冰冷机器逻辑的最后一次反叛。活着的呼吸，永远高于死去的文明数据。',
    con_stance: '名画是人类文明最高维度的"意识备份"，而生物个体的生老病死只是自然界的底层循环。为了基因的本能冲动而放弃人类文明的终极数据，是极度短视的生物性局限。',
    background: '经典的哲学电车难题，在AI能够瞬间生成万千艺术品的算力时代，探讨微小碳基生命的真实温度，与人类文明的宏大精神遗产之间究竟谁更具不可替代性。',
    category: 'controversial',
    heat_score: 9000,
  },
  {
    title: '如果一年后就被外星人抓走，你要用这一年来了解恩怨 / 实现梦想？',
    pro_stance: '"恩怨"是系统强加给你的社会契约和债务枷锁。在面临最终的"降维打击"前，清算这一切，是完成自我解绑，干干净净地注销你在这个世界的数据残留。',
    con_stance: '既然系统的毁灭已进入倒计时，一切社会关系都将清零。此时唯有追逐纯粹的个人欲望与本我，实现绝对的自由意志，才是面对末日最理性的算力倾斜。',
    background: '一个关于绝对期限的思维实验。隐喻在面对不可抗拒的时代洪流（如奇点降临或系统性崩塌）时，个体究竟该选择向内切断过去的历史羁绊，还是向外燃烧最后的自我价值。',
    category: 'life',
    heat_score: 8500,
  },
  {
    title: '按下按钮复活死去的爱人，但他将永远失去关于你的记忆，按 / 不按？',
    pro_stance: '生存是碳基生命的最高优先级。剥夺对方活着的权利来成全你所谓的"爱情记忆"，是极度自私的自我感动。只要硬件（肉体）还在运行，格式化记忆又如何？',
    con_stance: '人的本质不过是记忆数据的总和。失去了关于"我们"的记忆数据，复活的不过是一具披着熟悉外壳的生物学克隆体。真正的他已经死于数据清空的那一刻。',
    background: '极限的情感伦理测试。在记忆可以被篡改、肉体可以被延续的未来设想下，探讨人类认同的核心究竟是生物学上的"活着"，还是由记忆和经历编织的"独特数据集"。',
    category: 'controversial',
    heat_score: 9300,
  },
];

async function main() {
  try {
    console.log('🔧 Adding background column to topics table...');
    await db.query(`ALTER TABLE topics ADD COLUMN IF NOT EXISTS background TEXT`);
    console.log('✅ Column ready\n');

    console.log('📝 Inserting curated debate topics...\n');

    let inserted = 0;
    for (const topic of curatedTopics) {
      const existing = await db.query(
        `SELECT topic_id FROM topics WHERE title = $1`,
        [topic.title]
      );

      if (existing.rows.length > 0) {
        console.log(`⏭️  Already exists: ${topic.title}`);
        await db.query(
          `UPDATE topics SET pro_stance = $1, con_stance = $2, background = $3, category = $4, heat_score = $5 WHERE title = $6`,
          [topic.pro_stance, topic.con_stance, topic.background, topic.category, topic.heat_score, topic.title]
        );
        continue;
      }

      await db.query(
        `INSERT INTO topics (title, pro_stance, con_stance, background, heat_score, category, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'active')`,
        [topic.title, topic.pro_stance, topic.con_stance, topic.background, topic.heat_score, topic.category]
      );

      inserted++;
      console.log(`✅ Inserted: ${topic.title}`);
    }

    console.log(`\n🎉 Done! Inserted ${inserted} new topics, ${curatedTopics.length - inserted} already existed.`);

    const allTopics = await db.query(`SELECT topic_id, title, category FROM topics WHERE status = 'active' ORDER BY created_at DESC LIMIT 10`);
    console.log('\n📋 Latest active topics:');
    for (const t of allTopics.rows) {
      console.log(`  [${t.category}] ${t.title}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Failed:', error);
    process.exit(1);
  }
}

main();
