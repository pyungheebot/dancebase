"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import { invalidateProjectTasks } from "@/lib/swr/invalidate";
import type { ProjectTask } from "@/types";
import { toast } from "sonner";

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
    fetcher
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
      toast.error("로그인이 필요합니다");
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
      toast.error("할 일 추가에 실패했습니다");
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
      toast.error("상태 변경에 실패했습니다");
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
      toast.error("삭제에 실패했습니다");
      return;
    }

    toast.success("할 일이 삭제되었습니다");
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
