"use client";

import React, { memo } from "react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { AlertCircle, Building2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePracticeRoomBooking } from "@/hooks/use-practice-room-booking";
import type { PracticeRoomBookingStatus } from "@/types";

// 서브컴포넌트 임포트
import { RoomListSection } from "./room-list-section";
import { BookingListSection } from "./booking-list-section";
import { BookingWeekCalendar } from "./booking-week-calendar";
import type { BookingFormValues, RoomFormValues } from "./practice-room-types";

// ─── 통계 행 ─────────────────────────────────────────────────

interface StatsRowProps {
  thisWeekCount: number;
  mostUsedRoom: { name: string } | null;
  activeCount: number;
}

const StatsRow = memo(function StatsRow({
  thisWeekCount,
  mostUsedRoom,
  activeCount,
}: StatsRowProps) {
  return (
    <div className="grid grid-cols-3 gap-2" aria-label="연습실 예약 통계">
      <div className="rounded-lg bg-blue-50 p-2.5 text-center">
        <p className="text-lg font-bold text-blue-700" aria-label={`이번 주 예약 ${thisWeekCount}건`}>
          {thisWeekCount}
        </p>
        <p className="text-[10px] text-blue-600">이번 주 예약</p>
      </div>
      <div className="rounded-lg bg-green-50 p-2.5 text-center">
        <p className="text-lg font-bold text-green-700" aria-label={`활성 예약 ${activeCount}건`}>
          {activeCount}
        </p>
        <p className="text-[10px] text-green-600">활성 예약</p>
      </div>
      <div className="rounded-lg bg-purple-50 p-2.5 text-center">
        <p
          className="text-xs font-semibold text-purple-700 truncate"
          title={mostUsedRoom?.name ?? "-"}
          aria-label={`최다 사용 연습실: ${mostUsedRoom?.name ?? "없음"}`}
        >
          {mostUsedRoom?.name ?? "-"}
        </p>
        <p className="text-[10px] text-purple-600">최다 사용</p>
      </div>
    </div>
  );
});

// ─── 메인 카드 ────────────────────────────────────────────────

