"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import {
  MapPin,
  Plus,
  Trash2,
  Users,
  Clock,
  Phone,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Building2,
  Pencil,
  Check,
  X,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  usePracticeRoomBooking,
  BOOKING_STATUS_COLORS,
  BOOKING_STATUS_LIST,
  getWeekDates,
  todayYMD,
} from "@/hooks/use-practice-room-booking";
import type {
  PracticeRoom,
  PracticeRoomBooking,
  PracticeRoomBookingStatus,
} from "@/types";
import { formatShortDate } from "@/lib/date-utils";

// ─── 상수 ─────────────────────────────────────────────────────

const WEEK_DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

// ─── 헬퍼 ─────────────────────────────────────────────────────

function formatCost(cost: number): string {
  return cost.toLocaleString("ko-KR") + "원";
}

function formatWeekLabel(weekDates: string[]): string {
  const first = weekDates[0]!;
  const last = weekDates[6]!;
  const f = new Date(first);
  const l = new Date(last);
  return `${f.getFullYear()}년 ${f.getMonth() + 1}월 ${f.getDate()}일 ~ ${l.getMonth() + 1}월 ${l.getDate()}일`;
}

function addWeeks(baseDate: string, delta: number): string {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + delta * 7);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ─── 연습실 폼 ────────────────────────────────────────────────

type RoomFormValues = {
  name: string;
  address: string;
  capacity: string;
  costPerHour: string;
  contact: string;
};

const EMPTY_ROOM_FORM: RoomFormValues = {
  name: "",
  address: "",
  capacity: "",
  costPerHour: "",
  contact: "",
};

function validateRoomForm(v: RoomFormValues): string | null {
  if (!v.name.trim()) return "연습실 이름을 입력해주세요.";
  if (!v.address.trim()) return "주소를 입력해주세요.";
  const cap = parseInt(v.capacity, 10);
  if (isNaN(cap) || cap <= 0) return "수용 인원은 1명 이상이어야 합니다.";
  const cost = parseInt(v.costPerHour, 10);
  if (isNaN(cost) || cost < 0) return "비용은 0원 이상이어야 합니다.";
  return null;
}

// ─── 예약 폼 ─────────────────────────────────────────────────

type BookingFormValues = {
  roomId: string;
  date: string;
  startTime: string;
  endTime: string;
  bookedBy: string;
  memo: string;
};

const EMPTY_BOOKING_FORM: BookingFormValues = {
  roomId: "",
  date: todayYMD(),
  startTime: "10:00",
  endTime: "12:00",
  bookedBy: "",
  memo: "",
};

function validateBookingForm(v: BookingFormValues): string | null {
  if (!v.roomId) return "연습실을 선택해주세요.";
  if (!v.date) return "날짜를 입력해주세요.";
  if (!v.startTime || !v.endTime) return "시작/종료 시간을 입력해주세요.";
  if (v.startTime >= v.endTime)
    return "종료 시간은 시작 시간보다 늦어야 합니다.";
  if (!v.bookedBy.trim()) return "예약자를 입력해주세요.";
  return null;
}

// ─── 연습실 등록 다이얼로그 ───────────────────────────────────

