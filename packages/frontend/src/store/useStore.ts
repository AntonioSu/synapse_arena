import { create } from 'zustand';
import type { User, Topic, Comment } from '@/types';

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
  updateBattleState: (battleState: Partial<Topic['battle_state']>) => void;
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
  addComment: (comment) => set((state) => {
    if (state.comments.some((c) => c.comment_id === comment.comment_id)) return state;

    // 顺手把 currentTopic 的 pro_count / con_count 增 1，
    // 避免必须等下次列表刷新才能看到 count 变化。
    let nextCurrent = state.currentTopic;
    let nextTopics = state.topics;
    if (state.currentTopic) {
      const bs = state.currentTopic.battle_state || {
        pro_count: 0, con_count: 0, pro_votes: 0, con_votes: 0,
      };
      const updatedState = comment.stance === 'pro'
        ? { ...bs, pro_count: (bs.pro_count || 0) + 1 }
        : { ...bs, con_count: (bs.con_count || 0) + 1 };
      nextCurrent = { ...state.currentTopic, battle_state: updatedState };
      nextTopics = state.topics.map((t) =>
        t.topic_id === nextCurrent!.topic_id ? nextCurrent! : t
      );
    }

    return {
      comments: [...state.comments, comment],
      currentTopic: nextCurrent,
      topics: nextTopics,
    };
  }),
  updateBattleState: (battleState) => set((state) => {
    if (!state.currentTopic) return state;
    const updated = {
      ...state.currentTopic,
      battle_state: { ...state.currentTopic.battle_state, ...battleState },
    };
    return {
      currentTopic: updated,
      topics: state.topics.map((t) =>
        t.topic_id === updated.topic_id ? updated : t
      ),
    };
  }),
  setLoading: (loading) => set({ isLoading: loading }),
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('zhihu_username');
    localStorage.removeItem('zhihu_user_id');
    set({ user: null });
  },
}));
