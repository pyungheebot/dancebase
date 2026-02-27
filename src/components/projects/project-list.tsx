"use client";

import { useState } from "react";
import Link from "next/link";
import { useProjects } from "@/hooks/use-projects";
import { PROJECT_STATUSES } from "@/types";
import type { ProjectStatus } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Users, ChevronRight } from "lucide-react";
import { ProjectForm } from "./project-form";

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

export function ProjectList({ groupId }: ProjectListProps) {
  const { projects, canManage, loading, refetch } = useProjects(groupId);
  const [statusFilter, setStatusFilter] = useState<string>("전체");

  const filtered =
    statusFilter === "전체"
      ? projects
      : projects.filter((p) => p.status === statusFilter);

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
          {filtered.map((project) => (
            <Link
              key={project.id}
              href={`/groups/${project.group_id}/projects/${project.id}`}
              className="flex items-center justify-between px-3 py-2.5 hover:bg-accent transition-colors"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium truncate">{project.name}</span>
                  <Badge className={`text-[10px] px-1.5 py-0 font-normal border-0 ${TYPE_COLORS[project.type] || TYPE_COLORS["기타"]}`}>
                    {project.type}
                  </Badge>
                  <Badge className={`text-[10px] px-1.5 py-0 font-normal border-0 ${STATUS_COLORS[project.status]}`}>
                    {project.status}
                  </Badge>
                  {project.is_shared && (
                    <Badge className="text-[10px] px-1.5 py-0 font-normal border-0 bg-indigo-100 text-indigo-700">
                      공유
                    </Badge>
                  )}
                </div>
                {project.description && (
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                    {project.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                {project.member_count}
                <ChevronRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
