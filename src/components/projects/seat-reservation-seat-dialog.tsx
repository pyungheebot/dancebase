"use client";

import { Armchair, Lock, Unlock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SeatReservationEntry } from "@/types";
import type { ReserveFormData } from "./seat-reservation-types";
import { STATUS_COLORS, STATUS_LABELS } from "./seat-reservation-types";

// ============================================================
// 좌석 액션 다이얼로그
// ============================================================

interface SeatActionDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  seat: SeatReservationEntry;
  form: ReserveFormData;
  setForm: (f: ReserveFormData) => void;
  onReserve: () => void;
  onCancel: () => void;
  onBlockToggle: () => void;
  saving: boolean;
}

export function SeatActionDialog({
  open,
  onOpenChange,
  seat,
  form,
  setForm,
  onReserve,
  onCancel,
  onBlockToggle,
  saving,
}: SeatActionDialogProps) {
  function set<K extends keyof ReserveFormData>(
    key: K,
    value: ReserveFormData[K]
  ) {
    setForm({ ...form, [key]: value });
  }

  const isReserved =
    seat.status === "reserved" || seat.status === "occupied";
  const isBlocked = seat.status === "blocked";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Armchair
              className="h-4 w-4 text-purple-500"
              aria-hidden="true"
            />
            좌석 {seat.seatLabel}
            <Badge
              className={`text-[10px] px-1.5 py-0 border ${STATUS_COLORS[seat.status]}`}
            >
              {STATUS_LABELS[seat.status]}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* 예약됨 or 사용 중: 정보 표시 + 취소 */}
          {isReserved ? (
            <ReservedSeatInfo seat={seat} />
          ) : isBlocked ? (
            <p className="text-xs text-muted-foreground text-center py-2">
              차단된 좌석입니다. 차단 해제 후 예약할 수 있습니다.
            </p>
          ) : (
            <ReserveForm form={form} set={set} />
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
            aria-label={
              isBlocked
                ? `${seat.seatLabel} 좌석 차단 해제`
                : `${seat.seatLabel} 좌석 차단`
            }
          >
            {isBlocked ? (
              <>
                <Unlock className="h-3 w-3 mr-1" aria-hidden="true" />
                차단 해제
              </>
            ) : (
              <>
                <Lock className="h-3 w-3 mr-1" aria-hidden="true" />
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
                aria-busy={saving}
                aria-label={`${seat.seatLabel} 좌석 예약 취소`}
              >
                {saving ? "처리 중..." : "예약 취소"}
              </Button>
            ) : !isBlocked ? (
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={onReserve}
                disabled={saving}
                aria-busy={saving}
                aria-label={`${seat.seatLabel} 좌석 예약`}
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

// ── 예약 정보 표시 ─────────────────────────────────────────

function ReservedSeatInfo({ seat }: { seat: SeatReservationEntry }) {
  return (
    <>
      <dl className="rounded-md bg-muted/50 px-3 py-2 space-y-1">
        <div className="flex justify-between text-xs">
          <dt className="text-muted-foreground">관객</dt>
          <dd className="font-medium">{seat.reservedFor ?? "-"}</dd>
        </div>
        <div className="flex justify-between text-xs">
          <dt className="text-muted-foreground">예약자</dt>
          <dd className="font-medium">{seat.reservedBy ?? "-"}</dd>
        </div>
        {seat.phone && (
          <div className="flex justify-between text-xs">
            <dt className="text-muted-foreground">연락처</dt>
            <dd className="font-medium">{seat.phone}</dd>
          </div>
        )}
        {seat.notes && (
          <div className="flex justify-between text-xs">
            <dt className="text-muted-foreground">메모</dt>
            <dd className="font-medium">{seat.notes}</dd>
          </div>
        )}
        {seat.reservedAt && (
          <div className="flex justify-between text-xs">
            <dt className="text-muted-foreground">예약 일시</dt>
            <dd className="font-medium">
              {new Date(seat.reservedAt).toLocaleString("ko-KR", {
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </dd>
          </div>
        )}
      </dl>
      <p className="text-[10px] text-muted-foreground text-center">
        예약을 취소하려면 아래 버튼을 눌러주세요.
      </p>
    </>
  );
}

// ── 예약 폼 ────────────────────────────────────────────────

interface ReserveFormProps {
  form: ReserveFormData;
  set: <K extends keyof ReserveFormData>(
    key: K,
    value: ReserveFormData[K]
  ) => void;
}

function ReserveForm({ form, set }: ReserveFormProps) {
  return (
    <>
      <div className="space-y-1">
        <Label htmlFor="reserve-for" className="text-xs">
          관객 이름{" "}
          <span className="text-destructive" aria-hidden="true">
            *
          </span>
          <span className="sr-only">(필수)</span>
        </Label>
        <Input
          id="reserve-for"
          className="h-8 text-xs"
          placeholder="예: 홍길동"
          value={form.reservedFor}
          onChange={(e) => set("reservedFor", e.target.value)}
          aria-required="true"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="reserve-by" className="text-xs">
          예약자 이름{" "}
          <span className="text-destructive" aria-hidden="true">
            *
          </span>
          <span className="sr-only">(필수)</span>
        </Label>
        <Input
          id="reserve-by"
          className="h-8 text-xs"
          placeholder="예약을 진행하는 담당자"
          value={form.reservedBy}
          onChange={(e) => set("reservedBy", e.target.value)}
          aria-required="true"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="reserve-phone" className="text-xs">
          연락처
        </Label>
        <Input
          id="reserve-phone"
          className="h-8 text-xs"
          placeholder="010-0000-0000"
          value={form.phone}
          onChange={(e) => set("phone", e.target.value)}
          inputMode="tel"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="reserve-notes" className="text-xs">
          메모
        </Label>
        <Textarea
          id="reserve-notes"
          className="text-xs min-h-[56px] resize-none"
          placeholder="특이사항 등"
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
        />
      </div>
    </>
  );
}
