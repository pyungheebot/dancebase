"use client";

import { useCallback, useMemo } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { swrKeys } from "@/lib/swr/keys";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type {
  VenueMgmtData,
  VenueMgmtVenue,
  VenueMgmtFacility,
  VenueMgmtContact,
  VenueMgmtStageSize,
  VenueMgmtRental,
  VenueMgmtAccess,
  VenueMgmtBookingStatus,
} from "@/types";

// ============================================
// 기본 시설 목록
// ============================================

const DEFAULT_FACILITIES: Omit<VenueMgmtFacility, "available">[] = [
  { id: "audio", name: "음향시스템" },
  { id: "lighting", name: "조명시스템" },
  { id: "dressing_room", name: "분장실" },
  { id: "waiting_room", name: "대기실" },
  { id: "parking", name: "주차장" },
  { id: "accessibility", name: "장애인시설" },
  { id: "wifi", name: "와이파이" },
  { id: "restroom", name: "화장실" },
];

export function createDefaultFacilities(): VenueMgmtFacility[] {
  return DEFAULT_FACILITIES.map((f) => ({ ...f, available: false }));
}

// ============================================
// localStorage 유틸
// ============================================

function getStorageKey(projectId: string): string {
  return `dancebase:venue-management:${projectId}`;
}

// ============================================
// 입력 타입
// ============================================

export type VenueMgmtVenueInput = {
  name: string;
  address: string;
  capacity: number | null;
  stageSize: VenueMgmtStageSize;
  facilities: VenueMgmtFacility[];
  contact: VenueMgmtContact;
  rental: VenueMgmtRental;
  stageMemo: string;
  access: VenueMgmtAccess;
};

// ============================================
// 훅
// ============================================

export function useVenueManagement(projectId: string) {
  const { data, mutate } = useSWR(
    swrKeys.venueManagement(projectId),
    () => loadFromStorage<VenueMgmtData>(getStorageKey(projectId), {} as VenueMgmtData),
    { revalidateOnFocus: false }
  );

  const persist = useCallback(
    (next: VenueMgmtData) => {
      saveToStorage(getStorageKey(projectId), next);
      mutate(next, false);
    },
    [mutate]
  );

  const current: VenueMgmtData = useMemo(() => data ?? {
    projectId,
    venues: [],
    updatedAt: new Date().toISOString(),
  }, [data, projectId]);

  // 공연장 추가
  const addVenue = useCallback(
    (input: VenueMgmtVenueInput): boolean => {
      const trimName = input.name.trim();
      if (!trimName) {
        toast.error("공연장 이름을 입력해주세요");
        return false;
      }
      const now = new Date().toISOString();
      const newVenue: VenueMgmtVenue = {
        id: crypto.randomUUID(),
        name: trimName,
        address: input.address.trim(),
        capacity: input.capacity,
        stageSize: input.stageSize,
        facilities: input.facilities,
        contact: input.contact,
        rental: input.rental,
        stageMemo: input.stageMemo.trim(),
        access: input.access,
        createdAt: now,
        updatedAt: now,
      };
      const next: VenueMgmtData = {
        ...current,
        venues: [...current.venues, newVenue],
        updatedAt: now,
      };
      persist(next);
      toast.success("공연장이 추가되었습니다");
      return true;
    },
    [current, persist]
  );

  // 공연장 수정
  const updateVenue = useCallback(
    (id: string, input: VenueMgmtVenueInput): boolean => {
      const trimName = input.name.trim();
      if (!trimName) {
        toast.error("공연장 이름을 입력해주세요");
        return false;
      }
      const idx = current.venues.findIndex((v) => v.id === id);
      if (idx === -1) {
        toast.error("공연장을 찾을 수 없습니다");
        return false;
      }
      const now = new Date().toISOString();
      const updated = current.venues.map((v) =>
        v.id === id
          ? {
              ...v,
              name: trimName,
              address: input.address.trim(),
              capacity: input.capacity,
              stageSize: input.stageSize,
              facilities: input.facilities,
              contact: input.contact,
              rental: input.rental,
              stageMemo: input.stageMemo.trim(),
              access: input.access,
              updatedAt: now,
            }
          : v
      );
      const next: VenueMgmtData = {
        ...current,
        venues: updated,
        updatedAt: now,
      };
      persist(next);
      toast.success("공연장 정보가 수정되었습니다");
      return true;
    },
    [current, persist]
  );

  // 공연장 삭제
  const deleteVenue = useCallback(
    (id: string): void => {
      const next: VenueMgmtData = {
        ...current,
        venues: current.venues.filter((v) => v.id !== id),
        updatedAt: new Date().toISOString(),
      };
      persist(next);
      toast.success("공연장이 삭제되었습니다");
    },
    [current, persist]
  );

  // 시설 토글 (개별 공연장 내)
  const toggleFacility = useCallback(
    (venueId: string, facilityId: string): void => {
      const updated = current.venues.map((v) => {
        if (v.id !== venueId) return v;
        return {
          ...v,
          facilities: v.facilities.map((f) =>
            f.id === facilityId ? { ...f, available: !f.available } : f
          ),
          updatedAt: new Date().toISOString(),
        };
      });
      const next: VenueMgmtData = {
        ...current,
        venues: updated,
        updatedAt: new Date().toISOString(),
      };
      persist(next);
    },
    [current, persist]
  );

  // 예약 상태 변경
  const updateBookingStatus = useCallback(
    (venueId: string, status: VenueMgmtBookingStatus): void => {
      const updated = current.venues.map((v) => {
        if (v.id !== venueId) return v;
        return {
          ...v,
          rental: { ...v.rental, bookingStatus: status },
          updatedAt: new Date().toISOString(),
        };
      });
      const next: VenueMgmtData = {
        ...current,
        venues: updated,
        updatedAt: new Date().toISOString(),
      };
      persist(next);
      toast.success("예약 상태가 변경되었습니다");
    },
    [current, persist]
  );

  return {
    venues: current.venues,
    loading: false,
    addVenue,
    updateVenue,
    deleteVenue,
    toggleFacility,
    updateBookingStatus,
  };
}
