"use client";

// ============================================
// 멤버 성장 일지 카드 (메인 컴포넌트)
// ============================================

import { useState, useCallback } from "react";
import { useAsyncAction } from "@/hooks/use-async-action";
import { Notebook, ChevronDown, ChevronUp, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useGrowthJournal } from "@/hooks/use-growth-journal";
import type { GrowthJournalEntry, GrowthJournalMood } from "@/types";

import { type FormValues, parseList } from "./growth-journal-types";
import { JournalDialog } from "./growth-journal-dialog";
import { EntryCard } from "./growth-journal-entry-card";
import { StatsPanel } from "./growth-journal-stats-panel";

// ============================================
// 통계 계산 헬퍼 (메인 컴포넌트에서 사용)
// ============================================

function calcStats(entries: GrowthJournalEntry[]) {
  const totalEntries = entries.length;

  const averageSelfRating =
    entries.length > 0
      ? Math.round(
          (entries.reduce((sum, e) => sum + e.selfRating, 0) /
            entries.length) *
            10
        ) / 10
      : 0;

  const moodDistribution = entries.reduce<Record<string, number>>((acc, e) => {
    acc[e.mood] = (acc[e.mood] ?? 0) + 1;
    return acc;
  }, {}) as Record<GrowthJournalMood, number>;

  const skillCountMap = entries
    .flatMap((e) => e.skillsPracticed)
    .reduce<Record<string, number>>((acc, skill) => {
      acc[skill] = (acc[skill] ?? 0) + 1;
      return acc;
    }, {});

  const topSkillsPracticed = Object.entries(skillCountMap)
    .map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return { totalEntries, averageSelfRating, moodDistribution, topSkillsPracticed };
}

// ============================================
// Props
// ============================================

interface GrowthJournalCardProps {
  groupId: string;
  memberNames: string[];
}

// ============================================
// 메인 컴포넌트
// ============================================

