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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Plus,
  Zap,
  ShieldCheck,
  ShieldAlert,
  Shield,
  Sparkles,
  BarChart2,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useStageEffect } from "@/hooks/use-stage-effect";
import { useDeleteConfirm } from "@/hooks/use-delete-confirm";
import type {
  StageEffectType,
  StageEffectSafetyLevel,
  StageEffectEntry,
} from "@/types";

import {
  EntryDialog,
  EFFECT_TYPES,
  EFFECT_TYPE_LABELS,
  SAFETY_LABELS,
  EMPTY_FORM,
  type EntryFormData,
} from "./stage-effect-dialogs";
import {
  EntryRow,
  TypeBarChart,
  SafetyProgressBar,
  TimelineView,
} from "./stage-effect-views";

// ============================================================
// 유틸: StageEffectEntry -> EntryFormData
// ============================================================

function entryToForm(entry: StageEffectEntry): EntryFormData {
  return {
    cueNumber: entry.cueNumber,
    effectType: entry.effectType,
    triggerTime: entry.triggerTime,
    durationSec: String(entry.durationSec),
    intensity: entry.intensity,
    intensityCustom: entry.intensityCustom ?? "",
    trigger: entry.trigger,
    position: entry.position,
    safetyLevel: entry.safetyLevel,
    safetyNotes: entry.safetyNotes ?? "",
    operator: entry.operator ?? "",
    notes: entry.notes ?? "",
  };
}

// ============================================================
// 탭 타입
// ============================================================

type ViewTab = "list" | "chart" | "timeline";

// ============================================================
// 메인 카드
// ============================================================

