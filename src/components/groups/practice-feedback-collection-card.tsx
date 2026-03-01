"use client";

import { useState, useMemo } from "react";
import {
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  CalendarIcon,
  Star,
  Users,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { usePracticeFeedbackSession } from "@/hooks/use-practice-feedback-session";
import type {
  PracticeFeedbackSession,
  PracticeFeedbackAggregate,
  PracticeFeedbackRating,
} from "@/types";
import { formatYearMonthDay } from "@/lib/date-utils";

// ============================================
// 날짜 헬퍼
// ============================================

function dateToYMD(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// ============================================
// 별점 렌더러
// ============================================

function StarRating({
  value,
  onChange,
  size = "sm",
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: "sm" | "xs";
}) {
  const iconClass = size === "xs" ? "h-3 w-3" : "h-4 w-4";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          className={cn(
            "transition-colors",
            onChange ? "cursor-pointer hover:scale-110" : "cursor-default"
          )}
          aria-label={`${star}점`}
          disabled={!onChange}
        >
          <Star
            className={cn(
              iconClass,
              star <= value
                ? "fill-yellow-400 text-yellow-400"
                : "fill-transparent text-muted-foreground/40"
            )}
          />
        </button>
      ))}
    </div>
  );
}

// ============================================
// 카테고리 평균 바
// ============================================

const CATEGORY_META: Record<
  keyof PracticeFeedbackRating,
  { label: string; color: string }
> = {
  choreography: { label: "안무", color: "bg-purple-400" },
  music: { label: "음악", color: "bg-blue-400" },
  environment: { label: "환경", color: "bg-green-400" },
  atmosphere: { label: "분위기", color: "bg-pink-400" },
};

const CATEGORY_KEYS: (keyof PracticeFeedbackRating)[] = [
  "choreography",
  "music",
  "environment",
  "atmosphere",
];

function CategoryBar({
  categoryKey,
  value,
}: {
  categoryKey: keyof PracticeFeedbackRating;
  value: number;
}) {
  const meta = CATEGORY_META[categoryKey];
  const pct = Math.round((value / 5) * 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-muted-foreground w-8 shrink-0">
        {meta.label}
      </span>
      <div className="flex-1 bg-muted/40 rounded-full h-1.5 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", meta.color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] font-mono text-muted-foreground w-6 text-right shrink-0">
        {value > 0 ? value.toFixed(1) : "-"}
      </span>
    </div>
  );
}

// ============================================
// 세션 집계 요약 카드
// ============================================

