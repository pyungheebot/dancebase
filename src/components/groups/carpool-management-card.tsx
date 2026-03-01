"use client";

import { useState, useMemo } from "react";
import {
  Car,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Clock,
  MapPin,
  Users,
  ArrowRight,
  UserPlus,
  UserMinus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useCarpoolManagement } from "@/hooks/use-carpool-management";
import type { CarpoolRide, CarpoolRideStatus } from "@/types";

// ============================================================
// 상수
// ============================================================

const DAYS_OF_WEEK = ["일", "월", "화", "수", "목", "금", "토"];

const STATUS_LABELS: Record<CarpoolRideStatus, string> = {
  open: "모집중",
  full: "만석",
  departed: "출발",
  completed: "완료",
  cancelled: "취소",
};

const STATUS_BADGE_CLASS: Record<CarpoolRideStatus, string> = {
  open: "bg-green-100 text-green-700 hover:bg-green-100",
  full: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  departed: "bg-orange-100 text-orange-700 hover:bg-orange-100",
  completed: "bg-gray-100 text-gray-700 hover:bg-gray-100",
  cancelled: "bg-red-100 text-red-700 hover:bg-red-100",
};

const ALL_STATUSES: CarpoolRideStatus[] = [
  "open",
  "full",
  "departed",
  "completed",
  "cancelled",
];

