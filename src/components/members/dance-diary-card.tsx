"use client";

// ─── 댄스 일기 카드 (컨테이너) ───────────────────────────────────────────────
// 서브컴포넌트를 조합하는 최상위 컨테이너.
// 상태 관리 및 데이터 흐름을 담당하고, 렌더링은 서브컴포넌트에 위임.

import { useState, useCallback } from "react";
import {
  BookOpen,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Flame,
  Pencil,
  Plus,
} from "lucide-react";
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
import { formatYearMonthDay } from "@/lib/date-utils";
import { useDanceDiary } from "@/hooks/use-dance-diary";
import type { DiaryCardEntry } from "@/types";

// 서브컴포넌트
import { CalendarHeatmap } from "./diary-calendar-heatmap";
import { DiaryEntryItem, DiaryEntryEditor } from "./diary-entry-editor";
import { DiaryStatSummary, DiaryStatsTab } from "./diary-stat-summary";
import { getTodayStr, getDefaultForm } from "./dance-diary-types";
import type { DiaryForm } from "./dance-diary-types";

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────

export function DanceDiaryCard({ memberId }: { memberId: string }) {
  // ── 접기/펼치기 상태 ──
  const [open, setOpen] = useState(false);

  // ── 캘린더 상태 ──
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState(getTodayStr());

  // ── 폼 상태 ──
  const [formVisible, setFormVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DiaryForm>(getDefaultForm(getTodayStr()));

  // ── 탭 상태 ──
  const [activeTab, setActiveTab] = useState<"list" | "stats">("list");

  // ── 데이터 훅 ──
  const {
    entries,
    loading,
    addEntry,
    updateEntry,
    deleteEntry,
    getMonthHeatmap,
    getEmotionStats,
    getConditionTrend,
    getStreak,
  } = useDanceDiary(memberId);

  // 파생 데이터 계산
  const heatmap = getMonthHeatmap(calYear, calMonth);
  const emotionStats = getEmotionStats();
  const conditionTrend = getConditionTrend();
  const streak = getStreak();

  // 현재 월 항목 필터링
  const monthEntries = entries.filter((e) =>
    e.date.startsWith(`${calYear}-${String(calMonth).padStart(2, "0")}`)
  );

  // 평균 컨디션 계산
  const avgCondition =
    entries.length > 0
      ? entries.reduce((s, e) => s + e.condition, 0) / entries.length
      : null;

  // 선택 날짜의 항목
  const selectedEntry = entries.find((e) => e.date === selectedDate);

  // ── 이벤트 핸들러 ──

  /** 신규 폼 열기 */
  const openNewForm = useCallback(() => {
    setForm(getDefaultForm(selectedDate));
    setEditingId(null);
    setFormVisible(true);
  }, [selectedDate]);

  /** 수정 폼 열기 */
  const openEditForm = useCallback((entry: DiaryCardEntry) => {
    setForm({
      date: entry.date,
      title: entry.title,
      content: entry.content,
      emotion: entry.emotion,
      condition: entry.condition,
      discovery: entry.discovery,
      tags: [...entry.tags],
    });
    setEditingId(entry.id);
    setFormVisible(true);
  }, []);

  /** 폼 닫기 */
  const closeForm = useCallback(() => {
    setFormVisible(false);
    setEditingId(null);
  }, []);

  /** 폼 필드 변경 핸들러 */
  const handleFormChange = useCallback((patch: Partial<DiaryForm>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  }, []);

  /** 저장 핸들러 */
  const handleSave = useCallback(() => {
    if (!form.date) {
      toast.error(TOAST.MEMBERS.DIARY_DATE_REQUIRED);
      return;
    }
    if (!form.title.trim() && !form.content.trim()) {
      toast.error(TOAST.MEMBERS.DIARY_TITLE_CONTENT_REQUIRED);
      return;
    }
    if (editingId) {
      updateEntry(editingId, form);
      toast.success(TOAST.MEMBERS.DIARY_UPDATED);
    } else {
      addEntry(form);
      toast.success(TOAST.MEMBERS.DIARY_SAVED);
    }
    closeForm();
  }, [form, editingId, addEntry, updateEntry, closeForm]);

  /** 삭제 핸들러 */
  const handleDelete = useCallback(
    (id: string) => {
      deleteEntry(id);
      toast.success(TOAST.MEMBERS.DIARY_DELETED);
    },
    [deleteEntry]
  );

  /** 날짜 선택 핸들러 */
  const handleSelectDate = useCallback((date: string) => {
    setSelectedDate(date);
    setFormVisible(false);
    setEditingId(null);
  }, []);

  /** 이전 달 이동 */
  const prevMonth = useCallback(() => {
    if (calMonth === 1) {
      setCalYear((y) => y - 1);
      setCalMonth(12);
    } else {
      setCalMonth((m) => m - 1);
    }
  }, [calMonth]);

  /** 다음 달 이동 */
  const nextMonth = useCallback(() => {
    if (calMonth === 12) {
      setCalYear((y) => y + 1);
      setCalMonth(1);
    } else {
      setCalMonth((m) => m + 1);
    }
  }, [calMonth]);

  // ── 렌더링 ──

  return (
    <Card>
      <Collapsible open={open} onOpenChange={setOpen}>
        {/* 헤더 (접기/펼치기 트리거) */}
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-indigo-500" aria-hidden="true" />
                댄스 일기
              </CardTitle>
              <div className="flex items-center gap-2">
                {entries.length > 0 && (
                  <div
                    className="flex items-center gap-1.5 text-xs text-muted-foreground"
                    aria-label={`${streak}일 연속, 총 ${entries.length}건`}
                  >
                    <Flame className="h-3 w-3 text-orange-500" aria-hidden="true" />
                    <span>{streak}일 연속</span>
                    <span className="text-muted-foreground/40" aria-hidden="true">|</span>
                    <span>총 {entries.length}건</span>
                  </div>
                )}
                {open ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 pb-4 space-y-4">
            {loading ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                불러오는 중...
              </p>
            ) : (
              <>
                {/* ── 통계 요약 배지 3개 ── */}
                <DiaryStatSummary
                  streak={streak}
                  totalCount={entries.length}
                  avgCondition={avgCondition}
                />

                {/* ── 캘린더 히트맵 영역 ── */}
                <div className="space-y-2">
                  {/* 캘린더 헤더: 연월 + 이전/다음 달 버튼 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-medium">
                      <CalendarDays
                        className="h-3.5 w-3.5 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <span aria-live="polite">
                        {calYear}년 {calMonth}월
                      </span>
                      <span className="text-[10px] text-muted-foreground font-normal">
                        ({monthEntries.length}건)
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={prevMonth}
                        aria-label="이전 달"
                      >
                        <ChevronDown className="h-3 w-3 rotate-90" aria-hidden="true" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={nextMonth}
                        aria-label="다음 달"
                      >
                        <ChevronDown className="h-3 w-3 -rotate-90" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>

                  <CalendarHeatmap
                    year={calYear}
                    month={calMonth}
                    heatmap={heatmap}
                    entries={monthEntries}
                    selectedDate={selectedDate}
                    onSelectDate={handleSelectDate}
                  />
                </div>

                {/* ── 선택 날짜 표시 + 일기 쓰기/수정 버튼 ── */}
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground" aria-live="polite">
                    {formatYearMonthDay(selectedDate)}
                  </p>
                  {!formVisible && !selectedEntry && (
                    <Button
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={openNewForm}
                      aria-label={`${formatYearMonthDay(selectedDate)} 일기 쓰기`}
                    >
                      <Plus className="h-3 w-3" aria-hidden="true" />
                      일기 쓰기
                    </Button>
                  )}
                  {!formVisible && selectedEntry && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1"
                      onClick={() => openEditForm(selectedEntry)}
                      aria-label={`${formatYearMonthDay(selectedDate)} 일기 수정`}
                    >
                      <Pencil className="h-3 w-3" aria-hidden="true" />
                      수정
                    </Button>
                  )}
                </div>

                {/* ── 작성/수정 인라인 폼 ── */}
                {formVisible && (
                  <DiaryEntryEditor
                    form={form}
                    isEditing={!!editingId}
                    onChange={handleFormChange}
                    onSave={handleSave}
                    onClose={closeForm}
                  />
                )}

                {/* ── 항목이 있을 때: 탭 전환 + 목록/통계 ── */}
                {entries.length > 0 && (
                  <>
                    {/* 탭 헤더 */}
                    <div className="flex gap-1 border-b" role="tablist" aria-label="일기 보기 방식">
                      <button
                        type="button"
                        role="tab"
                        aria-selected={activeTab === "list"}
                        aria-controls="diary-tab-list"
                        id="diary-tabbutton-list"
                        onClick={() => setActiveTab("list")}
                        className={cn(
                          "text-xs pb-1.5 px-1 border-b-2 transition-colors",
                          activeTab === "list"
                            ? "border-primary text-primary font-medium"
                            : "border-transparent text-muted-foreground"
                        )}
                      >
                        최근 기록
                      </button>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={activeTab === "stats"}
                        aria-controls="diary-tab-stats"
                        id="diary-tabbutton-stats"
                        onClick={() => setActiveTab("stats")}
                        className={cn(
                          "text-xs pb-1.5 px-1 border-b-2 transition-colors",
                          activeTab === "stats"
                            ? "border-primary text-primary font-medium"
                            : "border-transparent text-muted-foreground"
                        )}
                      >
                        감정/컨디션 통계
                      </button>
                    </div>

                    {/* 최근 기록 탭 */}
                    {activeTab === "list" && (
                      <div
                        id="diary-tab-list"
                        role="tabpanel"
                        aria-labelledby="diary-tabbutton-list"
                        className="space-y-2 max-h-80 overflow-y-auto pr-1"
                      >
                        {entries.map((entry) => (
                          <DiaryEntryItem
                            key={entry.id}
                            entry={entry}
                            onDelete={handleDelete}
                            onEdit={openEditForm}
                          />
                        ))}
                      </div>
                    )}

                    {/* 통계 탭 */}
                    {activeTab === "stats" && (
                      <div
                        id="diary-tab-stats"
                        role="tabpanel"
                        aria-labelledby="diary-tabbutton-stats"
                      >
                        <DiaryStatsTab
                          stats={emotionStats}
                          total={entries.length}
                          trend={conditionTrend}
                        />
                      </div>
                    )}
                  </>
                )}

                {/* ── 빈 상태 ── */}
                {entries.length === 0 && !formVisible && (
                  <div className="text-center py-6 space-y-2">
                    <BookOpen
                      className="h-8 w-8 text-muted-foreground/30 mx-auto"
                      aria-hidden="true"
                    />
                    <p className="text-xs text-muted-foreground">
                      아직 작성된 댄스 일기가 없습니다.
                    </p>
                    <Button
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={openNewForm}
                    >
                      <Plus className="h-3 w-3" aria-hidden="true" />
                      첫 일기 쓰기
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
