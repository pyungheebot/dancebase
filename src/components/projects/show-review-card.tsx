"use client";

import { useState } from "react";
import { useShowReview } from "@/hooks/use-show-review";
import type { ShowReviewSource } from "@/types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Plus,
  Trash2,
  Star,
} from "lucide-react";
import { toast } from "sonner";

// ============================================
// 출처 메타데이터
// ============================================

const SOURCE_META: Record<
  ShowReviewSource,
  { label: string; badgeCls: string; dotCls: string }
> = {
  audience: {
    label: "관객",
    badgeCls:
      "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100",
    dotCls: "bg-blue-500",
  },
  member: {
    label: "멤버",
    badgeCls:
      "bg-green-100 text-green-700 border-green-200 hover:bg-green-100",
    dotCls: "bg-green-500",
  },
  judge: {
    label: "심사위원",
    badgeCls:
      "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-100",
    dotCls: "bg-purple-500",
  },
  instructor: {
    label: "강사",
    badgeCls:
      "bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100",
    dotCls: "bg-orange-500",
  },
};

// ============================================
// 별점 컴포넌트
// ============================================

interface StarRatingProps {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: "sm" | "md";
}

function StarRating({
  value,
  onChange,
  readonly = false,
  size = "md",
}: StarRatingProps) {
  const [hovered, setHovered] = useState(0);
  const iconClass = size === "sm" ? "h-3 w-3" : "h-4 w-4";

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = (readonly ? value : hovered || value) >= star;
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onMouseEnter={() => !readonly && setHovered(star)}
            onMouseLeave={() => !readonly && setHovered(0)}
            onClick={() => !readonly && onChange?.(star)}
            className={readonly ? "cursor-default" : "cursor-pointer"}
          >
            <Star
              className={`${iconClass} transition-colors ${
                filled
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}

// ============================================
// 점수 바 컴포넌트
// ============================================

interface ScoreBarProps {
  label: string;
  value: number; // 0~5
}

function ScoreBar({ label, value }: ScoreBarProps) {
  const percent = (value / 5) * 100;
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">{label}</span>
        <span className="text-[11px] font-medium tabular-nums">
          {value > 0 ? value.toFixed(1) : "-"}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-yellow-400 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

// ============================================
// 태그 클라우드 아이템
// ============================================

interface TagCloudItemProps {
  text: string;
  count: number;
  maxCount: number;
  colorCls: string;
}

function TagCloudItem({ text, count, maxCount, colorCls }: TagCloudItemProps) {
  // count 비율에 따라 텍스트 크기 결정
  const ratio = maxCount > 1 ? count / maxCount : 1;
  const sizeClass =
    ratio >= 0.8
      ? "text-sm font-semibold"
      : ratio >= 0.5
      ? "text-xs font-medium"
      : "text-[11px]";

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${colorCls} ${sizeClass}`}
    >
      {text}
      <span className="text-[10px] opacity-70">{count}</span>
    </span>
  );
}

// ============================================
// 리뷰 작성 다이얼로그
// ============================================

interface AddReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (params: {
    reviewerName: string;
    source: ShowReviewSource;
    rating: number;
    choreographyRating: number;
    stagePresenceRating: number;
    teamworkRating: number;
    comment: string;
    highlights: string[];
    improvements: string[];
  }) => boolean;
}