function SessionAggregateView({
  aggregate,
}: {
  aggregate: PracticeFeedbackAggregate;
}) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="bg-muted/20 rounded-md px-2.5 py-2 space-y-2.5">
      {/* 헤더 */}
      <div className="flex items-center gap-2">
        <div className="flex-1 space-y-0.5">
          <div className="flex items-center gap-1.5">
            <StarRating value={Math.round(aggregate.averageOverall)} size="xs" />
            <span className="text-[10px] font-semibold text-yellow-600">
              {aggregate.averageOverall > 0
                ? aggregate.averageOverall.toFixed(1)
                : "-"}
            </span>
          </div>
          <p className="text-[9px] text-muted-foreground">
            {aggregate.totalResponses}명 참여
          </p>
        </div>
      </div>

      {/* 카테고리별 평균 */}
      <div className="space-y-1">
        {CATEGORY_KEYS.map((key) => (
          <CategoryBar
            key={key}
            categoryKey={key}
            value={aggregate.averageCategories[key]}
          />
        ))}
      </div>

      {/* 좋았던 점 / 개선할 점 토글 */}
      {(aggregate.goodPointsList.length > 0 ||
        aggregate.improvementsList.length > 0) && (
        <div>
          <button
            type="button"
            onClick={() => setShowDetails((p) => !p)}
            className="text-[10px] text-indigo-600 hover:underline flex items-center gap-0.5"
          >
            {showDetails ? "의견 접기" : "의견 보기"}
            {showDetails ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>

          {showDetails && (
            <div className="mt-1.5 space-y-2">
              {aggregate.goodPointsList.length > 0 && (
                <div>
                  <p className="text-[9px] font-semibold text-green-700 mb-0.5">
                    좋았던 점
                  </p>
                  <ul className="space-y-0.5">
                    {aggregate.goodPointsList.map((text, i) => (
                      <li
                        key={i}
                        className="text-[10px] text-muted-foreground leading-relaxed pl-2 border-l-2 border-green-200"
                      >
                        {text}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {aggregate.improvementsList.length > 0 && (
                <div>
                  <p className="text-[9px] font-semibold text-orange-700 mb-0.5">
                    개선할 점
                  </p>
                  <ul className="space-y-0.5">
                    {aggregate.improvementsList.map((text, i) => (
                      <li
                        key={i}
                        className="text-[10px] text-muted-foreground leading-relaxed pl-2 border-l-2 border-orange-200"
                      >
                        {text}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// 세션 항목
// ============================================

function SessionItem({
  session,
  aggregate,
  onDeleteSession,
  onOpenFeedbackForm,
}: {
  session: PracticeFeedbackSession;
  aggregate: PracticeFeedbackAggregate;
  onDeleteSession: (id: string) => void;
  onOpenFeedbackForm: (sessionId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-border/60 rounded-md overflow-hidden">
      {/* 세션 헤더 */}
      <button
        type="button"
        className="w-full flex items-center gap-2 px-2.5 py-2 text-left hover:bg-muted/20 transition-colors"
        onClick={() => setExpanded((p) => !p)}
        aria-expanded={expanded}
      >
        <CalendarIcon className="h-3 w-3 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate">
            {session.title || formatYearMonthDay(session.practiceDate)}
          </p>
          {session.title && (
            <p className="text-[9px] text-muted-foreground">
              {formatYearMonthDay(session.practiceDate)}
            </p>
          )}
        </div>

        {aggregate.totalResponses > 0 && (
          <div className="flex items-center gap-1 shrink-0">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="text-[10px] font-semibold">
              {aggregate.averageOverall.toFixed(1)}
            </span>
          </div>
        )}

        <Badge
          className={cn(
            "text-[9px] px-1.5 py-0 shrink-0",
            aggregate.totalResponses > 0
              ? "bg-indigo-100 text-indigo-700 border-indigo-200"
              : "bg-muted text-muted-foreground"
          )}
        >
          {aggregate.totalResponses}명
        </Badge>

        {expanded ? (
          <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
        )}
      </button>

      {/* 세션 상세 */}
      {expanded && (
        <div className="px-2.5 pb-2.5 space-y-2 border-t border-border/40 pt-2">
          {aggregate.totalResponses > 0 ? (
            <SessionAggregateView aggregate={aggregate} />
          ) : (
            <p className="text-[10px] text-muted-foreground text-center py-2">
              아직 피드백이 없습니다
            </p>
          )}

          {/* 액션 버튼 */}
          <div className="flex gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-6 text-[10px] flex-1 gap-1"
              onClick={() => onOpenFeedbackForm(session.id)}
            >
              <Plus className="h-3 w-3" />
              피드백 제출
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 text-[10px] px-2 text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={() => onDeleteSession(session.id)}
              aria-label="세션 삭제"
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
// 세션 생성 다이얼로그
// ============================================

function CreateSessionDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreate: (params: { practiceDate: string; title?: string }) => void;
}) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [calOpen, setCalOpen] = useState(false);
  const [title, setTitle] = useState("");

  const reset = () => {
    setDate(new Date());
    setTitle("");
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      toast.error(TOAST.PRACTICE_FEEDBACK_COLLECTION.DATE_REQUIRED);
      return;
    }
    onCreate({
      practiceDate: dateToYMD(date),
      title: title.trim() || undefined,
    });
    toast.success(TOAST.PRACTICE_FEEDBACK.SESSION_CREATED);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-1.5">
            <CalendarIcon className="h-4 w-4 text-indigo-500" />
            연습 세션 추가
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
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

          {/* 세션 제목 (선택) */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              세션 제목{" "}
              <span className="text-muted-foreground font-normal">(선택)</span>
            </label>
            <Input
              placeholder="예: 정기 연습 #12"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-8 text-xs"
              maxLength={40}
            />
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
              생성
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 피드백 제출 다이얼로그
// ============================================

const DEFAULT_RATING: PracticeFeedbackRating = {
  choreography: 3,
  music: 3,
  environment: 3,
  atmosphere: 3,
};

function SubmitFeedbackDialog({
  open,
  onOpenChange,
  sessionId,
  memberNames,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sessionId: string;
  memberNames: string[];
  onSubmit: (
    sessionId: string,
    params: {
      authorName: string;
      isAnonymous: boolean;
      overallRating: number;
      categoryRatings: PracticeFeedbackRating;
      goodPoints?: string;
      improvements?: string;
    }
  ) => boolean;
}) {
  const [authorName, setAuthorName] = useState(memberNames[0] ?? "");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [overallRating, setOverallRating] = useState(3);
  const [categoryRatings, setCategoryRatings] =
    useState<PracticeFeedbackRating>(DEFAULT_RATING);
  const [goodPoints, setGoodPoints] = useState("");
  const [improvements, setImprovements] = useState("");

  const setCategoryValue = (
    key: keyof PracticeFeedbackRating,
    value: number
  ) => {
    setCategoryRatings((prev) => ({ ...prev, [key]: value }));
  };

  const reset = () => {
    setAuthorName(memberNames[0] ?? "");
    setIsAnonymous(false);
    setOverallRating(3);
    setCategoryRatings(DEFAULT_RATING);
    setGoodPoints("");
    setImprovements("");
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAnonymous && !authorName.trim()) {
      toast.error(TOAST.PRACTICE_FEEDBACK_COLLECTION.NAME_REQUIRED);
      return;
    }

    const ok = onSubmit(sessionId, {
      authorName: authorName.trim(),
      isAnonymous,
      overallRating,
      categoryRatings,
      goodPoints: goodPoints.trim() || undefined,
      improvements: improvements.trim() || undefined,
    });

    if (!ok) {
      toast.error(TOAST.PRACTICE_FEEDBACK.SUBMIT_ERROR);
      return;
    }
    toast.success(TOAST.PRACTICE_FEEDBACK.SUBMITTED);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4 text-indigo-500" />
            피드백 제출
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
          {/* 익명 여부 */}
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">익명으로 제출</Label>
            <div className="flex items-center gap-1.5">
              {isAnonymous && (
                <EyeOff className="h-3 w-3 text-muted-foreground" />
              )}
              <Switch
                checked={isAnonymous}
                onCheckedChange={setIsAnonymous}
              />
            </div>
          </div>

          {/* 작성자 이름 */}
          {!isAnonymous && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                이름
              </label>
              <Input
                placeholder="이름을 입력하세요"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="h-8 text-xs"
                maxLength={30}
                list="member-names-list"
              />
              <datalist id="member-names-list">
                {memberNames.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>
          )}

          {/* 전체 만족도 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-foreground">
                전체 만족도
              </label>
              <span className="text-[10px] text-yellow-600 font-semibold">
                {overallRating} / 5
              </span>
            </div>
            <StarRating value={overallRating} onChange={setOverallRating} />
          </div>

          {/* 카테고리별 평가 */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground block">
              카테고리별 평가
            </label>
            {CATEGORY_KEYS.map((key) => {
              const meta = CATEGORY_META[key];
              return (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">
                      {meta.label}
                    </span>
                    <span className="text-[10px] font-semibold text-foreground/70">
                      {categoryRatings[key]} / 5
                    </span>
                  </div>
                  <Slider
                    min={1}
                    max={5}
                    step={1}
                    value={[categoryRatings[key]]}
                    onValueChange={([v]) => setCategoryValue(key, v)}
                    className="w-full"
                  />
                  <div className="flex justify-between text-[9px] text-muted-foreground px-0.5">
                    <span>매우 낮음</span>
                    <span>매우 높음</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 좋았던 점 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              좋았던 점{" "}
              <span className="text-muted-foreground font-normal">(선택)</span>
            </label>
            <Textarea
              placeholder="오늘 연습에서 좋았던 점을 적어주세요."
              value={goodPoints}
              onChange={(e) => setGoodPoints(e.target.value)}
              className="text-xs resize-none min-h-[56px]"
              maxLength={200}
            />
          </div>

          {/* 개선할 점 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              개선할 점{" "}
              <span className="text-muted-foreground font-normal">(선택)</span>
            </label>
            <Textarea
              placeholder="더 나아질 수 있는 부분을 적어주세요."
              value={improvements}
              onChange={(e) => setImprovements(e.target.value)}
              className="text-xs resize-none min-h-[56px]"
              maxLength={200}
            />
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
              제출
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

type PracticeFeedbackCollectionCardProps = {
  groupId: string;
  memberNames?: string[];
};

export function PracticeFeedbackCollectionCard({
  groupId,
  memberNames = [],
}: PracticeFeedbackCollectionCardProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null
  );

  const {
    sessions,
    loading,
    createSession,
    deleteSession,
    submitResponse,
    getAggregate,
    overallAverageRating,
    totalResponseCount,
  } = usePracticeFeedbackSession(groupId);

  // 세션별 집계 맵
  const aggregateMap = useMemo(() => {
    const map = new Map<string, PracticeFeedbackAggregate>();
    for (const session of sessions) {
      const agg = getAggregate(session.id);
      if (agg) map.set(session.id, agg);
    }
    return map;
  }, [sessions, getAggregate]);

  const handleOpenFeedbackForm = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setFeedbackDialogOpen(true);
  };

  const handleDeleteSession = (sessionId: string) => {
    deleteSession(sessionId);
    toast.success(TOAST.PRACTICE_FEEDBACK_COLLECTION.SESSION_DELETED);
  };

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
          <MessageSquare className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
          <span className="text-xs font-medium flex-1">연습 피드백 수집</span>

          {totalResponseCount > 0 && (
            <div className="flex items-center gap-1 shrink-0">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-[10px] font-semibold text-yellow-600">
                {overallAverageRating.toFixed(1)}
              </span>
            </div>
          )}

          {sessions.length > 0 && (
            <span className="text-[10px] px-1.5 py-0 rounded bg-indigo-100 text-indigo-700 font-semibold shrink-0">
              {sessions.length}세션
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
            {sessions.length > 0 && totalResponseCount > 0 && (
              <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-md px-2.5 py-2 flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  <div>
                    <p className="text-xs font-bold text-yellow-700">
                      {overallAverageRating.toFixed(1)}
                    </p>
                    <p className="text-[9px] text-muted-foreground">전체 평균</p>
                  </div>
                </div>
                <div className="w-px h-8 bg-border/60" />
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-indigo-500" />
                  <div>
                    <p className="text-xs font-bold text-indigo-700">
                      {totalResponseCount}
                    </p>
                    <p className="text-[9px] text-muted-foreground">총 피드백</p>
                  </div>
                </div>
                <div className="w-px h-8 bg-border/60" />
                <div className="flex items-center gap-1.5">
                  <CalendarIcon className="h-3.5 w-3.5 text-green-500" />
                  <div>
                    <p className="text-xs font-bold text-green-700">
                      {sessions.length}
                    </p>
                    <p className="text-[9px] text-muted-foreground">세션 수</p>
                  </div>
                </div>
              </div>
            )}

            {/* 세션 목록 */}
            {loading ? (
              <p className="text-[10px] text-muted-foreground text-center py-3">
                불러오는 중...
              </p>
            ) : sessions.length > 0 ? (
              <div className="space-y-1.5">
                {sessions.map((session) => {
                  const agg = aggregateMap.get(session.id);
                  if (!agg) return null;
                  return (
                    <SessionItem
                      key={session.id}
                      session={session}
                      aggregate={agg}
                      onDeleteSession={handleDeleteSession}
                      onOpenFeedbackForm={handleOpenFeedbackForm}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 gap-1.5 text-muted-foreground">
                <MessageSquare className="h-5 w-5" />
                <p className="text-xs">연습 세션이 없습니다</p>
                <p className="text-[10px]">
                  연습 날짜를 추가하고 피드백을 수집하세요
                </p>
              </div>
            )}

            {/* 구분선 */}
            {sessions.length > 0 && (
              <div className="border-t border-border/40" />
            )}

            {/* 세션 추가 버튼 */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs w-full justify-start text-muted-foreground hover:text-foreground gap-1.5"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="h-3 w-3" />
              연습 세션 추가
            </Button>
          </div>
        )}
      </div>

      {/* 세션 생성 다이얼로그 */}
      <CreateSessionDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreate={createSession}
      />

      {/* 피드백 제출 다이얼로그 */}
      {selectedSessionId && (
        <SubmitFeedbackDialog
          open={feedbackDialogOpen}
          onOpenChange={(v) => {
            setFeedbackDialogOpen(v);
            if (!v) setSelectedSessionId(null);
          }}
          sessionId={selectedSessionId}
          memberNames={memberNames}
          onSubmit={submitResponse}
        />
      )}
    </>
  );
}
