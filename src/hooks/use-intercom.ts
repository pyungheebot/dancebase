"use client";

import { useCallback, useMemo } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { swrKeys } from "@/lib/swr/keys";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
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
    () => loadFromStorage<ShowIntercomData>(getStorageKey(projectId), {} as ShowIntercomData),
    { revalidateOnFocus: false }
  );

  const persist = useCallback(
    (next: ShowIntercomData) => {
      saveToStorage(getStorageKey(projectId), next);
      mutate(next, false);
    },
    [projectId, mutate]
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
        toast.error(TOAST.INTERCOM.NAME_REQUIRED);
        return false;
      }
      if (!input.frequency.trim()) {
        toast.error(TOAST.INTERCOM.FREQ_REQUIRED);
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
      toast.success(TOAST.INTERCOM.ADDED);
      return true;
    },
    [current, persist]
  );

  // 채널 수정
  const updateChannel = useCallback(
    (id: string, input: IntercomChannelInput): boolean => {
      const trimName = input.name.trim();
      if (!trimName) {
        toast.error(TOAST.INTERCOM.NAME_REQUIRED);
        return false;
      }
      if (!input.frequency.trim()) {
        toast.error(TOAST.INTERCOM.FREQ_REQUIRED);
        return false;
      }
      const idx = current.channels.findIndex((c) => c.id === id);
      if (idx === -1) {
        toast.error(TOAST.INTERCOM.NOT_FOUND);
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
      toast.success(TOAST.INTERCOM.UPDATED);
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
      toast.success(TOAST.INTERCOM.DELETED);
    },
    [current, persist]
  );

  // 인원 추가
  const addPerson = useCallback(
    (channelId: string, input: IntercomPersonInput): boolean => {
      const trimName = input.name.trim();
      if (!trimName) {
        toast.error(TOAST.NAME_REQUIRED);
        return false;
      }
      if (!input.callSign.trim()) {
        toast.error(TOAST.INFO.CALLSIGN_REQUIRED);
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
      toast.success(TOAST.STAFF_CALL.PARTICIPANT_ADDED);
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
      toast.success(TOAST.STAFF_CALL.PARTICIPANT_DELETED);
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
