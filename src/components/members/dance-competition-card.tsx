"use client";

import { useState, useMemo } from "react";
import { useDeleteConfirm } from "@/hooks/use-delete-confirm";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import {
  Trophy,
  ChevronDown,
  ChevronUp,
  Plus,
  BarChart2,
  Filter,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useDanceCompetition } from "@/hooks/use-dance-competition";
import type { DanceCompetitionRecord } from "@/types";
import { EMPTY_FORM, recordToForm, type FormState } from "./dance-competition/types";
import { RecordDialog } from "./dance-competition/record-dialog";
import { RecordItem } from "./dance-competition/record-item";
import { StatsSection } from "./dance-competition/stats-section";

// ============================================================
// Props
// ============================================================

interface DanceCompetitionCardProps {
  memberId: string;
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export function DanceCompetitionCard({ memberId }: DanceCompetitionCardProps) {
  const {
    records,
    loading,
    genres,
    years,
    stats,
    addRecord,
    updateRecord,
    deleteRecord,
  } = useDanceCompetition(memberId);

  const [isOpen, setIsOpen] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editTarget, setEditTarget] = useState<DanceCompetitionRecord | null>(
    null
  );
  const [filterYear, setFilterYear] = useState<string>("all");
  const [filterGenre, setFilterGenre] = useState<string>("all");
  const [showStats, setShowStats] = useState(false);
  const deleteConfirm = useDeleteConfirm<DanceCompetitionRecord>();

