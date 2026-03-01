"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import { frequentConfig } from "@/lib/swr/cache-config";
import { invalidateProjectTasks } from "@/lib/swr/invalidate";
import type { ProjectTask } from "@/types";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";

export function useProjectTasks(projectId: string) {
  const fetcher = async (): Promise<ProjectTask[]> => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("project_tasks")
      .select("*")
      .eq("project_id", projectId)
      .order("status", { ascending: true })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) throw error;
    return (data ?? []) as ProjectTask[];
  };

  const { data, isLoading, mutate } = useSWR(
    projectId ? swrKeys.projectTasks(projectId) : null,
    fetcher,
    frequentConfig,
  );

  const tasks = data ?? [];

  // 완료율 계산
  const totalCount = tasks.length;
  const doneCount = tasks.filter((t) => t.status === "done").length;
  const completionRate = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  // 상태별 분류
  const todoTasks = tasks.filter((t) => t.status === "todo");
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress");
  const doneTasks = tasks.filter((t) => t.status === "done");

  // 할 일 생성
  async function createTask(title: string): Promise<boolean> {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error(TOAST.LOGIN_REQUIRED);
      return false;
    }

    const maxSortOrder = tasks.length > 0 ? Math.max(...tasks.map((t) => t.sort_order)) + 1 : 0;

    const { error } = await supabase.from("project_tasks").insert({
      project_id: projectId,
      title: title.trim(),
      status: "todo",
      created_by: user.id,
      sort_order: maxSortOrder,
    });

    if (error) {
      toast.error(TOAST.ONBOARDING.TASK_DELETE_ERROR);
      return false;
    }

    invalidateProjectTasks(projectId);
    mutate();
    return true;
  }

  // 상태 변경
  async function updateTaskStatus(taskId: string, status: ProjectTask["status"]): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from("project_tasks")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", taskId);

    if (error) {
      toast.error(TOAST.STATUS_ERROR);
      return;
    }

    invalidateProjectTasks(projectId);
    mutate();
  }

  // todo ↔ done 토글
  async function toggleTaskDone(task: ProjectTask): Promise<void> {
    const newStatus: ProjectTask["status"] = task.status === "done" ? "todo" : "done";
    await updateTaskStatus(task.id, newStatus);
  }

  // 삭제
  async function deleteTask(taskId: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from("project_tasks")
      .delete()
      .eq("id", taskId);

    if (error) {
      toast.error(TOAST.DELETE_SIMPLE_ERROR);
      return;
    }

    toast.success(TOAST.ONBOARDING.TASK_DELETED);
    invalidateProjectTasks(projectId);
    mutate();
  }

  return {
    tasks,
    todoTasks,
    inProgressTasks,
    doneTasks,
    loading: isLoading,
    totalCount,
    doneCount,
    completionRate,
    refetch: () => mutate(),
    createTask,
    updateTaskStatus,
    toggleTaskDone,
    deleteTask,
  };
}
