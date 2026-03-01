"use client";

import { memo } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type {
  SeatReservationLayout,
  SeatReservationEntry,
  SeatReservationStatus,
} from "@/types";
import {
  SEAT_BG,
  SEAT_STATUS_ORDER,
  STATUS_COLORS,
  STATUS_LABELS,
} from "./seat-reservation-types";

// ============================================================
// 좌석 지도 — 범례 + 무대 + 그리드 + 통계 + 예약 목록
// ============================================================

interface SeatMapProps {
  layout: SeatReservationLayout;
  stats: {
    totalSeats: number;
    reservedSeats: number;
    availableSeats: number;
    blockedSeats: number;
    occupancyRate: number;
  };
  showReservations: boolean;
  onToggleReservations: () => void;
  onSeatClick: (seat: SeatReservationEntry) => void;
}

export function SeatMap({
  layout,
  stats,
  showReservations,
  onToggleReservations,
  onSeatClick,
}: SeatMapProps) {
  const rows = getRows(layout);
  const reservationList = layout.seats.filter(
    (s) => s.status === "reserved" || s.status === "occupied"
  );

  return (
    <div className="space-y-3">
      {/* 범례 */}
      <SeatLegend />

      {/* 무대 */}
      <div className="text-center" aria-hidden="true">
        <div className="inline-block px-8 py-1 bg-gray-200 rounded text-[10px] text-gray-600 font-medium border border-gray-300">
          무대
        </div>
      </div>

      {/* 좌석 그리드 */}
      <SeatGrid rows={rows} onSeatClick={onSeatClick} />

      {/* 통계 진행바 상세 */}
      <SeatStats stats={stats} />

      {/* 예약 목록 */}
      {reservationList.length > 0 && (
        <ReservationList
          reservations={reservationList}
          expanded={showReservations}
          onToggle={onToggleReservations}
        />
      )}
    </div>
  );
}

// ── 범례 ───────────────────────────────────────────────────

function SeatLegend() {
  return (
    <ul
      className="flex gap-2 flex-wrap"
      aria-label="좌석 상태 범례"
      role="list"
    >
      {SEAT_STATUS_ORDER.map((s) => (
        <li key={s} className="flex items-center gap-1" role="listitem">
          <span
            className={`inline-block w-3 h-3 rounded-sm border ${SEAT_BG[s]
              .split(" ")
              .filter(
                (c) => c.startsWith("bg-") || c.startsWith("border-")
              )
              .join(" ")}`}
            aria-hidden="true"
          />
          <span className="text-[10px] text-muted-foreground">
            {STATUS_LABELS[s]}
          </span>
        </li>
      ))}
    </ul>
  );
}

// ── 좌석 그리드 ────────────────────────────────────────────

interface SeatGridProps {
  rows: Map<string, SeatReservationEntry[]>;
  onSeatClick: (seat: SeatReservationEntry) => void;
}

