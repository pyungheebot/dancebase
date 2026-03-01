// ============================================================
// 댄스 수업 수강 기록 - 공유 타입 & 상수 & 유틸
// ============================================================

import type { DanceClassLogSource, DanceClassLogLevel } from "@/types";

// ──────────────────────────────────────────
// 폼 상태 타입
// ──────────────────────────────────────────

export type FormState = {
  className: string;
  instructor: string;
  date: string;
  startTime: string;
  durationMin: string;
  source: DanceClassLogSource | "";
  genre: string;
  customGenre: string;
  level: DanceClassLogLevel | "";
  summary: string;
  skillsInput: string;
  selfRating: number;
  notes: string;
};

// ──────────────────────────────────────────
// 기본 폼 값
// ──────────────────────────────────────────

export const defaultForm: FormState = {
  className: "",
  instructor: "",
  date: "",
  startTime: "",
  durationMin: "",
  source: "",
  genre: "",
  customGenre: "",
  level: "",
  summary: "",
  skillsInput: "",
  selfRating: 0,
  notes: "",
};

// ──────────────────────────────────────────
// 유효성 검사
// ──────────────────────────────────────────

export function validateClassLogForm(f: FormState): string | null {
  if (!f.className.trim()) return "수업명을 입력하세요.";
  if (!f.instructor.trim()) return "강사명을 입력하세요.";
  if (!f.date) return "날짜를 선택하세요.";
  if (!f.source) return "수업 출처를 선택하세요.";
  const finalGenre =
    f.genre === "__custom__" ? f.customGenre.trim() : f.genre;
  if (!finalGenre) return "장르를 선택하거나 직접 입력하세요.";
  if (!f.level) return "레벨을 선택하세요.";
  if (f.selfRating === 0) return "자가 평가 별점을 선택하세요.";
  return null;
}

// ──────────────────────────────────────────
// 기술 태그 파싱 (쉼표/공백 구분)
// ──────────────────────────────────────────

export function parseSkillsInput(input: string): string[] {
  return input
    .split(/[,，\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// ──────────────────────────────────────────
// 수업 시간 포맷
// ──────────────────────────────────────────

export function formatDuration(min?: number): string | null {
  if (!min) return null;
  if (min < 60) return `${min}분`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}시간 ${m}분` : `${h}시간`;
}
