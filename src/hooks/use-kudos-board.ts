"use client";

import { useState, useCallback } from "react";
import { KudosCategory, KudosMessage } from "@/types";

const MAX_KUDOS = 100;

export const KUDOS_CATEGORY_EMOJI: Record<KudosCategory, string> = {
  teamwork: "🤝",
  effort: "💪",
  creativity: "🎨",
  leadership: "⭐",
  improvement: "📈",
};

export const KUDOS_CATEGORY_LABEL: Record<KudosCategory, string> = {
  teamwork: "팀워크",
  effort: "노력",
  creativity: "창의성",
  leadership: "리더십",
  improvement: "발전",
};

function getStorageKey(groupId: string) {
  return `dancebase:kudos:${groupId}`;
}

function loadKudos(groupId: string): KudosMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(groupId));
    if (!raw) return [];
    return JSON.parse(raw) as KudosMessage[];
  } catch {
    return [];
  }
}

function saveKudos(groupId: string, list: KudosMessage[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(getStorageKey(groupId), JSON.stringify(list));
}

export function useKudosBoard(groupId: string) {
  const [kudos, setKudos] = useState<KudosMessage[]>(() => loadKudos(groupId));

  const sendKudos = useCallback(
    (params: {
      fromName: string;
      toName: string;
      category: KudosCategory;
      message: string;
    }) => {
      const newMessage: KudosMessage = {
        id: crypto.randomUUID(),
        fromName: params.fromName.trim(),
        toName: params.toName.trim(),
        category: params.category,
        message: params.message.trim().slice(0, 100),
        createdAt: new Date().toISOString(),
      };

      setKudos((prev) => {
        // 최신 순 정렬 후 최대 100개 유지 (오래된 것 자동 삭제)
        const updated = [newMessage, ...prev].slice(0, MAX_KUDOS);
        saveKudos(groupId, updated);
        return updated;
      });
    },
    [groupId]
  );

  const deleteKudos = useCallback(
    (id: string) => {
      setKudos((prev) => {
        const updated = prev.filter((k) => k.id !== id);
        saveKudos(groupId, updated);
        return updated;
      });
    },
    [groupId]
  );

  const getKudosForMember = useCallback(
    (name: string): KudosMessage[] => {
      return kudos.filter((k) => k.toName === name);
    },
    [kudos]
  );

  const getTopReceivers = useCallback(
    (limit = 3): { name: string; count: number }[] => {
      const counts: Record<string, number> = {};
      for (const k of kudos) {
        counts[k.toName] = (counts[k.toName] ?? 0) + 1;
      }
      return Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    },
    [kudos]
  );

  return {
    kudos,
    sendKudos,
    deleteKudos,
    getKudosForMember,
    getTopReceivers,
  };
}