function SeatGrid({ rows, onSeatClick }: SeatGridProps) {
  return (
    <div className="overflow-x-auto">
      <div
        role="grid"
        aria-label="좌석 배치도"
        className="inline-block min-w-full"
      >
        {Array.from(rows.entries()).map(([row, seats]) => (
          <div
            key={row}
            role="row"
            className="flex items-center gap-1 mb-1"
            aria-label={`${row}행`}
          >
            {/* 행 라벨 */}
            <span
              className="text-[10px] font-semibold text-muted-foreground w-4 text-center flex-shrink-0"
              aria-hidden="true"
            >
              {row}
            </span>
            {/* 좌석들 */}
            {seats
              .sort((a, b) => a.number - b.number)
              .map((seat) => (
                <SeatCell
                  key={seat.id}
                  seat={seat}
                  onClick={() => onSeatClick(seat)}
                />
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 좌석 셀 (React.memo) ────────────────────────────────────

interface SeatCellProps {
  seat: SeatReservationEntry;
  onClick: () => void;
}

const SeatCell = memo(function SeatCell({ seat, onClick }: SeatCellProps) {
  const label = `${seat.seatLabel} ${STATUS_LABELS[seat.status]}${seat.reservedFor ? ` (${seat.reservedFor})` : ""}`;

  return (
    <button
      role="gridcell"
      aria-label={label}
      aria-pressed={
        seat.status === "reserved" || seat.status === "occupied"
      }
      title={label}
      onClick={onClick}
      className={`w-6 h-6 rounded text-[9px] font-bold border transition-colors flex-shrink-0 ${SEAT_BG[seat.status]}`}
    >
      <span aria-hidden="true">{seat.number}</span>
    </button>
  );
});

// ── 통계 ───────────────────────────────────────────────────

interface SeatStatsProps {
  stats: {
    totalSeats: number;
    reservedSeats: number;
    availableSeats: number;
    blockedSeats: number;
    occupancyRate: number;
  };
}

function SeatStats({ stats }: SeatStatsProps) {
  return (
    <div
      className="rounded-md bg-muted/40 p-2 space-y-1"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex justify-between text-[10px]">
        <span className="text-muted-foreground">예약 현황</span>
        <span className="font-semibold">
          {stats.reservedSeats} /{" "}
          {stats.totalSeats - stats.blockedSeats}석
        </span>
      </div>
      <Progress
        value={stats.occupancyRate}
        className="h-1.5"
        aria-label={`점유율 ${stats.occupancyRate}%`}
      />
      <ul className="flex gap-3 flex-wrap pt-0.5" role="list">
        <li className="text-[10px] text-muted-foreground" role="listitem">
          전체{" "}
          <span className="font-medium text-foreground">
            {stats.totalSeats}석
          </span>
        </li>
        <li className="text-[10px] text-muted-foreground" role="listitem">
          예약{" "}
          <span className="font-medium text-blue-600">
            {stats.reservedSeats}석
          </span>
        </li>
        <li className="text-[10px] text-muted-foreground" role="listitem">
          잔여{" "}
          <span className="font-medium text-green-600">
            {stats.availableSeats}석
          </span>
        </li>
        {stats.blockedSeats > 0 && (
          <li className="text-[10px] text-muted-foreground" role="listitem">
            차단{" "}
            <span className="font-medium text-gray-500">
              {stats.blockedSeats}석
            </span>
          </li>
        )}
      </ul>
    </div>
  );
}

// ── 예약 목록 ──────────────────────────────────────────────

interface ReservationListProps {
  reservations: SeatReservationEntry[];
  expanded: boolean;
  onToggle: () => void;
}

function ReservationList({
  reservations,
  expanded,
  onToggle,
}: ReservationListProps) {
  const listId = "reservation-list-table";

  return (
    <div>
      <button
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={listId}
        className="flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-800 transition-colors mb-1"
      >
        예약 목록 ({reservations.length}건)
        {expanded ? (
          <ChevronUp className="h-2.5 w-2.5" aria-hidden="true" />
        ) : (
          <ChevronDown className="h-2.5 w-2.5" aria-hidden="true" />
        )}
      </button>

      {expanded && (
        <div
          id={listId}
          className="rounded-md border overflow-hidden"
          aria-live="polite"
        >
          <table className="w-full text-[10px]" aria-label="예약 목록">
            <thead className="bg-muted/50">
              <tr>
                <th
                  scope="col"
                  className="px-2 py-1 text-left font-semibold text-muted-foreground"
                >
                  좌석
                </th>
                <th
                  scope="col"
                  className="px-2 py-1 text-left font-semibold text-muted-foreground"
                >
                  관객
                </th>
                <th
                  scope="col"
                  className="px-2 py-1 text-left font-semibold text-muted-foreground"
                >
                  예약자
                </th>
                <th
                  scope="col"
                  className="px-2 py-1 text-left font-semibold text-muted-foreground"
                >
                  예약일
                </th>
                <th
                  scope="col"
                  className="px-2 py-1 text-left font-semibold text-muted-foreground"
                >
                  상태
                </th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((seat) => (
                <ReservationRow key={seat.id} seat={seat} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── 예약 행 (React.memo) ────────────────────────────────────

const ReservationRow = memo(function ReservationRow({
  seat,
}: {
  seat: SeatReservationEntry;
}) {
  return (
    <tr className="border-t hover:bg-muted/30 transition-colors">
      <td className="px-2 py-1 font-semibold">{seat.seatLabel}</td>
      <td className="px-2 py-1">{seat.reservedFor ?? "-"}</td>
      <td className="px-2 py-1 text-muted-foreground">
        {seat.reservedBy ?? "-"}
      </td>
      <td className="px-2 py-1 text-muted-foreground">
        {seat.reservedAt
          ? new Date(seat.reservedAt).toLocaleDateString("ko-KR", {
              month: "2-digit",
              day: "2-digit",
            })
          : "-"}
      </td>
      <td className="px-2 py-1">
        <span
          className={`px-1 py-0.5 rounded text-[9px] border ${STATUS_COLORS[seat.status as SeatReservationStatus]}`}
        >
          {STATUS_LABELS[seat.status as SeatReservationStatus]}
        </span>
      </td>
    </tr>
  );
});

// ── 유틸: 행 단위 그룹핑 ────────────────────────────────────

function getRows(
  layout: SeatReservationLayout
): Map<string, SeatReservationEntry[]> {
  const map = new Map<string, SeatReservationEntry[]>();
  for (const seat of layout.seats) {
    const list = map.get(seat.row) ?? [];
    list.push(seat);
    map.set(seat.row, list);
  }
  return map;
}
