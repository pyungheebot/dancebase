/**
 * 텍스트 입력 sanitize 유틸리티
 * 외부 라이브러리 없이 기본적인 위험 문자 처리를 담당합니다.
 * React JSX는 기본적으로 텍스트를 이스케이프하므로,
 * 이 함수들은 주로 DB 저장 전 정리 목적으로 사용합니다.
 */

/**
 * HTML 특수문자 이스케이프
 * dangerouslySetInnerHTML 등을 사용해야 하는 경우 서버 저장 전 적용
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * 공백 정리
 * - 앞뒤 공백 제거
 * - 3줄 이상 연속 줄바꿈을 2줄로 제한
 */
export function sanitizeText(text: string): string {
  return text
    .trim()
    .replace(/\n{3,}/g, "\n\n");
}
