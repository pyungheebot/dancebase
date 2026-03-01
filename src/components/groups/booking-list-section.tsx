"use client";

import React, { memo, useMemo, useState } from "react";
import { CalendarDays, Clock, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { PracticeRoom, PracticeRoomBooking, PracticeRoomBookingStatus } from "@/types";
import {
  BOOKING_STATUS_COLORS,
  BOOKING_STATUS_LIST,
} from "@/hooks/use-practice-room-booking";
import { BookingFormDialog } from "./booking-form-dialog";
import { type BookingFormValues } from "./practice-room-types";

// ─── 예약 개별 아이템 ─────────────────────────────────────────

interface BookingItemProps {
  booking: PracticeRoomBooking;
  room?: PracticeRoom;
  rooms: PracticeRoom[];
  onUpdate: (v: BookingFormValues) => void;
  onDelete: () => void;
  onChangeStatus: (status: PracticeRoomBookingStatus) => void;
}

const BookingItem = memo(function BookingItem({
  booking, room, rooms, onUpdate, onDelete, onChangeStatus,
}: BookingItemProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const colors = BOOKING_STATUS_COLORS[booking.status];

  return (
    <div className="rounded-lg border bg-card p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex items-center gap-1.5">
            <Badge className={`text-[10px] px-1.5 py-0 ${colors.badge}`}>{booking.status}</Badge>
            <span className="text-xs font-medium truncate">{room?.name ?? "알 수 없는 연습실"}</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3 w-3" aria-hidden="true" />
              {booking.date}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" aria-hidden="true" />
              {booking.startTime} ~ {booking.endTime}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            예약자: {booking.bookedBy}{booking.memo && ` · ${booking.memo}`}
          </p>
        </div>

        {/* 수정/삭제 버튼 */}
        <div className="flex items-center gap-1 shrink-0">
          <BookingFormDialog
            rooms={rooms}
            title="예약 수정"
            initial={{ roomId: booking.roomId, date: booking.date, startTime: booking.startTime, endTime: booking.endTime, bookedBy: booking.bookedBy, memo: booking.memo }}
            onSave={onUpdate}
            trigger={
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0"
                aria-label={`${booking.date} ${booking.startTime} 예약 수정`}>
                <Pencil className="h-3 w-3" aria-hidden="true" />
              </Button>
            }
          />
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive"
                onClick={onDelete} aria-label="예약 삭제 확인">
                <Check className="h-3 w-3" aria-hidden="true" />
              </Button>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0"
                onClick={() => setConfirmDelete(false)} aria-label="삭제 취소">
                <X className="h-3 w-3" aria-hidden="true" />
              </Button>
            </div>
          ) : (
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
              onClick={() => setConfirmDelete(true)} aria-label={`${booking.date} ${booking.startTime} 예약 삭제`}>
              <Trash2 className="h-3 w-3" aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>

      {/* 상태 변경 버튼 그룹 */}
      <div className="flex items-center gap-1 flex-wrap" role="group" aria-label="예약 상태 변경">
        {BOOKING_STATUS_LIST.map((status) => (
          <button
            key={status}
            onClick={() => onChangeStatus(status)}
            aria-pressed={booking.status === status}
            className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
              booking.status === status
                ? `${BOOKING_STATUS_COLORS[status].badge} border-transparent`
                : "border-border text-muted-foreground hover:bg-accent"
            }`}
          >
            {status}
          </button>
        ))}
      </div>
    </div>
  );
});

// ─── 예약 목록 섹션 ───────────────────────────────────────────

interface BookingListSectionProps {
  bookings: PracticeRoomBooking[];
  rooms: PracticeRoom[];
  onAddBooking: (v: BookingFormValues) => void;
  onUpdateBooking: (id: string, v: BookingFormValues) => void;
  onDeleteBooking: (id: string) => void;
  onChangeStatus: (id: string, status: PracticeRoomBookingStatus) => void;
  getRoomById: (roomId: string) => PracticeRoom | undefined;
}

export const BookingListSection = memo(function BookingListSection({
  bookings, rooms, onAddBooking, onUpdateBooking,
  onDeleteBooking, onChangeStatus, getRoomById,
}: BookingListSectionProps) {
  const sorted = useMemo(
    () => [...bookings].sort((a, b) =>
      a.date !== b.date ? a.date.localeCompare(b.date) : a.startTime.localeCompare(b.startTime)
    ),
    [bookings]
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground" aria-live="polite">총 {bookings.length}건</span>
        <BookingFormDialog
          rooms={rooms}
          title="예약 생성"
          onSave={onAddBooking}
          trigger={
            <Button size="sm" className="h-7 text-xs gap-1" aria-label="새 예약 추가">
              <Plus className="h-3 w-3" aria-hidden="true" />
              예약 추가
            </Button>
          }
        />
      </div>

      {sorted.length === 0 ? (
        <div className="py-8 text-center text-xs text-muted-foreground" role="status">
          예약 내역이 없습니다.
        </div>
      ) : (
        <div className="space-y-2" role="list" aria-label="예약 목록">
          {sorted.map((booking) => (
            <div key={booking.id} role="listitem">
              <BookingItem
                booking={booking}
                room={getRoomById(booking.roomId)}
                rooms={rooms}
                onUpdate={(v) => onUpdateBooking(booking.id, v)}
                onDelete={() => onDeleteBooking(booking.id)}
                onChangeStatus={(status) => onChangeStatus(booking.id, status)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
