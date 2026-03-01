"use client";

import { useState, useCallback } from "react";
import { swrKeys } from "@/lib/swr/keys";
import type { SkillTreeData, SkillTreeNode, SkillTreeNodeStatus } from "@/types";

// ============================================
// 장르별 스킬 트리 템플릿
// ============================================

type SkillTemplate = Omit<SkillTreeNode, "status" | "learnedAt">;

const SKILL_TEMPLATES: Record<string, SkillTemplate[]> = {
  힙합: [
    // Tier 1 - 기본기
    { id: "hiphop-1-1", name: "기본 리듬감", description: "비트에 맞춰 몸을 움직이는 기본 리듬감 훈련", tier: 1, prerequisiteIds: [] },
    { id: "hiphop-1-2", name: "바운스", description: "힙합의 기본인 무릎 바운스 동작 습득", tier: 1, prerequisiteIds: [] },
    { id: "hiphop-1-3", name: "기본 스텝", description: "2스텝, 사이드 스텝 등 기본 이동 동작", tier: 1, prerequisiteIds: [] },
    // Tier 2 - 초급
    { id: "hiphop-2-1", name: "그루브", description: "자연스러운 바디 그루브 표현", tier: 2, prerequisiteIds: ["hiphop-1-1", "hiphop-1-2"] },
    { id: "hiphop-2-2", name: "탑 록", description: "서서 하는 힙합 기본 무브먼트", tier: 2, prerequisiteIds: ["hiphop-1-2", "hiphop-1-3"] },
    { id: "hiphop-2-3", name: "바운스 바리에이션", description: "다양한 바운스 변형 동작", tier: 2, prerequisiteIds: ["hiphop-1-2"] },
    // Tier 3 - 중급
    { id: "hiphop-3-1", name: "스웨그", description: "힙합 특유의 자신감 있는 태도 표현", tier: 3, prerequisiteIds: ["hiphop-2-1", "hiphop-2-2"] },
    { id: "hiphop-3-2", name: "바디 웨이브", description: "몸 전체를 이용한 유동적인 웨이브 동작", tier: 3, prerequisiteIds: ["hiphop-2-1"] },
    { id: "hiphop-3-3", name: "풋웍", description: "발을 이용한 복잡한 스텝 조합", tier: 3, prerequisiteIds: ["hiphop-2-2", "hiphop-2-3"] },
    // Tier 4 - 고급
    { id: "hiphop-4-1", name: "프리스타일", description: "음악에 맞춰 즉흥적으로 춤추는 능력", tier: 4, prerequisiteIds: ["hiphop-3-1", "hiphop-3-2"] },
    { id: "hiphop-4-2", name: "사이퍼", description: "원형으로 모여 돌아가며 춤추는 힙합 문화", tier: 4, prerequisiteIds: ["hiphop-3-1", "hiphop-3-3"] },
    { id: "hiphop-4-3", name: "레이어링", description: "리듬을 여러 겹으로 쌓아 표현하는 기술", tier: 4, prerequisiteIds: ["hiphop-3-2", "hiphop-3-3"] },
    // Tier 5 - 최상급
    { id: "hiphop-5-1", name: "안무 창작", description: "힙합 안무를 직접 만들고 지도하는 능력", tier: 5, prerequisiteIds: ["hiphop-4-1", "hiphop-4-2"] },
    { id: "hiphop-5-2", name: "뮤직 인터프리테이션", description: "음악의 감정과 구조를 움직임으로 완벽히 표현", tier: 5, prerequisiteIds: ["hiphop-4-1", "hiphop-4-3"] },
    { id: "hiphop-5-3", name: "스타일 퓨전", description: "힙합과 타 장르를 자유롭게 결합하는 능력", tier: 5, prerequisiteIds: ["hiphop-4-2", "hiphop-4-3"] },
  ],
  팝핀: [
    // Tier 1 - 기본기
    { id: "popping-1-1", name: "기본 팝", description: "근육을 순간적으로 수축시키는 팝 동작의 기초", tier: 1, prerequisiteIds: [] },
    { id: "popping-1-2", name: "아이솔레이션", description: "신체 각 부위를 독립적으로 움직이는 훈련", tier: 1, prerequisiteIds: [] },
    { id: "popping-1-3", name: "팝핀 리듬", description: "비트에 맞춰 팝을 내는 리듬 감각", tier: 1, prerequisiteIds: [] },
    // Tier 2 - 초급
    { id: "popping-2-1", name: "암 팝", description: "팔을 이용한 팝 동작", tier: 2, prerequisiteIds: ["popping-1-1", "popping-1-2"] },
    { id: "popping-2-2", name: "체스트 팝", description: "가슴 근육을 이용한 팝 동작", tier: 2, prerequisiteIds: ["popping-1-1", "popping-1-2"] },
    { id: "popping-2-3", name: "스트럿", description: "팝핀의 기본 이동 동작", tier: 2, prerequisiteIds: ["popping-1-3"] },
    // Tier 3 - 중급
    { id: "popping-3-1", name: "웨이브", description: "몸 전체에 파동을 만드는 웨이브 기술", tier: 3, prerequisiteIds: ["popping-2-1", "popping-2-2"] },
    { id: "popping-3-2", name: "투투", description: "두 박자를 이용한 팝핀 스타일", tier: 3, prerequisiteIds: ["popping-2-1", "popping-2-3"] },
    { id: "popping-3-3", name: "글라이드", description: "미끄러지듯 이동하는 글라이드 기술", tier: 3, prerequisiteIds: ["popping-2-3"] },
    // Tier 4 - 고급
    { id: "popping-4-1", name: "딤스톱", description: "동작을 순간 정지시키는 딤스톱 기술", tier: 4, prerequisiteIds: ["popping-3-1", "popping-3-2"] },
    { id: "popping-4-2", name: "로봇", description: "기계적인 움직임을 표현하는 로봇 스타일", tier: 4, prerequisiteIds: ["popping-3-2", "popping-3-3"] },
    { id: "popping-4-3", name: "슬로우모션", description: "느린 움직임을 자연스럽게 표현", tier: 4, prerequisiteIds: ["popping-3-1", "popping-3-3"] },
    // Tier 5 - 최상급
    { id: "popping-5-1", name: "팝핀 프리스타일", description: "팝핀 무브를 자유자재로 구사하는 즉흥 능력", tier: 5, prerequisiteIds: ["popping-4-1", "popping-4-2"] },
    { id: "popping-5-2", name: "팝핀 융합 스타일", description: "팝핀과 다른 기능성 무브를 결합하는 능력", tier: 5, prerequisiteIds: ["popping-4-1", "popping-4-3"] },
    { id: "popping-5-3", name: "스타일리스트", description: "개인만의 독창적인 팝핀 스타일 완성", tier: 5, prerequisiteIds: ["popping-4-2", "popping-4-3"] },
  ],
  왁킹: [
    // Tier 1 - 기본기
    { id: "waacking-1-1", name: "암 모션", description: "팔을 빠르게 채찍처럼 움직이는 기본 동작", tier: 1, prerequisiteIds: [] },
    { id: "waacking-1-2", name: "포즈", description: "왁킹 특유의 포즈와 자세 훈련", tier: 1, prerequisiteIds: [] },
    { id: "waacking-1-3", name: "왁킹 리듬", description: "디스코/펑크 음악에 맞춘 리듬 감각", tier: 1, prerequisiteIds: [] },
    // Tier 2 - 초급
    { id: "waacking-2-1", name: "포워드 왁", description: "앞으로 팔을 뻗는 기본 왁킹 동작", tier: 2, prerequisiteIds: ["waacking-1-1", "waacking-1-2"] },
    { id: "waacking-2-2", name: "비하인드 왁", description: "뒤로 팔을 돌리는 왁킹 동작", tier: 2, prerequisiteIds: ["waacking-1-1", "waacking-1-2"] },
    { id: "waacking-2-3", name: "워크", description: "왁킹에서 사용되는 특유의 워킹 스타일", tier: 2, prerequisiteIds: ["waacking-1-3"] },
    // Tier 3 - 중급
    { id: "waacking-3-1", name: "포즈 콤비네이션", description: "여러 포즈를 연속으로 연결하는 기술", tier: 3, prerequisiteIds: ["waacking-2-1", "waacking-2-2"] },
    { id: "waacking-3-2", name: "언더암 턴", description: "팔 아래로 회전하는 턴 동작", tier: 3, prerequisiteIds: ["waacking-2-1", "waacking-2-3"] },
    { id: "waacking-3-3", name: "플로어 워크", description: "바닥을 활용한 왁킹 동작", tier: 3, prerequisiteIds: ["waacking-2-2", "waacking-2-3"] },
    // Tier 4 - 고급
    { id: "waacking-4-1", name: "퍼포밍 아트", description: "연기와 표정을 결합한 왁킹 퍼포먼스", tier: 4, prerequisiteIds: ["waacking-3-1", "waacking-3-2"] },
    { id: "waacking-4-2", name: "뮤지컬리티", description: "음악의 멜로디와 가사를 움직임으로 표현", tier: 4, prerequisiteIds: ["waacking-3-1", "waacking-3-3"] },
    { id: "waacking-4-3", name: "파트너 왁킹", description: "파트너와 함께하는 왁킹 듀엣", tier: 4, prerequisiteIds: ["waacking-3-2", "waacking-3-3"] },
    // Tier 5 - 최상급
    { id: "waacking-5-1", name: "왁킹 배틀", description: "배틀 상황에서의 즉흥 왁킹 능력", tier: 5, prerequisiteIds: ["waacking-4-1", "waacking-4-2"] },
    { id: "waacking-5-2", name: "스타일 완성", description: "개인만의 왁킹 스타일과 개성 구축", tier: 5, prerequisiteIds: ["waacking-4-1", "waacking-4-3"] },
    { id: "waacking-5-3", name: "안무 지도", description: "왁킹 안무를 창작하고 팀원에게 지도", tier: 5, prerequisiteIds: ["waacking-4-2", "waacking-4-3"] },
  ],
  락킹: [
    // Tier 1 - 기본기
    { id: "locking-1-1", name: "락 동작", description: "관절을 순간적으로 잠그는 락 동작의 기본", tier: 1, prerequisiteIds: [] },
    { id: "locking-1-2", name: "포인트", description: "손가락으로 강조하는 포인트 동작", tier: 1, prerequisiteIds: [] },
    { id: "locking-1-3", name: "락킹 리듬", description: "펑키한 음악에 맞춘 리듬 감각", tier: 1, prerequisiteIds: [] },
    // Tier 2 - 초급
    { id: "locking-2-1", name: "펑키 치킨", description: "닭처럼 팔꿈치를 이용한 대표 락킹 무브", tier: 2, prerequisiteIds: ["locking-1-1", "locking-1-2"] },
    { id: "locking-2-2", name: "스쿱", description: "아래에서 위로 크게 뜨는 스쿱 동작", tier: 2, prerequisiteIds: ["locking-1-1", "locking-1-3"] },
    { id: "locking-2-3", name: "스커트", description: "치마를 잡는 듯한 손 동작", tier: 2, prerequisiteIds: ["locking-1-2", "locking-1-3"] },
    // Tier 3 - 중급
    { id: "locking-3-1", name: "위스트", description: "손목을 이용한 빠른 회전 동작", tier: 3, prerequisiteIds: ["locking-2-1", "locking-2-3"] },
    { id: "locking-3-2", name: "슬랩 더 베이스", description: "베이스를 튕기는 것 같은 손 동작", tier: 3, prerequisiteIds: ["locking-2-1", "locking-2-2"] },
    { id: "locking-3-3", name: "구디", description: "락킹의 대표 유머러스한 무브", tier: 3, prerequisiteIds: ["locking-2-2", "locking-2-3"] },
    // Tier 4 - 고급
    { id: "locking-4-1", name: "락킹 콤보", description: "다양한 락킹 무브를 연결하는 기술", tier: 4, prerequisiteIds: ["locking-3-1", "locking-3-2"] },
    { id: "locking-4-2", name: "배우지 않기", description: "유머와 캐릭터를 결합한 락킹 스타일", tier: 4, prerequisiteIds: ["locking-3-2", "locking-3-3"] },
    { id: "locking-4-3", name: "스플릿", description: "땅에 앉는 스플릿 동작", tier: 4, prerequisiteIds: ["locking-3-1", "locking-3-3"] },
    // Tier 5 - 최상급
    { id: "locking-5-1", name: "락킹 마스터", description: "락킹의 모든 기술을 완숙하게 구사", tier: 5, prerequisiteIds: ["locking-4-1", "locking-4-2"] },
    { id: "locking-5-2", name: "쇼맨십", description: "관객을 사로잡는 락킹 엔터테인먼트 능력", tier: 5, prerequisiteIds: ["locking-4-1", "locking-4-3"] },
    { id: "locking-5-3", name: "락킹 교육자", description: "락킹 역사와 무브를 교육할 수 있는 수준", tier: 5, prerequisiteIds: ["locking-4-2", "locking-4-3"] },
  ],
  브레이킹: [
    // Tier 1 - 기본기
    { id: "breaking-1-1", name: "탑 록", description: "서서 하는 브레이킹 기본 스텝", tier: 1, prerequisiteIds: [] },
    { id: "breaking-1-2", name: "다운 록", description: "바닥에서 하는 스텝 워크의 기초", tier: 1, prerequisiteIds: [] },
    { id: "breaking-1-3", name: "브레이킹 리듬", description: "브레이크 비트에 맞춘 리듬 이해", tier: 1, prerequisiteIds: [] },
    // Tier 2 - 초급
    { id: "breaking-2-1", name: "6스텝", description: "브레이킹의 핵심 6단계 풋워크", tier: 2, prerequisiteIds: ["breaking-1-1", "breaking-1-2"] },
    { id: "breaking-2-2", name: "CC", description: "코커로치 클립, 기본 플로어 무브", tier: 2, prerequisiteIds: ["breaking-1-2", "breaking-1-3"] },
    { id: "breaking-2-3", name: "입장/퇴장", description: "사이퍼 진입과 퇴장 방법", tier: 2, prerequisiteIds: ["breaking-1-1", "breaking-1-3"] },
    // Tier 3 - 중급
    { id: "breaking-3-1", name: "프리즈", description: "동작을 순간 멈추는 프리즈 기술", tier: 3, prerequisiteIds: ["breaking-2-1", "breaking-2-2"] },
    { id: "breaking-3-2", name: "파워무브 기초", description: "헤드스핀, 윈드밀 등 파워무브 입문", tier: 3, prerequisiteIds: ["breaking-2-1", "breaking-2-3"] },
    { id: "breaking-3-3", name: "풋워크 콤보", description: "6스텝을 응용한 다양한 조합", tier: 3, prerequisiteIds: ["breaking-2-2", "breaking-2-3"] },
    // Tier 4 - 고급
    { id: "breaking-4-1", name: "플로어 무브", description: "바닥을 활용한 창의적인 무브 조합", tier: 4, prerequisiteIds: ["breaking-3-1", "breaking-3-3"] },
    { id: "breaking-4-2", name: "파워무브 심화", description: "다양한 파워무브를 연속으로 구사", tier: 4, prerequisiteIds: ["breaking-3-2"] },
    { id: "breaking-4-3", name: "배틀 전략", description: "사이퍼에서 배틀 상황 대응 능력", tier: 4, prerequisiteIds: ["breaking-3-1", "breaking-3-3"] },
    // Tier 5 - 최상급
    { id: "breaking-5-1", name: "B보이/B걸 완성", description: "자신만의 완성된 브레이킹 스타일", tier: 5, prerequisiteIds: ["breaking-4-1", "breaking-4-2"] },
    { id: "breaking-5-2", name: "배틀 마스터", description: "대회 및 배틀에서 최상급 실력 발휘", tier: 5, prerequisiteIds: ["breaking-4-2", "breaking-4-3"] },
    { id: "breaking-5-3", name: "크루 리더", description: "크루를 이끌고 단체 퍼포먼스를 기획", tier: 5, prerequisiteIds: ["breaking-4-1", "breaking-4-3"] },
  ],
};

