"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Flag,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Calendar,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { useProjectMilestones } from "@/hooks/use-project-milestones";
import type { ProjectMilestone } from "@/types";

type ProjectMilestoneTimelineProps = {
  projectId: string;
  projectName: string;
  canEdit?: boolean;
};

/** YYYY-MM-DD 날짜를 한국어 형식으로 변환 */
function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${year}. ${month}. ${day}.`;
}

/** 완료 시각(ISO)을 한국어 날짜로 변환 */
function formatCompletedAt(iso: string): string {
  const date = new Date(iso);
  return `${date.getFullYear()}. ${String(date.getMonth() + 1).padStart(2, "0")}. ${String(date.getDate()).padStart(2, "0")}.`;
}

/** 목표일 기준으로 D-Day 텍스트 반환 */
function getDdayText(targetDate: string, completedAt: string | null): string {
  if (completedAt) return "완료";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);
  const diffMs = target.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "D-Day";
  if (diffDays > 0) return `D-${diffDays}`;
  return `D+${Math.abs(diffDays)}`;
}

/** D-Day 텍스트에 따른 배지 색상 */
function getDdayBadgeClass(
  targetDate: string,
  completedAt: string | null
): string {
  if (completedAt) return "bg-green-100 text-green-700";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays < 0) return "bg-red-100 text-red-600";
  if (diffDays <= 3) return "bg-orange-100 text-orange-700";
  if (diffDays <= 7) return "bg-yellow-100 text-yellow-700";
  return "bg-muted text-muted-foreground";
}

/** 마일스톤 노드 컴포넌트 */
function MilestoneNode({
  milestone,
  isLast,
  canEdit,
  onToggle,
  onDelete,
}: {
  milestone: ProjectMilestone;
  isLast: boolean;
  canEdit: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string, title: string) => void;
}) {
  const isDone = milestone.completedAt !== null;
  const ddayText = getDdayText(milestone.targetDate, milestone.completedAt);
  const ddayBadgeClass = getDdayBadgeClass(
    milestone.targetDate,
    milestone.completedAt
  );

  return (
    <div className="relative flex gap-3">
      {/* 세로 선 + 노드 */}
      <div className="flex flex-col items-center">
        {/* 원형 노드 */}
        <button
          type="button"
          className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${
            isDone
              ? "text-green-500 bg-green-50"
              : "text-muted-foreground hover:text-foreground bg-background border-2 border-muted-foreground/30 hover:border-muted-foreground/60"
          }`}
          onClick={() => onToggle(milestone.id)}
          title={isDone ? "완료 취소" : "완료로 표시"}
        >
          {isDone ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <Circle className="h-3.5 w-3.5" />
          )}
        </button>

        {/* 아래쪽 세로 선 (마지막 항목 제외) */}
        {!isLast && (
          <div
            className={`w-px flex-1 mt-1 min-h-[2rem] ${
              isDone ? "bg-green-300" : "bg-muted"
            }`}
          />
        )}
      </div>

      {/* 콘텐츠 */}
      <div className={`flex-1 pb-4 group/item min-w-0 ${isLast ? "" : ""}`}>
        <div className="flex items-start gap-2 min-w-0">
          {/* 제목 + 정보 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={`text-xs font-medium truncate ${
                  isDone ? "line-through text-muted-foreground" : ""
                }`}
              >
                {milestone.title}
              </span>
              <Badge
                className={`text-[10px] px-1.5 py-0 shrink-0 ${ddayBadgeClass}`}
                variant="secondary"
              >
                {ddayText}
              </Badge>
            </div>

            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <div className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>목표: {formatDate(milestone.targetDate)}</span>
              </div>
              {isDone && milestone.completedAt && (
                <span className="text-[11px] text-green-600">
                  완료: {formatCompletedAt(milestone.completedAt)}
                </span>
              )}
            </div>

            {milestone.description && (
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                {milestone.description}
              </p>
            )}
          </div>

          {/* 삭제 버튼 (호버 시 표시) */}
          {canEdit && (
            <button
              type="button"
              onClick={() => onDelete(milestone.id, milestone.title)}
              className="opacity-0 group-hover/item:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0 mt-0.5"
              aria-label={`${milestone.title} 삭제`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function ProjectMilestoneTimeline({
  projectId,
  projectName,
  canEdit = false,
}: ProjectMilestoneTimelineProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTargetDate, setNewTargetDate] = useState(() => {
    // 기본값: 오늘로부터 7일 후
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  });

  const {
    milestones,
    addMilestone,
    deleteMilestone,
    toggleComplete,
    completionRate,
    nextMilestone,
  } = useProjectMilestones(projectId);

  const handleAdd = () => {
    const trimmed = newTitle.trim();
    if (!trimmed) {
      toast.error("마일스톤 제목을 입력해주세요");
      return;
    }
    if (!newTargetDate) {
      toast.error("목표일을 선택해주세요");
      return;
    }
    addMilestone(trimmed, newTargetDate);
    setNewTitle("");
    toast.success("마일스톤을 추가했습니다");
    setAdding(false);
  };

  const handleToggle = (id: string) => {
    toggleComplete(id);
  };

  const handleDelete = (id: string, title: string) => {
    deleteMilestone(id);
    toast.success(`"${title}" 마일스톤을 삭제했습니다`);
  };

  return (
    <div className="space-y-2">
      {/* 헤더 */}
      <button
        type="button"
        className="w-full flex items-center justify-between group"
        onClick={() => setCollapsed((v) => !v)}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <Flag className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs font-medium truncate">마일스톤</span>
          <Badge
            className={`text-[10px] px-1.5 py-0 shrink-0 ${
              completionRate === 100
                ? "bg-green-100 text-green-700"
                : "bg-muted text-muted-foreground"
            }`}
            variant="secondary"
          >
            {completionRate}%
          </Badge>
          {nextMilestone && (
            <Badge
              className="text-[10px] px-1.5 py-0 shrink-0 bg-blue-100 text-blue-700"
              variant="secondary"
            >
              다음: {nextMilestone.title}
            </Badge>
          )}
        </div>
        <span className="text-muted-foreground shrink-0">
          {collapsed ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronUp className="h-3.5 w-3.5" />
          )}
        </span>
      </button>

      {/* 본문 */}
      {!collapsed && (
        <div className="pl-1 space-y-1">
          {/* 전체 진행률 프로그레스 바 */}
          <div className="space-y-1 mb-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground truncate max-w-[60%]">
                {projectName}
              </span>
              <span className="text-[11px] text-muted-foreground shrink-0">
                {milestones.filter((m) => m.completedAt !== null).length} /{" "}
                {milestones.length}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  completionRate === 100 ? "bg-green-500" : "bg-primary"
                }`}
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>

          {/* 타임라인 */}
          {milestones.length === 0 ? (
            <p className="text-[11px] text-muted-foreground pl-2">
              마일스톤이 없습니다
            </p>
          ) : (
            <div className="space-y-0">
              {milestones.map((milestone, index) => (
                <MilestoneNode
                  key={milestone.id}
                  milestone={milestone}
                  isLast={index === milestones.length - 1}
                  canEdit={canEdit}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}

          {/* 마일스톤 추가 폼 */}
          {canEdit && (
            <div className="mt-2 ml-9">
              {adding ? (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <Input
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="마일스톤 제목"
                      className="h-7 text-xs flex-1"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAdd();
                        if (e.key === "Escape") {
                          setAdding(false);
                          setNewTitle("");
                        }
                      }}
                      autoFocus
                    />
                    <Input
                      type="date"
                      value={newTargetDate}
                      onChange={(e) => setNewTargetDate(e.target.value)}
                      className="h-7 text-xs w-36 shrink-0"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      className="h-7 text-xs px-2"
                      onClick={handleAdd}
                    >
                      추가
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs px-2"
                      onClick={() => {
                        setAdding(false);
                        setNewTitle("");
                      }}
                    >
                      취소
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                  onClick={() => setAdding(true)}
                >
                  <Plus className="h-3 w-3" />
                  마일스톤 추가
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
