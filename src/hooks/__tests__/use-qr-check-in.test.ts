import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useState as reactUseState, useCallback as reactUseCallback } from "react";

// ─── localStorage mock ────────────────────────────────────────
const lsStore: Record<string, string> = {};

Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem: (k: string) => lsStore[k] ?? null,
    setItem: (k: string, v: string) => { lsStore[k] = v; },
    removeItem: (k: string) => { delete lsStore[k]; },
    clear: () => { Object.keys(lsStore).forEach((k) => delete lsStore[k]); },
  },
  writable: true,
  configurable: true,
});

// ─── SWR mock ─────────────────────────────────────────────────
vi.mock("swr", () => {
  const { useRef } = require("react");
  return {
    default: (key: string | null, fetcher: (() => unknown) | null, options?: { fallbackData?: unknown }) => {
      if (!key || !fetcher) {
        return { data: options?.fallbackData ?? undefined, isLoading: false, mutate: vi.fn() };
      }
      const initial = fetcher();
      const [data, setData] = reactUseState<unknown>(() => initial);
      const setDataRef = useRef(setData);
      setDataRef.current = setData;

      const mutate = reactUseCallback((newData?: unknown) => {
        if (newData !== undefined) {
          setDataRef.current(newData);
        } else {
          setDataRef.current(fetcher!());
        }
        return Promise.resolve();
      }, []);

      return { data, isLoading: false, mutate };
    },
  };
});

// ─── SWR keys mock ────────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    qrCheckIn: (groupId: string) => `qr-check-in-${groupId}`,
  },
}));

// ─── crypto mock ──────────────────────────────────────────────
let _uuidCounter = 0;
Object.defineProperty(globalThis, "crypto", {
  value: { randomUUID: () => `uuid-${++_uuidCounter}` },
  writable: true,
  configurable: true,
});

import { useQrCheckIn, generateQrCode } from "@/hooks/use-qr-check-in";

function makeHook(groupId = "group-1") {
  return renderHook(() => useQrCheckIn(groupId));
}

function clearAll() {
  Object.keys(lsStore).forEach((k) => delete lsStore[k]);
  _uuidCounter = 0;
}

// ============================================================
// generateQrCode (순수 유틸)
// ============================================================

describe("generateQrCode - 순수 유틸", () => {
  it("기본 길이 8의 코드를 생성한다", () => {
    const code = generateQrCode();
    expect(code).toHaveLength(8);
  });

  it("지정한 길이 12의 코드를 생성한다", () => {
    const code = generateQrCode(12);
    expect(code).toHaveLength(12);
  });

  it("길이 1의 코드를 생성한다", () => {
    const code = generateQrCode(1);
    expect(code).toHaveLength(1);
  });

  it("생성된 코드는 허용 문자(대문자 알파벳+숫자, O·I·0·1 제외)만 포함한다", () => {
    const code = generateQrCode(100);
    expect(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/.test(code)).toBe(true);
  });

  it("O, I, 0, 1은 코드에 포함되지 않는다", () => {
    const code = generateQrCode(200);
    expect(code).not.toMatch(/[OI01]/);
  });

  it("여러 번 호출하면 다른 코드가 생성될 수 있다 (무작위성 검증)", () => {
    const results = new Set(Array.from({ length: 20 }, () => generateQrCode()));
    expect(results.size).toBeGreaterThan(1);
  });
});

// ============================================================
// 초기 상태
// ============================================================

