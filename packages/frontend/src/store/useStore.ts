import { create } from 'zustand';

interface User {
  user_id: string;
  username: string;
  avatar_url: string;
  soft_memory: any;
}

interface Topic {
  topic_id: string;
  title: string;
  pro_stance: string;
  con_stance: string;
  category?: string;
  battle_state: {
    pro_count: number;
    con_count: number;
    pro_votes: number;
    con_votes: number;
    human_participants: number;
  };
}

interface Comment {
  comment_id: string;
  author_type: 'human' | 'npc';
  author_id: string;
  author_name: string;
  content: string;
  stance: 'pro' | 'con';
  reply_to?: string;
  created_at: string;
}

interface Store {
  user: User | null;
  topics: Topic[];
  currentTopic: Topic | null;
  comments: Comment[];
  isLoading: boolean;
  
  setUser: (user: User | null) => void;
  setTopics: (topics: Topic[]) => void;
  setCurrentTopic: (topic: Topic | null) => void;
  setComments: (comments: Comment[]) => void;
  addComment: (comment: Comment) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useStore = create<Store>((set) => ({
  user: null,
  topics: [],
  currentTopic: null,
  comments: [],
  isLoading: false,
  
  setUser: (user) => set({ user }),
  setTopics: (topics) => set({ topics }),
  setCurrentTopic: (topic) => set({ currentTopic: topic }),
  setComments: (comments) => set({ comments }),
  addComment: (comment) => set((state) => ({ comments: [...state.comments, comment] })),
  setLoading: (loading) => set({ isLoading: loading }),
  logout: () => {
    localStorage.removeItem('access_token');
    set({ user: null });
  },
}));
