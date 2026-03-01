"use client";

import { useState } from "react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import {
  MapPin,
  Star,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Trophy,
  Users,
  DollarSign,
  LayoutList,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useVenueReview } from "@/hooks/use-venue-review";
import type { VenueReviewEntry } from "@/types";

// ─── 별점 색상 헬퍼 ───────────────────────────────────────────

function ratingColor(rating: number): string {
  if (rating <= 2) return "text-red-500 fill-red-500";
  if (rating === 3) return "text-yellow-500 fill-yellow-500";
  return "text-green-500 fill-green-500";
}

function ratingBgClass(rating: number): string {
  if (rating <= 2) return "bg-red-50 text-red-700 border-red-200";
  if (rating === 3) return "bg-yellow-50 text-yellow-700 border-yellow-200";
  return "bg-green-50 text-green-700 border-green-200";
}

// ─── 별점 표시 컴포넌트 ───────────────────────────────────────

function StarDisplay({
  value,
  size = "md",
}: {
  value: number;
  size?: "sm" | "md";
}) {
  const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";
  const colorClass = ratingColor(value);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${iconSize} transition-colors ${
            n <= value ? colorClass : "text-gray-200 fill-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

// ─── 별점 입력 컴포넌트 ───────────────────────────────────────

function StarInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
          className="cursor-pointer"
        >
          <Star
            className={`h-5 w-5 transition-colors ${
              n <= active
                ? ratingColor(active)
                : "text-gray-300 fill-gray-300"
            }`}
          />
        </button>
      ))}
      {value > 0 && (
        <span className="ml-1 text-xs text-gray-500">{value}점</span>
      )}
    </div>
  );
}

// ─── 세부 별점 행 ─────────────────────────────────────────────

function DetailRatingRow({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-14 text-[10px] text-gray-500 shrink-0">{label}</span>
      <StarDisplay value={value} size="sm" />
      <span
        className={`text-[10px] font-medium ${
          value <= 2 ? "text-red-500" : value === 3 ? "text-yellow-600" : "text-green-600"
        }`}
      >
        {value.toFixed(1)}
      </span>
    </div>
  );
}

// ─── 리뷰 작성 다이얼로그 ────────────────────────────────────

interface AddReviewDialogProps {
  onAdd: (params: Omit<VenueReviewEntry, "id" | "createdAt">) => void;
  prefillVenueName?: string;
}

