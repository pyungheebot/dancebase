"use client";

import { memo } from "react";
import { Pencil, Trash2, User, CalendarClock, Link } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MarketingCampaignTask } from "@/types";
import {
  CHANNEL_LABELS,
  CHANNEL_BADGE_CLASS,
  STATUS_LABELS,
  ALL_STATUSES,
} from "./types";
import { ChannelIcon } from "./channel-icon";
import { StatusIcon } from "./status-icon";

export type TaskCardProps = {
  task: MarketingCampaignTask;
  onEdit: (task: MarketingCampaignTask) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (
    taskId: string,
    status: MarketingCampaignTask["status"]
  ) => void;
};

export const TaskCard = memo(function TaskCard({
  task,
  onEdit,
  onDelete,
  onStatusChange,
}: TaskCardProps) {
  const isOverdue =
    task.dueDate &&
    task.status !== "done" &&
    new Date(task.dueDate) < new Date(new Date().toDateString());

  return (
    <article
      className="bg-card rounded-md border border-gray-100 p-2.5 shadow-sm space-y-1.5"
      aria-label={`태스크: ${task.title}`}
    >
      {/* 채널 배지 + 상태 아이콘 */}
      <div className="flex items-center justify-between gap-1">
        <Badge
          variant="outline"
          className={`text-[10px] px-1.5 py-0 gap-0.5 ${CHANNEL_BADGE_CLASS[task.channel]}`}
        >
          <ChannelIcon channel={task.channel} />
          <span className="ml-0.5">{CHANNEL_LABELS[task.channel]}</span>
        </Badge>
        <div className="flex items-center gap-1" role="group" aria-label="태스크 액션">
          <Select
            value={task.status}
            onValueChange={(val) =>
              onStatusChange(task.id, val as MarketingCampaignTask["status"])
            }
          >
            <SelectTrigger
              className="h-5 w-auto text-[10px] border-0 shadow-none p-0 gap-0.5 focus:ring-0"
              aria-label={`상태: ${STATUS_LABELS[task.status]}`}
            >
              <StatusIcon status={task.status} />
            </SelectTrigger>
            <SelectContent align="end">
              {ALL_STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="text-xs">
                  {STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            onClick={() => onEdit(task)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={`${task.title} 수정`}
            onKeyDown={(e) => e.key === "Enter" && onEdit(task)}
          >
            <Pencil className="h-3 w-3" aria-hidden="true" />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="text-gray-400 hover:text-red-500 transition-colors"
            aria-label={`${task.title} 삭제`}
            onKeyDown={(e) => e.key === "Enter" && onDelete(task.id)}
          >
            <Trash2 className="h-3 w-3" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* 태스크 제목 */}
      <p
        className={`text-xs font-medium leading-tight ${
          task.status === "done"
            ? "line-through text-gray-400"
            : "text-gray-800"
        }`}
        aria-label={task.status === "done" ? `완료됨: ${task.title}` : task.title}
      >
        {task.title}
      </p>

      {/* 메타 정보 */}
      <dl className="flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-gray-400">
        {task.assignee && (
          <div className="flex items-center gap-0.5">
            <dt className="sr-only">담당자</dt>
            <dd className="flex items-center gap-0.5">
              <User className="h-3 w-3" aria-hidden="true" />
              {task.assignee}
            </dd>
          </div>
        )}
        {task.dueDate && (
          <div className="flex items-center gap-0.5">
            <dt className="sr-only">마감일</dt>
            <dd
              className={`flex items-center gap-0.5 ${isOverdue ? "text-red-500 font-medium" : ""}`}
            >
              <CalendarClock className="h-3 w-3" aria-hidden="true" />
              <time dateTime={task.dueDate}>{task.dueDate}</time>
              {isOverdue && (
                <span role="alert" className="sr-only">
                  기한 초과
                </span>
              )}
              {isOverdue && " (기한 초과)"}
            </dd>
          </div>
        )}
        {task.contentUrl && (
          <div className="flex items-center gap-0.5">
            <dt className="sr-only">콘텐츠 링크</dt>
            <dd>
              <a
                href={task.contentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-0.5 text-blue-400 hover:text-blue-600"
                onClick={(e) => e.stopPropagation()}
                aria-label="콘텐츠 링크 열기 (새 탭)"
              >
                <Link className="h-3 w-3" aria-hidden="true" />
                링크
              </a>
            </dd>
          </div>
        )}
      </dl>

      {/* 메모 */}
      {task.notes && (
        <p className="text-[10px] text-gray-400 leading-tight line-clamp-2">
          {task.notes}
        </p>
      )}
    </article>
  );
});
