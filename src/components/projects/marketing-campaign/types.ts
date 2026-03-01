import type { MarketingCampaignTask, MarketingChannel } from "@/types";

// ============================================================
// 상수
// ============================================================

export const CHANNEL_LABELS: Record<MarketingChannel, string> = {
  instagram: "인스타그램",
  youtube: "유튜브",
  tiktok: "틱톡",
  twitter: "트위터",
  facebook: "페이스북",
  poster: "포스터",
  flyer: "전단지",
  email: "이메일",
  other: "기타",
};

export const CHANNEL_BADGE_CLASS: Record<MarketingChannel, string> = {
  instagram: "bg-pink-100 text-pink-700 border-pink-200",
  youtube: "bg-red-100 text-red-700 border-red-200",
  tiktok: "bg-gray-100 text-gray-700 border-gray-200",
  twitter: "bg-sky-100 text-sky-700 border-sky-200",
  facebook: "bg-blue-100 text-blue-700 border-blue-200",
  poster: "bg-purple-100 text-purple-700 border-purple-200",
  flyer: "bg-orange-100 text-orange-700 border-orange-200",
  email: "bg-green-100 text-green-700 border-green-200",
  other: "bg-slate-100 text-slate-700 border-slate-200",
};

export const STATUS_LABELS: Record<MarketingCampaignTask["status"], string> = {
  todo: "할 일",
  in_progress: "진행 중",
  done: "완료",
};

export const STATUS_COLUMN_CLASS: Record<
  MarketingCampaignTask["status"],
  string
> = {
  todo: "border-blue-200 bg-blue-50/40",
  in_progress: "border-yellow-200 bg-yellow-50/40",
  done: "border-green-200 bg-green-50/40",
};

export const STATUS_HEADER_CLASS: Record<
  MarketingCampaignTask["status"],
  string
> = {
  todo: "text-blue-700",
  in_progress: "text-yellow-700",
  done: "text-green-700",
};

export const ALL_STATUSES: MarketingCampaignTask["status"][] = [
  "todo",
  "in_progress",
  "done",
];

export const ALL_CHANNELS: MarketingChannel[] = [
  "instagram",
  "youtube",
  "tiktok",
  "twitter",
  "facebook",
  "poster",
  "flyer",
  "email",
  "other",
];