export function StageEffectCard({
  projectId,
}: {
  projectId: string;
}) {
  const { entries, loading, addEntry, updateEntry, deleteEntry, stats } =
    useStageEffect("project", projectId);

  // 다이얼로그 상태
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<StageEffectEntry | null>(null);
  const deleteConfirm = useDeleteConfirm<StageEffectEntry>();

  // 탭
  const [activeTab, setActiveTab] = useState<ViewTab>("list");

  // 필터 (목록 탭 전용)
  const [filterType, setFilterType] = useState<StageEffectType | "all">("all");
  const [filterSafety, setFilterSafety] = useState<StageEffectSafetyLevel | "all">("all");

  // 필터링
  const filtered = entries.filter((e) => {
    if (filterType !== "all" && e.effectType !== filterType) return false;
    if (filterSafety !== "all" && e.safetyLevel !== filterSafety) return false;
    return true;
  });

  // 추가 핸들러
  function handleAdd(form: EntryFormData) {
    try {
      addEntry({
        cueNumber: form.cueNumber,
        effectType: form.effectType,
        triggerTime: form.triggerTime,
        durationSec: parseInt(form.durationSec, 10),
        intensity: form.intensity,
        intensityCustom: form.intensityCustom || undefined,
        trigger: form.trigger,
        position: form.position,
        safetyLevel: form.safetyLevel,
        safetyNotes: form.safetyNotes || undefined,
        operator: form.operator || undefined,
        notes: form.notes || undefined,
      });
      toast.success(TOAST.STAGE_EFFECT.CUE_ADDED);
      setAddOpen(false);
    } catch {
      toast.error(TOAST.STAGE_EFFECT.CUE_ADD_ERROR);
    }
  }

  // 수정 핸들러
  function handleEdit(form: EntryFormData) {
    if (!editTarget) return;
    const ok = updateEntry(editTarget.id, {
      cueNumber: form.cueNumber,
      effectType: form.effectType,
      triggerTime: form.triggerTime,
      durationSec: parseInt(form.durationSec, 10),
      intensity: form.intensity,
      intensityCustom: form.intensityCustom || undefined,
      trigger: form.trigger,
      position: form.position,
      safetyLevel: form.safetyLevel,
      safetyNotes: form.safetyNotes || undefined,
      operator: form.operator || undefined,
      notes: form.notes || undefined,
    });
    if (ok) {
      toast.success(TOAST.STAGE_EFFECT.CUE_UPDATED);
    } else {
      toast.error(TOAST.STAGE_EFFECT.CUE_UPDATE_ERROR);
    }
    setEditTarget(null);
  }

  // 삭제 핸들러
  function handleDelete() {
    const entry = deleteConfirm.confirm();
    if (!entry) return;
    const ok = deleteEntry(entry.id);
    if (ok) {
      toast.success(TOAST.STAGE_EFFECT.CUE_DELETED);
    } else {
      toast.error(TOAST.STAGE_EFFECT.CUE_DELETE_ERROR);
    }
  }

  // 안전 확인 토글 핸들러 (safe <-> caution 토글)
  function handleToggleSafety(entry: StageEffectEntry) {
    const nextLevel: StageEffectSafetyLevel =
      entry.safetyLevel === "safe" ? "caution" : "safe";
    updateEntry(entry.id, { safetyLevel: nextLevel });
    toast.success(
      nextLevel === "safe" ? "안전 확인 완료로 변경했습니다." : "안전 확인 해제했습니다."
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-500" />
              <CardTitle className="text-sm font-semibold">
                무대 특수효과
              </CardTitle>
              {stats.totalCount > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {stats.totalCount}개
                </Badge>
              )}
            </div>
            <Button
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => setAddOpen(true)}
            >
              <Plus className="h-3 w-3" />
              큐 추가
            </Button>
          </div>

          {/* 안전 확인 완료율 프로그레스 바 */}
          {entries.length > 0 && (
            <div className="mt-3">
              <SafetyProgressBar entries={entries} />
            </div>
          )}

          {/* 탭 버튼 */}
          {entries.length > 0 && (
            <div className="mt-3 flex items-center gap-1 border-b border-border/50 pb-2">
              <Button
                variant={activeTab === "list" ? "secondary" : "ghost"}
                size="sm"
                className="h-6 text-xs px-2 gap-1"
                onClick={() => setActiveTab("list")}
              >
                <Zap className="h-3 w-3" />
                목록
              </Button>
              <Button
                variant={activeTab === "chart" ? "secondary" : "ghost"}
                size="sm"
                className="h-6 text-xs px-2 gap-1"
                onClick={() => setActiveTab("chart")}
              >
                <BarChart2 className="h-3 w-3" />
                통계
              </Button>
              <Button
                variant={activeTab === "timeline" ? "secondary" : "ghost"}
                size="sm"
                className="h-6 text-xs px-2 gap-1"
                onClick={() => setActiveTab("timeline")}
              >
                <Clock className="h-3 w-3" />
                타임라인
              </Button>
            </div>
          )}

          {/* 목록 탭 필터 */}
          {activeTab === "list" && entries.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Select
                value={filterType}
                onValueChange={(v) => setFilterType(v as StageEffectType | "all")}
              >
                <SelectTrigger className="h-7 text-xs w-36">
                  <SelectValue placeholder="효과 유형" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">전체 유형</SelectItem>
                  {EFFECT_TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="text-xs">
                      {EFFECT_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filterSafety}
                onValueChange={(v) => setFilterSafety(v as StageEffectSafetyLevel | "all")}
              >
                <SelectTrigger className="h-7 text-xs w-28">
                  <SelectValue placeholder="안전 등급" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">전체 등급</SelectItem>
                  {(["safe", "caution", "danger"] as StageEffectSafetyLevel[]).map((s) => (
                    <SelectItem key={s} value={s} className="text-xs">
                      {SAFETY_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {(filterType !== "all" || filterSafety !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs px-2 text-muted-foreground"
                  onClick={() => {
                    setFilterType("all");
                    setFilterSafety("all");
                  }}
                >
                  초기화
                </Button>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent className="pt-0">
          {loading ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              불러오는 중...
            </div>
          ) : entries.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <Zap className="h-8 w-8 text-muted-foreground/30 mx-auto" />
              <p className="text-xs text-muted-foreground">
                등록된 무대 특수효과 큐가 없습니다.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1 mt-1"
                onClick={() => setAddOpen(true)}
              >
                <Plus className="h-3 w-3" />
                첫 큐 추가하기
              </Button>
            </div>
          ) : activeTab === "list" ? (
            filtered.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                조건에 맞는 큐가 없습니다.
              </div>
            ) : (
              <div className="space-y-1.5">
                {/* 헤더 */}
                <div className="flex items-center gap-2 px-3 py-1 text-[10px] text-muted-foreground font-medium border-b border-border/50 mb-1">
                  <span className="w-4 shrink-0" />
                  <span className="w-10 shrink-0">큐</span>
                  <span className="w-16 shrink-0">유형</span>
                  <span className="w-14 shrink-0">시점</span>
                  <span className="w-12 shrink-0">지속</span>
                  <span className="w-12 shrink-0">강도</span>
                  <span className="flex-1 min-w-0">위치</span>
                  <span className="shrink-0">안전</span>
                </div>

                {filtered.map((entry) => (
                  <EntryRow
                    key={entry.id}
                    entry={entry}
                    onEdit={setEditTarget}
                    onDelete={deleteConfirm.request}
                    onToggleSafety={handleToggleSafety}
                  />
                ))}
              </div>
            )
          ) : activeTab === "chart" ? (
            <div className="space-y-4 py-2">
              {/* 안전 등급 요약 */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-md bg-green-50 border border-green-100 py-2">
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <ShieldCheck className="h-3 w-3 text-green-600" />
                    <span className="text-[10px] text-green-700 font-medium">안전</span>
                  </div>
                  <p className="text-lg font-bold text-green-700">{stats.safeCount}</p>
                </div>
                <div className="rounded-md bg-yellow-50 border border-yellow-100 py-2">
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <Shield className="h-3 w-3 text-yellow-600" />
                    <span className="text-[10px] text-yellow-700 font-medium">주의</span>
                  </div>
                  <p className="text-lg font-bold text-yellow-700">{stats.cautionCount}</p>
                </div>
                <div className="rounded-md bg-red-50 border border-red-100 py-2">
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <ShieldAlert className="h-3 w-3 text-red-600" />
                    <span className="text-[10px] text-red-700 font-medium">위험</span>
                  </div>
                  <p className="text-lg font-bold text-red-700">{stats.dangerCount}</p>
                </div>
              </div>

              {/* 유형별 바 차트 */}
              <div>
                <p className="text-[10px] font-medium text-muted-foreground mb-2">
                  효과 유형별 큐 수
                </p>
                <TypeBarChart entries={entries} />
              </div>
            </div>
          ) : (
            /* 타임라인 탭 */
            <div className="py-2 overflow-x-auto">
              <TimelineView entries={entries} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 추가 다이얼로그 */}
      <EntryDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={handleAdd}
        title="새 효과 큐 추가"
      />

      {/* 수정 다이얼로그 */}
      {editTarget && (
        <EntryDialog
          open={true}
          onClose={() => setEditTarget(null)}
          onSubmit={handleEdit}
          initial={entryToForm(editTarget)}
          title="효과 큐 수정"
        />
      )}

      {/* 삭제 확인 다이얼로그 */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={deleteConfirm.onOpenChange}
        title="큐 삭제"
        description={`큐 #${deleteConfirm.target?.cueNumber} (${deleteConfirm.target ? EFFECT_TYPE_LABELS[deleteConfirm.target.effectType] : ""})을(를) 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        onConfirm={handleDelete}
        destructive
      />
    </>
  );
}
