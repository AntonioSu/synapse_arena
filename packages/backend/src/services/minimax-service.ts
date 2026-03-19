import axios from 'axios';
import { config } from '../config';

class MiniMaxService {
  private apiKey: string;
  private groupId: string;
  private baseURL: string;

  constructor() {
    this.apiKey = config.minimax.apiKey;
    this.groupId = config.minimax.groupId;
    this.baseURL = config.minimax.baseURL;
  }

  private async chatCompletion(params: {
    messages: Array<{ role: string; content: string }>;
    model?: string;
    temperature?: number;
    max_tokens?: number;
  }): Promise<string> {
    const { messages, model = 'abab6.5-chat', temperature = 0.9, max_tokens = 512 } = params;

    // 检查API密钥是否配置
    if (!this.apiKey || this.apiKey.length < 10) {
      console.warn('⚠️  MiniMax API密钥未配置，使用模拟响应');
      return this.mockResponse(messages);
    }

    try {
      // MiniMax API v1接口
      const response = await axios.post(
        `${this.baseURL}/text/chatcompletion_v2`,
        {
          model,
          messages,
          temperature,
          max_tokens,
          top_p: 0.95,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      if (response.data?.base_resp?.status_code !== 0) {
        throw new Error(`MiniMax API错误: ${response.data?.base_resp?.status_msg}`);
      }

      return response.data?.choices?.[0]?.message?.content || '我需要思考一下...';
    } catch (error: any) {
      console.error('MiniMax API调用失败:', error.response?.data || error.message);
      // 降级到模拟响应
      return this.mockResponse(messages);
    }
  }

  // 模拟响应，用于测试和降级
  private mockResponse(messages: Array<{ role: string; content: string }>): string {
    const lastMessage = messages[messages.length - 1]?.content || '';
    
    // 简单的模拟逻辑
    if (lastMessage.includes('正方') || lastMessage.includes('支持')) {
      return '从理性角度来看，这个观点确实有其合理性。但我们也要考虑实际情况的复杂性。';
    } else if (lastMessage.includes('反方') || lastMessage.includes('反对')) {
      return '我理解你的顾虑，不过换个角度思考，也许事情没有那么糟糕。';
    } else if (lastMessage.includes('评分') || lastMessage.includes('维度')) {
      // 战况评判返回JSON
      return JSON.stringify({
        pro_score: Math.floor(Math.random() * 30) + 40,
        con_score: Math.floor(Math.random() * 30) + 40,
        report: '双方势均力敌，战况胶着'
      });
    } else if (lastMessage.includes('话题') || lastMessage.includes('筛选')) {
      // 话题筛选返回JSON
      return JSON.stringify({
        topics: []
      });
    }
    
    return '这是一个值得深思的问题，让我们理性讨论一下。';
  }

  async generateNPCResponse(params: {
    npcPrompt: string;
    topicTitle: string;
    stance: 'pro' | 'con';
    recentComments: Array<{ author_name: string; content: string; stance: string }>;
    replyTo?: string;
  }): Promise<string> {
    const { npcPrompt, topicTitle, stance, recentComments, replyTo } = params;

    const contextMessages = recentComments
      .slice(-5)
      .map((c) => `${c.author_name}(${c.stance}): ${c.content}`)
      .join('\n');

    const userPrompt = `
当前辩题：${topicTitle}
你的立场：${stance === 'pro' ? '正方（支持）' : '反方（反对）'}

最近5条战场发言：
${contextMessages}

${replyTo ? `你需要回应的发言：${replyTo}` : ''}

请基于你的人设，生成一条150字以内的犀利观点。要求：
1. 必须严格遵守你的人设和立场
2. 语气要有个性，使用你的专属黑话
3. 直击要害，不要客套
4. 如果是回应他人，要有针对性
`;

    return await this.chatCompletion({
      messages: [
        { role: 'system', content: npcPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.9,
      max_tokens: 300,
    });
  }

  async generateUserAIResponse(params: {
    softMemory: any;
    topicTitle: string;
    stance: 'pro' | 'con';
    recentComments: Array<{ author_name: string; content: string }>;
  }): Promise<string> {
    const { softMemory, topicTitle, stance, recentComments } = params;

    const contextMessages = recentComments
      .slice(-3)
      .map((c) => `${c.author_name}: ${c.content}`)
      .join('\n');

    const userPrompt = `
你需要以以下人格特征发言：
- 价值观：${softMemory.values?.join('、') || '未知'}
- 性格：${softMemory.personality || '未知'}
- 语气：${softMemory.speech_style || '未知'}

当前辩题：${topicTitle}
你的立场：${stance === 'pro' ? '支持' : '反对'}

最近发言：
${contextMessages}

请生成一条150字以内的观点，必须：
1. 符合用户的价值观和性格
2. 带有个人色彩和真实感
3. 不要太官方，要有人情味
`;

    return await this.chatCompletion({
      messages: [{ role: 'user', content: userPrompt }],
      temperature: 0.8,
      max_tokens: 300,
    });
  }

  async judgeDebate(params: {
    topicTitle: string;
    proComments: Array<{ content: string }>;
    conComments: Array<{ content: string }>;
  }): Promise<{ pro_score: number; con_score: number; report: string }> {
    const { topicTitle, proComments, conComments } = params;

    const proSummary = proComments.slice(-10).map((c) => c.content).join('\n');
    const conSummary = conComments.slice(-10).map((c) => c.content).join('\n');

    const prompt = `
你是战况播报员，需要客观评估当前辩论走向。

辩题：${topicTitle}

正方论点（最近10条）：
${proSummary}

反方论点（最近10条）：
${conSummary}

请从以下维度评分（0-100）：
1. 逻辑严密性
2. 论据充分性
3. 情绪共鸣度
4. 反驳有效性

请以JSON格式返回：
{
  "pro_score": 0-100的整数,
  "con_score": 0-100的整数,
  "report": "一句话战况播报（30字内，犀利风格）"
}

只返回JSON，不要其他内容。
`;

    const content = await this.chatCompletion({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 300,
    });

    try {
      const result = JSON.parse(content);
      return {
        pro_score: result.pro_score || 50,
        con_score: result.con_score || 50,
        report: result.report || '战况胶着',
      };
    } catch (error) {
      console.error('解析战况JSON失败:', error);
      return {
        pro_score: 50,
        con_score: 50,
        report: '战况胶着，难分伯仲',
      };
    }
  }

  async selectControversialTopics(hotTopics: Array<{ title: string; body: string; heat_score: number }>): Promise<
    Array<{
      title: string;
      pro_stance: string;
      con_stance: string;
      heat_score: number;
    }>
  > {
    const topicsText = hotTopics.map((t, i) => `${i + 1}. ${t.title}\n   ${t.body}`).join('\n\n');

    const prompt = `
从以下${hotTopics.length}个知乎热门话题中，筛选出10个最具有【争议性】【非共识】【两极分化】的辩题。

要求：
1. 每个话题需要能明确拆分为正反两方立场
2. 优先选择价值观对立的话题（不是事实性问题）
3. 话题要有足够的讨论空间

话题列表：
${topicsText}

请以JSON数组格式返回，格式如下：
{
  "topics": [
    {
      "title": "精简后的辩题（30字内）",
      "pro_stance": "正方立场（一句话）",
      "con_stance": "反方立场（一句话）"
    }
  ]
}

只返回JSON，不要其他内容。
`;

    const content = await this.chatCompletion({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
    });

    try {
      const result = JSON.parse(content);
      return result.topics || [];
    } catch (error) {
      console.error('解析话题JSON失败:', error);
      return [];
    }
  }
}

export const minimaxService = new MiniMaxService();
export const aiService = minimaxService; // 导出为aiService以便统一调用
