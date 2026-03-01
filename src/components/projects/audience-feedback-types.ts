// ============================================================
// audience-feedback — 타입, 상수, 유효성 검증 규칙
// ============================================================

/** 폼 내부에서 사용하는 임시 질문 초안 타입 */
export type DraftQuestion = {
  _key: string;
  question: string;
  type: "rating" | "text" | "choice";
  choices: string[];
  choiceInput: string;
};

/** 질문 유형 레이블 매핑 */
export const QUESTION_TYPE_LABELS: Record<DraftQuestion["type"], string> = {
  rating: "별점",
  text: "주관식",
  choice: "객관식",
};

/** 별점 바 색상 규칙 */
export function getRatingBarColor(star: number): string {
  if (star >= 4) return "bg-yellow-400";
  if (star === 3) return "bg-blue-400";
  return "bg-gray-400";
}

/** 질문 유형 배지 색상 */
export function getQuestionTypeBadgeClass(type: "rating" | "text" | "choice"): string {
  if (type === "rating") return "text-yellow-600 border-yellow-200";
  if (type === "text") return "text-blue-600 border-blue-200";
  return "text-purple-600 border-purple-200";
}
