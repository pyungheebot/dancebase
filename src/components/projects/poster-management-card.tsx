"use client";

import { useState, useCallback, useId } from "react";
import { usePosterManagement } from "@/hooks/use-poster-management";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Image as ImageIcon, ChevronDown, ChevronRight, Plus } from "lucide-react";
import { PosterStats } from "./poster-stats";
import { AddProjectForm } from "./poster-add-project-form";
import { PosterProjectRow } from "./poster-project-row";
import type { AddVersionPayload } from "./poster-add-version-dialog";

// ============================================================
// 메인 카드 컴포넌트 (~300줄 컨테이너)
// ============================================================

interface PosterManagementCardProps {
  groupId: string;
  projectId: string;
  memberNames?: string[];
}

export function PosterManagementCard({
  groupId,
  projectId,
  memberNames = [],
}: PosterManagementCardProps) {
  const {
    projects,
    loading,
    addProject,
    deleteProject,
    addVersion,
    deleteVersion,
    vote,
    updateStatus,
    selectFinal,
    stats,
  } = usePosterManagement(groupId, projectId);

  const [isOpen, setIsOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // 접근성용 고유 ID
  const uid = useId();
  const headerId = `poster-card-header-${uid}`;
  const contentId = `poster-card-content-${uid}`;

  const handleAddVersion = useCallback(
    (posterId: string, partial: AddVersionPayload) =>
      addVersion(posterId, partial),
    [addVersion]
  );

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      {/* 카드 헤더 */}
      <CollapsibleTrigger asChild>
        <div
          id={headerId}
          className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 cursor-pointer transition-colors"
          role="button"
          aria-expanded={isOpen}
          aria-controls={contentId}
          aria-label={`공연 포스터 관리${isOpen ? " 접기" : " 펼치기"}`}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsOpen(!isOpen);
            }
          }}
        >
          <div className="flex items-center gap-2">
            <ImageIcon
              className="h-4 w-4 text-indigo-500"
              aria-hidden="true"
            />
            <span className="text-sm font-medium text-gray-800">
              공연 포스터 관리
            </span>
            {!loading && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 bg-indigo-50 text-indigo-700 border-indigo-200"
                aria-label={`${stats.totalProjects}개 프로젝트`}
              >
                {stats.totalProjects}개 프로젝트
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!loading && stats.totalVersions > 0 && (
              <span
                className="text-[10px] text-gray-400"
                aria-label={`버전 ${stats.totalVersions}개, 승인 ${stats.approvedVersions}개`}
              >
                버전 {stats.totalVersions} · 승인 {stats.approvedVersions}
              </span>
            )}
            {isOpen ? (
              <ChevronDown
                className="h-4 w-4 text-gray-400"
                aria-hidden="true"
              />
            ) : (
              <ChevronRight
                className="h-4 w-4 text-gray-400"
                aria-hidden="true"
              />
            )}
          </div>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent id={contentId}>
        <div
          className="mt-1 border rounded-lg bg-gray-50 p-3 space-y-3"
          aria-labelledby={headerId}
        >
          {/* 통계 요약 */}
          {!loading && stats.totalVersions > 0 && (
            <PosterStats
              totalProjects={stats.totalProjects}
              totalVersions={stats.totalVersions}
              approvedVersions={stats.approvedVersions}
            />
          )}

          {/* 포스터 프로젝트 목록 */}
          {loading ? (
            <div className="space-y-2" aria-label="로딩 중" aria-busy="true">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : projects.length === 0 && !showAddForm ? (
            <div
              className="text-center py-6"
              aria-live="polite"
              aria-label="포스터 프로젝트 없음"
            >
              <ImageIcon
                className="h-8 w-8 text-gray-300 mx-auto mb-2"
                aria-hidden="true"
              />
              <p className="text-xs text-gray-400">
                등록된 포스터 프로젝트가 없습니다.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs mt-2"
                onClick={() => setShowAddForm(true)}
                aria-label="첫 포스터 프로젝트 추가"
              >
                <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
                첫 포스터 프로젝트 추가
              </Button>
            </div>
          ) : (
            <div
              className="space-y-1.5"
              role="list"
              aria-label="포스터 프로젝트 목록"
              aria-live="polite"
            >
              {projects.map((poster) => (
                <div key={poster.id} role="listitem">
                  <PosterProjectRow
                    poster={poster}
                    memberNames={memberNames}
                    onAddVersion={handleAddVersion}
                    onVote={vote}
                    onStatusChange={updateStatus}
                    onSelectFinal={selectFinal}
                    onDeleteVersion={deleteVersion}
                    onDeletePoster={deleteProject}
                  />
                </div>
              ))}
            </div>
          )}

          {/* 추가 폼 */}
          {showAddForm && (
            <AddProjectForm
              onAdd={addProject}
              onClose={() => setShowAddForm(false)}
            />
          )}

          {/* 추가 버튼 */}
          {!showAddForm && projects.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs w-full"
              onClick={() => setShowAddForm(true)}
              aria-label="포스터 프로젝트 추가"
            >
              <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
              포스터 프로젝트 추가
            </Button>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
