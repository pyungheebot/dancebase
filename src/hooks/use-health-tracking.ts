"use client";

import { useState, useCallback } from "react";
import { saveToStorage } from "@/lib/local-storage";
import type { InjuryRecord, BodyPart, InjurySeverity, InjuryStatus } from "@/types";

// ============================================
// localStorage 키
// ============================================

function storageKey(groupId: string, userId: string): string {
  return `dancebase:health:${groupId}:${userId}`;
}

// ============================================
// 로컬 스토리지 유틸
// ============================================

function saveRecords(groupId: string, userId: string, records: InjuryRecord[]): void {
  saveToStorage(storageKey(groupId, userId), records);
}

// ============================================
// 훅
// ============================================

export function useHealthTracking(groupId: string, userId: string) {
  const [records, setRecords] = useState<InjuryRecord[]>([]);

  // 부상 추가
  const addInjury = useCallback(
    (input: {
      bodyPart: BodyPart;
      severity: InjurySeverity;
      description: string;
      occurredAt: string;
      note: string;
    }) => {
      const newRecord: InjuryRecord = {
        id: crypto.randomUUID(),
        bodyPart: input.bodyPart,
        severity: input.severity,
        status: "active",
        description: input.description,
        occurredAt: input.occurredAt,
        note: input.note,
        createdAt: new Date().toISOString(),
      };
      const updated = [newRecord, ...records];
      saveRecords(groupId, userId, updated);
      setRecords(updated);
      return newRecord;
    },
    [records, groupId, userId]
  );

  // 상태 변경
  const updateStatus = useCallback(
    (id: string, status: InjuryStatus) => {
      const updated = records.map((r) => {
        if (r.id !== id) return r;
        return {
          ...r,
          status,
          healedAt: status === "healed" ? new Date().toISOString() : r.healedAt,
        };
      });
      saveRecords(groupId, userId, updated);
      setRecords(updated);
    },
    [records, groupId, userId]
  );

  // 노트 수정
  const updateNote = useCallback(
    (id: string, note: string) => {
      const updated = records.map((r) =>
        r.id === id ? { ...r, note } : r
      );
      saveRecords(groupId, userId, updated);
      setRecords(updated);
    },
    [records, groupId, userId]
  );

  // 부상 삭제
  const deleteInjury = useCallback(
    (id: string) => {
      const updated = records.filter((r) => r.id !== id);
      saveRecords(groupId, userId, updated);
      setRecords(updated);
    },
    [records, groupId, userId]
  );

  // 신체 부위별 필터
  const filterByBodyPart = useCallback(
    (bodyPart: BodyPart): InjuryRecord[] => {
      return records.filter((r) => r.bodyPart === bodyPart);
    },
    [records]
  );

  // 상태별 필터
  const filterByStatus = useCallback(
    (status: InjuryStatus): InjuryRecord[] => {
      return records.filter((r) => r.status === status);
    },
    [records]
  );

  // 활성 부상 수
  const activeCount = records.filter((r) => r.status === "active").length;
  const recoveringCount = records.filter((r) => r.status === "recovering").length;
  const healedCount = records.filter((r) => r.status === "healed").length;

  // 활성 부상 목록
  const activeInjuries = records.filter((r) => r.status === "active");

  return {
    records,
    loading: false,
    activeCount,
    recoveringCount,
    healedCount,
    activeInjuries,
    addInjury,
    updateStatus,
    updateNote,
    deleteInjury,
    filterByBodyPart,
    filterByStatus,
  };
}
