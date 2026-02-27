"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PracticePlan } from "@/types";
import type { MemberSkill, MemberGoal } from "@/types";

// ============================================
// localStorage 키
// ============================================

function storageKey(groupId: string, userId: string): string {
  return `practice-plan-${groupId}-${userId}`;
}

// ============================================
// 자동 플랜 생성 분석 결과 타입
// ============================================

export type PracticePlanAnalysis = {
  attendanceRate: number;     // 출석률 (0~100)
  totalSchedules: number;     // 전체 일정 수
  attendedCount: number;      // 참석 횟수
  weakSkills: MemberSkill[];  // 레벨 1~2 스킬 목록
  unachievedGoals: MemberGoal[]; // 미달 목표 목록
  suggestedFocusAreas: string[]; // 자동 생성된 집중 과제
  suggestedContent: string;   // 자동 생성된 플랜 내용
};

// ============================================
// 출석률 조회 (최근 3개월)
// ============================================

async function fetchAttendanceRate(
  groupId: string,
  userId: string
): Promise<{ rate: number; total: number; attended: number }> {
  const supabase = createClient();

  const now = new Date();
  const threeMonthsAgo = new Date(now);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const { data: schedules, error: schedErr } = await supabase
    .from("schedules")
    .select("id")
    .eq("group_id", groupId)
    .neq("attendance_method", "none")
    .gte("starts_at", threeMonthsAgo.toISOString())
    .lte("starts_at", now.toISOString());

  if (schedErr || !schedules || schedules.length === 0) {
    return { rate: 0, total: 0, attended: 0 };
  }

  const scheduleIds = schedules.map((s: { id: string }) => s.id);

  const { count, error: attErr } = await supabase
    .from("attendances")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("schedule_id", scheduleIds)
    .in("status", ["present", "late"]);

  if (attErr) return { rate: 0, total: scheduleIds.length, attended: 0 };

  const attended = count ?? 0;
  const total = scheduleIds.length;
  const rate = total > 0 ? Math.round((attended / total) * 100) : 0;

  return { rate, total, attended };
}

// ============================================
// 스킬 조회 (해당 멤버)
// ============================================

async function fetchMemberSkills(
  groupId: string,
  userId: string
): Promise<MemberSkill[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("member_skills")
    .select("*")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .order("skill_level", { ascending: true });

  if (error) return [];
  return (data ?? []) as MemberSkill[];
}

// ============================================
// 목표 조회 (localStorage)
// ============================================

function loadMemberGoals(groupId: string, userId: string): MemberGoal[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`member-goals-${groupId}-${userId}`);
    if (!raw) return [];
    return JSON.parse(raw) as MemberGoal[];
  } catch {
    return [];
  }
}

// ============================================
// 목표 달성 여부 체크 (출석 목표만 체크, 간소화)
// ============================================

async function checkUnachievedGoals(
  groupId: string,
  userId: string,
  goals: MemberGoal[]
): Promise<MemberGoal[]> {
  if (goals.length === 0) return [];

  const supabase = createClient();
  const currentYM = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  })();

  // 이번 달 목표만 체크
  const thisMonthGoals = goals.filter((g) => g.yearMonth === currentYM);
  if (thisMonthGoals.length === 0) return [];

  const from = `${currentYM}-01`;
  const [year, month] = currentYM.split("-").map(Number);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const to = `${String(nextYear).padStart(4, "0")}-${String(nextMonth).padStart(2, "0")}-01`;

  const unachieved: MemberGoal[] = [];

  for (const goal of thisMonthGoals) {
    if (goal.goalType === "attendance") {
      const { data: schedules } = await supabase
        .from("schedules")
        .select("id")
        .eq("group_id", groupId)
        .gte("starts_at", `${from}T00:00:00`)
        .lt("starts_at", `${to}T00:00:00`);

      if (!schedules || schedules.length === 0) {
        unachieved.push(goal);
        continue;
      }

      const { count } = await supabase
        .from("attendances")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .in("schedule_id", schedules.map((s: { id: string }) => s.id))
        .in("status", ["present", "late"]);

      if ((count ?? 0) < goal.targetValue) {
        unachieved.push(goal);
      }
    } else {
      // posts, payment는 달성 여부를 낙관적으로 판단하지 않음
      unachieved.push(goal);
    }
  }

  return unachieved;
}

// ============================================
// 집중 과제 자동 생성 (최대 3개)
// ============================================

function buildFocusAreas(
  attendanceRate: number,
  weakSkills: MemberSkill[],
  unachievedGoals: MemberGoal[]
): string[] {
  const areas: string[] = [];

  if (attendanceRate < 70) {
    areas.push("출석률 향상 필요");
  }

  for (const skill of weakSkills.slice(0, 2)) {
    if (areas.length >= 3) break;
    areas.push(`${skill.skill_name} 집중 연습`);
  }

  if (areas.length < 3 && unachievedGoals.length > 0) {
    areas.push("목표 달성을 위한 추가 연습");
  }

  return areas.slice(0, 3);
}

// ============================================
// 플랜 내용 자동 생성
// ============================================

