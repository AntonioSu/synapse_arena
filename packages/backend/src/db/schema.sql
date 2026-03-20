-- 话题表
CREATE TABLE IF NOT EXISTS topics (
  topic_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  pro_stance VARCHAR(200),
  con_stance VARCHAR(200),
  zhihu_link TEXT,
  heat_score BIGINT DEFAULT 0,
  category VARCHAR(20) DEFAULT 'hot',
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_topics_status ON topics(status);
CREATE INDEX idx_topics_created_at ON topics(created_at DESC);
CREATE INDEX idx_topics_category ON topics(category);

-- NPC人设表
CREATE TABLE IF NOT EXISTS npcs (
  npc_id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  system_prompt TEXT NOT NULL,
  slang_tags JSONB DEFAULT '[]',
  stance_preference VARCHAR(10),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  secondme_id VARCHAR(100) UNIQUE,
  username VARCHAR(100),
  avatar_url TEXT,
  soft_memory JSONB,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_secondme_id ON users(secondme_id);

-- 评论表（包含AI和人类发言）
CREATE TABLE IF NOT EXISTS comments (
  comment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID REFERENCES topics(topic_id) ON DELETE CASCADE,
  author_type VARCHAR(20) NOT NULL,
  author_id VARCHAR(100) NOT NULL,
  author_name VARCHAR(100),
  content TEXT NOT NULL,
  stance VARCHAR(10) NOT NULL,
  reply_to UUID REFERENCES comments(comment_id) ON DELETE SET NULL,
  is_ai_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_comments_topic_time ON comments(topic_id, created_at DESC);
CREATE INDEX idx_comments_author ON comments(author_type, author_id);
CREATE INDEX idx_comments_reply_to ON comments(reply_to);

-- 战况记录表
CREATE TABLE IF NOT EXISTS battle_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID REFERENCES topics(topic_id) ON DELETE CASCADE,
  pro_score INT DEFAULT 0,
  con_score INT DEFAULT 0,
  pro_votes INT DEFAULT 0,
  con_votes INT DEFAULT 0,
  human_participants INT DEFAULT 0,
  judge_report TEXT,
  snapshot_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_battle_states_topic ON battle_states(topic_id);
CREATE INDEX idx_battle_states_snapshot ON battle_states(snapshot_at DESC);

-- 用户投票表
CREATE TABLE IF NOT EXISTS user_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  topic_id UUID REFERENCES topics(topic_id) ON DELETE CASCADE,
  stance VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, topic_id)
);

CREATE INDEX idx_user_votes_topic ON user_votes(topic_id);
