"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type {
  ChurnRiskEntry,
  ChurnRiskFactor,
  ChurnRiskLevel,
  ChurnRiskDetectionResult,
} from "@/types";

/**
 * 멤버 이탈 위험 감지 훅
 *
 * 멤버별 이탈 위험도 점수(0~100, 높을수록 위험)를 계산합니다.
 * 위험 요인:
 * - low_attendance:   최근 30일 출석률 50% 미만 → +30점
 * - inactive_days:    마지막 활동일로부터 7일 이상 +10, 14일 이상 +20, 30일 이상 +40
 * - no_board_activity: 최근 30일 게시판 활동 0건 → +15점
 * - low_rsvp:         최근 30일 RSVP 미응답 비율 50% 이상 → +15점
 *
 * 위험 등급:
 * - safe(안전):    0~29
 * - caution(주의): 30~59
 * - risk(위험):    60~79
 * - critical(긴급): 80~100
 */
export function useChurnRiskDetection(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    groupId ? swrKeys.churnRiskDetection(groupId) : null,
    async (): Promise<ChurnRiskDetectionResult> => {
      const supabase = createClient();

      const now = new Date();
      const ms = (days: number) => days * 24 * 60 * 60 * 1000;

      const t7 = new Date(now.getTime() - ms(7)).toISOString();
      const t14 = new Date(now.getTime() - ms(14)).toISOString();
      const t30 = new Date(now.getTime() - ms(30)).toISOString();
      const nowIso = now.toISOString();

      // =========================================
      // 1. 멤버 목록 + 프로필
      // =========================================
      const { data: memberRows, error: memberErr } = await supabase
        .from("group_members")
        .select("user_id, profiles(name)")
        .eq("group_id", groupId);

      if (memberErr) throw new Error("멤버 데이터를 불러오지 못했습니다");
      if (!memberRows || memberRows.length === 0) {
        return buildEmptyResult();
      }

      type MemberRow = {
        user_id: string;
        profiles: { name: string } | null;
      };
      const members = memberRows as MemberRow[];
      const memberUserIds = members.map((m) => m.user_id);

      // =========================================
      // 2. 최근 30일 일정 목록
      // =========================================
      const { data: scheduleRows, error: schedErr } = await supabase
        .from("schedules")
        .select("id, starts_at")
        .eq("group_id", groupId)
        .neq("attendance_method", "none")
        .gte("starts_at", t30)
        .lte("starts_at", nowIso);

      if (schedErr) throw new Error("일정 데이터를 불러오지 못했습니다");

      const allSchedules = (scheduleRows ?? []) as { id: string; starts_at: string }[];
      const allScheduleIds = allSchedules.map((s) => s.id);

      // =========================================
      // 3. 출석 데이터
      // =========================================
      type AttRow = { user_id: string; status: string; schedule_id: string };
      let attRows: AttRow[] = [];

      if (allScheduleIds.length > 0) {
        const { data: attData, error: attErr } = await supabase
          .from("attendance")
          .select("user_id, status, schedule_id")
          .in("schedule_id", allScheduleIds);

        if (attErr) throw new Error("출석 데이터를 불러오지 못했습니다");
        attRows = (attData ?? []) as AttRow[];
      }

      // 멤버별 출석 카운트 맵
      const attPresentByUser: Record<string, number> = {};
      for (const uid of memberUserIds) attPresentByUser[uid] = 0;

      for (const att of attRows) {
        if (!Object.prototype.hasOwnProperty.call(attPresentByUser, att.user_id)) continue;
        if (att.status === "present" || att.status === "late") {
          attPresentByUser[att.user_id]++;
        }
      }

      // =========================================
      // 4. RSVP 데이터
      // =========================================
      type RsvpRow = { user_id: string; schedule_id: string };
      let rsvpRows: RsvpRow[] = [];

      if (allScheduleIds.length > 0) {
        const { data: rsvpData, error: rsvpErr } = await supabase
          .from("schedule_rsvp")
          .select("user_id, schedule_id")
          .in("schedule_id", allScheduleIds);

        if (rsvpErr) throw new Error("RSVP 데이터를 불러오지 못했습니다");
        rsvpRows = (rsvpData ?? []) as RsvpRow[];
      }

      // 멤버별 RSVP 응답 수
      const rsvpByUser: Record<string, number> = {};
      for (const uid of memberUserIds) rsvpByUser[uid] = 0;

      for (const rsvp of rsvpRows) {
        if (Object.prototype.hasOwnProperty.call(rsvpByUser, rsvp.user_id)) {
          rsvpByUser[rsvp.user_id]++;
        }
      }

      // =========================================
      // 5. 게시판 활동 (최근 30일)
      // =========================================
      const { data: postData, error: postErr } = await supabase
        .from("board_posts")
        .select("id, author_id, created_at")
        .eq("group_id", groupId)
        .gte("created_at", t30);

      if (postErr) throw new Error("게시글 데이터를 불러오지 못했습니다");

      const postRows = (postData ?? []) as { id: string; author_id: string; created_at: string }[];
      const postIds = postRows.map((p) => p.id);

      type CommentRow = { author_id: string; created_at: string };
      let commentRows: CommentRow[] = [];

      if (postIds.length > 0) {
        const { data: commentData, error: commentErr } = await supabase
          .from("board_comments")
          .select("author_id, created_at")
          .in("post_id", postIds)
          .gte("created_at", t30);

        if (commentErr) throw new Error("댓글 데이터를 불러오지 못했습니다");
        commentRows = (commentData ?? []) as CommentRow[];
      }

      // 멤버별 게시판 활동 수
      const boardByUser: Record<string, number> = {};
      for (const uid of memberUserIds) boardByUser[uid] = 0;

      for (const post of postRows) {
        if (Object.prototype.hasOwnProperty.call(boardByUser, post.author_id)) {
          boardByUser[post.author_id]++;
        }
      }
      for (const comment of commentRows) {
        if (Object.prototype.hasOwnProperty.call(boardByUser, comment.author_id)) {
          boardByUser[comment.author_id]++;
        }
      }

      // =========================================
      // 6. 마지막 활동 시각 계산
      // =========================================
      const lastActiveAt: Record<string, string | null> = {};
      for (const uid of memberUserIds) lastActiveAt[uid] = null;

      // 출석 기준
      for (const att of attRows) {
        if (att.status !== "present" && att.status !== "late") continue;
        const sched = allSchedules.find((s) => s.id === att.schedule_id);
        if (!sched) continue;
        const prev = lastActiveAt[att.user_id];
        if (!prev || sched.starts_at > prev) {
          lastActiveAt[att.user_id] = sched.starts_at;
        }
      }

      // 게시글 기준
      for (const post of postRows) {
        const prev = lastActiveAt[post.author_id];
        if (!prev || post.created_at > prev) {
          lastActiveAt[post.author_id] = post.created_at;
        }
      }

      // 댓글 기준
      for (const comment of commentRows) {
        const prev = lastActiveAt[comment.author_id];
        if (!prev || comment.created_at > prev) {
          lastActiveAt[comment.author_id] = comment.created_at;
        }
      }

      // =========================================
      // 7. 멤버별 위험도 점수 계산 (최대 30명)
      // =========================================
      const entries: ChurnRiskEntry[] = [];

      for (const member of members) {
        const uid = member.user_id;
        const name = member.profiles?.name ?? "알 수 없음";

        let riskScore = 0;
        const factors: ChurnRiskFactor[] = [];

        // 요인 1: 최근 30일 출석률 저하
        let recentAttendanceRate = 1; // 일정이 없으면 100%로 간주
        if (allScheduleIds.length > 0) {
          const presentCount = attPresentByUser[uid] ?? 0;
          recentAttendanceRate = presentCount / allScheduleIds.length;
          if (recentAttendanceRate < 0.5) {
            riskScore += 30;
            factors.push("low_attendance");
          }
        }

        // 요인 2: 마지막 활동일 기준 경과 일수
        const lastActive = lastActiveAt[uid];
        if (!lastActive) {
          // 활동 이력 없음 → 가장 위험
          riskScore += 40;
          factors.push("inactive_days");
        } else if (lastActive < t30) {
          riskScore += 40;
          factors.push("inactive_days");
        } else if (lastActive < t14) {
          riskScore += 20;
          factors.push("inactive_days");
        } else if (lastActive < t7) {
          riskScore += 10;
          factors.push("inactive_days");
        }

        // 요인 3: 게시판 활동 없음
        const boardCount = boardByUser[uid] ?? 0;
        if (boardCount === 0) {
          riskScore += 15;
          factors.push("no_board_activity");
        }

        // 요인 4: RSVP 미응답 비율 50% 이상
        if (allScheduleIds.length > 0) {
          const rsvpCount = rsvpByUser[uid] ?? 0;
          const noResponseRate = 1 - rsvpCount / allScheduleIds.length;
          if (noResponseRate >= 0.5) {
            riskScore += 15;
            factors.push("low_rsvp");
          }
        }

        // 위험 점수 상한 100
        riskScore = Math.min(100, riskScore);

        // 위험 등급 결정
        let riskLevel: ChurnRiskLevel;
        if (riskScore >= 80) riskLevel = "critical";
        else if (riskScore >= 60) riskLevel = "risk";
        else if (riskScore >= 30) riskLevel = "caution";
        else riskLevel = "safe";

        entries.push({
          userId: uid,
          name,
          riskScore,
          riskLevel,
          factors,
          lastActiveAt: lastActive,
          recentAttendanceRate: Math.round(recentAttendanceRate * 100),
        });
      }

      // 위험 점수 내림차순 정렬, 최대 30명
      entries.sort((a, b) => b.riskScore - a.riskScore);
      const topEntries = entries.slice(0, 30);

      // 등급별 그룹핑
      const byLevel: Record<ChurnRiskLevel, ChurnRiskEntry[]> = {
        critical: [],
        risk: [],
        caution: [],
        safe: [],
      };
      for (const entry of topEntries) {
        byLevel[entry.riskLevel].push(entry);
      }

      return {
        entries: topEntries,
        byLevel,
        totalCount: topEntries.length,
        criticalCount: byLevel.critical.length,
        riskCount: byLevel.risk.length,
        cautionCount: byLevel.caution.length,
        safeCount: byLevel.safe.length,
      };
    }
  );

  const defaultResult: ChurnRiskDetectionResult = {
    entries: [],
    byLevel: { critical: [], risk: [], caution: [], safe: [] },
    totalCount: 0,
    criticalCount: 0,
    riskCount: 0,
    cautionCount: 0,
    safeCount: 0,
  };

  return {
    data: data ?? defaultResult,
    loading: isLoading,
    refetch: () => mutate(),
  };
}

function buildEmptyResult(): ChurnRiskDetectionResult {
  return {
    entries: [],
    byLevel: { critical: [], risk: [], caution: [], safe: [] },
    totalCount: 0,
    criticalCount: 0,
    riskCount: 0,
    cautionCount: 0,
    safeCount: 0,
  };
}
