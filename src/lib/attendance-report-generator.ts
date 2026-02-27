import { format } from "date-fns";
import { ko } from "date-fns/locale";
import type { AttendanceStatus } from "@/types";

// ============================================
// 입력 타입
// ============================================

export type ReportSchedule = {
  id: string;
  starts_at: string; // ISO 문자열
};

export type ReportAttendance = {
  schedule_id: string;
  user_id: string;
  status: AttendanceStatus;
};

export type ReportMember = {
  userId: string;
  name: string;
};

// ============================================
// 출력 타입
// ============================================

/** 멤버별 출석 통계 */
export type MemberReportStat = {
  userId: string;
  name: string;
  present: number;
  late: number;
  absent: number;
  total: number;
  /** 출석률 (0~100 정수) = (present + late) / total * 100 */
  rate: number;
  /** 지각률 (0~100 정수) = late / total * 100 */
  lateRate: number;
};

/** 요일별 출석률 */
export type DayOfWeekStat = {
  /** 요일 인덱스 (0=일, 1=월, ..., 6=토) */
  dayIndex: number;
  /** 표시용 요일명 */
  label: string;
  /** 평균 출석률 (0~100 정수) */
  rate: number;
  /** 해당 요일 일정 수 */
  scheduleCount: number;
};

/** 시간대별 출석률 */
export type TimeSlotStat = {
  /** "morning" | "afternoon" | "evening" */
  slot: "morning" | "afternoon" | "evening";
  /** 표시용 라벨 */
  label: string;
  /** 시간 범위 설명 */
  range: string;
  /** 평균 출석률 (0~100 정수) */
  rate: number;
  /** 해당 시간대 일정 수 */
  scheduleCount: number;
};

/** 월별 출석 추이 */
export type MonthlyReportStat = {
  yearMonth: string;  // "2025-09"
  label: string;     // "2025년 9월"
  avgRate: number;
  scheduleCount: number;
};

/** generateAttendanceReport 최종 반환 타입 */
export type AttendanceReport = {
  memberStats: MemberReportStat[];
  dayOfWeekStats: DayOfWeekStat[];
  timeSlotStats: TimeSlotStat[];
  monthlyStats: MonthlyReportStat[];
  totalSchedules: number;
  overallRate: number;
};

// ============================================
// 상수
// ============================================

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

// ============================================
// 헬퍼: 시간대 분류
// ============================================

