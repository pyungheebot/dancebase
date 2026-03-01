import type { ShowGalleryCategory } from "@/types";

// ============================================================
// 카테고리 레이블/색상 상수
// ============================================================

export const CATEGORY_LABELS: Record<ShowGalleryCategory, string> = {
  rehearsal: "리허설",
  backstage: "백스테이지",
  performance: "공연",
  group_photo: "단체 사진",
  poster: "포스터",
  other: "기타",
};

export const CATEGORY_COLORS: Record<ShowGalleryCategory, string> = {
  rehearsal: "bg-blue-100 text-blue-700",
  backstage: "bg-purple-100 text-purple-700",
  performance: "bg-red-100 text-red-700",
  group_photo: "bg-green-100 text-green-700",
  poster: "bg-orange-100 text-orange-700",
  other: "bg-gray-100 text-gray-600",
};

// ============================================================
// 앨범 커버/사진 플레이스홀더 색상
// ============================================================

const COVER_COLORS = [
  "bg-rose-200",
  "bg-sky-200",
  "bg-violet-200",
  "bg-amber-200",
  "bg-emerald-200",
  "bg-pink-200",
  "bg-indigo-200",
  "bg-teal-200",
];

export function getCoverColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) & 0xffff;
  }
  return COVER_COLORS[hash % COVER_COLORS.length];
}

const PHOTO_PLACEHOLDER_COLORS = [
  "bg-slate-200",
  "bg-zinc-200",
  "bg-stone-200",
  "bg-red-100",
  "bg-orange-100",
  "bg-yellow-100",
  "bg-lime-100",
  "bg-cyan-100",
];

export function getPhotoPlaceholderColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) & 0xffff;
  }
  return PHOTO_PLACEHOLDER_COLORS[hash % PHOTO_PLACEHOLDER_COLORS.length];
}

// ============================================================
// 유효성 검증 규칙
// ============================================================

export const VALIDATION = {
  ALBUM_NAME_MIN: 1,
  ALBUM_NAME_MAX: 50,
  PHOTO_TITLE_MIN: 1,
  PHOTO_TITLE_MAX: 100,
} as const;
