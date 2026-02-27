import type { Schedule } from "@/types";

/**
 * 두 일정이 시간 상 겹치는지 판단합니다.
 * 알고리즘: newStart < existingEnd && newEnd > existingStart
 * ends_at이 없는 경우 starts_at + 2시간으로 추정합니다.
 */
function getEffectiveEnd(starts_at: string, ends_at?: string | null): Date {
  if (ends_at) return new Date(ends_at);
  const start = new Date(starts_at);
  return new Date(start.getTime() + 2 * 60 * 60 * 1000);
}

export type ConflictTarget = {
  starts_at: string;
  ends_at?: string | null;
};

/**
 * 새 일정과 기존 일정 목록 중 시간이 겹치는 일정을 반환합니다.
 * @param newSchedule 새로 생성/수정하려는 일정의 시간 정보
 * @param existingSchedules 비교할 기존 일정 목록
 * @param excludeId 수정 모드에서 자기 자신을 제외하기 위한 ID
 */
export function detectConflicts(
  newSchedule: ConflictTarget,
  existingSchedules: Schedule[],
  excludeId?: string
): Schedule[] {
  const newStart = new Date(newSchedule.starts_at);
  const newEnd = getEffectiveEnd(newSchedule.starts_at, newSchedule.ends_at);

  return existingSchedules.filter((existing) => {
    // 수정 모드에서 자기 자신 제외
    if (excludeId && existing.id === excludeId) return false;

    const existingStart = new Date(existing.starts_at);
    const existingEnd = getEffectiveEnd(existing.starts_at, existing.ends_at);

    return newStart < existingEnd && newEnd > existingStart;
  });
}
