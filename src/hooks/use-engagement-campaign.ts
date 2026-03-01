"use client";

import { useState, useCallback } from "react";
import type {
  EngagementCampaign,
  EngagementCampaignStatus,
  EngagementGoalType,
  EngagementCampaignMemo,
} from "@/types";
import { ENGAGEMENT_CAMPAIGN_MAX } from "@/types";
import { saveToStorage } from "@/lib/local-storage";

// ============================================
// localStorage 키
// ============================================

function getStorageKey(groupId: string): string {
  return `dancebase:engagement-campaigns:${groupId}`;
}

// ============================================
// 캠페인 상태 자동 계산 (만료 처리)
// ============================================

// ============================================
// 신규 캠페인 폼 타입
// ============================================

export type CreateCampaignInput = {
  targetMemberName: string;
  goalType: EngagementGoalType;
  goalValue: number;
  startDate: string;
  endDate: string;
  memo: string;
};

// ============================================
// 훅
// ============================================

export function useEngagementCampaign(groupId: string) {
  const [campaigns, setCampaigns] = useState<EngagementCampaign[]>([]);

  // ---- 초기 로드 ----

  // ---- 저장 헬퍼 ----
  const persist = useCallback(
    (next: EngagementCampaign[]) => {
      setCampaigns(next);
      saveToStorage(getStorageKey(groupId), next);
    },
    [groupId],
  );

  // ---- 캠페인 생성 ----
  const createCampaign = useCallback(
    (input: CreateCampaignInput): { ok: boolean; message?: string } => {
      if (campaigns.length >= ENGAGEMENT_CAMPAIGN_MAX) {
        return { ok: false, message: `최대 ${ENGAGEMENT_CAMPAIGN_MAX}개까지만 생성할 수 있습니다.` };
      }
      if (!input.targetMemberName.trim()) {
        return { ok: false, message: "대상 멤버 이름을 입력해주세요." };
      }
      if (!input.startDate || !input.endDate) {
        return { ok: false, message: "기간을 설정해주세요." };
      }
      if (input.startDate > input.endDate) {
        return { ok: false, message: "종료일은 시작일 이후여야 합니다." };
      }
      if (input.goalValue <= 0 || !Number.isFinite(input.goalValue)) {
        return { ok: false, message: "목표값은 1 이상의 숫자여야 합니다." };
      }

      const now = new Date().toISOString();
      const memos: EngagementCampaignMemo[] = input.memo.trim()
        ? [{ id: crypto.randomUUID(), content: input.memo.trim(), createdAt: now }]
        : [];

      const today = now.slice(0, 10);
      const status: EngagementCampaignStatus =
        input.endDate < today ? "expired" : "active";

      const newCampaign: EngagementCampaign = {
        id: crypto.randomUUID(),
        groupId,
        targetMemberName: input.targetMemberName.trim(),
        goalType: input.goalType,
        goalValue: Math.max(1, Math.floor(input.goalValue)),
        currentValue: 0,
        startDate: input.startDate,
        endDate: input.endDate,
        status,
        memos,
        createdAt: now,
      };

      persist([newCampaign, ...campaigns]);
      return { ok: true };
    },
    [campaigns, groupId, persist],
  );

  // ---- 캠페인 완료 처리 ----
  const completeCampaign = useCallback(
    (campaignId: string) => {
      persist(
        campaigns.map((c) =>
          c.id === campaignId ? { ...c, status: "completed" as EngagementCampaignStatus } : c,
        ),
      );
    },
    [campaigns, persist],
  );

  // ---- 진행값 업데이트 ----
  const updateProgress = useCallback(
    (campaignId: string, value: number) => {
      persist(
        campaigns.map((c) =>
          c.id === campaignId
            ? { ...c, currentValue: Math.max(0, Math.floor(value)) }
            : c,
        ),
      );
    },
    [campaigns, persist],
  );

  // ---- 메모 추가 ----
  const addMemo = useCallback(
    (campaignId: string, content: string): { ok: boolean; message?: string } => {
      if (!content.trim()) {
        return { ok: false, message: "메모 내용을 입력해주세요." };
      }
      const newMemo: EngagementCampaignMemo = {
        id: crypto.randomUUID(),
        content: content.trim(),
        createdAt: new Date().toISOString(),
      };
      persist(
        campaigns.map((c) =>
          c.id === campaignId ? { ...c, memos: [...c.memos, newMemo] } : c,
        ),
      );
      return { ok: true };
    },
    [campaigns, persist],
  );

  // ---- 캠페인 삭제 ----
  const deleteCampaign = useCallback(
    (campaignId: string) => {
      persist(campaigns.filter((c) => c.id !== campaignId));
    },
    [campaigns, persist],
  );

  // ---- 파생 데이터 ----
  const activeCount = campaigns.filter((c) => c.status === "active").length;

  return {
    campaigns,
    loading: false,
    activeCount,
    createCampaign,
    completeCampaign,
    updateProgress,
    addMemo,
    deleteCampaign,
  };
}
