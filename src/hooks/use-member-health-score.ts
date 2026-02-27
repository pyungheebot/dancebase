"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type {
  MemberHealthScoreResult,
  MemberHealthScoreItem,
  MemberHealthMetrics,
  MemberHealthRisk,
  MemberHealthGrade,
} from "@/types";

/**
 * 멤버 건강도 점수 훅
 *
 * groupId의 모든 멤버에 대해 5가지 지표(각 20점, 총 100점)를 계산합니다.
 * 1. 출석률     — 최근 30일 attendance 테이블 기준
 * 2. RSVP 응답률 — schedule_rsvp 테이블 기준
 * 3. 게시판 참여도 — board_posts + board_comments
 * 4. 가입 기간 대비 활동량 — group_members.joined_at 기준
 * 5. 최근 활동 빈도 — 최근 7일 vs 이전 7일
 *
 * 위험 신호:
 * - attendance_drop: 출석률 30% 이상 급락 (최근 15일 vs 이전 15일)
 * - inactive_14days: 14일 이상 완전 미활동
 * - rsvp_no_response: 최근 3개 일정 RSVP 무응답
 */
export function useMemberHealthScore(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    groupId ? swrKeys.memberHealthScore(groupId) : null,
    async (): Promise<MemberHealthScoreResult> => {
      const supabase = createClient();

      const now = new Date();
      const ms = (days: number) => days * 24 * 60 * 60 * 1000;

      const t30 = new Date(now.getTime() - ms(30)).toISOString();
      const t15 = new Date(now.getTime() - ms(15)).toISOString();
      const t14 = new Date(now.getTime() - ms(14)).toISOString();
      const t7 = new Date(now.getTime() - ms(7)).toISOString();
      const t14prev = new Date(now.getTime() - ms(14)).toISOString();
      const nowIso = now.toISOString();

      // =========================================
      // 1. 멤버 목록 + 프로필
      // =========================================
      const { data: memberRows, error: memberErr } = await supabase
        .from("group_members")
        .select("user_id, joined_at, profiles(name, avatar_url)")
        .eq("group_id", groupId);

      if (memberErr) throw new Error("멤버 데이터를 불러오지 못했습니다");
      if (!memberRows || memberRows.length === 0) {
        return { members: [], averageScore: 0, atRiskCount: 0, hasData: false };
      }

      type MemberRow = {
        user_id: string;
        joined_at: string;
        profiles: { name: string; avatar_url: string | null } | null;
      };
      const members = memberRows as MemberRow[];
      const memberUserIds = members.map((m) => m.user_id);

      // =========================================
      // 2. 최근 30일 일정 목록 (출석 관련)
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

      // 최근 15일 일정 ID
      const recentScheduleIds = allSchedules
        .filter((s) => s.starts_at >= t15)
        .map((s) => s.id);

      // 이전 15일 일정 ID (30일 ~ 15일 전)
      const prevScheduleIds = allSchedules
        .filter((s) => s.starts_at >= t30 && s.starts_at < t15)
        .map((s) => s.id);

      // =========================================
      // 3. 출석 데이터 (최근 30일)
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

      // 멤버별 출석 맵 (schedule_id → Set)
      const attByUser: Record<string, { present: Set<string>; recentPresent: Set<string>; prevPresent: Set<string> }> = {};
      for (const uid of memberUserIds) {
        attByUser[uid] = {
          present: new Set(),
          recentPresent: new Set(),
          prevPresent: new Set(),
        };
      }
      for (const att of attRows) {
        if (!attByUser[att.user_id]) continue;
        if (att.status === "present" || att.status === "late") {
          attByUser[att.user_id].present.add(att.schedule_id);
          if (recentScheduleIds.includes(att.schedule_id)) {
            attByUser[att.user_id].recentPresent.add(att.schedule_id);
          }
          if (prevScheduleIds.includes(att.schedule_id)) {
            attByUser[att.user_id].prevPresent.add(att.schedule_id);
          }
        }
      }

      // =========================================
      // 4. RSVP 데이터 (최근 30일 일정)
      // =========================================
      type RsvpRow = { user_id: string; schedule_id: string; status: string };
      let rsvpRows: RsvpRow[] = [];

      // RSVP 무응답 감지를 위해 최근 3개 일정 별도 조회
      const { data: recentSchedule3, error: rsvpSchedErr } = await supabase
        .from("schedules")
        .select("id")
        .eq("group_id", groupId)
        .neq("attendance_method", "none")
        .lte("starts_at", nowIso)
        .order("starts_at", { ascending: false })
        .limit(3);

      if (rsvpSchedErr) throw new Error("RSVP 일정 데이터를 불러오지 못했습니다");
      const last3ScheduleIds = (recentSchedule3 ?? []).map((s: { id: string }) => s.id);

      if (allScheduleIds.length > 0) {
        const { data: rsvpData, error: rsvpErr } = await supabase
          .from("schedule_rsvp")
          .select("user_id, schedule_id, status")
          .in("schedule_id", allScheduleIds);

        if (rsvpErr) throw new Error("RSVP 데이터를 불러오지 못했습니다");
        rsvpRows = (rsvpData ?? []) as RsvpRow[];
      }

      // 멤버별 RSVP 응답 맵
      const rsvpByUser: Record<string, Set<string>> = {};
      for (const uid of memberUserIds) rsvpByUser[uid] = new Set();
      for (const rsvp of rsvpRows) {
        if (rsvpByUser[rsvp.user_id]) {
          rsvpByUser[rsvp.user_id].add(rsvp.schedule_id);
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

      type CommentRow = { author_id: string; post_id: string; created_at: string };
      let commentRows: CommentRow[] = [];
      if (postIds.length > 0) {
        const { data: commentData, error: commentErr } = await supabase
          .from("board_comments")
          .select("author_id, post_id, created_at")
          .in("post_id", postIds)
          .gte("created_at", t30);

        if (commentErr) throw new Error("댓글 데이터를 불러오지 못했습니다");
        commentRows = (commentData ?? []) as CommentRow[];
      }

      // 멤버별 게시판 활동 카운트
      const boardByUser: Record<string, { total: number; recent7: number; prev7: number }> = {};
      for (const uid of memberUserIds) boardByUser[uid] = { total: 0, recent7: 0, prev7: 0 };

      for (const post of postRows) {
        if (!boardByUser[post.author_id]) continue;
        boardByUser[post.author_id].total++;
        if (post.created_at >= t7) boardByUser[post.author_id].recent7++;
        else if (post.created_at >= t14prev && post.created_at < t7) boardByUser[post.author_id].prev7++;
      }
      for (const comment of commentRows) {
        if (!boardByUser[comment.author_id]) continue;
        boardByUser[comment.author_id].total++;
        if (comment.created_at >= t7) boardByUser[comment.author_id].recent7++;
        else if (comment.created_at >= t14prev && comment.created_at < t7) boardByUser[comment.author_id].prev7++;
      }

      // =========================================
      // 6. 최근 활동 시각 (미활동 감지용)
      // =========================================
      // 멤버별 마지막 활동 시각 추적
      const lastActiveAt: Record<string, string | null> = {};
      for (const uid of memberUserIds) lastActiveAt[uid] = null;

      // 출석에서 마지막 활동 시각
      for (const att of attRows) {
        const sched = allSchedules.find((s) => s.id === att.schedule_id);
        if (sched && (att.status === "present" || att.status === "late")) {
          const prev = lastActiveAt[att.user_id];
          if (!prev || sched.starts_at > prev) {
            lastActiveAt[att.user_id] = sched.starts_at;
          }
        }
      }
      // 게시글에서 마지막 활동 시각
      for (const post of postRows) {
        const prev = lastActiveAt[post.author_id];
        if (!prev || post.created_at > prev) {
          lastActiveAt[post.author_id] = post.created_at;
        }
      }
      // 댓글에서 마지막 활동 시각
      for (const comment of commentRows) {
        const prev = lastActiveAt[comment.author_id];
        if (!prev || comment.created_at > prev) {
          lastActiveAt[comment.author_id] = comment.created_at;
        }
      }

      // =========================================
      // 7. 멤버별 건강도 점수 계산
      // =========================================
      const results: MemberHealthScoreItem[] = [];

      for (const member of members) {
        const uid = member.user_id;
        const profile = member.profiles;
        const name = profile?.name ?? "알 수 없음";
        const avatarUrl = profile?.avatar_url ?? null;
        const joinedAt = new Date(member.joined_at);
        const daysSinceJoin = Math.max(1, (now.getTime() - joinedAt.getTime()) / ms(1));

        // --- 지표 1: 출석률 (0~20점) ---
        let attendanceScore = 0;
        if (allScheduleIds.length > 0) {
          const presentCount = attByUser[uid]?.present.size ?? 0;
          const rate = presentCount / allScheduleIds.length;
          attendanceScore = Math.round(rate * 20);
        } else {
          // 일정이 없으면 기본 10점
          attendanceScore = 10;
        }

        // --- 지표 2: RSVP 응답률 (0~20점) ---
        let rsvpScore = 0;
        if (allScheduleIds.length > 0) {
          const rsvpCount = rsvpByUser[uid]?.size ?? 0;
          const rate = rsvpCount / allScheduleIds.length;
          rsvpScore = Math.round(rate * 20);
        } else {
          rsvpScore = 10;
        }

        // --- 지표 3: 게시판 참여도 (0~20점) ---
        // 멤버 수 기준 월 평균 1건 이상이면 만점에 가깝게 설정
        // 최근 30일 총 활동 수로 계산: 10건 이상이면 20점
        const boardTotal = boardByUser[uid]?.total ?? 0;
        const boardScore = Math.min(20, Math.round((boardTotal / 10) * 20));

        // --- 지표 4: 가입 기간 대비 활동량 (0~20점) ---
        // 가입 후 월당 1회 이상 활동이면 만점 기준
        // (출석 + 게시판) / (가입일수 / 30)
        const totalActions = (attByUser[uid]?.present.size ?? 0) + boardTotal;
        const monthsSinceJoin = daysSinceJoin / 30;
        const actionsPerMonth = monthsSinceJoin > 0 ? totalActions / monthsSinceJoin : 0;
        // 월 5회 이상이면 20점
        const longevityScore = Math.min(20, Math.round((actionsPerMonth / 5) * 20));

        // --- 지표 5: 최근 활동 빈도 (0~20점) ---
        // 최근 7일 활동 수 vs 이전 7일 활동 수
        // 최근 7일 출석 + 게시판 활동이 있으면 가중치 부여
        const recent7Att = attByUser[uid]?.recentPresent.size ?? 0;
        const recent7Board = boardByUser[uid]?.recent7 ?? 0;
        const recent7Total = recent7Att + recent7Board;

        const prev7Att = attByUser[uid]?.prevPresent.size ?? 0;
        const prev7Board = boardByUser[uid]?.prev7 ?? 0;
        const prev7Total = prev7Att + prev7Board;

        let recentActivityScore: number;
        if (recent7Total === 0 && prev7Total === 0) {
          recentActivityScore = 5; // 둘 다 없으면 최소점
        } else if (recent7Total >= prev7Total) {
          // 최근이 이전보다 같거나 많으면 좋음
          recentActivityScore = Math.min(20, 10 + Math.round((recent7Total / Math.max(1, prev7Total)) * 5));
        } else {
          // 최근이 이전보다 적으면 감점
          const dropRatio = (prev7Total - recent7Total) / Math.max(1, prev7Total);
          recentActivityScore = Math.max(0, Math.round(10 - dropRatio * 10));
        }

        const metrics: MemberHealthMetrics = {
          attendance: attendanceScore,
          rsvp: rsvpScore,
          board: boardScore,
          longevity: longevityScore,
          recentActivity: recentActivityScore,
        };

        const totalScore = Math.min(
          100,
          attendanceScore + rsvpScore + boardScore + longevityScore + recentActivityScore
        );

        // --- 등급 결정 ---
        let grade: MemberHealthGrade;
        if (totalScore >= 80) grade = "excellent";
        else if (totalScore >= 60) grade = "good";
        else if (totalScore >= 40) grade = "warning";
        else grade = "danger";

        // =========================================
        // 8. 위험 신호 감지
        // =========================================
        const risks: MemberHealthRisk[] = [];

        // 위험 신호 1: 출석률 30% 이상 급락
        if (recentScheduleIds.length > 0 && prevScheduleIds.length > 0) {
          const recentRate =
            (attByUser[uid]?.recentPresent.size ?? 0) / recentScheduleIds.length;
          const prevRate =
            (attByUser[uid]?.prevPresent.size ?? 0) / prevScheduleIds.length;
          if (prevRate > 0 && prevRate - recentRate >= 0.3) {
            risks.push({
              type: "attendance_drop",
              label: `출석률 ${Math.round((prevRate - recentRate) * 100)}% 급락`,
            });
          }
        }

        // 위험 신호 2: 14일 이상 미활동
        const lastActive = lastActiveAt[uid];
        if (!lastActive || lastActive < t14) {
          risks.push({
            type: "inactive_14days",
            label: "14일 이상 미활동",
          });
        }

        // 위험 신호 3: RSVP 무응답 3회 연속
        if (last3ScheduleIds.length >= 3) {
          const respondedToLast3 = last3ScheduleIds.every(
            (sid: string) => rsvpByUser[uid]?.has(sid)
          );
          if (!respondedToLast3) {
            risks.push({
              type: "rsvp_no_response",
              label: "최근 RSVP 무응답",
            });
          }
        }

        results.push({
          userId: uid,
          name,
          avatarUrl,
          totalScore,
          grade,
          metrics,
          risks,
        });
      }

      // 건강도 낮은 순 정렬 (위험 멤버 먼저)
      results.sort((a, b) => a.totalScore - b.totalScore);

      const averageScore =
        results.length > 0
          ? Math.round(results.reduce((sum, m) => sum + m.totalScore, 0) / results.length)
          : 0;

      const atRiskCount = results.filter((m) => m.risks.length > 0).length;

      return {
        members: results,
        averageScore,
        atRiskCount,
        hasData: results.length > 0,
      };
    }
  );

  const defaultData: MemberHealthScoreResult = {
    members: [],
    averageScore: 0,
    atRiskCount: 0,
    hasData: false,
  };

  return {
    data: data ?? defaultData,
    loading: isLoading,
    refetch: () => mutate(),
  };
}
