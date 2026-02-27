"use client";

import { useState, useCallback } from "react";
import type { EmergencyContactEntry, EmergencyContactRelation } from "@/types";

function getStorageKey(groupId: string): string {
  return `dancebase:emergency-contact:${groupId}`;
}

function loadContacts(groupId: string): EmergencyContactEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(groupId));
    if (!raw) return [];
    return JSON.parse(raw) as EmergencyContactEntry[];
  } catch {
    return [];
  }
}

function saveContacts(groupId: string, contacts: EmergencyContactEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(groupId), JSON.stringify(contacts));
  } catch {
    // 저장 실패 시 무시
  }
}

export function useEmergencyContact(groupId: string, memberNames: string[] = []) {
  const [contacts, setContacts] = useState<EmergencyContactEntry[]>(() =>
    loadContacts(groupId)
  );

  const persist = useCallback(
    (next: EmergencyContactEntry[]) => {
      setContacts(next);
      saveContacts(groupId, next);
    },
    [groupId]
  );

  // 연락처 추가
  const addContact = useCallback(
    (
      memberName: string,
      contactName: string,
      relation: EmergencyContactRelation,
      phone: string,
      email?: string,
      notes?: string,
      bloodType?: string,
      allergies?: string,
      medicalNotes?: string
    ): boolean => {
      if (!memberName.trim() || !contactName.trim() || !phone.trim()) return false;
      const newEntry: EmergencyContactEntry = {
        id: crypto.randomUUID(),
        memberName: memberName.trim(),
        contactName: contactName.trim(),
        relation,
        phone: phone.trim(),
        email: email?.trim() || undefined,
        notes: notes?.trim() || undefined,
        bloodType: bloodType?.trim() || undefined,
        allergies: allergies?.trim() || undefined,
        medicalNotes: medicalNotes?.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      persist([...contacts, newEntry]);
      return true;
    },
    [contacts, persist]
  );

  // 연락처 수정
  const updateContact = useCallback(
    (id: string, patch: Partial<Omit<EmergencyContactEntry, "id" | "createdAt">>): boolean => {
      const target = contacts.find((c) => c.id === id);
      if (!target) return false;
      const updated = contacts.map((c) =>
        c.id === id ? { ...c, ...patch } : c
      );
      persist(updated);
      return true;
    },
    [contacts, persist]
  );

  // 연락처 삭제
  const deleteContact = useCallback(
    (id: string): void => {
      persist(contacts.filter((c) => c.id !== id));
    },
    [contacts, persist]
  );

  // 멤버별 연락처 조회
  const getByMember = useCallback(
    (memberName: string): EmergencyContactEntry[] => {
      return contacts.filter((c) => c.memberName === memberName);
    },
    [contacts]
  );

  // 통계
  const totalContacts = contacts.length;

  const membersWithContacts = Array.from(
    new Set(contacts.map((c) => c.memberName))
  ).filter((name) => memberNames.includes(name));

  const membersWithoutContacts = memberNames.filter(
    (name) => !contacts.some((c) => c.memberName === name)
  );

  return {
    contacts,
    totalContacts,
    membersWithContacts,
    membersWithoutContacts,
    addContact,
    updateContact,
    deleteContact,
    getByMember,
  };
}
