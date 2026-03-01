"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import { toast } from "sonner";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type {
  PracticeEvalSession,
  PracticeEvalCriteria,
  PracticeEvalMemberResult,
  PracticeEvalScore,
} from "@/types";

// ─── localStorage 헬퍼 ────────────────────────────────────────

const LS_KEY = (groupId: string) =>
  `dancebase:practice-evaluation:${groupId}`;

// ─── 총점 계산 헬퍼 ──────────────────────────────────────────

function calcTotal(scores: PracticeEvalScore[]): number {
  return scores.reduce((sum, s) => sum + s.score, 0);
}

// ─── 훅 ─────────────────────────────────────────────────────

export function usePracticeEvaluation(groupId: string) {
  const { data, mutate } = useSWR(
    groupId ? swrKeys.practiceEvaluation(groupId) : null,
    () => loadFromStorage<PracticeEvalSession[]>(LS_KEY(groupId), []),
    { revalidateOnFocus: false }
  );

  const sessions = data ?? [];

  // ── 세션 추가 ──────────────────────────────────────────────

  function addSession(input: {
    date: string;
    title: string;
    criteria: PracticeEvalCriteria[];
    evaluator: string;
    notes?: string;
  }): string | null {
    if (!input.title.trim()) {
      toast.error("평가 세션 제목을 입력해주세요.");
      return null;
    }
    if (!input.date) {
      toast.error("평가 날짜를 입력해주세요.");
      return null;
    }
    if (!input.evaluator.trim()) {
      toast.error("평가자를 입력해주세요.");
      return null;
    }
    if (input.criteria.length === 0) {
      toast.error("평가 기준을 하나 이상 추가해주세요.");
      return null;
    }
    try {
      const stored = loadFromStorage<PracticeEvalSession[]>(LS_KEY(groupId), []);
      const newSession: PracticeEvalSession = {
        id: crypto.randomUUID(),
        date: input.date,
        title: input.title.trim(),
        criteria: input.criteria,
        results: [],
        evaluator: input.evaluator.trim(),
        notes: input.notes?.trim(),
        createdAt: new Date().toISOString(),
      };
      const next = [newSession, ...stored];
      saveToStorage(LS_KEY(groupId), next);
      mutate(next, false);
      toast.success("평가 세션이 생성되었습니다.");
      return newSession.id;
    } catch {
      toast.error("평가 세션 생성에 실패했습니다.");
      return null;
    }
  }

  // ── 세션 수정 ──────────────────────────────────────────────

  function updateSession(
    sessionId: string,
    patch: Partial<
      Omit<PracticeEvalSession, "id" | "createdAt" | "results">
    >
  ): boolean {
    try {
      const stored = loadFromStorage<PracticeEvalSession[]>(LS_KEY(groupId), []);
      const idx = stored.findIndex((s) => s.id === sessionId);
      if (idx === -1) {
        toast.error("평가 세션을 찾을 수 없습니다.");
        return false;
      }
      const next = [
        ...stored.slice(0, idx),
        { ...stored[idx], ...patch },
        ...stored.slice(idx + 1),
      ];
      saveToStorage(LS_KEY(groupId), next);
      mutate(next, false);
      toast.success("평가 세션이 수정되었습니다.");
      return true;
    } catch {
      toast.error("평가 세션 수정에 실패했습니다.");
      return false;
    }
  }

  // ── 세션 삭제 ──────────────────────────────────────────────

  function deleteSession(sessionId: string): boolean {
    try {
      const stored = loadFromStorage<PracticeEvalSession[]>(LS_KEY(groupId), []);
      const next = stored.filter((s) => s.id !== sessionId);
      if (next.length === stored.length) return false;
      saveToStorage(LS_KEY(groupId), next);
      mutate(next, false);
      toast.success("평가 세션이 삭제되었습니다.");
      return true;
    } catch {
      toast.error("평가 세션 삭제에 실패했습니다.");
      return false;
    }
  }

  // ── 기준 추가 ──────────────────────────────────────────────

  function addCriteria(
    sessionId: string,
    criteria: { name: string; maxScore: number }
  ): boolean {
    if (!criteria.name.trim()) {
      toast.error("기준 이름을 입력해주세요.");
      return false;
    }
    if (criteria.maxScore < 1) {
      toast.error("최대 점수는 1 이상이어야 합니다.");
      return false;
    }
    try {
      const stored = loadFromStorage<PracticeEvalSession[]>(LS_KEY(groupId), []);
      const next = stored.map((s) => {
        if (s.id !== sessionId) return s;
        const newCriteria: PracticeEvalCriteria = {
          id: crypto.randomUUID(),
          name: criteria.name.trim(),
          maxScore: criteria.maxScore,
        };
        return { ...s, criteria: [...s.criteria, newCriteria] };
      });
      saveToStorage(LS_KEY(groupId), next);
      mutate(next, false);
      return true;
    } catch {
      toast.error("기준 추가에 실패했습니다.");
      return false;
    }
  }

  // ── 기준 삭제 ──────────────────────────────────────────────

  function deleteCriteria(sessionId: string, criteriaId: string): boolean {
    try {
      const stored = loadFromStorage<PracticeEvalSession[]>(LS_KEY(groupId), []);
      const next = stored.map((s) => {
        if (s.id !== sessionId) return s;
        return {
          ...s,
          criteria: s.criteria.filter((c) => c.id !== criteriaId),
          // 해당 기준 점수도 제거
          results: s.results.map((r) => ({
            ...r,
            scores: r.scores.filter((sc) => sc.criteriaId !== criteriaId),
            totalScore: r.scores
              .filter((sc) => sc.criteriaId !== criteriaId)
              .reduce((sum, sc) => sum + sc.score, 0),
          })),
        };
      });
      saveToStorage(LS_KEY(groupId), next);
      mutate(next, false);
      return true;
    } catch {
      toast.error("기준 삭제에 실패했습니다.");
      return false;
    }
  }

  // ── 멤버 결과 저장 (추가/수정 통합) ───────────────────────

  function saveMemberResult(
    sessionId: string,
    memberName: string,
    scores: PracticeEvalScore[],
    feedback?: string
  ): boolean {
    if (!memberName.trim()) {
      toast.error("멤버 이름을 입력해주세요.");
      return false;
    }
    try {
      const stored = loadFromStorage<PracticeEvalSession[]>(LS_KEY(groupId), []);
      const next = stored.map((s) => {
        if (s.id !== sessionId) return s;
        const totalScore = calcTotal(scores);
        const newResult: PracticeEvalMemberResult = {
          memberName: memberName.trim(),
          scores,
          totalScore,
          feedback: feedback?.trim(),
        };
        const existingIdx = s.results.findIndex(
          (r) =>
            r.memberName.toLowerCase() === memberName.trim().toLowerCase()
        );
        const updatedResults =
          existingIdx >= 0
            ? [
                ...s.results.slice(0, existingIdx),
                newResult,
                ...s.results.slice(existingIdx + 1),
              ]
            : [...s.results, newResult];
        return { ...s, results: updatedResults };
      });
      saveToStorage(LS_KEY(groupId), next);
      mutate(next, false);
      toast.success(`${memberName.trim()}님의 평가가 저장되었습니다.`);
      return true;
    } catch {
      toast.error("평가 저장에 실패했습니다.");
      return false;
    }
  }

  // ── 멤버 결과 삭제 ─────────────────────────────────────────

  function deleteMemberResult(sessionId: string, memberName: string): boolean {
    try {
      const stored = loadFromStorage<PracticeEvalSession[]>(LS_KEY(groupId), []);
      const next = stored.map((s) => {
        if (s.id !== sessionId) return s;
        return {
          ...s,
          results: s.results.filter(
            (r) =>
              r.memberName.toLowerCase() !== memberName.toLowerCase()
          ),
        };
      });
      saveToStorage(LS_KEY(groupId), next);
      mutate(next, false);
      toast.success("평가 결과가 삭제되었습니다.");
      return true;
    } catch {
      toast.error("평가 결과 삭제에 실패했습니다.");
      return false;
    }
  }

  // ── 멤버 전체 평균 ─────────────────────────────────────────

  function getMemberAverage(memberName: string): number {
    const memberSessions = sessions.filter((s) =>
      s.results.some(
        (r) => r.memberName.toLowerCase() === memberName.toLowerCase()
      )
    );
    if (memberSessions.length === 0) return 0;
    const totalSum = memberSessions.reduce((sum, s) => {
      const result = s.results.find(
        (r) => r.memberName.toLowerCase() === memberName.toLowerCase()
      );
      return sum + (result?.totalScore ?? 0);
    }, 0);
    return Math.round(totalSum / memberSessions.length);
  }

  // ── 최근 5회 세션 점수 추이 ───────────────────────────────

  function getMemberTrend(
    memberName: string
  ): { date: string; title: string; totalScore: number }[] {
    return sessions
      .filter((s) =>
        s.results.some(
          (r) => r.memberName.toLowerCase() === memberName.toLowerCase()
        )
      )
      .slice(0, 5)
      .map((s) => {
        const result = s.results.find(
          (r) => r.memberName.toLowerCase() === memberName.toLowerCase()
        );
        return {
          date: s.date,
          title: s.title,
          totalScore: result?.totalScore ?? 0,
        };
      })
      .reverse();
  }

  // ── 통계 ──────────────────────────────────────────────────

  const totalSessions = sessions.length;

  const allScores = sessions.flatMap((s) =>
    s.results.map((r) => r.totalScore)
  );
  const averageScore =
    allScores.length > 0
      ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
      : 0;

  // 멤버별 평균 집계
  const memberMap = new Map<string, { sum: number; count: number }>();
  sessions.forEach((s) => {
    s.results.forEach((r) => {
      const key = r.memberName;
      const existing = memberMap.get(key) ?? { sum: 0, count: 0 };
      memberMap.set(key, {
        sum: existing.sum + r.totalScore,
        count: existing.count + 1,
      });
    });
  });

  const topPerformers = [...memberMap.entries()]
    .map(([name, { sum, count }]) => ({
      memberName: name,
      averageScore: Math.round(sum / count),
      sessionCount: count,
    }))
    .sort((a, b) => b.averageScore - a.averageScore)
    .slice(0, 3);

  const stats = {
    totalSessions,
    averageScore,
    topPerformers,
  };

  return {
    sessions,
    // 세션 CRUD
    addSession,
    updateSession,
    deleteSession,
    // 기준 CRUD
    addCriteria,
    deleteCriteria,
    // 결과 CRUD
    saveMemberResult,
    deleteMemberResult,
    // 분석
    getMemberAverage,
    getMemberTrend,
    // 통계
    stats,
    // SWR
    refetch: () => mutate(),
  };
}
