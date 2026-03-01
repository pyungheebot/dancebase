"use client";

import useSWR from "swr";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { swrKeys } from "@/lib/swr/keys";
import type {
  EmergencyContactEntry,
  EmergencyContactBloodType,
  EmergencyContactRelation,
  EmergencyContactPerson,
} from "@/types";

// ============================================================
// localStorage 유틸
// ============================================================

function getStorageKey(groupId: string): string {
  return `dancebase:emergency-contact:${groupId}`;
}

function loadEntries(groupId: string): EmergencyContactEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(groupId));
    return raw ? (JSON.parse(raw) as EmergencyContactEntry[]) : [];
  } catch {
    return [];
  }
}

function saveEntries(groupId: string, entries: EmergencyContactEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(groupId), JSON.stringify(entries));
  } catch {
    // localStorage 쓰기 실패 무시
  }
}

// ============================================================
// 입력 타입
// ============================================================

export type AddEmergencyContactInput = {
  memberName: string;
  memberPhone?: string;
  contactName: string;
  relation: EmergencyContactRelation;
  phone: string;
  email?: string;
  notes?: string;
  bloodType: EmergencyContactBloodType;
  allergies?: string;
  medicalNotes?: string;
  insuranceInfo?: string;
  extraContacts?: Omit<EmergencyContactPerson, "id">[];
};

export type UpdateEmergencyContactInput = Partial<AddEmergencyContactInput>;

// ============================================================
// 훅
// ============================================================

export function useEmergencyContact(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    groupId ? swrKeys.emergencyContact(groupId) : null,
    async () => loadEntries(groupId)
  );

  const entries = useMemo(() => data ?? [], [data]);

  // ── 항목 추가 ──
  const addContact = useCallback(
    async (input: AddEmergencyContactInput): Promise<boolean> => {
      if (!input.memberName.trim()) {
        toast.error(TOAST.MEMBER_NAME_REQUIRED);
        return false;
      }
      if (!input.contactName.trim()) {
        toast.error(TOAST.EMERGENCY_CONTACT.NAME_REQUIRED);
        return false;
      }
      if (!input.phone.trim()) {
        toast.error(TOAST.EMERGENCY_CONTACT.PHONE_REQUIRED);
        return false;
      }

      const now = new Date().toISOString();
      const newEntry: EmergencyContactEntry = {
        id: crypto.randomUUID(),
        groupId,
        memberName: input.memberName.trim(),
        memberPhone: input.memberPhone?.trim() || undefined,
        contactName: input.contactName.trim(),
        relation: input.relation,
        phone: input.phone.trim(),
        email: input.email?.trim() || undefined,
        notes: input.notes?.trim() || undefined,
        bloodType: input.bloodType,
        allergies: input.allergies?.trim() || undefined,
        medicalNotes: input.medicalNotes?.trim() || undefined,
        insuranceInfo: input.insuranceInfo?.trim() || undefined,
        extraContacts: input.extraContacts?.map((c) => ({
          id: crypto.randomUUID(),
          name: c.name.trim(),
          relation: c.relation,
          phone: c.phone.trim(),
          note: c.note?.trim() || undefined,
        })),
        createdAt: now,
        updatedAt: now,
      };

      const updated = [...entries, newEntry];
      saveEntries(groupId, updated);
      await mutate(updated, false);
      toast.success(TOAST.EMERGENCY_CONTACT.ADDED);
      return true;
    },
    [groupId, entries, mutate]
  );

  // ── 항목 수정 ──
  const updateContact = useCallback(
    async (id: string, changes: UpdateEmergencyContactInput): Promise<boolean> => {
      const target = entries.find((e) => e.id === id);
      if (!target) {
        toast.error(TOAST.NOT_FOUND);
        return false;
      }

      const updatedExtraContacts =
        changes.extraContacts !== undefined
          ? changes.extraContacts.map((c) => ({
              id: crypto.randomUUID(),
              name: c.name.trim(),
              relation: c.relation,
              phone: c.phone.trim(),
              note: c.note?.trim() || undefined,
            }))
          : target.extraContacts;

      const updated = entries.map((e) =>
        e.id === id
          ? {
              ...e,
              memberName:
                changes.memberName !== undefined
                  ? changes.memberName.trim()
                  : e.memberName,
              memberPhone:
                changes.memberPhone !== undefined
                  ? changes.memberPhone.trim() || undefined
                  : e.memberPhone,
              contactName:
                changes.contactName !== undefined
                  ? changes.contactName.trim()
                  : e.contactName,
              relation:
                changes.relation !== undefined ? changes.relation : e.relation,
              phone:
                changes.phone !== undefined ? changes.phone.trim() : e.phone,
              email:
                changes.email !== undefined
                  ? changes.email.trim() || undefined
                  : e.email,
              notes:
                changes.notes !== undefined
                  ? changes.notes.trim() || undefined
                  : e.notes,
              bloodType:
                changes.bloodType !== undefined
                  ? changes.bloodType
                  : e.bloodType,
              allergies:
                changes.allergies !== undefined
                  ? changes.allergies.trim() || undefined
                  : e.allergies,
              medicalNotes:
                changes.medicalNotes !== undefined
                  ? changes.medicalNotes.trim() || undefined
                  : e.medicalNotes,
              insuranceInfo:
                changes.insuranceInfo !== undefined
                  ? changes.insuranceInfo.trim() || undefined
                  : e.insuranceInfo,
              extraContacts: updatedExtraContacts,
              updatedAt: new Date().toISOString(),
            }
          : e
      );

      saveEntries(groupId, updated);
      await mutate(updated, false);
      toast.success(TOAST.EMERGENCY_CONTACT.UPDATED);
      return true;
    },
    [groupId, entries, mutate]
  );

  // ── 항목 삭제 ──
  const deleteContact = useCallback(
    async (id: string): Promise<boolean> => {
      const filtered = entries.filter((e) => e.id !== id);
      saveEntries(groupId, filtered);
      await mutate(filtered, false);
      toast.success(TOAST.EMERGENCY_CONTACT.DELETED);
      return true;
    },
    [groupId, entries, mutate]
  );

  // ── 멤버별 조회 ──
  const getByMember = useCallback(
    (memberName: string): EmergencyContactEntry[] => {
      return entries.filter((e) => e.memberName === memberName);
    },
    [entries]
  );

  // ── 혈액형별 필터 ──
  const filterByBloodType = useCallback(
    (bloodType: EmergencyContactBloodType | "all"): EmergencyContactEntry[] => {
      if (bloodType === "all") return entries;
      return entries.filter((e) => e.bloodType === bloodType);
    },
    [entries]
  );

  // ── 알레르기/질환 보유자 필터 ──
  const filterByHasMedical = useCallback(
    (): EmergencyContactEntry[] => {
      return entries.filter((e) => e.allergies || e.medicalNotes);
    },
    [entries]
  );

  // ── 통계 ──
  const stats = {
    total: entries.length,
    withMedical: entries.filter((e) => e.allergies || e.medicalNotes).length,
    withInsurance: entries.filter((e) => e.insuranceInfo).length,
    totalExtraContacts: entries.reduce(
      (sum, e) => sum + (e.extraContacts?.length ?? 0),
      0
    ),
  };

  return {
    entries,
    loading: isLoading,
    refetch: () => mutate(),
    addContact,
    updateContact,
    deleteContact,
    getByMember,
    filterByBloodType,
    filterByHasMedical,
    stats,
  };
}
