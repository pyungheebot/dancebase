"use client";

import type { MarketingCampaignTask } from "@/types";
import {
  STATUS_LABELS,
  STATUS_COLUMN_CLASS,
  STATUS_HEADER_CLASS,
  ALL_STATUSES,
} from "./types";
import { TaskCard } from "./task-card";

type KanbanBoardProps = {
  tasks: MarketingCampaignTask[];
  onEdit: (task: MarketingCampaignTask) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (
    taskId: string,
    status: MarketingCampaignTask["status"]
  ) => void;
};

export function KanbanBoard({
  tasks,
  onEdit,
  onDelete,
  onStatusChange,
}: KanbanBoardProps) {
  const tasksByStatus = (status: MarketingCampaignTask["status"]) =>
    tasks.filter((t) => t.status === status);

  return (
    <div
      className="grid grid-cols-3 gap-2"
      role="list"
      aria-label="마케팅 태스크 칸반 보드"
    >
      {ALL_STATUSES.map((status) => {
        const columnTasks = tasksByStatus(status);
        const columnId = `kanban-col-${status}`;
        return (
          <div
            key={status}
            className={`rounded-lg border p-2 min-h-[120px] ${STATUS_COLUMN_CLASS[status]}`}
            role="listitem"
            aria-labelledby={columnId}
          >
            {/* 컬럼 헤더 */}
            <div
              className="flex items-center justify-between mb-2"
              role="group"
              aria-label={`${STATUS_LABELS[status]} 컬럼`}
            >
              <span
                id={columnId}
                className={`text-[11px] font-semibold ${STATUS_HEADER_CLASS[status]}`}
              >
                {STATUS_LABELS[status]}
              </span>
              <span
                className="text-[10px] text-gray-400 bg-background rounded-full px-1.5 py-0.5 border"
                aria-label={`${columnTasks.length}개`}
              >
                {columnTasks.length}
              </span>
            </div>

            {/* 태스크 목록 */}
            <div
              className="space-y-1.5"
              role="list"
              aria-label={`${STATUS_LABELS[status]} 태스크 목록`}
            >
              {columnTasks.length === 0 && (
                <p
                  className="text-[10px] text-gray-300 text-center pt-4"
                  aria-live="polite"
                >
                  없음
                </p>
              )}
              {columnTasks.map((task) => (
                <div key={task.id} role="listitem">
                  <TaskCard
                    task={task}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onStatusChange={onStatusChange}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
