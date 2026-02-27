"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type { WaiverStore, WaiverTemplate, WaiverSignature, WaiverType } from "@/types";

// ─── 로컬스토리지 키 ────────────────────────────────────────────
function storageKey(groupId: string): string {
  return `dancebase:waivers:${groupId}`;
}

// ─── 기본 스토어 ─────────────────────────────────────────────────
function defaultStore(): WaiverStore {
  return {
    templates: [],
    signatures: [],
    updatedAt: new Date().toISOString(),
  };
}

// ─── 만료 여부 판단 ───────────────────────────────────────────────
function isExpired(expiresAt?: string): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

// ─── 만료일 계산 ─────────────────────────────────────────────────
function calcExpiresAt(expiresInDays?: number): string | undefined {
  if (!expiresInDays || expiresInDays <= 0) return undefined;
  const d = new Date();
  d.setDate(d.getDate() + expiresInDays);
  return d.toISOString().slice(0, 10);
}

// ─── localStorage 읽기/쓰기 ───────────────────────────────────────
function loadStore(groupId: string): WaiverStore {
  try {
    const raw = localStorage.getItem(storageKey(groupId));
    if (!raw) return defaultStore();
    return JSON.parse(raw) as WaiverStore;
  } catch {
    return defaultStore();
  }
}

function saveStore(groupId: string, store: WaiverStore): void {
  try {
    localStorage.setItem(
      storageKey(groupId),
      JSON.stringify({ ...store, updatedAt: new Date().toISOString() })
    );
  } catch {
    // localStorage 쓰기 실패 무시
  }
}

// ─── 훅 ──────────────────────────────────────────────────────────
export function useWaiverManagement(groupId: string) {
  const { data, mutate } = useSWR(
    swrKeys.waiverManagement(groupId),
    () => loadStore(groupId),
    { fallbackData: defaultStore() }
  );

  const store = data ?? defaultStore();

  // ─── 동의서 템플릿 생성 ──────────────────────────────────────────
  function addTemplate(input: {
    title: string;
    type: WaiverType;
    content: string;
    required: boolean;
    expiresInDays?: number;
  }): boolean {
    try {
      const current = loadStore(groupId);
      const newTemplate: WaiverTemplate = {
        id: crypto.randomUUID(),
        title: input.title.trim(),
        type: input.type,
        content: input.content.trim().slice(0, 2000),
        required: input.required,
        expiresInDays: input.expiresInDays,
        createdAt: new Date().toISOString(),
      };
      const updated: WaiverStore = {
        ...current,
        templates: [...current.templates, newTemplate],
        updatedAt: new Date().toISOString(),
      };
      saveStore(groupId, updated);
      mutate(updated);
      return true;
    } catch {
      return false;
    }
  }

  // ─── 동의서 템플릿 삭제 ──────────────────────────────────────────
  function removeTemplate(waiverId: string): boolean {
    try {
      const current = loadStore(groupId);
      const updated: WaiverStore = {
        ...current,
        templates: current.templates.filter((t) => t.id !== waiverId),
        // 해당 동의서의 서명도 함께 제거
        signatures: current.signatures.filter((s) => s.waiverId !== waiverId),
        updatedAt: new Date().toISOString(),
      };
      saveStore(groupId, updated);
      mutate(updated);
      return true;
    } catch {
      return false;
    }
  }

  // ─── 서명 처리 ───────────────────────────────────────────────────
  function sign(input: {
    waiverId: string;
    memberId: string;
    memberName: string;
  }): boolean {
    try {
      const current = loadStore(groupId);
      const template = current.templates.find((t) => t.id === input.waiverId);
      if (!template) return false;

      // 이미 유효한 서명이 있으면 중복 방지
      const existing = current.signatures.find(
        (s) =>
          s.waiverId === input.waiverId &&
          s.memberId === input.memberId &&
          !isExpired(s.expiresAt)
      );
      if (existing) return false;

      const expiresAt = calcExpiresAt(template.expiresInDays);
      const newSig: WaiverSignature = {
        id: crypto.randomUUID(),
        waiverId: input.waiverId,
        memberId: input.memberId,
        memberName: input.memberName,
        signedAt: new Date().toISOString(),
        expiresAt,
      };

      const updated: WaiverStore = {
        ...current,
        signatures: [...current.signatures, newSig],
        updatedAt: new Date().toISOString(),
      };
      saveStore(groupId, updated);
      mutate(updated);
      return true;
    } catch {
      return false;
    }
  }

  // ─── 서명 취소 ───────────────────────────────────────────────────
  function unsign(signatureId: string): boolean {
    try {
      const current = loadStore(groupId);
      const updated: WaiverStore = {
        ...current,
        signatures: current.signatures.filter((s) => s.id !== signatureId),
        updatedAt: new Date().toISOString(),
      };
      saveStore(groupId, updated);
      mutate(updated);
      return true;
    } catch {
      return false;
    }
  }

  // ─── 특정 멤버의 특정 동의서 유효 서명 조회 ──────────────────────
  function getSignature(
    waiverId: string,
    memberId: string
  ): WaiverSignature | null {
    const sig = store.signatures.find(
      (s) =>
        s.waiverId === waiverId &&
        s.memberId === memberId &&
        !isExpired(s.expiresAt)
    );
    return sig ?? null;
  }

  // ─── 동의서별 서명 현황 ──────────────────────────────────────────
  function getSignaturesByWaiver(waiverId: string): WaiverSignature[] {
    return store.signatures.filter((s) => s.waiverId === waiverId);
  }

  // ─── 서명 완료 멤버 수 (유효 서명 기준) ─────────────────────────
  function getSignedCount(waiverId: string): number {
    return store.signatures.filter(
      (s) => s.waiverId === waiverId && !isExpired(s.expiresAt)
    ).length;
  }

  // ─── 통계 ────────────────────────────────────────────────────────
  const totalTemplates = store.templates.length;
  const requiredCount = store.templates.filter((t) => t.required).length;

  return {
    templates: store.templates,
    signatures: store.signatures,
    totalTemplates,
    requiredCount,
    addTemplate,
    removeTemplate,
    sign,
    unsign,
    getSignature,
    getSignaturesByWaiver,
    getSignedCount,
    isExpired,
    refetch: () => mutate(),
  };
}
