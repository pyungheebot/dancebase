import { describe, it, expect } from "vitest";
import { detectConflicts } from "@/lib/schedule-conflict";
import type { Schedule } from "@/types";

/** 테스트용 Schedule 객체 생성 헬퍼 */
function makeSchedule(
  id: string,
  starts_at: string,
  ends_at?: string | null
): Schedule {
  return {
    id,
    group_id: "group-1",
    project_id: null,
    title: `일정 ${id}`,
    description: null,
    location: null,
    address: null,
    latitude: null,
    longitude: null,
    attendance_method: "none",
    starts_at,
    // ends_at이 명시적으로 null이면 starts_at으로 폴백 (getEffectiveEnd가 +2h 추정)
    ends_at: ends_at != null ? ends_at : starts_at,
    created_by: "user-1",
    late_threshold: null,
    attendance_deadline: null,
    require_checkout: false,
    recurrence_id: null,
    max_attendees: null,
  };
}

describe("detectConflicts - 시간 겹침 감지", () => {
  it("새 일정이 기존 일정과 겹치면 해당 일정을 반환한다", () => {
    const existing = [
      makeSchedule("s1", "2026-03-01T10:00:00", "2026-03-01T12:00:00"),
    ];
    // 11:00~13:00: 기존 10:00~12:00과 겹침
    const conflicts = detectConflicts(
      { starts_at: "2026-03-01T11:00:00", ends_at: "2026-03-01T13:00:00" },
      existing
    );
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].id).toBe("s1");
  });

  it("완전히 포함되는 경우 겹침을 감지한다", () => {
    const existing = [
      makeSchedule("s2", "2026-03-01T09:00:00", "2026-03-01T18:00:00"),
    ];
    // 10:00~12:00: 기존 09:00~18:00에 완전히 포함
    const conflicts = detectConflicts(
      { starts_at: "2026-03-01T10:00:00", ends_at: "2026-03-01T12:00:00" },
      existing
    );
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].id).toBe("s2");
  });

  it("새 일정이 기존 일정을 완전히 감싸는 경우 겹침을 감지한다", () => {
    const existing = [
      makeSchedule("s3", "2026-03-01T10:00:00", "2026-03-01T11:00:00"),
    ];
    // 09:00~13:00: 기존 10:00~11:00을 완전히 포함
    const conflicts = detectConflicts(
      { starts_at: "2026-03-01T09:00:00", ends_at: "2026-03-01T13:00:00" },
      existing
    );
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].id).toBe("s3");
  });
});

describe("detectConflicts - 겹치지 않는 경우", () => {
  it("새 일정이 기존 일정 이후에 시작하면 빈 배열을 반환한다", () => {
    const existing = [
      makeSchedule("s4", "2026-03-01T10:00:00", "2026-03-01T12:00:00"),
    ];
    // 12:00~14:00: 기존 10:00~12:00 이후
    const conflicts = detectConflicts(
      { starts_at: "2026-03-01T12:00:00", ends_at: "2026-03-01T14:00:00" },
      existing
    );
    expect(conflicts).toHaveLength(0);
  });

  it("새 일정이 기존 일정 이전에 끝나면 빈 배열을 반환한다", () => {
    const existing = [
      makeSchedule("s5", "2026-03-01T14:00:00", "2026-03-01T16:00:00"),
    ];
    // 10:00~14:00: 기존 14:00~16:00 이전에 종료
    const conflicts = detectConflicts(
      { starts_at: "2026-03-01T10:00:00", ends_at: "2026-03-01T14:00:00" },
      existing
    );
    expect(conflicts).toHaveLength(0);
  });

  it("기존 일정 목록이 비어 있으면 빈 배열을 반환한다", () => {
    const conflicts = detectConflicts(
      { starts_at: "2026-03-01T10:00:00", ends_at: "2026-03-01T12:00:00" },
      []
    );
    expect(conflicts).toHaveLength(0);
  });

  it("다른 날짜의 같은 시간대는 겹치지 않는다", () => {
    const existing = [
      makeSchedule("s6", "2026-03-01T10:00:00", "2026-03-01T12:00:00"),
    ];
    // 2026-03-02 10:00~12:00: 다른 날짜
    const conflicts = detectConflicts(
      { starts_at: "2026-03-02T10:00:00", ends_at: "2026-03-02T12:00:00" },
      existing
    );
    expect(conflicts).toHaveLength(0);
  });
});

describe("detectConflicts - 경계 케이스", () => {
  it("새 일정의 ends_at이 없으면 starts_at + 2시간으로 추정한다", () => {
    // 기존 일정: 11:30~13:00
    const existing = [
      makeSchedule("s7", "2026-03-01T11:30:00", "2026-03-01T13:00:00"),
    ];
    // 새 일정: 12:00 시작 (ends_at 없음) → 12:00~14:00으로 추정
    // 12:00 < 13:00(기존 종료) && 14:00 > 11:30(기존 시작) → 겹침
    const conflicts = detectConflicts(
      { starts_at: "2026-03-01T12:00:00" },
      existing
    );
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].id).toBe("s7");
  });

  it("ends_at이 없는 새 일정도 +2시간으로 추정하여 겹침 확인한다", () => {
    // 기존 일정: 12:00~13:00
    const existing = [
      makeSchedule("s8", "2026-03-01T12:00:00", "2026-03-01T13:00:00"),
    ];
    // 새 일정: 11:00 시작 (ends_at 없음) → 11:00~13:00으로 추정 → 12:00~13:00과 겹침
    const conflicts = detectConflicts(
      { starts_at: "2026-03-01T11:00:00" },
      existing
    );
    expect(conflicts).toHaveLength(1);
  });

  it("excludeId가 있으면 해당 일정을 제외하고 검사한다 (수정 모드)", () => {
    const existing = [
      makeSchedule("s9", "2026-03-01T10:00:00", "2026-03-01T12:00:00"),
      makeSchedule("s10", "2026-03-01T11:00:00", "2026-03-01T13:00:00"),
    ];
    // s9를 수정 중이므로 제외 → s10만 감지
    const conflicts = detectConflicts(
      { starts_at: "2026-03-01T10:00:00", ends_at: "2026-03-01T12:00:00" },
      existing,
      "s9"
    );
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].id).toBe("s10");
  });

  it("excludeId가 없으면 모든 일정을 검사한다", () => {
    const existing = [
      makeSchedule("s11", "2026-03-01T10:00:00", "2026-03-01T12:00:00"),
      makeSchedule("s12", "2026-03-01T11:00:00", "2026-03-01T13:00:00"),
    ];
    const conflicts = detectConflicts(
      { starts_at: "2026-03-01T10:30:00", ends_at: "2026-03-01T11:30:00" },
      existing
    );
    expect(conflicts).toHaveLength(2);
  });

  it("겹침 여부: newStart < existingEnd && newEnd > existingStart 알고리즘 검증", () => {
    const existing = [
      makeSchedule("s13", "2026-03-01T10:00:00", "2026-03-01T12:00:00"),
    ];
    // 정확히 끝나는 시점에 시작: 12:00~14:00 → newStart(12:00) == existingEnd(12:00) → 겹치지 않음
    const noConflict = detectConflicts(
      { starts_at: "2026-03-01T12:00:00", ends_at: "2026-03-01T14:00:00" },
      existing
    );
    expect(noConflict).toHaveLength(0);

    // 1초라도 겹치면 감지: 11:59~14:00
    const hasConflict = detectConflicts(
      { starts_at: "2026-03-01T11:59:00", ends_at: "2026-03-01T14:00:00" },
      existing
    );
    expect(hasConflict).toHaveLength(1);
  });
});
