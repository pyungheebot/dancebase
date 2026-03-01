"use client";

// ============================================
// 공연장 추가 / 수정 다이얼로그
// ============================================

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { createDefaultFacilities } from "@/hooks/use-venue-management";
import type { VenueMgmtFacility, VenueMgmtBookingStatus } from "@/types";
import {
  BOOKING_STATUS_OPTIONS,
  type VenueDialogProps,
} from "./types";

export function VenueDialog({
  open,
  onOpenChange,
  initialData,
  onSubmit,
}: VenueDialogProps) {
  const isEdit = Boolean(initialData);

  const [name, setName] = useState(initialData?.name ?? "");
  const [address, setAddress] = useState(initialData?.address ?? "");
  const [capacityStr, setCapacityStr] = useState(
    initialData?.capacity != null ? String(initialData.capacity) : ""
  );
  const [stageWidth, setStageWidth] = useState(
    initialData?.stageSize.width != null
      ? String(initialData.stageSize.width)
      : ""
  );
  const [stageDepth, setStageDepth] = useState(
    initialData?.stageSize.depth != null
      ? String(initialData.stageSize.depth)
      : ""
  );
  const [facilities, setFacilities] = useState<VenueMgmtFacility[]>(
    initialData?.facilities ?? createDefaultFacilities()
  );
  const [managerName, setManagerName] = useState(
    initialData?.contact.managerName ?? ""
  );
  const [phone, setPhone] = useState(initialData?.contact.phone ?? "");
  const [email, setEmail] = useState(initialData?.contact.email ?? "");
  const [feeStr, setFeeStr] = useState(
    initialData?.rental.fee != null ? String(initialData.rental.fee) : ""
  );
  const [bookingStatus, setBookingStatus] = useState<VenueMgmtBookingStatus>(
    initialData?.rental.bookingStatus ?? "미확정"
  );
  const [entryTime, setEntryTime] = useState(
    initialData?.rental.entryTime ?? ""
  );
  const [exitTime, setExitTime] = useState(initialData?.rental.exitTime ?? "");
  const [stageMemo, setStageMemo] = useState(initialData?.stageMemo ?? "");
  const [transit, setTransit] = useState(initialData?.access.transit ?? "");
  const [parking, setParking] = useState(initialData?.access.parking ?? "");

  const nameId = "venue-dialog-name";
  const addressId = "venue-dialog-address";
  const capacityId = "venue-dialog-capacity";
  const stageWidthId = "venue-dialog-stage-width";
  const stageDepthId = "venue-dialog-stage-depth";
  const managerNameId = "venue-dialog-manager-name";
  const phoneId = "venue-dialog-phone";
  const emailId = "venue-dialog-email";
  const feeId = "venue-dialog-fee";
  const bookingStatusId = "venue-dialog-booking-status";
  const entryTimeId = "venue-dialog-entry-time";
  const exitTimeId = "venue-dialog-exit-time";
  const stageMemoId = "venue-dialog-stage-memo";
  const transitId = "venue-dialog-transit";
  const parkingId = "venue-dialog-parking";

  function handleToggleFacility(facilityId: string) {
    setFacilities((prev) =>
      prev.map((f) =>
        f.id === facilityId ? { ...f, available: !f.available } : f
      )
    );
  }

  function handleClose() {
    onOpenChange(false);
  }

  function handleSubmit() {
    const success = onSubmit({
      name,
      address,
      capacity: capacityStr ? Number(capacityStr) : null,
      stageSize: {
        width: stageWidth ? Number(stageWidth) : null,
        depth: stageDepth ? Number(stageDepth) : null,
      },
      facilities,
      contact: { managerName, phone, email },
      rental: {
        fee: feeStr ? Number(feeStr) : null,
        bookingStatus,
        entryTime,
        exitTime,
      },
      stageMemo,
      access: { transit, parking },
    });
    if (success) handleClose();
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-lg max-h-[90vh] overflow-y-auto"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {isEdit ? "공연장 정보 수정" : "공연장 추가"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* 기본 정보 */}
          <fieldset className="space-y-2">
            <legend className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
              기본 정보
            </legend>
            <div className="space-y-2">
              <div className="space-y-1">
                <Label htmlFor={nameId} className="text-xs">
                  공연장 이름{" "}
                  <span className="text-red-500" aria-hidden="true">
                    *
                  </span>
                  <span className="sr-only">(필수)</span>
                </Label>
                <Input
                  id={nameId}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="예: 홍익대 대학로 아트센터"
                  className="h-8 text-xs"
                  aria-required="true"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={addressId} className="text-xs">
                  주소
                </Label>
                <Input
                  id={addressId}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="예: 서울특별시 마포구 와우산로 94"
                  className="h-8 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor={capacityId} className="text-xs">
                    수용 인원 (명)
                  </Label>
                  <Input
                    id={capacityId}
                    type="number"
                    min={0}
                    value={capacityStr}
                    onChange={(e) => setCapacityStr(e.target.value)}
                    placeholder="예: 300"
                    className="h-8 text-xs"
                  />
                </div>
                <fieldset className="space-y-1">
                  <legend className="text-xs text-gray-700">
                    무대 크기 (가로 x 세로 m)
                  </legend>
                  <div className="flex items-center gap-1">
                    <Label htmlFor={stageWidthId} className="sr-only">
                      무대 가로 (m)
                    </Label>
                    <Input
                      id={stageWidthId}
                      type="number"
                      min={0}
                      value={stageWidth}
                      onChange={(e) => setStageWidth(e.target.value)}
                      placeholder="가로"
                      className="h-8 text-xs"
                      aria-label="무대 가로 (m)"
                    />
                    <span className="text-xs text-gray-400" aria-hidden="true">
                      x
                    </span>
                    <Label htmlFor={stageDepthId} className="sr-only">
                      무대 세로 (m)
                    </Label>
                    <Input
                      id={stageDepthId}
                      type="number"
                      min={0}
                      value={stageDepth}
                      onChange={(e) => setStageDepth(e.target.value)}
                      placeholder="세로"
                      className="h-8 text-xs"
                      aria-label="무대 세로 (m)"
                    />
                  </div>
                </fieldset>
              </div>
            </div>
          </fieldset>

          {/* 시설 체크리스트 */}
          <fieldset className="space-y-2">
            <legend className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
              시설 체크리스트
            </legend>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2" role="group">
              {facilities.map((f) => (
                <div key={f.id} className="flex items-center justify-between">
                  <Label
                    className="text-xs cursor-pointer"
                    htmlFor={`fac-${f.id}`}
                  >
                    {f.name}
                  </Label>
                  <Switch
                    id={`fac-${f.id}`}
                    checked={f.available}
                    onCheckedChange={() => handleToggleFacility(f.id)}
                    className="scale-75"
                    aria-label={`${f.name} 사용 가능 여부`}
                  />
                </div>
              ))}
            </div>
          </fieldset>

          {/* 연락처 */}
          <fieldset className="space-y-2">
            <legend className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
              연락처
            </legend>
            <div className="grid grid-cols-1 gap-2">
              <div className="space-y-1">
                <Label htmlFor={managerNameId} className="text-xs">
                  담당자 이름
                </Label>
                <Input
                  id={managerNameId}
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  placeholder="예: 김담당"
                  className="h-8 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor={phoneId} className="text-xs">
                    전화번호
                  </Label>
                  <Input
                    id={phoneId}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="02-1234-5678"
                    className="h-8 text-xs"
                    type="tel"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={emailId} className="text-xs">
                    이메일
                  </Label>
                  <Input
                    id={emailId}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@venue.com"
                    className="h-8 text-xs"
                    type="email"
                  />
                </div>
              </div>
            </div>
          </fieldset>

          {/* 대관 정보 */}
          <fieldset className="space-y-2">
            <legend className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
              대관 정보
            </legend>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor={feeId} className="text-xs">
                  대관료 (원)
                </Label>
                <Input
                  id={feeId}
                  type="number"
                  min={0}
                  value={feeStr}
                  onChange={(e) => setFeeStr(e.target.value)}
                  placeholder="예: 500000"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={bookingStatusId} className="text-xs">
                  예약 상태
                </Label>
                <Select
                  value={bookingStatus}
                  onValueChange={(v) =>
                    setBookingStatus(v as VenueMgmtBookingStatus)
                  }
                >
                  <SelectTrigger
                    id={bookingStatusId}
                    className="h-8 text-xs"
                    aria-label="예약 상태 선택"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BOOKING_STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s} className="text-xs">
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor={entryTimeId} className="text-xs">
                  입장 시간
                </Label>
                <Input
                  id={entryTimeId}
                  type="time"
                  value={entryTime}
                  onChange={(e) => setEntryTime(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={exitTimeId} className="text-xs">
                  퇴장 시간
                </Label>
                <Input
                  id={exitTimeId}
                  type="time"
                  value={exitTime}
                  onChange={(e) => setExitTime(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </fieldset>

          {/* 무대 도면 메모 */}
          <div className="space-y-2">
            <Label htmlFor={stageMemoId} className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
              무대 도면 메모
            </Label>
            <Textarea
              id={stageMemoId}
              value={stageMemo}
              onChange={(e) => setStageMemo(e.target.value)}
              placeholder="무대 배치, 동선, 특이사항 등을 자유롭게 기록해주세요"
              className="text-xs resize-none"
              rows={3}
            />
          </div>

          {/* 접근 정보 */}
          <fieldset className="space-y-2">
            <legend className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
              접근 정보
            </legend>
            <div className="space-y-2">
              <div className="space-y-1">
                <Label htmlFor={transitId} className="text-xs">
                  대중교통 안내
                </Label>
                <Textarea
                  id={transitId}
                  value={transit}
                  onChange={(e) => setTransit(e.target.value)}
                  placeholder="예: 2호선 홍대입구역 1번 출구에서 도보 10분"
                  className="text-xs resize-none"
                  rows={2}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={parkingId} className="text-xs">
                  주차 안내
                </Label>
                <Textarea
                  id={parkingId}
                  value={parking}
                  onChange={(e) => setParking(e.target.value)}
                  placeholder="예: 건물 지하 1~2층 주차장, 2시간 무료"
                  className="text-xs resize-none"
                  rows={2}
                />
              </div>
            </div>
          </fieldset>
        </div>

        <DialogFooter className="gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={handleClose}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            {isEdit ? "수정" : "추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