function getTimeSlot(isoString: string): "morning" | "afternoon" | "evening" {
  const hour = new Date(isoString).getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

// ============================================
// 메인 함수
// ============================================

/**
 * 출석 리포트 생성
 *
 * @param schedules   조회된 일정 목록
 * @param attendances 조회된 출석 기록
 * @param members     멤버 목록
 */
export function generateAttendanceReport(
  schedules: ReportSchedule[],
  attendances: ReportAttendance[],
  members: ReportMember[]
): AttendanceReport {
  const totalSchedules = schedules.length;
  const memberCount = members.length;

  // 데이터 없는 경우 graceful 처리
  if (totalSchedules === 0 || memberCount === 0) {
    return {
      memberStats: members.map((m) => ({
        userId: m.userId,
        name: m.name,
        present: 0,
        late: 0,
        absent: 0,
        total: 0,
        rate: 0,
        lateRate: 0,
      })),
      dayOfWeekStats: DAY_LABELS.map((label, i) => ({
        dayIndex: i,
        label,
        rate: 0,
        scheduleCount: 0,
      })),
      timeSlotStats: [
        { slot: "morning", label: "오전", range: "~12시", rate: 0, scheduleCount: 0 },
        { slot: "afternoon", label: "오후", range: "12~18시", rate: 0, scheduleCount: 0 },
        { slot: "evening", label: "저녁", range: "18시~", rate: 0, scheduleCount: 0 },
      ],
      monthlyStats: [],
      totalSchedules: 0,
      overallRate: 0,
    };
  }

  // schedule_id → schedule 매핑
  const scheduleMap = new Map(schedules.map((s) => [s.id, s]));

  // =============================================
  // 1. 멤버별 통계
  // =============================================
  const memberStats: MemberReportStat[] = members.map((member) => {
    const memberAtt = attendances.filter((a) => a.user_id === member.userId);
    const present = memberAtt.filter((a) => a.status === "present").length;
    const late = memberAtt.filter((a) => a.status === "late").length;
    const absent = Math.max(0, totalSchedules - present - late);
    const rate = totalSchedules > 0
      ? Math.round(((present + late) / totalSchedules) * 100)
      : 0;
    const lateRate = totalSchedules > 0
      ? Math.round((late / totalSchedules) * 100)
      : 0;

    return {
      userId: member.userId,
      name: member.name,
      present,
      late,
      absent,
      total: totalSchedules,
      rate,
      lateRate,
    };
  });

  // 출석률 내림차순 정렬
  memberStats.sort((a, b) => b.rate - a.rate || a.name.localeCompare(b.name));

  // 전체 평균 출석률
  const overallRate = memberStats.length > 0
    ? Math.round(memberStats.reduce((sum, m) => sum + m.rate, 0) / memberStats.length)
    : 0;

  // =============================================
  // 2. 요일별 출석률
  //    각 요일의 "전체 멤버 대비 평균 출석률" 계산
  // =============================================

  // 요일별 일정 목록 그룹핑
  const daySchedules = new Map<number, string[]>(); // dayIndex → scheduleIds
  for (const s of schedules) {
    const dayIdx = new Date(s.starts_at).getDay(); // 0=일 ~ 6=토
    if (!daySchedules.has(dayIdx)) daySchedules.set(dayIdx, []);
    daySchedules.get(dayIdx)!.push(s.id);
  }

  const dayOfWeekStats: DayOfWeekStat[] = DAY_LABELS.map((label, dayIndex) => {
    const ids = daySchedules.get(dayIndex) ?? [];
    if (ids.length === 0) {
      return { dayIndex, label, rate: 0, scheduleCount: 0 };
    }

    const possible = ids.length * memberCount;
    const attended = attendances.filter(
      (a) =>
        ids.includes(a.schedule_id) &&
        (a.status === "present" || a.status === "late")
    ).length;

    const rate = possible > 0 ? Math.round((attended / possible) * 100) : 0;
    return { dayIndex, label, rate, scheduleCount: ids.length };
  });

  // =============================================
  // 3. 시간대별 출석률
  // =============================================

  const slotKeys: Array<"morning" | "afternoon" | "evening"> = [
    "morning",
    "afternoon",
    "evening",
  ];
  const slotMeta = {
    morning: { label: "오전", range: "~12시" },
    afternoon: { label: "오후", range: "12~18시" },
    evening: { label: "저녁", range: "18시~" },
  };

  const slotSchedules = new Map<string, string[]>();
  for (const key of slotKeys) slotSchedules.set(key, []);

  for (const s of schedules) {
    const slot = getTimeSlot(s.starts_at);
    slotSchedules.get(slot)!.push(s.id);
  }

  const timeSlotStats: TimeSlotStat[] = slotKeys.map((slot) => {
    const ids = slotSchedules.get(slot) ?? [];
    if (ids.length === 0) {
      return {
        slot,
        ...slotMeta[slot],
        rate: 0,
        scheduleCount: 0,
      };
    }
    const possible = ids.length * memberCount;
    const attended = attendances.filter(
      (a) =>
        ids.includes(a.schedule_id) &&
        (a.status === "present" || a.status === "late")
    ).length;
    const rate = possible > 0 ? Math.round((attended / possible) * 100) : 0;
    return { slot, ...slotMeta[slot], rate, scheduleCount: ids.length };
  });

  // =============================================
  // 4. 월별 출석 추이
  // =============================================

  // 일정을 월별로 그룹핑
  const monthSchedules = new Map<string, string[]>(); // yearMonth → scheduleIds
  for (const s of schedules) {
    const ym = format(new Date(s.starts_at), "yyyy-MM");
    if (!monthSchedules.has(ym)) monthSchedules.set(ym, []);
    monthSchedules.get(ym)!.push(s.id);
  }

  // 월 목록 정렬 (오름차순)
  const sortedMonths = Array.from(monthSchedules.keys()).sort();

  const monthlyStats: MonthlyReportStat[] = sortedMonths.map((ym) => {
    const ids = monthSchedules.get(ym)!;
    const possible = ids.length * memberCount;
    const attended = attendances.filter(
      (a) =>
        ids.includes(a.schedule_id) &&
        (a.status === "present" || a.status === "late")
    ).length;
    const avgRate = possible > 0 ? Math.round((attended / possible) * 100) : 0;
    const label = format(new Date(`${ym}-01`), "yyyy년 M월", { locale: ko });

    return { yearMonth: ym, label, avgRate, scheduleCount: ids.length };
  });

  return {
    memberStats,
    dayOfWeekStats,
    timeSlotStats,
    monthlyStats,
    totalSchedules,
    overallRate,
  };
}
