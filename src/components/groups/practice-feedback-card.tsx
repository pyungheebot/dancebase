"use client";

import { useState, useMemo } from "react";
import {
  MessageCircle,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  CalendarIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { usePracticeFeedback } from "@/hooks/use-practice-feedback";
import type { PracticeFeedbackMood, PracticeFeedbackEntry } from "@/types";

// ============================================
// 상수
// ============================================

const MOOD_META: Record<
  PracticeFeedbackMood,
  { emoji: string; label: string; color: string }
> = {
  great: { emoji: "😄", label: "최고", color: "bg-green-100 text-green-700" },
  good: { emoji: "😊", label: "좋음", color: "bg-blue-100 text-blue-700" },
  okay: { emoji: "😐", label: "보통", color: "bg-gray-100 text-gray-600" },
  tired: { emoji: "😫", label: "피곤", color: "bg-yellow-100 text-yellow-700" },
  frustrated: {
    emoji: "😤",
    label: "힘듦",
    color: "bg-red-100 text-red-700",
  },
};

const MOOD_ORDER: PracticeFeedbackMood[] = [
  "great",
  "good",
  "okay",
  "tired",
  "frustrated",
];

// ============================================
// 날짜 헬퍼
// ============================================

function formatDate(ymd: string): string {
  const d = new Date(ymd + "T00:00:00");
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function dateToYMD(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

// ============================================
// 평균 스코어 바 (가로)
// ============================================

function ScoreBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const pct = Math.round((value / 5) * 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-muted-foreground w-10 shrink-0">
        {label}
      </span>
      <div className="flex-1 bg-muted/40 rounded-full h-2 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] font-mono text-muted-foreground w-6 text-right shrink-0">
        {value.toFixed(1)}
      </span>
    </div>
  );
}

// ============================================
// 무드 분포 바
// ============================================

function MoodDistributionBar({
  distribution,
  total,
}: {
  distribution: Record<PracticeFeedbackMood, number>;
  total: number;
}) {
  if (total === 0) return null;

  return (
    <div className="space-y-1">
      {MOOD_ORDER.map((mood) => {
        const count = distribution[mood] ?? 0;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        const meta = MOOD_META[mood];
        return (
          <div key={mood} className="flex items-center gap-2">
            <span className="text-[11px] w-5 shrink-0">{meta.emoji}</span>
            <span className="text-[10px] text-muted-foreground w-8 shrink-0">
              {meta.label}
            </span>
            <div className="flex-1 bg-muted/40 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full rounded-full bg-indigo-400 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-muted-foreground w-8 text-right shrink-0">
              {count > 0 ? `${count}명 (${pct}%)` : "-"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// 피드백 항목
// ============================================

function FeedbackItem({
  entry,
  onDelete,
}: {
  entry: PracticeFeedbackEntry;
  onDelete: (id: string) => void;
}) {
  const meta = MOOD_META[entry.mood];
  return (
    <div className="bg-muted/30 rounded-md px-2.5 py-2 space-y-1.5">
      {/* 헤더 */}
      <div className="flex items-center gap-1.5">
        <span className="text-[11px]">{meta.emoji}</span>
        <span className="text-xs font-semibold flex-1 truncate">
          {entry.memberName}
        </span>
        <span className="text-[10px] text-muted-foreground shrink-0">
          {formatDate(entry.date)}
        </span>
        <span
          className={cn(
            "text-[9px] px-1.5 py-0 rounded-full font-medium shrink-0",
            meta.color
          )}
        >
          {meta.label}
        </span>
        <button
          type="button"
          onClick={() => onDelete(entry.id)}
          aria-label="피드백 삭제"
          className="shrink-0 ml-0.5"
        >
          <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500 transition-colors" />
        </button>
      </div>

      {/* 점수 */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-orange-600 font-medium">에너지</span>
          <span className="text-[10px] font-semibold">{entry.energyLevel}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-blue-600 font-medium">집중</span>
          <span className="text-[10px] font-semibold">{entry.focusLevel}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-green-600 font-medium">즐거움</span>
          <span className="text-[10px] font-semibold">{entry.enjoymentLevel}</span>
        </div>
      </div>

      {/* 텍스트 필드 */}
      {entry.learnedToday && (
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          <span className="font-medium text-foreground/70">오늘 배운 것: </span>
          {entry.learnedToday}
        </p>
      )}
      {entry.wantToImprove && (
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          <span className="font-medium text-foreground/70">개선하고 싶은 점: </span>
          {entry.wantToImprove}
        </p>
      )}
      {entry.generalComment && (
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          <span className="font-medium text-foreground/70">코멘트: </span>
          {entry.generalComment}
        </p>
      )}
    </div>
  );
}

// ============================================
// 피드백 작성 다이얼로그
// ============================================

function AddFeedbackDialog({
  open,
  onOpenChange,
  memberNames,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  memberNames: string[];
  onAdd: (params: {
    memberName: string;
    date: string;
    mood: PracticeFeedbackMood;
    energyLevel: number;
    focusLevel: number;
    enjoymentLevel: number;
    learnedToday?: string;
    wantToImprove?: string;
    generalComment?: string;
  }) => boolean;
}) {
  const [memberName, setMemberName] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [calOpen, setCalOpen] = useState(false);
  const [mood, setMood] = useState<PracticeFeedbackMood | null>(null);
  const [energyLevel, setEnergyLevel] = useState(3);
  const [focusLevel, setFocusLevel] = useState(3);
  const [enjoymentLevel, setEnjoymentLevel] = useState(3);
  const [learnedToday, setLearnedToday] = useState("");
  const [wantToImprove, setWantToImprove] = useState("");
  const [generalComment, setGeneralComment] = useState("");

  const reset = () => {
    setMemberName("");
    setDate(new Date());
    setMood(null);
    setEnergyLevel(3);
    setFocusLevel(3);
    setEnjoymentLevel(3);
    setLearnedToday("");
    setWantToImprove("");
    setGeneralComment("");
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberName) {
      toast.error(TOAST.PRACTICE_FEEDBACK_CARD.MEMBER_REQUIRED);
      return;
    }
    if (!date) {
      toast.error(TOAST.PRACTICE_FEEDBACK_CARD.DATE_REQUIRED);
      return;
    }
    if (!mood) {
      toast.error(TOAST.PRACTICE_FEEDBACK_CARD.MOOD_REQUIRED);
      return;
    }

    const ok = onAdd({
      memberName,
      date: dateToYMD(date),
      mood,
      energyLevel,
      focusLevel,
      enjoymentLevel,
      learnedToday: learnedToday.trim() || undefined,
      wantToImprove: wantToImprove.trim() || undefined,
      generalComment: generalComment.trim() || undefined,
    });

    if (!ok) {
      toast.error(TOAST.PRACTICE_FEEDBACK.REGISTER_ERROR);
      return;
    }
    toast.success(TOAST.PRACTICE_FEEDBACK.REGISTERED);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-1.5">
            <MessageCircle className="h-4 w-4 text-indigo-500" />
            연습 피드백 작성
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
          {/* 멤버 선택 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">멤버</label>
            <Select value={memberName} onValueChange={setMemberName}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="멤버 선택" />
              </SelectTrigger>
              <SelectContent>
                {memberNames.map((name) => (
                  <SelectItem key={name} value={name} className="text-xs">
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 날짜 선택 */}
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
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="h-3 w-3 mr-1.5 shrink-0" />
                  {date ? dateToYMD(date) : "날짜 선택"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => {
                    setDate(d);
                    setCalOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* 무드 선택 */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              오늘의 무드
            </label>
            <div className="flex gap-2">
              {MOOD_ORDER.map((m) => {
                const meta = MOOD_META[m];
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMood(m)}
                    className={cn(
                      "flex flex-col items-center gap-0.5 flex-1 py-1.5 rounded-md border transition-all",
                      mood === m
                        ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-950/40"
                        : "border-border bg-transparent hover:bg-muted/40"
                    )}
                    aria-label={meta.label}
                  >
                    <span className="text-lg leading-none">{meta.emoji}</span>
                    <span className="text-[9px] text-muted-foreground">
                      {meta.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 에너지 슬라이더 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-foreground">
                에너지 레벨
              </label>
              <span className="text-[10px] text-orange-600 font-semibold">
                {energyLevel} / 5
              </span>
            </div>
            <Slider
              min={1}
              max={5}
              step={1}
              value={[energyLevel]}
              onValueChange={([v]) => setEnergyLevel(v)}
              className="w-full"
            />
            <div className="flex justify-between text-[9px] text-muted-foreground px-0.5">
              <span>매우 낮음</span>
              <span>매우 높음</span>
            </div>
          </div>

          {/* 집중도 슬라이더 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-foreground">
                집중도
              </label>
              <span className="text-[10px] text-blue-600 font-semibold">
                {focusLevel} / 5
              </span>
            </div>
            <Slider
              min={1}
              max={5}
              step={1}
              value={[focusLevel]}
              onValueChange={([v]) => setFocusLevel(v)}
              className="w-full"
            />
            <div className="flex justify-between text-[9px] text-muted-foreground px-0.5">
              <span>매우 낮음</span>
              <span>매우 높음</span>
            </div>
          </div>

          {/* 즐거움 슬라이더 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-foreground">
                즐거움
              </label>
              <span className="text-[10px] text-green-600 font-semibold">
                {enjoymentLevel} / 5
              </span>
            </div>
            <Slider
              min={1}
              max={5}
              step={1}
              value={[enjoymentLevel]}
              onValueChange={([v]) => setEnjoymentLevel(v)}
              className="w-full"
            />
            <div className="flex justify-between text-[9px] text-muted-foreground px-0.5">
              <span>매우 낮음</span>
              <span>매우 높음</span>
            </div>
          </div>

          {/* 오늘 배운 것 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              오늘 배운 것{" "}
              <span className="text-muted-foreground font-normal">(선택)</span>
            </label>
            <Textarea
              placeholder="오늘 새롭게 배운 동작이나 내용을 적어주세요."
              value={learnedToday}
              onChange={(e) => setLearnedToday(e.target.value)}
              className="text-xs resize-none min-h-[52px]"
              maxLength={200}
            />
          </div>

          {/* 개선하고 싶은 점 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              개선하고 싶은 점{" "}
              <span className="text-muted-foreground font-normal">(선택)</span>
            </label>
            <Textarea
              placeholder="더 연습이 필요하다고 느낀 부분을 적어주세요."
              value={wantToImprove}
              onChange={(e) => setWantToImprove(e.target.value)}
              className="text-xs resize-none min-h-[52px]"
              maxLength={200}
            />
          </div>

          {/* 전체 코멘트 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              전체 코멘트{" "}
              <span className="text-muted-foreground font-normal">(선택)</span>
            </label>
            <Textarea
              placeholder="오늘 연습에 대한 전반적인 느낌을 자유롭게 작성해주세요."
              value={generalComment}
              onChange={(e) => setGeneralComment(e.target.value)}
              className="text-xs resize-none min-h-[52px]"
              maxLength={300}
            />
          </div>

          <DialogFooter className="pt-1">
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
              등록
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

type PracticeFeedbackCardProps = {
  groupId: string;
  memberNames: string[];
};

export function PracticeFeedbackCard({
  groupId,
  memberNames,
}: PracticeFeedbackCardProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterDate, setFilterDate] = useState<string>("all");

  const {
    entries,
    addFeedback,
    deleteFeedback,
    totalFeedbacks,
    averageEnergy,
    averageFocus,
    averageEnjoyment,
    moodDistribution,
    getByDate,
  } = usePracticeFeedback(groupId);

  // 날짜 목록 (최신순, 중복 제거)
  const uniqueDates = useMemo(() => {
    const dates = [...new Set(entries.map((e) => e.date))].sort().reverse();
    return dates;
  }, [entries]);

  // 필터된 목록
  const filteredEntries = useMemo(() => {
    if (filterDate === "all") return entries;
    return getByDate(filterDate);
  }, [filterDate, entries, getByDate]);

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
          <MessageCircle className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
          <span className="text-xs font-medium flex-1">연습 피드백</span>

          {totalFeedbacks > 0 && (
            <span className="text-[10px] px-1.5 py-0 rounded bg-indigo-100 text-indigo-700 font-semibold shrink-0">
              {totalFeedbacks}개
            </span>
          )}

          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          )}
        </button>

        {!collapsed && (
          <div className="space-y-2.5">
            {/* 통계 요약 */}
            {totalFeedbacks > 0 && (
              <div className="bg-muted/20 rounded-md px-2.5 py-2.5 space-y-3">
                {/* 평균 점수 바 */}
                <div>
                  <p className="text-[10px] text-muted-foreground font-medium mb-1.5">
                    평균 점수 ({totalFeedbacks}개 피드백)
                  </p>
                  <div className="space-y-1">
                    <ScoreBar
                      label="에너지"
                      value={averageEnergy}
                      color="bg-orange-400"
                    />
                    <ScoreBar
                      label="집중도"
                      value={averageFocus}
                      color="bg-blue-400"
                    />
                    <ScoreBar
                      label="즐거움"
                      value={averageEnjoyment}
                      color="bg-green-400"
                    />
                  </div>
                </div>

                {/* 무드 분포 */}
                <div>
                  <p className="text-[10px] text-muted-foreground font-medium mb-1.5">
                    무드 분포
                  </p>
                  <MoodDistributionBar
                    distribution={moodDistribution}
                    total={totalFeedbacks}
                  />
                </div>
              </div>
            )}

            {/* 날짜 필터 */}
            {uniqueDates.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setFilterDate("all")}
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full border transition-colors",
                    filterDate === "all"
                      ? "bg-indigo-100 border-indigo-300 text-indigo-700 font-semibold"
                      : "border-border text-muted-foreground hover:bg-muted/40"
                  )}
                >
                  전체
                </button>
                {uniqueDates.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setFilterDate(d)}
                    className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full border transition-colors",
                      filterDate === d
                        ? "bg-indigo-100 border-indigo-300 text-indigo-700 font-semibold"
                        : "border-border text-muted-foreground hover:bg-muted/40"
                    )}
                  >
                    {formatDate(d)}
                  </button>
                ))}
              </div>
            )}

            {/* 피드백 목록 */}
            {filteredEntries.length > 0 ? (
              <div className="space-y-1.5">
                {filteredEntries.map((entry) => (
                  <FeedbackItem
                    key={entry.id}
                    entry={entry}
                    onDelete={(id) => {
                      deleteFeedback(id);
                      toast.success(TOAST.PRACTICE_FEEDBACK.DELETED);
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 gap-1.5 text-muted-foreground">
                <MessageCircle className="h-5 w-5" />
                <p className="text-xs">아직 피드백이 없습니다</p>
                <p className="text-[10px]">연습 후 소감을 기록해보세요</p>
              </div>
            )}

            {/* 구분선 */}
            {filteredEntries.length > 0 && (
              <div className="border-t border-border/40" />
            )}

            {/* 피드백 추가 버튼 */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs w-full justify-start text-muted-foreground hover:text-foreground gap-1.5"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="h-3 w-3" />
              피드백 추가
            </Button>
          </div>
        )}
      </div>

      {/* 피드백 작성 다이얼로그 */}
      <AddFeedbackDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        memberNames={memberNames}
        onAdd={addFeedback}
      />
    </>
  );
}
