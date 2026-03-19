import OpenAI from 'openai';
import { config } from '../config';

class OpenAIService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: config.openai.apiKey,
    });
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

    const response = await this.client.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: npcPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.9,
      max_tokens: 300,
    });

    return response.choices[0]?.message?.content?.trim() || '我需要思考一下...';
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

    const response = await this.client.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: userPrompt }],
      temperature: 0.8,
      max_tokens: 300,
    });

    return response.choices[0]?.message?.content?.trim() || '我觉得...';
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
`;

    const response = await this.client.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0]?.message?.content || '{}');
    return {
      pro_score: result.pro_score || 50,
      con_score: result.con_score || 50,
      report: result.oracle_verdict || '战况胶着',
      affirmative_status: result.affirmative_status,
      negative_status: result.negative_status,
      human_variable: result.human_variable,
      oracle_verdict: result.oracle_verdict,
    };
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

请以JSON数组格式返回，每个对象包含：
{
  "title": "精简后的辩题（30字内）",
  "pro_stance": "正方立场（一句话）",
  "con_stance": "反方立场（一句话）"
}
`;

    const response = await this.client.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0]?.message?.content || '{"topics": []}');
    return result.topics || [];
  }
}

export const openaiService = new OpenAIService();
