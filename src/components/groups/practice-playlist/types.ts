// ============================================
// Practice Playlist 서브컴포넌트 공통 타입/상수
// ============================================

import type {
  PracticePlaylistPurpose,
  PracticePlaylistTrack,
  PracticePlaylistEntry,
} from "@/types";

export type { PracticePlaylistPurpose, PracticePlaylistTrack, PracticePlaylistEntry };

// 용도 필터 타입
export type PurposeFilter = PracticePlaylistPurpose | "all";

// 용도 레이블
export const PURPOSE_LABELS: Record<PracticePlaylistPurpose, string> = {
  warmup: "웜업",
  main: "본연습",
  cooldown: "쿨다운",
};

// 용도 배지 색상
export const PURPOSE_COLORS: Record<PracticePlaylistPurpose, string> = {
  warmup: "bg-orange-100 text-orange-700 border-orange-200",
  main: "bg-blue-100 text-blue-700 border-blue-200",
  cooldown: "bg-teal-100 text-teal-700 border-teal-200",
};

// 장르 배지 색상 맵
export const GENRE_COLORS: Record<string, string> = {
  힙합: "bg-purple-100 text-purple-700 border-purple-200",
  팝핑: "bg-orange-100 text-orange-700 border-orange-200",
  락킹: "bg-yellow-100 text-yellow-700 border-yellow-200",
  브레이킹: "bg-red-100 text-red-700 border-red-200",
  왁킹: "bg-pink-100 text-pink-700 border-pink-200",
  컨템포러리: "bg-teal-100 text-teal-700 border-teal-200",
  하우스: "bg-blue-100 text-blue-700 border-blue-200",
  크럼프: "bg-rose-100 text-rose-700 border-rose-200",
  팝: "bg-sky-100 text-sky-700 border-sky-200",
};

// 곡 추가 다이얼로그 폼 기본값
export const DEFAULT_TRACK_FORM = {
  title: "",
  artist: "",
  durationStr: "",
  purpose: "main" as PracticePlaylistPurpose,
  bpmStr: "",
  genre: "",
  notes: "",
  addedBy: "",
};
