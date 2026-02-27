import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ko } from "date-fns/locale";
import type { MemberReportStat } from "@/lib/attendance-report-generator";

// ============================================
// PDF 출력용 데이터 타입
// ============================================

export type PdfPeriod = "1m" | "3m" | "all";

export const PDF_PERIOD_LABELS: Record<PdfPeriod, string> = {
  "1m": "최근 1개월",
  "3m": "최근 3개월",
  all: "전체 기간",
};

/** 기간 범위 계산 결과 */
export type PeriodRange = {
  from: string | null; // null이면 전체 기간
  to: string | null;
  label: string;
};

/** PDF 보고서 헤더 정보 */
export type PdfReportHeader = {
  groupName: string;
  periodLabel: string;
  generatedAt: string;
  totalSchedules: number;
  overallRate: number;
};

/** PDF 보고서 멤버 행 */
export type PdfMemberRow = {
  rank: number;
  name: string;
  present: number;
  late: number;
  absent: number;
  total: number;
  rate: number;
};

/** PDF 요약 통계 */
export type PdfSummary = {
  overallRate: number;
  topAttendee: string | null;
  totalSchedules: number;
  totalMembers: number;
};

/** PDF 보고서 전체 데이터 */
export type PdfReportData = {
  header: PdfReportHeader;
  memberRows: PdfMemberRow[];
  summary: PdfSummary;
};

// ============================================
// 기간 범위 계산
// ============================================

export function getPdfPeriodRange(period: PdfPeriod): PeriodRange {
  const now = new Date();

  if (period === "all") {
    return {
      from: null,
      to: null,
      label: "전체 기간",
    };
  }

  const months = period === "1m" ? 1 : 3;
  const from = startOfMonth(subMonths(now, months - 1));
  const to = endOfMonth(now);

  const fromLabel = format(from, "yyyy년 M월", { locale: ko });
  const toLabel = format(to, "yyyy년 M월", { locale: ko });

  return {
    from: from.toISOString(),
    to: to.toISOString(),
    label: fromLabel === toLabel ? fromLabel : `${fromLabel} ~ ${toLabel}`,
  };
}

// ============================================
// 멤버 통계 → PDF 행 변환
// ============================================

export function toMemberRows(memberStats: MemberReportStat[]): PdfMemberRow[] {
  return memberStats.map((stat, idx) => ({
    rank: idx + 1,
    name: stat.name,
    present: stat.present,
    late: stat.late,
    absent: stat.absent,
    total: stat.total,
    rate: stat.rate,
  }));
}

// ============================================
// PDF 요약 통계 생성
// ============================================

export function buildPdfSummary(
  memberStats: MemberReportStat[],
  totalSchedules: number
): PdfSummary {
  const totalMembers = memberStats.length;
  const overallRate =
    totalMembers > 0
      ? Math.round(
          memberStats.reduce((sum, m) => sum + m.rate, 0) / totalMembers
        )
      : 0;

  const topAttendee =
    memberStats.length > 0 && memberStats[0].rate > 0
      ? memberStats[0].name
      : null;

  return {
    overallRate,
    topAttendee,
    totalSchedules,
    totalMembers,
  };
}

// ============================================
// PDF 보고서 전체 데이터 조립
// ============================================

export function buildPdfReportData(
  groupName: string,
  periodLabel: string,
  memberStats: MemberReportStat[],
  totalSchedules: number
): PdfReportData {
  const memberRows = toMemberRows(memberStats);
  const summary = buildPdfSummary(memberStats, totalSchedules);

  const header: PdfReportHeader = {
    groupName,
    periodLabel,
    generatedAt: format(new Date(), "yyyy년 M월 d일 HH:mm", { locale: ko }),
    totalSchedules,
    overallRate: summary.overallRate,
  };

  return { header, memberRows, summary };
}
