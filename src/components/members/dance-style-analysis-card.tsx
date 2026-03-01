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
import { ChevronDown, ChevronUp, Plus, BarChart2, Activity } from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useDanceStyleAnalysis } from "@/hooks/use-dance-style-analysis";
import type { DanceStyleSnapshot } from "@/types";

import { SnapshotDialog } from "./dance-style-analysis/snapshot-dialog";
import { SnapshotRow } from "./dance-style-analysis/snapshot-row";
import { StatsSummary } from "./dance-style-analysis/stats-summary";
import { snapshotToForm, type SnapshotFormState } from "./dance-style-analysis/types";

// ============================================================
// 메인 카드
// ============================================================

export function DanceStyleAnalysisCard({ memberId }: { memberId: string }) {
  const {
    snapshots,
    addSnapshot,
    updateSnapshot,
    deleteSnapshot,
    getStats,
  } = useDanceStyleAnalysis(memberId);

  const [open, setOpen] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<DanceStyleSnapshot | null>(null);

  const computedStats = getStats();

  function handleAdd(form: SnapshotFormState) {
    addSnapshot({
      date: form.date,
      primaryGenres: form.primaryGenres,
      secondaryGenres: form.secondaryGenres,
      strengths: form.strengths,
      weaknesses: form.weaknesses,
      traitScores: form.traitScores,
      notes: form.notes,
    });
    toast.success(TOAST.MEMBERS.STYLE_ANALYSIS_ADDED);
  }

  function handleEdit(form: SnapshotFormState) {
    if (!editTarget) return;
    updateSnapshot(editTarget.id, {
      date: form.date,
      primaryGenres: form.primaryGenres,
      secondaryGenres: form.secondaryGenres,
      strengths: form.strengths,
      weaknesses: form.weaknesses,
      traitScores: form.traitScores,
      notes: form.notes,
    });
    toast.success(TOAST.MEMBERS.STYLE_ANALYSIS_UPDATED);
    setEditTarget(null);
  }

  function handleDelete(snapId: string) {
    deleteSnapshot(snapId);
    toast.success(TOAST.MEMBERS.STYLE_ANALYSIS_DELETED);
  }

  return (
    <Card className="w-full">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader className="pb-2">
          <CollapsibleTrigger className="w-full" asChild>
            <div
              className="flex items-center justify-between cursor-pointer select-none group"
              role="button"
              aria-expanded={open}
              aria-label={`댄스 스타일 분석 섹션 ${open ? "접기" : "펼치기"}`}
            >
              <div className="flex items-center gap-2">
                <BarChart2
                  className="h-4 w-4 text-indigo-500"
                  aria-hidden="true"
                />
                <CardTitle className="text-sm font-semibold">
                  댄스 스타일 분석
                </CardTitle>
                {snapshots.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0"
                    aria-label={`${snapshots.length}회 분석 기록`}
                  >
                    {snapshots.length}회
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAddDialogOpen(true);
                  }}
                  aria-label="댄스 스타일 분석 추가"
                >
                  <Plus className="h-3 w-3" aria-hidden="true" />
                  분석 추가
                </Button>
                {open ? (
                  <ChevronUp
                    className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors"
                    aria-hidden="true"
                  />
                ) : (
                  <ChevronDown
                    className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors"
                    aria-hidden="true"
                  />
                )}
              </div>
            </div>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* 통계 요약 */}
            <StatsSummary stats={computedStats} />

            {/* 기록 목록 */}
            {snapshots.length > 0 && (
              <section aria-label="분석 기록 목록">
                <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium mb-2">
                  <Activity className="h-3 w-3" aria-hidden="true" />
                  <span>분석 기록 ({snapshots.length})</span>
                </div>
                <div className="space-y-1.5" role="list" aria-label="댄스 스타일 분석 기록">
                  {snapshots.map((snap) => (
                    <div key={snap.id} role="listitem">
                      <SnapshotRow
                        snapshot={snap}
                        onEdit={() => setEditTarget(snap)}
                        onDelete={() => handleDelete(snap.id)}
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>

      {/* 추가 다이얼로그 */}
      <SnapshotDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onSubmit={handleAdd}
        title="댄스 스타일 분석 추가"
      />

      {/* 수정 다이얼로그 */}
      {editTarget && (
        <SnapshotDialog
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          onSubmit={handleEdit}
          initialData={snapshotToForm(editTarget)}
          title="댄스 스타일 분석 수정"
        />
      )}
    </Card>
  );
}