// ============================================================
// 유틸리티
// ============================================================

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${DAYS_OF_WEEK[d.getDay()]})`;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function getOccupancyPercent(passengers: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((passengers / total) * 100);
}

// ============================================================
// 탑승률 바
// ============================================================

function OccupancyBar({
  passengers,
  total,
}: {
  passengers: number;
  total: number;
}) {
  const pct = getOccupancyPercent(passengers, total);
  const color =
    pct >= 100
      ? "bg-blue-500"
      : pct >= 75
        ? "bg-orange-400"
        : pct >= 50
          ? "bg-yellow-400"
          : "bg-green-400";

  return (
    <div className="mt-1.5">
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[10px] text-gray-500">
          {passengers}/{total}석
        </span>
        <span className="text-[10px] text-gray-500">{pct}%</span>
      </div>
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}

// ============================================================
// 카풀 카드
// ============================================================

function RideCard({
  ride,
  memberNames,
  onDelete,
  onJoin,
  onLeave,
  onChangeStatus,
}: {
  ride: CarpoolRide;
  memberNames: string[];
  onDelete: (id: string) => void;
  onJoin: (id: string, name: string) => void;
  onLeave: (id: string, name: string) => void;
  onChangeStatus: (id: string, status: CarpoolRideStatus) => void;
}) {
  const [joinName, setJoinName] = useState("");
  const [joinOpen, setJoinOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaveName, setLeaveName] = useState("");

  const canJoin =
    ride.status === "open" && ride.passengers.length < ride.totalSeats;

  return (
    <div className="border border-gray-100 rounded-lg p-3 bg-card shadow-sm">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Car className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
          <span className="text-sm font-medium text-gray-800 truncate">
            {ride.driverName}
          </span>
          <Badge className={`text-[10px] px-1.5 py-0 ${STATUS_BADGE_CLASS[ride.status]}`}>
            {STATUS_LABELS[ride.status]}
          </Badge>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Select
            value={ride.status}
            onValueChange={(v) => onChangeStatus(ride.id, v as CarpoolRideStatus)}
          >
            <SelectTrigger className="h-6 text-[10px] w-20 px-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ALL_STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="text-xs">
                  {STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
            onClick={() => onDelete(ride.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* 경로 + 시간 */}
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
        <div className="flex items-center gap-1 text-xs text-gray-600">
          <MapPin className="h-3 w-3 text-gray-400" />
          <span>{ride.departureLocation}</span>
          <ArrowRight className="h-3 w-3 text-gray-400" />
          <span className="font-medium text-gray-700">{ride.destination}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Clock className="h-3 w-3" />
          <span>{ride.departureTime}</span>
        </div>
      </div>

      {/* 메모 */}
      {ride.notes && (
        <p className="mt-1.5 text-[11px] text-gray-500 leading-relaxed">
          {ride.notes}
        </p>
      )}

      {/* 탑승률 바 */}
      <OccupancyBar passengers={ride.passengers.length} total={ride.totalSeats} />

      {/* 탑승자 목록 */}
      {ride.passengers.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {ride.passengers.map((p) => (
            <span
              key={p}
              className="inline-flex items-center gap-0.5 text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full"
            >
              <Users className="h-2.5 w-2.5" />
              {p}
            </span>
          ))}
        </div>
      )}

      {/* 액션 버튼 */}
      <div className="mt-2 flex gap-1.5">
        {canJoin && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs flex-1"
            onClick={() => setJoinOpen(true)}
          >
            <UserPlus className="h-3 w-3 mr-1" />
            탑승 신청
          </Button>
        )}
        {ride.passengers.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-gray-500 hover:text-gray-700"
            onClick={() => setLeaveOpen(true)}
          >
            <UserMinus className="h-3 w-3 mr-1" />
            하차
          </Button>
        )}
      </div>

      {/* 탑승 다이얼로그 */}
      <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-sm">탑승 신청</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs">탑승자 이름</Label>
              <Select value={joinName} onValueChange={setJoinName}>
                <SelectTrigger className="h-8 text-xs mt-1">
                  <SelectValue placeholder="멤버 선택" />
                </SelectTrigger>
                <SelectContent>
                  {memberNames
                    .filter((n) => !ride.passengers.includes(n) && n !== ride.driverName)
                    .map((name) => (
                      <SelectItem key={name} value={name} className="text-xs">
                        {name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                if (!joinName) {
                  toast.error("탑승자를 선택해주세요");
                  return;
                }
                onJoin(ride.id, joinName);
                setJoinName("");
                setJoinOpen(false);
              }}
            >
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 하차 다이얼로그 */}
      <Dialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-sm">하차</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs">하차할 탑승자</Label>
              <Select value={leaveName} onValueChange={setLeaveName}>
                <SelectTrigger className="h-8 text-xs mt-1">
                  <SelectValue placeholder="탑승자 선택" />
                </SelectTrigger>
                <SelectContent>
                  {ride.passengers.map((p) => (
                    <SelectItem key={p} value={p} className="text-xs">
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="destructive"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                if (!leaveName) {
                  toast.error("탑승자를 선택해주세요");
                  return;
                }
                onLeave(ride.id, leaveName);
                setLeaveName("");
                setLeaveOpen(false);
              }}
            >
              하차
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// 카풀 등록 다이얼로그
// ============================================================

function AddRideDialog({
  open,
  onOpenChange,
  memberNames,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  memberNames: string[];
  onAdd: (
    driverName: string,
    date: string,
    departureTime: string,
    departureLocation: string,
    destination: string,
    totalSeats: number,
    notes?: string
  ) => void;
}) {
  const [driverName, setDriverName] = useState("");
  const [date, setDate] = useState(todayStr());
  const [departureTime, setDepartureTime] = useState("09:00");
  const [departureLocation, setDepartureLocation] = useState("");
  const [destination, setDestination] = useState("");
  const [totalSeats, setTotalSeats] = useState(3);
  const [notes, setNotes] = useState("");

  function handleSubmit() {
    if (!driverName) {
      toast.error("운전자를 선택해주세요");
      return;
    }
    if (!departureLocation.trim()) {
      toast.error("출발지를 입력해주세요");
      return;
    }
    if (!destination.trim()) {
      toast.error("도착지를 입력해주세요");
      return;
    }
    if (totalSeats < 1) {
      toast.error("좌석 수는 1 이상이어야 합니다");
      return;
    }

    onAdd(
      driverName,
      date,
      departureTime,
      departureLocation.trim(),
      destination.trim(),
      totalSeats,
      notes.trim() || undefined
    );

    // 초기화
    setDriverName("");
    setDate(todayStr());
    setDepartureTime("09:00");
    setDepartureLocation("");
    setDestination("");
    setTotalSeats(3);
    setNotes("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-2">
            <Car className="h-4 w-4 text-blue-500" />
            카풀 등록
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* 운전자 */}
          <div>
            <Label className="text-xs">운전자</Label>
            <Select value={driverName} onValueChange={setDriverName}>
              <SelectTrigger className="h-8 text-xs mt-1">
                <SelectValue placeholder="운전자 선택" />
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

          {/* 날짜 + 출발 시간 */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">날짜</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-8 text-xs mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">출발 시간</Label>
              <Input
                type="time"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                className="h-8 text-xs mt-1"
              />
            </div>
          </div>

          {/* 출발지 → 도착지 */}
          <div>
            <Label className="text-xs">출발지</Label>
            <Input
              placeholder="예: 강남역 3번 출구"
              value={departureLocation}
              onChange={(e) => setDepartureLocation(e.target.value)}
              className="h-8 text-xs mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">도착지</Label>
            <Input
              placeholder="예: 홍대 연습실"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="h-8 text-xs mt-1"
            />
          </div>

          {/* 좌석 수 */}
          <div>
            <Label className="text-xs">탑승 가능 좌석 수</Label>
            <Input
              type="number"
              min={1}
              max={20}
              value={totalSeats}
              onChange={(e) =>
                setTotalSeats(Math.max(1, parseInt(e.target.value) || 1))
              }
              className="h-8 text-xs mt-1"
            />
          </div>

          {/* 메모 */}
          <div>
            <Label className="text-xs">메모 (선택)</Label>
            <Textarea
              placeholder="예: 트렁크 여유 없음, 짐 최소화 부탁"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs mt-1 min-h-[56px] resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onOpenChange(false)}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            등록
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 메인 카드 컴포넌트
// ============================================================

interface CarpoolManagementCardProps {
  groupId: string;
  memberNames: string[];
}

export function CarpoolManagementCard({
  groupId,
  memberNames,
}: CarpoolManagementCardProps) {
  const [open, setOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState<string>("all");

  const {
    rides,
    loading,
    addRide,
    deleteRide,
    joinRide,
    leaveRide,
    changeStatus,
    stats,
  } = useCarpoolManagement(groupId);

  // 날짜 목록 (중복 제거, 정렬)
  const availableDates = useMemo(() => {
    const dates = Array.from(new Set(rides.map((r) => r.date))).sort();
    return dates;
  }, [rides]);

  // 필터링
  const filteredRides = useMemo(() => {
    if (dateFilter === "all") return rides;
    return rides.filter((r) => r.date === dateFilter);
  }, [rides, dateFilter]);

  // 날짜별 그룹
  const ridesByDate = useMemo(() => {
    const map = new Map<string, CarpoolRide[]>();
    for (const ride of filteredRides) {
      if (!map.has(ride.date)) map.set(ride.date, []);
      map.get(ride.date)!.push(ride);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredRides]);

  function handleAdd(
    driverName: string,
    date: string,
    departureTime: string,
    departureLocation: string,
    destination: string,
    totalSeats: number,
    notes?: string
  ) {
    addRide(driverName, date, departureTime, departureLocation, destination, totalSeats, notes);
    toast.success("카풀이 등록되었습니다");
  }

  function handleDelete(id: string) {
    const ok = deleteRide(id);
    if (ok) toast.success("카풀이 삭제되었습니다");
    else toast.error(TOAST.DELETE_ERROR);
  }

  function handleJoin(rideId: string, passengerName: string) {
    const ok = joinRide(rideId, passengerName);
    if (ok) toast.success(`${passengerName} 탑승 완료`);
    else toast.error("탑승에 실패했습니다 (좌석 부족 또는 이미 탑승)");
  }

  function handleLeave(rideId: string, passengerName: string) {
    const ok = leaveRide(rideId, passengerName);
    if (ok) toast.success(`${passengerName} 하차 완료`);
    else toast.error("하차에 실패했습니다");
  }

  function handleChangeStatus(id: string, status: CarpoolRideStatus) {
    const ok = changeStatus(id, status);
    if (ok) toast.success("상태가 변경되었습니다");
    else toast.error("상태 변경에 실패했습니다");
  }

  return (
    <>
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="border border-gray-200 rounded-xl bg-card shadow-sm">
          {/* 헤더 */}
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 rounded-xl transition-colors">
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-semibold text-gray-800">
                  교통 카풀 관리
                </span>
                {stats.openRides > 0 && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 hover:bg-green-100">
                    모집중 {stats.openRides}
                  </Badge>
                )}
              </div>
              {open ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="px-4 pb-4 space-y-3">
              {/* 통계 */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <p className="text-base font-bold text-gray-800">
                    {stats.totalRides}
                  </p>
                  <p className="text-[10px] text-gray-500">전체</p>
                </div>
                <div className="bg-green-50 rounded-lg p-2 text-center">
                  <p className="text-base font-bold text-green-700">
                    {stats.openRides}
                  </p>
                  <p className="text-[10px] text-green-600">모집중</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-2 text-center">
                  <p className="text-base font-bold text-blue-700">
                    {stats.totalPassengers}
                  </p>
                  <p className="text-[10px] text-blue-600">총 탑승자</p>
                </div>
              </div>

              {/* 날짜 필터 + 등록 버튼 */}
              <div className="flex items-center gap-2">
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="h-7 text-xs flex-1">
                    <SelectValue placeholder="날짜 필터" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">
                      전체 날짜
                    </SelectItem>
                    {availableDates.map((d) => (
                      <SelectItem key={d} value={d} className="text-xs">
                        {formatDate(d)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  className="h-7 text-xs flex-shrink-0"
                  onClick={() => setAddOpen(true)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  카풀 등록
                </Button>
              </div>

              {/* 카풀 목록 */}
              {loading ? (
                <p className="text-xs text-gray-400 text-center py-4">
                  불러오는 중...
                </p>
              ) : ridesByDate.length === 0 ? (
                <div className="text-center py-6">
                  <Car className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">등록된 카풀이 없습니다</p>
                  <p className="text-[10px] text-gray-300 mt-0.5">
                    카풀 등록 버튼으로 추가하세요
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {ridesByDate.map(([date, dateRides]) => (
                    <div key={date}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold text-gray-600">
                          {formatDate(date)}
                        </span>
                        <div className="flex-1 h-px bg-gray-100" />
                        <span className="text-[10px] text-gray-400">
                          {dateRides.length}건
                        </span>
                      </div>
                      <div className="space-y-2">
                        {dateRides.map((ride) => (
                          <RideCard
                            key={ride.id}
                            ride={ride}
                            memberNames={memberNames}
                            onDelete={handleDelete}
                            onJoin={handleJoin}
                            onLeave={handleLeave}
                            onChangeStatus={handleChangeStatus}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      <AddRideDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        memberNames={memberNames}
        onAdd={handleAdd}
      />
    </>
  );
}