function RoomFormDialog({
  onSave,
  initial,
  trigger,
  title,
}: {
  onSave: (values: RoomFormValues) => void;
  initial?: RoomFormValues;
  trigger: React.ReactNode;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<RoomFormValues>(
    initial ?? EMPTY_ROOM_FORM
  );

  function handleOpenChange(v: boolean) {
    setOpen(v);
    if (v) setForm(initial ?? EMPTY_ROOM_FORM);
  }

  function handleChange(field: keyof RoomFormValues, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit() {
    const err = validateRoomForm(form);
    if (err) {
      toast.error(err);
      return;
    }
    onSave(form);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div className="space-y-1">
            <Label className="text-xs">연습실 이름 *</Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: 홍대 댄스스튜디오 A홀"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">주소 *</Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: 서울시 마포구 홍익로 123"
              value={form.address}
              onChange={(e) => handleChange("address", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">수용 인원 *</Label>
              <Input
                className="h-8 text-xs"
                type="number"
                min={1}
                placeholder="20"
                value={form.capacity}
                onChange={(e) => handleChange("capacity", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">시간당 비용 (원) *</Label>
              <Input
                className="h-8 text-xs"
                type="number"
                min={0}
                placeholder="30000"
                value={form.costPerHour}
                onChange={(e) => handleChange("costPerHour", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">연락처</Label>
            <Input
              className="h-8 text-xs"
              placeholder="010-0000-0000"
              value={form.contact}
              onChange={(e) => handleChange("contact", e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setOpen(false)}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            저장
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── 예약 생성 다이얼로그 ─────────────────────────────────────

function BookingFormDialog({
  rooms,
  onSave,
  initial,
  trigger,
  title,
}: {
  rooms: PracticeRoom[];
  onSave: (values: BookingFormValues) => void;
  initial?: BookingFormValues;
  trigger: React.ReactNode;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<BookingFormValues>(
    initial ?? EMPTY_BOOKING_FORM
  );

  function handleOpenChange(v: boolean) {
    setOpen(v);
    if (v) setForm(initial ?? EMPTY_BOOKING_FORM);
  }

  function handleChange(field: keyof BookingFormValues, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit() {
    const err = validateBookingForm(form);
    if (err) {
      toast.error(err);
      return;
    }
    onSave(form);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div className="space-y-1">
            <Label className="text-xs">연습실 *</Label>
            {rooms.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                먼저 연습실을 등록해주세요.
              </p>
            ) : (
              <Select
                value={form.roomId}
                onValueChange={(v) => handleChange("roomId", v)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="연습실 선택" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((r) => (
                    <SelectItem key={r.id} value={r.id} className="text-xs">
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="space-y-1">
            <Label className="text-xs">날짜 *</Label>
            <Input
              className="h-8 text-xs"
              type="date"
              value={form.date}
              onChange={(e) => handleChange("date", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">시작 시간 *</Label>
              <Input
                className="h-8 text-xs"
                type="time"
                value={form.startTime}
                onChange={(e) => handleChange("startTime", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">종료 시간 *</Label>
              <Input
                className="h-8 text-xs"
                type="time"
                value={form.endTime}
                onChange={(e) => handleChange("endTime", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">예약자 *</Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: 홍길동"
              value={form.bookedBy}
              onChange={(e) => handleChange("bookedBy", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">메모</Label>
            <Input
              className="h-8 text-xs"
              placeholder="추가 메모"
              value={form.memo}
              onChange={(e) => handleChange("memo", e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setOpen(false)}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            저장
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── 연습실 목록 탭 ───────────────────────────────────────────

function RoomsTab({
  rooms,
  onAddRoom,
  onUpdateRoom,
  onDeleteRoom,
}: {
  rooms: PracticeRoom[];
  onAddRoom: (v: RoomFormValues) => void;
  onUpdateRoom: (id: string, v: RoomFormValues) => void;
  onDeleteRoom: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          총 {rooms.length}개 연습실
        </span>
        <RoomFormDialog
          title="연습실 등록"
          onSave={onAddRoom}
          trigger={
            <Button size="sm" className="h-7 text-xs gap-1">
              <Plus className="h-3 w-3" />
              연습실 추가
            </Button>
          }
        />
      </div>

      {rooms.length === 0 ? (
        <div className="py-8 text-center text-xs text-muted-foreground">
          등록된 연습실이 없습니다.
          <br />
          연습실을 추가해보세요.
        </div>
      ) : (
        <div className="space-y-2">
          {rooms.map((room) => (
            <RoomItem
              key={room.id}
              room={room}
              onUpdate={(v) => onUpdateRoom(room.id, v)}
              onDelete={() => onDeleteRoom(room.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RoomItem({
  room,
  onUpdate,
  onDelete,
}: {
  room: PracticeRoom;
  onUpdate: (v: RoomFormValues) => void;
  onDelete: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="rounded-lg border bg-card p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold truncate">{room.name}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
            <p className="text-[10px] text-muted-foreground truncate">
              {room.address}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <RoomFormDialog
            title="연습실 수정"
            initial={{
              name: room.name,
              address: room.address,
              capacity: String(room.capacity),
              costPerHour: String(room.costPerHour),
              contact: room.contact,
            }}
            onSave={onUpdate}
            trigger={
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Pencil className="h-3 w-3" />
              </Button>
            }
          />
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-destructive"
                onClick={onDelete}
              >
                <Check className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setConfirmDelete(false)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {room.capacity}명
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatCost(room.costPerHour)}/시간
        </span>
        {room.contact && (
          <span className="flex items-center gap-1">
            <Phone className="h-3 w-3" />
            {room.contact}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── 예약 목록 탭 ─────────────────────────────────────────────

function BookingsTab({
  bookings,
  rooms,
  onAddBooking,
  onUpdateBooking,
  onDeleteBooking,
  onChangeStatus,
  getRoomById,
}: {
  bookings: PracticeRoomBooking[];
  rooms: PracticeRoom[];
  onAddBooking: (v: BookingFormValues) => void;
  onUpdateBooking: (id: string, v: BookingFormValues) => void;
  onDeleteBooking: (id: string) => void;
  onChangeStatus: (id: string, status: PracticeRoomBookingStatus) => void;
  getRoomById: (roomId: string) => PracticeRoom | undefined;
}) {
  const sorted = useMemo(
    () =>
      [...bookings].sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.startTime.localeCompare(b.startTime);
      }),
    [bookings]
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          총 {bookings.length}건
        </span>
        <BookingFormDialog
          rooms={rooms}
          title="예약 생성"
          onSave={onAddBooking}
          trigger={
            <Button size="sm" className="h-7 text-xs gap-1">
              <Plus className="h-3 w-3" />
              예약 추가
            </Button>
          }
        />
      </div>

      {sorted.length === 0 ? (
        <div className="py-8 text-center text-xs text-muted-foreground">
          예약 내역이 없습니다.
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((booking) => (
            <BookingItem
              key={booking.id}
              booking={booking}
              room={getRoomById(booking.roomId)}
              rooms={rooms}
              onUpdate={(v) => onUpdateBooking(booking.id, v)}
              onDelete={() => onDeleteBooking(booking.id)}
              onChangeStatus={(status) => onChangeStatus(booking.id, status)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BookingItem({
  booking,
  room,
  rooms,
  onUpdate,
  onDelete,
  onChangeStatus,
}: {
  booking: PracticeRoomBooking;
  room?: PracticeRoom;
  rooms: PracticeRoom[];
  onUpdate: (v: BookingFormValues) => void;
  onDelete: () => void;
  onChangeStatus: (status: PracticeRoomBookingStatus) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const colors = BOOKING_STATUS_COLORS[booking.status];

  return (
    <div className="rounded-lg border bg-card p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex items-center gap-1.5">
            <Badge className={`text-[10px] px-1.5 py-0 ${colors.badge}`}>
              {booking.status}
            </Badge>
            <span className="text-xs font-medium truncate">
              {room?.name ?? "알 수 없는 연습실"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              {booking.date}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {booking.startTime} ~ {booking.endTime}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            예약자: {booking.bookedBy}
            {booking.memo && ` · ${booking.memo}`}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <BookingFormDialog
            rooms={rooms}
            title="예약 수정"
            initial={{
              roomId: booking.roomId,
              date: booking.date,
              startTime: booking.startTime,
              endTime: booking.endTime,
              bookedBy: booking.bookedBy,
              memo: booking.memo,
            }}
            onSave={onUpdate}
            trigger={
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Pencil className="h-3 w-3" />
              </Button>
            }
          />
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-destructive"
                onClick={onDelete}
              >
                <Check className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setConfirmDelete(false)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
      {/* 상태 변경 버튼 */}
      <div className="flex items-center gap-1 flex-wrap">
        {BOOKING_STATUS_LIST.map((status) => (
          <button
            key={status}
            onClick={() => onChangeStatus(status)}
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
}

// ─── 주간 현황 탭 ─────────────────────────────────────────────

function WeeklyViewTab({
  bookings,
  rooms,
  getRoomById,
}: {
  bookings: PracticeRoomBooking[];
  rooms: PracticeRoom[];
  getRoomById: (roomId: string) => PracticeRoom | undefined;
}) {
  const [weekBase, setWeekBase] = useState<string>(todayYMD());
  const weekDates = useMemo(() => getWeekDates(weekBase), [weekBase]);
  const today = todayYMD();

  const weekBookings = useMemo(() => {
    const start = weekDates[0]!;
    const end = weekDates[6]!;
    return bookings.filter(
      (b) => b.date >= start && b.date <= end && b.status !== "취소됨"
    );
  }, [bookings, weekDates]);

  // 날짜별 예약 그룹핑
  const byDate = useMemo(() => {
    const map: Record<string, PracticeRoomBooking[]> = {};
    for (const date of weekDates) {
      map[date] = [];
    }
    for (const b of weekBookings) {
      if (map[b.date]) {
        map[b.date]!.push(b);
      }
    }
    // 각 날짜 내부 정렬
    for (const date of weekDates) {
      map[date]!.sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    return map;
  }, [weekBookings, weekDates]);

  return (
    <div className="space-y-3">
      {/* 주간 네비게이션 */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => setWeekBase((prev) => addWeeks(prev, -1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-xs font-medium">
          {formatWeekLabel(weekDates)}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => setWeekBase((prev) => addWeeks(prev, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* 요일별 열 */}
      <div className="grid grid-cols-7 gap-1">
        {weekDates.map((date, idx) => {
          const dayLabel = WEEK_DAY_LABELS[idx]!;
          const isToday = date === today;
          const dayBookings = byDate[date] ?? [];

          return (
            <div key={date} className="min-h-[80px]">
              {/* 요일 헤더 */}
              <div
                className={`text-center rounded-t py-1 mb-1 ${
                  isToday
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="text-[10px] font-medium">{dayLabel}</p>
                <p className="text-[9px] opacity-75">{formatShortDate(date)}</p>
              </div>

              {/* 예약 블록 */}
              <div className="space-y-0.5">
                {dayBookings.length === 0 ? (
                  <div className="h-4" />
                ) : (
                  dayBookings.map((b) => {
                    const room = getRoomById(b.roomId);
                    const colors = BOOKING_STATUS_COLORS[b.status];
                    return (
                      <div
                        key={b.id}
                        className={`rounded px-1 py-0.5 ${colors.bg}`}
                        title={`${room?.name ?? ""} · ${b.startTime}~${b.endTime} · ${b.bookedBy}`}
                      >
                        <p
                          className={`text-[9px] font-medium truncate ${colors.text}`}
                        >
                          {b.startTime}
                        </p>
                        <p className={`text-[8px] truncate ${colors.text} opacity-80`}>
                          {room?.name ?? "?"}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 이번 주 예약 상세 목록 */}
      {weekBookings.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <Separator />
          <p className="text-[10px] text-muted-foreground font-medium">
            이번 주 예약 목록 ({weekBookings.length}건)
          </p>
          {weekBookings
            .slice()
            .sort((a, b) => {
              if (a.date !== b.date) return a.date.localeCompare(b.date);
              return a.startTime.localeCompare(b.startTime);
            })
            .map((b) => {
              const room = getRoomById(b.roomId);
              const colors = BOOKING_STATUS_COLORS[b.status];
              return (
                <div
                  key={b.id}
                  className="flex items-center gap-2 text-[10px] text-muted-foreground"
                >
                  <Badge
                    className={`text-[9px] px-1 py-0 shrink-0 ${colors.badge}`}
                  >
                    {b.status}
                  </Badge>
                  <span className="shrink-0">{b.date.slice(5)}</span>
                  <span className="shrink-0">
                    {b.startTime}~{b.endTime}
                  </span>
                  <span className="truncate font-medium text-foreground">
                    {room?.name ?? "?"}
                  </span>
                  <span className="truncate">{b.bookedBy}</span>
                </div>
              );
            })}
        </div>
      )}

      {rooms.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">
          먼저 연습실을 등록해주세요.
        </p>
      )}
    </div>
  );
}

// ─── 통계 카드 ───────────────────────────────────────────────

function StatsRow({
  thisWeekCount,
  mostUsedRoom,
  activeCount,
}: {
  thisWeekCount: number;
  mostUsedRoom: { name: string } | null;
  activeCount: number;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="rounded-lg bg-blue-50 p-2.5 text-center">
        <p className="text-lg font-bold text-blue-700">{thisWeekCount}</p>
        <p className="text-[10px] text-blue-600">이번 주 예약</p>
      </div>
      <div className="rounded-lg bg-green-50 p-2.5 text-center">
        <p className="text-lg font-bold text-green-700">{activeCount}</p>
        <p className="text-[10px] text-green-600">활성 예약</p>
      </div>
      <div className="rounded-lg bg-purple-50 p-2.5 text-center">
        <p
          className="text-xs font-semibold text-purple-700 truncate"
          title={mostUsedRoom?.name ?? "-"}
        >
          {mostUsedRoom?.name ?? "-"}
        </p>
        <p className="text-[10px] text-purple-600">최다 사용</p>
      </div>
    </div>
  );
}

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

  // ── 핸들러 ─────────────────────────────────────────────────

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

  function handleAddBooking(v: BookingFormValues) {
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
            <Building2 className="h-4 w-4 text-muted-foreground" />
            연습 장소 예약
          </CardTitle>
          {rooms.length > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <AlertCircle className="h-3 w-3" />
              중복 예약 자동 감지
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            불러오는 중...
          </div>
        ) : (
          <>
            {/* 통계 */}
            <StatsRow
              thisWeekCount={stats.thisWeekCount}
              mostUsedRoom={stats.mostUsedRoom}
              activeCount={stats.activeCount}
            />

            <Separator />

            {/* 탭 */}
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

              <TabsContent value="weekly" className="mt-3">
                <WeeklyViewTab
                  bookings={bookings}
                  rooms={rooms}
                  getRoomById={getRoomById}
                />
              </TabsContent>

              <TabsContent value="bookings" className="mt-3">
                <BookingsTab
                  bookings={bookings}
                  rooms={rooms}
                  onAddBooking={handleAddBooking}
                  onUpdateBooking={handleUpdateBooking}
                  onDeleteBooking={handleDeleteBooking}
                  onChangeStatus={handleChangeStatus}
                  getRoomById={getRoomById}
                />
              </TabsContent>

              <TabsContent value="rooms" className="mt-3">
                <RoomsTab
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