export function GrowthJournalCard({
  groupId,
  memberNames,
}: GrowthJournalCardProps) {
  // 카드 열림 상태
  const [open, setOpen] = useState(false);
  // 다이얼로그 열림 상태
  const [dialogOpen, setDialogOpen] = useState(false);
  // 수정 대상 일지 (null이면 신규 작성)
  const [editTarget, setEditTarget] = useState<GrowthJournalEntry | null>(null);
  // 멤버 필터 ("all" 또는 멤버명)
  const [filterMember, setFilterMember] = useState<string>("all");

  const { pending: submitting, execute } = useAsyncAction();

  const { entries, loading, addEntry, updateEntry, deleteEntry } =
    useGrowthJournal(groupId);

  // 통계 계산
  const { totalEntries, averageSelfRating, moodDistribution, topSkillsPracticed } =
    calcStats(entries);

  // 멤버 필터 + 날짜 최신순 정렬
  const displayed = [...entries]
    .filter((e) => filterMember === "all" || e.memberName === filterMember)
    .sort((a, b) => b.date.localeCompare(a.date));

  // 신규 일지 저장
  const handleAdd = useCallback(
    async (values: FormValues) => {
      await execute(async () => {
        addEntry({
          memberName: values.memberName,
          date: values.date,
          title: values.title,
          content: values.content,
          mood: values.mood,
          skillsPracticed: parseList(values.skillsPracticed),
          achievementsToday: parseList(values.achievementsToday),
          challengesFaced: parseList(values.challengesFaced),
          nextGoals: parseList(values.nextGoals),
          selfRating: values.selfRating,
        });
        toast.success(TOAST.MEMBERS.GROWTH_JOURNAL_SAVE_SUCCESS);
        setDialogOpen(false);
      });
    },
    [addEntry, execute]
  );

  // 일지 수정
  const handleUpdate = useCallback(
    async (values: FormValues) => {
      if (!editTarget) return;
      await execute(async () => {
        updateEntry(editTarget.id, {
          memberName: values.memberName,
          date: values.date,
          title: values.title,
          content: values.content,
          mood: values.mood,
          skillsPracticed: parseList(values.skillsPracticed),
          achievementsToday: parseList(values.achievementsToday),
          challengesFaced: parseList(values.challengesFaced),
          nextGoals: parseList(values.nextGoals),
          selfRating: values.selfRating,
        });
        toast.success(TOAST.MEMBERS.GROWTH_JOURNAL_UPDATED);
        setDialogOpen(false);
        setEditTarget(null);
      });
    },
    [editTarget, updateEntry, execute]
  );

  // 일지 삭제
  const handleDelete = useCallback(
    (id: string) => {
      deleteEntry(id);
      toast.success(TOAST.MEMBERS.GROWTH_JOURNAL_DELETED);
    },
    [deleteEntry]
  );

  // 수정 모드 전환
  const handleEdit = useCallback((entry: GrowthJournalEntry) => {
    setEditTarget(entry);
    setDialogOpen(true);
  }, []);

  // 다이얼로그 닫기 시 수정 대상 초기화
  const handleDialogOpenChange = useCallback((next: boolean) => {
    setDialogOpen(next);
    if (!next) setEditTarget(null);
  }, []);

  // 카드 접을 때 멤버 필터 초기화
  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next);
    if (!next) setFilterMember("all");
  }, []);

  const headerId = "growth-journal-header";

  return (
    <>
      <Collapsible open={open} onOpenChange={handleOpenChange}>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          {/* 카드 헤더 (접기/펼치기 트리거) */}
          <CollapsibleTrigger asChild>
            <button
              type="button"
              id={headerId}
              aria-expanded={open}
              aria-controls="growth-journal-content"
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors rounded-lg"
            >
              <div className="flex items-center gap-2">
                <Notebook
                  className="h-4 w-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <span className="text-sm font-medium">멤버 성장 일지</span>
                {totalEntries > 0 && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0"
                    aria-label={`총 ${totalEntries}개 일지`}
                  >
                    {totalEntries}개
                  </Badge>
                )}
              </div>
              {open ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              )}
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent id="growth-journal-content">
            <div
              className="px-4 pb-4 border-t pt-3 space-y-3"
              aria-labelledby={headerId}
            >
              {loading ? (
                <p
                  className="text-xs text-muted-foreground text-center py-4"
                  aria-live="polite"
                >
                  불러오는 중...
                </p>
              ) : (
                <div className="space-y-3">
                  {/* 성장 통계 패널 */}
                  {totalEntries > 0 && (
                    <StatsPanel
                      entries={entries}
                      totalEntries={totalEntries}
                      averageSelfRating={averageSelfRating}
                      moodDistribution={moodDistribution}
                      topSkillsPracticed={topSkillsPracticed}
                    />
                  )}

                  {/* 일지 작성 버튼 */}
                  <Button
                    size="sm"
                    className="w-full h-7 text-xs"
                    onClick={() => {
                      setEditTarget(null);
                      setDialogOpen(true);
                    }}
                    disabled={memberNames.length === 0}
                    aria-label="성장 일지 작성"
                  >
                    <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
                    성장 일지 작성
                  </Button>

                  {/* 멤버 필터 (멤버 2명 이상 && 일지 존재 시) */}
                  {entries.length > 0 && memberNames.length > 1 && (
                    <div
                      className="flex flex-wrap gap-1"
                      role="group"
                      aria-label="멤버 필터"
                    >
                      <Badge
                        variant={filterMember === "all" ? "default" : "outline"}
                        className="text-[10px] px-1.5 py-0 cursor-pointer"
                        onClick={() => setFilterMember("all")}
                        aria-pressed={filterMember === "all"}
                      >
                        전체
                      </Badge>
                      {memberNames.map((name) => (
                        <Badge
                          key={name}
                          variant={filterMember === name ? "default" : "outline"}
                          className="text-[10px] px-1.5 py-0 cursor-pointer"
                          onClick={() =>
                            setFilterMember((prev) =>
                              prev === name ? "all" : name
                            )
                          }
                          aria-pressed={filterMember === name}
                        >
                          {name}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* 일지 목록 */}
                  {displayed.length === 0 ? (
                    <div className="text-center py-6">
                      <Notebook
                        className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2"
                        aria-hidden="true"
                      />
                      <p className="text-xs text-muted-foreground">
                        {entries.length === 0
                          ? "아직 작성한 성장 일지가 없습니다."
                          : "해당 멤버의 일지가 없습니다."}
                      </p>
                    </div>
                  ) : (
                    <div
                      className="space-y-2"
                      role="list"
                      aria-label="성장 일지 목록"
                    >
                      {displayed.map((entry) => (
                        <div key={entry.id} role="listitem">
                          <EntryCard
                            entry={entry}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* 일지 작성/수정 다이얼로그 */}
      <JournalDialog
        open={dialogOpen}
        onOpenChange={handleDialogOpenChange}
        initial={editTarget ?? undefined}
        memberNames={memberNames}
        defaultMember={filterMember !== "all" ? filterMember : memberNames[0]}
        onSubmit={editTarget ? handleUpdate : handleAdd}
        submitting={submitting}
      />
    </>
  );
}
