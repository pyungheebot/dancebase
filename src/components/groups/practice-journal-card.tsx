"use client";

import { useState } from "react";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  CalendarIcon,
  Clock,
  Users,
  Music,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Pencil,
  BarChart2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useGroupPracticeJournal } from "@/hooks/use-group-practice-journal";
import { formatYearMonthDay } from "@/lib/date-utils";
import type { GroupPracticeJournalEntry } from "@/types";

// ============================================
// 날짜/시간 헬퍼
// ============================================

function dateToYMD(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatYearMonth(ym: string): string {
  const [year, month] = ym.split("-");
  return `${year}년 ${Number(month)}월`;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}분`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}시간 ${m}분` : `${h}시간`;
}

// 줄바꿈으로 구분된 텍스트를 배열로 변환
function textToArray(text: string): string[] {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

// 배열을 줄바꿈으로 구분된 텍스트로 변환
function arrayToText(arr: string[]): string {
  return arr.join("\n");
}

// ============================================
// 일지 항목 상세 뷰
// ============================================

function JournalEntryDetail({ entry }: { entry: GroupPracticeJournalEntry }) {
  return (
    <div className="space-y-2.5 pt-2 border-t border-border/40">
      {/* 연습 내용 요약 */}
      {entry.contentSummary && (
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            연습 내용
          </p>
          <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-line">
            {entry.contentSummary}
          </p>
        </div>
      )}

      {/* 진행 곡/안무 */}
      {entry.songs.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1">
            <Music className="h-3 w-3" />
            진행 곡/안무
          </p>
          <div className="flex flex-wrap gap-1">
            {entry.songs.map((song, i) => (
              <Badge
                key={i}
                className="text-[10px] px-1.5 py-0 bg-purple-100 text-purple-700 border-purple-200"
              >
                {song}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* 달성 목표 */}
      {entry.achievedGoals.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-green-500" />
            달성 목표
          </p>
          <ul className="space-y-0.5">
            {entry.achievedGoals.map((goal, i) => (
              <li
                key={i}
                className="text-[10px] text-foreground/80 flex items-start gap-1 pl-1"
              >
                <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                {goal}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 미달성 사항 */}
      {entry.unachievedItems.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1">
            <XCircle className="h-3 w-3 text-orange-500" />
            미달성 사항
          </p>
          <ul className="space-y-0.5">
            {entry.unachievedItems.map((item, i) => (
              <li
                key={i}
                className="text-[10px] text-foreground/80 flex items-start gap-1 pl-1"
              >
                <span className="text-orange-400 mt-0.5 shrink-0">△</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 다음 연습 계획 */}
      {entry.nextPlanNote && (
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1">
            <ArrowRight className="h-3 w-3 text-blue-500" />
            다음 연습 계획
          </p>
          <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-line pl-1 border-l-2 border-blue-200">
            {entry.nextPlanNote}
          </p>
        </div>
      )}

      {/* 작성자 */}
      <p className="text-[9px] text-muted-foreground text-right">
        작성: {entry.authorName} &middot;{" "}
        {formatYearMonthDay(entry.createdAt)}
      </p>
    </div>
  );
}

// ============================================
// 일지 항목 (접이식)
// ============================================

function JournalEntryItem({
  entry,
  onDelete,
  onEdit,
}: {
  entry: GroupPracticeJournalEntry;
  onDelete: (id: string) => void;
  onEdit: (entry: GroupPracticeJournalEntry) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-border/60 rounded-md overflow-hidden">
      {/* 항목 헤더 */}
      <button
        type="button"
        className="w-full flex items-center gap-2 px-2.5 py-2 text-left hover:bg-muted/20 transition-colors"
        onClick={() => setExpanded((p) => !p)}
        aria-expanded={expanded}
      >
        <CalendarIcon className="h-3 w-3 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate">{formatYearMonthDay(entry.date)}</p>
          <p className="text-[9px] text-muted-foreground line-clamp-1">
            {entry.contentSummary || "내용 없음"}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatDuration(entry.durationMinutes)}
          </span>
          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
            <Users className="h-3 w-3" />
            {entry.participants.length}명
          </span>
        </div>

        {expanded ? (
          <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
        )}
      </button>

      {/* 항목 상세 */}
      {expanded && (
        <div className="px-2.5 pb-2.5">
          {/* 참여 멤버 */}
          {entry.participants.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-2 pb-2">
              {entry.participants.map((name, i) => (
                <Badge
                  key={i}
                  className="text-[10px] px-1.5 py-0 bg-cyan-100 text-cyan-700 border-cyan-200"
                >
                  {name}
                </Badge>
              ))}
            </div>
          )}

          <JournalEntryDetail entry={entry} />

          {/* 액션 버튼 */}
          <div className="flex gap-1.5 mt-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-6 text-[10px] flex-1 gap-1"
              onClick={() => onEdit(entry)}
            >
              <Pencil className="h-3 w-3" />
              수정
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 text-[10px] px-2 text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={() => onDelete(entry.id)}
              aria-label="일지 삭제"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// 월간 통계 뷰
// ============================================

function MonthlyStatsView({
  monthStats,
}: {
  monthStats: Array<{
    yearMonth: string;
    entryCount: number;
    totalMinutes: number;
    avgParticipants: number;
  }>;
}) {
  if (monthStats.length === 0) return null;

  return (
    <div className="bg-muted/20 rounded-md px-2.5 py-2 space-y-1.5">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
        <BarChart2 className="h-3 w-3" />
        월간 통계
      </p>
      <div className="space-y-1">
        {monthStats.slice(0, 4).map((stat) => (
          <div
            key={stat.yearMonth}
            className="flex items-center justify-between text-[10px]"
          >
            <span className="text-muted-foreground">
              {formatYearMonth(stat.yearMonth)}
            </span>
            <div className="flex items-center gap-2 text-foreground/70">
              <span>{stat.entryCount}회</span>
              <span className="text-orange-600 font-medium">
                {formatDuration(stat.totalMinutes)}
              </span>
              <span className="text-cyan-600">
                평균 {stat.avgParticipants.toFixed(1)}명
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// 일지 작성/수정 다이얼로그
// ============================================

type JournalFormState = {
  date: string;
  durationMinutes: number;
  participants: string;
  contentSummary: string;
  songs: string;
  achievedGoals: string;
  unachievedItems: string;
  nextPlanNote: string;
  authorName: string;
};

const DEFAULT_FORM: JournalFormState = {
  date: dateToYMD(new Date()),
  durationMinutes: 120,
  participants: "",
  contentSummary: "",
  songs: "",
  achievedGoals: "",
  unachievedItems: "",
  nextPlanNote: "",
  authorName: "",
};

function JournalFormDialog({
  open,
  onOpenChange,
  initialValues,
  memberNames,
  onSubmit,
  mode,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialValues?: Partial<JournalFormState>;
  memberNames: string[];
  onSubmit: (form: JournalFormState) => void;
  mode: "create" | "edit";
}) {
  const [form, setForm] = useState<JournalFormState>({
    ...DEFAULT_FORM,
    ...initialValues,
  });
  const [calOpen, setCalOpen] = useState(false);

  const setField = <K extends keyof JournalFormState>(
    key: K,
    value: JournalFormState[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleClose = () => {
    setForm({ ...DEFAULT_FORM, ...initialValues });
    setCalOpen(false);
    onOpenChange(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.date) {
      toast.error(TOAST.PRACTICE_JOURNAL.DATE_REQUIRED);
      return;
    }
    if (form.durationMinutes <= 0) {
      toast.error(TOAST.PRACTICE_JOURNAL.TIME_REQUIRED);
      return;
    }
    if (!form.authorName.trim()) {
      toast.error(TOAST.PRACTICE_JOURNAL.AUTHOR_REQUIRED);
      return;
    }
    onSubmit(form);
    handleClose();
  };

  const selectedDate = form.date ? new Date(form.date + "T00:00:00") : undefined;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-1.5">
            <BookOpen className="h-4 w-4 text-orange-500" />
            {mode === "create" ? "연습 일지 작성" : "연습 일지 수정"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
          {/* 날짜 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              연습 날짜
            </label>
            <Popover open={calOpen} onOpenChange={setCalOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-8 w-full justify-start text-xs font-normal",
                    !form.date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="h-3 w-3 mr-1.5 shrink-0" />
                  {form.date ? formatYearMonthDay(form.date) : "날짜 선택"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => {
                    if (d) setField("date", dateToYMD(d));
                    setCalOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* 연습 시간 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              연습 시간 (분)
            </label>
            <Input
              type="number"
              min={1}
              max={600}
              value={form.durationMinutes}
              onChange={(e) =>
                setField("durationMinutes", Number(e.target.value))
              }
              className="h-8 text-xs"
              placeholder="120"
            />
            {form.durationMinutes > 0 && (
              <p className="text-[10px] text-muted-foreground">
                = {formatDuration(form.durationMinutes)}
              </p>
            )}
          </div>

          {/* 참여 멤버 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              참여 멤버{" "}
              <span className="text-muted-foreground font-normal">
                (줄바꿈으로 구분)
              </span>
            </label>
            <Textarea
              placeholder={
                memberNames.length > 0
                  ? memberNames.slice(0, 3).join("\n") + "\n..."
                  : "김철수\n이영희\n박민준"
              }
              value={form.participants}
              onChange={(e) => setField("participants", e.target.value)}
              className="text-xs resize-none min-h-[64px]"
              maxLength={500}
            />
          </div>

          {/* 연습 내용 요약 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              연습 내용 요약
            </label>
            <Textarea
              placeholder="오늘 연습에서 진행한 내용을 요약해주세요."
              value={form.contentSummary}
              onChange={(e) => setField("contentSummary", e.target.value)}
              className="text-xs resize-none min-h-[72px]"
              maxLength={500}
            />
          </div>

          {/* 진행 곡/안무 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              진행 곡/안무{" "}
              <span className="text-muted-foreground font-normal">
                (줄바꿈으로 구분, 선택)
              </span>
            </label>
            <Textarea
              placeholder={"Dynamite - BTS\n춤 파트 1절 전체\n..."}
              value={form.songs}
              onChange={(e) => setField("songs", e.target.value)}
              className="text-xs resize-none min-h-[56px]"
              maxLength={300}
            />
          </div>

          {/* 달성 목표 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              달성 목표{" "}
              <span className="text-muted-foreground font-normal">
                (줄바꿈으로 구분, 선택)
              </span>
            </label>
            <Textarea
              placeholder={"1절 칼군무 완성\n포메이션 전환 연습"}
              value={form.achievedGoals}
              onChange={(e) => setField("achievedGoals", e.target.value)}
              className="text-xs resize-none min-h-[56px]"
              maxLength={300}
            />
          </div>

          {/* 미달성 사항 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              미달성 사항{" "}
              <span className="text-muted-foreground font-normal">
                (줄바꿈으로 구분, 선택)
              </span>
            </label>
            <Textarea
              placeholder={"2절 마무리 동작\n엔딩 포즈 통일"}
              value={form.unachievedItems}
              onChange={(e) => setField("unachievedItems", e.target.value)}
              className="text-xs resize-none min-h-[56px]"
              maxLength={300}
            />
          </div>

          {/* 다음 연습 계획 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              다음 연습 계획{" "}
              <span className="text-muted-foreground font-normal">(선택)</span>
            </label>
            <Textarea
              placeholder="다음 연습에서 집중할 내용을 적어주세요."
              value={form.nextPlanNote}
              onChange={(e) => setField("nextPlanNote", e.target.value)}
              className="text-xs resize-none min-h-[56px]"
              maxLength={300}
            />
          </div>

          {/* 작성자 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              작성자
            </label>
            <Input
              placeholder="이름을 입력하세요"
              value={form.authorName}
              onChange={(e) => setField("authorName", e.target.value)}
              className="h-8 text-xs"
              maxLength={30}
              list="journal-member-names"
            />
            <datalist id="journal-member-names">
              {memberNames.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={handleClose}
            >
              취소
            </Button>
            <Button type="submit" size="sm" className="h-7 text-xs">
              {mode === "create" ? "작성" : "저장"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 메인 카드 컴포넌트
// ============================================

type PracticeJournalCardProps = {
  groupId: string;
  memberNames?: string[];
};

export function PracticeJournalCard({
  groupId,
  memberNames = [],
}: PracticeJournalCardProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<GroupPracticeJournalEntry | null>(
    null
  );

  const {
    entries,
    loading,
    addEntry,
    updateEntry,
    deleteEntry,
    monthStats,
    totalMinutes,
    currentMonthMinutes,
  } = useGroupPracticeJournal(groupId);

  const handleCreate = (form: {
    date: string;
    durationMinutes: number;
    participants: string;
    contentSummary: string;
    songs: string;
    achievedGoals: string;
    unachievedItems: string;
    nextPlanNote: string;
    authorName: string;
  }) => {
    const ok = addEntry({
      date: form.date,
      durationMinutes: form.durationMinutes,
      participants: textToArray(form.participants),
      contentSummary: form.contentSummary.trim(),
      songs: textToArray(form.songs),
      achievedGoals: textToArray(form.achievedGoals),
      unachievedItems: textToArray(form.unachievedItems),
      nextPlanNote: form.nextPlanNote.trim(),
      authorName: form.authorName.trim(),
    });
    if (ok) {
      toast.success(TOAST.PRACTICE_JOURNAL.WRITTEN);
    } else {
      toast.error(TOAST.PRACTICE_JOURNAL.WRITE_ERROR);
    }
  };

  const handleEdit = (form: {
    date: string;
    durationMinutes: number;
    participants: string;
    contentSummary: string;
    songs: string;
    achievedGoals: string;
    unachievedItems: string;
    nextPlanNote: string;
    authorName: string;
  }) => {
    if (!editTarget) return;
    const ok = updateEntry(editTarget.id, {
      date: form.date,
      durationMinutes: form.durationMinutes,
      participants: textToArray(form.participants),
      contentSummary: form.contentSummary.trim(),
      songs: textToArray(form.songs),
      achievedGoals: textToArray(form.achievedGoals),
      unachievedItems: textToArray(form.unachievedItems),
      nextPlanNote: form.nextPlanNote.trim(),
      authorName: form.authorName.trim(),
    });
    if (ok) {
      toast.success(TOAST.PRACTICE_JOURNAL.UPDATED);
    } else {
      toast.error(TOAST.PRACTICE_JOURNAL.UPDATE_ERROR);
    }
    setEditTarget(null);
  };

  const handleDelete = (id: string) => {
    deleteEntry(id);
    toast.success(TOAST.PRACTICE_JOURNAL.DELETED);
  };

  const editInitialValues = editTarget
    ? {
        date: editTarget.date,
        durationMinutes: editTarget.durationMinutes,
        participants: arrayToText(editTarget.participants),
        contentSummary: editTarget.contentSummary,
        songs: arrayToText(editTarget.songs),
        achievedGoals: arrayToText(editTarget.achievedGoals),
        unachievedItems: arrayToText(editTarget.unachievedItems),
        nextPlanNote: editTarget.nextPlanNote,
        authorName: editTarget.authorName,
      }
    : undefined;

  return (
    <>
      <div className="rounded-lg border bg-card p-3 space-y-2">
        {/* 헤더 */}
        <button
          type="button"
          className="w-full flex items-center gap-1.5 text-left"
          onClick={() => setCollapsed((prev) => !prev)}
          aria-expanded={!collapsed}
        >
          <BookOpen className="h-3.5 w-3.5 text-orange-500 shrink-0" />
          <span className="text-xs font-medium flex-1">연습 일지 요약</span>

          {currentMonthMinutes > 0 && (
            <span className="text-[10px] text-orange-600 font-semibold shrink-0">
              이번 달 {formatDuration(currentMonthMinutes)}
            </span>
          )}

          {entries.length > 0 && (
            <span className="text-[10px] px-1.5 py-0 rounded bg-orange-100 text-orange-700 font-semibold shrink-0">
              {entries.length}건
            </span>
          )}

          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          )}
        </button>

        {!collapsed && (
          <div className="space-y-2">
            {/* 요약 통계 */}
            {entries.length > 0 && (
              <div className="bg-orange-50 dark:bg-orange-950/30 rounded-md px-2.5 py-2 flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-orange-500" />
                  <div>
                    <p className="text-xs font-bold text-orange-700">
                      {formatDuration(totalMinutes)}
                    </p>
                    <p className="text-[9px] text-muted-foreground">총 연습</p>
                  </div>
                </div>
                <div className="w-px h-8 bg-border/60" />
                <div className="flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-amber-500" />
                  <div>
                    <p className="text-xs font-bold text-amber-700">
                      {entries.length}
                    </p>
                    <p className="text-[9px] text-muted-foreground">총 일지</p>
                  </div>
                </div>
                <div className="w-px h-8 bg-border/60" />
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-blue-500" />
                  <div>
                    <p className="text-xs font-bold text-blue-700">
                      {formatDuration(currentMonthMinutes)}
                    </p>
                    <p className="text-[9px] text-muted-foreground">이번 달</p>
                  </div>
                </div>
              </div>
            )}

            {/* 월간 통계 토글 */}
            {monthStats.length > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowStats((p) => !p)}
                  className="text-[10px] text-indigo-600 hover:underline flex items-center gap-0.5"
                >
                  {showStats ? "통계 접기" : "월간 통계 보기"}
                  {showStats ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </button>
                {showStats && <MonthlyStatsView monthStats={monthStats} />}
              </div>
            )}

            {/* 일지 목록 */}
            {loading ? (
              <p className="text-[10px] text-muted-foreground text-center py-3">
                불러오는 중...
              </p>
            ) : entries.length > 0 ? (
              <div className="space-y-1.5">
                {entries.map((entry) => (
                  <JournalEntryItem
                    key={entry.id}
                    entry={entry}
                    onDelete={handleDelete}
                    onEdit={setEditTarget}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 gap-1.5 text-muted-foreground">
                <BookOpen className="h-5 w-5" />
                <p className="text-xs">작성된 연습 일지가 없습니다</p>
                <p className="text-[10px]">
                  아래 버튼을 눌러 첫 일지를 작성해보세요
                </p>
              </div>
            )}

            {/* 구분선 */}
            {entries.length > 0 && (
              <div className="border-t border-border/40" />
            )}

            {/* 일지 작성 버튼 */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs w-full justify-start text-muted-foreground hover:text-foreground gap-1.5"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="h-3 w-3" />
              연습 일지 작성
            </Button>
          </div>
        )}
      </div>

      {/* 작성 다이얼로그 */}
      <JournalFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        memberNames={memberNames}
        onSubmit={handleCreate}
        mode="create"
      />

      {/* 수정 다이얼로그 */}
      {editTarget && (
        <JournalFormDialog
          open={!!editTarget}
          onOpenChange={(v) => {
            if (!v) setEditTarget(null);
          }}
          initialValues={editInitialValues}
          memberNames={memberNames}
          onSubmit={handleEdit}
          mode="edit"
        />
      )}
    </>
  );
}
