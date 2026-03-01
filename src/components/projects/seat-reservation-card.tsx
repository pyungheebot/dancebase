"use client";

import { useState } from "react";
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
import { Progress } from "@/components/ui/progress";
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
  ChevronDown,
  ChevronUp,
  Plus,

  Armchair,
  X,
  Lock,
  Unlock,
} from "lucide-react";
import { toast } from "sonner";
import { useSeatReservation } from "@/hooks/use-seat-reservation";
import type {
  SeatReservationLayout,
  SeatReservationEntry,
  SeatReservationStatus,
} from "@/types";

// ============================================================
// 상수 & 레이블
// ============================================================

const STATUS_LABELS: Record<SeatReservationStatus, string> = {
  available: "예약 가능",
  reserved: "예약됨",
  occupied: "사용 중",
  blocked: "차단됨",
};

const STATUS_COLORS: Record<SeatReservationStatus, string> = {
  available: "bg-green-100 text-green-700 border-green-300",
  reserved: "bg-blue-100 text-blue-700 border-blue-300",
  occupied: "bg-red-100 text-red-700 border-red-300",
  blocked: "bg-gray-100 text-gray-500 border-gray-300",
};

const SEAT_BG: Record<SeatReservationStatus, string> = {
  available: "bg-green-100 border-green-400 hover:bg-green-200 text-green-800 cursor-pointer",
  reserved: "bg-blue-100 border-blue-400 hover:bg-blue-200 text-blue-800 cursor-pointer",
  occupied: "bg-red-100 border-red-400 text-red-800 cursor-pointer",
  blocked: "bg-gray-100 border-gray-300 text-gray-400 cursor-pointer",
};

// ============================================================
// 배치 생성 폼 타입
// ============================================================

type LayoutFormData = {
  name: string;
  rows: string;
  seatsPerRow: string;
};

function emptyLayoutForm(): LayoutFormData {
  return { name: "", rows: "5", seatsPerRow: "10" };
}

// ============================================================
// 예약 폼 타입
// ============================================================

type ReserveFormData = {
  reservedBy: string;
  reservedFor: string;
  phone: string;
  notes: string;
};

