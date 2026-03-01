/**
 * 재사용 가능한 타입 가드 함수
 *
 * - 런타임 검증: development 환경에서만 경고 출력
 * - 타입 narrowing: 항상 동작
 * - 성능: 최소한의 검증만 수행
 */

import logger from "@/lib/logger";

// ============================================
// 기본 가드
// ============================================

/** null / undefined를 걸러내는 타입 가드 */
export function isNonNull<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/** string 타입 가드 */
export function isString(value: unknown): value is string {
  return typeof value === "string";
}

/** number 타입 가드 */
export function isNumber(value: unknown): value is number {
  return typeof value === "number" && !Number.isNaN(value);
}

/** Record<string, unknown> 타입 가드 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** 배열 타입 가드 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

// ============================================
// Supabase 응답 가드
// ============================================

/** { id: string } 형태인지 검사 */
export function hasId(value: unknown): value is { id: string } {
  return isRecord(value) && isString((value as Record<string, unknown>).id);
}

/** Supabase 에러 객체 형태인지 검사 */
export function isSupabaseError(
  value: unknown
): value is { code: string; message: string; details: string } {
  if (!isRecord(value)) return false;
  const v = value as Record<string, unknown>;
  return isString(v.code) && isString(v.message);
}

// ============================================
// 배열 필터 헬퍼
// ============================================

/**
 * null / undefined 요소를 제거하고 타입을 narrowing
 * @example
 * const items = filterNonNull([1, null, 2, undefined, 3]); // number[]
 */
export function filterNonNull<T>(arr: (T | null | undefined)[]): T[] {
  return arr.filter(isNonNull);
}

// ============================================
// Supabase 행 데이터 캐스팅 헬퍼
// ============================================

/**
 * Supabase에서 반환된 데이터를 원하는 타입으로 안전하게 캐스팅
 * development 환경에서 필수 필드 누락 경고를 출력
 *
 * @example
 * const rows = castRows<{ status: string }>(data, ["status"], "use-attendance");
 */
export function castRows<T extends Record<string, unknown>>(
  data: unknown[] | null | undefined,
  requiredFields: (keyof T)[],
  context?: string
): T[] {
  if (!data) return [];

  if (process.env.NODE_ENV === "development" && requiredFields.length > 0) {
    for (const row of data) {
      if (!isRecord(row)) {
        logger.warn("castRows: 행이 객체가 아닙니다.", context ?? "type-guards", row);
        continue;
      }
      for (const field of requiredFields) {
        if (!(field as string in row)) {
          logger.warn(
            `castRows: 필드 누락 - ${String(field)}`,
            context ?? "type-guards",
            row
          );
        }
      }
    }
  }

  return data as T[];
}

/**
 * 단일 Supabase 행 데이터를 원하는 타입으로 안전하게 캐스팅
 * development 환경에서 필수 필드 누락 경고를 출력
 *
 * @example
 * const row = castRow<{ name: string }>(data, ["name"], "use-profile");
 */
export function castRow<T extends Record<string, unknown>>(
  data: unknown | null | undefined,
  requiredFields: (keyof T)[],
  context?: string
): T | null {
  if (!isNonNull(data)) return null;

  if (process.env.NODE_ENV === "development" && isRecord(data) && requiredFields.length > 0) {
    for (const field of requiredFields) {
      if (!(field as string in data)) {
        logger.warn(
          `castRow: 필드 누락 - ${String(field)}`,
          context ?? "type-guards",
          data
        );
      }
    }
  }

  return data as T;
}

/**
 * Supabase 조인 결과에서 단일 프로필 객체를 안전하게 추출
 * Supabase는 조인 결과를 배열 또는 단일 객체로 반환할 수 있음
 *
 * @example
 * const profile = extractProfile(post.profiles);
 */
export function extractProfile<T extends Record<string, unknown>>(
  profiles: unknown
): T | null {
  if (!isNonNull(profiles)) return null;
  if (Array.isArray(profiles)) {
    return profiles.length > 0 ? (profiles[0] as T) : null;
  }
  if (isRecord(profiles)) {
    return profiles as T;
  }
  return null;
}
