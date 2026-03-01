// ============================================
// 연습 일지 카드 공통 타입/상수/헬퍼
// ============================================

export type JournalFormState = {
  date: string;
  durationMinutes: number;
  participants: string;
  contentSummary: string;
  songs: string;
  achievedGoals: string;
  unachievedItems: string;
  nextPlanNote: string;
  authorName: string;
};

export type PracticeJournalCardProps = {
  groupId: string;
  memberNames?: string[];
};

// ============================================
// 날짜/시간 헬퍼
// ============================================

export function dateToYMD(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function formatYearMonth(ym: string): string {
  const [year, month] = ym.split("-");
  return `${year}년 ${Number(month)}월`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}분`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}시간 ${m}분` : `${h}시간`;
}

/** 줄바꿈으로 구분된 텍스트를 배열로 변환 */
export function textToArray(text: string): string[] {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** 배열을 줄바꿈으로 구분된 텍스트로 변환 */
export function arrayToText(arr: string[]): string {
  return arr.join("\n");
}

// ============================================
// 폼 기본값
// ============================================

export const DEFAULT_FORM: JournalFormState = {
  date: dateToYMD(new Date()),
  durationMinutes: 120,
  participants: "",
  contentSummary: "",
  songs: "",
  achievedGoals: "",
  unachievedItems: "",
  nextPlanNote: "",
  authorName: "",
};