describe("useQrCheckIn - 초기 상태", () => {
  beforeEach(clearAll);

  it("초기 sessions는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.sessions).toEqual([]);
  });

  it("초기 records는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.records).toEqual([]);
  });

  it("초기 activeSession은 null이다", () => {
    const { result } = makeHook();
    expect(result.current.activeSession).toBeNull();
  });

  it("초기 totalSessions는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.totalSessions).toBe(0);
  });

  it("초기 totalCheckIns는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.totalCheckIns).toBe(0);
  });

  it("초기 averageAttendance는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.averageAttendance).toBe(0);
  });

  it("초기 memberAttendanceRanking은 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.memberAttendanceRanking).toEqual([]);
  });

  it("필요한 모든 함수가 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.createSession).toBe("function");
    expect(typeof result.current.endSession).toBe("function");
    expect(typeof result.current.deleteSession).toBe("function");
    expect(typeof result.current.checkIn).toBe("function");
    expect(typeof result.current.checkInByQr).toBe("function");
    expect(typeof result.current.removeCheckIn).toBe("function");
    expect(typeof result.current.getSessionRecords).toBe("function");
    expect(typeof result.current.refetch).toBe("function");
  });
});

// ============================================================
// createSession
// ============================================================

describe("useQrCheckIn - createSession", () => {
  beforeEach(clearAll);

  it("세션 생성 후 totalSessions가 1이 된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createSession("월요일 연습", "2026-03-02", "19:00");
    });
    expect(result.current.totalSessions).toBe(1);
  });

  it("생성된 세션의 title이 올바르다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createSession("특별 연습", "2026-03-02", "19:00");
    });
    expect(result.current.sessions[0].title).toBe("특별 연습");
  });

  it("생성된 세션은 isActive가 true이다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createSession("연습", "2026-03-02", "19:00");
    });
    expect(result.current.sessions[0].isActive).toBe(true);
  });

  it("생성된 세션이 activeSession으로 설정된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createSession("연습", "2026-03-02", "19:00");
    });
    expect(result.current.activeSession).not.toBeNull();
    expect(result.current.activeSession?.title).toBe("연습");
  });

  it("새 세션 생성 시 기존 활성 세션은 비활성화된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createSession("연습1", "2026-03-02", "19:00");
    });
    act(() => {
      result.current.createSession("연습2", "2026-03-03", "20:00");
    });
    const inactiveSessions = result.current.sessions.filter((s) => !s.isActive);
    expect(inactiveSessions).toHaveLength(1);
  });

  it("생성된 세션에 8자리 QR 코드가 부여된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createSession("연습", "2026-03-02", "19:00");
    });
    expect(result.current.sessions[0].qrCode).toHaveLength(8);
  });

  it("생성된 세션의 endTime은 null이다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createSession("연습", "2026-03-02", "19:00");
    });
    expect(result.current.sessions[0].endTime).toBeNull();
  });

  it("생성된 세션 객체가 반환된다", () => {
    const { result } = makeHook();
    let session: ReturnType<typeof result.current.createSession> | undefined;
    act(() => {
      session = result.current.createSession("연습", "2026-03-02", "19:00");
    });
    expect(session).toBeDefined();
    expect(session?.title).toBe("연습");
  });

  it("생성된 세션에 고유 id가 부여된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createSession("연습1", "2026-03-02", "19:00");
    });
    act(() => {
      result.current.createSession("연습2", "2026-03-03", "20:00");
    });
    const ids = result.current.sessions.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ============================================================
// endSession
// ============================================================

describe("useQrCheckIn - endSession", () => {
  beforeEach(clearAll);

  it("세션 종료 후 isActive가 false가 된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createSession("연습", "2026-03-02", "19:00");
    });
    const sessionId = result.current.sessions[0].id;
    act(() => {
      result.current.endSession(sessionId);
    });
    expect(result.current.sessions[0].isActive).toBe(false);
  });

  it("세션 종료 후 activeSession이 null이 된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createSession("연습", "2026-03-02", "19:00");
    });
    const sessionId = result.current.sessions[0].id;
    act(() => {
      result.current.endSession(sessionId);
    });
    expect(result.current.activeSession).toBeNull();
  });

  it("세션 종료 후 endTime이 설정된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createSession("연습", "2026-03-02", "19:00");
    });
    const sessionId = result.current.sessions[0].id;
    act(() => {
      result.current.endSession(sessionId);
    });
    expect(result.current.sessions[0].endTime).not.toBeNull();
  });

  it("존재하지 않는 세션 종료 시 에러가 없다", () => {
    const { result } = makeHook();
    expect(() => {
      act(() => {
        result.current.endSession("non-existent");
      });
    }).not.toThrow();
  });
});

