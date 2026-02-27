"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  MapPin,
  Star,
  ThumbsUp,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  MessageSquarePlus,
  Trophy,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Separator } from "@/components/ui/separator";
import { useVenueReview, type VenueSortType } from "@/hooks/use-venue-review";
import type { VenueEntry, VenueFeature } from "@/types";

// ─── 시설 설정 ────────────────────────────────────────────────

const FEATURE_META: Record<VenueFeature, { label: string; emoji: string }> = {
  mirror:  { label: "거울",    emoji: "🪞" },
  sound:   { label: "음향",    emoji: "🔊" },
  parking: { label: "주차",    emoji: "🅿️" },
  aircon:  { label: "에어컨",  emoji: "❄️" },
  floor:   { label: "바닥",    emoji: "🟫" },
  shower:  { label: "샤워",    emoji: "🚿" },
  wifi:    { label: "와이파이", emoji: "📶" },
  storage: { label: "보관함",  emoji: "🗄️" },
};

const ALL_FEATURES: VenueFeature[] = [
  "mirror", "sound", "parking", "aircon", "floor", "shower", "wifi", "storage",
];

// ─── 별점 컴포넌트 ────────────────────────────────────────────

function StarRating({
  value,
  onChange,
  readOnly = false,
  size = "md",
}: {
  value: number;
  onChange?: (v: number) => void;
  readOnly?: boolean;
  size?: "sm" | "md";
}) {
  const [hovered, setHovered] = useState(0);
  const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = readOnly ? n <= value : n <= (hovered || value);
        return (
          <button
            key={n}
            type="button"
            disabled={readOnly}
            onMouseEnter={() => !readOnly && setHovered(n)}
            onMouseLeave={() => !readOnly && setHovered(0)}
            onClick={() => !readOnly && onChange?.(n)}
            className={readOnly ? "cursor-default" : "cursor-pointer"}
          >
            <Star
              className={`${iconSize} transition-colors ${
                filled ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}

// ─── 시설 배지 ────────────────────────────────────────────────

function FeatureBadge({ feature }: { feature: VenueFeature }) {
  const { label, emoji } = FEATURE_META[feature];
  return (
    <Badge className="bg-blue-50 text-[10px] px-1.5 py-0 text-blue-700 hover:bg-blue-50 border border-blue-200">
      {emoji} {label}
    </Badge>
  );
}

// ─── 장소 추가 폼 ─────────────────────────────────────────────

function AddVenueForm({
  onAdd,
}: {
  onAdd: (v: Omit<VenueEntry, "id" | "createdAt">) => boolean;
}) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [features, setFeatures] = useState<VenueFeature[]>([]);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const toggleFeature = (f: VenueFeature) => {
    setFeatures((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("장소 이름을 입력해주세요.");
      return;
    }
    if (!address.trim()) {
      toast.error("주소를 입력해주세요.");
      return;
    }
    const rate = Number(hourlyRate);
    if (isNaN(rate) || rate < 0) {
      toast.error("시간당 비용을 올바르게 입력해주세요.");
      return;
    }
    setSubmitting(true);
    const ok = onAdd({
      name: name.trim(),
      address: address.trim(),
      hourlyRate: rate,
      features,
      note: note.trim(),
    });
    setSubmitting(false);
    if (ok) {
      toast.success("장소가 등록되었습니다.");
      setName("");
      setAddress("");
      setHourlyRate("");
      setFeatures([]);
      setNote("");
    } else {
      toast.error("장소 등록에 실패했습니다.");
    }
  };

  return (
    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 space-y-2">
      <p className="text-xs font-medium text-gray-600">새 장소 등록</p>

      <div className="grid grid-cols-2 gap-2">
        <Input
          placeholder="장소 이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-8 text-xs"
        />
        <Input
          placeholder="주소"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="h-8 text-xs"
        />
      </div>

      <div className="flex items-center gap-2">
        <DollarSign className="h-3 w-3 text-gray-400 shrink-0" />
        <Input
          placeholder="시간당 비용 (원)"
          type="number"
          min="0"
          value={hourlyRate}
          onChange={(e) => setHourlyRate(e.target.value)}
          className="h-8 text-xs"
        />
      </div>

      {/* 시설 체크박스 */}
      <div>
        <p className="mb-1.5 text-[10px] text-gray-500">시설 선택</p>
        <div className="flex flex-wrap gap-1.5">
          {ALL_FEATURES.map((f) => {
            const { label, emoji } = FEATURE_META[f];
            const selected = features.includes(f);
            return (
              <button
                key={f}
                type="button"
                onClick={() => toggleFeature(f)}
                className={`flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-[10px] transition-colors ${
                  selected
                    ? "border-blue-400 bg-blue-50 text-blue-700"
                    : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                }`}
              >
                {emoji} {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 메모 */}
      <Input
        placeholder="메모 (선택)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="h-8 text-xs"
      />

      <Button
        size="sm"
        className="h-7 w-full text-xs"
        onClick={handleSubmit}
        disabled={submitting}
      >
        <Plus className="mr-1 h-3 w-3" />
        장소 등록
      </Button>
    </div>
  );
}

// ─── 리뷰 작성 폼 ─────────────────────────────────────────────

function AddReviewForm({
  venueId,
  onAdd,
  onClose,
}: {
  venueId: string;
  onAdd: (params: {
    venueId: string;
    reviewerName: string;
    rating: number;
    pros: string;
    cons: string;
  }) => boolean;
  onClose: () => void;
}) {
  const [reviewerName, setReviewerName] = useState("");
  const [rating, setRating] = useState(0);
  const [pros, setPros] = useState("");
  const [cons, setCons] = useState("");

  const handleSubmit = () => {
    if (rating === 0) {
      toast.error("별점을 선택해주세요.");
      return;
    }
    const ok = onAdd({
      venueId,
      reviewerName: reviewerName.trim() || "익명",
      rating,
      pros: pros.trim(),
      cons: cons.trim(),
    });
    if (ok) {
      toast.success("리뷰가 등록되었습니다.");
      onClose();
    } else {
      toast.error("리뷰 등록에 실패했습니다.");
    }
  };

  return (
    <div className="mt-2 rounded-lg border border-dashed border-purple-200 bg-purple-50 p-3 space-y-2">
      <p className="text-xs font-medium text-purple-700">리뷰 작성</p>

      <div className="flex items-center gap-2">
        <Input
          placeholder="작성자 (선택)"
          value={reviewerName}
          onChange={(e) => setReviewerName(e.target.value)}
          className="h-8 text-xs"
        />
        <StarRating value={rating} onChange={setRating} />
      </div>

      <Input
        placeholder="장점"
        value={pros}
        onChange={(e) => setPros(e.target.value)}
        className="h-8 text-xs"
      />
      <Input
        placeholder="단점"
        value={cons}
        onChange={(e) => setCons(e.target.value)}
        className="h-8 text-xs"
      />

      <div className="flex gap-2">
        <Button
          size="sm"
          className="h-7 flex-1 text-xs"
          onClick={handleSubmit}
        >
          등록
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs"
          onClick={onClose}
        >
          취소
        </Button>
      </div>
    </div>
  );
}

// ─── 장소 카드 아이템 ─────────────────────────────────────────

function VenueItem({
  venue,
  averageRating,
  reviewCount,
  reviews,
  isRecommended,
  onDelete,
  onAddReview,
  onDeleteReview,
}: {
  venue: VenueEntry;
  averageRating: number;
  reviewCount: number;
  reviews: ReturnType<typeof useVenueReview>["reviews"];
  isRecommended: boolean;
  onDelete: (id: string) => void;
  onAddReview: (params: {
    venueId: string;
    reviewerName: string;
    rating: number;
    pros: string;
    cons: string;
  }) => boolean;
  onDeleteReview: (reviewId: string) => void;
}) {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showReviews, setShowReviews] = useState(false);

  const venueReviews = reviews.filter((r) => r.venueId === venue.id);

  return (
    <div
      className={`rounded-lg border p-3 ${
        isRecommended
          ? "border-yellow-400 bg-yellow-50 ring-1 ring-yellow-300"
          : "border-gray-200 bg-white"
      }`}
    >
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            {isRecommended && (
              <Trophy className="h-3.5 w-3.5 text-yellow-500 shrink-0" />
            )}
            <span className="text-sm font-semibold text-gray-800 truncate">
              {venue.name}
            </span>
            {isRecommended && (
              <Badge className="bg-yellow-100 text-[10px] px-1.5 py-0 text-yellow-700 hover:bg-yellow-100 border border-yellow-300">
                추천
              </Badge>
            )}
          </div>

          <div className="mt-0.5 flex items-center gap-1 text-[10px] text-gray-500">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{venue.address}</span>
          </div>

          <div className="mt-1 flex items-center gap-2 flex-wrap">
            {/* 평점 */}
            <div className="flex items-center gap-1">
              <StarRating value={Math.round(averageRating)} readOnly size="sm" />
              <span className="text-[10px] text-gray-500">
                {averageRating > 0 ? averageRating.toFixed(1) : "-"}
                <span className="ml-0.5 text-gray-400">({reviewCount})</span>
              </span>
            </div>

            {/* 시간당 비용 */}
            <span className="flex items-center gap-0.5 text-[10px] text-green-700">
              <DollarSign className="h-3 w-3" />
              {venue.hourlyRate.toLocaleString()}원/h
            </span>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-gray-300 hover:text-red-500 shrink-0"
          onClick={() => {
            onDelete(venue.id);
            toast.success("장소가 삭제되었습니다.");
          }}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* 시설 배지 */}
      {venue.features.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {venue.features.map((f) => (
            <FeatureBadge key={f} feature={f} />
          ))}
        </div>
      )}

      {/* 메모 */}
      {venue.note && (
        <p className="mt-1.5 text-[10px] text-gray-500 italic">
          {venue.note}
        </p>
      )}

      {/* 리뷰 목록 토글 */}
      <div className="mt-2 flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-[10px] text-gray-500"
          onClick={() => setShowReviews((v) => !v)}
        >
          <ThumbsUp className="mr-1 h-3 w-3" />
          리뷰 {reviewCount}개
          {showReviews ? (
            <ChevronUp className="ml-1 h-3 w-3" />
          ) : (
            <ChevronDown className="ml-1 h-3 w-3" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-[10px] text-purple-600 hover:text-purple-700"
          onClick={() => setShowReviewForm((v) => !v)}
        >
          <MessageSquarePlus className="mr-1 h-3 w-3" />
          리뷰 작성
        </Button>
      </div>

      {/* 리뷰 목록 */}
      {showReviews && venueReviews.length > 0 && (
        <div className="mt-2 space-y-2">
          {venueReviews.map((r) => (
            <div
              key={r.id}
              className="rounded-md border border-gray-100 bg-gray-50 p-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-medium text-gray-700">
                    {r.reviewerName}
                  </span>
                  <StarRating value={r.rating} readOnly size="sm" />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 text-gray-300 hover:text-red-500"
                  onClick={() => {
                    onDeleteReview(r.id);
                    toast.success("리뷰가 삭제되었습니다.");
                  }}
                >
                  <Trash2 className="h-2.5 w-2.5" />
                </Button>
              </div>
              {r.pros && (
                <p className="mt-1 text-[10px] text-green-700">
                  <span className="font-medium">장점: </span>
                  {r.pros}
                </p>
              )}
              {r.cons && (
                <p className="mt-0.5 text-[10px] text-red-600">
                  <span className="font-medium">단점: </span>
                  {r.cons}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {showReviews && venueReviews.length === 0 && (
        <p className="mt-2 text-center text-[10px] text-gray-400">
          아직 리뷰가 없습니다.
        </p>
      )}

      {/* 리뷰 작성 폼 */}
      {showReviewForm && (
        <AddReviewForm
          venueId={venue.id}
          onAdd={onAddReview}
          onClose={() => setShowReviewForm(false)}
        />
      )}
    </div>
  );
}

// ─── 메인 카드 ────────────────────────────────────────────────

interface VenueReviewCardProps {
  groupId: string;
}

export function VenueReviewCard({ groupId }: VenueReviewCardProps) {
  const [open, setOpen] = useState(true);
  const [sort, setSort] = useState<VenueSortType>("rating");
  const [showAddForm, setShowAddForm] = useState(false);

  const {
    reviews,
    addVenue,
    deleteVenue,
    addReview,
    deleteReview,
    getAverageRating,
    getReviewCount,
    recommendedVenues,
    sortedVenues,
  } = useVenueReview(groupId);

  const sorted = sortedVenues(sort);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      {/* 헤더 */}
      <div className="flex items-center justify-between rounded-t-lg border border-b-0 border-gray-200 bg-white px-4 py-2.5">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-green-600" />
          <span className="text-sm font-semibold text-gray-800">
            연습 장소 리뷰
          </span>
          {sorted.length > 0 && (
            <Badge className="bg-green-100 text-[10px] px-1.5 py-0 text-green-700 hover:bg-green-100">
              {sorted.length}
            </Badge>
          )}
          {recommendedVenues.length > 0 && (
            <Badge className="bg-yellow-100 text-[10px] px-1.5 py-0 text-yellow-700 hover:bg-yellow-100 border border-yellow-300">
              <Trophy className="mr-0.5 h-2.5 w-2.5" />
              추천 {recommendedVenues.length}
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
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs text-gray-500 font-normal">
                그룹에서 사용하는 연습 장소를 등록하고 리뷰를 남겨보세요.
              </CardTitle>
              <div className="flex items-center gap-1">
                {/* 정렬 토글 */}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() =>
                    setSort((s) => (s === "rating" ? "price" : "rating"))
                  }
                >
                  <SlidersHorizontal className="h-3 w-3" />
                  {sort === "rating" ? "평점순" : "가격순"}
                </Button>
                {/* 장소 추가 토글 */}
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => setShowAddForm((v) => !v)}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  장소 추가
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="px-4 pb-4 space-y-3">
            {/* 장소 추가 폼 */}
            {showAddForm && (
              <AddVenueForm
                onAdd={(params) => {
                  const ok = addVenue(params);
                  if (ok) setShowAddForm(false);
                  return ok;
                }}
              />
            )}

            <Separator />

            {/* 장소 목록 */}
            {sorted.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-1 py-8 text-gray-400">
                <MapPin className="h-8 w-8 opacity-30" />
                <p className="text-xs">등록된 연습 장소가 없습니다.</p>
                <p className="text-[10px] text-gray-300">
                  위 &apos;장소 추가&apos; 버튼을 눌러 첫 장소를 등록해보세요.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {sorted.map((venue) => (
                  <VenueItem
                    key={venue.id}
                    venue={venue}
                    averageRating={getAverageRating(venue.id)}
                    reviewCount={getReviewCount(venue.id)}
                    reviews={reviews}
                    isRecommended={recommendedVenues.some(
                      (v) => v.id === venue.id
                    )}
                    onDelete={deleteVenue}
                    onAddReview={addReview}
                    onDeleteReview={deleteReview}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}
