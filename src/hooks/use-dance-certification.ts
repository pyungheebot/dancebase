"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import { DanceCertification, DanceCertLevel } from "@/types";

// 레벨 한글 라벨
export const CERT_LEVEL_LABELS: Record<DanceCertLevel, string> = {
  beginner:     "입문",
  elementary:   "초급",
  intermediate: "중급",
  advanced:     "상급",
  master:       "마스터",
};

// 레벨 순서 (낮은 → 높은)
export const CERT_LEVEL_ORDER: DanceCertLevel[] = [
  "beginner",
  "elementary",
  "intermediate",
  "advanced",
  "master",
];

// 레벨별 색상 (Tailwind CSS 클래스)
export const CERT_LEVEL_COLORS: Record<
  DanceCertLevel,
  { badge: string; bar: string; text: string }
> = {
  beginner:     { badge: "bg-gray-100 text-gray-700 border-gray-300",   bar: "bg-gray-400",   text: "text-gray-600" },
  elementary:   { badge: "bg-green-100 text-green-700 border-green-300", bar: "bg-green-500",  text: "text-green-700" },
  intermediate: { badge: "bg-blue-100 text-blue-700 border-blue-300",   bar: "bg-blue-500",   text: "text-blue-700" },
  advanced:     { badge: "bg-purple-100 text-purple-700 border-purple-300", bar: "bg-purple-500", text: "text-purple-700" },
  master:       { badge: "bg-yellow-100 text-yellow-700 border-yellow-400", bar: "bg-yellow-500", text: "text-yellow-700" },
};

// localStorage 키
function storageKey(groupId: string): string {
  return `dancebase:dance-cert:${groupId}`;
}

// localStorage에서 읽기
function loadCertifications(groupId: string): DanceCertification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(groupId));
    if (!raw) return [];
    return JSON.parse(raw) as DanceCertification[];
  } catch {
    return [];
  }
}

// localStorage에 쓰기
function saveCertifications(groupId: string, certs: DanceCertification[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(groupId), JSON.stringify(certs));
}

export function useDanceCertification(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.danceCertification(groupId),
    () => loadCertifications(groupId),
    { revalidateOnFocus: false }
  );

  const certifications: DanceCertification[] = data ?? [];

  // 인증 발급 (같은 멤버+장르 조합이면 최신으로 교체)
  async function issueCertification(
    cert: Omit<DanceCertification, "id" | "certifiedAt">
  ): Promise<void> {
    const current = loadCertifications(groupId);
    const newCert: DanceCertification = {
      ...cert,
      id: `cert-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      certifiedAt: new Date().toISOString(),
    };

    // 같은 멤버 + 장르 조합이 있으면 교체, 없으면 추가
    const idx = current.findIndex(
      (c) => c.memberId === cert.memberId && c.genre === cert.genre
    );
    let updated: DanceCertification[];
    if (idx !== -1) {
      updated = [...current];
      updated[idx] = newCert;
    } else {
      updated = [...current, newCert];
    }

    saveCertifications(groupId, updated);
    await mutate(updated, false);
  }

  // 인증 삭제
  async function deleteCertification(certId: string): Promise<void> {
    const current = loadCertifications(groupId);
    const updated = current.filter((c) => c.id !== certId);
    saveCertifications(groupId, updated);
    await mutate(updated, false);
  }

  // 특정 멤버의 인증 목록
  function getCertsByMember(memberId: string): DanceCertification[] {
    return certifications.filter((c) => c.memberId === memberId);
  }

  // 특정 장르의 인증 목록
  function getCertsByGenre(genre: string): DanceCertification[] {
    return certifications.filter((c) => c.genre === genre);
  }

  // 레벨별 통계 (전체)
  const levelStats: Record<DanceCertLevel, number> = {
    beginner:     0,
    elementary:   0,
    intermediate: 0,
    advanced:     0,
    master:       0,
  };
  for (const cert of certifications) {
    levelStats[cert.level] = (levelStats[cert.level] ?? 0) + 1;
  }

  // 장르 목록 (중복 제거)
  const genres: string[] = Array.from(
    new Set(certifications.map((c) => c.genre))
  ).sort();

  // 멤버 목록 (중복 제거, {id, name} 형태)
  const memberMap = new Map<string, string>();
  for (const cert of certifications) {
    memberMap.set(cert.memberId, cert.memberName);
  }
  const members = Array.from(memberMap.entries()).map(([id, name]) => ({
    id,
    name,
  }));

  return {
    certifications,
    loading: isLoading,
    issueCertification,
    deleteCertification,
    getCertsByMember,
    getCertsByGenre,
    levelStats,
    genres,
    members,
    refetch: () => mutate(),
  };
}
