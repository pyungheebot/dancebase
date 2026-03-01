"use client";

import { useState } from "react";
import { useMentoringSystem } from "@/hooks/use-mentoring-system";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Plus,
  Star,
  Check,
  Pause,
  Play,
  Trash2,
  MessageSquare,
  Users,
  Target,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import type { MentoringPair, MentoringStatus } from "@/types";

// ============================================
// 상태 배지 설정
// ============================================

const STATUS_CONFIG: Record<
  MentoringStatus,
  { label: string; className: string }
> = {
  active: {
    label: "진행 중",
    className: "bg-green-100 text-green-700 hover:bg-green-100",
  },
  completed: {
    label: "완료",
    className: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  },
  paused: {
    label: "일시정지",
    className: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
  },
};

// ============================================
// Props 타입
// ============================================

type MentoringSystemCardProps = {
  groupId: string;
  canManage: boolean;
};

// ============================================
// 메인 컴포넌트
// ============================================

export function MentoringSystemCard({
  groupId,
  canManage,
}: MentoringSystemCardProps) {
  const {
    activePairs,
    completedPairs,
    pausedPairs,
    loading,
    stats,
    createPair,
    completePair,
    pausePair,
    resumePair,
    deletePair,
    addFeedback,
  } = useMentoringSystem(groupId);

  const [isOpen, setIsOpen] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showPaused, setShowPaused] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm font-medium flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            멘토링 매칭
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <p className="text-xs text-muted-foreground">불러오는 중...</p>
        </CardContent>
      </Card>
    );
  }

  const totalPairs = activePairs.length + completedPairs.length + pausedPairs.length;

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-2 pt-3 px-4">
          <div className="flex items-center justify-between">
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1.5 text-left hover:text-foreground/80 transition-colors"
              >
                <Users className="h-4 w-4" />
                <CardTitle className="text-sm font-medium">
                  멘토링 매칭
                </CardTitle>
                {stats.activeCount > 0 && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 hover:bg-green-100">
                    {stats.activeCount}
                  </Badge>
                )}
                {isOpen ? (
                  <ChevronUp className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                )}
              </button>
            </CollapsibleTrigger>

            {canManage && (
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 text-xs">
                    <Plus className="h-3 w-3 mr-1" />
                    매칭 추가
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-sm">
                  <DialogHeader>
                    <DialogTitle>멘토링 매칭 추가</DialogTitle>
                  </DialogHeader>
                  <CreatePairForm
                    onCreated={(params) => {
                      createPair(params);
                      setCreateDialogOpen(false);
                      toast.success(TOAST.MEMBERS.MENTORING_PAIR_ADDED);
                    }}
                  />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="px-4 pb-4 space-y-3">
            {/* 통계 */}
            {totalPairs > 0 && (
              <div className="grid grid-cols-3 gap-2">
                <StatItem
                  icon={<TrendingUp className="h-3 w-3 text-green-600" />}
                  label="진행 중"
                  value={stats.activeCount}
                  colorClass="text-green-700"
                />
                <StatItem
                  icon={<Check className="h-3 w-3 text-blue-600" />}
                  label="완료"
                  value={stats.completedCount}
                  colorClass="text-blue-700"
                />
                <StatItem
                  icon={<Star className="h-3 w-3 text-yellow-500" />}
                  label="평균 만족도"
                  value={
                    stats.avgRating !== null
                      ? `${stats.avgRating}점`
                      : "-"
                  }
                  colorClass="text-yellow-700"
                />
              </div>
            )}

            {/* 전체 빈 상태 */}
            {totalPairs === 0 && (
              <p className="text-xs text-muted-foreground py-1">
                {canManage
                  ? "매칭 추가 버튼을 눌러 멘토-멘티를 연결하세요."
                  : "등록된 멘토링 매칭이 없습니다."}
              </p>
            )}

            {/* 진행 중 매칭 */}
            {activePairs.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                  진행 중
                </p>
                {activePairs.map((pair) => (
                  <PairRow
                    key={pair.id}
                    pair={pair}
                    canManage={canManage}
                    onComplete={() => {
                      completePair(pair.id);
                      toast.success(TOAST.MEMBERS.MENTORING_COMPLETED);
                    }}
                    onPause={() => {
                      pausePair(pair.id);
                      toast.success(TOAST.MEMBERS.MENTORING_PAUSED);
                    }}
                    onDelete={() => {
                      deletePair(pair.id);
                      toast.success(TOAST.MEMBERS.MENTORING_PAIR_DELETED);
                    }}
                    onAddFeedback={(content, rating, writtenBy) => {
                      addFeedback(pair.id, {
                        date: new Date().toISOString().slice(0, 10),
                        content,
                        rating,
                        writtenBy,
                      });
                      toast.success(TOAST.MEMBERS.MENTORING_FEEDBACK_ADDED);
                    }}
                  />
                ))}
              </div>
            )}

            {/* 일시정지된 매칭 */}
            {pausedPairs.length > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowPaused((v) => !v)}
                  className="text-[11px] text-muted-foreground hover:text-foreground underline"
                >
                  {showPaused
                    ? "일시정지 매칭 숨기기"
                    : `일시정지 매칭 보기 (${pausedPairs.length})`}
                </button>
                {showPaused && (
                  <div className="mt-1.5 space-y-1.5">
                    {pausedPairs.map((pair) => (
                      <PairRow
                        key={pair.id}
                        pair={pair}
                        canManage={canManage}
                        onResume={() => {
                          resumePair(pair.id);
                          toast.success(TOAST.MEMBERS.MENTORING_RESUMED);
                        }}
                        onDelete={() => {
                          deletePair(pair.id);
                          toast.success(TOAST.MEMBERS.MENTORING_PAIR_DELETED);
                        }}
                        onAddFeedback={(content, rating, writtenBy) => {
                          addFeedback(pair.id, {
                            date: new Date().toISOString().slice(0, 10),
                            content,
                            rating,
                            writtenBy,
                          });
                          toast.success(TOAST.MEMBERS.MENTORING_FEEDBACK_ADDED);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 완료된 매칭 */}
            {completedPairs.length > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowCompleted((v) => !v)}
                  className="text-[11px] text-muted-foreground hover:text-foreground underline"
                >
                  {showCompleted
                    ? "완료된 매칭 숨기기"
                    : `완료된 매칭 보기 (${completedPairs.length})`}
                </button>
                {showCompleted && (
                  <div className="mt-1.5 space-y-1.5 opacity-60">
                    {completedPairs.map((pair) => (
                      <PairRow
                        key={pair.id}
                        pair={pair}
                        canManage={canManage}
                        onDelete={() => {
                          deletePair(pair.id);
                          toast.success(TOAST.MEMBERS.MENTORING_PAIR_DELETED);
                        }}
                        onAddFeedback={(content, rating, writtenBy) => {
                          addFeedback(pair.id, {
                            date: new Date().toISOString().slice(0, 10),
                            content,
                            rating,
                            writtenBy,
                          });
                          toast.success(TOAST.MEMBERS.MENTORING_FEEDBACK_ADDED);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// ============================================
// 통계 항목 컴포넌트
// ============================================

function StatItem({
  icon,
  label,
  value,
  colorClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  colorClass: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 bg-muted/30 rounded-md px-2 py-1.5">
      <div className="flex items-center gap-1">
        {icon}
        <span className={`text-sm font-semibold ${colorClass}`}>{value}</span>
      </div>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

// ============================================
// 매칭 행 컴포넌트
// ============================================

type PairRowProps = {
  pair: MentoringPair;
  canManage: boolean;
  onComplete?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onDelete?: () => void;
  onAddFeedback?: (
    content: string,
    rating: number,
    writtenBy: "mentor" | "mentee"
  ) => void;
};

function PairRow({
  pair,
  canManage,
  onComplete,
  onPause,
  onResume,
  onDelete,
  onAddFeedback,
}: PairRowProps) {
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  const statusConfig = STATUS_CONFIG[pair.status];
  const avgRating =
    pair.feedbacks.length > 0
      ? Math.round(
          (pair.feedbacks.reduce((a, b) => a + b.rating, 0) /
            pair.feedbacks.length) *
            10
        ) / 10
      : null;

  return (
    <div className="rounded-md border bg-muted/30">
      {/* 행 헤더 */}
      <div className="flex items-center gap-2 px-2.5 py-1.5">
        {/* 멘토 */}
        <div className="flex items-center gap-1 min-w-0">
          <Star className="h-3 w-3 text-yellow-500 shrink-0" />
          <span className="text-xs font-medium truncate max-w-[60px]">
            {pair.mentorName}
          </span>
        </div>

        {/* 화살표 */}
        <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />

        {/* 멘티 */}
        <span className="text-xs truncate max-w-[60px] min-w-0">
          {pair.menteeName}
        </span>

        {/* 상태 배지 */}
        <Badge
          className={`text-[10px] px-1.5 py-0 shrink-0 ml-auto ${statusConfig.className}`}
        >
          {statusConfig.label}
        </Badge>

        {/* 피드백 수 */}
        {pair.feedbacks.length > 0 && (
          <div className="flex items-center gap-0.5 shrink-0">
            <MessageSquare className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">
              {pair.feedbacks.length}
            </span>
          </div>
        )}

        {/* 평균 만족도 */}
        {avgRating !== null && (
          <div className="flex items-center gap-0.5 shrink-0">
            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
            <span className="text-[10px] text-muted-foreground">{avgRating}</span>
          </div>
        )}

        {/* 상세/피드백 토글 버튼 */}
        <button
          type="button"
          onClick={() => setDetailOpen((v) => !v)}
          className="text-muted-foreground hover:text-foreground shrink-0"
          title="상세 보기"
        >
          {detailOpen ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </button>

        {/* 액션 버튼 */}
        {canManage && (
          <div className="flex items-center gap-0.5 shrink-0">
            {onComplete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-muted-foreground hover:text-blue-600"
                title="완료 처리"
                aria-label="완료 처리"
                onClick={onComplete}
              >
                <Check className="h-3 w-3" />
              </Button>
            )}
            {onPause && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-muted-foreground hover:text-yellow-600"
                title="일시정지"
                aria-label="일시정지"
                onClick={onPause}
              >
                <Pause className="h-3 w-3" />
              </Button>
            )}
            {onResume && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-muted-foreground hover:text-green-600"
                title="재개"
                aria-label="재개"
                onClick={onResume}
              >
                <Play className="h-3 w-3" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-muted-foreground hover:text-destructive"
                title="삭제"
                aria-label="삭제"
                onClick={onDelete}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* 상세 패널 */}
      {detailOpen && (
        <div className="border-t px-2.5 py-2 space-y-2">
          {/* 목표 */}
          <div className="flex items-start gap-1.5">
            <Target className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] text-muted-foreground">목표: </span>
              <span className="text-xs">{pair.goal}</span>
            </div>
          </div>

          {/* 시작일/종료일 */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-muted-foreground">
              시작: {pair.startDate}
            </span>
            {pair.endDate && (
              <span className="text-[10px] text-muted-foreground">
                종료: {pair.endDate}
              </span>
            )}
          </div>

          {/* 피드백 목록 */}
          {pair.feedbacks.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-medium text-muted-foreground">
                피드백 ({pair.feedbacks.length}건)
              </p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {pair.feedbacks.slice(-3).map((fb) => (
                  <div
                    key={fb.id}
                    className="flex items-start gap-1.5 rounded bg-background/60 px-2 py-1"
                  >
                    <div className="flex items-center gap-0.5 shrink-0">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          className={`h-2.5 w-2.5 ${
                            i < fb.rating
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] text-muted-foreground shrink-0">
                      {fb.writtenBy === "mentor" ? "멘토" : "멘티"}
                    </span>
                    <span className="text-[11px] truncate">{fb.content}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0 ml-auto">
                      {fb.date}
                    </span>
                  </div>
                ))}
                {pair.feedbacks.length > 3 && (
                  <p className="text-[10px] text-muted-foreground text-center">
                    외 {pair.feedbacks.length - 3}건
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 피드백 추가 버튼 */}
          {onAddFeedback && (
            <Dialog
              open={feedbackDialogOpen}
              onOpenChange={setFeedbackDialogOpen}
            >
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-6 text-[11px] w-full">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  피드백 추가
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>피드백 추가</DialogTitle>
                </DialogHeader>
                <FeedbackForm
                  onSubmit={(content, rating, writtenBy) => {
                    onAddFeedback(content, rating, writtenBy);
                    setFeedbackDialogOpen(false);
                  }}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// 매칭 생성 폼
// ============================================

type CreatePairFormProps = {
  onCreated: (params: {
    mentorId: string;
    mentorName: string;
    menteeId: string;
    menteeName: string;
    goal: string;
    startDate: string;
  }) => void;
};

function CreatePairForm({ onCreated }: CreatePairFormProps) {
  const [mentorName, setMentorName] = useState("");
  const [menteeName, setMenteeName] = useState("");
  const [goal, setGoal] = useState("");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const canSubmit =
    mentorName.trim() !== "" &&
    menteeName.trim() !== "" &&
    goal.trim() !== "" &&
    startDate !== "" &&
    mentorName.trim() !== menteeName.trim();

  const handleSubmit = () => {
    if (!canSubmit) {
      if (mentorName.trim() === menteeName.trim()) {
        toast.error(TOAST.MEMBERS.MENTORING_SAME_PERSON_ERROR);
        return;
      }
      toast.error(TOAST.MEMBERS.MENTORING_ALL_REQUIRED);
      return;
    }
    onCreated({
      mentorId: crypto.randomUUID(),
      mentorName: mentorName.trim(),
      menteeId: crypto.randomUUID(),
      menteeName: menteeName.trim(),
      goal: goal.trim(),
      startDate,
    });
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          멘토 이름
        </label>
        <Input
          placeholder="멘토 이름을 입력하세요"
          value={mentorName}
          onChange={(e) => setMentorName(e.target.value)}
          className="h-8 text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          멘티 이름
        </label>
        <Input
          placeholder="멘티 이름을 입력하세요"
          value={menteeName}
          onChange={(e) => setMenteeName(e.target.value)}
          className="h-8 text-sm"
        />
      </div>

      {mentorName.trim() !== "" &&
        menteeName.trim() !== "" &&
        mentorName.trim() === menteeName.trim() && (
          <p className="text-xs text-destructive">
            멘토와 멘티 이름을 다르게 입력하세요.
          </p>
        )}

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          멘토링 목표
        </label>
        <Textarea
          placeholder="예: 힙합 기초 동작 마스터하기"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          className="text-sm min-h-[64px] resize-none"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          시작일
        </label>
        <Input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="h-8 text-sm"
        />
      </div>

      <Button className="w-full" onClick={handleSubmit} disabled={!canSubmit}>
        매칭 추가
      </Button>
    </div>
  );
}

// ============================================
// 피드백 추가 폼
// ============================================

type FeedbackFormProps = {
  onSubmit: (
    content: string,
    rating: number,
    writtenBy: "mentor" | "mentee"
  ) => void;
};

function FeedbackForm({ onSubmit }: FeedbackFormProps) {
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(0);
  const [writtenBy, setWrittenBy] = useState<"mentor" | "mentee">("mentor");
  const [hoveredRating, setHoveredRating] = useState(0);

  const canSubmit = content.trim() !== "" && rating > 0;

  const handleSubmit = () => {
    if (!canSubmit) {
      toast.error(TOAST.MEMBERS.MENTORING_FEEDBACK_REQUIRED);
      return;
    }
    onSubmit(content.trim(), rating, writtenBy);
  };

  return (
    <div className="space-y-3">
      {/* 작성자 선택 */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          작성자
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setWrittenBy("mentor")}
            className={`flex-1 py-1.5 rounded-md border text-xs font-medium transition-colors ${
              writtenBy === "mentor"
                ? "bg-yellow-50 border-yellow-300 text-yellow-700"
                : "border-border text-muted-foreground hover:border-yellow-200"
            }`}
          >
            멘토
          </button>
          <button
            type="button"
            onClick={() => setWrittenBy("mentee")}
            className={`flex-1 py-1.5 rounded-md border text-xs font-medium transition-colors ${
              writtenBy === "mentee"
                ? "bg-blue-50 border-blue-300 text-blue-700"
                : "border-border text-muted-foreground hover:border-blue-200"
            }`}
          >
            멘티
          </button>
        </div>
      </div>

      {/* 만족도 별점 */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          만족도
        </label>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }, (_, i) => i + 1).map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="focus:outline-none"
            >
              <Star
                className={`h-5 w-5 transition-colors ${
                  star <= (hoveredRating || rating)
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-muted-foreground"
                }`}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="text-xs text-muted-foreground ml-1">
              {rating}점
            </span>
          )}
        </div>
      </div>

      {/* 피드백 내용 */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          피드백 내용
        </label>
        <Textarea
          placeholder="멘토링 진행 내용, 느낀 점 등을 자유롭게 작성하세요"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="text-sm min-h-[80px] resize-none"
        />
      </div>

      <Button className="w-full" onClick={handleSubmit} disabled={!canSubmit}>
        피드백 저장
      </Button>
    </div>
  );
}
