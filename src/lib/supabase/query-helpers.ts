/**
 * Supabase 쿼리 결과를 안전하게 처리하는 헬퍼
 *
 * - unwrapResult: 에러 시 null 반환 + 로깅
 * - queryOne: 단일 행 쿼리 안전 실행
 * - queryMany: 다중 행 쿼리 안전 실행
 */

import { createClient } from "./client";
import logger from "@/lib/logger";

type SupabaseQueryBuilder = ReturnType<ReturnType<typeof createClient>["from"]>;

// ============================================
// unwrapResult
// ============================================

/**
 * Supabase 쿼리 결과를 안전하게 unwrap
 * 에러 시 로그를 남기고 null 반환
 *
 * @example
 * const result = await supabase.from("profiles").select("*").single();
 * const data = unwrapResult(result); // Profile | null
 */
export function unwrapResult<T>(result: {
  data: T | null;
  error: unknown;
}): T | null {
  if (result.error) {
    logger.error("Supabase query failed", "query-helpers", result.error);
    return null;
  }
  return result.data;
}

/**
 * Supabase 배열 쿼리 결과를 안전하게 unwrap
 * 에러 시 로그를 남기고 빈 배열 반환
 *
 * @example
 * const result = await supabase.from("members").select("*");
 * const rows = unwrapArrayResult(result); // T[]
 */
export function unwrapArrayResult<T>(result: {
  data: T[] | null;
  error: unknown;
}): T[] {
  if (result.error) {
    logger.error("Supabase query failed", "query-helpers", result.error);
    return [];
  }
  return result.data ?? [];
}

// ============================================
// queryOne / queryMany
// ============================================

/**
 * 단일 행 쿼리 안전 실행
 * 에러 시 null 반환 + 로깅
 *
 * @example
 * const profile = await queryOne<Profile>(
 *   "profiles",
 *   (q) => q.select("*").eq("id", userId).single()
 * );
 */
export async function queryOne<T>(
  table: string,
  query: (q: SupabaseQueryBuilder) => Promise<{ data: T | null; error: unknown }>
): Promise<T | null> {
  try {
    const supabase = createClient();
    const result = await query(supabase.from(table));
    return unwrapResult(result);
  } catch (err) {
    logger.error(`queryOne failed on table: ${table}`, "query-helpers", err);
    return null;
  }
}

/**
 * 다중 행 쿼리 안전 실행
 * 에러 시 빈 배열 반환 + 로깅
 *
 * @example
 * const members = await queryMany<GroupMember>(
 *   "group_members",
 *   (q) => q.select("*").eq("group_id", groupId)
 * );
 */
export async function queryMany<T>(
  table: string,
  query: (q: SupabaseQueryBuilder) => Promise<{ data: T[] | null; error: unknown }>
): Promise<T[]> {
  try {
    const supabase = createClient();
    const result = await query(supabase.from(table));
    return unwrapArrayResult(result);
  } catch (err) {
    logger.error(`queryMany failed on table: ${table}`, "query-helpers", err);
    return [];
  }
}
