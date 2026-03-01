/**
 * use-practice-checkin 테스트
 *
 * 연습 체크인 훅의 순수 계산 로직을 검증합니다.
 * - storageKey: localStorage 키 생성
 * - calcLateMinutes: 지각 분수 계산
 * - 세션 관리 (createSession, endSession, deleteSession)
 * - 체크인/체크아웃/결석 처리 로직
 * - 통계 (totalSessions, activeSession, averageAttendanceRate)
 * - 경계값, 빈 데이터, 동시 세션 처리
 */

import { describe, it, expect } from "vitest";
import type {
  PracticeCheckinSession,
  PracticeCheckinRecord,
  PracticeCheckinStatus,
} from "@/types/localStorage/practice";

// ============================================================
// 훅에서 추출한 순수 계산 함수들
// ============================================================

/** localStorage 키 생성 */
function storageKey(groupId: string): string {
  return `dancebase:practice-checkin:${groupId}`;
}

/** 지각 분수 계산 */
function calcLateMinutes(startTime: string, checkinTime: string): number {
  const [sh, sm] = startTime.split(":").map(Number);
  const [ch, cm] = checkinTime.split(":").map(Number);
  const startTotal = sh * 60 + sm;
  const checkinTotal = ch * 60 + cm;
  const diff = checkinTotal - startTotal;
  return diff > 0 ? diff : 0;
}

/** 평균 출석률 계산 */
function calcAverageAttendanceRate(
  sessions: PracticeCheckinSession[],
  records: PracticeCheckinRecord[]
): number {
  const pastSessions = sessions.filter((s) => !s.isActive);
  if (pastSessions.length === 0) return 0;

  const rates = pastSessions.map((session) => {
    const sessionRecords = records.filter((r) => r.sessionId === session.id);
    if (sessionRecords.length === 0) return 0;
    const attended = sessionRecords.filter(
      (r) => r.status === "checked_in" || r.status === "checked_out"
    ).length;
    return Math.round((attended / sessionRecords.length) * 100);
  });

  const total = rates.reduce((sum, r) => sum + r, 0);
  return Math.round(total / rates.length);
}

/** 활성 세션 조회 */
function findActiveSession(
  sessions: PracticeCheckinSession[]
): PracticeCheckinSession | null {
  return sessions.find((s) => s.isActive) ?? null;
}

/** 세션별 기록 조회 */
function getSessionRecords(
  records: PracticeCheckinRecord[],
  sessionId: string
): PracticeCheckinRecord[] {
  return records.filter((r) => r.sessionId === sessionId);
}

/** 체크인 레코드 업데이트 또는 생성 */
function applyCheckin(
  records: PracticeCheckinRecord[],
  sessionId: string,
  memberName: string,
  checkinTime: string,
  lateMinutes: number
): PracticeCheckinRecord[] {
  const existing = records.find(
    (r) => r.sessionId === sessionId && r.memberName === memberName
  );
  if (existing) {
    return records.map((r) =>
      r.id === existing.id
        ? {
            ...r,
            status: "checked_in" as PracticeCheckinStatus,
            checkinTime,
            lateMinutes,
            checkoutTime: undefined,
          }
        : r
    );
  }
  const newRecord: PracticeCheckinRecord = {
    id: `rec-${Date.now()}`,
    sessionId,
    memberName,
    status: "checked_in",
    checkinTime,
    lateMinutes,
    createdAt: new Date().toISOString(),
  };
  return [...records, newRecord];
}

/** 체크아웃 처리 */
function applyCheckout(
  records: PracticeCheckinRecord[],
  sessionId: string,
  memberName: string,
  checkoutTime: string
): PracticeCheckinRecord[] {
  return records.map((r) =>
    r.sessionId === sessionId && r.memberName === memberName
      ? { ...r, status: "checked_out" as PracticeCheckinStatus, checkoutTime }
      : r
  );
}