  // 필터 적용
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const yearMatch =
        filterYear === "all" || r.date.startsWith(filterYear);
      const genreMatch =
        filterGenre === "all" || r.genre === filterGenre;
      return yearMatch && genreMatch;
    });
  }, [records, filterYear, filterGenre]);

  function handleAdd() {
    setEditTarget(null);
    setShowDialog(true);
  }

  function handleEdit(record: DanceCompetitionRecord) {
    setEditTarget(record);
    setShowDialog(true);
  }

  function handleDelete(record: DanceCompetitionRecord) {
    deleteConfirm.request(record);
  }

  function confirmDelete() {
    const target = deleteConfirm.confirm();
    if (!target) return;
    deleteRecord(target.id);
    toast.success(TOAST.MEMBERS.COMPETITION_RECORD_DELETED);
  }

  function handleSave(form: FormState) {
    if (editTarget) {
      updateRecord(editTarget.id, {
        competitionName: form.competitionName.trim(),
        date: form.date,
        location: form.location.trim() || null,
        category: form.category.trim() || null,
        placement: form.placement.trim() || null,
        teamOrSolo: form.teamOrSolo,
        teamName: form.teamName.trim() || null,
        genre: form.genre.trim() || null,
        notes: form.notes.trim(),
        certificateUrl: form.certificateUrl.trim() || null,
      });
      toast.success(TOAST.MEMBERS.COMPETITION_RECORD_UPDATED);
    } else {
      addRecord({
        competitionName: form.competitionName.trim(),
        date: form.date,
        location: form.location.trim() || null,
        category: form.category.trim() || null,
        placement: form.placement.trim() || null,
        teamOrSolo: form.teamOrSolo,
        teamName: form.teamName.trim() || null,
        genre: form.genre.trim() || null,
        notes: form.notes.trim(),
        certificateUrl: form.certificateUrl.trim() || null,
      });
      toast.success(TOAST.MEMBERS.COMPETITION_ADDED);
    }
    setShowDialog(false);
  }

  return (
    <>
      <Card>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CardHeader className="pb-2">
            <CollapsibleTrigger asChild>
              <div
                className="flex cursor-pointer items-center justify-between"
                aria-expanded={isOpen}
                aria-controls="dance-competition-content"
              >
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Trophy
                    className="h-4 w-4 text-yellow-500"
                    aria-hidden="true"
                  />
                  댄스 대회 참가 기록
                  {records.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0 h-4"
                      aria-label={`총 ${records.length}개 기록`}
                    >
                      {records.length}
                    </Badge>
                  )}
                  {stats.placementCount > 0 && (
                    <Badge
                      className="text-[10px] px-1.5 py-0 h-4 bg-yellow-100 text-yellow-700 border border-yellow-300"
                      aria-label={`입상 ${stats.placementCount}회`}
                    >
                      입상 {stats.placementCount}회
                    </Badge>
                  )}
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    aria-label="대회 기록 추가"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAdd();
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
                    추가
                  </Button>
                  {isOpen ? (
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
            </CollapsibleTrigger>
          </CardHeader>

          <CollapsibleContent id="dance-competition-content">
            <CardContent className="pt-0 space-y-4">
              {loading ? (
                <div className="space-y-2" aria-busy="true" aria-label="기록 불러오는 중">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                  ))}
                </div>
              ) : records.length === 0 ? (
                /* 빈 상태 */
                <div
                  className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-10"
                  role="status"
                  aria-label="대회 참가 기록 없음"
                >
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-muted"
                    aria-hidden="true"
                  >
                    <Trophy className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">
                      아직 대회 참가 기록이 없어요
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      참가한 댄스 대회/컴피티션 이력을 기록해 보세요
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="h-7 text-xs"
                    onClick={handleAdd}
                  >
                    <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
                    첫 기록 추가
                  </Button>
                </div>
              ) : (
                <>
                  {/* 통계 토글 */}
                  <button
                    type="button"
                    onClick={() => setShowStats((v) => !v)}
                    aria-expanded={showStats}
                    aria-controls="competition-stats-panel"
                    className="flex w-full items-center justify-between rounded-lg border bg-muted/30 px-3 py-2 text-xs text-muted-foreground hover:bg-muted transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <BarChart2 className="h-3.5 w-3.5" aria-hidden="true" />
                      통계 보기
                    </span>
                    {showStats ? (
                      <ChevronUp
                        className="h-3.5 w-3.5"
                        aria-hidden="true"
                      />
                    ) : (
                      <ChevronDown
                        className="h-3.5 w-3.5"
                        aria-hidden="true"
                      />
                    )}
                  </button>

                  {showStats && (
                    <div id="competition-stats-panel" className="space-y-3">
                      <StatsSection
                        stats={stats}
                        years={years}
                        genres={genres}
                      />
                    </div>
                  )}

                  {/* 필터 */}
                  {(years.length > 1 || genres.length > 1) && (
                    <div
                      className="flex flex-wrap items-center gap-2"
                      role="group"
                      aria-label="기록 필터"
                    >
                      <Filter
                        className="h-3.5 w-3.5 text-muted-foreground shrink-0"
                        aria-hidden="true"
                      />
                      {years.length > 1 && (
                        <div
                          role="group"
                          aria-label="연도 필터"
                          className="flex flex-wrap gap-1"
                        >
                          <button
                            type="button"
                            aria-pressed={filterYear === "all"}
                            onClick={() => setFilterYear("all")}
                            className={`rounded-full border px-2 py-0.5 text-[10px] transition-colors ${
                              filterYear === "all"
                                ? "border-primary bg-primary/10 text-primary font-medium"
                                : "border-border text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            전체 연도
                          </button>
                          {years.map((yr) => (
                            <button
                              key={yr}
                              type="button"
                              aria-pressed={filterYear === yr}
                              onClick={() => setFilterYear(yr)}
                              className={`rounded-full border px-2 py-0.5 text-[10px] transition-colors ${
                                filterYear === yr
                                  ? "border-primary bg-primary/10 text-primary font-medium"
                                  : "border-border text-muted-foreground hover:bg-muted"
                              }`}
                            >
                              {yr}
                            </button>
                          ))}
                        </div>
                      )}
                      {genres.length > 1 && (
                        <div
                          role="group"
                          aria-label="장르 필터"
                          className="flex flex-wrap gap-1"
                        >
                          <button
                            type="button"
                            aria-pressed={filterGenre === "all"}
                            onClick={() => setFilterGenre("all")}
                            className={`rounded-full border px-2 py-0.5 text-[10px] transition-colors ${
                              filterGenre === "all"
                                ? "border-secondary bg-secondary/10 text-secondary-foreground font-medium"
                                : "border-border text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            전체 장르
                          </button>
                          {genres.map((g) => (
                            <button
                              key={g}
                              type="button"
                              aria-pressed={filterGenre === g}
                              onClick={() => setFilterGenre(g)}
                              className={`rounded-full border px-2 py-0.5 text-[10px] transition-colors ${
                                filterGenre === g
                                  ? "border-secondary bg-secondary/10 text-secondary-foreground font-medium"
                                  : "border-border text-muted-foreground hover:bg-muted"
                              }`}
                            >
                              {g}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 필터 결과 없음 */}
                  {filteredRecords.length === 0 && (
                    <p
                      className="py-4 text-center text-xs text-muted-foreground"
                      role="status"
                      aria-live="polite"
                    >
                      해당 조건의 기록이 없습니다.
                    </p>
                  )}

                  {/* 타임라인 */}
                  {filteredRecords.length > 0 && (
                    <div
                      className="pt-1"
                      role="list"
                      aria-label="대회 참가 기록 목록"
                    >
                      {filteredRecords.map((record) => (
                        <RecordItem
                          key={record.id}
                          record={record}
                          onEdit={() => handleEdit(record)}
                          onDelete={() => handleDelete(record)}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* 다이얼로그 */}
      <RecordDialog
        open={showDialog}
        initial={editTarget ? recordToForm(editTarget) : EMPTY_FORM}
        onClose={() => setShowDialog(false)}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={deleteConfirm.onOpenChange}
        title="기록 삭제"
        description={`"${deleteConfirm.target?.competitionName}" 기록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        onConfirm={confirmDelete}
        destructive
      />
    </>
  );
}
