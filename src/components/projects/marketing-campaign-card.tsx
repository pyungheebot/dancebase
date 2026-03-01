"use client";

import { useState } from "react";
import { Megaphone, Plus, Settings, Users, Wallet } from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import {
  useMarketingCampaign,
  type AddTaskParams,
} from "@/hooks/use-marketing-campaign";
import type { MarketingCampaignTask } from "@/types";

import { STATUS_LABELS } from "./marketing-campaign/types";
import { TaskDialog } from "./marketing-campaign/task-dialog";
import { CampaignInfoDialog } from "./marketing-campaign/campaign-info-dialog";
import { DeleteConfirmDialog } from "./marketing-campaign/delete-confirm-dialog";
import { KanbanBoard } from "./marketing-campaign/kanban-board";
import { ChannelBreakdown } from "./marketing-campaign/channel-breakdown";
import { UpcomingDeadlines } from "./marketing-campaign/upcoming-deadlines";

// ============================================================
// 타입
// ============================================================

type MarketingCampaignCardProps = {
  projectId: string;
};

// ============================================================
// 메인 컴포넌트
// ============================================================

export function MarketingCampaignCard({ projectId }: MarketingCampaignCardProps) {
  const {
    campaign,
    loading,
    addTask,
    updateTask,
    deleteTask,
    setCampaignInfo,
    totalTasks,
    completedTasks,
    progressRate,
    channelBreakdown,
    upcomingDeadlines,
  } = useMarketingCampaign(projectId);

  // 다이얼로그 상태
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<MarketingCampaignTask | null>(null);
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // ——— 핸들러 ———

  const handleAddTask = (params: AddTaskParams) => {
    addTask(params);
    toast.success(TOAST.CAMPAIGN.TASK_ADDED);
  };

  const handleUpdateTask = (params: AddTaskParams) => {
    if (!editingTask) return;
    updateTask(editingTask.id, params);
    toast.success(TOAST.CAMPAIGN.TASK_UPDATED);
    setEditingTask(null);
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTask(taskId);
    toast.success(TOAST.CAMPAIGN.TASK_DELETED);
    setDeleteConfirmId(null);
  };

  const handleStatusChange = (
    taskId: string,
    status: MarketingCampaignTask["status"]
  ) => {
    updateTask(taskId, { status });
    toast.success(`상태가 "${STATUS_LABELS[status]}"로 변경되었습니다.`);
  };

  const handleSetCampaignInfo = (
    name: string,
    audience: string | null,
    budget: number | null
  ) => {
    setCampaignInfo({ campaignName: name, targetAudience: audience, budget });
    toast.success(TOAST.CAMPAIGN.INFO_SAVED);
  };

  // ——— 로딩 상태 ———
  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-xs text-gray-400">
          불러오는 중...
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Megaphone className="h-4 w-4 text-pink-500" aria-hidden="true" />
              <CardTitle className="text-sm">공연 마케팅 캠페인</CardTitle>
            </div>
            <div className="flex items-center gap-1" role="group" aria-label="캠페인 액션">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs px-2"
                onClick={() => setInfoDialogOpen(true)}
                aria-expanded={infoDialogOpen}
                aria-controls="campaign-info-dialog"
              >
                <Settings className="h-3 w-3 mr-1" aria-hidden="true" />
                설정
              </Button>
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={() => setTaskDialogOpen(true)}
                aria-expanded={taskDialogOpen}
                aria-controls="task-add-dialog"
              >
                <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
                추가
              </Button>
            </div>
          </div>

          {/* 캠페인 정보 헤더 */}
          <div className="mt-2 space-y-1">
            {campaign.campaignName ? (
              <p className="text-sm font-medium text-gray-800">
                {campaign.campaignName}
              </p>
            ) : (
              <p className="text-xs text-gray-400 italic" aria-live="polite">
                캠페인 이름을 설정해주세요
              </p>
            )}
            <dl className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500">
              {campaign.targetAudience && (
                <div className="flex items-center gap-1">
                  <dt className="sr-only">타겟 관객</dt>
                  <dd className="flex items-center gap-1">
                    <Users className="h-3 w-3" aria-hidden="true" />
                    {campaign.targetAudience}
                  </dd>
                </div>
              )}
              {campaign.budget != null && (
                <div className="flex items-center gap-1">
                  <dt className="sr-only">예산</dt>
                  <dd className="flex items-center gap-1">
                    <Wallet className="h-3 w-3" aria-hidden="true" />
                    {campaign.budget.toLocaleString()}원
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* 진행률 바 */}
          {totalTasks > 0 && (
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-[10px] text-gray-500">
                <span id="progress-label">
                  전체 진행률 ({completedTasks}/{totalTasks} 완료)
                </span>
                <span className="font-medium text-gray-700" aria-hidden="true">
                  {progressRate}%
                </span>
              </div>
              <div
                className="h-1.5 bg-gray-100 rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={progressRate}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-labelledby="progress-label"
              >
                <div
                  className="h-full bg-gradient-to-r from-pink-400 to-rose-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressRate}%` }}
                />
              </div>
            </div>
          )}

          {/* 다가오는 마감 알림 */}
          <UpcomingDeadlines deadlines={upcomingDeadlines} />
        </CardHeader>

        <CardContent className="pt-0 space-y-4">
          {/* 빈 상태 */}
          {totalTasks === 0 && (
            <div
              className="text-center py-8 text-gray-400"
              role="status"
              aria-live="polite"
            >
              <Megaphone
                className="h-8 w-8 mx-auto mb-2 opacity-30"
                aria-hidden="true"
                role="img"
                aria-label="마케팅 캠페인 아이콘"
              />
              <p className="text-xs">아직 마케팅 태스크가 없습니다.</p>
              <p className="text-[10px] mt-0.5">
                SNS 홍보, 포스터 제작 등 캠페인 업무를 추가해보세요.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-3 h-7 text-xs"
                onClick={() => setTaskDialogOpen(true)}
              >
                <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
                첫 태스크 추가
              </Button>
            </div>
          )}

          {/* 칸반 보드 */}
          {totalTasks > 0 && (
            <KanbanBoard
              tasks={campaign.tasks}
              onEdit={(t) => setEditingTask(t)}
              onDelete={(id) => setDeleteConfirmId(id)}
              onStatusChange={handleStatusChange}
            />
          )}

          {/* 채널별 분포 차트 */}
          <ChannelBreakdown breakdown={channelBreakdown} />
        </CardContent>
      </Card>

      {/* 태스크 추가 다이얼로그 */}
      <TaskDialog
        open={taskDialogOpen}
        mode="add"
        onClose={() => setTaskDialogOpen(false)}
        onSubmit={handleAddTask}
      />

      {/* 태스크 수정 다이얼로그 */}
      {editingTask && (
        <TaskDialog
          open={!!editingTask}
          mode="edit"
          initial={editingTask}
          onClose={() => setEditingTask(null)}
          onSubmit={handleUpdateTask}
        />
      )}

      {/* 캠페인 정보 설정 다이얼로그 */}
      <CampaignInfoDialog
        open={infoDialogOpen}
        campaignName={campaign.campaignName}
        targetAudience={campaign.targetAudience}
        budget={campaign.budget}
        onClose={() => setInfoDialogOpen(false)}
        onSubmit={handleSetCampaignInfo}
      />

      {/* 삭제 확인 다이얼로그 */}
      <DeleteConfirmDialog
        open={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => deleteConfirmId && handleDeleteTask(deleteConfirmId)}
      />
    </>
  );
}
