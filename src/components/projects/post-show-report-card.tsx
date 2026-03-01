"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { usePostShowReport } from "@/hooks/use-post-show-report";
import { useDeleteConfirm } from "@/hooks/use-delete-confirm";
import type { PostShowReportEntry } from "@/types";

// 서브모듈
import { ReportFormDialog } from "./post-show-report/report-form-dialog";
import { ReportEntryRow } from "./post-show-report/report-entry-row";
import { ReportStatsSummary, ReportSectionAverages } from "./post-show-report/report-stats";
import type { ReportFormData } from "./post-show-report/types";

// ============================================================
// 메인 카드 컴포넌트
// ============================================================

export function PostShowReportCard({
  groupId,
  projectId,
}: {
  groupId: string;
  projectId: string;
}) {
  const { entries, loading, addEntry, updateEntry, deleteEntry, stats } =
    usePostShowReport(groupId, projectId);

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PostShowReportEntry | null>(null);
  const deleteConfirm = useDeleteConfirm<string>();
  const [isOpen, setIsOpen] = useState(true);

  // ── 보고서 폼 데이터를 훅 파라미터로 변환하는 헬퍼 ──────────────

  function toListItems(text: string): string[] {
    return text
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  // ── 이벤트 핸들러 ────────────────────────────────────────────

  function handleAdd(data: ReportFormData) {
    addEntry({
      title: data.title,
      performanceDate: data.performanceDate,
      overallReview: data.overallReview,
      sectionScores: data.sectionScores,
      highlights: toListItems(data.highlights),
      improvements: toListItems(data.improvements),
      nextSuggestions: toListItems(data.nextSuggestions),
      audienceCount: data.audienceCount
        ? parseInt(data.audienceCount)
        : undefined,
      revenue: data.revenue ? parseInt(data.revenue) : undefined,
      author: data.author,
      notes: data.notes || undefined,
    });
    toast.success(TOAST.POST_SHOW_REPORT.CREATED);
    setAddOpen(false);
  }

  function handleEdit(data: ReportFormData) {
    if (!editTarget) return;
    const ok = updateEntry(editTarget.id, {
      title: data.title,
      performanceDate: data.performanceDate,
      overallReview: data.overallReview,
      sectionScores: data.sectionScores,
      highlights: toListItems(data.highlights),
      improvements: toListItems(data.improvements),
      nextSuggestions: toListItems(data.nextSuggestions),
      audienceCount: data.audienceCount
        ? parseInt(data.audienceCount)
        : undefined,
      revenue: data.revenue ? parseInt(data.revenue) : undefined,
      author: data.author,
      notes: data.notes || undefined,
    });
    if (ok) {
      toast.success(TOAST.POST_SHOW_REPORT.UPDATED);
    } else {
      toast.error(TOAST.UPDATE_ERROR);
    }
    setEditTarget(null);
  }

  function handleDelete() {
    const id = deleteConfirm.confirm();
    if (!id) return;
    const ok = deleteEntry(id);
    if (ok) {
      toast.success(TOAST.POST_SHOW_REPORT.DELETED);
    } else {
      toast.error(TOAST.DELETE_ERROR);
    }
  }

  // ── JSX ──────────────────────────────────────────────────────

  return (
    <>
      <Card>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CollapsibleTrigger asChild>
                <div
                  role="button"
                  tabIndex={0}
                  aria-expanded={isOpen}
                  aria-controls="post-show-report-body"
                  className="flex items-center gap-2 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setIsOpen((prev) => !prev);
                    }
                  }}
                >
                  <FileText
                    className="h-4 w-4 text-indigo-500"
                    aria-hidden="true"
                  />
                  <CardTitle className="text-sm font-semibold">
                    공연 사후 분석 보고서
                  </CardTitle>
                  {entries.length > 0 && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 bg-indigo-50 text-indigo-700 border-indigo-200"
                    >
                      {entries.length}건
                    </Badge>
                  )}
                  {isOpen ? (
                    <ChevronUp
                      className="h-3.5 w-3.5 text-muted-foreground"
                      aria-hidden="true"
                    />
                  ) : (
                    <ChevronDown
                      className="h-3.5 w-3.5 text-muted-foreground"
                      aria-hidden="true"
                    />
                  )}
                </div>
              </CollapsibleTrigger>

              <Button
                size="sm"
                className="h-7 text-xs"
                aria-label="새 보고서 작성"
                onClick={() => setAddOpen(true)}
              >
                <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
                보고서 작성
              </Button>
            </div>
          </CardHeader>

          <CollapsibleContent>
            <CardContent
              id="post-show-report-body"
              className="pt-0 space-y-3"
              role="region"
              aria-label="공연 사후 분석 보고서 목록"
            >
              {/* 통계 요약 */}
              {entries.length > 0 && (
                <ReportStatsSummary stats={stats} />
              )}

              {/* 섹션별 종합 평균 */}
              {entries.length > 0 && (
                <ReportSectionAverages
                  sectionAvgMap={stats.sectionAvgMap}
                />
              )}

              {/* 보고서 목록 */}
              {loading ? (
                <p
                  className="text-xs text-muted-foreground py-4 text-center"
                  role="status"
                  aria-live="polite"
                >
                  불러오는 중...
                </p>
              ) : entries.length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">
                  작성된 사후 분석 보고서가 없습니다.
                  <br />
                  상단 &quot;보고서 작성&quot; 버튼으로 추가해보세요.
                </p>
              ) : (
                <div
                  className="space-y-2"
                  role="list"
                  aria-label={`보고서 ${entries.length}건`}
                >
                  {entries.map((entry) => (
                    <div key={entry.id} role="listitem">
                      <ReportEntryRow
                        entry={entry}
                        onEdit={() => setEditTarget(entry)}
                        onDelete={() => deleteConfirm.request(entry.id)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* 작성 다이얼로그 */}
      <ReportFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        mode="add"
        onSubmit={handleAdd}
      />

      {/* 수정 다이얼로그 */}
      {editTarget && (
        <ReportFormDialog
          open={!!editTarget}
          onOpenChange={(v) => {
            if (!v) setEditTarget(null);
          }}
          mode="edit"
          initial={editTarget}
          onSubmit={handleEdit}
        />
      )}

      {/* 삭제 확인 */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={deleteConfirm.onOpenChange}
        title="보고서 삭제"
        description="이 사후 분석 보고서를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        onConfirm={handleDelete}
        destructive
      />
    </>
  );
}
