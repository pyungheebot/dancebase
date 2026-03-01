"use client";

import { useState } from "react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import {
  MapPin,
  Star,
  Plus,
  Trash2,
  Heart,
  Phone,
  Globe,
  Users,
  Maximize2,
  ChevronDown,
  ChevronUp,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
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
import { usePracticeVenue } from "@/hooks/use-practice-venue";
import type {
  PracticeVenueEntry,
  PracticeVenueFacility,
  PracticeVenueStatus,
} from "@/types";

// ─── 상수 ─────────────────────────────────────────────────────

const FACILITY_LABELS: Record<PracticeVenueFacility, string> = {
  mirror: "거울",
  sound: "음향",
  parking: "주차",
  shower: "샤워실",
  locker: "사물함",
  aircon: "에어컨",
  heating: "난방",
  piano: "피아노",
  stage: "무대",
  bar: "연습봉",
};

const ALL_FACILITIES: PracticeVenueFacility[] = [
  "mirror",
  "sound",
  "parking",
  "shower",
  "locker",
  "aircon",
  "heating",
  "piano",
  "stage",
  "bar",
];

const STATUS_LABELS: Record<PracticeVenueStatus, string> = {
  available: "예약 가능",
  booked: "예약됨",
  unavailable: "이용 불가",
  unknown: "미확인",
};

const STATUS_BADGE_CLASS: Record<PracticeVenueStatus, string> = {
  available: "bg-green-50 text-green-700 border-green-200",
  booked: "bg-blue-50 text-blue-700 border-blue-200",
  unavailable: "bg-red-50 text-red-700 border-red-200",
  unknown: "bg-gray-50 text-gray-600 border-gray-200",
};

// ─── 별점 표시 ────────────────────────────────────────────────

