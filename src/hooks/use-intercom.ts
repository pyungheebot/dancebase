"use client";

import { useCallback, useMemo } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { swrKeys } from "@/lib/swr/keys";
import type {
  ShowIntercomData,
  ShowIntercomChannel,
  ShowIntercomPerson,
  ShowIntercomZone,
} from "@/types";

// ============================================
// localStorage 유틸
// ============================================

function getStorageKey(projectId: string): string {
  return `dancebase:show-intercom:${projectId}`;
}

function loadFromStorage(projectId: string): ShowIntercomData {
  const defaultData: ShowIntercomData = {
    projectId,
    channels: [],
    updatedAt: new Date().toISOString(),
  };
  if (typeof window === "undefined") return defaultData;
  try {
    const raw = localStorage.getItem(getStorageKey(projectId));
    if (!raw) return defaultData;
    return JSON.parse(raw) as ShowIntercomData;
  } catch {
    return defaultData;
  }
}

function saveToStorage(data: ShowIntercomData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(getStorageKey(data.projectId), JSON.stringify(data));
}

// ============================================
// 입력 타입
// ============================================

export type IntercomChannelInput = {
  name: string;
  frequency: string;
  zone: ShowIntercomZone;
  isEmergency: boolean;
};

export type IntercomPersonInput = {
  name: string;
  callSign: string;
};

// ============================================
// 훅
// ============================================

export function useIntercom(projectId: string) {
  const { data, mutate } = useSWR(
    swrKeys.showIntercom(projectId),
    () => loadFromStorage(projectId),
    { revalidateOnFocus: false }
  );

  const persist = useCallback(
    (next: ShowIntercomData) => {
      saveToStorage(next);
      mutate(next, false);
    },
    [mutate]
  );

  const current: ShowIntercomData = useMemo(() => data ?? {
    projectId,
    channels: [],
    updatedAt: new Date().toISOString(),
  }, [data, projectId]);

  // 채널 추가
  const addChannel = useCallback(
    (input: IntercomChannelInput): boolean => {
      const trimName = input.name.trim();
      if (!trimName) {
        toast.error("채널명을 입력해주세요");
        return false;
      }
      if (!input.frequency.trim()) {
        toast.error("주파수/채널 번호를 입력해주세요");
        return false;
      }
      const now = new Date().toISOString();
      const newChannel: ShowIntercomChannel = {
        id: crypto.randomUUID(),
        name: trimName,
        frequency: input.frequency.trim(),
        zone: input.zone,
        isEmergency: input.isEmergency,
        persons: [],
        createdAt: now,
      };
      const next: ShowIntercomData = {
        ...current,
        channels: [...current.channels, newChannel],
        updatedAt: now,
      };
      persist(next);
      toast.success("채널이 추가되었습니다");
      return true;
    },
    [current, persist]
  );

  // 채널 수정
  const updateChannel = useCallback(
    (id: string, input: IntercomChannelInput): boolean => {
      const trimName = input.name.trim();
      if (!trimName) {
        toast.error("채널명을 입력해주세요");
        return false;
      }
      if (!input.frequency.trim()) {
        toast.error("주파수/채널 번호를 입력해주세요");
        return false;
      }
      const idx = current.channels.findIndex((c) => c.id === id);
      if (idx === -1) {
        toast.error("채널을 찾을 수 없습니다");
        return false;
      }
      const now = new Date().toISOString();
      const updated = current.channels.map((c) =>
        c.id === id
          ? {
              ...c,
              name: trimName,
              frequency: input.frequency.trim(),
              zone: input.zone,
              isEmergency: input.isEmergency,
              updatedAt: now,
            }
          : c
      );
      const next: ShowIntercomData = {
        ...current,
        channels: updated,
        updatedAt: now,
      };
      persist(next);
      toast.success("채널이 수정되었습니다");
      return true;
    },
    [current, persist]
  );

  // 채널 삭제
  const deleteChannel = useCallback(
    (id: string): void => {
      const next: ShowIntercomData = {
        ...current,
        channels: current.channels.filter((c) => c.id !== id),
        updatedAt: new Date().toISOString(),
      };
      persist(next);
      toast.success("채널이 삭제되었습니다");
    },
    [current, persist]
  );

  // 인원 추가
  const addPerson = useCallback(
    (channelId: string, input: IntercomPersonInput): boolean => {
      const trimName = input.name.trim();
      if (!trimName) {
        toast.error("이름을 입력해주세요");
        return false;
      }
      if (!input.callSign.trim()) {
        toast.error("호출부호를 입력해주세요");
        return false;
      }
      const now = new Date().toISOString();
      const newPerson: ShowIntercomPerson = {
        id: crypto.randomUUID(),
        name: trimName,
        callSign: input.callSign.trim(),
      };
      const updated = current.channels.map((c) =>
        c.id === channelId
          ? { ...c, persons: [...c.persons, newPerson], updatedAt: now }
          : c
      );
      const next: ShowIntercomData = {
        ...current,
        channels: updated,
        updatedAt: now,
      };
      persist(next);
      toast.success("인원이 추가되었습니다");
      return true;
    },
    [current, persist]
  );

  // 인원 삭제
  const deletePerson = useCallback(
    (channelId: string, personId: string): void => {
      const now = new Date().toISOString();
      const updated = current.channels.map((c) =>
        c.id === channelId
          ? {
              ...c,
              persons: c.persons.filter((p) => p.id !== personId),
              updatedAt: now,
            }
          : c
      );
      const next: ShowIntercomData = {
        ...current,
        channels: updated,
        updatedAt: now,
      };
      persist(next);
      toast.success("인원이 삭제되었습니다");
    },
    [current, persist]
  );

  // 통계
  const totalPersons = current.channels.reduce(
    (sum, c) => sum + c.persons.length,
    0
  );
  const totalChannels = current.channels.length;

  return {
    channels: current.channels,
    totalPersons,
    totalChannels,
    loading: false,
    addChannel,
    updateChannel,
    deleteChannel,
    addPerson,
    deletePerson,
  };
}
