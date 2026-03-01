"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type { MentorMenteeMatch, MentorMenteeStatus, MemberSkill } from "@/types";

// ============================================
// localStorage 키
// ============================================

function storageKey(groupId: string): string {
  return `mentor-mentee-${groupId}`;
}

// ============================================
// localStorage 헬퍼
// ============================================

function loadMatches(groupId: string): MentorMenteeMatch[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(groupId));
    if (!raw) return [];
    return JSON.parse(raw) as MentorMenteeMatch[];
  } catch {
    return [];
  }
}

function saveMatches(groupId: string, matches: MentorMenteeMatch[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(groupId), JSON.stringify(matches));
  } catch {
    // 무시
  }
}

// ============================================
// 스킬 기반 자동 추천 타입
// ============================================

export type SkillCandidate = {
  userId: string;
  userName: string;
  skillLevel: number;
};

export type SkillRecommendation = {
  skillName: string;
  mentorCandidates: SkillCandidate[];
  menteeCandidates: SkillCandidate[];
};

// ============================================
// 멘토-멘티 매칭 훅
// ============================================

export function useMentorMentee(groupId: string) {
  const [matches, setMatches] = useState<MentorMenteeMatch[]>(() => loadMatches(groupId));
  const [skills, setSkills] = useState<MemberSkill[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(false);

  // localStorage에서 매칭 불러오기
  const reload = useCallback(() => {
    if (!groupId) return;
    setMatches(loadMatches(groupId));
  }, [groupId]);

  // Supabase에서 member_skills 조회
  const fetchSkills = useCallback(async () => {
    if (!groupId) return;
    setSkillsLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("member_skills")
      .select("*")
      .eq("group_id", groupId)
      .order("skill_level", { ascending: false });

    setSkillsLoading(false);

    if (error) {
      return;
    }

    setSkills((data ?? []) as MemberSkill[]);
  }, [groupId]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // 스킬별 추천 목록 계산
  // memberNameMap: userId → displayName
  const getRecommendations = useCallback(
    (memberNameMap: Record<string, string>): SkillRecommendation[] => {
      // 고유 스킬 이름 목록
      const skillNames = Array.from(new Set(skills.map((s) => s.skill_name)));

      return skillNames.map((skillName) => {
        const forSkill = skills.filter((s) => s.skill_name === skillName);

        // 레벨 3 이상 → 멘토 후보, 레벨 2 이하 → 멘티 후보
        const mentorCandidates: SkillCandidate[] = forSkill
          .filter((s) => s.skill_level >= 3)
          .sort((a, b) => b.skill_level - a.skill_level)
          .map((s) => ({
            userId: s.user_id,
            userName: memberNameMap[s.user_id] ?? s.user_id,
            skillLevel: s.skill_level,
          }));

        const menteeCandidates: SkillCandidate[] = forSkill
          .filter((s) => s.skill_level <= 2)
          .sort((a, b) => a.skill_level - b.skill_level)
          .map((s) => ({
            userId: s.user_id,
            userName: memberNameMap[s.user_id] ?? s.user_id,
            skillLevel: s.skill_level,
          }));

        return { skillName, mentorCandidates, menteeCandidates };
      });
    },
    [skills]
  );

  // 매칭 생성
  const createMatch = useCallback(
    (params: {
      mentorId: string;
      mentorName: string;
      menteeId: string;
      menteeName: string;
      skillTag: string;
    }): MentorMenteeMatch => {
      const newMatch: MentorMenteeMatch = {
        id: crypto.randomUUID(),
        mentorId: params.mentorId,
        mentorName: params.mentorName,
        menteeId: params.menteeId,
        menteeName: params.menteeName,
        skillTag: params.skillTag,
        status: "active",
        createdAt: new Date().toISOString(),
      };

      const updated = [...matches, newMatch];
      saveMatches(groupId, updated);
      setMatches(updated);
      return newMatch;
    },
    [groupId, matches]
  );

  // 매칭 완료 처리
  const completeMatch = useCallback(
    (matchId: string) => {
      const updated = matches.map((m) =>
        m.id === matchId ? { ...m, status: "completed" as MentorMenteeStatus } : m
      );
      saveMatches(groupId, updated);
      setMatches(updated);
    },
    [groupId, matches]
  );

  // 매칭 삭제
  const deleteMatch = useCallback(
    (matchId: string) => {
      const updated = matches.filter((m) => m.id !== matchId);
      saveMatches(groupId, updated);
      setMatches(updated);
    },
    [groupId, matches]
  );

  const activeMatches = matches.filter((m) => m.status === "active");
  const completedMatches = matches.filter((m) => m.status === "completed");

  return {
    matches,
    activeMatches,
    completedMatches,
    loading: false,
    skills,
    skillsLoading,
    getRecommendations,
    createMatch,
    completeMatch,
    deleteMatch,
    refetchSkills: fetchSkills,
  };
}
