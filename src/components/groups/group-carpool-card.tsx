"use client";

import { useState } from "react";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Car,
  MapPin,
  Clock,
  Users,
  UserPlus,
  UserMinus,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useGroupCarPool } from "@/hooks/use-group-carpool";
import type { CarPoolItem, CarPoolStatus } from "@/types";
import { formatShortDateTime } from "@/lib/date-utils";

// ── 날짜 포매터 ──────────────────────────────────────────────────────

// ── 상태 배지 색상 ───────────────────────────────────────────────────

function statusColor(status: CarPoolStatus): string {
  switch (status) {
    case "모집중":
      return "bg-green-100 text-green-700";
    case "마감":
      return "bg-yellow-100 text-yellow-700";
    case "완료":
      return "bg-gray-100 text-gray-500";
  }
}

// ── 카풀 항목 카드 ──────────────────────────────────────────────────

function CarPoolItemCard({
  item,
  remainingSeats,
  onDelete,
  onStatusChange,
  onAddPassenger,
  onRemovePassenger,
}: {
  item: CarPoolItem;
  remainingSeats: number;
  onDelete: () => void;
  onStatusChange: (status: CarPoolStatus) => void;
  onAddPassenger: (name: string) => void;
  onRemovePassenger: (passengerId: string) => void;
}) {
  const [passengerName, setPassengerName] = useState("");
  const [expanded, setExpanded] = useState(false);

  function handleAddPassenger() {
    const trimmed = passengerName.trim();
    if (!trimmed) {
      toast.error("탑승자 이름을 입력하세요.");
      return;
    }
    onAddPassenger(trimmed);
    setPassengerName("");
  }

  return (
    <div className="border rounded-lg p-3 space-y-2 bg-white">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Car className="h-4 w-4 text-blue-500 shrink-0" />
          <span className="text-sm font-medium truncate">{item.driverName}</span>
          {item.carInfo && (
            <span className="text-[10px] text-gray-400 truncate">({item.carInfo})</span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Badge className={`text-[10px] px-1.5 py-0 ${statusColor(item.status)}`}>
            {item.status}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
            onClick={onDelete}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* 경로 */}
      <div className="flex items-center gap-1.5 text-xs text-gray-600">
        <MapPin className="h-3 w-3 text-orange-400 shrink-0" />
        <span className="truncate">{item.departurePlace}</span>
        <span className="text-gray-400">→</span>
        <span className="truncate">{item.arrivalPlace}</span>
      </div>

      {/* 시간 & 좌석 */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{formatShortDateTime(item.departureTime)}</span>
        </div>
        <div className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          <span>
            {item.passengers.length}/{item.maxPassengers}명
            {remainingSeats > 0 && (
              <span className="text-green-600 ml-1">({remainingSeats}석 여유)</span>
            )}
            {remainingSeats === 0 && item.status === "모집중" && (
              <span className="text-yellow-600 ml-1">(만석)</span>
            )}
          </span>
        </div>
      </div>

      {/* 탑승자 목록 (접기/펼치기) */}
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <CollapsibleTrigger asChild>
          <button className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600 transition-colors">
            {expanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
            탑승자 {item.passengers.length}명
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-1.5 space-y-1">
            {item.passengers.length === 0 ? (
              <p className="text-[10px] text-gray-400 pl-1">탑승자 없음</p>
            ) : (
              item.passengers.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between text-xs bg-gray-50 rounded px-2 py-1"
                >
                  <span>{p.name}</span>
                  <button
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    onClick={() => onRemovePassenger(p.id)}
                  >
                    <UserMinus className="h-3 w-3" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* 탑승자 추가 입력 */}
          {item.status === "모집중" && (
            <div className="flex gap-1.5 mt-2">
              <Input
                placeholder="탑승자 이름"
                value={passengerName}
                onChange={(e) => setPassengerName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddPassenger()}
                className="h-7 text-xs"
              />
              <Button
                size="sm"
                className="h-7 text-xs px-2"
                onClick={handleAddPassenger}
              >
                <UserPlus className="h-3 w-3" />
              </Button>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* 상태 변경 버튼 */}
      <div className="flex gap-1.5 pt-1">
        {item.status !== "모집중" && (
          <Button
            variant="outline"
            size="sm"
            className="h-6 text-[10px] px-2"
            onClick={() => onStatusChange("모집중")}
          >
            모집중으로
          </Button>
        )}
        {item.status !== "마감" && (
          <Button
            variant="outline"
            size="sm"
            className="h-6 text-[10px] px-2"
            onClick={() => onStatusChange("마감")}
          >
            마감
          </Button>
        )}
        {item.status !== "완료" && (
          <Button
            variant="outline"
            size="sm"
            className="h-6 text-[10px] px-2"
            onClick={() => onStatusChange("완료")}
          >
            완료
          </Button>
        )}
      </div>
    </div>
  );
}

// ── 카풀 추가 다이얼로그 ─────────────────────────────────────────────

function AddCarPoolDialog({
  onAdd,
}: {
  onAdd: (data: {
    driverName: string;
    departurePlace: string;
    arrivalPlace: string;
    departureTime: string;
    maxPassengers: number;
    carInfo?: string;
  }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [driverName, setDriverName] = useState("");
  const [departurePlace, setDeparturePlace] = useState("");
  const [arrivalPlace, setArrivalPlace] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [maxPassengers, setMaxPassengers] = useState("3");
  const [carInfo, setCarInfo] = useState("");

  function handleSubmit() {
    if (!driverName.trim()) {
      toast.error("운전자명을 입력하세요.");
      return;
    }
    if (!departurePlace.trim()) {
      toast.error("출발지를 입력하세요.");
      return;
    }
    if (!arrivalPlace.trim()) {
      toast.error("도착지를 입력하세요.");
      return;
    }
    if (!departureTime) {
      toast.error("출발 시간을 선택하세요.");
      return;
    }
    const seats = parseInt(maxPassengers, 10);
    if (isNaN(seats) || seats < 1) {
      toast.error("탑승 가능 인원을 1명 이상 입력하세요.");
      return;
    }

    onAdd({
      driverName: driverName.trim(),
      departurePlace: departurePlace.trim(),
      arrivalPlace: arrivalPlace.trim(),
      departureTime: new Date(departureTime).toISOString(),
      maxPassengers: seats,
      carInfo: carInfo.trim() || undefined,
    });

    // 초기화
    setDriverName("");
    setDeparturePlace("");
    setArrivalPlace("");
    setDepartureTime("");
    setMaxPassengers("3");
    setCarInfo("");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 text-xs gap-1">
          <Plus className="h-3 w-3" />
          카풀 제안
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">카풀 제안 등록</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label className="text-xs">운전자명 *</Label>
            <Input
              placeholder="운전자 이름"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">출발지 *</Label>
              <Input
                placeholder="출발지"
                value={departurePlace}
                onChange={(e) => setDeparturePlace(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">도착지 *</Label>
              <Input
                placeholder="도착지"
                value={arrivalPlace}
                onChange={(e) => setArrivalPlace(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">출발 시간 *</Label>
            <Input
              type="datetime-local"
              value={departureTime}
              onChange={(e) => setDepartureTime(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">탑승 가능 인원 *</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={maxPassengers}
                onChange={(e) => setMaxPassengers(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">차량 정보 (선택)</Label>
              <Input
                placeholder="예: 흰색 아반떼"
                value={carInfo}
                onChange={(e) => setCarInfo(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => setOpen(false)}
          >
            취소
          </Button>
          <Button size="sm" className="h-8 text-xs" onClick={handleSubmit}>
            등록
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── 메인 컴포넌트 ────────────────────────────────────────────────────

export function GroupCarPoolCard({ groupId }: { groupId: string }) {
  const [isOpen, setIsOpen] = useState(true);
  const [onlyOpen, setOnlyOpen] = useState(false);

  const {
    sortedCarpools,
    openCarpools,
    remainingSeats,
    stats,
    addCarPool,
    deleteCarPool,
    updateStatus,
    addPassenger,
    removePassenger,
  } = useGroupCarPool(groupId);

  const displayList = onlyOpen ? openCarpools : sortedCarpools;

  function handleAdd(data: {
    driverName: string;
    departurePlace: string;
    arrivalPlace: string;
    departureTime: string;
    maxPassengers: number;
    carInfo?: string;
  }) {
    addCarPool(data);
    toast.success("카풀이 등록되었습니다.");
  }

  function handleDelete(carpoolId: string) {
    const ok = deleteCarPool(carpoolId);
    if (ok) toast.success("카풀이 삭제되었습니다.");
    else toast.error(TOAST.DELETE_ERROR);
  }

  function handleStatusChange(carpoolId: string, status: CarPoolStatus) {
    const ok = updateStatus(carpoolId, status);
    if (ok) toast.success(`상태가 "${status}"로 변경되었습니다.`);
    else toast.error("상태 변경에 실패했습니다.");
  }

  function handleAddPassenger(carpoolId: string, name: string) {
    const ok = addPassenger(carpoolId, name);
    if (ok) toast.success(`${name}님이 탑승 신청되었습니다.`);
    else toast.error("탑승 신청에 실패했습니다. (좌석 부족 또는 마감)");
  }

  function handleRemovePassenger(carpoolId: string, passengerId: string) {
    const ok = removePassenger(carpoolId, passengerId);
    if (ok) toast.success("탑승자가 삭제되었습니다.");
    else toast.error("탑승자 삭제에 실패했습니다.");
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
        {/* 카드 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-2 text-sm font-semibold text-gray-800 hover:text-gray-900 transition-colors">
              <Car className="h-4 w-4 text-blue-500" />
              카풀 매칭
              {isOpen ? (
                <ChevronUp className="h-3.5 w-3.5 text-gray-400" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
              )}
            </button>
          </CollapsibleTrigger>
          <AddCarPoolDialog onAdd={handleAdd} />
        </div>

        <CollapsibleContent>
          {/* 통계 요약 */}
          <div className="grid grid-cols-3 divide-x border-b text-center">
            <div className="py-2 px-3">
              <p className="text-base font-bold text-gray-800">{stats.total}</p>
              <p className="text-[10px] text-gray-500">총 카풀</p>
            </div>
            <div className="py-2 px-3">
              <p className="text-base font-bold text-green-600">{stats.open}</p>
              <p className="text-[10px] text-gray-500">모집중</p>
            </div>
            <div className="py-2 px-3">
              <p className="text-base font-bold text-blue-600">
                {stats.totalPassengers}
              </p>
              <p className="text-[10px] text-gray-500">총 탑승 인원</p>
            </div>
          </div>

          {/* 필터 */}
          <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50/50">
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <Filter className="h-3 w-3" />
              <span>모집중만 보기</span>
            </div>
            <Switch
              checked={onlyOpen}
              onCheckedChange={setOnlyOpen}
              className="scale-75"
            />
          </div>

          {/* 카풀 목록 */}
          <div className="p-3 space-y-2">
            {displayList.length === 0 ? (
              <div className="text-center py-8 text-xs text-gray-400 space-y-1">
                <Car className="h-8 w-8 mx-auto text-gray-200" />
                <p>
                  {onlyOpen
                    ? "모집 중인 카풀이 없습니다."
                    : "등록된 카풀이 없습니다."}
                </p>
                <p className="text-[10px]">위의 &apos;카풀 제안&apos; 버튼으로 추가하세요.</p>
              </div>
            ) : (
              displayList.map((item) => (
                <CarPoolItemCard
                  key={item.id}
                  item={item}
                  remainingSeats={remainingSeats(item)}
                  onDelete={() => handleDelete(item.id)}
                  onStatusChange={(status) => handleStatusChange(item.id, status)}
                  onAddPassenger={(name) => handleAddPassenger(item.id, name)}
                  onRemovePassenger={(pid) => handleRemovePassenger(item.id, pid)}
                />
              ))
            )}
          </div>

          {displayList.length > 0 && (
            <div className="px-4 pb-2">
              <Separator />
              <p className="text-[10px] text-gray-400 mt-1.5">
                날짜순 정렬 · 총 {displayList.length}건
              </p>
            </div>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