// 지원 장르 목록
export const SKILL_TREE_GENRES = Object.keys(SKILL_TEMPLATES);

// ============================================
// localStorage 헬퍼
// ============================================

function storageKey(groupId: string, userId: string): string {
  return `dancebase:skill-tree:${groupId}:${userId}`;
}

function loadData(groupId: string, userId: string): SkillTreeData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey(groupId, userId));
    if (!raw) return null;
    return JSON.parse(raw) as SkillTreeData;
  } catch {
    return null;
  }
}

function saveData(groupId: string, userId: string, data: SkillTreeData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(groupId, userId), JSON.stringify(data));
  } catch {
    // 무시
  }
}

// ============================================
// 스킬 상태 계산 헬퍼
// ============================================

function computeStatuses(
  nodes: SkillTreeNode[]
): SkillTreeNode[] {
  const learnedIds = new Set(
    nodes.filter((n) => n.status === "learned").map((n) => n.id)
  );
  return nodes.map((node) => {
    if (node.status === "learned") return node;
    const allPrereqsMet = node.prerequisiteIds.every((pid) =>
      learnedIds.has(pid)
    );
    const newStatus: SkillTreeNodeStatus = allPrereqsMet ? "available" : "locked";
    return { ...node, status: newStatus };
  });
}