function AddReviewDialog({ open, onOpenChange, onSubmit }: AddReviewDialogProps) {
  const [reviewerName, setReviewerName] = useState("");
  const [source, setSource] = useState<ShowReviewSource>("audience");
  const [rating, setRating] = useState(3);
  const [choreographyRating, setChoreographyRating] = useState(3);
  const [stagePresenceRating, setStagePresenceRating] = useState(3);
  const [teamworkRating, setTeamworkRating] = useState(3);
  const [comment, setComment] = useState("");
  const [highlightsRaw, setHighlightsRaw] = useState("");
  const [improvementsRaw, setImprovementsRaw] = useState("");

  const resetForm = () => {
    setReviewerName("");
    setSource("audience");
    setRating(3);
    setChoreographyRating(3);
    setStagePresenceRating(3);
    setTeamworkRating(3);
    setComment("");
    setHighlightsRaw("");
    setImprovementsRaw("");
  };

  const handleSubmit = () => {
    if (!reviewerName.trim()) {
      toast.error("이름을 입력해주세요.");
      return;
    }
    const highlights = highlightsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const improvements = improvementsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const ok = onSubmit({
      reviewerName,
      source,
      rating,
      choreographyRating,
      stagePresenceRating,
      teamworkRating,
      comment,
      highlights,
      improvements,
    });
    if (ok) {
      resetForm();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">리뷰 작성</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-1">
          {/* 이름 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">이름 *</Label>
            <Input
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              placeholder="예: 홍길동"
              className="h-7 text-xs"
            />
          </div>

          {/* 출처 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">출처 *</Label>
            <Select
              value={source}
              onValueChange={(v) => setSource(v as ShowReviewSource)}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(
                  [
                    "audience",
                    "member",
                    "judge",
                    "instructor",
                  ] as ShowReviewSource[]
                ).map((s) => (
                  <SelectItem key={s} value={s} className="text-xs">
                    {SOURCE_META[s].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 별점 4개 */}
          <div className="space-y-2 border rounded-md p-2.5">
            <p className="text-[11px] font-medium text-muted-foreground">
              별점 평가
            </p>
            {[
              {
                label: "전체 평점",
                value: rating,
                setter: setRating,
              },
              {
                label: "안무",
                value: choreographyRating,
                setter: setChoreographyRating,
              },
              {
                label: "무대 매력",
                value: stagePresenceRating,
                setter: setStagePresenceRating,
              },
              {
                label: "팀워크",
                value: teamworkRating,
                setter: setTeamworkRating,
              },
            ].map(({ label, value, setter }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground w-20">
                  {label}
                </span>
                <StarRating value={value} onChange={setter} />
                <span className="text-[11px] font-medium w-4 text-right">
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* 코멘트 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">코멘트</Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="공연에 대한 자유로운 의견을 작성해주세요."
              className="text-xs min-h-[60px] resize-none"
            />
          </div>

          {/* 하이라이트 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              하이라이트{" "}
              <span className="opacity-60">(쉼표로 구분)</span>
            </Label>
            <Input
              value={highlightsRaw}
              onChange={(e) => setHighlightsRaw(e.target.value)}
              placeholder="예: 칼군무, 표정 연기, 엔딩 포즈"
              className="h-7 text-xs"
            />
          </div>

          {/* 개선점 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              개선점{" "}
              <span className="opacity-60">(쉼표로 구분)</span>
            </Label>
            <Input
              value={improvementsRaw}
              onChange={(e) => setImprovementsRaw(e.target.value)}
              placeholder="예: 대형 전환, 음정, 발성"
              className="h-7 text-xs"
            />
          </div>

          {/* 버튼 */}
          <div className="flex gap-1.5 justify-end pt-0.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
            >
              취소
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
              등록
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 리뷰 아이템
// ============================================

interface ReviewItemProps {
  review: {
    id: string;
    reviewerName: string;
    source: ShowReviewSource;
    rating: number;
    choreographyRating: number;
    stagePresenceRating: number;
    teamworkRating: number;
    comment: string;
    highlights: string[];
    improvements: string[];
    createdAt: string;
  };
  onDelete: (id: string) => void;
}

function ReviewItem({ review, onDelete }: ReviewItemProps) {
  const meta = SOURCE_META[review.source];

  const handleDelete = () => {
    if (confirm(`"${review.reviewerName}"의 리뷰를 삭제하시겠습니까?`)) {
      onDelete(review.id);
      toast.success("리뷰가 삭제되었습니다.");
    }
  };

  return (
    <div className="border rounded-md p-2.5 space-y-1.5">
      {/* 헤더 */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium flex-1 truncate">
          {review.reviewerName}
        </span>
        <Badge
          variant="outline"
          className={`text-[10px] px-1.5 py-0 flex-shrink-0 ${meta.badgeCls}`}
        >
          {meta.label}
        </Badge>
        <StarRating value={review.rating} readonly size="sm" />
        <button
          type="button"
          onClick={handleDelete}
          className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
          aria-label="삭제"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {/* 세부 평점 */}
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
        <span>안무 ★{review.choreographyRating}</span>
        <span>무대 ★{review.stagePresenceRating}</span>
        <span>팀워크 ★{review.teamworkRating}</span>
      </div>

      {/* 코멘트 */}
      {review.comment && (
        <p className="text-xs text-muted-foreground leading-snug">
          {review.comment}
        </p>
      )}

      {/* 하이라이트 칩 */}
      {review.highlights.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {review.highlights.map((h, idx) => (
            <span
              key={idx}
              className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200"
            >
              {h}
            </span>
          ))}
        </div>
      )}

      {/* 개선점 칩 */}
      {review.improvements.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {review.improvements.map((imp, idx) => (
            <span
              key={idx}
              className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200"
            >
              {imp}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// 메인 카드 컴포넌트
// ============================================

interface ShowReviewCardProps {
  groupId: string;
  projectId: string;
}

export function ShowReviewCard({ groupId, projectId }: ShowReviewCardProps) {
  const [open, setOpen] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeSource, setActiveSource] = useState<ShowReviewSource | "all">(
    "all"
  );

  const {
    reviews,
    addReview,
    deleteReview,
    totalReviews,
    averageRating,
    averageChoreography,
    averageStagePresence,
    averageTeamwork,
    sourceDistribution,
    highlightFrequency,
    improvementFrequency,
  } = useShowReview(groupId, projectId);

  const handleAddReview = (params: {
    reviewerName: string;
    source: ShowReviewSource;
    rating: number;
    choreographyRating: number;
    stagePresenceRating: number;
    teamworkRating: number;
    comment: string;
    highlights: string[];
    improvements: string[];
  }) => {
    const ok = addReview(
      params.reviewerName,
      params.source,
      params.rating,
      params.choreographyRating,
      params.stagePresenceRating,
      params.teamworkRating,
      params.comment,
      params.highlights,
      params.improvements
    );
    if (ok) {
      toast.success("리뷰가 등록되었습니다.");
    }
    return ok;
  };

  // 필터 적용
  const filteredReviews =
    activeSource === "all"
      ? reviews
      : reviews.filter((r) => r.source === activeSource);

  const allSources: ShowReviewSource[] = [
    "audience",
    "member",
    "judge",
    "instructor",
  ];

  const maxHighlightCount = highlightFrequency[0]?.count ?? 1;
  const maxImprovementCount = improvementFrequency[0]?.count ?? 1;

  return (
    <>
      <AddReviewDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleAddReview}
      />

      <Collapsible open={open} onOpenChange={setOpen}>
        {/* 카드 헤더 */}
        <div className="flex items-center justify-between px-3 py-2 border rounded-t-lg bg-card">
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-2 flex-1 min-w-0 text-left">
              {open ? (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              )}
              <MessageSquare className="h-4 w-4 text-blue-500 flex-shrink-0" />
              <span className="text-sm font-semibold">공연 리뷰 수집</span>

              {totalReviews > 0 && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100 ml-1"
                >
                  {totalReviews}개
                </Badge>
              )}

              {totalReviews > 0 && (
                <span className="text-[10px] text-muted-foreground ml-1 flex items-center gap-0.5">
                  평균
                  <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400 ml-0.5" />
                  {averageRating}
                </span>
              )}
            </button>
          </CollapsibleTrigger>

          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs flex-shrink-0"
            onClick={() => {
              setDialogOpen(true);
              setOpen(true);
            }}
          >
            <Plus className="h-3 w-3 mr-1" />
            리뷰 작성
          </Button>
        </div>

        {/* 카드 바디 */}
        <CollapsibleContent>
          <div className="border border-t-0 rounded-b-lg p-3 space-y-3 bg-card">
            {/* 빈 상태 */}
            {reviews.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">아직 등록된 리뷰가 없습니다.</p>
                <p className="text-[11px] mt-0.5">
                  공연 후 관객, 멤버, 심사위원의 리뷰를 수집해보세요.
                </p>
              </div>
            )}

            {reviews.length > 0 && (
              <>
                {/* 출처별 분포 */}
                <div className="flex flex-wrap gap-1.5 items-center">
                  {allSources.map((src) => {
                    const count = sourceDistribution[src];
                    if (count === 0) return null;
                    const meta = SOURCE_META[src];
                    return (
                      <div
                        key={src}
                        className="flex items-center gap-1 text-[11px]"
                      >
                        <span
                          className={`inline-block h-2 w-2 rounded-full flex-shrink-0 ${meta.dotCls}`}
                        />
                        <span className="text-muted-foreground">
                          {meta.label}
                        </span>
                        <span className="font-medium">{count}</span>
                      </div>
                    );
                  })}
                </div>

                {/* 평균 점수 바 */}
                <div className="border rounded-md p-2.5 space-y-2">
                  <p className="text-[11px] font-medium text-muted-foreground">
                    평균 점수
                  </p>
                  <ScoreBar label="전체 평점" value={averageRating} />
                  <ScoreBar label="안무" value={averageChoreography} />
                  <ScoreBar label="무대 매력" value={averageStagePresence} />
                  <ScoreBar label="팀워크" value={averageTeamwork} />
                </div>

                {/* 태그 클라우드 - 하이라이트 */}
                {highlightFrequency.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-medium text-muted-foreground">
                      자주 언급된 하이라이트
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {highlightFrequency.map(({ text, count }) => (
                        <TagCloudItem
                          key={text}
                          text={text}
                          count={count}
                          maxCount={maxHighlightCount}
                          colorCls="bg-yellow-50 text-yellow-700 border-yellow-200"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* 태그 클라우드 - 개선점 */}
                {improvementFrequency.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-medium text-muted-foreground">
                      자주 언급된 개선점
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {improvementFrequency.map(({ text, count }) => (
                        <TagCloudItem
                          key={text}
                          text={text}
                          count={count}
                          maxCount={maxImprovementCount}
                          colorCls="bg-red-50 text-red-700 border-red-200"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* 출처별 필터 탭 */}
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveSource("all")}
                    className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                      activeSource === "all"
                        ? "bg-foreground text-background border-foreground"
                        : "text-muted-foreground border-muted hover:border-foreground/40"
                    }`}
                  >
                    전체 ({totalReviews})
                  </button>
                  {allSources.map((src) => {
                    const count = sourceDistribution[src];
                    if (count === 0) return null;
                    const meta = SOURCE_META[src];
                    return (
                      <button
                        key={src}
                        type="button"
                        onClick={() => setActiveSource(src)}
                        className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                          activeSource === src
                            ? "bg-foreground text-background border-foreground"
                            : "text-muted-foreground border-muted hover:border-foreground/40"
                        }`}
                      >
                        {meta.label} ({count})
                      </button>
                    );
                  })}
                </div>

                {/* 리뷰 목록 */}
                <div className="space-y-1.5">
                  {filteredReviews.length === 0 && (
                    <p className="text-[11px] text-muted-foreground text-center py-4">
                      해당 출처의 리뷰가 없습니다.
                    </p>
                  )}
                  {filteredReviews.map((review) => (
                    <ReviewItem
                      key={review.id}
                      review={review}
                      onDelete={deleteReview}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </>
  );
}
