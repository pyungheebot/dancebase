"use client";

import { useState } from "react";
import {
  BarChart3,
  ChevronDown,
  ChevronRight,
  Plus,
  Star,
  Trash2,
  CalendarIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { useSessionRating } from "@/hooks/use-session-rating";
import type { SessionRatingEntry, SessionRatingAvg } from "@/types";
import { formatYearMonthDay } from "@/lib/date-utils";

// ============================================
// 날짜 포맷 헬퍼
// ============================================

function dateToYMD(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

// ============================================
// 별점 입력
// ============================================

function StarRating({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          className={cn(
            "transition-colors",
            disabled && "cursor-default"
          )}
          onMouseEnter={() => !disabled && setHover(star)}
          onMouseLeave={() => !disabled && setHover(0)}
          onClick={() => !disabled && onChange(star)}
          aria-label={`${star}점`}
        >
          <Star
            className={cn(
              "h-4 w-4",
              (hover > 0 ? star <= hover : star <= value)
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground/40"
            )}
          />
        </button>
      ))}
    </div>
  );
}

// 읽기 전용 별점 (소수 지원)
function StarDisplay({ value, size = "sm" }: { value: number; size?: "sm" | "xs" }) {
  const iconClass = size === "xs" ? "h-3 w-3" : "h-3.5 w-3.5";
  return (
    <div className="flex gap-0.5 items-center">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = value >= star;
        const partial = !filled && value > star - 1;
        return (
          <span key={star} className="relative">
            <Star className={cn(iconClass, "text-muted-foreground/30")} />
            {(filled || partial) && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: filled ? "100%" : `${(value - (star - 1)) * 100}%` }}
              >
                <Star className={cn(iconClass, "fill-amber-400 text-amber-400")} />
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

// ============================================
// 미니 바 차트 (3개 항목)
// ============================================

function MiniBarChart({
  satisfaction,
  efficiency,
  difficulty,
}: {
  satisfaction: number;
  efficiency: number;
  difficulty: number;
}) {
  const bars = [
    { label: "만족도", value: satisfaction, color: "bg-blue-400" },
    { label: "효율", value: efficiency, color: "bg-green-400" },
    { label: "난이도", value: difficulty, color: "bg-orange-400" },
  ];

  return (
    <div className="flex gap-2 items-end h-8">
      {bars.map(({ label, value, color }) => (
        <div key={label} className="flex flex-col items-center gap-0.5 flex-1">
          <span className="text-[9px] text-muted-foreground font-mono leading-none">
            {value.toFixed(1)}
          </span>
          <div className="w-full bg-muted/40 rounded-sm overflow-hidden" style={{ height: 16 }}>
            <div
              className={cn("rounded-sm transition-all", color)}
              style={{ height: "100%", width: `${(value / 5) * 100}%` }}
            />
          </div>
          <span className="text-[9px] text-muted-foreground leading-none">{label}</span>
        </div>
      ))}
    </div>
  );
}

// ============================================
// 평가 추가 다이얼로그
// ============================================

function AddRatingDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAdd: (params: {
    sessionDate: string;
    sessionTitle: string;
    raterName: string;
    satisfaction: number;
    efficiency: number;
    difficulty: number;
    comment: string;
  }) => boolean;
}) {
  const [sessionDate, setSessionDate] = useState<Date | undefined>(undefined);
  const [calOpen, setCalOpen] = useState(false);
  const [sessionTitle, setSessionTitle] = useState("");
  const [raterName, setRaterName] = useState("");
  const [satisfaction, setSatisfaction] = useState(0);
  const [efficiency, setEfficiency] = useState(0);
  const [difficulty, setDifficulty] = useState(0);
  const [comment, setComment] = useState("");

  const reset = () => {
    setSessionDate(undefined);
    setSessionTitle("");
    setRaterName("");
    setSatisfaction(0);
    setEfficiency(0);
    setDifficulty(0);
    setComment("");
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionDate) {
      toast.error("세션 날짜를 선택해주세요.");
      return;
    }
    if (!sessionTitle.trim()) {
      toast.error("세션명을 입력해주세요.");
      return;
    }
    if (!raterName.trim()) {
      toast.error("평가자 이름을 입력해주세요.");
      return;
    }
    if (satisfaction === 0) {
      toast.error("만족도 별점을 선택해주세요.");
      return;
    }
    if (efficiency === 0) {
      toast.error("효율 별점을 선택해주세요.");
      return;
    }
    if (difficulty === 0) {
      toast.error("난이도 별점을 선택해주세요.");
      return;
    }

    const ok = onAdd({
      sessionDate: dateToYMD(sessionDate),
      sessionTitle: sessionTitle.trim(),
      raterName: raterName.trim(),
      satisfaction,
      efficiency,
      difficulty,
      comment: comment.trim(),
    });

    if (!ok) {
      toast.error("평가 추가에 실패했습니다. (최대 200개)");
      return;
    }
    toast.success("평가가 등록되었습니다.");
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-1.5">
            <BarChart3 className="h-4 w-4 text-blue-500" />
            연습 세션 평가 등록
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
          {/* 세션 날짜 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">세션 날짜</label>
            <Popover open={calOpen} onOpenChange={setCalOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-8 w-full justify-start text-xs font-normal",
                    !sessionDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="h-3 w-3 mr-1.5 shrink-0" />
                  {sessionDate ? dateToYMD(sessionDate) : "날짜 선택"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={sessionDate}
                  onSelect={(d) => {
                    setSessionDate(d);
                    setCalOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* 세션명 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">세션명</label>
            <Input
              placeholder="예) 2월 4째주 연습"
              value={sessionTitle}
              onChange={(e) => setSessionTitle(e.target.value)}
              className="h-8 text-xs"
              maxLength={60}
            />
          </div>

          {/* 평가자 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">평가자</label>
            <Input
              placeholder="이름 입력"
              value={raterName}
              onChange={(e) => setRaterName(e.target.value)}
              className="h-8 text-xs"
              maxLength={30}
            />
          </div>

          {/* 만족도 */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-foreground">만족도</label>
              <span className="text-[10px] text-muted-foreground">
                {satisfaction > 0 ? `${satisfaction}점` : "선택 안 됨"}
              </span>
            </div>
            <StarRating value={satisfaction} onChange={setSatisfaction} />
          </div>

          {/* 효율 */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-foreground">효율</label>
              <span className="text-[10px] text-muted-foreground">
                {efficiency > 0 ? `${efficiency}점` : "선택 안 됨"}
              </span>
            </div>
            <StarRating value={efficiency} onChange={setEfficiency} />
          </div>

          {/* 난이도 */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-foreground">난이도</label>
              <span className="text-[10px] text-muted-foreground">
                {difficulty > 0 ? `${difficulty}점` : "선택 안 됨"}
              </span>
            </div>
            <StarRating value={difficulty} onChange={setDifficulty} />
          </div>

          {/* 코멘트 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              코멘트 <span className="text-muted-foreground font-normal">(선택)</span>
            </label>
            <Textarea
              placeholder="연습 후 느낀 점을 자유롭게 작성해주세요."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="text-xs resize-none min-h-[64px]"
              maxLength={200}
            />
            <p className="text-[10px] text-muted-foreground text-right">
              {comment.length}/200
            </p>
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
// 개별 평가 아이템
// ============================================

function RatingItem({
  entry,
  onDelete,
}: {
  entry: SessionRatingEntry;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="bg-muted/30 rounded px-2 py-1.5 space-y-1">
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-semibold text-foreground flex-1 truncate">
          {entry.raterName}
        </span>
        <span className="text-[10px] text-muted-foreground shrink-0">
          {formatYearMonthDay(entry.createdAt.slice(0, 10))}
        </span>
        <button
          type="button"
          onClick={() => onDelete(entry.id)}
          aria-label="평가 삭제"
          className="shrink-0"
        >
          <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500" />
        </button>
      </div>
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-blue-600 font-medium w-8">만족도</span>
          <StarDisplay value={entry.satisfaction} size="xs" />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-green-600 font-medium w-6">효율</span>
          <StarDisplay value={entry.efficiency} size="xs" />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-orange-600 font-medium w-8">난이도</span>
          <StarDisplay value={entry.difficulty} size="xs" />
        </div>
      </div>
      {entry.comment && (
        <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">
          {entry.comment}
        </p>
      )}
    </div>
  );
}

// ============================================
// 세션 평균 아이템 (확장 가능)
// ============================================

function SessionAvgItem({
  avg,
  entries,
  onDeleteEntry,
}: {
  avg: SessionRatingAvg;
  entries: SessionRatingEntry[];
  onDeleteEntry: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-md border border-border/60 bg-card p-2.5 space-y-2">
      {/* 헤더 */}
      <button
        type="button"
        className="w-full flex items-center gap-1.5 text-left"
        onClick={() => setExpanded((p) => !p)}
        aria-expanded={expanded}
      >
        {expanded ? (
          <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
        )}
        <span className="text-xs font-medium text-foreground flex-1 truncate">
          {avg.sessionTitle}
        </span>
        <span className="text-[10px] text-muted-foreground shrink-0">
          {formatYearMonthDay(avg.sessionDate)}
        </span>
        <span className="text-[10px] px-1.5 py-0 rounded bg-muted text-muted-foreground font-medium shrink-0">
          {avg.ratingCount}명
        </span>
      </button>

      {/* 바 차트 */}
      <MiniBarChart
        satisfaction={avg.avgSatisfaction}
        efficiency={avg.avgEfficiency}
        difficulty={avg.avgDifficulty}
      />

      {/* 별점 평균 요약 */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-blue-600 font-medium w-8">만족도</span>
          <StarDisplay value={avg.avgSatisfaction} size="xs" />
          <span className="text-[9px] text-muted-foreground ml-0.5">{avg.avgSatisfaction.toFixed(1)}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-green-600 font-medium w-6">효율</span>
          <StarDisplay value={avg.avgEfficiency} size="xs" />
          <span className="text-[9px] text-muted-foreground ml-0.5">{avg.avgEfficiency.toFixed(1)}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-orange-600 font-medium w-8">난이도</span>
          <StarDisplay value={avg.avgDifficulty} size="xs" />
          <span className="text-[9px] text-muted-foreground ml-0.5">{avg.avgDifficulty.toFixed(1)}</span>
        </div>
      </div>

      {/* 확장 시 개별 평가 목록 */}
      {expanded && (
        <div className="pt-1 space-y-1.5 border-t border-border/40">
          {entries.length > 0 ? (
            entries.map((entry) => (
              <RatingItem
                key={entry.id}
                entry={entry}
                onDelete={(id) => {
                  onDeleteEntry(id);
                  toast.success("평가가 삭제되었습니다.");
                }}
              />
            ))
          ) : (
            <p className="text-[10px] text-muted-foreground text-center py-2">
              평가가 없습니다.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// 메인 컴포넌트
// ============================================

type SessionRatingCardProps = {
  groupId: string;
};

export function SessionRatingCard({ groupId }: SessionRatingCardProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const {
    ratings,
    addRating,
    deleteRating,
    getAllSessionAvgs,
    totalRatings,
    avgSatisfaction,
  } = useSessionRating(groupId);

  const sessionAvgs = getAllSessionAvgs();

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
          <BarChart3 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
          <span className="text-xs font-medium flex-1">연습 세션 레이팅</span>

          {/* 총 평가 수 배지 */}
          {totalRatings > 0 && (
            <span className="text-[10px] px-1.5 py-0 rounded bg-blue-100 text-blue-700 font-semibold shrink-0">
              총 {totalRatings}
            </span>
          )}

          {/* 전체 평균 만족도 배지 */}
          {avgSatisfaction > 0 && (
            <span className="text-[10px] px-1.5 py-0 rounded bg-amber-100 text-amber-700 font-semibold shrink-0 flex items-center gap-0.5">
              <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
              {avgSatisfaction.toFixed(1)}
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
            {/* 전체 평균 요약 */}
            {totalRatings > 0 && (
              <div className="bg-muted/20 rounded-md px-2.5 py-2 space-y-1.5">
                <p className="text-[10px] text-muted-foreground font-medium">
                  전체 평균 ({totalRatings}개 평가)
                </p>
                <MiniBarChart
                  satisfaction={avgSatisfaction}
                  efficiency={
                    ratings.reduce((s, r) => s + r.efficiency, 0) / totalRatings
                  }
                  difficulty={
                    ratings.reduce((s, r) => s + r.difficulty, 0) / totalRatings
                  }
                />
              </div>
            )}

            {/* 세션별 평균 목록 */}
            {sessionAvgs.length > 0 ? (
              <div className="space-y-1.5">
                {sessionAvgs.map((avg) => {
                  const entries = ratings.filter(
                    (r) => r.sessionDate === avg.sessionDate
                  );
                  return (
                    <SessionAvgItem
                      key={avg.sessionDate}
                      avg={avg}
                      entries={entries}
                      onDeleteEntry={deleteRating}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 gap-1.5 text-muted-foreground">
                <BarChart3 className="h-5 w-5" />
                <p className="text-xs">아직 평가가 없습니다</p>
                <p className="text-[10px]">연습 후 만족도를 기록해보세요</p>
              </div>
            )}

            {/* 구분선 */}
            {ratings.length > 0 && <div className="border-t border-border/40" />}

            {/* 평가 추가 버튼 */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs w-full justify-start text-muted-foreground hover:text-foreground gap-1.5"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="h-3 w-3" />
              평가 추가
            </Button>
          </div>
        )}
      </div>

      {/* 평가 추가 다이얼로그 */}
      <AddRatingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAdd={addRating}
      />
    </>
  );
}
