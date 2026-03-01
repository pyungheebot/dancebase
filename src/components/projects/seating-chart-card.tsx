"use client";

import { useState } from "react";
import {
  LayoutGrid,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Lock,
  Unlock,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useSeatingChart, rowLabel } from "@/hooks/use-seating-chart";
import type { SeatingChart, SeatInfo, SeatStatus } from "@/types";

// ============================================
// 상수: 좌석 상태 메타데이터
// ============================================

const STATUS_META: Record<
  SeatStatus,
  { label: string; bg: string; border: string; text: string }
> = {
  available: {
    label: "예약 가능",
    bg: "bg-green-100 hover:bg-green-200",
    border: "border-green-300",
    text: "text-green-700",
  },
  reserved: {
    label: "예약됨",
    bg: "bg-blue-100 hover:bg-blue-200",
    border: "border-blue-300",
    text: "text-blue-700",
  },
  blocked: {
    label: "사용 불가",
    bg: "bg-gray-200 hover:bg-gray-300",
    border: "border-gray-400",
    text: "text-gray-500",
  },
};

// ============================================
// 서브 컴포넌트: 배치도 생성 다이얼로그
// ============================================

interface CreateChartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (eventName: string, rows: number, seatsPerRow: number) => void;
}

function CreateChartDialog({
  open,
  onOpenChange,
  onCreate,
}: CreateChartDialogProps) {
  const [eventName, setEventName] = useState("");
  const [rows, setRows] = useState("5");
  const [seatsPerRow, setSeatsPerRow] = useState("10");

  function reset() {
    setEventName("");
    setRows("5");
    setSeatsPerRow("10");
  }

  function handleClose() {
    reset();
    onOpenChange(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimName = eventName.trim();
    if (!trimName) {
      toast.error(TOAST.SEATING.EVENT_NAME_REQUIRED);
      return;
    }
    const r = parseInt(rows, 10);
    const s = parseInt(seatsPerRow, 10);
    if (isNaN(r) || r < 1 || r > 26) {
      toast.error(TOAST.SEATING.ROW_COL_RANGE);
      return;
    }
    if (isNaN(s) || s < 1 || s > 50) {
      toast.error(TOAST.SEATING.COL_RANGE);
      return;
    }
    onCreate(trimName, r, s);
    reset();
    onOpenChange(false);
    toast.success(TOAST.SEATING.CHART_CREATED);
  }

  const previewTotal =
    (parseInt(rows, 10) || 0) * (parseInt(seatsPerRow, 10) || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">좌석 배치도 생성</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* 이벤트명 */}
          <div className="space-y-1.5">
            <Label className="text-xs">이벤트명 *</Label>
            <Input
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="예: 2026 정기공연"
              className="h-8 text-xs"
              autoFocus
              maxLength={100}
            />
          </div>

          {/* 행 수 */}
          <div className="space-y-1.5">
            <Label className="text-xs">행 수 (최대 26행, A~Z)</Label>
            <Input
              type="number"
              min={1}
              max={26}
              value={rows}
              onChange={(e) => setRows(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* 열 수 */}
          <div className="space-y-1.5">
            <Label className="text-xs">열 수 (최대 50열)</Label>
            <Input
              type="number"
              min={1}
              max={50}
              value={seatsPerRow}
              onChange={(e) => setSeatsPerRow(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* 미리보기 */}
          {previewTotal > 0 && (
            <div className="rounded-md bg-gray-50 px-3 py-2 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">총 좌석 수</span>
              <span className="text-xs font-semibold text-gray-800">
                {previewTotal}석
              </span>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={handleClose}
            >
              취소
            </Button>
            <Button type="submit" size="sm" className="h-7 text-xs">
              생성
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 서브 컴포넌트: 예약자 이름 입력 다이얼로그
// ============================================

interface ReserveDialogProps {
  open: boolean;
  seat: SeatInfo | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (name: string) => void;
}

function ReserveDialog({
  open,
  seat,
  onOpenChange,
  onConfirm,
}: ReserveDialogProps) {
  const [name, setName] = useState("");

  function reset() {
    setName("");
  }

  function handleClose() {
    reset();
    onOpenChange(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimName = name.trim();
    if (!trimName) {
      toast.error(TOAST.SEATING.BOOKER_REQUIRED);
      return;
    }
    onConfirm(trimName);
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-sm">
            좌석 예약 —{" "}
            {seat ? `${seat.row}열 ${seat.number}번` : ""}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">예약자 이름 *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 홍길동"
              className="h-8 text-xs"
              autoFocus
              maxLength={50}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={handleClose}
            >
              취소
            </Button>
            <Button type="submit" size="sm" className="h-7 text-xs">
              예약
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 서브 컴포넌트: 단일 좌석 버튼
// ============================================

interface SeatButtonProps {
  seat: SeatInfo;
  onClick: () => void;
}

function SeatButton({ seat, onClick }: SeatButtonProps) {
  const meta = STATUS_META[seat.status];

  return (
    <button
      type="button"
      onClick={onClick}
      title={
        seat.status === "reserved"
          ? `${seat.row}${seat.number} — ${seat.reservedBy}`
          : seat.status === "blocked"
          ? `${seat.row}${seat.number} — 사용 불가`
          : `${seat.row}${seat.number} — 예약 가능`
      }
      className={`
        relative w-6 h-6 rounded text-[9px] font-medium border transition-colors
        ${meta.bg} ${meta.border} ${meta.text}
        flex items-center justify-center flex-shrink-0
      `}
    >
      {seat.status === "blocked" ? (
        <Lock className="h-2.5 w-2.5" />
      ) : seat.status === "reserved" ? (
        <span className="leading-none truncate max-w-full px-0.5">
          {seat.reservedBy.slice(0, 1)}
        </span>
      ) : (
        <span className="text-[9px] leading-none">{seat.number}</span>
      )}
    </button>
  );
}

// ============================================
// 서브 컴포넌트: 배치도 패널
// ============================================

interface ChartPanelProps {
  chart: SeatingChart;
  onDelete: (id: string) => void;
  onReserve: (chartId: string, seatId: string, name: string) => void;
  onRelease: (chartId: string, seatId: string) => void;
  onBlock: (chartId: string, seatId: string) => void;
  stats: {
    totalSeats: number;
    reservedCount: number;
    availableCount: number;
    blockedCount: number;
    reservationRate: number;
  };
}

function ChartPanel({
  chart,
  onDelete,
  onReserve,
  onRelease,
  onBlock,
  stats,
}: ChartPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [reserveDialogOpen, setReserveDialogOpen] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState<SeatInfo | null>(null);

  // 행별로 좌석 그룹화
  const seatsByRow: Record<string, SeatInfo[]> = {};
  for (const seat of chart.seats) {
    if (!seatsByRow[seat.row]) seatsByRow[seat.row] = [];
    seatsByRow[seat.row].push(seat);
  }
  const rowKeys = Array.from(
    { length: chart.rows },
    (_, i) => rowLabel(i)
  );

  function handleSeatClick(seat: SeatInfo) {
    if (seat.status === "available") {
      setSelectedSeat(seat);
      setReserveDialogOpen(true);
    } else if (seat.status === "reserved") {
      onRelease(chart.id, seat.id);
      toast.success(`${seat.row}열 ${seat.number}번 예약이 해제되었습니다.`);
    } else if (seat.status === "blocked") {
      onRelease(chart.id, seat.id);
      toast.success(`${seat.row}열 ${seat.number}번 차단이 해제되었습니다.`);
    }
  }

  function handleReserveConfirm(name: string) {
    if (!selectedSeat) return;
    onReserve(chart.id, selectedSeat.id, name);
    toast.success(
      `${selectedSeat.row}열 ${selectedSeat.number}번 좌석이 "${name}"님으로 예약되었습니다.`
    );
    setSelectedSeat(null);
  }

  return (
    <div className="border rounded-lg bg-card overflow-hidden">
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        {/* 패널 헤더 */}
        <div className="flex items-center justify-between px-3 py-2 bg-gray-50">
          <div className="flex items-center gap-2 min-w-0">
            <CollapsibleTrigger asChild>
              <Button size="sm" variant="ghost" className="h-5 w-5 p-0 flex-shrink-0">
                {expanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronUp className="h-3 w-3" />
                )}
              </Button>
            </CollapsibleTrigger>
            <span className="text-xs font-medium truncate">
              {chart.eventName}
            </span>
            <Badge className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 hover:bg-blue-100 flex-shrink-0">
              {stats.reservationRate}% 예약
            </Badge>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className="text-[10px] text-muted-foreground hidden sm:block">
              {stats.reservedCount}/{stats.totalSeats - stats.blockedCount}석
            </span>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
              onClick={() => {
                onDelete(chart.id);
                toast.success(`"${chart.eventName}" 배치도가 삭제되었습니다.`);
              }}
              title="배치도 삭제"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* 패널 내용 */}
        <CollapsibleContent>
          <div className="px-3 pb-3 pt-2 space-y-3">
            {/* 통계 요약 */}
            <div className="grid grid-cols-4 gap-1.5 rounded-md bg-gray-50 p-2">
              <div className="text-center space-y-0.5">
                <p className="text-[10px] text-muted-foreground">전체</p>
                <p className="text-xs font-semibold">{stats.totalSeats}석</p>
              </div>
              <div className="text-center space-y-0.5 border-l border-gray-200">
                <p className="text-[10px] text-muted-foreground">예약</p>
                <p className="text-xs font-semibold text-blue-600">
                  {stats.reservedCount}석
                </p>
              </div>
              <div className="text-center space-y-0.5 border-l border-gray-200">
                <p className="text-[10px] text-muted-foreground">가능</p>
                <p className="text-xs font-semibold text-green-600">
                  {stats.availableCount}석
                </p>
              </div>
              <div className="text-center space-y-0.5 border-l border-gray-200">
                <p className="text-[10px] text-muted-foreground">차단</p>
                <p className="text-xs font-semibold text-gray-500">
                  {stats.blockedCount}석
                </p>
              </div>
            </div>

            {/* 좌석 그리드 */}
            <div className="space-y-1">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                좌석 배치도
              </p>
              <p className="text-[10px] text-muted-foreground">
                클릭: 예약 가능 → 예약 / 예약됨·차단됨 → 해제
              </p>
              <ScrollArea className="w-full">
                <div className="space-y-1 min-w-0">
                  {rowKeys.map((rowKey) => {
                    const rowSeats = (seatsByRow[rowKey] ?? []).sort(
                      (a, b) => a.number - b.number
                    );
                    return (
                      <div key={rowKey} className="flex items-center gap-1">
                        {/* 행 라벨 */}
                        <span className="text-[10px] font-medium text-muted-foreground w-4 flex-shrink-0 text-center">
                          {rowKey}
                        </span>
                        {/* 좌석 버튼들 */}
                        <div className="flex gap-0.5 flex-wrap">
                          {rowSeats.map((seat) => (
                            <SeatButton
                              key={seat.id}
                              seat={seat}
                              onClick={() => handleSeatClick(seat)}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            {/* 범례 */}
            <div className="flex items-center gap-3 flex-wrap">
              <p className="text-[10px] font-medium text-muted-foreground">
                범례:
              </p>
              {(Object.keys(STATUS_META) as SeatStatus[]).map((status) => {
                const meta = STATUS_META[status];
                return (
                  <div key={status} className="flex items-center gap-1">
                    <div
                      className={`w-3.5 h-3.5 rounded border ${meta.bg} ${meta.border}`}
                    />
                    <span className="text-[10px] text-muted-foreground">
                      {meta.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* 예약자 목록 */}
            {stats.reservedCount > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  예약자 목록
                </p>
                <div className="space-y-0.5 max-h-32 overflow-y-auto">
                  {chart.seats
                    .filter((s) => s.status === "reserved")
                    .sort((a, b) => {
                      if (a.row < b.row) return -1;
                      if (a.row > b.row) return 1;
                      return a.number - b.number;
                    })
                    .map((seat) => (
                      <div
                        key={seat.id}
                        className="flex items-center justify-between py-1 px-2 rounded bg-gray-50 hover:bg-gray-100 group"
                      >
                        <div className="flex items-center gap-1.5">
                          <Badge className="text-[10px] px-1 py-0 bg-blue-100 text-blue-700 hover:bg-blue-100">
                            {seat.row}{seat.number}
                          </Badge>
                          <span className="text-xs">{seat.reservedBy}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                          onClick={() => {
                            onRelease(chart.id, seat.id);
                            toast.success(
                              `${seat.row}열 ${seat.number}번 예약이 해제되었습니다.`
                            );
                          }}
                          title="예약 해제"
                        >
                          <Unlock className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* 좌석 차단 도움말 */}
            <div className="rounded-md bg-amber-50 border border-amber-200 px-2.5 py-2">
              <p className="text-[10px] text-amber-700">
                우클릭 또는 차단하려는 좌석을 예약 해제 후 차단 버튼으로
                관리합니다. 현재 예약 가능 좌석을 클릭하면 예약, 예약된 좌석을
                클릭하면 해제됩니다.
              </p>
            </div>

            {/* 차단 버튼 영역 */}
            <div className="flex flex-wrap gap-1">
              {chart.seats
                .filter((s) => s.status === "available")
                .slice(0, 0)
                .map((seat) => (
                  <Button
                    key={seat.id}
                    size="sm"
                    variant="outline"
                    className="h-6 text-[10px] px-1.5 gap-0.5"
                    onClick={() => {
                      onBlock(chart.id, seat.id);
                      toast.success(
                        `${seat.row}열 ${seat.number}번이 차단되었습니다.`
                      );
                    }}
                  >
                    <Lock className="h-2.5 w-2.5" />
                    {seat.row}{seat.number} 차단
                  </Button>
                ))}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* 예약자 이름 입력 다이얼로그 */}
      <ReserveDialog
        open={reserveDialogOpen}
        seat={selectedSeat}
        onOpenChange={(o) => {
          setReserveDialogOpen(o);
          if (!o) setSelectedSeat(null);
        }}
        onConfirm={handleReserveConfirm}
      />
    </div>
  );
}

// ============================================
// 메인 컴포넌트
// ============================================

interface SeatingChartCardProps {
  groupId: string;
  projectId: string;
}

export function SeatingChartCard({
  groupId,
  projectId,
}: SeatingChartCardProps) {
  const {
    charts,
    loading,
    createChart,
    deleteChart,
    reserveSeat,
    releaseSeat,
    blockSeat,
    getStats,
  } = useSeatingChart(groupId, projectId);

  const [open, setOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // 전체 예약 수 합산
  const totalReserved = charts.reduce(
    (sum, c) => sum + getStats(c.id).reservedCount,
    0
  );

  return (
    <div className="border rounded-lg bg-card">
      <Collapsible open={open} onOpenChange={setOpen}>
        {/* 카드 헤더 */}
        <div className="flex items-center justify-between px-3 py-2.5">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-indigo-500 flex-shrink-0" />
            <span className="text-sm font-medium">좌석 배치도</span>
            {charts.length > 0 && (
              <Badge className="text-[10px] px-1.5 py-0 bg-indigo-100 text-indigo-700 hover:bg-indigo-100">
                {charts.length}개 배치도
              </Badge>
            )}
          </div>

          {/* 요약 통계 */}
          <div className="flex items-center gap-2">
            {totalReserved > 0 && (
              <span className="hidden sm:flex items-center gap-1 text-[10px] text-muted-foreground">
                <Users className="h-3 w-3" />
                {totalReserved}명 예약
              </span>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs gap-1 px-2"
              onClick={(e) => {
                e.stopPropagation();
                setCreateDialogOpen(true);
              }}
              title="배치도 추가"
            >
              <Plus className="h-3 w-3" />
              <span className="hidden sm:inline">배치도 추가</span>
            </Button>
            <CollapsibleTrigger asChild>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                {open ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>

        {/* 펼쳐지는 내용 */}
        <CollapsibleContent>
          <div className="px-3 pb-3 border-t">
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <span className="text-xs text-muted-foreground">
                  불러오는 중...
                </span>
              </div>
            ) : charts.length === 0 ? (
              /* 빈 상태 */
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground gap-2">
                <LayoutGrid className="h-7 w-7 opacity-30" />
                <p className="text-xs">아직 좌석 배치도가 없습니다.</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs mt-1 gap-1"
                  onClick={() => setCreateDialogOpen(true)}
                >
                  <Plus className="h-3 w-3" />
                  첫 배치도 생성
                </Button>
              </div>
            ) : (
              <div className="mt-2 space-y-2">
                {charts.map((chart) => (
                  <ChartPanel
                    key={chart.id}
                    chart={chart}
                    onDelete={deleteChart}
                    onReserve={reserveSeat}
                    onRelease={releaseSeat}
                    onBlock={blockSeat}
                    stats={getStats(chart.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* 배치도 생성 다이얼로그 */}
      <CreateChartDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreate={createChart}
      />
    </div>
  );
}
