/**
 * SWR 에러 핸들링 유틸리티
 *
 * Supabase 에러 객체 구조:
 *   - PostgrestError: { message, details, hint, code }
 *     code는 PostgreSQL 에러 코드 (예: "42501" = insufficient_privilege)
 *     HTTP 상태는 객체 자체에 없고 Response의 status로 전달됨
 *   - AuthError: { message, status, code }
 *     status: 401 | 403 등 HTTP 상태
 *   - 네트워크 단절: TypeError("Failed to fetch")
 *   - 중단: DOMException(name="AbortError")
 */

/** 에러 객체에서 HTTP status를 추출 */
function extractStatus(error: unknown): number | null {
  if (!error || typeof error !== "object") return null;
  const e = error as Record<string, unknown>;
  // Supabase AuthError, PostgrestError(일부 버전), 커스텀 throw error
  if (typeof e.status === "number") return e.status;
  // fetch Response를 그대로 throw한 경우 (status 필드)
  if (typeof e.statusCode === "number") return e.statusCode;
  return null;
}

/** 네트워크 단절 에러 여부 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError && error.message === "Failed to fetch") return true;
  // Safari에서 "NetworkError when attempting to fetch resource." 형태로 옴
  if (error instanceof TypeError && error.message.toLowerCase().includes("networkerror")) return true;
  return false;
}

/** 중단(AbortError) 여부 — 재시도 불필요 */
export function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === "AbortError") return true;
  return false;
}

/**
 * 인증/권한 에러 여부 (401 Unauthorized, 403 Forbidden)
 * - Supabase AuthError: { status: 401 | 403 }
 * - Supabase RLS 위반: PostgrestError code "42501" (PGRST301 등)
 */
export function isAuthError(error: unknown): boolean {
  const status = extractStatus(error);
  if (status === 401 || status === 403) return true;

  // Supabase PostgREST RLS 에러: message에 "JWT" 포함하거나 code가 PGRST 계열
  if (error && typeof error === "object") {
    const e = error as Record<string, unknown>;
    if (typeof e.message === "string") {
      const msg = e.message.toLowerCase();
      if (msg.includes("jwt") || msg.includes("not authenticated") || msg.includes("permission denied")) return true;
    }
    // PostgREST 권한 에러 코드
    if (typeof e.code === "string" && (e.code === "42501" || e.code.startsWith("PGRST3"))) return true;
  }
  return false;
}

/** 404 Not Found 에러 여부 */
export function isNotFoundError(error: unknown): boolean {
  const status = extractStatus(error);
  if (status === 404) return true;

  // PostgREST 단일행 조회 실패: code "PGRST116"
  if (error && typeof error === "object") {
    const e = error as Record<string, unknown>;
    if (typeof e.code === "string" && e.code === "PGRST116") return true;
  }
  return false;
}

/** 서버 에러(5xx) 여부 */
export function isServerError(error: unknown): boolean {
  const status = extractStatus(error);
  return status !== null && status >= 500;
}

/**
 * SWR onErrorRetry에서 재시도 여부 결정
 * - 인증/권한 에러: 재시도해도 의미 없음 → false
 * - Not Found 에러: 재시도해도 의미 없음 → false
 * - AbortError: 의도적 중단 → false
 * - 최대 3회 초과 → false
 * - 네트워크 에러, 서버 에러(5xx): 재시도 허용 → true
 */
export function shouldRetryOnError(error: unknown, retryCount: number): boolean {
  if (isAbortError(error)) return false;
  if (isAuthError(error)) return false;
  if (isNotFoundError(error)) return false;
  if (retryCount >= 3) return false;
  return true;
}

/**
 * 재시도 딜레이 (exponential backoff)
 * retryCount 0 → 1s, 1 → 3s, 2 → 9s, 최대 30s
 */
export function retryDelay(retryCount: number): number {
  return Math.min(1000 * 3 ** retryCount, 30000);
}
