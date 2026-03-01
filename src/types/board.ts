import type { Profile, Project } from "./common";

// ============================================
// Board (게시판)
// ============================================

export const BOARD_CATEGORIES = [
  "전체",
  "공지사항",
  "잡담",
  "정보",
  "사진/영상",
  "투표",
  "미분류",
  "프로젝트",
] as const;

export type BoardCategory = (typeof BOARD_CATEGORIES)[number];

export type BoardCategoryRow = {
  id: string;
  group_id: string;
  name: string;
  sort_order: number;
  created_at: string;
};

export type BoardPost = {
  id: string;
  group_id: string;
  project_id: string | null;
  category: string;
  author_id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  pinned_at: string | null;
  pinned_by: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type BoardPostWithDetails = BoardPost & {
  profiles: Pick<Profile, "id" | "name" | "avatar_url">;
  comment_count: number;
  like_count: number;
  projects?: Pick<Project, "id" | "name"> | null;
};

export type BoardComment = {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  parent_id: string | null;
  is_hidden: boolean;
  created_at: string;
};

export type BoardCommentWithProfile = BoardComment & {
  profiles: Pick<Profile, "id" | "name" | "avatar_url">;
};

export type BoardPoll = {
  id: string;
  post_id: string;
  allow_multiple: boolean;
  ends_at: string | null;
};

export type BoardPollOption = {
  id: string;
  poll_id: string;
  text: string;
  sort_order: number;
};

export type BoardPollVote = {
  id: string;
  option_id: string;
  user_id: string;
};

export type BoardPollOptionWithVotes = BoardPollOption & {
  vote_count: number;
  voted_by_me: boolean;
};

export type BoardPostAttachment = {
  id: string;
  post_id: string;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number;
  created_at: string;
};

export type BoardPostLike = {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
};

export type BoardPostRevision = {
  id: string;
  post_id: string;
  title: string;
  content: string;
  revised_by: string | null;
  revised_at: string;
};

export type PostBookmark = {
  id: string;
  user_id: string;
  post_id: string;
  created_at: string;
};

export type PostBookmarkWithPost = PostBookmark & {
  board_posts: Pick<BoardPost, "id" | "group_id" | "project_id" | "title" | "category" | "created_at"> & {
    groups: { id: string; name: string } | null;
  };
};

export type PostReadStatus = {
  post_id: string;
  user_id: string;
  read_at: string;
};

// ============================================
// Board Emoji Reactions (게시글 이모지 반응)
// ============================================

export const BOARD_REACTION_EMOJIS = ["👍", "❤️", "😂", "👏", "🔥", "😢"] as const;

export type BoardReactionEmoji = (typeof BOARD_REACTION_EMOJIS)[number];

export type BoardReactionEntry = {
  emoji: BoardReactionEmoji;
  userIds: string[];
};

export type BoardReactionsData = BoardReactionEntry[];

// ============================================
// Board Trend Analytics (게시판 트렌드 분석)
// ============================================

export type BoardTrendWeekData = {
  weekLabel: string;
  postCount: number;
  commentCount: number;
};

export type BoardTrendTopAuthor = {
  userId: string;
  name: string;
  postCount: number;
  commentCount: number;
};

export type BoardTrendPopularPost = {
  postId: string;
  title: string;
  commentCount: number;
  authorName: string;
};

export type BoardTrendResult = {
  weeklyTrend: BoardTrendWeekData[];
  dayOfWeekPattern: number[];
  topAuthors: BoardTrendTopAuthor[];
  popularPosts: BoardTrendPopularPost[];
  totalPosts: number;
  totalComments: number;
  avgCommentsPerPost: number;
  uniqueAuthors: number;
};

// ============================================
// Poll Decision (투표 기반 의사결정 히스토리, localStorage 기반)
// ============================================

export type PollDecision = {
  id: string;
  pollId: string;
  postId: string;
  question: string;
  winningOption: string;
  decisionSummary: string;
  decidedAt: string;
  decidedBy: string;
};

// ============================================
// Group Poll (그룹 투표/설문, localStorage 기반)
// ============================================

export type PollOption = {
  id: string;
  text: string;
  voterIds: string[];
};

export type GroupPoll = {
  id: string;
  groupId: string;
  title: string;
  options: PollOption[];
  type: "single" | "multiple";
  anonymous: boolean;
  creatorId: string;
  creatorName: string;
  expiresAt: string | null;
  createdAt: string;
};
