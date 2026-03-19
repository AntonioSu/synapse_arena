// 测试MiniMax服务
import { minimaxService } from './src/services/minimax-service';

async function testMiniMax() {
  console.log('🧪 测试MiniMax服务...\n');

  try {
    // 测试1: NPC生成回应
    console.log('测试1: NPC生成回应');
    const npcResponse = await minimaxService.generateNPCResponse({
      npcPrompt: '你是一个理性分析派，喜欢用数据说话，口头禅是"数据不会骗人"',
      topicTitle: '996工作制是否应该被禁止',
      stance: 'pro',
      recentComments: [
        { author_name: '网友A', content: '996太累了，影响健康', stance: 'pro' },
        { author_name: '网友B', content: '不996怎么在行业竞争中生存', stance: 'con' },
      ],
    });
    console.log('✅ NPC回应:', npcResponse);
    console.log('');

    // 测试2: 辩论评判
    console.log('测试2: 辩论评判');
    const judgement = await minimaxService.judgeDebate({
      topicTitle: '远程办公是否应该成为常态',
      proComments: [
        { content: '远程办公节省通勤时间，提高效率' },
        { content: '可以更好地平衡工作和生活' },
      ],
      conComments: [
        { content: '远程办公缺乏面对面交流，降低团队凝聚力' },
        { content: '家庭环境干扰多，工作效率反而下降' },
      ],
    });
    console.log('✅ 评判结果:', judgement);
    console.log('');

    console.log('🎉 所有测试通过！MiniMax服务正常工作');
  } catch (error) {
    console.error('❌ 测试失败:', error);
    process.exit(1);
  }
}

testMiniMax();