// 템플릿에서 초기 노드 생성
function buildInitialNodes(genre: string): SkillTreeNode[] {
  const templates = SKILL_TEMPLATES[genre] ?? SKILL_TEMPLATES["힙합"];
  return templates.map((t) => ({
    ...t,
    status: t.prerequisiteIds.length === 0 ? "available" : "locked",
  }));
}

// ============================================
// useSkillTree 훅
// ============================================

export type SkillTreeStats = {
  total: number;
  learned: number;
  available: number;
  ratio: number; // 0~100
};

export function useSkillTree(groupId: string, userId: string) {
  const [data, setData] = useState<SkillTreeData | null>(null);

  // SWR 키 (타입 레퍼런스용)
  const _swrKey = swrKeys.skillTree(groupId, userId);
  void _swrKey;

  const reload = useCallback(() => {
    if (!groupId || !userId) return;
    const saved = loadData(groupId, userId);
    setData(saved);
  }, [groupId, userId]);

  // 장르 선택 → 트리 초기화
  const initTree = useCallback(
    (genre: string) => {
      if (!groupId || !userId) return;
      const nodes = buildInitialNodes(genre);
      const newData: SkillTreeData = {
        userId,
        genre,
        nodes,
        totalLearned: 0,
        updatedAt: new Date().toISOString(),
      };
      saveData(groupId, userId, newData);
      setData(newData);
    },
    [groupId, userId]
  );

  // 스킬 해금
  const learnSkill = useCallback(
    (skillId: string): boolean => {
      if (!data) return false;
      const node = data.nodes.find((n) => n.id === skillId);
      if (!node || node.status !== "available") return false;

      const updatedNodes = data.nodes.map((n) =>
        n.id === skillId
          ? { ...n, status: "learned" as SkillTreeNodeStatus, learnedAt: new Date().toISOString() }
          : n
      );
      const recomputed = computeStatuses(updatedNodes);
      const totalLearned = recomputed.filter((n) => n.status === "learned").length;

      const newData: SkillTreeData = {
        ...data,
        nodes: recomputed,
        totalLearned,
        updatedAt: new Date().toISOString(),
      };
      saveData(groupId, userId, newData);
      setData(newData);
      return true;
    },
    [data, groupId, userId]
  );

  // 트리 리셋
  const resetTree = useCallback(() => {
    if (!data) return;
    const nodes = buildInitialNodes(data.genre);
    const newData: SkillTreeData = {
      ...data,
      nodes,
      totalLearned: 0,
      updatedAt: new Date().toISOString(),
    };
    saveData(groupId, userId, newData);
    setData(newData);
  }, [data, groupId, userId]);

  // 통계
  const stats: SkillTreeStats = data
    ? {
        total: data.nodes.length,
        learned: data.nodes.filter((n) => n.status === "learned").length,
        available: data.nodes.filter((n) => n.status === "available").length,
        ratio:
          data.nodes.length > 0
            ? Math.round(
                (data.nodes.filter((n) => n.status === "learned").length /
                  data.nodes.length) *
                  100
              )
            : 0,
      }
    : { total: 0, learned: 0, available: 0, ratio: 0 };

  // tier별 노드 그룹화
  const nodesByTier = data
    ? data.nodes.reduce<Record<number, SkillTreeNode[]>>((acc, node) => {
        if (!acc[node.tier]) acc[node.tier] = [];
        acc[node.tier].push(node);
        return acc;
      }, {})
    : {};

  return {
    data,
    loading: false,
    stats,
    nodesByTier,
    genres: SKILL_TREE_GENRES,
    initTree,
    learnSkill,
    resetTree,
    refetch: reload,
  };
}
