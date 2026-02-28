"use client";

import { useState, useEffect, useCallback } from "react";
import type { SkillCertDefinition, SkillCertAward, SkillCertLevel } from "@/types";

// ============================================================
// 상수
// ============================================================

export const SKILL_CERT_LEVEL_LABELS: Record<SkillCertLevel, string> = {
  beginner: "입문",
  intermediate: "초급",
  advanced: "중급",
  expert: "고급",
  master: "마스터",
};

export const SKILL_CERT_LEVEL_ORDER: SkillCertLevel[] = [
  "beginner",
  "intermediate",
  "advanced",
  "expert",
  "master",
];

export const SKILL_CERT_LEVEL_COLORS: Record<
  SkillCertLevel,
  { badge: string; text: string; bar: string }
> = {
  beginner: {
    badge: "bg-gray-100 text-gray-700 border-gray-300",
    text: "text-gray-600",
    bar: "bg-gray-400",
  },
  intermediate: {
    badge: "bg-green-100 text-green-700 border-green-300",
    text: "text-green-600",
    bar: "bg-green-500",
  },
  advanced: {
    badge: "bg-blue-100 text-blue-700 border-blue-300",
    text: "text-blue-600",
    bar: "bg-blue-500",
  },
  expert: {
    badge: "bg-purple-100 text-purple-700 border-purple-300",
    text: "text-purple-600",
    bar: "bg-purple-500",
  },
  master: {
    badge: "bg-yellow-100 text-yellow-700 border-yellow-300",
    text: "text-yellow-600",
    bar: "bg-yellow-500",
  },
};

// ============================================================
// localStorage 헬퍼
// ============================================================

type StorageData = {
  certs: SkillCertDefinition[];
  awards: SkillCertAward[];
};

function storageKey(groupId: string): string {
  return `dancebase:skill-cert:${groupId}`;
}

function loadData(groupId: string): StorageData {
  if (typeof window === "undefined") return { certs: [], awards: [] };
  try {
    const raw = localStorage.getItem(storageKey(groupId));
    if (!raw) return { certs: [], awards: [] };
    return JSON.parse(raw) as StorageData;
  } catch {
    return { certs: [], awards: [] };
  }
}

function saveData(groupId: string, data: StorageData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(groupId), JSON.stringify(data));
  } catch {
    // 무시
  }
}

// ============================================================
// 통계 타입
// ============================================================

export type SkillCertStats = {
  totalCerts: number;
  totalAwards: number;
  levelDistribution: Record<SkillCertLevel, number>;
  topCertHolder: { memberName: string; count: number } | null;
};

// ============================================================
// 훅
// ============================================================

export function useSkillCertification(groupId: string) {
  const [certs, setCerts] = useState<SkillCertDefinition[]>([]);
  const [awards, setAwards] = useState<SkillCertAward[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    if (!groupId) return;
    const data = loadData(groupId);
    setCerts(data.certs);
    setAwards(data.awards);
    setLoading(false);
  }, [groupId]);

  useEffect(() => {
    reload();
  }, [reload]);

  // 내부 저장 헬퍼
  const persist = useCallback(
    (nextCerts: SkillCertDefinition[], nextAwards: SkillCertAward[]) => {
      saveData(groupId, { certs: nextCerts, awards: nextAwards });
      setCerts(nextCerts);
      setAwards(nextAwards);
    },
    [groupId]
  );

  // 인증 정의 생성
  const createCert = useCallback(
    (params: {
      skillName: string;
      description: string;
      category: string;
      level: SkillCertLevel;
      requirements: string[];
    }): SkillCertDefinition => {
      const newCert: SkillCertDefinition = {
        id: crypto.randomUUID(),
        skillName: params.skillName,
        description: params.description,
        category: params.category,
        level: params.level,
        requirements: params.requirements,
        createdAt: new Date().toISOString(),
      };
      const nextCerts = [...certs, newCert];
      persist(nextCerts, awards);
      return newCert;
    },
    [certs, awards, persist]
  );

  // 인증 정의 삭제 (관련 수여 기록도 함께 삭제)
  const deleteCert = useCallback(
    (certId: string) => {
      const nextCerts = certs.filter((c) => c.id !== certId);
      const nextAwards = awards.filter((a) => a.certId !== certId);
      persist(nextCerts, nextAwards);
    },
    [certs, awards, persist]
  );

  // 인증 수여
  const awardCert = useCallback(
    (params: {
      certId: string;
      memberName: string;
      certifiedBy: string;
      notes?: string;
    }): SkillCertAward => {
      const newAward: SkillCertAward = {
        id: crypto.randomUUID(),
        certId: params.certId,
        memberName: params.memberName,
        certifiedBy: params.certifiedBy,
        certifiedAt: new Date().toISOString(),
        notes: params.notes,
      };
      const nextAwards = [...awards, newAward];
      persist(certs, nextAwards);
      return newAward;
    },
    [certs, awards, persist]
  );

  // 인증 취소
  const revokeCert = useCallback(
    (awardId: string) => {
      const nextAwards = awards.filter((a) => a.id !== awardId);
      persist(certs, nextAwards);
    },
    [certs, awards, persist]
  );

  // 멤버 보유 인증 목록
  const getMemberCerts = useCallback(
    (memberName: string): Array<{ award: SkillCertAward; cert: SkillCertDefinition }> => {
      return awards
        .filter((a) => a.memberName === memberName)
        .flatMap((a) => {
          const cert = certs.find((c) => c.id === a.certId);
          if (!cert) return [];
          return [{ award: a, cert }];
        })
        .sort(
          (a, b) =>
            new Date(b.award.certifiedAt).getTime() -
            new Date(a.award.certifiedAt).getTime()
        );
    },
    [certs, awards]
  );

  // 인증 보유자 목록
  const getCertHolders = useCallback(
    (certId: string): SkillCertAward[] => {
      return awards
        .filter((a) => a.certId === certId)
        .sort(
          (a, b) =>
            new Date(b.certifiedAt).getTime() -
            new Date(a.certifiedAt).getTime()
        );
    },
    [awards]
  );

  // 통계
  const stats: SkillCertStats = (() => {
    const levelDistribution: Record<SkillCertLevel, number> = {
      beginner: 0,
      intermediate: 0,
      advanced: 0,
      expert: 0,
      master: 0,
    };

    for (const award of awards) {
      const cert = certs.find((c) => c.id === award.certId);
      if (cert) {
        levelDistribution[cert.level] += 1;
      }
    }

    // 최다 인증 보유자
    const memberCountMap = new Map<string, number>();
    for (const award of awards) {
      memberCountMap.set(
        award.memberName,
        (memberCountMap.get(award.memberName) ?? 0) + 1
      );
    }
    let topCertHolder: { memberName: string; count: number } | null = null;
    for (const [memberName, count] of memberCountMap.entries()) {
      if (!topCertHolder || count > topCertHolder.count) {
        topCertHolder = { memberName, count };
      }
    }

    return {
      totalCerts: certs.length,
      totalAwards: awards.length,
      levelDistribution,
      topCertHolder,
    };
  })();

  return {
    certs,
    awards,
    loading,
    createCert,
    deleteCert,
    awardCert,
    revokeCert,
    getMemberCerts,
    getCertHolders,
    stats,
    refetch: reload,
  };
}