function buildPlanContent(
  memberName: string,
  attendanceRate: number,
  totalSchedules: number,
  weakSkills: MemberSkill[],
  unachievedGoals: MemberGoal[],
  focusAreas: string[]
): string {
  const lines: string[] = [];

  lines.push(`[${memberName} 맞춤 연습 플랜]`);
  lines.push("");

  // 출석 현황
  lines.push("# 출석 현황 (최근 3개월)");
  if (totalSchedules === 0) {
    lines.push("- 출석 기록 없음");
  } else {
    lines.push(`- 출석률: ${attendanceRate}% (${totalSchedules}회 중 참석)`);
    if (attendanceRate < 70) {
      lines.push("- 권장: 주 1회 이상 정기 연습 참여 필요");
    } else if (attendanceRate < 90) {
      lines.push("- 권장: 현재 수준 유지 및 추가 개인 연습 병행");
    } else {
      lines.push("- 우수한 출석률을 유지하고 있습니다.");
    }
  }
  lines.push("");

  // 약점 스킬
  if (weakSkills.length > 0) {
    lines.push("# 보완이 필요한 스킬");
    for (const skill of weakSkills) {
      const levelLabel = skill.skill_level === 1 ? "입문" : "초급";
      lines.push(`- ${skill.skill_name} (현재 레벨: ${levelLabel})`);
    }
    lines.push("");
  }

  // 미달 목표
  if (unachievedGoals.length > 0) {
    lines.push("# 이번 달 목표 진행 상황");
    for (const goal of unachievedGoals) {
      const goalLabel =
        goal.goalType === "attendance"
          ? `출석 ${goal.targetValue}회`
          : goal.goalType === "posts"
          ? `게시글 ${goal.targetValue}개`
          : `회비 납부 ${goal.targetValue}건`;
      lines.push(`- ${goalLabel} 미달성 → 추가 노력 필요`);
    }
    lines.push("");
  }

  // 집중 과제
  if (focusAreas.length > 0) {
    lines.push("# 집중 과제");
    focusAreas.forEach((area, i) => {
      lines.push(`${i + 1}. ${area}`);
    });
  }

  return lines.join("\n");
}

// ============================================
// 훅
// ============================================

export function usePracticePlan(
  groupId: string,
  userId: string,
  memberName: string
) {
  const [plan, setPlan] = useState<PracticePlan | null>(null);
  const [analysis, setAnalysis] = useState<PracticePlanAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  // localStorage에서 플랜 불러오기
  const loadPlan = useCallback((): PracticePlan | null => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(storageKey(groupId, userId));
      if (!raw) return null;
      return JSON.parse(raw) as PracticePlan;
    } catch {
      return null;
    }
  }, [groupId, userId]);

  // localStorage에 플랜 저장
  const savePlan = useCallback(
    (newPlan: PracticePlan | null) => {
      if (typeof window === "undefined") return;
      try {
        if (newPlan === null) {
          localStorage.removeItem(storageKey(groupId, userId));
        } else {
          localStorage.setItem(storageKey(groupId, userId), JSON.stringify(newPlan));
        }
      } catch {
        // 무시
      }
    },
    [groupId, userId]
  );

  // 초기 로드
  useEffect(() => {
    if (!groupId || !userId) {
      setLoading(false);
      return;
    }
    const stored = loadPlan();
    setPlan(stored);
    setLoading(false);
  }, [groupId, userId, loadPlan]);

  // 자동 분석 및 플랜 초안 생성
  const analyze = useCallback(async (): Promise<PracticePlanAnalysis> => {
    setAnalyzing(true);
    try {
      const [attendanceResult, skills, goals] = await Promise.all([
        fetchAttendanceRate(groupId, userId),
        fetchMemberSkills(groupId, userId),
        Promise.resolve(loadMemberGoals(groupId, userId)),
      ]);

      const weakSkills = skills.filter((s) => s.skill_level <= 2);
      const unachievedGoals = await checkUnachievedGoals(groupId, userId, goals);

      const focusAreas = buildFocusAreas(
        attendanceResult.rate,
        weakSkills,
        unachievedGoals
      );

      const suggestedContent = buildPlanContent(
        memberName,
        attendanceResult.rate,
        attendanceResult.total,
        weakSkills,
        unachievedGoals,
        focusAreas
      );

      const result: PracticePlanAnalysis = {
        attendanceRate: attendanceResult.rate,
        totalSchedules: attendanceResult.total,
        attendedCount: attendanceResult.attended,
        weakSkills,
        unachievedGoals,
        suggestedFocusAreas: focusAreas,
        suggestedContent,
      };

      setAnalysis(result);
      return result;
    } finally {
      setAnalyzing(false);
    }
  }, [groupId, userId, memberName]);

  // 플랜 저장 (신규 or 수정)
  const savePlanData = useCallback(
    (content: string, focusAreas: string[], createdBy: string) => {
      const existing = loadPlan();
      const newPlan: PracticePlan = {
        id: existing?.id ?? crypto.randomUUID(),
        userId,
        content,
        focusAreas,
        createdAt: existing?.createdAt ?? new Date().toISOString(),
        createdBy,
      };
      savePlan(newPlan);
      setPlan(newPlan);
      return newPlan;
    },
    [userId, loadPlan, savePlan]
  );

  // 플랜 삭제
  const deletePlan = useCallback(() => {
    savePlan(null);
    setPlan(null);
    setAnalysis(null);
  }, [savePlan]);

  return {
    plan,
    analysis,
    loading,
    analyzing,
    analyze,
    savePlanData,
    deletePlan,
  };
}
