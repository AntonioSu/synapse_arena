import { config } from '../config';
import { zhihuAuth } from './zhihu-auth';

interface BillboardItem {
  title: string;
  body: string;
  link_url: string;
  published_time: number;
  heat_score: number;
  token: string;
  type: string;
  interaction_info: {
    vote_up_count: number;
    comment_count: number;
    pv_count: number;
  };
}

interface BillboardResponse {
  status: number;
  msg: string;
  data: {
    list: BillboardItem[];
  };
}

interface PublishPinRequest {
  title: string;
  content: string;
  ring_id: string;
  image_urls?: string[];
}

interface CommentRequest {
  content_token: string;
  content_type: 'pin' | 'comment';
  content: string;
}

interface ReactionRequest {
  content_token: string;
  content_type: 'pin' | 'comment';
  action_type: 'like';
  action_value: 0 | 1;
}

export class ZhihuAPI {
  private baseURL: string;

  constructor() {
    this.baseURL = config.zhihu.baseURL;
  }

  private async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = {
      ...zhihuAuth.generateHeaders(),
      ...options.headers,
    };

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();
    
    if (data.status !== 0 && data.code !== 0) {
      throw new Error(`Zhihu API Error: ${data.msg || data.message}`);
    }

    return data as T;
  }

  async getBillboard(topCnt = 50, publishInHours = 48): Promise<BillboardResponse> {
    return this.fetch<BillboardResponse>(
      `/openapi/billboard/list?top_cnt=${topCnt}&publish_in_hours=${publishInHours}`
    );
  }

  async getRingDetail(ringId: string, pageNum = 1, pageSize = 20) {
    return this.fetch(
      `/openapi/ring/detail?ring_id=${ringId}&page_num=${pageNum}&page_size=${pageSize}`
    );
  }

  async publishPin(data: PublishPinRequest) {
    return this.fetch('/openapi/publish/pin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  }

  async createComment(data: CommentRequest) {
    return this.fetch('/openapi/comment/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  }

  async deleteComment(commentId: string) {
    return this.fetch('/openapi/comment/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ comment_id: commentId }),
    });
  }

  async getCommentList(
    contentToken: string,
    contentType: 'pin' | 'comment',
    pageNum = 1,
    pageSize = 10
  ) {
    return this.fetch(
      `/openapi/comment/list?content_token=${contentToken}&content_type=${contentType}&page_num=${pageNum}&page_size=${pageSize}`
    );
  }

  async reaction(data: ReactionRequest) {
    return this.fetch('/openapi/reaction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  }

  async globalSearch(query: string, count = 10) {
    const encodedQuery = encodeURIComponent(query);
    return this.fetch(
      `/openapi/search/global?query=${encodedQuery}&count=${count}`
    );
  }
}

export const zhihuAPI = new ZhihuAPI();
