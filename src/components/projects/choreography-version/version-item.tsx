"use client";

import { memo, useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronRight,
  GitBranch,
  Trash2,
  FileText,
  Check,
  Archive,
  Clock,
  User,
  GitCompare,
  Star,
  Pencil,
} from "lucide-react";
import { SectionNoteDisplay } from "./section-note-display";
import { STATUS_CONFIG, STATUS_ORDER } from "./types";
import type { ChoreoVersion, ChoreoVersionStatus } from "@/types";

// ============================================
// 버전 아이템 (타임라인 노드)
// ============================================

export interface VersionItemProps {
  version: ChoreoVersion;
  isCurrent: boolean;
  isFirst: boolean;
  isLast: boolean;
  compareMode: boolean;
  selectedForCompare: string[];
  onSetCurrent: () => void;
  onStatusChange: (status: ChoreoVersionStatus) => void;
  onDelete: () => void;
  onToggleCompare: () => void;
}

export const VersionItem = memo(function VersionItem({
  version,
  isCurrent,
  isLast,
  compareMode,
  selectedForCompare,
  onSetCurrent,
  onStatusChange,
  onDelete,
  onToggleCompare,
}: VersionItemProps) {
  const [expanded, setExpanded] = useState(false);
  const statusCfg = STATUS_CONFIG[version.status];
  const isSelectedForCompare = selectedForCompare.includes(version.id);
  const headerId = `version-header-${version.id}`;
  const contentId = `version-content-${version.id}`;

  return (
    <div className="flex gap-3">
      {/* 타임라인 선 + 노드 */}
      <div className="flex flex-col items-center shrink-0" aria-hidden="true">
        <div
          className={`w-3 h-3 rounded-full border-2 mt-1.5 shrink-0 ${
            isCurrent
              ? "bg-purple-500 border-purple-500"
              : "bg-background border-muted-foreground/30"
          }`}
        />
        {!isLast && (
          <div className="w-px flex-1 bg-muted-foreground/20 mt-1" />
        )}
      </div>

      {/* 버전 카드 */}
      <div
        className={`flex-1 mb-3 border rounded-md overflow-hidden ${
          isCurrent ? "border-purple-300 shadow-sm" : ""
        } ${isSelectedForCompare ? "ring-2 ring-blue-400" : ""}`}
      >
        <Collapsible open={expanded} onOpenChange={setExpanded}>
          {/* 헤더 */}
          <CollapsibleTrigger
            asChild
            aria-expanded={expanded}
            aria-controls={contentId}
          >
            <div
              id={headerId}
              className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-muted/20 transition-colors group"
              role="button"
              tabIndex={0}
              aria-label={`v${version.versionNumber} ${version.label} ${statusCfg.label}${isCurrent ? " 현재 버전" : ""} — ${expanded ? "접기" : "펼치기"}`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setExpanded((v) => !v);
                }
              }}
            >
              <div className="flex items-center gap-2 min-w-0">
                {expanded ? (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                )}
                <GitBranch className="h-3.5 w-3.5 text-purple-500 shrink-0" aria-hidden="true" />
                <span className="text-xs font-semibold shrink-0">
                  v{version.versionNumber}
                </span>
                <span className="text-xs text-foreground truncate">
                  {version.label}
                </span>
                <Badge className={`text-[9px] px-1.5 py-0 shrink-0 ${statusCfg.className}`}>
                  {statusCfg.label}
                </Badge>
                {isCurrent && (
                  <Badge className="text-[9px] px-1.5 py-0 shrink-0 bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-100">
                    현재
                  </Badge>
                )}
              </div>

              {/* 액션 버튼들 */}
              <div
                className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity shrink-0"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                {compareMode && (
                  <Button
                    variant={isSelectedForCompare ? "default" : "ghost"}
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={onToggleCompare}
                    aria-pressed={isSelectedForCompare}
                    aria-label={`v${version.versionNumber} 비교 ${isSelectedForCompare ? "선택 해제" : "선택"}`}
                  >
                    <GitCompare className="h-3 w-3" aria-hidden="true" />
                  </Button>
                )}
                {!isCurrent && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={onSetCurrent}
                    aria-label={`v${version.versionNumber}을 현재 버전으로 설정`}
                  >
                    <Star className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={onDelete}
                  aria-label={`v${version.versionNumber} ${version.label} 삭제`}
                >
                  <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </CollapsibleTrigger>

          {/* 상세 내용 */}
          <CollapsibleContent id={contentId} aria-labelledby={headerId}>
            <div className="px-3 pb-3 pt-2 border-t space-y-2.5">
              {/* 메타 정보 */}
              <dl className="flex flex-wrap gap-x-3 gap-y-1">
                {version.createdBy && (
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                    <dt className="sr-only">수정자</dt>
                    <dd className="text-[11px] text-muted-foreground">
                      {version.createdBy}
                    </dd>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                  <dt className="sr-only">생성일</dt>
                  <dd className="text-[11px] text-muted-foreground">
                    <time dateTime={version.createdAt}>
                      {new Date(version.createdAt).toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </time>
                  </dd>
                </div>
              </dl>

              {/* 변경사항 설명 */}
              {version.description && (
                <div className="flex items-start gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" aria-hidden="true" />
                  <p className="text-[11px] text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {version.description}
                  </p>
                </div>
              )}

              {/* 섹션 노트 */}
              {version.sections.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground font-medium">
                    구간별 노트 ({version.sections.length})
                  </p>
                  <div role="list" aria-label="구간별 노트 목록">
                    {version.sections.map((sec, idx) => (
                      <SectionNoteDisplay
                        key={idx}
                        section={sec}
                        highlight={sec.changed}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* 상태 변경 버튼 */}
              <div
                role="group"
                aria-label="버전 상태 변경"
                className="flex flex-wrap gap-1 pt-1"
              >
                {STATUS_ORDER.map((s) => (
                  <Button
                    key={s}
                    variant={version.status === s ? "default" : "outline"}
                    size="sm"
                    className="h-6 text-[10px]"
                    onClick={() => onStatusChange(s)}
                    aria-pressed={version.status === s}
                    aria-label={`상태를 "${STATUS_CONFIG[s].label}"로 변경`}
                  >
                    {s === "draft" && <Pencil className="h-2.5 w-2.5 mr-0.5" aria-hidden="true" />}
                    {s === "review" && <FileText className="h-2.5 w-2.5 mr-0.5" aria-hidden="true" />}
                    {s === "approved" && <Check className="h-2.5 w-2.5 mr-0.5" aria-hidden="true" />}
                    {s === "archived" && <Archive className="h-2.5 w-2.5 mr-0.5" aria-hidden="true" />}
                    {STATUS_CONFIG[s].label}
                  </Button>
                ))}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
});
