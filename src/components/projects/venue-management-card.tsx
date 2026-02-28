"use client";

import { useState, useMemo } from "react";
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  MapPin,
  Users,
  Phone,
  Mail,
  Bus,
  Car,
  Clock,
  Banknote,
  FileText,
  CheckSquare,
  Square,
  MoreVertical,
  Check,
  X,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useVenueManagement,
  createDefaultFacilities,
  type VenueMgmtVenueInput,
} from "@/hooks/use-venue-management";
import type {
  VenueMgmtVenue,
  VenueMgmtFacility,
  VenueMgmtBookingStatus,
} from "@/types";

// ============================================
// 상수
// ============================================

const BOOKING_STATUS_CONFIG: Record<
  VenueMgmtBookingStatus,
  { label: string; badgeColor: string }
> = {
  미확정: {
    label: "미확정",
    badgeColor: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  확정: {
    label: "확정",
    badgeColor: "bg-green-100 text-green-700 border-green-200",
  },
  취소: {
    label: "취소",
    badgeColor: "bg-gray-100 text-gray-600 border-gray-200",
  },
};

const BOOKING_STATUS_OPTIONS: VenueMgmtBookingStatus[] = ["미확정", "확정", "취소"];

// ============================================
// 공연장 추가/수정 다이얼로그
// ============================================

interface VenueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: VenueMgmtVenue | null;
  onSubmit: (input: VenueMgmtVenueInput) => boolean;
}