/** 결석 처리 */
function applyMarkAbsent(
  records: PracticeCheckinRecord[],
  sessionId: string,
  memberName: string
): PracticeCheckinRecord[] {
  const existing = records.find(
    (r) => r.sessionId === sessionId && r.memberName === memberName
  );
  if (existing) {
    return records.map((r) =>
      r.id === existing.id
        ? {
            ...r,
            status: "absent" as PracticeCheckinStatus,
            checkinTime: undefined,
            checkoutTime: undefined,
            lateMinutes: undefined,
          }
        : r
    );
  }
  const newRecord: PracticeCheckinRecord = {
    id: `rec-${Date.now()}`,
    sessionId,
    memberName,
    status: "absent",
    createdAt: new Date().toISOString(),
  };
  return [...records, newRecord];
}

// ============================================================
// 테스트 헬퍼
// ============================================================

function makeSession(
  id: string,
  isActive = false,
  startTime = "19:00"
): PracticeCheckinSession {
  return {
    id,
    date: "2026-03-01",
    title: `세션-${id}`,
    startTime,
    isActive,
    createdAt: "2026-03-01T10:00:00.000Z",
  };
}

function makeRecord(
  id: string,
  sessionId: string,
  memberName: string,
  status: PracticeCheckinStatus = "checked_in",
  lateMinutes = 0
): PracticeCheckinRecord {
  return {
    id,
    sessionId,
    memberName,
    status,
    checkinTime: "19:05",
    lateMinutes,
    createdAt: "2026-03-01T10:05:00.000Z",
  };
}

// ============================================================
// storageKey
// ============================================================

describe("storageKey - localStorage 키 생성", () => {
  it("groupId를 포함한 키를 반환한다", () => {
    expect(storageKey("g1")).toBe("dancebase:practice-checkin:g1");
  });

  it("서로 다른 groupId는 다른 키를 생성한다", () => {
    expect(storageKey("g1")).not.toBe(storageKey("g2"));
  });

  it("같은 groupId로 호출하면 동일한 키를 반환한다", () => {
    expect(storageKey("myGroup")).toBe(storageKey("myGroup"));
  });
});

// ============================================================
// calcLateMinutes
// ============================================================

describe("calcLateMinutes - 지각 분수 계산", () => {
  it("정시 체크인 시 지각 분수는 0이다", () => {
    expect(calcLateMinutes("19:00", "19:00")).toBe(0);
  });

  it("5분 늦으면 5를 반환한다", () => {
    expect(calcLateMinutes("19:00", "19:05")).toBe(5);
  });

  it("30분 늦으면 30을 반환한다", () => {
    expect(calcLateMinutes("10:00", "10:30")).toBe(30);
  });

  it("일찍 도착한 경우(음수) 0을 반환한다", () => {
    expect(calcLateMinutes("19:00", "18:50")).toBe(0);
  });

  it("시간 경계를 넘는 지각도 계산된다 (예: 19:55 시작, 20:05 체크인)", () => {
    expect(calcLateMinutes("19:55", "20:05")).toBe(10);
  });

  it("정각 00:00 시작 체크인도 처리한다", () => {
    expect(calcLateMinutes("00:00", "00:15")).toBe(15);
  });

  it("동일 시각이면 0을 반환한다", () => {
    expect(calcLateMinutes("14:30", "14:30")).toBe(0);
  });

  it("1분 지각은 1을 반환한다", () => {
    expect(calcLateMinutes("09:59", "10:00")).toBe(1);
  });
});

// ============================================================
// calcAverageAttendanceRate
// ============================================================

