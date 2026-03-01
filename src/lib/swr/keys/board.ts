// 게시판, 투표, 북마크 관련 키
export const boardKeys = {
  // 게시판
  board: (groupId: string, projectId: string | null | undefined, category: string, search: string, page: number) =>
    `/groups/${groupId}/board?project=${projectId ?? ""}&category=${category}&search=${search}&page=${page}` as const,
  boardPost: (postId: string) => `/board-posts/${postId}` as const,
  boardPostAttachments: (postId: string) => `/board-posts/${postId}/attachments` as const,
  boardPostLikes: (postId: string) => `/board-posts/${postId}/likes` as const,
  boardCategories: (groupId: string) => `/groups/${groupId}/board-categories` as const,
  boardNotices: (groupId: string, projectId?: string | null) =>
    `/groups/${groupId}/board-notices${projectId ? `?project=${projectId}` : ""}` as const,
  boardTrash: (groupId: string) => `/groups/${groupId}/board-trash` as const,
  boardTrendAnalytics: (groupId: string) =>
    `/groups/${groupId}/board-trend-analytics` as const,

  // 북마크
  postBookmarks: (groupId?: string | null) =>
    `/post-bookmarks${groupId ? `?group=${groupId}` : ""}` as const,
  postBookmark: (postId: string) => `/post-bookmarks/${postId}` as const,

  // 투표
  pollStatistics: (postId: string) => `/poll-statistics/${postId}` as const,

  // 게시글 상태
  postRevisions: (postId: string) => `post-revisions-${postId}` as const,
  postReadStatus: (postId: string) => `post-read-status-${postId}` as const,
};