function VenueDialog({
  open,
  onOpenChange,
  initialData,
  onSubmit,
}: VenueDialogProps) {
  const isEdit = Boolean(initialData);

  const [name, setName] = useState(initialData?.name ?? "");
  const [address, setAddress] = useState(initialData?.address ?? "");
  const [capacityStr, setCapacityStr] = useState(
    initialData?.capacity != null ? String(initialData.capacity) : ""
  );
  const [stageWidth, setStageWidth] = useState(
    initialData?.stageSize.width != null
      ? String(initialData.stageSize.width)
      : ""
  );
  const [stageDepth, setStageDepth] = useState(
    initialData?.stageSize.depth != null
      ? String(initialData.stageSize.depth)
      : ""
  );
  const [facilities, setFacilities] = useState<VenueMgmtFacility[]>(
    initialData?.facilities ?? createDefaultFacilities()
  );
  const [managerName, setManagerName] = useState(
    initialData?.contact.managerName ?? ""
  );
  const [phone, setPhone] = useState(initialData?.contact.phone ?? "");
  const [email, setEmail] = useState(initialData?.contact.email ?? "");
  const [feeStr, setFeeStr] = useState(
    initialData?.rental.fee != null ? String(initialData.rental.fee) : ""
  );
  const [bookingStatus, setBookingStatus] = useState<VenueMgmtBookingStatus>(
    initialData?.rental.bookingStatus ?? "미확정"
  );
  const [entryTime, setEntryTime] = useState(
    initialData?.rental.entryTime ?? ""
  );
  const [exitTime, setExitTime] = useState(initialData?.rental.exitTime ?? "");
  const [stageMemo, setStageMemo] = useState(initialData?.stageMemo ?? "");
  const [transit, setTransit] = useState(initialData?.access.transit ?? "");
  const [parking, setParking] = useState(initialData?.access.parking ?? "");

  function handleToggleFacility(facilityId: string) {
    setFacilities((prev) =>
      prev.map((f) =>
        f.id === facilityId ? { ...f, available: !f.available } : f
      )
    );
  }

  function handleClose() {
    onOpenChange(false);
  }

  function handleSubmit() {
    const success = onSubmit({
      name,
      address,
      capacity: capacityStr ? Number(capacityStr) : null,
      stageSize: {
        width: stageWidth ? Number(stageWidth) : null,
        depth: stageDepth ? Number(stageDepth) : null,
      },
      facilities,
      contact: { managerName, phone, email },
      rental: {
        fee: feeStr ? Number(feeStr) : null,
        bookingStatus,
        entryTime,
        exitTime,
      },
      stageMemo,
      access: { transit, parking },
    });
    if (success) handleClose();
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {isEdit ? "공연장 정보 수정" : "공연장 추가"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* 기본 정보 */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
              기본 정보
            </p>
            <div className="space-y-2">
              <div className="space-y-1">
                <Label className="text-xs">
                  공연장 이름 <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="예: 홍익대 대학로 아트센터"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">주소</Label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="예: 서울특별시 마포구 와우산로 94"
                  className="h-8 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">수용 인원 (명)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={capacityStr}
                    onChange={(e) => setCapacityStr(e.target.value)}
                    placeholder="예: 300"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">무대 크기 (가로 x 세로 m)</Label>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min={0}
                      value={stageWidth}
                      onChange={(e) => setStageWidth(e.target.value)}
                      placeholder="가로"
                      className="h-8 text-xs"
                    />
                    <span className="text-xs text-gray-400">x</span>
                    <Input
                      type="number"
                      min={0}
                      value={stageDepth}
                      onChange={(e) => setStageDepth(e.target.value)}
                      placeholder="세로"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 시설 체크리스트 */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
              시설 체크리스트
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {facilities.map((f) => (
                <div key={f.id} className="flex items-center justify-between">
                  <Label className="text-xs cursor-pointer" htmlFor={`fac-${f.id}`}>
                    {f.name}
                  </Label>
                  <Switch
                    id={`fac-${f.id}`}
                    checked={f.available}
                    onCheckedChange={() => handleToggleFacility(f.id)}
                    className="scale-75"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 연락처 */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
              연락처
            </p>
            <div className="grid grid-cols-1 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">담당자 이름</Label>
                <Input
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  placeholder="예: 김담당"
                  className="h-8 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">전화번호</Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="02-1234-5678"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">이메일</Label>
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@venue.com"
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 대관 정보 */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
              대관 정보
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">대관료 (원)</Label>
                <Input
                  type="number"
                  min={0}
                  value={feeStr}
                  onChange={(e) => setFeeStr(e.target.value)}
                  placeholder="예: 500000"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">예약 상태</Label>
                <Select
                  value={bookingStatus}
                  onValueChange={(v) =>
                    setBookingStatus(v as VenueMgmtBookingStatus)
                  }
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BOOKING_STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s} className="text-xs">
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">입장 시간</Label>
                <Input
                  type="time"
                  value={entryTime}
                  onChange={(e) => setEntryTime(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">퇴장 시간</Label>
                <Input
                  type="time"
                  value={exitTime}
                  onChange={(e) => setExitTime(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>

          {/* 무대 도면 메모 */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
              무대 도면 메모
            </p>
            <Textarea
              value={stageMemo}
              onChange={(e) => setStageMemo(e.target.value)}
              placeholder="무대 배치, 동선, 특이사항 등을 자유롭게 기록해주세요"
              className="text-xs resize-none"
              rows={3}
            />
          </div>

          {/* 접근 정보 */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
              접근 정보
            </p>
            <div className="space-y-2">
              <div className="space-y-1">
                <Label className="text-xs">대중교통 안내</Label>
                <Textarea
                  value={transit}
                  onChange={(e) => setTransit(e.target.value)}
                  placeholder="예: 2호선 홍대입구역 1번 출구에서 도보 10분"
                  className="text-xs resize-none"
                  rows={2}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">주차 안내</Label>
                <Textarea
                  value={parking}
                  onChange={(e) => setParking(e.target.value)}
                  placeholder="예: 건물 지하 1~2층 주차장, 2시간 무료"
                  className="text-xs resize-none"
                  rows={2}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={handleClose}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            {isEdit ? "수정" : "추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 시설 완료율 프로그레스 바
// ============================================

function FacilityProgress({ facilities }: { facilities: VenueMgmtFacility[] }) {
  const total = facilities.length;
  const available = facilities.filter((f) => f.available).length;
  const rate = total > 0 ? Math.round((available / total) * 100) : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-gray-500">시설 완료율</span>
        <span className="text-[10px] font-medium text-gray-700">
          {available} / {total} ({rate}%)
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-purple-500 transition-all duration-300"
          style={{ width: `${rate}%` }}
        />
      </div>
    </div>
  );
}

// ============================================
// 공연장 카드 아이템
// ============================================

interface VenueItemProps {
  venue: VenueMgmtVenue;
  onEdit: (venue: VenueMgmtVenue) => void;
  onDelete: (id: string) => void;
  onToggleFacility: (venueId: string, facilityId: string) => void;
  onChangeBookingStatus: (
    venueId: string,
    status: VenueMgmtBookingStatus
  ) => void;
}

function VenueItem({
  venue,
  onEdit,
  onDelete,
  onToggleFacility,
  onChangeBookingStatus,
}: VenueItemProps) {
  const [expanded, setExpanded] = useState(false);
  const statusCfg = BOOKING_STATUS_CONFIG[venue.rental.bookingStatus];

  const facilityGroups = useMemo(() => {
    const available = venue.facilities.filter((f) => f.available);
    const unavailable = venue.facilities.filter((f) => !f.available);
    return { available, unavailable };
  }, [venue.facilities]);

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      {/* 헤더 */}
      <div className="px-3 py-2.5 flex items-start gap-2">
        <Building2 className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-medium text-gray-900 leading-tight">
              {venue.name}
            </span>
            <Badge
              className={`text-[10px] px-1.5 py-0 border cursor-pointer ${statusCfg.badgeColor}`}
              onClick={() => {
                const next =
                  BOOKING_STATUS_OPTIONS[
                    (BOOKING_STATUS_OPTIONS.indexOf(venue.rental.bookingStatus) +
                      1) %
                      BOOKING_STATUS_OPTIONS.length
                  ];
                onChangeBookingStatus(venue.id, next);
              }}
            >
              {statusCfg.label}
            </Badge>
          </div>
          {venue.address && (
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin className="h-2.5 w-2.5 text-gray-400" />
              <span className="text-[10px] text-gray-500 truncate">
                {venue.address}
              </span>
            </div>
          )}
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            {venue.capacity != null && (
              <span className="flex items-center gap-0.5 text-[10px] text-gray-500">
                <Users className="h-2.5 w-2.5" />
                {venue.capacity.toLocaleString()}명
              </span>
            )}
            {(venue.stageSize.width != null ||
              venue.stageSize.depth != null) && (
              <span className="text-[10px] text-gray-500">
                무대{" "}
                {venue.stageSize.width != null ? `${venue.stageSize.width}m` : "?"}
                {" x "}
                {venue.stageSize.depth != null ? `${venue.stageSize.depth}m` : "?"}
              </span>
            )}
            {venue.rental.fee != null && (
              <span className="flex items-center gap-0.5 text-[10px] text-gray-500">
                <Banknote className="h-2.5 w-2.5" />
                {venue.rental.fee.toLocaleString()}원
              </span>
            )}
            {(venue.rental.entryTime || venue.rental.exitTime) && (
              <span className="flex items-center gap-0.5 text-[10px] text-gray-500">
                <Clock className="h-2.5 w-2.5" />
                {venue.rental.entryTime || "??"} ~{" "}
                {venue.rental.exitTime || "??"}
              </span>
            )}
          </div>
        </div>

        {/* 우측 버튼 */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-gray-400 hover:text-gray-600 p-0.5"
          >
            {expanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-gray-400 hover:text-gray-600 p-0.5">
                <MoreVertical className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="text-xs">
              <DropdownMenuItem
                className="text-xs gap-1.5"
                onClick={() => onEdit(venue)}
              >
                <Pencil className="h-3 w-3" />
                수정
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-xs gap-1.5 text-red-600 focus:text-red-600"
                onClick={() => onDelete(venue.id)}
              >
                <Trash2 className="h-3 w-3" />
                삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 시설 완료율 바 (항상 표시) */}
      {venue.facilities.length > 0 && (
        <div className="px-3 pb-2">
          <FacilityProgress facilities={venue.facilities} />
        </div>
      )}

      {/* 상세 정보 (펼침) */}
      {expanded && (
        <div className="border-t border-gray-100 px-3 py-2.5 space-y-3">
          {/* 시설 체크리스트 */}
          {venue.facilities.length > 0 && (
            <div>
              <p className="text-[10px] text-gray-400 mb-1.5">시설 체크리스트</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {venue.facilities.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => onToggleFacility(venue.id, f.id)}
                    className="flex items-center gap-1.5 text-left"
                  >
                    {f.available ? (
                      <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                    ) : (
                      <X className="h-3 w-3 text-gray-300 flex-shrink-0" />
                    )}
                    <span
                      className={`text-xs ${
                        f.available ? "text-gray-800" : "text-gray-400"
                      }`}
                    >
                      {f.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 연락처 */}
          {(venue.contact.managerName ||
            venue.contact.phone ||
            venue.contact.email) && (
            <div>
              <p className="text-[10px] text-gray-400 mb-1.5">연락처</p>
              <div className="space-y-1">
                {venue.contact.managerName && (
                  <p className="text-xs text-gray-700">
                    담당: {venue.contact.managerName}
                  </p>
                )}
                {venue.contact.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-700">
                      {venue.contact.phone}
                    </span>
                  </div>
                )}
                {venue.contact.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-700">
                      {venue.contact.email}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 무대 도면 메모 */}
          {venue.stageMemo && (
            <div>
              <div className="flex items-center gap-1 mb-1.5">
                <FileText className="h-3 w-3 text-gray-400" />
                <p className="text-[10px] text-gray-400">무대 도면 메모</p>
              </div>
              <p className="text-xs text-gray-700 whitespace-pre-wrap bg-gray-50 rounded p-2">
                {venue.stageMemo}
              </p>
            </div>
          )}

          {/* 접근 정보 */}
          {(venue.access.transit || venue.access.parking) && (
            <div>
              <p className="text-[10px] text-gray-400 mb-1.5">접근 정보</p>
              <div className="space-y-1.5">
                {venue.access.transit && (
                  <div className="flex gap-1.5">
                    <Bus className="h-3 w-3 text-blue-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-700">{venue.access.transit}</p>
                  </div>
                )}
                {venue.access.parking && (
                  <div className="flex gap-1.5">
                    <Car className="h-3 w-3 text-orange-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-700">{venue.access.parking}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// 메인 컴포넌트
// ============================================

interface VenueManagementCardProps {
  projectId: string;
}

export function VenueManagementCard({ projectId }: VenueManagementCardProps) {
  const {
    venues,
    loading,
    addVenue,
    updateVenue,
    deleteVenue,
    toggleFacility,
    updateBookingStatus,
  } = useVenueManagement(projectId);

  const [collapsed, setCollapsed] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<VenueMgmtVenue | null>(null);

  // 전체 통계
  const stats = useMemo(() => {
    const confirmed = venues.filter((v) => v.rental.bookingStatus === "확정").length;
    const pending = venues.filter((v) => v.rental.bookingStatus === "미확정").length;
    const cancelled = venues.filter((v) => v.rental.bookingStatus === "취소").length;
    return { confirmed, pending, cancelled };
  }, [venues]);

  function handleDelete(id: string) {
    if (!confirm("공연장을 삭제하시겠습니까?")) return;
    deleteVenue(id);
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-xs text-gray-400">불러오는 중...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-purple-500" />
              공연장 관리
              {venues.length > 0 && (
                <span className="ml-1 text-[10px] font-normal text-gray-400">
                  ({venues.length})
                </span>
              )}
            </CardTitle>
            <div className="flex items-center gap-1.5">
              {venues.length > 0 && (
                <div className="flex items-center gap-1">
                  {stats.confirmed > 0 && (
                    <Badge className="text-[10px] px-1.5 py-0 border bg-green-100 text-green-700 border-green-200">
                      확정 {stats.confirmed}
                    </Badge>
                  )}
                  {stats.pending > 0 && (
                    <Badge className="text-[10px] px-1.5 py-0 border bg-yellow-100 text-yellow-700 border-yellow-200">
                      미확정 {stats.pending}
                    </Badge>
                  )}
                </div>
              )}
              <Button
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => setAddDialogOpen(true)}
              >
                <Plus className="h-3 w-3" />
                추가
              </Button>
              <button
                onClick={() => setCollapsed((v) => !v)}
                className="text-gray-400 hover:text-gray-600 p-0.5"
              >
                {collapsed ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </CardHeader>

        {!collapsed && (
          <CardContent className="px-4 pb-4 space-y-2">
            {venues.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <Building2 className="h-10 w-10 mx-auto text-gray-200" />
                <p className="text-xs text-gray-400">
                  아직 등록된 공연장이 없습니다
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => setAddDialogOpen(true)}
                >
                  <Plus className="h-3 w-3" />
                  첫 공연장 추가
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {venues.map((venue) => (
                  <VenueItem
                    key={venue.id}
                    venue={venue}
                    onEdit={(v) => setEditTarget(v)}
                    onDelete={handleDelete}
                    onToggleFacility={toggleFacility}
                    onChangeBookingStatus={updateBookingStatus}
                  />
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* 추가 다이얼로그 */}
      <VenueDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        initialData={null}
        onSubmit={addVenue}
      />

      {/* 수정 다이얼로그 */}
      {editTarget && (
        <VenueDialog
          open={Boolean(editTarget)}
          onOpenChange={(open) => {
            if (!open) setEditTarget(null);
          }}
          initialData={editTarget}
          onSubmit={(input) => updateVenue(editTarget.id, input)}
        />
      )}
    </>
  );
}