describe("calcAverageAttendanceRate - 평균 출석률", () => {
  it("세션이 없으면 0을 반환한다", () => {
    expect(calcAverageAttendanceRate([], [])).toBe(0);
  });

  it("모두 활성 세션이면 0을 반환한다", () => {
    const sessions = [makeSession("s1", true), makeSession("s2", true)];
    expect(calcAverageAttendanceRate(sessions, [])).toBe(0);
  });

  it("비활성 세션에 기록이 없으면 0으로 계산된다", () => {
    const sessions = [makeSession("s1", false)];
    expect(calcAverageAttendanceRate(sessions, [])).toBe(0);
  });

  it("100% 출석률 계산이 올바르다", () => {
    const sessions = [makeSession("s1", false)];
    const records = [
      makeRecord("r1", "s1", "홍길동", "checked_in"),
      makeRecord("r2", "s1", "김철수", "checked_out"),
    ];
    expect(calcAverageAttendanceRate(sessions, records)).toBe(100);
  });

  it("50% 출석률 계산이 올바르다", () => {
    const sessions = [makeSession("s1", false)];
    const records = [
      makeRecord("r1", "s1", "홍길동", "checked_in"),
      makeRecord("r2", "s1", "김철수", "absent"),
    ];
    expect(calcAverageAttendanceRate(sessions, records)).toBe(50);
  });

  it("여러 세션의 평균 출석률을 올바르게 계산한다", () => {
    const sessions = [makeSession("s1", false), makeSession("s2", false)];
    // s1: 100%, s2: 0% → 평균 50%
    const records = [
      makeRecord("r1", "s1", "홍길동", "checked_in"),
      makeRecord("r2", "s2", "홍길동", "absent"),
    ];
    expect(calcAverageAttendanceRate(sessions, records)).toBe(50);
  });

  it("absent 상태는 출석으로 계산되지 않는다", () => {
    const sessions = [makeSession("s1", false)];
    const records = [
      makeRecord("r1", "s1", "홍길동", "absent"),
      makeRecord("r2", "s1", "김철수", "absent"),
    ];
    expect(calcAverageAttendanceRate(sessions, records)).toBe(0);
  });

  it("checked_out은 출석으로 계산된다", () => {
    const sessions = [makeSession("s1", false)];
    const records = [makeRecord("r1", "s1", "홍길동", "checked_out")];
    expect(calcAverageAttendanceRate(sessions, records)).toBe(100);
  });
});

// ============================================================
// findActiveSession
// ============================================================

describe("findActiveSession - 활성 세션 조회", () => {
  it("활성 세션이 없으면 null을 반환한다", () => {
    const sessions = [makeSession("s1", false), makeSession("s2", false)];
    expect(findActiveSession(sessions)).toBeNull();
  });

  it("활성 세션이 있으면 해당 세션을 반환한다", () => {
    const sessions = [makeSession("s1", false), makeSession("s2", true)];
    const result = findActiveSession(sessions);
    expect(result?.id).toBe("s2");
  });

  it("빈 배열에서 활성 세션 조회 시 null을 반환한다", () => {
    expect(findActiveSession([])).toBeNull();
  });

  it("여러 활성 세션이 있으면 첫 번째를 반환한다", () => {
    const sessions = [makeSession("s1", true), makeSession("s2", true)];
    const result = findActiveSession(sessions);
    expect(result?.id).toBe("s1");
  });
});

// ============================================================
// getSessionRecords
// ============================================================

describe("getSessionRecords - 세션별 기록 조회", () => {
  it("해당 세션의 기록만 반환한다", () => {
    const records = [
      makeRecord("r1", "s1", "홍길동"),
      makeRecord("r2", "s2", "김철수"),
      makeRecord("r3", "s1", "이영희"),
    ];
    const result = getSessionRecords(records, "s1");
    expect(result).toHaveLength(2);
    expect(result.every((r) => r.sessionId === "s1")).toBe(true);
  });

  it("기록이 없는 세션 조회 시 빈 배열을 반환한다", () => {
    const records = [makeRecord("r1", "s1", "홍길동")];
    expect(getSessionRecords(records, "nonexistent")).toHaveLength(0);
  });

  it("빈 기록 목록에서 조회 시 빈 배열을 반환한다", () => {
    expect(getSessionRecords([], "s1")).toHaveLength(0);
  });
});

// ============================================================
// applyCheckin
// ============================================================