// ============================================================
// deleteSession
// ============================================================

describe("useQrCheckIn - deleteSession", () => {
  beforeEach(clearAll);

  it("세션 삭제 후 totalSessions가 감소한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createSession("연습", "2026-03-02", "19:00");
    });
    const sessionId = result.current.sessions[0].id;
    act(() => {
      result.current.deleteSession(sessionId);
    });
    expect(result.current.totalSessions).toBe(0);
  });

  it("세션 삭제 시 해당 세션의 체크인 기록도 삭제된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createSession("연습", "2026-03-02", "19:00");
    });
    const sessionId = result.current.sessions[0].id;
    act(() => {
      result.current.checkIn(sessionId, "홍길동");
    });
    act(() => {
      result.current.deleteSession(sessionId);
    });
    expect(result.current.totalCheckIns).toBe(0);
  });

  it("다른 세션의 기록은 유지된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createSession("연습1", "2026-03-02", "19:00");
    });
    const session1Id = result.current.sessions[0].id;
    act(() => {
      result.current.checkIn(session1Id, "홍길동");
    });
    act(() => {
      result.current.createSession("연습2", "2026-03-03", "20:00");
    });
    const session2Id = result.current.sessions[0].id;
    act(() => {
      result.current.checkIn(session2Id, "김철수");
    });
    act(() => {
      result.current.deleteSession(session1Id);
    });
    expect(result.current.totalCheckIns).toBe(1);
  });

  it("존재하지 않는 세션 삭제 시 에러가 없다", () => {
    const { result } = makeHook();
    expect(() => {
      act(() => {
        result.current.deleteSession("non-existent");
      });
    }).not.toThrow();
  });
});

// ============================================================
// checkIn (수동 체크인)
// ============================================================

describe("useQrCheckIn - checkIn (수동)", () => {
  beforeEach(clearAll);

  it("체크인 성공 시 success: true를 반환한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createSession("연습", "2026-03-02", "19:00");
    });
    const sessionId = result.current.sessions[0].id;
    let res: { success: boolean; message: string } | undefined;
    act(() => {
      res = result.current.checkIn(sessionId, "홍길동");
    });
    expect(res?.success).toBe(true);
  });

  it("체크인 성공 메시지에 멤버 이름이 포함된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createSession("연습", "2026-03-02", "19:00");
    });
    const sessionId = result.current.sessions[0].id;
    let res: { success: boolean; message: string } | undefined;
    act(() => {
      res = result.current.checkIn(sessionId, "홍길동");
    });
    expect(res?.message).toContain("홍길동");
  });

  it("체크인 후 totalCheckIns가 증가한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createSession("연습", "2026-03-02", "19:00");
    });
    const sessionId = result.current.sessions[0].id;
    act(() => {
      result.current.checkIn(sessionId, "홍길동");
    });
    expect(result.current.totalCheckIns).toBe(1);
  });

  it("이미 체크인한 멤버 재체크인 시 success: false를 반환한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createSession("연습", "2026-03-02", "19:00");
    });
    const sessionId = result.current.sessions[0].id;
    act(() => {
      result.current.checkIn(sessionId, "홍길동");
    });
    let res: { success: boolean; message: string } | undefined;
    act(() => {
      res = result.current.checkIn(sessionId, "홍길동");
    });
    expect(res?.success).toBe(false);
    expect(result.current.totalCheckIns).toBe(1);
  });

  it("존재하지 않는 세션에 체크인 시 success: false를 반환한다", () => {
    const { result } = makeHook();
    let res: { success: boolean; message: string } | undefined;
    act(() => {
      res = result.current.checkIn("non-existent", "홍길동");
    });
    expect(res?.success).toBe(false);
  });

  it("체크인 기록의 method는 'manual'이다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createSession("연습", "2026-03-02", "19:00");
    });
    const sessionId = result.current.sessions[0].id;
    act(() => {
      result.current.checkIn(sessionId, "홍길동");
    });
    expect(result.current.records[0].method).toBe("manual");
  });

  it("여러 멤버가 순차적으로 체크인할 수 있다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createSession("연습", "2026-03-02", "19:00");
    });
    const sessionId = result.current.sessions[0].id;
    act(() => {
      result.current.checkIn(sessionId, "멤버A");
    });
    act(() => {
      result.current.checkIn(sessionId, "멤버B");
    });
    act(() => {
      result.current.checkIn(sessionId, "멤버C");
    });
    expect(result.current.totalCheckIns).toBe(3);
  });
});