function StarDisplay({ value, size = "sm" }: { value: number; size?: "sm" | "md" }) {
  const iconCls = size === "sm" ? "h-3 w-3" : "h-4 w-4";
  const colorCls =
    value <= 2
      ? "text-red-400 fill-red-400"
      : value <= 3
      ? "text-yellow-400 fill-yellow-400"
      : "text-green-500 fill-green-500";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${iconCls} transition-colors ${
            n <= Math.round(value) ? colorCls : "text-gray-200 fill-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

// ─── 별점 입력 ────────────────────────────────────────────────

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;
  const colorCls =
    active <= 2
      ? "text-red-400 fill-red-400"
      : active <= 3
      ? "text-yellow-400 fill-yellow-400"
      : "text-green-500 fill-green-500";
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
              n <= active ? colorCls : "text-gray-300 fill-gray-300"
            }`}
          />
        </button>
      ))}
      {value > 0 && <span className="ml-1 text-xs text-gray-500">{value}점</span>}
    </div>
  );
}

// ─── 장소 추가 다이얼로그 ─────────────────────────────────────

interface AddVenueDialogProps {
  onAdd: (
    input: Omit<PracticeVenueEntry, "id" | "ratingCount" | "isFavorite" | "createdAt">
  ) => Promise<void>;
}

function AddVenueDialog({ onAdd }: AddVenueDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [costPerHour, setCostPerHour] = useState("");
  const [capacity, setCapacity] = useState("");
  const [size, setSize] = useState("");
  const [selectedFacilities, setSelectedFacilities] = useState<PracticeVenueFacility[]>([]);
  const [status, setStatus] = useState<PracticeVenueStatus>("unknown");
  const [rating, setRating] = useState(0);
  const [memo, setMemo] = useState("");
  const [lastUsedAt, setLastUsedAt] = useState("");

  const resetForm = () => {
    setName("");
    setAddress("");
    setPhone("");
    setWebsite("");
    setCostPerHour("");
    setCapacity("");
    setSize("");
    setSelectedFacilities([]);
    setStatus("unknown");
    setRating(0);
    setMemo("");
    setLastUsedAt("");
  };

  const toggleFacility = (f: PracticeVenueFacility) => {
    setSelectedFacilities((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error(TOAST.PRACTICE_VENUE.NAME_REQUIRED);
      return;
    }
    const cost = costPerHour.trim() ? Number(costPerHour) : undefined;
    const cap = capacity.trim() ? Number(capacity) : undefined;
    const sz = size.trim() ? Number(size) : undefined;

    if (cost !== undefined && (isNaN(cost) || cost < 0)) {
      toast.error(TOAST.PRACTICE_VENUE.HOURLY_COST_INVALID);
      return;
    }
    if (cap !== undefined && (isNaN(cap) || cap < 1)) {
      toast.error(TOAST.PRACTICE_VENUE.CAPACITY_INVALID);
      return;
    }
    if (sz !== undefined && (isNaN(sz) || sz < 1)) {
      toast.error(TOAST.PRACTICE_VENUE.AREA_INVALID);
      return;
    }

    await onAdd({
      name: name.trim(),
      address: address.trim() || undefined,
      phone: phone.trim() || undefined,
      website: website.trim() || undefined,
      costPerHour: cost,
      capacity: cap,
      size: sz,
      facilities: selectedFacilities,
      status,
      rating: rating > 0 ? rating : undefined,
      memo: memo.trim() || undefined,
      lastUsedAt: lastUsedAt || undefined,
    });

    toast.success(TOAST.PRACTICE_VENUE.REGISTERED);
    setOpen(false);
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 text-xs">
          <Plus className="mr-1 h-3 w-3" />
          장소 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm">연습 장소 추가</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 기본 정보 */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-gray-700">기본 정보</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2">
                <Label className="text-[10px] text-gray-500">장소명 *</Label>
                <Input
                  placeholder="예: 홍대 댄스 스튜디오"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-0.5 h-8 text-xs"
                />
              </div>
              <div className="col-span-2">
                <Label className="text-[10px] text-gray-500">주소</Label>
                <Input
                  placeholder="예: 서울 마포구 홍대로 12"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="mt-0.5 h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-[10px] text-gray-500">전화번호</Label>
                <Input
                  placeholder="예: 02-1234-5678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-0.5 h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-[10px] text-gray-500">웹사이트</Label>
                <Input
                  placeholder="예: https://studio.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="mt-0.5 h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-[10px] text-gray-500">시간당 비용 (원)</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="예: 30000"
                  value={costPerHour}
                  onChange={(e) => setCostPerHour(e.target.value)}
                  className="mt-0.5 h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-[10px] text-gray-500">수용 인원 (명)</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="예: 20"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="mt-0.5 h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-[10px] text-gray-500">면적 (m²)</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="예: 50"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="mt-0.5 h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-[10px] text-gray-500">마지막 이용일</Label>
                <Input
                  type="date"
                  value={lastUsedAt}
                  onChange={(e) => setLastUsedAt(e.target.value)}
                  className="mt-0.5 h-8 text-xs"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* 예약 상태 */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-700">예약 상태</Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as PracticeVenueStatus)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(STATUS_LABELS) as PracticeVenueStatus[]).map(
                  (s) => (
                    <SelectItem key={s} value={s} className="text-xs">
                      {STATUS_LABELS[s]}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* 시설 */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-gray-700">시설</Label>
            <div className="grid grid-cols-2 gap-1.5">
              {ALL_FACILITIES.map((f) => (
                <div key={f} className="flex items-center gap-2">
                  <Checkbox
                    id={`facility-${f}`}
                    checked={selectedFacilities.includes(f)}
                    onCheckedChange={() => toggleFacility(f)}
                    className="h-3.5 w-3.5"
                  />
                  <label
                    htmlFor={`facility-${f}`}
                    className="text-xs text-gray-700 cursor-pointer"
                  >
                    {FACILITY_LABELS[f]}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* 초기 평점 */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-700">
              초기 평점 (선택)
            </Label>
            <StarInput value={rating} onChange={setRating} />
          </div>

          <Separator />

          {/* 메모 */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-700">메모 (선택)</Label>
            <Textarea
              placeholder="특이사항이나 참고 사항을 자유롭게 입력하세요."
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="text-xs resize-none"
              rows={3}
            />
          </div>

          <Button className="w-full h-8 text-xs" onClick={handleSubmit}>
            장소 등록
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── 빠른 평점 다이얼로그 ─────────────────────────────────────

function RateVenueDialog({
  venue,
  onRate,
}: {
  venue: PracticeVenueEntry;
  onRate: (id: string, rating: number) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error(TOAST.PRACTICE_VENUE.RATING_REQUIRED);
      return;
    }
    await onRate(venue.id, rating);
    toast.success(TOAST.PRACTICE_VENUE.RATING_REGISTERED);
    setOpen(false);
    setRating(0);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-6 text-[10px] px-2 gap-1"
        >
          <Star className="h-3 w-3" />
          평점
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-sm">{venue.name} 평점</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {venue.rating != null && (
            <p className="text-xs text-gray-500">
              현재 평균: {venue.rating.toFixed(1)}점 ({venue.ratingCount}명 참여)
            </p>
          )}
          <div>
            <Label className="text-xs text-gray-700">내 평점</Label>
            <div className="mt-1.5">
              <StarInput value={rating} onChange={setRating} />
            </div>
          </div>
          <Button className="w-full h-8 text-xs" onClick={handleSubmit}>
            등록
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── 상태 수정 인라인 폼 ──────────────────────────────────────

function StatusEditor({
  venue,
  onUpdateStatus,
}: {
  venue: PracticeVenueEntry;
  onUpdateStatus: (id: string, status: PracticeVenueStatus) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState<PracticeVenueStatus>(venue.status);

  if (!editing) {
    return (
      <Badge
        className={`text-[10px] px-1.5 py-0 border cursor-pointer hover:opacity-80 ${STATUS_BADGE_CLASS[venue.status]}`}
        onClick={() => setEditing(true)}
      >
        {STATUS_LABELS[venue.status]}
      </Badge>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Select
        value={status}
        onValueChange={(v) => setStatus(v as PracticeVenueStatus)}
      >
        <SelectTrigger className="h-6 text-[10px] w-24">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(STATUS_LABELS) as PracticeVenueStatus[]).map((s) => (
            <SelectItem key={s} value={s} className="text-[10px]">
              {STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
        onClick={async () => {
          await onUpdateStatus(venue.id, status);
          toast.success(TOAST.PRACTICE_VENUE.STATUS_CHANGED);
          setEditing(false);
        }}
      >
        <Check className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
        onClick={() => {
          setStatus(venue.status);
          setEditing(false);
        }}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}

// ─── 개별 장소 카드 ───────────────────────────────────────────

function VenueItem({
  venue,
  onDelete,
  onToggleFavorite,
  onRate,
  onUpdateStatus,
}: {
  venue: PracticeVenueEntry;
  onDelete: (id: string) => Promise<void>;
  onToggleFavorite: (id: string) => Promise<void>;
  onRate: (id: string, rating: number) => Promise<void>;
  onUpdateStatus: (id: string, status: PracticeVenueStatus) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-gray-100 bg-card shadow-sm">
      {/* 헤더 행 */}
      <div className="flex items-start gap-2 p-3">
        {/* 즐겨찾기 버튼 */}
        <button
          type="button"
          onClick={async () => {
            await onToggleFavorite(venue.id);
          }}
          className="mt-0.5 shrink-0"
          title={venue.isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
        >
          <Heart
            className={`h-3.5 w-3.5 transition-colors ${
              venue.isFavorite
                ? "text-red-500 fill-red-500"
                : "text-gray-300 fill-none"
            }`}
          />
        </button>

        {/* 장소 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-gray-800 truncate">
              {venue.name}
            </span>
            <StatusEditor venue={venue} onUpdateStatus={onUpdateStatus} />
          </div>

          {venue.address && (
            <p className="mt-0.5 flex items-center gap-0.5 text-[10px] text-gray-400 truncate">
              <MapPin className="h-2.5 w-2.5 shrink-0" />
              {venue.address}
            </p>
          )}

          {/* 별점 & 비용 */}
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            {venue.rating != null ? (
              <div className="flex items-center gap-1">
                <StarDisplay value={venue.rating} size="sm" />
                <span className="text-[10px] text-gray-500">
                  {venue.rating.toFixed(1)} ({venue.ratingCount})
                </span>
              </div>
            ) : (
              <span className="text-[10px] text-gray-400">평점 없음</span>
            )}

            {venue.costPerHour != null && (
              <span className="text-[10px] text-green-700 font-medium">
                {venue.costPerHour.toLocaleString()}원/h
              </span>
            )}

            {venue.capacity != null && (
              <span className="flex items-center gap-0.5 text-[10px] text-blue-600">
                <Users className="h-2.5 w-2.5" />
                {venue.capacity}명
              </span>
            )}

            {venue.size != null && (
              <span className="flex items-center gap-0.5 text-[10px] text-purple-600">
                <Maximize2 className="h-2.5 w-2.5" />
                {venue.size}m²
              </span>
            )}
          </div>

          {/* 시설 배지 */}
          {venue.facilities.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {venue.facilities.map((f) => (
                <Badge
                  key={f}
                  className="bg-indigo-50 text-[10px] px-1.5 py-0 text-indigo-700 border border-indigo-200 hover:bg-indigo-50"
                >
                  {FACILITY_LABELS[f]}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 text-gray-300 hover:text-red-500"
            onClick={async () => {
              await onDelete(venue.id);
              toast.success(TOAST.PRACTICE_VENUE.DELETED);
            }}
          >
            <Trash2 className="h-2.5 w-2.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 text-gray-400 hover:text-gray-600"
            onClick={() => setExpanded((v) => !v)}
          >
            <Pencil className="h-2.5 w-2.5" />
          </Button>
        </div>
      </div>

      {/* 상세 정보 (토글) */}
      {expanded && (
        <div className="border-t border-gray-100 px-3 pb-3 pt-2 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <RateVenueDialog venue={venue} onRate={onRate} />

            {venue.phone && (
              <a
                href={`tel:${venue.phone}`}
                className="flex items-center gap-0.5 text-[10px] text-blue-600 hover:underline"
              >
                <Phone className="h-2.5 w-2.5" />
                {venue.phone}
              </a>
            )}
            {venue.website && (
              <a
                href={venue.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-0.5 text-[10px] text-cyan-600 hover:underline"
              >
                <Globe className="h-2.5 w-2.5" />
                웹사이트
              </a>
            )}
          </div>

          {venue.memo && (
            <p className="text-[10px] text-gray-500 italic border-l-2 border-gray-200 pl-2">
              {venue.memo}
            </p>
          )}

          {venue.lastUsedAt && (
            <p className="text-[10px] text-gray-400">
              마지막 이용: {venue.lastUsedAt}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── 통계 요약 배너 ───────────────────────────────────────────

function StatsBanner({
  stats,
}: {
  stats: ReturnType<typeof usePracticeVenue>["stats"];
}) {
  if (stats.totalVenues === 0) return null;
  return (
    <div className="flex items-center gap-3 flex-wrap text-[10px]">
      <span className="text-gray-500">
        총 <span className="font-semibold text-gray-700">{stats.totalVenues}</span>개
      </span>
      {stats.availableCount > 0 && (
        <span className="text-green-700">
          예약 가능 <span className="font-semibold">{stats.availableCount}</span>개
        </span>
      )}
      {stats.favoriteCount > 0 && (
        <span className="text-red-500">
          즐겨찾기 <span className="font-semibold">{stats.favoriteCount}</span>개
        </span>
      )}
      {stats.averageRating != null && (
        <span className="text-yellow-600">
          평균 별점 <span className="font-semibold">{stats.averageRating.toFixed(1)}</span>
        </span>
      )}
      {stats.averageCost != null && (
        <span className="text-indigo-600">
          평균 비용 <span className="font-semibold">{stats.averageCost.toLocaleString()}</span>원/h
        </span>
      )}
      {stats.topRated && (
        <span className="text-orange-600">
          최고 평점: <span className="font-semibold">{stats.topRated.name}</span>
        </span>
      )}
    </div>
  );
}

// ─── 메인 카드 ────────────────────────────────────────────────

interface PracticeVenueCardProps {
  groupId: string;
}

export function PracticeVenueCard({ groupId }: PracticeVenueCardProps) {
  const [open, setOpen] = useState(true);
  const [facilityFilter, setFacilityFilter] = useState<PracticeVenueFacility | "all">("all");
  const [statusFilter, setStatusFilter] = useState<PracticeVenueStatus | "all">("all");
  const [showFavoriteOnly, setShowFavoriteOnly] = useState(false);

  const {
    entries,
    loading,
    addVenue,
    deleteVenue,
    rateVenue,
    toggleFavorite,
    updateStatus,
    filterByFacility,
    stats,
  } = usePracticeVenue(groupId);

  // 필터링
  let filtered = filterByFacility(facilityFilter);
  if (statusFilter !== "all") {
    filtered = filtered.filter((e) => e.status === statusFilter);
  }
  if (showFavoriteOnly) {
    filtered = filtered.filter((e) => e.isFavorite);
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      {/* 헤더 */}
      <div className="flex items-center justify-between rounded-t-lg border border-b-0 border-gray-200 bg-background px-4 py-2.5">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-teal-600" />
          <span className="text-sm font-semibold text-gray-800">연습 장소 관리</span>
          {stats.totalVenues > 0 && (
            <Badge className="bg-teal-100 text-[10px] px-1.5 py-0 text-teal-700 hover:bg-teal-100">
              {stats.totalVenues}
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
                그룹이 사용하는 연습 장소를 등록하고 관리하세요.
              </CardTitle>
              <AddVenueDialog onAdd={addVenue} />
            </div>

            {/* 통계 요약 */}
            <StatsBanner stats={stats} />
          </CardHeader>

          <CardContent className="px-4 pb-4 space-y-3">
            {/* 필터 영역 */}
            <div className="flex flex-wrap items-center gap-2">
              {/* 시설 필터 */}
              <Select
                value={facilityFilter}
                onValueChange={(v) =>
                  setFacilityFilter(v as PracticeVenueFacility | "all")
                }
              >
                <SelectTrigger className="h-7 text-xs w-32">
                  <SelectValue placeholder="시설 필터" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">
                    전체 시설
                  </SelectItem>
                  {ALL_FACILITIES.map((f) => (
                    <SelectItem key={f} value={f} className="text-xs">
                      {FACILITY_LABELS[f]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* 상태 필터 */}
              <Select
                value={statusFilter}
                onValueChange={(v) =>
                  setStatusFilter(v as PracticeVenueStatus | "all")
                }
              >
                <SelectTrigger className="h-7 text-xs w-28">
                  <SelectValue placeholder="상태 필터" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">
                    전체 상태
                  </SelectItem>
                  {(Object.keys(STATUS_LABELS) as PracticeVenueStatus[]).map(
                    (s) => (
                      <SelectItem key={s} value={s} className="text-xs">
                        {STATUS_LABELS[s]}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>

              {/* 즐겨찾기 필터 */}
              <Button
                variant={showFavoriteOnly ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => setShowFavoriteOnly((v) => !v)}
              >
                <Heart className="h-3 w-3" />
                즐겨찾기
              </Button>
            </div>

            <Separator />

            {/* 장소 목록 */}
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <span className="text-xs text-gray-400">불러오는 중...</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-1 py-8 text-gray-400">
                <MapPin className="h-8 w-8 opacity-30" />
                <p className="text-xs">
                  {entries.length === 0
                    ? "등록된 연습 장소가 없습니다."
                    : "필터 조건에 맞는 장소가 없습니다."}
                </p>
                {entries.length === 0 && (
                  <p className="text-[10px] text-gray-300">
                    위 &apos;장소 추가&apos; 버튼으로 첫 장소를 등록해보세요.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((venue) => (
                  <VenueItem
                    key={venue.id}
                    venue={venue}
                    onDelete={deleteVenue}
                    onToggleFavorite={toggleFavorite}
                    onRate={rateVenue}
                    onUpdateStatus={updateStatus}
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