export function PracticeRoomBookingCard({ groupId }: { groupId: string }) {
  const {
    rooms,
    bookings,
    loading,
    stats,
    addRoom,
    updateRoom,
    deleteRoom,
    addBooking,
    updateBooking,
    deleteBooking,
    changeBookingStatus,
    findConflicts,
    getRoomById,
  } = usePracticeRoomBooking(groupId);

  // ── 연습실 CRUD 핸들러 ──────────────────────────────────────

  function handleAddRoom(v: RoomFormValues) {
    addRoom({
      name: v.name.trim(),
      address: v.address.trim(),
      capacity: parseInt(v.capacity, 10),
      costPerHour: parseInt(v.costPerHour, 10),
      contact: v.contact.trim(),
    });
    toast.success(TOAST.PRACTICE_ROOM_BOOKING.ROOM_REGISTERED);
  }

  function handleUpdateRoom(id: string, v: RoomFormValues) {
    const ok = updateRoom(id, {
      name: v.name.trim(),
      address: v.address.trim(),
      capacity: parseInt(v.capacity, 10),
      costPerHour: parseInt(v.costPerHour, 10),
      contact: v.contact.trim(),
    });
    if (ok) toast.success(TOAST.PRACTICE_ROOM_BOOKING.ROOM_UPDATED);
    else toast.error(TOAST.UPDATE_ERROR);
  }

  function handleDeleteRoom(id: string) {
    const ok = deleteRoom(id);
    if (ok) toast.success(TOAST.PRACTICE_ROOM_BOOKING.ROOM_DELETED);
    else toast.error(TOAST.DELETE_ERROR);
  }

  // ── 예약 CRUD 핸들러 ────────────────────────────────────────

  function handleAddBooking(v: BookingFormValues) {
    // 시간 충돌 감지
    const conflicts = findConflicts(v.roomId, v.date, v.startTime, v.endTime);
    if (conflicts.length > 0) {
      toast.error(
        `시간 충돌: ${conflicts[0]!.startTime}~${conflicts[0]!.endTime} 예약과 겹칩니다.`
      );
      return;
    }
    const result = addBooking({
      roomId: v.roomId,
      date: v.date,
      startTime: v.startTime,
      endTime: v.endTime,
      bookedBy: v.bookedBy.trim(),
      memo: v.memo.trim(),
      status: "예약됨",
    });
    if (result) toast.success(TOAST.PRACTICE_ROOM_BOOKING.BOOKING_CREATED);
    else toast.error(TOAST.PRACTICE_ROOM_BOOKING.BOOKING_CREATE_ERROR);
  }

  function handleUpdateBooking(id: string, v: BookingFormValues) {
    // 자기 자신을 제외한 충돌 감지
    const conflicts = findConflicts(v.roomId, v.date, v.startTime, v.endTime, id);
    if (conflicts.length > 0) {
      toast.error(
        `시간 충돌: ${conflicts[0]!.startTime}~${conflicts[0]!.endTime} 예약과 겹칩니다.`
      );
      return;
    }
    const ok = updateBooking(id, {
      roomId: v.roomId,
      date: v.date,
      startTime: v.startTime,
      endTime: v.endTime,
      bookedBy: v.bookedBy.trim(),
      memo: v.memo.trim(),
    });
    if (ok) toast.success(TOAST.PRACTICE_ROOM_BOOKING.BOOKING_UPDATED);
    else toast.error(TOAST.PRACTICE_ROOM_BOOKING.BOOKING_UPDATE_ERROR);
  }

  function handleDeleteBooking(id: string) {
    const ok = deleteBooking(id);
    if (ok) toast.success(TOAST.PRACTICE_ROOM_BOOKING.BOOKING_DELETED);
    else toast.error(TOAST.DELETE_ERROR);
  }

  function handleChangeStatus(id: string, status: PracticeRoomBookingStatus) {
    changeBookingStatus(id, status);
  }

  // ── 렌더 ───────────────────────────────────────────────────

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            연습 장소 예약
          </CardTitle>
          {rooms.length > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <AlertCircle className="h-3 w-3" aria-hidden="true" />
              중복 예약 자동 감지
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading ? (
          <div className="py-8 text-center text-xs text-muted-foreground" role="status">
            불러오는 중...
          </div>
        ) : (
          <>
            {/* 통계 요약 */}
            <StatsRow
              thisWeekCount={stats.thisWeekCount}
              mostUsedRoom={stats.mostUsedRoom}
              activeCount={stats.activeCount}
            />

            <Separator />

            {/* 탭: 주간 현황 / 예약 목록 / 연습실 */}
            <Tabs defaultValue="weekly">
              <TabsList className="h-7 text-xs">
                <TabsTrigger value="weekly" className="text-xs h-6 px-3">
                  주간 현황
                </TabsTrigger>
                <TabsTrigger value="bookings" className="text-xs h-6 px-3">
                  예약 목록
                </TabsTrigger>
                <TabsTrigger value="rooms" className="text-xs h-6 px-3">
                  연습실
                </TabsTrigger>
              </TabsList>

              {/* 주간 캘린더 탭 */}
              <TabsContent value="weekly" className="mt-3">
                <BookingWeekCalendar
                  bookings={bookings}
                  rooms={rooms}
                  getRoomById={getRoomById}
                />
              </TabsContent>

              {/* 예약 목록 탭 */}
              <TabsContent value="bookings" className="mt-3">
                <BookingListSection
                  bookings={bookings}
                  rooms={rooms}
                  onAddBooking={handleAddBooking}
                  onUpdateBooking={handleUpdateBooking}
                  onDeleteBooking={handleDeleteBooking}
                  onChangeStatus={handleChangeStatus}
                  getRoomById={getRoomById}
                />
              </TabsContent>

              {/* 연습실 관리 탭 */}
              <TabsContent value="rooms" className="mt-3">
                <RoomListSection
                  rooms={rooms}
                  onAddRoom={handleAddRoom}
                  onUpdateRoom={handleUpdateRoom}
                  onDeleteRoom={handleDeleteRoom}
                />
              </TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  );
}
