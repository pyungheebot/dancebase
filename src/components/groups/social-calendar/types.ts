import type { SocialPlatformType, SocialPostStatus } from "@/types";

// ============================================================
// 폼 타입
// ============================================================

export type PostForm = {
  platform: SocialPlatformType;
  title: string;
  content: string;
  scheduledDate: string;
  scheduledTime: string;
  status: SocialPostStatus;
  assignee: string;
  hashtagsRaw: string; // 쉼표 구분
  mediaType: "photo" | "video" | "reel" | "story" | "text" | "";
  notes: string;
};

export const EMPTY_FORM: PostForm = {
  platform: "instagram",
  title: "",
  content: "",
  scheduledDate: "",
  scheduledTime: "",
  status: "draft",
  assignee: "",
  hashtagsRaw: "",
  mediaType: "",
  notes: "",
};

// ============================================================
// 상수
// ============================================================

export const PLATFORM_LABEL: Record<SocialPlatformType, string> = {
  instagram: "인스타그램",
  youtube: "유튜브",
  tiktok: "틱톡",
  twitter: "트위터",
  facebook: "페이스북",
  blog: "블로그",
};

export const PLATFORM_COLOR: Record<SocialPlatformType, string> = {
  instagram: "bg-purple-500",
  youtube: "bg-red-500",
  tiktok: "bg-gray-900",
  twitter: "bg-blue-400",
  facebook: "bg-indigo-700",
  blog: "bg-green-500",
};

export const PLATFORM_BADGE: Record<SocialPlatformType, string> = {
  instagram: "bg-purple-100 text-purple-700",
  youtube: "bg-red-100 text-red-700",
  tiktok: "bg-gray-100 text-gray-800",
  twitter: "bg-blue-100 text-blue-700",
  facebook: "bg-indigo-100 text-indigo-700",
  blog: "bg-green-100 text-green-700",
};

export const STATUS_LABEL: Record<SocialPostStatus, string> = {
  draft: "초안",
  scheduled: "예정",
  published: "게시완료",
  cancelled: "취소",
};

export const STATUS_BADGE: Record<SocialPostStatus, string> = {
  draft: "bg-blue-100 text-blue-700",
  scheduled: "bg-yellow-100 text-yellow-700",
  published: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-500",
};

export const MEDIA_TYPE_LABEL: Record<string, string> = {
  photo: "사진",
  video: "영상",
  reel: "릴스",
  story: "스토리",
  text: "텍스트",
};

export const PLATFORMS: SocialPlatformType[] = [
  "instagram",
  "youtube",
  "tiktok",
  "twitter",
  "facebook",
  "blog",
];

export const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

// ============================================================
// 헬퍼 함수
// ============================================================

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay();
}

export function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function getNextStatus(
  current: SocialPostStatus
): SocialPostStatus | null {
  if (current === "draft") return "scheduled";
  if (current === "scheduled") return "published";
  return null;
}
