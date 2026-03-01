"use client";

import useSWR from "swr";
import { useCallback } from "react";
import { swrKeys } from "@/lib/swr/keys";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type {
  MarketingCampaignData,
  MarketingCampaignTask,
  MarketingChannel,
} from "@/types";

// ——————————————————————————————
// 파라미터 타입
// ——————————————————————————————

export type AddTaskParams = {
  title: string;
  channel: MarketingChannel;
  assignee: string | null;
  dueDate: string | null;
  status: "todo" | "in_progress" | "done";
  contentUrl: string | null;
  notes: string;
};

export type UpdateTaskParams = Partial<
  Omit<MarketingCampaignTask, "id" | "createdAt">
>;

export type CampaignInfoParams = {
  campaignName: string;
  targetAudience: string | null;
  budget: number | null;
};

// ——————————————————————————————
// 채널별 분포 타입
// ——————————————————————————————

export type ChannelBreakdown = {
  channel: MarketingChannel;
  total: number;
  done: number;
};

// ——————————————————————————————
// 훅
// ——————————————————————————————

const STORAGE_KEY = (projectId: string) => `marketing-campaign-${projectId}`;

export function useMarketingCampaign(projectId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.marketingCampaign(projectId),
    () => loadFromStorage<MarketingCampaignData>(STORAGE_KEY(projectId), {} as MarketingCampaignData),
    { revalidateOnFocus: false }
  );

  const campaign: MarketingCampaignData = data ?? {
    projectId,
    tasks: [],
    campaignName: "",
    targetAudience: null,
    budget: null,
    updatedAt: new Date().toISOString(),
  };

  // ——— 태스크 추가 ———
  const addTask = useCallback(
    (params: AddTaskParams) => {
      const current = loadFromStorage<MarketingCampaignData>(STORAGE_KEY(projectId), {} as MarketingCampaignData);
      const newTask: MarketingCampaignTask = {
        id: crypto.randomUUID(),
        title: params.title,
        channel: params.channel,
        assignee: params.assignee,
        dueDate: params.dueDate,
        status: params.status,
        contentUrl: params.contentUrl,
        notes: params.notes,
        createdAt: new Date().toISOString(),
      };
      const updated: MarketingCampaignData = {
        ...current,
        tasks: [newTask, ...current.tasks],
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(STORAGE_KEY(projectId), updated);
      mutate(updated, false);
    },
    [projectId, mutate]
  );

  // ——— 태스크 수정 ———
  const updateTask = useCallback(
    (taskId: string, params: UpdateTaskParams) => {
      const current = loadFromStorage<MarketingCampaignData>(STORAGE_KEY(projectId), {} as MarketingCampaignData);
      const updated: MarketingCampaignData = {
        ...current,
        tasks: current.tasks.map((task) =>
          task.id !== taskId ? task : { ...task, ...params }
        ),
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(STORAGE_KEY(projectId), updated);
      mutate(updated, false);
    },
    [projectId, mutate]
  );

  // ——— 태스크 삭제 ———
  const deleteTask = useCallback(
    (taskId: string) => {
      const current = loadFromStorage<MarketingCampaignData>(STORAGE_KEY(projectId), {} as MarketingCampaignData);
      const updated: MarketingCampaignData = {
        ...current,
        tasks: current.tasks.filter((task) => task.id !== taskId),
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(STORAGE_KEY(projectId), updated);
      mutate(updated, false);
    },
    [projectId, mutate]
  );

  // ——— 캠페인 정보 수정 ———
  const setCampaignInfo = useCallback(
    (params: CampaignInfoParams) => {
      const current = loadFromStorage<MarketingCampaignData>(STORAGE_KEY(projectId), {} as MarketingCampaignData);
      const updated: MarketingCampaignData = {
        ...current,
        campaignName: params.campaignName,
        targetAudience: params.targetAudience,
        budget: params.budget,
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(STORAGE_KEY(projectId), updated);
      mutate(updated, false);
    },
    [projectId, mutate]
  );

  // ——————————————————————————————
  // 통계 계산
  // ——————————————————————————————

  const tasks = campaign.tasks;

  // 전체 태스크 수
  const totalTasks = tasks.length;

  // 완료된 태스크 수
  const completedTasks = tasks.filter((t) => t.status === "done").length;

  // 진행률 (0~100)
  const progressRate =
    totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  // 채널별 분포
  const channelMap = new Map<MarketingChannel, { total: number; done: number }>();
  for (const task of tasks) {
    const existing = channelMap.get(task.channel) ?? { total: 0, done: 0 };
    channelMap.set(task.channel, {
      total: existing.total + 1,
      done: existing.done + (task.status === "done" ? 1 : 0),
    });
  }
  const channelBreakdown: ChannelBreakdown[] = Array.from(
    channelMap.entries()
  ).map(([channel, counts]) => ({ channel, ...counts }));

  // 다가오는 마감 (오늘 이후 7일 이내, done 제외)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sevenDaysLater = new Date(today);
  sevenDaysLater.setDate(today.getDate() + 7);

  const upcomingDeadlines = tasks
    .filter((task) => {
      if (!task.dueDate || task.status === "done") return false;
      const due = new Date(task.dueDate);
      return due >= today && due <= sevenDaysLater;
    })
    .sort((a, b) => {
      if (!a.dueDate || !b.dueDate) return 0;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

  return {
    campaign,
    loading: isLoading,
    refetch: () => mutate(),
    // CRUD
    addTask,
    updateTask,
    deleteTask,
    setCampaignInfo,
    // 통계
    totalTasks,
    completedTasks,
    progressRate,
    channelBreakdown,
    upcomingDeadlines,
  };
}