function emptyReserveForm(): ReserveFormData {
  return { reservedBy: "", reservedFor: "", phone: "", notes: "" };
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export function SeatReservationCard({
  groupId,
  projectId,
}: {
  groupId: string;
  projectId: string;
}) {
  const {
    layouts,
    loading,
    createLayout,
    deleteLayout,
    reserveSeat,
    cancelReservation,
    blockSeat,
    unblockSeat,
    getStats,
  } = useSeatReservation(groupId, projectId);

  const [isOpen, setIsOpen] = useState(false);
  const [activeLayoutId, setActiveLayoutId] = useState<string | null>(null);

  // 배치 생성 다이얼로그
  const [layoutDialogOpen, setLayoutDialogOpen] = useState(false);
  const [layoutForm, setLayoutForm] = useState<LayoutFormData>(emptyLayoutForm());
  const [layoutSaving, setLayoutSaving] = useState(false);

  // 좌석 클릭 다이얼로그
  const [seatDialogOpen, setSeatDialogOpen] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState<SeatReservationEntry | null>(null);
  const [selectedLayoutId, setSelectedLayoutId] = useState<string | null>(null);
  const [reserveForm, setReserveForm] = useState<ReserveFormData>(emptyReserveForm());
  const [seatSaving, setSeatSaving] = useState(false);

  // 예약 목록 확장
  const [showReservations, setShowReservations] = useState(false);

  const activeLayout = layouts.find((l) => l.id === activeLayoutId) ?? layouts[0] ?? null;

  // ── 배치 생성 ──
  async function handleLayoutCreate() {
    if (!layoutForm.name.trim()) {
      toast.error("배치 이름을 입력해주세요.");
      return;
    }
    const rows = parseInt(layoutForm.rows, 10);
    const seatsPerRow = parseInt(layoutForm.seatsPerRow, 10);
    if (isNaN(rows) || rows < 1 || rows > 26) {
      toast.error("행 수는 1~26 사이여야 합니다.");
      return;
    }
    if (isNaN(seatsPerRow) || seatsPerRow < 1 || seatsPerRow > 50) {
      toast.error("행당 좌석 수는 1~50 사이여야 합니다.");
      return;
    }

    setLayoutSaving(true);
    try {
      await createLayout(layoutForm.name.trim(), rows, seatsPerRow);
      toast.success("좌석 배치가 생성되었습니다.");
      setLayoutDialogOpen(false);
      setLayoutForm(emptyLayoutForm());
    } catch {
      toast.error("배치 생성에 실패했습니다.");
    } finally {
      setLayoutSaving(false);
    }
  }

  // ── 배치 삭제 ──
  async function handleLayoutDelete(layoutId: string, layoutName: string) {
    try {
      await deleteLayout(layoutId);
      if (activeLayoutId === layoutId) {
        setActiveLayoutId(null);
      }
      toast.success(`'${layoutName}' 배치가 삭제되었습니다.`);
    } catch {
      toast.error("배치 삭제에 실패했습니다.");
    }
  }

  // ── 좌석 클릭 ──
  function handleSeatClick(layout: SeatReservationLayout, seat: SeatReservationEntry) {
    setSelectedSeat(seat);
    setSelectedLayoutId(layout.id);
    if (seat.status === "reserved" || seat.status === "occupied") {
      setReserveForm({
        reservedBy: seat.reservedBy ?? "",
        reservedFor: seat.reservedFor ?? "",
        phone: seat.phone ?? "",
        notes: seat.notes ?? "",
      });
    } else {
      setReserveForm(emptyReserveForm());
    }
    setSeatDialogOpen(true);
  }

  // ── 예약 저장 ──
  async function handleReserveSave() {
    if (!selectedLayoutId || !selectedSeat) return;
    if (!reserveForm.reservedBy.trim()) {
      toast.error("예약자 이름을 입력해주세요.");
      return;
    }
    if (!reserveForm.reservedFor.trim()) {
      toast.error("관객 이름을 입력해주세요.");
      return;
    }

    setSeatSaving(true);
    try {
      await reserveSeat(
        selectedLayoutId,
        selectedSeat.id,
        reserveForm.reservedBy.trim(),
        reserveForm.reservedFor.trim(),
        reserveForm.phone.trim() || undefined,
        reserveForm.notes.trim() || undefined
      );
      toast.success(`${selectedSeat.seatLabel} 좌석이 예약되었습니다.`);
      setSeatDialogOpen(false);
    } catch {
      toast.error("예약에 실패했습니다.");
    } finally {
      setSeatSaving(false);
    }
  }

  // ── 예약 취소 ──
  async function handleCancelReservation() {
    if (!selectedLayoutId || !selectedSeat) return;

    setSeatSaving(true);
    try {
      await cancelReservation(selectedLayoutId, selectedSeat.id);
      toast.success(`${selectedSeat.seatLabel} 좌석 예약이 취소되었습니다.`);
      setSeatDialogOpen(false);
    } catch {
      toast.error("예약 취소에 실패했습니다.");
    } finally {
      setSeatSaving(false);
    }
  }

  // ── 좌석 차단/해제 ──
  async function handleBlockToggle() {
    if (!selectedLayoutId || !selectedSeat) return;

    setSeatSaving(true);
    try {
      if (selectedSeat.status === "blocked") {
        await unblockSeat(selectedLayoutId, selectedSeat.id);
        toast.success(`${selectedSeat.seatLabel} 좌석 차단이 해제되었습니다.`);
      } else {
        await blockSeat(selectedLayoutId, selectedSeat.id);
        toast.success(`${selectedSeat.seatLabel} 좌석이 차단되었습니다.`);
      }
      setSeatDialogOpen(false);
    } catch {
      toast.error("처리에 실패했습니다.");
    } finally {
      setSeatSaving(false);
    }
  }

  // 현재 활성 배치의 통계
  const stats = activeLayout ? getStats(activeLayout) : null;

  // 예약 목록 (reserved/occupied)
  const reservationList = activeLayout
    ? activeLayout.seats.filter(
        (s) => s.status === "reserved" || s.status === "occupied"
      )
    : [];

  // 행 단위로 그룹핑
  function getRows(layout: SeatReservationLayout): Map<string, SeatReservationEntry[]> {
    const map = new Map<string, SeatReservationEntry[]>();
    for (const seat of layout.seats) {
      const list = map.get(seat.row) ?? [];
      list.push(seat);
      map.set(seat.row, list);
    }
    return map;
  }

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity">
                  <Armchair className="h-4 w-4 text-purple-500" />
                  <CardTitle className="text-sm font-semibold">
                    관객 좌석 예약
                  </CardTitle>
                  <Badge className="text-[10px] px-1.5 py-0 bg-purple-100 text-purple-800 border border-purple-300">
                    {layouts.length}개 배치
                  </Badge>
                  {isOpen ? (
                    <ChevronUp className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  )}
                </button>
              </CollapsibleTrigger>
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  setLayoutForm(emptyLayoutForm());
                  setLayoutDialogOpen(true);
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                배치 추가
              </Button>
            </div>

            {/* 요약 통계 (활성 배치 기준) */}
            {stats && (
              <div className="mt-2 flex gap-3 flex-wrap">
                <span className="text-[10px] text-muted-foreground">
                  전체{" "}
                  <span className="font-semibold text-foreground">
                    {stats.totalSeats}석
                  </span>
                </span>
                <span className="text-[10px] text-muted-foreground">
                  예약{" "}
                  <span className="font-semibold text-blue-600">
                    {stats.reservedSeats}석
                  </span>
                </span>
                <span className="text-[10px] text-muted-foreground">
                  잔여{" "}
                  <span className="font-semibold text-green-600">
                    {stats.availableSeats}석
                  </span>
                </span>
                <span className="text-[10px] text-muted-foreground">
                  점유율{" "}
                  <span className="font-semibold text-foreground">
                    {stats.occupancyRate}%
                  </span>
                </span>
              </div>
            )}
            {stats && (
              <div className="mt-1.5">
                <Progress value={stats.occupancyRate} className="h-1.5" />
              </div>
            )}
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="pt-0">
              {loading ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  불러오는 중...
                </p>
              ) : layouts.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  등록된 좌석 배치가 없습니다. 배치를 추가해주세요.
                </p>
              ) : (
                <div className="space-y-4">
                  {/* 배치 탭 */}
                  <div className="flex gap-1.5 flex-wrap">
                    {layouts.map((layout) => (
                      <div key={layout.id} className="flex items-center gap-0.5">
                        <button
                          onClick={() => setActiveLayoutId(layout.id)}
                          className={`text-[10px] px-2 py-0.5 rounded-l border transition-colors ${
                            (activeLayout?.id === layout.id)
                              ? "bg-foreground text-background border-foreground"
                              : "bg-background text-muted-foreground border-border hover:border-foreground/50"
                          }`}
                        >
                          {layout.layoutName}
                        </button>
                        <button
                          onClick={() =>
                            handleLayoutDelete(layout.id, layout.layoutName)
                          }
                          className="text-[10px] px-1 py-0.5 rounded-r border border-l-0 border-border text-muted-foreground hover:text-destructive hover:border-destructive transition-colors"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* 좌석 배치도 */}
                  {activeLayout && (
                    <div className="space-y-3">
                      {/* 범례 */}
                      <div className="flex gap-2 flex-wrap">
                        {(
                          [
                            "available",
                            "reserved",
                            "occupied",
                            "blocked",
                          ] as SeatReservationStatus[]
                        ).map((s) => (
                          <div
                            key={s}
                            className="flex items-center gap-1"
                          >
                            <span
                              className={`inline-block w-3 h-3 rounded-sm border ${SEAT_BG[s].split(" ").filter((c) => c.startsWith("bg-") || c.startsWith("border-")).join(" ")}`}
                            />
                            <span className="text-[10px] text-muted-foreground">
                              {STATUS_LABELS[s]}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* 무대 */}
                      <div className="text-center">
                        <div className="inline-block px-8 py-1 bg-gray-200 rounded text-[10px] text-gray-600 font-medium border border-gray-300">
                          무대
                        </div>
                      </div>

                      {/* 좌석 그리드 */}
                      <div className="overflow-x-auto">
                        <div className="inline-block min-w-full">
                          {Array.from(getRows(activeLayout).entries()).map(
                            ([row, seats]) => (
                              <div
                                key={row}
                                className="flex items-center gap-1 mb-1"
                              >
                                {/* 행 라벨 */}
                                <span className="text-[10px] font-semibold text-muted-foreground w-4 text-center flex-shrink-0">
                                  {row}
                                </span>
                                {/* 좌석들 */}
                                {seats
                                  .sort((a, b) => a.number - b.number)
                                  .map((seat) => (
                                    <button
                                      key={seat.id}
                                      title={`${seat.seatLabel} - ${STATUS_LABELS[seat.status]}${seat.reservedFor ? ` (${seat.reservedFor})` : ""}`}
                                      onClick={() =>
                                        handleSeatClick(activeLayout, seat)
                                      }
                                      className={`w-6 h-6 rounded text-[9px] font-bold border transition-colors flex-shrink-0 ${SEAT_BG[seat.status]}`}
                                    >
                                      {seat.number}
                                    </button>
                                  ))}
                              </div>
                            )
                          )}
                        </div>
                      </div>

                      {/* 통계 진행바 상세 */}
                      <div className="rounded-md bg-muted/40 p-2 space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-muted-foreground">예약 현황</span>
                          <span className="font-semibold">
                            {stats?.reservedSeats} / {(stats?.totalSeats ?? 0) - (stats?.blockedSeats ?? 0)}석
                          </span>
                        </div>
                        <Progress
                          value={stats?.occupancyRate ?? 0}
                          className="h-1.5"
                        />
                        <div className="flex gap-3 flex-wrap pt-0.5">
                          <span className="text-[10px] text-muted-foreground">
                            전체{" "}
                            <span className="font-medium text-foreground">
                              {stats?.totalSeats}석
                            </span>
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            예약{" "}
                            <span className="font-medium text-blue-600">
                              {stats?.reservedSeats}석
                            </span>
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            잔여{" "}
                            <span className="font-medium text-green-600">
                              {stats?.availableSeats}석
                            </span>
                          </span>
                          {(stats?.blockedSeats ?? 0) > 0 && (
                            <span className="text-[10px] text-muted-foreground">
                              차단{" "}
                              <span className="font-medium text-gray-500">
                                {stats?.blockedSeats}석
                              </span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 예약 목록 */}
                      {reservationList.length > 0 && (
                        <div>
                          <button
                            onClick={() =>
                              setShowReservations((v) => !v)
                            }
                            className="flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-800 transition-colors mb-1"
                          >
                            예약 목록 ({reservationList.length}건)
                            {showReservations ? (
                              <ChevronUp className="h-2.5 w-2.5" />
                            ) : (
                              <ChevronDown className="h-2.5 w-2.5" />
                            )}
                          </button>
                          {showReservations && (
                            <div className="rounded-md border overflow-hidden">
                              <table className="w-full text-[10px]">
                                <thead className="bg-muted/50">
                                  <tr>
                                    <th className="px-2 py-1 text-left font-semibold text-muted-foreground">
                                      좌석
                                    </th>
                                    <th className="px-2 py-1 text-left font-semibold text-muted-foreground">
                                      관객
                                    </th>
                                    <th className="px-2 py-1 text-left font-semibold text-muted-foreground">
                                      예약자
                                    </th>
                                    <th className="px-2 py-1 text-left font-semibold text-muted-foreground">
                                      예약일
                                    </th>
                                    <th className="px-2 py-1 text-left font-semibold text-muted-foreground">
                                      상태
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {reservationList.map((seat) => (
                                    <tr
                                      key={seat.id}
                                      className="border-t hover:bg-muted/30 transition-colors"
                                    >
                                      <td className="px-2 py-1 font-semibold">
                                        {seat.seatLabel}
                                      </td>
                                      <td className="px-2 py-1">
                                        {seat.reservedFor ?? "-"}
                                      </td>
                                      <td className="px-2 py-1 text-muted-foreground">
                                        {seat.reservedBy ?? "-"}
                                      </td>
                                      <td className="px-2 py-1 text-muted-foreground">
                                        {seat.reservedAt
                                          ? new Date(
                                              seat.reservedAt
                                            ).toLocaleDateString("ko-KR", {
                                              month: "2-digit",
                                              day: "2-digit",
                                            })
                                          : "-"}
                                      </td>
                                      <td className="px-2 py-1">
                                        <span
                                          className={`px-1 py-0.5 rounded text-[9px] border ${STATUS_COLORS[seat.status]}`}
                                        >
                                          {STATUS_LABELS[seat.status]}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* 배치 생성 다이얼로그 */}
      <LayoutCreateDialog
        open={layoutDialogOpen}
        onOpenChange={setLayoutDialogOpen}
        form={layoutForm}
        setForm={setLayoutForm}
        onSave={handleLayoutCreate}
        saving={layoutSaving}
      />

      {/* 좌석 액션 다이얼로그 */}
      {selectedSeat && selectedLayoutId && (
        <SeatActionDialog
          open={seatDialogOpen}
          onOpenChange={setSeatDialogOpen}
          seat={selectedSeat}
          form={reserveForm}
          setForm={setReserveForm}
          onReserve={handleReserveSave}
          onCancel={handleCancelReservation}
          onBlockToggle={handleBlockToggle}
          saving={seatSaving}
        />
      )}
    </>
  );
}

// ============================================================
// 배치 생성 다이얼로그
// ============================================================

function LayoutCreateDialog({
  open,
  onOpenChange,
  form,
  setForm,
  onSave,
  saving,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: LayoutFormData;
  setForm: (f: LayoutFormData) => void;
  onSave: () => void;
  saving: boolean;
}) {
  function set<K extends keyof LayoutFormData>(
    key: K,
    value: LayoutFormData[K]
  ) {
    setForm({ ...form, [key]: value });
  }

  const rows = parseInt(form.rows, 10);
  const seatsPerRow = parseInt(form.seatsPerRow, 10);
  const totalSeats =
    !isNaN(rows) && !isNaN(seatsPerRow) ? rows * seatsPerRow : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Armchair className="h-4 w-4 text-purple-500" />
            좌석 배치 생성
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* 배치 이름 */}
          <div className="space-y-1">
            <Label className="text-xs">
              배치 이름 <span className="text-destructive">*</span>
            </Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: 1층 관람석, VIP석"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </div>

          {/* 행 수 + 행당 좌석 수 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">
                행 수 <span className="text-destructive">*</span>{" "}
                <span className="text-muted-foreground font-normal">(1~26)</span>
              </Label>
              <Input
                className="h-8 text-xs"
                type="number"
                min="1"
                max="26"
                value={form.rows}
                onChange={(e) => set("rows", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">
                행당 좌석 수 <span className="text-destructive">*</span>{" "}
                <span className="text-muted-foreground font-normal">(1~50)</span>
              </Label>
              <Input
                className="h-8 text-xs"
                type="number"
                min="1"
                max="50"
                value={form.seatsPerRow}
                onChange={(e) => set("seatsPerRow", e.target.value)}
              />
            </div>
          </div>

          {/* 총 좌석 수 미리보기 */}
          {totalSeats > 0 && (
            <div className="rounded-md bg-muted/50 px-3 py-2 text-center">
              <p className="text-xs text-muted-foreground">
                총{" "}
                <span className="font-bold text-foreground text-sm">
                  {totalSeats}
                </span>
                석이 생성됩니다.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={onSave}
            disabled={saving}
          >
            {saving ? "생성 중..." : "생성"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 좌석 액션 다이얼로그
// ============================================================

function SeatActionDialog({
  open,
  onOpenChange,
  seat,
  form,
  setForm,
  onReserve,
  onCancel,
  onBlockToggle,
  saving,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  seat: SeatReservationEntry;
  form: ReserveFormData;
  setForm: (f: ReserveFormData) => void;
  onReserve: () => void;
  onCancel: () => void;
  onBlockToggle: () => void;
  saving: boolean;
}) {
  function set<K extends keyof ReserveFormData>(
    key: K,
    value: ReserveFormData[K]
  ) {
    setForm({ ...form, [key]: value });
  }

  const isReserved = seat.status === "reserved" || seat.status === "occupied";
  const isBlocked = seat.status === "blocked";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Armchair className="h-4 w-4 text-purple-500" />
            좌석 {seat.seatLabel}
            <Badge
              className={`text-[10px] px-1.5 py-0 border ${STATUS_COLORS[seat.status]}`}
            >
              {STATUS_LABELS[seat.status]}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* 예약됨 or 사용중: 정보 표시 + 취소 */}
          {isReserved ? (
            <>
              <div className="rounded-md bg-muted/50 px-3 py-2 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">관객</span>
                  <span className="font-medium">{seat.reservedFor ?? "-"}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">예약자</span>
                  <span className="font-medium">{seat.reservedBy ?? "-"}</span>
                </div>
                {seat.phone && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">연락처</span>
                    <span className="font-medium">{seat.phone}</span>
                  </div>
                )}
                {seat.notes && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">메모</span>
                    <span className="font-medium">{seat.notes}</span>
                  </div>
                )}
                {seat.reservedAt && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">예약 일시</span>
                    <span className="font-medium">
                      {new Date(seat.reservedAt).toLocaleString("ko-KR", {
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground text-center">
                예약을 취소하려면 아래 버튼을 눌러주세요.
              </p>
            </>
          ) : isBlocked ? (
            <p className="text-xs text-muted-foreground text-center py-2">
              차단된 좌석입니다. 차단 해제 후 예약할 수 있습니다.
            </p>
          ) : (
            <>
              {/* 예약 폼 */}
              <div className="space-y-1">
                <Label className="text-xs">
                  관객 이름 <span className="text-destructive">*</span>
                </Label>
                <Input
                  className="h-8 text-xs"
                  placeholder="예: 홍길동"
                  value={form.reservedFor}
                  onChange={(e) => set("reservedFor", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">
                  예약자 이름 <span className="text-destructive">*</span>
                </Label>
                <Input
                  className="h-8 text-xs"
                  placeholder="예약을 진행하는 담당자"
                  value={form.reservedBy}
                  onChange={(e) => set("reservedBy", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">연락처</Label>
                <Input
                  className="h-8 text-xs"
                  placeholder="010-0000-0000"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">메모</Label>
                <Textarea
                  className="text-xs min-h-[56px] resize-none"
                  placeholder="특이사항 등"
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex-wrap gap-2">
          {/* 차단/해제 버튼 */}
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={onBlockToggle}
            disabled={saving}
          >
            {isBlocked ? (
              <>
                <Unlock className="h-3 w-3 mr-1" />
                차단 해제
              </>
            ) : (
              <>
                <Lock className="h-3 w-3 mr-1" />
                차단
              </>
            )}
          </Button>

          <div className="flex gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              닫기
            </Button>
            {isReserved ? (
              <Button
                size="sm"
                variant="destructive"
                className="h-7 text-xs"
                onClick={onCancel}
                disabled={saving}
              >
                {saving ? "처리 중..." : "예약 취소"}
              </Button>
            ) : !isBlocked ? (
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={onReserve}
                disabled={saving}
              >
                {saving ? "예약 중..." : "예약"}
              </Button>
            ) : null}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
