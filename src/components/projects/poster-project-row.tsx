"use client";

import { useState, memo } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Trash2, Star, Award } from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import type { PosterProject, PosterVersion, PosterVersionStatus } from "@/types";
import { statusBadgeClass, STATUS_LABELS, avgRating } from "./poster-types";
import { AddVersionDialog, type AddVersionPayload } from "./poster-add-version-dialog";
import { VersionDetail } from "./poster-version-detail";

// ============================================================
// 포스터 프로젝트 행 (React.memo 적용)
// ============================================================

interface PosterProjectRowProps {
  poster: PosterProject;
  memberNames: string[];
  onAddVersion: (
    posterId: string,
    partial: AddVersionPayload
  ) => PosterVersion | null;
  onVote: (
    posterId: string,
    versionId: string,
    memberName: string,
    rating: number,
    comment?: string
  ) => boolean;
  onStatusChange: (
    posterId: string,
    versionId: string,
    status: PosterVersionStatus
  ) => boolean;
  onSelectFinal: (posterId: string, versionId: string) => boolean;
  onDeleteVersion: (posterId: string, versionId: string) => boolean;
  onDeletePoster: (posterId: string) => boolean;
}

export const PosterProjectRow = memo(function PosterProjectRow({
  poster,
  memberNames,
  onAddVersion,
  onVote,
  onStatusChange,
  onSelectFinal,
  onDeleteVersion,
  onDeletePoster,
}: PosterProjectRowProps) {
  const [open, setOpen] = useState(false);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
    null
  );

  const finalVersion = poster.versions.find((v) => v.status === "final");
  const totalVotes = poster.versions.reduce(
    (sum, v) => sum + v.votes.length,
    0
  );
  const headerId = `poster-header-${poster.id}`;
  const contentId = `poster-content-${poster.id}`;
  const versionListId = `version-list-${poster.id}`;

  function handleDeletePoster() {
    const ok = onDeletePoster(poster.id);
    if (ok) {
      toast.success(TOAST.POSTER.PROJECT_DELETED);
    } else {
      toast.error(TOAST.DELETE_ERROR);
    }
  }

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      aria-expanded={open}
    >
      <CollapsibleTrigger asChild>
        <div
          id={headerId}
          className="flex items-center justify-between p-2.5 rounded-lg border bg-card hover:bg-muted/30 cursor-pointer transition-colors"
          role="button"
          aria-expanded={open}
          aria-controls={contentId}
          aria-label={`${poster.posterName} 포스터 프로젝트${open ? " 접기" : " 펼치기"}`}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setOpen(!open);
            }
          }}
        >
          <div className="flex items-center gap-2 min-w-0">
            {open ? (
              <ChevronDown
                className="h-3.5 w-3.5 text-gray-400 shrink-0"
                aria-hidden="true"
              />
            ) : (
              <ChevronRight
                className="h-3.5 w-3.5 text-gray-400 shrink-0"
                aria-hidden="true"
              />
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-medium text-gray-800 truncate">
                  {poster.posterName}
                </span>
                {finalVersion && (
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 bg-purple-50 text-purple-700 border-purple-200"
                  >
                    <Award
                      className="h-2.5 w-2.5 mr-0.5"
                      aria-hidden="true"
                    />
                    확정됨
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-gray-400">
                  버전 {poster.versions.length}개 · 투표 {totalVotes}건
                </span>
                {poster.deadline && (
                  <span className="text-[10px] text-orange-500">
                    마감: {poster.deadline}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 shrink-0 ml-2"
            onClick={(e) => {
              e.stopPropagation();
              handleDeletePoster();
            }}
            aria-label={`${poster.posterName} 포스터 프로젝트 삭제`}
          >
            <Trash2 className="h-3 w-3" aria-hidden="true" />
          </Button>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent id={contentId}>
        <div
          className="mt-1 ml-4 pl-3 border-l-2 border-gray-100 space-y-2 pb-1"
          aria-labelledby={headerId}
        >
          {/* 버전 목록 헤더 */}
          <div className="flex items-center justify-between pt-1">
            <p
              className="text-[10px] text-gray-500 font-medium"
              id={versionListId}
            >
              버전 목록
            </p>
            <AddVersionDialog posterId={poster.id} onAdd={onAddVersion} />
          </div>

          {poster.versions.length === 0 ? (
            <p
              className="text-[10px] text-gray-400 text-center py-3"
              aria-live="polite"
            >
              아직 버전이 없습니다. 버전을 추가해보세요.
            </p>
          ) : (
            <div
              className="space-y-1"
              role="list"
              aria-labelledby={versionListId}
            >
              {poster.versions.map((v) => {
                const avg = avgRating(v.votes);
                const isSelected = selectedVersionId === v.id;
                return (
                  <div key={v.id} className="space-y-1" role="listitem">
                    <button
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors ${
                        isSelected
                          ? "bg-indigo-50 border border-indigo-200"
                          : "bg-gray-50 hover:bg-gray-100 border border-transparent"
                      }`}
                      onClick={() =>
                        setSelectedVersionId(isSelected ? null : v.id)
                      }
                      aria-expanded={isSelected}
                      aria-label={`버전 ${v.versionNumber}: ${v.title} - ${isSelected ? "접기" : "상세 보기"}`}
                    >
                      <span
                        className="text-[10px] text-gray-500 w-6 shrink-0"
                        aria-hidden="true"
                      >
                        v{v.versionNumber}
                      </span>
                      <span className="text-xs text-gray-700 flex-1 truncate">
                        {v.title}
                      </span>
                      <span className="text-[10px] text-gray-500 shrink-0 hidden sm:inline">
                        {v.designer}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 shrink-0 ${statusBadgeClass(v.status)}`}
                      >
                        {STATUS_LABELS[v.status]}
                      </Badge>
                      {avg !== null && (
                        <div
                          className="flex items-center gap-0.5 shrink-0"
                          aria-label={`평균 별점 ${avg.toFixed(1)}점`}
                        >
                          <Star
                            className="h-3 w-3 fill-yellow-400 text-yellow-400"
                            aria-hidden="true"
                          />
                          <span className="text-[10px] text-gray-500">
                            {avg.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </button>

                    {/* 버전 상세 (선택 시 펼침) */}
                    {isSelected && (
                      <div aria-live="polite">
                        <VersionDetail
                          version={v}
                          posterId={poster.id}
                          memberNames={memberNames}
                          onVote={onVote}
                          onStatusChange={onStatusChange}
                          onSelectFinal={onSelectFinal}
                          onDelete={onDeleteVersion}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
});
