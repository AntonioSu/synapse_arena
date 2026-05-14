/**
 * 知乎链接相关工具。
 *
 * 项目约定：topics 表里的 zhihu_link 必须是真实的 https://www.zhihu.com/question/{id}
 * 链接，不再接受兜底的 /search?... 链接，否则用户落地是搜索结果列表，体验非常糟。
 */

const ZHIHU_QUESTION_LINK_RE = /^https?:\/\/(?:www\.)?zhihu\.com\/question\/\d+(?:[\/?#].*)?$/i;

export function isZhihuQuestionLink(link?: string | null): boolean {
  if (!link) return false;
  return ZHIHU_QUESTION_LINK_RE.test(link.trim());
}

export function extractQuestionId(link?: string | null): string | null {
  if (!link) return null;
  const m = link.trim().match(/zhihu\.com\/question\/(\d+)/i);
  return m ? m[1] : null;
}

/**
 * 把 link 标准化成 https://www.zhihu.com/question/{id}（去掉 query/fragment/answer 后缀）。
 * 不是 question 链接则返回 null。
 */
export function normalizeZhihuQuestionLink(link?: string | null): string | null {
  const qid = extractQuestionId(link);
  return qid ? `https://www.zhihu.com/question/${qid}` : null;
}
