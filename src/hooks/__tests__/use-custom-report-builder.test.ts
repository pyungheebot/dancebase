/**
 * use-custom-report-builder 테스트
 *
 * 커스텀 리포트 빌더 훅의 순수 계산 로직을 검증합니다.
 * - REPORT_METRIC_META: 지표 메타 정보
 * - REPORT_PERIOD_LABELS: 기간 레이블
 * - getStorageKey: localStorage 키 생성
 * - getPeriodStartDate: 기간 시작일 계산
 * - saveReport: 리포트 저장 (최대 5개 제한)
 * - deleteReport: 리포트 삭제
 * - canSave: 저장 가능 여부
 * - 경계값, 빈 데이터, 최대 개수 초과 처리
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  REPORT_METRIC_META,
  REPORT_PERIOD_LABELS,
} from "@/hooks/use-custom-report-builder";
import type {
  CustomReportConfig,
  ReportMetricType,
  ReportPeriod,
} from "@/types/project";

// ============================================================
// 훅에서 추출한 순수 계산 함수들
// ============================================================

const MAX_REPORTS = 5;

/** localStorage 키 생성 */
function getStorageKey(groupId: string): string {
  return `dancebase:custom-reports:${groupId}`;
}

/** 기간 시작일 계산 */
function getPeriodStartDate(period: ReportPeriod): string | null {
  if (period === "all") return null;
  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

/** 리포트 저장 */
function saveReport(
  reports: CustomReportConfig[],
  config: Omit<CustomReportConfig, "id" | "createdAt">
): { success: boolean; error?: string; report?: CustomReportConfig } {
  if (reports.length >= MAX_REPORTS) {
    return {
      success: false,
      error: `최대 ${MAX_REPORTS}개까지 저장할 수 있습니다.`,
    };
  }
  const newReport: CustomReportConfig = {
    ...config,
    id: `report-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  return { success: true, report: newReport };
}

/** 리포트 삭제 */
function deleteReport(
  reports: CustomReportConfig[],
  reportId: string
): CustomReportConfig[] {
  return reports.filter((r) => r.id !== reportId);
}

/** 저장 가능 여부 */
function canSave(reports: CustomReportConfig[]): boolean {
  return reports.length < MAX_REPORTS;
}

// ============================================================
// 테스트 헬퍼
// ============================================================

function makeReport(
  id: string,
  name: string,
  metrics: ReportMetricType[] = ["attendance_rate"],
  period: ReportPeriod = "30d"
): CustomReportConfig {
  return {
    id,
    name,
    metrics,
    period,
    createdAt: new Date().toISOString(),
  };
}

// ============================================================
// REPORT_METRIC_META
// ============================================================

describe("REPORT_METRIC_META - 지표 메타 정보", () => {
  it("attendance_rate 레이블은 '출석률'이다", () => {
    expect(REPORT_METRIC_META.attendance_rate.label).toBe("출석률");
  });

  it("attendance_rate 단위는 '%'이다", () => {
    expect(REPORT_METRIC_META.attendance_rate.unit).toBe("%");
  });

  it("total_attendance 레이블은 '총 출석 수'이다", () => {
    expect(REPORT_METRIC_META.total_attendance.label).toBe("총 출석 수");
  });

  it("total_attendance 단위는 '회'이다", () => {
    expect(REPORT_METRIC_META.total_attendance.unit).toBe("회");
  });

  it("post_count 레이블은 '게시글 수'이다", () => {
    expect(REPORT_METRIC_META.post_count.label).toBe("게시글 수");
  });

  it("post_count 단위는 '개'이다", () => {
    expect(REPORT_METRIC_META.post_count.unit).toBe("개");
  });

  it("comment_count 레이블은 '댓글 수'이다", () => {
    expect(REPORT_METRIC_META.comment_count.label).toBe("댓글 수");
  });

  it("member_count 레이블은 '멤버 수'이다", () => {
    expect(REPORT_METRIC_META.member_count.label).toBe("멤버 수");
  });

  it("member_count 단위는 '명'이다", () => {
    expect(REPORT_METRIC_META.member_count.unit).toBe("명");
  });

  it("new_member_count 레이블은 '신규 멤버 수'이다", () => {
    expect(REPORT_METRIC_META.new_member_count.label).toBe("신규 멤버 수");
  });

  it("rsvp_rate 레이블은 'RSVP 응답률'이다", () => {
    expect(REPORT_METRIC_META.rsvp_rate.label).toBe("RSVP 응답률");
  });

  it("rsvp_rate 단위는 '%'이다", () => {
    expect(REPORT_METRIC_META.rsvp_rate.unit).toBe("%");
  });

  it("7가지 지표가 모두 정의되어 있다", () => {
    expect(Object.keys(REPORT_METRIC_META)).toHaveLength(7);
  });
});

// ============================================================
// REPORT_PERIOD_LABELS
// ============================================================

describe("REPORT_PERIOD_LABELS - 기간 레이블", () => {
  it("'7d' 레이블은 '최근 7일'이다", () => {
    expect(REPORT_PERIOD_LABELS["7d"]).toBe("최근 7일");
  });

  it("'30d' 레이블은 '최근 30일'이다", () => {
    expect(REPORT_PERIOD_LABELS["30d"]).toBe("최근 30일");
  });

  it("'90d' 레이블은 '최근 90일'이다", () => {
    expect(REPORT_PERIOD_LABELS["90d"]).toBe("최근 90일");
  });

  it("'all' 레이블은 '전체'이다", () => {
    expect(REPORT_PERIOD_LABELS["all"]).toBe("전체");
  });

  it("4가지 기간이 모두 정의되어 있다", () => {
    expect(Object.keys(REPORT_PERIOD_LABELS)).toHaveLength(4);
  });
});

// ============================================================
// getStorageKey
// ============================================================

describe("getStorageKey - localStorage 키 생성", () => {
  it("groupId를 포함한 키를 반환한다", () => {
    expect(getStorageKey("g1")).toBe("dancebase:custom-reports:g1");
  });

  it("서로 다른 groupId는 다른 키를 생성한다", () => {
    expect(getStorageKey("g1")).not.toBe(getStorageKey("g2"));
  });

  it("같은 groupId로 호출하면 동일한 키를 반환한다", () => {
    expect(getStorageKey("myGroup")).toBe(getStorageKey("myGroup"));
  });
});

// ============================================================
// getPeriodStartDate
// ============================================================

describe("getPeriodStartDate - 기간 시작일 계산", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-02T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("'all' 기간이면 null을 반환한다", () => {
    expect(getPeriodStartDate("all")).toBeNull();
  });

  it("'7d' 기간의 시작일은 7일 전이다", () => {
    const result = getPeriodStartDate("7d");
    expect(result).toBe("2026-02-23");
  });

  it("'30d' 기간의 시작일은 30일 전이다", () => {
    const result = getPeriodStartDate("30d");
    expect(result).toBe("2026-01-31");
  });

  it("'90d' 기간의 시작일은 90일 전이다", () => {
    const result = getPeriodStartDate("90d");
    expect(result).toBe("2025-12-02");
  });

  it("반환된 날짜는 YYYY-MM-DD 형식이다", () => {
    const result = getPeriodStartDate("7d");
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

// ============================================================
// saveReport
// ============================================================

describe("saveReport - 리포트 저장", () => {
  it("빈 목록에 리포트를 저장하면 success가 true이다", () => {
    const result = saveReport([], {
      name: "테스트 리포트",
      metrics: ["attendance_rate"],
      period: "30d",
    });
    expect(result.success).toBe(true);
  });

  it("저장 성공 시 report 객체가 반환된다", () => {
    const result = saveReport([], {
      name: "테스트 리포트",
      metrics: ["attendance_rate"],
      period: "30d",
    });
    expect(result.report).toBeDefined();
    expect(result.report?.name).toBe("테스트 리포트");
  });

  it("저장된 리포트에 id가 부여된다", () => {
    const result = saveReport([], {
      name: "테스트 리포트",
      metrics: ["attendance_rate"],
      period: "30d",
    });
    expect(result.report?.id).toBeDefined();
    expect(typeof result.report?.id).toBe("string");
  });

  it("저장된 리포트에 createdAt이 부여된다", () => {
    const result = saveReport([], {
      name: "테스트 리포트",
      metrics: ["post_count"],
      period: "7d",
    });
    expect(result.report?.createdAt).toBeDefined();
  });

  it("MAX_REPORTS(5개) 초과 저장 시 success가 false이다", () => {
    const reports = Array.from({ length: MAX_REPORTS }, (_, i) =>
      makeReport(`r${i}`, `리포트 ${i}`)
    );
    const result = saveReport(reports, {
      name: "6번째 리포트",
      metrics: ["member_count"],
      period: "all",
    });
    expect(result.success).toBe(false);
  });

  it("MAX_REPORTS 초과 저장 시 error 메시지가 반환된다", () => {
    const reports = Array.from({ length: MAX_REPORTS }, (_, i) =>
      makeReport(`r${i}`, `리포트 ${i}`)
    );
    const result = saveReport(reports, {
      name: "6번째 리포트",
      metrics: ["member_count"],
      period: "all",
    });
    expect(result.error).toContain("5");
  });

  it("4개 저장 시 5번째 저장은 성공한다", () => {
    const reports = Array.from({ length: 4 }, (_, i) =>
      makeReport(`r${i}`, `리포트 ${i}`)
    );
    const result = saveReport(reports, {
      name: "5번째 리포트",
      metrics: ["rsvp_rate"],
      period: "90d",
    });
    expect(result.success).toBe(true);
  });

  it("여러 지표를 포함한 리포트를 저장할 수 있다", () => {
    const result = saveReport([], {
      name: "멀티 지표",
      metrics: ["attendance_rate", "post_count", "member_count"],
      period: "30d",
    });
    expect(result.success).toBe(true);
    expect(result.report?.metrics).toHaveLength(3);
  });
});

// ============================================================
// deleteReport
// ============================================================

describe("deleteReport - 리포트 삭제", () => {
  it("존재하는 리포트를 삭제할 수 있다", () => {
    const reports = [makeReport("r1", "리포트1"), makeReport("r2", "리포트2")];
    const result = deleteReport(reports, "r1");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("r2");
  });

  it("존재하지 않는 ID 삭제 시 목록이 변경되지 않는다", () => {
    const reports = [makeReport("r1", "리포트1")];
    const result = deleteReport(reports, "nonexistent");
    expect(result).toHaveLength(1);
  });

  it("빈 목록에서 삭제 시 빈 배열을 반환한다", () => {
    const result = deleteReport([], "r1");
    expect(result).toHaveLength(0);
  });

  it("전체 목록에서 하나씩 삭제하면 최종적으로 빈 배열이 된다", () => {
    const reports = [makeReport("r1", "리포트1"), makeReport("r2", "리포트2")];
    const after1 = deleteReport(reports, "r1");
    const after2 = deleteReport(after1, "r2");
    expect(after2).toHaveLength(0);
  });
});

// ============================================================
// canSave
// ============================================================

describe("canSave - 저장 가능 여부", () => {
  it("빈 목록이면 저장 가능하다", () => {
    expect(canSave([])).toBe(true);
  });

  it("4개이면 저장 가능하다", () => {
    const reports = Array.from({ length: 4 }, (_, i) =>
      makeReport(`r${i}`, `리포트 ${i}`)
    );
    expect(canSave(reports)).toBe(true);
  });

  it("5개(MAX_REPORTS)이면 저장 불가능하다", () => {
    const reports = Array.from({ length: 5 }, (_, i) =>
      makeReport(`r${i}`, `리포트 ${i}`)
    );
    expect(canSave(reports)).toBe(false);
  });

  it("MAX_REPORTS 초과이면 저장 불가능하다", () => {
    const reports = Array.from({ length: 10 }, (_, i) =>
      makeReport(`r${i}`, `리포트 ${i}`)
    );
    expect(canSave(reports)).toBe(false);
  });
});

// ============================================================
// 통합 시나리오
// ============================================================

describe("커스텀 리포트 빌더 통합 시나리오", () => {
  it("리포트 저장 후 삭제하면 다시 저장 가능하다", () => {
    const reports = Array.from({ length: MAX_REPORTS }, (_, i) =>
      makeReport(`r${i}`, `리포트 ${i}`)
    );
    // 가득 찬 상태에서 저장 불가
    expect(canSave(reports)).toBe(false);

    // 하나 삭제
    const after = deleteReport(reports, "r0");
    expect(canSave(after)).toBe(true);

    // 다시 저장 가능
    const result = saveReport(after, {
      name: "새 리포트",
      metrics: ["attendance_rate"],
      period: "7d",
    });
    expect(result.success).toBe(true);
  });

  it("모든 ReportPeriod 값에 대해 saveReport가 성공한다", () => {
    const periods: ReportPeriod[] = ["7d", "30d", "90d", "all"];
    for (const period of periods) {
      const result = saveReport([], {
        name: `기간: ${period}`,
        metrics: ["post_count"],
        period,
      });
      expect(result.success).toBe(true);
    }
  });

  it("모든 ReportMetricType 값에 대해 메타 정보가 존재한다", () => {
    const allMetrics: ReportMetricType[] = [
      "attendance_rate",
      "total_attendance",
      "post_count",
      "comment_count",
      "member_count",
      "new_member_count",
      "rsvp_rate",
    ];
    for (const metric of allMetrics) {
      expect(REPORT_METRIC_META[metric]).toBeDefined();
      expect(REPORT_METRIC_META[metric].label).toBeTruthy();
      expect(REPORT_METRIC_META[metric].unit).toBeTruthy();
    }
  });
});
