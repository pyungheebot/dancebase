"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProjects } from "@/hooks/use-projects";
import { PROJECT_STATUSES } from "@/types";
import type { ProjectStatus } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Loader2, Users, ChevronRight, CalendarRange, MoreVertical, Settings, Trash2, Check } from "lucide-react";
import { ProjectForm } from "./project-form";
import { createClient } from "@/lib/supabase/client";
import { invalidateProject } from "@/lib/swr/invalidate";
import { toast } from "sonner";

const STATUS_COLORS: Record<ProjectStatus, string> = {
  "신규": "bg-blue-100 text-blue-700",
  "진행": "bg-green-100 text-green-700",
  "보류": "bg-yellow-100 text-yellow-700",
  "종료": "bg-gray-100 text-gray-500",
};

const TYPE_COLORS: Record<string, string> = {
  "공연": "bg-purple-100 text-purple-700",
  "모임": "bg-pink-100 text-pink-700",
  "연습": "bg-orange-100 text-orange-700",
  "이벤트": "bg-cyan-100 text-cyan-700",
  "기타": "bg-gray-100 text-gray-600",
};

interface ProjectListProps {
  groupId: string;
}

// 날짜 문자열을 "YYYY.MM.DD" 형식으로 변환
function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

// D-day 계산: 종료일 기준
function getDdayLabel(startDate: string | null, endDate: string | null): { label: string; color: string } | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (endDate) {
    const end = new Date(endDate + "T00:00:00");
    end.setHours(0, 0, 0, 0);

    const start = startDate ? new Date(startDate + "T00:00:00") : null;
    if (start) start.setHours(0, 0, 0, 0);

    const diffMs = end.getTime() - today.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    // 종료일이 지난 경우
    if (diffDays < 0) {
      return { label: "종료", color: "bg-gray-100 text-gray-500" };
    }

    // 시작일이 있고 오늘이 시작일과 종료일 사이인 경우
    if (start && today >= start && today <= end) {
      return { label: "진행 중", color: "bg-green-100 text-green-700" };
    }

    // 시작일이 없거나 아직 시작 전이면서 종료일이 남은 경우
    if (diffDays === 0) {
      return { label: "D-day", color: "bg-red-100 text-red-700" };
    }
    return { label: `D-${diffDays}`, color: "bg-blue-100 text-blue-700" };
  }

  if (startDate) {
    const start = new Date(startDate + "T00:00:00");
    start.setHours(0, 0, 0, 0);
    if (today >= start) {
      return { label: "진행 중", color: "bg-green-100 text-green-700" };
    }
    const diffMs = start.getTime() - today.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    return { label: `D-${diffDays}`, color: "bg-blue-100 text-blue-700" };
  }

  return null;
}