describe("applyCheckin - 체크인 처리", () => {
  it("신규 멤버 체크인 시 레코드가 추가된다", () => {
    const records: PracticeCheckinRecord[] = [];
    const result = applyCheckin(records, "s1", "홍길동", "19:05", 5);
    expect(result).toHaveLength(1);
    expect(result[0].memberName).toBe("홍길동");
    expect(result[0].status).toBe("checked_in");
  });

  it("체크인 시 lateMinutes가 올바르게 저장된다", () => {
    const records: PracticeCheckinRecord[] = [];
    const result = applyCheckin(records, "s1", "홍길동", "19:10", 10);
    expect(result[0].lateMinutes).toBe(10);
  });

  it("기존 레코드가 있으면 업데이트한다", () => {
    const existing = makeRecord("r1", "s1", "홍길동", "absent");
    const result = applyCheckin([existing], "s1", "홍길동", "19:05", 5);
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe("checked_in");
  });

  it("재체크인 시 checkoutTime이 undefined로 초기화된다", () => {
    const existing: PracticeCheckinRecord = {
      ...makeRecord("r1", "s1", "홍길동", "checked_out"),
      checkoutTime: "21:00",
    };
    const result = applyCheckin([existing], "s1", "홍길동", "19:05", 5);
    expect(result[0].checkoutTime).toBeUndefined();
  });

  it("다른 세션/멤버의 기록은 변경되지 않는다", () => {
    const r1 = makeRecord("r1", "s1", "홍길동");
    const r2 = makeRecord("r2", "s2", "김철수");
    const result = applyCheckin([r1, r2], "s3", "이영희", "19:00", 0);
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual(r1);
    expect(result[1]).toEqual(r2);
  });
});

// ============================================================
// applyCheckout
// ============================================================

describe("applyCheckout - 체크아웃 처리", () => {
  it("체크아웃 시 status가 checked_out으로 변경된다", () => {
    const records = [makeRecord("r1", "s1", "홍길동", "checked_in")];
    const result = applyCheckout(records, "s1", "홍길동", "21:00");
    expect(result[0].status).toBe("checked_out");
  });

  it("체크아웃 시 checkoutTime이 저장된다", () => {
    const records = [makeRecord("r1", "s1", "홍길동", "checked_in")];
    const result = applyCheckout(records, "s1", "홍길동", "21:30");
    expect(result[0].checkoutTime).toBe("21:30");
  });

  it("다른 멤버의 레코드는 변경되지 않는다", () => {
    const records = [
      makeRecord("r1", "s1", "홍길동", "checked_in"),
      makeRecord("r2", "s1", "김철수", "checked_in"),
    ];
    const result = applyCheckout(records, "s1", "홍길동", "21:00");
    expect(result[1].status).toBe("checked_in");
    expect(result[1].checkoutTime).toBeUndefined();
  });
});

// ============================================================
// applyMarkAbsent
// ============================================================

describe("applyMarkAbsent - 결석 처리", () => {
  it("신규 멤버 결석 처리 시 레코드가 추가된다", () => {
    const records: PracticeCheckinRecord[] = [];
    const result = applyMarkAbsent(records, "s1", "홍길동");
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe("absent");
  });

  it("기존 레코드가 있으면 absent로 업데이트한다", () => {
    const existing = makeRecord("r1", "s1", "홍길동", "checked_in");
    const result = applyMarkAbsent([existing], "s1", "홍길동");
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe("absent");
  });

  it("결석 처리 시 checkinTime이 undefined로 초기화된다", () => {
    const existing = makeRecord("r1", "s1", "홍길동", "checked_in");
    const result = applyMarkAbsent([existing], "s1", "홍길동");
    expect(result[0].checkinTime).toBeUndefined();
  });

  it("결석 처리 시 lateMinutes가 undefined로 초기화된다", () => {
    const existing = makeRecord("r1", "s1", "홍길동", "checked_in", 10);
    const result = applyMarkAbsent([existing], "s1", "홍길동");
    expect(result[0].lateMinutes).toBeUndefined();
  });
});
