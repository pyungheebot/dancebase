"use client";

import { useState, useCallback } from "react";
import type {
  CommunicationPreference,
  CommPreferredTime,
  CommChannel,
} from "@/types";

// ============================================
// localStorage 유틸
// ============================================

function getStorageKey(groupId: string, userId: string): string {
  return `dancebase:comm-prefs:${groupId}:${userId}`;
}

function savePreference(
  groupId: string,
  userId: string,
  pref: CommunicationPreference
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(groupId, userId), JSON.stringify(pref));
  } catch {
    // localStorage 저장 실패 무시
  }
}

const DEFAULT_PREFERENCE: Omit<CommunicationPreference, "userId" | "updatedAt"> = {
  preferredTimes: [],
  preferredChannels: [],
  quietHoursStart: "22:00",
  quietHoursEnd: "08:00",
};

// ============================================
// 훅
// ============================================

export function useCommunicationPreferences(groupId: string, userId: string) {
  const [preference, setPreference] = useState<CommunicationPreference | null>(null);

  const updatePreferences = useCallback(
    (updates: Partial<Omit<CommunicationPreference, "userId" | "updatedAt">>): boolean => {
      if (!groupId || !userId) return false;
      const current = preference ?? {
        userId,
        ...DEFAULT_PREFERENCE,
        updatedAt: new Date().toISOString(),
      };
      const updated: CommunicationPreference = {
        ...current,
        ...updates,
        userId,
        updatedAt: new Date().toISOString(),
      };
      savePreference(groupId, userId, updated);
      setPreference(updated);
      return true;
    },
    [groupId, userId, preference]
  );

  const togglePreferredTime = useCallback(
    (time: CommPreferredTime): void => {
      const current = preference?.preferredTimes ?? [];
      const next = current.includes(time)
        ? current.filter((t) => t !== time)
        : [...current, time];
      updatePreferences({ preferredTimes: next });
    },
    [preference, updatePreferences]
  );

  const toggleChannel = useCallback(
    (channel: CommChannel): void => {
      const current = preference?.preferredChannels ?? [];
      const next = current.includes(channel)
        ? current.filter((c) => c !== channel)
        : [...current, channel];
      updatePreferences({ preferredChannels: next });
    },
    [preference, updatePreferences]
  );

  // 실제 값 (저장된 것 or 기본값)
  const effectivePreference: CommunicationPreference = preference ?? {
    userId,
    ...DEFAULT_PREFERENCE,
    updatedAt: "",
  };

  return {
    preference: effectivePreference,
    loading: false,
    hasData: preference !== null,
    updatePreferences,
    togglePreferredTime,
    toggleChannel,
  };
}