export function ProjectList({ groupId }: ProjectListProps) {
  const { projects, canManage, loading, refetch } = useProjects(groupId);
  const [statusFilter, setStatusFilter] = useState<string>("전체");
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const filtered =
    statusFilter === "전체"
      ? projects
      : projects.filter((p) => p.status === statusFilter);

  async function handleStatusChange(projectId: string, newStatus: ProjectStatus) {
    setUpdatingStatusId(projectId);
    const supabase = createClient();
    const { error } = await supabase
      .from("projects")
      .update({ status: newStatus })
      .eq("id", projectId);
    setUpdatingStatusId(null);
    if (error) {
      toast.error("상태 변경에 실패했습니다.");
      return;
    }
    toast.success(`상태가 "${newStatus}"(으)로 변경되었습니다.`);
    invalidateProject(projectId, groupId);
    refetch();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", deleteTarget.id);
    setIsDeleting(false);
    setDeleteTarget(null);
    if (error) {
      toast.error("프로젝트 삭제에 실패했습니다.");
      return;
    }
    toast.success("프로젝트가 삭제되었습니다.");
    invalidateProject(deleteTarget.id, groupId);
    refetch();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">프로젝트</h1>
        {canManage && (
          <ProjectForm groupId={groupId} onCreated={refetch} />
        )}
      </div>

      {/* 상태 필터 */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        <Button
          variant={statusFilter === "전체" ? "default" : "outline"}
          size="sm"
          className="h-7 text-xs"
          onClick={() => setStatusFilter("전체")}
        >
          전체
        </Button>
        {PROJECT_STATUSES.map((s) => (
          <Button
            key={s}
            variant={statusFilter === s ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setStatusFilter(s)}
          >
            {s}
          </Button>
        ))}
      </div>

      {/* 프로젝트 목록 */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">프로젝트가 없습니다</p>
        </div>
      ) : (
        <div className="rounded-lg border divide-y">
          {filtered.map((project) => {
            const ddayInfo = getDdayLabel(project.start_date, project.end_date);
            const hasDateInfo = project.start_date || project.end_date;
            const isUpdating = updatingStatusId === project.id;

            return (
              <div
                key={project.id}
                className="flex items-center justify-between px-3 py-2.5 hover:bg-accent transition-colors group"
              >
                <Link
                  href={`/groups/${project.group_id}/projects/${project.id}`}
                  className="min-w-0 flex-1"
                >
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-medium truncate">{project.name}</span>
                    <Badge className={`text-[10px] px-1.5 py-0 font-normal border-0 ${TYPE_COLORS[project.type] || TYPE_COLORS["기타"]}`}>
                      {project.type}
                    </Badge>
                    {/* 상태 배지: canManage면 드롭다운, 아니면 읽기 전용 */}
                    {canManage ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                          <Badge
                            className={`text-[10px] px-1.5 py-0 font-normal border-0 cursor-pointer hover:opacity-80 transition-opacity ${STATUS_COLORS[project.status]} ${isUpdating ? "opacity-50" : ""}`}
                          >
                            {isUpdating ? (
                              <Loader2 className="h-2.5 w-2.5 animate-spin" />
                            ) : (
                              project.status
                            )}
                          </Badge>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-28">
                          {PROJECT_STATUSES.map((s) => (
                            <DropdownMenuItem
                              key={s}
                              onClick={(e) => {
                                e.preventDefault();
                                if (s !== project.status) {
                                  handleStatusChange(project.id, s);
                                }
                              }}
                              className="text-xs gap-2"
                            >
                              <span className={`inline-block w-2 h-2 rounded-full ${STATUS_COLORS[s].split(" ")[0]}`} />
                              {s}
                              {s === project.status && (
                                <Check className="h-3 w-3 ml-auto text-muted-foreground" />
                              )}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <Badge className={`text-[10px] px-1.5 py-0 font-normal border-0 ${STATUS_COLORS[project.status]}`}>
                        {project.status}
                      </Badge>
                    )}
                    {project.is_shared && (
                      <Badge className="text-[10px] px-1.5 py-0 font-normal border-0 bg-indigo-100 text-indigo-700">
                        공유
                      </Badge>
                    )}
                    {ddayInfo && (
                      <Badge className={`text-[10px] px-1.5 py-0 font-normal border-0 ${ddayInfo.color}`}>
                        {ddayInfo.label}
                      </Badge>
                    )}
                  </div>
                  {/* 기간 표시 */}
                  {hasDateInfo && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <CalendarRange className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-[11px] text-muted-foreground">
                        {project.start_date && project.end_date
                          ? `${formatDate(project.start_date)} ~ ${formatDate(project.end_date)}`
                          : project.start_date
                          ? `${formatDate(project.start_date)} ~`
                          : `~ ${formatDate(project.end_date!)}`}
                      </span>
                    </div>
                  )}
                  {!hasDateInfo && project.description && (
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                      {project.description}
                    </p>
                  )}
                </Link>

                <div className="flex items-center gap-1 shrink-0 ml-2">
                  {/* 멤버 수 + 화살표 (Link로 이동) */}
                  <Link
                    href={`/groups/${project.group_id}/projects/${project.id}`}
                    className="flex items-center gap-1 text-xs text-muted-foreground"
                  >
                    <Users className="h-3 w-3" />
                    {project.member_count}
                  </Link>

                  {/* MoreVertical 메뉴 (canManage일 때만) */}
                  {canManage ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.preventDefault()}
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-28">
                        <DropdownMenuItem
                          className="text-xs gap-2"
                          onClick={() =>
                            router.push(
                              `/groups/${project.group_id}/projects/${project.id}/settings`
                            )
                          }
                        >
                          <Settings className="h-3.5 w-3.5" />
                          설정
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-xs gap-2 text-destructive focus:text-destructive"
                          onClick={() =>
                            setDeleteTarget({ id: project.id, name: project.name })
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          삭제
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 삭제 확인 다이얼로그 */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="프로젝트 삭제"
        description={`"${deleteTarget?.name}" 프로젝트를 삭제하시겠습니까? 삭제된 데이터는 복구할 수 없습니다.`}
        onConfirm={handleDelete}
        destructive
      />
    </div>
  );
}
