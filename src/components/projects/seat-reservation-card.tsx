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
import { Progress } from "@/components/ui/progress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Plus, Armchair } from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useSeatReservation } from "@/hooks/use-seat-reservation";
import type { SeatReservationLayout, SeatReservationEntry } from "@/types";
import {
  emptyLayoutForm,
  emptyReserveForm,
  LAYOUT_VALIDATION,
  type LayoutFormData,
  type ReserveFormData,
} from "./seat-reservation-types";
import { LayoutCreateDialog } from "./seat-reservation-layout-dialog";
import { SeatActionDialog } from "./seat-reservation-seat-dialog";
import { SeatMap } from "./seat-reservation-map";

// ============================================================
// 메인 카드 컴포넌트
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

  const activeLayout =
    layouts.find((l) => l.id === activeLayoutId) ?? layouts[0] ?? null;
  const stats = activeLayout ? getStats(activeLayout) : null;

  // ── 배치 생성 ─────────────────────────────────────────────
  async function handleLayoutCreate() {
    if (!layoutForm.name.trim()) {
      toast.error(TOAST.SEATING.LAYOUT_NAME_REQUIRED);
      return;
    }
    const rows = parseInt(layoutForm.rows, 10);
    const seatsPerRow = parseInt(layoutForm.seatsPerRow, 10);
    if (
      isNaN(rows) ||
      rows < LAYOUT_VALIDATION.ROW_MIN ||
      rows > LAYOUT_VALIDATION.ROW_MAX
    ) {
      toast.error(TOAST.SEATING.ROW_RANGE);
      return;
    }
    if (
      isNaN(seatsPerRow) ||
      seatsPerRow < LAYOUT_VALIDATION.SEAT_MIN ||
      seatsPerRow > LAYOUT_VALIDATION.SEAT_MAX
    ) {
      toast.error(TOAST.SEATING.SEAT_PER_ROW_RANGE);
      return;
    }

    setLayoutSaving(true);
    try {
      await createLayout(layoutForm.name.trim(), rows, seatsPerRow);
      toast.success(TOAST.SEATING.LAYOUT_CREATED);
      setLayoutDialogOpen(false);
      setLayoutForm(emptyLayoutForm());
    } catch {
      toast.error(TOAST.SEATING.LAYOUT_CREATE_ERROR);
    } finally {
      setLayoutSaving(false);
    }
  }

  // ── 배치 삭제 ─────────────────────────────────────────────
  async function handleLayoutDelete(layoutId: string, layoutName: string) {
    try {
      await deleteLayout(layoutId);
      if (activeLayoutId === layoutId) setActiveLayoutId(null);
      toast.success(`'${layoutName}' 배치가 삭제되었습니다.`);
    } catch {
      toast.error(TOAST.SEATING.LAYOUT_DELETE_ERROR);
    }
  }

  // ── 좌석 클릭 ────────────────────────────────────────────
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

  // ── 예약 저장 ────────────────────────────────────────────
  async function handleReserveSave() {
    if (!selectedLayoutId || !selectedSeat) return;
    if (!reserveForm.reservedBy.trim()) {
      toast.error(TOAST.SEATING.RESERVER_REQUIRED);
      return;
    }
    if (!reserveForm.reservedFor.trim()) {
      toast.error(TOAST.SEATING.AUDIENCE_REQUIRED);
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
      toast.error(TOAST.SEATING.RESERVE_ERROR);
    } finally {
      setSeatSaving(false);
    }
  }

  // ── 예약 취소 ────────────────────────────────────────────
  async function handleCancelReservation() {
    if (!selectedLayoutId || !selectedSeat) return;

    setSeatSaving(true);
    try {
      await cancelReservation(selectedLayoutId, selectedSeat.id);
      toast.success(`${selectedSeat.seatLabel} 좌석 예약이 취소되었습니다.`);
      setSeatDialogOpen(false);
    } catch {
      toast.error(TOAST.SEATING.CANCEL_ERROR);
    } finally {
      setSeatSaving(false);
    }
  }

  // ── 좌석 차단/해제 ───────────────────────────────────────
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
      toast.error(TOAST.SEATING.PROCESS_ERROR);
    } finally {
      setSeatSaving(false);
    }
  }

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CollapsibleTrigger asChild>
                <button
                  className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity"
                  aria-expanded={isOpen}
                  aria-label={`관객 좌석 예약 ${isOpen ? "접기" : "펼치기"}`}
                >
                  <Armchair
                    className="h-4 w-4 text-purple-500"
                    aria-hidden="true"
                  />
                  <CardTitle className="text-sm font-semibold">
                    관객 좌석 예약
                  </CardTitle>
                  <Badge className="text-[10px] px-1.5 py-0 bg-purple-100 text-purple-800 border border-purple-300">
                    {layouts.length}개 배치
                  </Badge>
                  {isOpen ? (
                    <ChevronUp
                      className="h-3 w-3 text-muted-foreground"
                      aria-hidden="true"
                    />
                  ) : (
                    <ChevronDown
                      className="h-3 w-3 text-muted-foreground"
                      aria-hidden="true"
                    />
                  )}
                </button>
              </CollapsibleTrigger>
              <Button
                size="sm"
                className="h-7 text-xs"
                aria-label="좌석 배치 추가"
                onClick={(e) => {
                  e.stopPropagation();
                  setLayoutForm(emptyLayoutForm());
                  setLayoutDialogOpen(true);
                }}
              >
                <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
                배치 추가
              </Button>
            </div>

            {/* 요약 통계 (활성 배치 기준) */}
            {stats && (
              <div
                className="mt-2 flex gap-3 flex-wrap"
                aria-live="polite"
                aria-atomic="true"
              >
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
                <Progress
                  value={stats.occupancyRate}
                  className="h-1.5"
                  aria-label={`전체 점유율 ${stats.occupancyRate}%`}
                />
              </div>
            )}
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="pt-0">
              {loading ? (
                <p
                  className="text-xs text-muted-foreground text-center py-4"
                  aria-live="polite"
                >
                  불러오는 중...
                </p>
              ) : layouts.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  등록된 좌석 배치가 없습니다. 배치를 추가해주세요.
                </p>
              ) : (
                <div className="space-y-4">
                  {/* 배치 탭 */}
                  <LayoutTabs
                    layouts={layouts}
                    activeLayout={activeLayout}
                    onSelect={setActiveLayoutId}
                    onDelete={handleLayoutDelete}
                  />

                  {/* 좌석 지도 */}
                  {activeLayout && stats && (
                    <SeatMap
                      layout={activeLayout}
                      stats={stats}
                      showReservations={showReservations}
                      onToggleReservations={() =>
                        setShowReservations((v) => !v)
                      }
                      onSeatClick={(seat) =>
                        handleSeatClick(activeLayout, seat)
                      }
                    />
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
// 배치 탭 (내부 컴포넌트)
// ============================================================

interface LayoutTabsProps {
  layouts: SeatReservationLayout[];
  activeLayout: SeatReservationLayout | null;
  onSelect: (id: string) => void;
  onDelete: (id: string, name: string) => void;
}

function LayoutTabs({
  layouts,
  activeLayout,
  onSelect,
  onDelete,
}: LayoutTabsProps) {
  return (
    <div
      className="flex gap-1.5 flex-wrap"
      role="tablist"
      aria-label="좌석 배치 선택"
    >
      {layouts.map((layout) => {
        const isActive = activeLayout?.id === layout.id;
        return (
          <div key={layout.id} className="flex items-center gap-0.5">
            <button
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelect(layout.id)}
              className={`text-[10px] px-2 py-0.5 rounded-l border transition-colors ${
                isActive
                  ? "bg-foreground text-background border-foreground"
                  : "bg-background text-muted-foreground border-border hover:border-foreground/50"
              }`}
            >
              {layout.layoutName}
            </button>
            <button
              onClick={() => onDelete(layout.id, layout.layoutName)}
              aria-label={`'${layout.layoutName}' 배치 삭제`}
              className="text-[10px] px-1 py-0.5 rounded-r border border-l-0 border-border text-muted-foreground hover:text-destructive hover:border-destructive transition-colors"
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