function AddReviewDialog({ onAdd, prefillVenueName = "" }: AddReviewDialogProps) {
  const [open, setOpen] = useState(false);

  const [venueName, setVenueName] = useState(prefillVenueName);
  const [address, setAddress] = useState("");
  const [rating, setRating] = useState(0);
  const [floorRating, setFloorRating] = useState(0);
  const [mirrorRating, setMirrorRating] = useState(0);
  const [soundRating, setSoundRating] = useState(0);
  const [accessRating, setAccessRating] = useState(0);
  const [pricePerHour, setPricePerHour] = useState("");
  const [capacity, setCapacity] = useState("");
  const [prosText, setProsText] = useState("");
  const [consText, setConsText] = useState("");
  const [comment, setComment] = useState("");
  const [reviewedBy, setReviewedBy] = useState("");
  const [visitDate, setVisitDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const resetForm = () => {
    setVenueName(prefillVenueName);
    setAddress("");
    setRating(0);
    setFloorRating(0);
    setMirrorRating(0);
    setSoundRating(0);
    setAccessRating(0);
    setPricePerHour("");
    setCapacity("");
    setProsText("");
    setConsText("");
    setComment("");
    setReviewedBy("");
    setVisitDate(new Date().toISOString().slice(0, 10));
  };

  const handleSubmit = () => {
    if (!venueName.trim()) {
      toast.error(TOAST.VENUE_REVIEW.NAME_REQUIRED);
      return;
    }
    if (rating === 0) {
      toast.error(TOAST.VENUE_REVIEW.OVERALL_RATING_REQUIRED);
      return;
    }
    if (floorRating === 0 || mirrorRating === 0 || soundRating === 0 || accessRating === 0) {
      toast.error(TOAST.VENUE_REVIEW.DETAIL_RATING_REQUIRED);
      return;
    }
    if (!reviewedBy.trim()) {
      toast.error(TOAST.VENUE_REVIEW.AUTHOR_REQUIRED);
      return;
    }
    if (!visitDate) {
      toast.error(TOAST.VENUE_REVIEW.VISIT_DATE_REQUIRED);
      return;
    }

    const price = pricePerHour.trim() ? Number(pricePerHour) : undefined;
    const cap = capacity.trim() ? Number(capacity) : undefined;

    if (price !== undefined && (isNaN(price) || price < 0)) {
      toast.error(TOAST.VENUE_REVIEW.HOURLY_PRICE_INVALID);
      return;
    }
    if (cap !== undefined && (isNaN(cap) || cap < 0)) {
      toast.error(TOAST.VENUE_REVIEW.CAPACITY_INVALID);
      return;
    }

    const pros = prosText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const cons = consText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    onAdd({
      venueName: venueName.trim(),
      address: address.trim() || undefined,
      rating,
      floorRating,
      mirrorRating,
      soundRating,
      accessRating,
      pricePerHour: price,
      capacity: cap,
      pros,
      cons,
      comment: comment.trim() || undefined,
      reviewedBy: reviewedBy.trim(),
      visitDate,
    });

    toast.success(TOAST.VENUE_REVIEW.REVIEW_REGISTERED);
    setOpen(false);
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 text-xs">
          <Plus className="mr-1 h-3 w-3" />
          리뷰 작성
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm">연습 장소 리뷰 작성</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 장소 기본 정보 */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-gray-700">장소 정보</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px] text-gray-500">장소명 *</Label>
                <Input
                  placeholder="예: 홍대 댄스 스튜디오"
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  className="mt-0.5 h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-[10px] text-gray-500">주소 (선택)</Label>
                <Input
                  placeholder="예: 서울 마포구 홍대로 12"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="mt-0.5 h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-[10px] text-gray-500">시간당 가격 (원)</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="예: 30000"
                  value={pricePerHour}
                  onChange={(e) => setPricePerHour(e.target.value)}
                  className="mt-0.5 h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-[10px] text-gray-500">수용 인원 (명)</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="예: 20"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="mt-0.5 h-8 text-xs"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* 별점 */}
          <div className="space-y-3">
            <Label className="text-xs font-medium text-gray-700">별점 평가</Label>
            <div>
              <Label className="text-[10px] text-gray-500">종합 별점 *</Label>
              <div className="mt-1">
                <StarInput value={rating} onChange={setRating} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[10px] text-gray-500">바닥 상태 *</Label>
                <div className="mt-1">
                  <StarInput value={floorRating} onChange={setFloorRating} />
                </div>
              </div>
              <div>
                <Label className="text-[10px] text-gray-500">거울 상태 *</Label>
                <div className="mt-1">
                  <StarInput value={mirrorRating} onChange={setMirrorRating} />
                </div>
              </div>
              <div>
                <Label className="text-[10px] text-gray-500">음향 시설 *</Label>
                <div className="mt-1">
                  <StarInput value={soundRating} onChange={setSoundRating} />
                </div>
              </div>
              <div>
                <Label className="text-[10px] text-gray-500">접근성 *</Label>
                <div className="mt-1">
                  <StarInput value={accessRating} onChange={setAccessRating} />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* 장단점 & 코멘트 */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-gray-700">장단점 & 코멘트</Label>
            <div>
              <Label className="text-[10px] text-gray-500">장점 (쉼표로 구분)</Label>
              <Input
                placeholder="예: 거울 크다, 주차 편리, 청결함"
                value={prosText}
                onChange={(e) => setProsText(e.target.value)}
                className="mt-0.5 h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-[10px] text-gray-500">단점 (쉼표로 구분)</Label>
              <Input
                placeholder="예: 환기 부족, 주변 소음"
                value={consText}
                onChange={(e) => setConsText(e.target.value)}
                className="mt-0.5 h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-[10px] text-gray-500">추가 코멘트 (선택)</Label>
              <Textarea
                placeholder="자유롭게 작성해주세요."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="mt-0.5 text-xs resize-none"
                rows={3}
              />
            </div>
          </div>

          <Separator />

          {/* 작성자 & 방문일 */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px] text-gray-500">작성자 *</Label>
              <Input
                placeholder="이름 또는 닉네임"
                value={reviewedBy}
                onChange={(e) => setReviewedBy(e.target.value)}
                className="mt-0.5 h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-[10px] text-gray-500">방문일 *</Label>
              <Input
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="mt-0.5 h-8 text-xs"
              />
            </div>
          </div>

          <Button className="w-full h-8 text-xs" onClick={handleSubmit}>
            리뷰 등록
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── 개별 리뷰 카드 ───────────────────────────────────────────

function ReviewCard({
  review,
  onDelete,
}: {
  review: VenueReviewEntry;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="rounded-lg border border-gray-100 bg-card p-3 shadow-sm space-y-2">
      {/* 헤더: 장소명 + 종합 별점 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <MapPin className="h-3 w-3 text-green-600 shrink-0" />
            <span className="text-xs font-semibold text-gray-800 truncate">
              {review.venueName}
            </span>
          </div>
          {review.address && (
            <p className="mt-0.5 text-[10px] text-gray-400 truncate">
              {review.address}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <div className="flex items-center gap-1">
            <StarDisplay value={review.rating} size="sm" />
            <span
              className={`text-[10px] font-bold ${
                review.rating <= 2
                  ? "text-red-500"
                  : review.rating === 3
                  ? "text-yellow-600"
                  : "text-green-600"
              }`}
            >
              {review.rating}.0
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 text-gray-300 hover:text-red-500"
            onClick={() => {
              onDelete(review.id);
              toast.success(TOAST.VENUE_REVIEW.REVIEW_DELETED);
            }}
          >
            <Trash2 className="h-2.5 w-2.5" />
          </Button>
        </div>
      </div>

      {/* 세부 별점 */}
      <div className="grid grid-cols-2 gap-1">
        <DetailRatingRow label="바닥" value={review.floorRating} />
        <DetailRatingRow label="거울" value={review.mirrorRating} />
        <DetailRatingRow label="음향" value={review.soundRating} />
        <DetailRatingRow label="접근성" value={review.accessRating} />
      </div>

      {/* 부가 정보 */}
      {(review.pricePerHour !== undefined || review.capacity !== undefined) && (
        <div className="flex items-center gap-3">
          {review.pricePerHour !== undefined && (
            <span className="flex items-center gap-0.5 text-[10px] text-green-700">
              <DollarSign className="h-2.5 w-2.5" />
              {review.pricePerHour.toLocaleString()}원/h
            </span>
          )}
          {review.capacity !== undefined && (
            <span className="flex items-center gap-0.5 text-[10px] text-blue-600">
              <Users className="h-2.5 w-2.5" />
              최대 {review.capacity}명
            </span>
          )}
        </div>
      )}

      {/* 장단점 칩 */}
      {(review.pros.length > 0 || review.cons.length > 0) && (
        <div className="flex flex-wrap gap-1">
          {review.pros.map((p, i) => (
            <Badge
              key={`pro-${i}`}
              className="bg-green-50 text-[10px] px-1.5 py-0 text-green-700 border border-green-200 hover:bg-green-50"
            >
              + {p}
            </Badge>
          ))}
          {review.cons.map((c, i) => (
            <Badge
              key={`con-${i}`}
              className="bg-red-50 text-[10px] px-1.5 py-0 text-red-600 border border-red-200 hover:bg-red-50"
            >
              - {c}
            </Badge>
          ))}
        </div>
      )}

      {/* 코멘트 */}
      {review.comment && (
        <p className="text-[10px] text-gray-500 italic border-l-2 border-gray-200 pl-2">
          &ldquo;{review.comment}&rdquo;
        </p>
      )}

      {/* 작성자 & 방문일 */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-gray-400">
          {review.reviewedBy}
        </span>
        <span className="text-[10px] text-gray-400">{review.visitDate}</span>
      </div>
    </div>
  );
}

// ─── 장소 랭킹 뷰 ─────────────────────────────────────────────

function VenueRankingView({
  groupId,
}: {
  groupId: string;
}) {
  const { getVenueRanking, getVenueStats } = useVenueReview(groupId);
  const ranking = getVenueRanking();

  if (ranking.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 py-8 text-gray-400">
        <Trophy className="h-8 w-8 opacity-30" />
        <p className="text-xs">장소 랭킹 데이터가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {ranking.map((item, idx) => {
        const stats = getVenueStats(item.venueName);
        return (
          <div
            key={item.venueName}
            className={`rounded-lg border p-3 ${
              idx === 0
                ? "border-yellow-300 bg-yellow-50 ring-1 ring-yellow-200"
                : "border-gray-200 bg-card"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`text-xs font-bold shrink-0 w-5 text-center ${
                    idx === 0
                      ? "text-yellow-600"
                      : idx === 1
                      ? "text-gray-500"
                      : idx === 2
                      ? "text-orange-500"
                      : "text-gray-400"
                  }`}
                >
                  {idx === 0 ? "1" : idx === 1 ? "2" : idx === 2 ? "3" : `${idx + 1}`}
                </span>
                {idx === 0 && <Trophy className="h-3.5 w-3.5 text-yellow-500 shrink-0" />}
                <span className="text-xs font-semibold text-gray-800 truncate">
                  {item.venueName}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StarDisplay value={Math.round(item.avgRating)} size="sm" />
                <Badge
                  className={`text-[10px] px-1.5 py-0 border ${ratingBgClass(item.avgRating)}`}
                >
                  {item.avgRating.toFixed(1)}
                </Badge>
                <span className="text-[10px] text-gray-400">
                  ({item.count}개)
                </span>
              </div>
            </div>

            {/* 세부 평균 */}
            <div className="mt-2 grid grid-cols-4 gap-1">
              {[
                { label: "바닥", val: stats.avgFloor },
                { label: "거울", val: stats.avgMirror },
                { label: "음향", val: stats.avgSound },
                { label: "접근성", val: stats.avgAccess },
              ].map(({ label, val }) => (
                <div
                  key={label}
                  className="flex flex-col items-center rounded bg-gray-50 py-1"
                >
                  <span className="text-[9px] text-gray-400">{label}</span>
                  <span
                    className={`text-[10px] font-medium ${
                      val <= 2
                        ? "text-red-500"
                        : val === 3
                        ? "text-yellow-600"
                        : "text-green-600"
                    }`}
                  >
                    {val.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>

            {item.avgPrice !== null && (
              <p className="mt-1.5 flex items-center gap-0.5 text-[10px] text-green-700">
                <DollarSign className="h-2.5 w-2.5" />
                평균 {item.avgPrice.toLocaleString()}원/h
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── 메인 카드 ────────────────────────────────────────────────

interface VenueReviewCardProps {
  groupId: string;
}

export function VenueReviewCard({ groupId }: VenueReviewCardProps) {
  const [open, setOpen] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "ranking">("list");
  const [venueFilter, setVenueFilter] = useState<string>("all");

  const {
    reviews,
    addReview,
    deleteReview,
    uniqueVenues,
    totalReviews,
    topRatedVenue,
    averagePrice,
  } = useVenueReview(groupId);

  const filteredReviews =
    venueFilter === "all"
      ? reviews
      : reviews.filter(
          (r) =>
            r.venueName.trim().toLowerCase() ===
            venueFilter.trim().toLowerCase()
        );

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      {/* 헤더 */}
      <div className="flex items-center justify-between rounded-t-lg border border-b-0 border-gray-200 bg-background px-4 py-2.5">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-green-600" />
          <span className="text-sm font-semibold text-gray-800">
            연습 장소 리뷰
          </span>
          {totalReviews > 0 && (
            <Badge className="bg-green-100 text-[10px] px-1.5 py-0 text-green-700 hover:bg-green-100">
              {totalReviews}
            </Badge>
          )}
          {uniqueVenues.length > 0 && (
            <Badge className="bg-blue-50 text-[10px] px-1.5 py-0 text-blue-700 hover:bg-blue-50 border border-blue-200">
              {uniqueVenues.length}개 장소
            </Badge>
          )}
        </div>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
            {open ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </Button>
        </CollapsibleTrigger>
      </div>

      {/* 본문 */}
      <CollapsibleContent>
        <Card className="rounded-t-none border-t-0 shadow-none">
          <CardHeader className="px-4 pb-2 pt-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-xs text-gray-500 font-normal">
                사용해본 연습 장소에 대한 리뷰를 남겨보세요.
              </CardTitle>
              <div className="flex items-center gap-1 shrink-0">
                {/* 뷰 모드 토글 */}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() =>
                    setViewMode((v) => (v === "list" ? "ranking" : "list"))
                  }
                >
                  {viewMode === "list" ? (
                    <>
                      <BarChart3 className="h-3 w-3" />
                      랭킹
                    </>
                  ) : (
                    <>
                      <LayoutList className="h-3 w-3" />
                      목록
                    </>
                  )}
                </Button>
                <AddReviewDialog onAdd={addReview} />
              </div>
            </div>

            {/* 통계 요약 */}
            {totalReviews > 0 && (
              <div className="mt-2 flex items-center gap-3 flex-wrap">
                {topRatedVenue && (
                  <span className="flex items-center gap-1 text-[10px] text-yellow-700">
                    <Trophy className="h-2.5 w-2.5" />
                    최고: {topRatedVenue}
                  </span>
                )}
                {averagePrice !== null && (
                  <span className="flex items-center gap-1 text-[10px] text-green-700">
                    <DollarSign className="h-2.5 w-2.5" />
                    평균 {averagePrice.toLocaleString()}원/h
                  </span>
                )}
              </div>
            )}
          </CardHeader>

          <CardContent className="px-4 pb-4 space-y-3">
            {viewMode === "list" ? (
              <>
                {/* 장소 필터 */}
                {uniqueVenues.length > 1 && (
                  <Select value={venueFilter} onValueChange={setVenueFilter}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="장소 필터" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs">
                        전체 장소
                      </SelectItem>
                      {uniqueVenues.map((v) => (
                        <SelectItem key={v} value={v} className="text-xs">
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                <Separator />

                {/* 리뷰 목록 */}
                {filteredReviews.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-1 py-8 text-gray-400">
                    <MapPin className="h-8 w-8 opacity-30" />
                    <p className="text-xs">등록된 리뷰가 없습니다.</p>
                    <p className="text-[10px] text-gray-300">
                      위 &apos;리뷰 작성&apos; 버튼을 눌러 첫 리뷰를 남겨보세요.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredReviews.map((review) => (
                      <ReviewCard
                        key={review.id}
                        review={review}
                        onDelete={deleteReview}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <Separator />
                <VenueRankingView groupId={groupId} />
              </>
            )}
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}
