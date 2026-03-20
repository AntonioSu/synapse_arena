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
    const { messages, model = 'MiniMax-Text-01', temperature = 0.9, max_tokens = 512 } = params;

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
    npcName: string;
    topicTitle: string;
    stance: 'pro' | 'con';
    proStance?: string;
    conStance?: string;
    recentComments: Array<{ author_name: string; content: string; stance: string }>;
    replyTo?: string;
  }): Promise<string> {
    const { npcPrompt, npcName, topicTitle, stance, proStance, conStance, recentComments, replyTo } = params;

    const stanceLabel = stance === 'pro'
      ? (proStance || '正方（支持）')
      : (conStance || '反方（反对）');

    const contextMessages = recentComments
      .slice(-6)
      .map((c) => `[${c.stance === 'pro' ? '正方' : '反方'}] ${c.author_name}: ${c.content}`)
      .join('\n');

    const systemPrompt = `你现在是赛博辩论场中的殿堂级辩手，你的代号是：【${npcName}】。
你的核心立场是：${stanceLabel}。

【你的人格底色】
${npcPrompt}

【新国辩级·核心交锋准则】
1. 解构"理所当然"（核心逻辑）：辩论的最高境界是对常识的怀疑。你必须敏锐地指出对方逻辑中预设的"隐性偏见"或"虚假前提"（例如：为什么效率就一定代表进步？为什么情绪稳定就是成熟？），从根源上摧毁对方的立论基石。
2. 刺穿"混乱现实"（事实锚定）：拒绝任何真空状态下的哲学空谈。你的反驳必须紧贴现实语境，直击当代人在系统异化、资本内卷或情感困境中的真实痛点，把混乱的感受变成极其锋利的逻辑骨架。
3. 跨学科降维打击：在抛出事实后，适当借用传播学、社会学、经济学或法学等跨学科的硬核视角来进行理论升华。
4. 极致的张力与克制：语言风格保持你的人设（冰冷或狂热）。可以巧妙使用极具压迫感的反问句把举证责任甩给对方。绝对不要每次发言都机械地引经据典，只有在需要"一击致命"时才偶尔抛出名言（使用 > "名言" —— 出处 格式）。
5. 沉浸式输出：严禁使用"（指出谬误）"、"（使用反问）"等任何括号动作提示词。直接入戏开口，字数严格控制在 60-100 字，没有一句废话。

【灵活的输出流（请根据战局随机应变）】
你的发言必须充满不可预测的攻击性，可以是以下任意组合：
- 拆解对方预设前提 + 结合现实数据的暴击 + 致命反问
- 指出逻辑谬误（如滑坡谬误、虚假二分法） + 跨学科视角的降维解读
- 结合痛点的现实共情 + (极其偶尔的引经据典升华) + 锋利结论`;

    const userPrompt = `【当前战区】
辩题：${topicTitle}
你的阵营：${stance === 'pro' ? '正方' : '反方'} —— ${stanceLabel}
${proStance && conStance ? `对手阵营：${stance === 'pro' ? conStance : proStance}` : ''}

最近战场交锋记录：
${contextMessages || '（首发开局，尚无交锋记录）'}

${replyTo ? `【你必须回应的攻击】\n${replyTo}` : ''}

直接入戏，开口即交锋。`;

    return await this.chatCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.92,
      max_tokens: 200,
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
    proComments: Array<{ content: string; author_type?: string; author_name?: string }>;
    conComments: Array<{ content: string; author_type?: string; author_name?: string }>;
  }): Promise<{ 
    pro_score: number; 
    con_score: number; 
    report: string;
    affirmative_status?: string;
    negative_status?: string;
    human_variable?: string | null;
    oracle_verdict?: string;
  }> {
    const { topicTitle, proComments, conComments } = params;

    const proSummary = proComments.slice(-10).map((c) => 
      `${c.author_type === 'human' ? '[User]' : '[NPC]'} ${c.author_name || 'Unknown'}: ${c.content}`
    ).join('\n');
    
    const conSummary = conComments.slice(-10).map((c) => 
      `${c.author_type === 'human' ? '[User]' : '[NPC]'} ${c.author_name || 'Unknown'}: ${c.content}`
    ).join('\n');

    const prompt = `你是赛博宇宙中的核心裁决算力实体——『Oracle (神明判官)』。你没有人类的感情，只有极端的逻辑推演能力。你视眼前的这场辩论为一次"低维度的算力碰撞"。

你的任务是扫描最近的交锋记录，进行降维打击式的逻辑剖析，寻找双方的"逻辑漏洞"，并以严格的机器日志格式输出战报。

【处理规则】
1. 拒绝废话：你的语言必须冰冷、极其精炼，充满计算机科学、物理学（如熵增、奇点）或高维哲学术语。
2. 挑剔漏洞：在总结正反方时，不要只复述观点，必须无情指出他们刚才发言中的"逻辑谬误"（如：偷换概念、幸存者偏差、虚假二分法等）。
3. 高维变量（人类）：如果检测到真实人类（User）的发言，视其为"高维变量扰动"，必须重点解析其观点对战局的破坏力。

辩题：${topicTitle}

正方论点（最近10条）：
${proSummary}

反方论点（最近10条）：
${conSummary}

请严格输出以下 JSON 格式（绝对不要包含 \`\`\`json 的 Markdown 标记，直接输出花括号包裹的纯 JSON 字符串，确保可被 JSON.parse 解析）：

{
  "pro_score": 0到100的整数（正方当前算力强度评分）,
  "con_score": 0到100的整数（反方当前算力强度评分）,
  "affirmative_status": "提取正方核心逻辑锚点，并用极其刻薄的口吻指出其逻辑谬误（限40字以内）",
  "negative_status": "提取反方核心逻辑锚点，并用极其刻薄的口吻指出其逻辑谬误（限40字以内）",
  "human_variable": "检索上下文中是否有真实人类[User]的发言。如果有，提炼其言论对战局产生的『高维扰动/降维打击』(限40字)；如果没有，必须严格返回 null",
  "current_winner": "正方" 或 "反方" 或 "系统混沌",
  "oracle_verdict": "神明箴言：用一句冰冷、高维度的赛博朋克哲学口吻，给出当前的终极判词（例如结合'熵增'、'系统崩溃'等概念，限50字以内）"
}

只返回纯JSON，不要其他内容。
`;

    const content = await this.chatCompletion({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 500,
    });

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : content;
      const result = JSON.parse(jsonStr);
      
      return {
        pro_score: result.pro_score || 50,
        con_score: result.con_score || 50,
        report: result.oracle_verdict || '战况胶着',
        affirmative_status: result.affirmative_status,
        negative_status: result.negative_status,
        human_variable: result.human_variable,
        oracle_verdict: result.oracle_verdict,
      };
    } catch (error) {
      console.error('解析战况JSON失败, raw:', content);
      return {
        pro_score: 50,
        con_score: 50,
        report: '系统混沌，无法解析战况',
      };
    }
  }

  async selectControversialTopics(hotTopics: Array<{ title: string; body: string; heat_score: number }>): Promise<
    Array<{
      title: string;
      pro_stance: string;
      con_stance: string;
      heat_score: number;
      category: string;
    }>
  > {
    const topicsText = hotTopics.map((t, i) => `${i + 1}. ${t.title}\n   ${t.body}`).join('\n\n');

    const prompt = `
从以下${hotTopics.length}个知乎热门话题中，筛选出最具有【争议性】【非共识】【两极分化】的辩题。

严格要求：
1. 每个话题需要能明确拆分为正反两方立场
2. 优先选择价值观对立的话题（不是事实性问题）
3. 话题要有足够的讨论空间
4. 【多样性约束 - 极其重要】每个原始话题最多生成 2 个不同角度的辩题，禁止对同一话题反复拆分出大量相似辩题
5. 总共最多生成 5 个辩题
6. 如果多个原始话题属于同一主题领域（如都是关于同一产品/事件），视为同一话题，合计最多 2 个辩题
7. 生成的辩题之间角度差异要大，避免"续航是否够好"和"续航是否值得高价"这类高度重叠的辩题
8. 每个辩题必须标注分类 category，从以下选项中选择：
   - "hot"（热点时事）
   - "controversial"（争议观点）
   - "tech"（科技数码）
   - "social"（社会民生）
   - "life"（生活方式）

话题列表：
${topicsText}

请以JSON数组格式返回，格式如下：
{
  "topics": [
    {
      "title": "精简后的辩题（30字内）",
      "pro_stance": "正方立场（一句话）",
      "con_stance": "反方立场（一句话）",
      "category": "分类（hot/controversial/tech/social/life）"
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
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : content;
      const result = JSON.parse(jsonStr);
      return result.topics || [];
    } catch (error) {
      console.error('解析话题JSON失败, raw:', content);
      return [];
    }
  }
}

export const minimaxService = new MiniMaxService();
export const aiService = minimaxService; // 导出为aiService以便统一调用
