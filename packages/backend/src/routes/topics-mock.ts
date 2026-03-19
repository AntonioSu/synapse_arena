import { Router } from 'express';

const router = Router();

// Mock话题数据
const mockTopics = [
  {
    topic_id: '3c38458b-ce66-4a29-81e8-2754348ced3b',
    title: '996工作制是否应该被禁止',
    pro_stance: '保护劳动者权益，促进工作生活平衡',
    con_stance: '行业竞争需要，个人自愿选择',
    heat_score: 95000,
    created_at: new Date(),
    battle_state: {
      pro_count: 12,
      con_count: 10,
      pro_votes: 245,
      con_votes: 198,
    },
  },
  {
    topic_id: '83462a7b-450a-45d6-96bc-07d5122616bf',
    title: '远程办公是否应该成为常态',
    pro_stance: '提高灵活性，节省通勤成本',
    con_stance: '缺乏面对面交流，影响团队协作',
    heat_score: 87000,
    created_at: new Date(),
    battle_state: {
      pro_count: 15,
      con_count: 13,
      pro_votes: 312,
      con_votes: 287,
    },
  },
  {
    topic_id: '0e854480-acc9-42b2-a19f-7b95de2ac56d',
    title: 'AI是否会取代大部分程序员工作',
    pro_stance: '自动化趋势不可阻挡，AI能力持续增强',
    con_stance: '创造力和复杂问题解决需要人类智慧',
    heat_score: 92000,
    created_at: new Date(),
    battle_state: {
      pro_count: 18,
      con_count: 16,
      pro_votes: 401,
      con_votes: 376,
    },
  },
];

// Mock评论数据
const mockComments: any = {};

// 初始化一些评论
mockTopics.forEach(topic => {
  mockComments[topic.topic_id] = [
    {
      comment_id: `comment-${topic.topic_id}-1`,
      author_type: 'npc',
      author_id: 'npc-rationalist',
      author_name: '理性分析派',
      content: '从数据来看，这个问题确实值得深入探讨。让我们看看双方的论据。',
      stance: 'pro',
      created_at: new Date(Date.now() - 3600000),
    },
    {
      comment_id: `comment-${topic.topic_id}-2`,
      author_type: 'npc',
      author_id: 'npc-pragmatist',
      author_name: '务实主义者',
      content: '理论和实际总是有差距的，我们要考虑现实可行性。',
      stance: 'con',
      created_at: new Date(Date.now() - 3000000),
    },
  ];
});

// 获取活跃话题列表
router.get('/', async (req, res) => {
  try {
    res.json({ success: true, data: mockTopics });
  } catch (error) {
    console.error('Get topics error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch topics' });
  }
});

// 获取话题详情
router.get('/:topicId', async (req, res) => {
  try {
    const { topicId } = req.params;
    const topic = mockTopics.find(t => t.topic_id === topicId);
    
    if (!topic) {
      return res.status(404).json({ success: false, error: 'Topic not found' });
    }

    res.json({
      success: true,
      data: topic,
    });
  } catch (error) {
    console.error('Get topic detail error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch topic' });
  }
});

// 获取话题的评论列表
router.get('/:topicId/comments', async (req, res) => {
  try {
    const { topicId } = req.params;
    const comments = mockComments[topicId] || [];

    res.json({ success: true, data: comments });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch comments' });
  }
});

export default router;