// ============================================================
// checkInByQr (QR 체크인)
// ============================================================

describe("useQrCheckIn - checkInByQr", () => {
  beforeEach(clearAll);

  it("올바른 QR 코드로 체크인 성공 시 success: true를 반환한다", () => {
    const { result } = makeHook();
    let qrCode = "";
    act(() => {
      const session = result.current.createSession("연습", "2026-03-02", "19:00");
      qrCode = session.qrCode;
    });
    let res: { success: boolean; message: string } | undefined;
    act(() => {
      res = result.current.checkInByQr(qrCode, "홍길동");
    });
    expect(res?.success).toBe(true);
  });

  it("QR 체크인 기록의 method는 'qr'이다", () => {
    const { result } = makeHook();
    let qrCode = "";
    act(() => {
      const session = result.current.createSession("연습", "2026-03-02", "19:00");
      qrCode = session.qrCode;
    });
    act(() => {
      result.current.checkInByQr(qrCode, "홍길동");
    });
    expect(result.current.records[0].method).toBe("qr");
  });

  it("잘못된 QR 코드로 체크인 시 success: false를 반환한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createSession("연습", "2026-03-02", "19:00");
    });
    let res: { success: boolean; message: string } | undefined;
    act(() => {
      res = result.current.checkInByQr("WRONGQR!", "홍길동");
    });
    expect(res?.success).toBe(false);
  });

  it("비활성 세션의 QR 코드로 체크인 시 success: false를 반환한다", () => {
    const { result } = makeHook();
    let qrCode = "";
    act(() => {
      const session = result.current.createSession("연습", "2026-03-02", "19:00");
      qrCode = session.qrCode;
    });
    const sessionId = result.current.sessions[0].id;
    act(() => {
      result.current.endSession(sessionId);
    });
    let res: { success: boolean; message: string } | undefined;
    act(() => {
      res = result.current.checkInByQr(qrCode, "홍길동");
    });
    expect(res?.success).toBe(false);
  });

  it("QR 체크인 중복 시 success: false를 반환한다", () => {
    const { result } = makeHook();
    let qrCode = "";
    act(() => {
      const session = result.current.createSession("연습", "2026-03-02", "19:00");
      qrCode = session.qrCode;
    });
    act(() => {
      result.current.checkInByQr(qrCode, "홍길동");
    });
    let res: { success: boolean; message: string } | undefined;
    act(() => {
      res = result.current.checkInByQr(qrCode, "홍길동");
    });
    expect(res?.success).toBe(false);
  });

  it("QR 체크인 성공 메시지에 멤버 이름이 포함된다", () => {
    const { result } = makeHook();
    let qrCode = "";
    act(() => {
      const session = result.current.createSession("연습", "2026-03-02", "19:00");
      qrCode = session.qrCode;
    });
    let res: { success: boolean; message: string } | undefined;
    act(() => {
      res = result.current.checkInByQr(qrCode, "홍길동");
    });
    expect(res?.message).toContain("홍길동");
  });
});

// ============================================================
// removeCheckIn
// ============================================================

