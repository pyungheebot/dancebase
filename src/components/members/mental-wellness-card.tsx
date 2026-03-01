"use client";

import { useState, useCallback } from "react";
import { Brain, ChevronDown, ChevronUp, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { cn } from "@/lib/utils";
import { useMentalWellness } from "@/hooks/use-mental-wellness";
import type { MentalWellnessEntry } from "@/types";

import { WeeklyTrendChart } from "./mental-wellness/weekly-trend-chart";
import { MoodDistributionBar } from "./mental-wellness/mood-distribution-bar";
import { EntryItem } from "./mental-wellness/entry-item";
import { EntryDialog } from "./mental-wellness/entry-dialog";
import {
  MOOD_CONFIG,
  MOOD_KEYS,
  SLIDER_CONFIG,
  getDefaultForm,
  entryToForm,
} from "./mental-wellness/types";
import type { EntryForm } from "./mental-wellness/types";

// ============================================================
// 메인 카드 컴포넌트
// ============================================================

type MentalWellnessCardProps = {
  memberId: string;
};

export function MentalWellnessCard({ memberId }: MentalWellnessCardProps) {
  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EntryForm>(getDefaultForm());

  const { entries, loading, stats, addEntry, updateEntry, deleteEntry } =
    useMentalWellness(memberId);

  // 다이얼로그 열기 (신규)
  const openAddDialog = useCallback(() => {
    setForm(getDefaultForm());
    setEditingId(null);
    setDialogOpen(true);
  }, []);

  // 다이얼로그 열기 (수정)
  const openEditDialog = useCallback((entry: MentalWellnessEntry) => {
    setForm(entryToForm(entry));
    setEditingId(entry.id);
    setDialogOpen(true);
  }, []);

  // 다이얼로그 닫기
  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    setEditingId(null);
  }, []);

  // 저장
  const handleSave = useCallback(() => {
    if (!form.date) {
      toast.error(TOAST.MEMBERS.MENTAL_DATE_INPUT_REQUIRED);
      return;
    }

    const entryData: Omit<MentalWellnessEntry, "id" | "createdAt"> = {
      date: form.date,
      confidence: form.confidence,
      stress: form.stress,
      motivation: form.motivation,
      anxiety: form.anxiety,
      overallMood: form.overallMood,
      journalNote: form.journalNote.trim() || undefined,
      copingStrategies:
        form.copingStrategies.length > 0 ? form.copingStrategies : undefined,
    };

    if (editingId) {
      const ok = updateEntry(editingId, entryData);
      if (ok) {
        toast.success(TOAST.MEMBERS.MENTAL_UPDATED);
        closeDialog();
      } else {
        toast.error(TOAST.UPDATE_ERROR);
      }
    } else {
      addEntry(entryData);
      toast.success(TOAST.MEMBERS.MENTAL_SAVED);
      closeDialog();
    }
  }, [form, editingId, addEntry, updateEntry, closeDialog]);

  // 삭제
  const handleDelete = useCallback(
    (id: string) => {
      const ok = deleteEntry(id);
      if (ok) {
        toast.success(TOAST.MEMBERS.MENTAL_RECORD_DELETED);
      } else {
        toast.error(TOAST.DELETE_ERROR);
      }
    },
    [deleteEntry]
  );

  // 최근 기록 5개
  const recentEntries = entries.slice(0, 5);

  // 대표 기분 (가장 많은 기분)
  const topMood = (() => {
    if (stats.totalEntries === 0) return null;
    const dist = stats.moodDistribution;
    const max = Math.max(...MOOD_KEYS.map((k) => dist[k]));
    return MOOD_KEYS.find((k) => dist[k] === max) ?? null;
  })();

  return (
    <>
      <Card>
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader
              className="cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg py-3"
              aria-expanded={open}
              aria-controls="mental-wellness-content"
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Brain className="h-4 w-4 text-violet-500" aria-hidden="true" />
                  심리 상태 추적
                </CardTitle>
                <div className="flex items-center gap-2">
                  {stats.totalEntries > 0 && (
                    <div
                      className="flex items-center gap-1.5 text-xs text-muted-foreground"
                      aria-label={`총 ${stats.totalEntries}회 기록${topMood ? `, 주요 기분: ${MOOD_CONFIG[topMood].label}` : ""}`}
                    >
                      <span>총 {stats.totalEntries}회</span>
                      {topMood && (
                        <>
                          <span
                            className="text-muted-foreground/40"
                            aria-hidden="true"
                          >
                            |
                          </span>
                          <span>
                            <span aria-hidden="true">
                              {MOOD_CONFIG[topMood].emoji}
                            </span>{" "}
                            {MOOD_CONFIG[topMood].label}
                          </span>
                        </>
                      )}
                    </div>
                  )}
                  {open ? (
                    <ChevronUp
                      className="h-4 w-4 text-muted-foreground"
                      aria-hidden="true"
                    />
                  ) : (
                    <ChevronDown
                      className="h-4 w-4 text-muted-foreground"
                      aria-hidden="true"
                    />
                  )}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent id="mental-wellness-content">
            <CardContent className="pt-0 pb-4 space-y-4">
              {loading ? (
                <p
                  className="text-xs text-muted-foreground text-center py-4"
                  role="status"
                  aria-live="polite"
                >
                  불러오는 중...
                </p>
              ) : (
                <>
                  {/* 평균 통계 요약 */}
                  {stats.totalEntries > 0 && (
                    <dl
                      className="grid grid-cols-4 gap-1.5"
                      aria-label="평균 심리 지표"
                    >
                      {SLIDER_CONFIG.map((cfg) => {
                        const avg =
                          cfg.key === "confidence"
                            ? stats.averageConfidence
                            : cfg.key === "stress"
                              ? stats.averageStress
                              : cfg.key === "motivation"
                                ? stats.averageMotivation
                                : stats.averageAnxiety;
                        return (
                          <div
                            key={cfg.key}
                            className={cn(
                              "rounded-lg p-2 text-center",
                              cfg.trackColor
                            )}
                          >
                            <dt
                              className={cn("text-[9px]", cfg.textColor)}
                            >
                              {cfg.label}
                            </dt>
                            <dd
                              className={cn(
                                "text-base font-bold",
                                cfg.textColor
                              )}
                              aria-label={`평균 ${cfg.label}: ${avg ?? "없음"}`}
                            >
                              {avg ?? "-"}
                            </dd>
                          </div>
                        );
                      })}
                    </dl>
                  )}

                  {/* 체크인 추가 버튼 */}
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      오늘의 심리 상태를 기록하세요
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        openAddDialog();
                      }}
                      aria-label="심리 상태 체크인 추가"
                    >
                      <Plus className="h-3 w-3" aria-hidden="true" />
                      체크인
                    </Button>
                  </div>

                  {/* 주간 추이 차트 */}
                  {entries.length >= 2 && (
                    <section aria-label="주간 심리 추이">
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        주간 추이 (최근 7회)
                      </p>
                      <WeeklyTrendChart entries={entries} />
                    </section>
                  )}

                  {/* 기분 분포 */}
                  {stats.totalEntries > 0 && (
                    <MoodDistributionBar
                      distribution={stats.moodDistribution}
                      total={stats.totalEntries}
                    />
                  )}

                  {/* 최근 기록 목록 */}
                  {recentEntries.length === 0 ? (
                    <div
                      className="text-center py-6 space-y-1"
                      role="status"
                      aria-live="polite"
                    >
                      <Brain
                        className="h-6 w-6 text-muted-foreground/30 mx-auto"
                        aria-hidden="true"
                      />
                      <p className="text-xs text-muted-foreground">
                        기록된 심리 상태 데이터가 없습니다.
                      </p>
                      <p className="text-[10px] text-muted-foreground/60">
                        상단 &apos;체크인&apos; 버튼으로 첫 기록을 등록하세요.
                      </p>
                    </div>
                  ) : (
                    <section aria-label="최근 심리 상태 기록">
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        최근 기록
                      </p>
                      <ol
                        className="space-y-2"
                        role="list"
                        aria-label="최근 기록 목록"
                      >
                        {recentEntries.map((entry) => (
                          <li key={entry.id} role="listitem">
                            <EntryItem
                              entry={entry}
                              onEdit={openEditDialog}
                              onDelete={handleDelete}
                            />
                          </li>
                        ))}
                      </ol>
                      {entries.length > 5 && (
                        <p
                          className="text-[10px] text-muted-foreground text-center mt-2"
                          aria-live="polite"
                        >
                          총 {entries.length}개 기록 중 최근 5개 표시
                        </p>
                      )}
                    </section>
                  )}
                </>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* 기록 추가/수정 다이얼로그 */}
      <EntryDialog
        open={dialogOpen}
        onClose={closeDialog}
        onSave={handleSave}
        editingId={editingId}
        form={form}
        setForm={setForm}
      />
    </>
  );
}