describe("useQrCheckIn - removeCheckIn", () => {
  beforeEach(clearAll);

  it("체크인 기록 삭제 후 totalCheckIns가 감소한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createSession("연습", "2026-03-02", "19:00");
    });
    const sessionId = result.current.sessions[0].id;
    act(() => {
      result.current.checkIn(sessionId, "홍길동");
    });
    const recordId = result.current.records[0].id;
    act(() => {
      result.current.removeCheckIn(recordId);
    });
    expect(result.current.totalCheckIns).toBe(0);
  });

  it("특정 기록만 삭제되고 나머지는 유지된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createSession("연습", "2026-03-02", "19:00");
    });
    const sessionId = result.current.sessions[0].id;
    act(() => {
      result.current.checkIn(sessionId, "멤버A");
    });
    act(() => {
      result.current.checkIn(sessionId, "멤버B");
    });
    const recordId = result.current.records[0].id;
    act(() => {
      result.current.removeCheckIn(recordId);
    });
    expect(result.current.totalCheckIns).toBe(1);
  });

  it("존재하지 않는 기록 삭제 시 에러가 없다", () => {
    const { result } = makeHook();
    expect(() => {
      act(() => {
        result.current.removeCheckIn("non-existent");
      });
    }).not.toThrow();
  });
});

// ============================================================
// getSessionRecords
// ============================================================

describe("useQrCheckIn - getSessionRecords", () => {
  beforeEach(clearAll);

  it("세션의 체크인 기록을 올바르게 조회한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createSession("연습", "2026-03-02", "19:00");
    });
    const sessionId = result.current.sessions[0].id;
    act(() => {
      result.current.checkIn(sessionId, "멤버A");
    });
    act(() => {
      result.current.checkIn(sessionId, "멤버B");
    });
    const records = result.current.getSessionRecords(sessionId);
    expect(records).toHaveLength(2);
  });

  it("체크인이 없는 세션은 빈 배열을 반환한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createSession("연습", "2026-03-02", "19:00");
    });
    const sessionId = result.current.sessions[0].id;
    const records = result.current.getSessionRecords(sessionId);
    expect(records).toEqual([]);
  });

  it("존재하지 않는 세션Id는 빈 배열을 반환한다", () => {
    const { result } = makeHook();
    const records = result.current.getSessionRecords("non-existent");
    expect(records).toEqual([]);
  });
});

// ============================================================
// 통계 - averageAttendance, memberAttendanceRanking
// ============================================================

describe("useQrCheckIn - 통계", () => {
  beforeEach(clearAll);

  it("세션당 평균 체크인 수가 올바르게 계산된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createSession("연습", "2026-03-02", "19:00");
    });
    const sessionId = result.current.sessions[0].id;
    act(() => {
      result.current.checkIn(sessionId, "멤버A");
    });
    act(() => {
      result.current.checkIn(sessionId, "멤버B");
    });
    // 1세션, 2체크인 → 평균 2
    expect(result.current.averageAttendance).toBe(2);
  });

  it("memberAttendanceRanking은 체크인 횟수 내림차순이다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createSession("연습1", "2026-03-02", "19:00");
    });
    const session1Id = result.current.sessions[0].id;
    act(() => {
      result.current.checkIn(session1Id, "멤버A");
    });
    act(() => {
      result.current.checkIn(session1Id, "멤버B");
    });
    act(() => {
      result.current.createSession("연습2", "2026-03-03", "20:00");
    });
    const session2Id = result.current.sessions[0].id;
    act(() => {
      result.current.checkIn(session2Id, "멤버A");
    });
    const ranking = result.current.memberAttendanceRanking;
    expect(ranking[0].memberName).toBe("멤버A");
    expect(ranking[0].count).toBe(2);
  });

  it("기록이 없을 때 memberAttendanceRanking은 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.memberAttendanceRanking).toEqual([]);
  });

  it("memberAttendanceRanking 항목에 memberName과 count가 있다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createSession("연습", "2026-03-02", "19:00");
    });
    const sessionId = result.current.sessions[0].id;
    act(() => {
      result.current.checkIn(sessionId, "홍길동");
    });
    const ranking = result.current.memberAttendanceRanking;
    expect(ranking[0]).toHaveProperty("memberName");
    expect(ranking[0]).toHaveProperty("count");
  });
});
