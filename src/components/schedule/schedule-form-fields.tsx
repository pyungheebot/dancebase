"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddressSearch } from "./address-search";
import { LocationCombobox } from "./location-combobox";
import type { AttendanceMethod } from "@/types";
import type { ReactNode } from "react";

export type ScheduleFieldValues = {
  title: string;
  description: string;
  location: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  attendanceMethod: AttendanceMethod;
  lateThresholdTime: string;
  attendanceDeadlineTime: string;
  requireCheckout: boolean;
  startTime: string;
  endTime: string;
  maxAttendees: string;
};

export type ScheduleFormFieldErrors = {
  title?: string;
  timeRange?: string;
};

type ScheduleFormFieldsProps = {
  values: ScheduleFieldValues;
  onChange: (values: Partial<ScheduleFieldValues>) => void;
  /** 날짜/반복 설정 영역 — 등록과 수정이 다르므로 외부에서 주입 */
  dateSection: ReactNode;
  /** 장소 자동완성을 위한 그룹 ID */
  groupId: string;
  prefix?: string;
  errors?: ScheduleFormFieldErrors;
  onBlurTitle?: () => void;
  onBlurTime?: () => void;
};

export function ScheduleFormFields({
  values,
  onChange,
  dateSection,
  groupId,
  prefix = "",
  errors = {},
  onBlurTitle,
  onBlurTime,
}: ScheduleFormFieldsProps) {
  const p = (id: string) => prefix ? `${prefix}-${id}` : id;

  return (
    <>
      {/* 제목 */}
      <div className="space-y-1">
        <Label htmlFor={p("title")} className="text-xs">
          제목 <span className="text-destructive">*</span>
        </Label>
        <Input
          id={p("title")}
          placeholder="일정 제목"
          value={values.title}
          onChange={(e) => onChange({ title: e.target.value })}
          onBlur={onBlurTitle}
          required
          maxLength={150}
          className={errors.title ? "border-destructive focus-visible:ring-destructive" : ""}
        />
        {errors.title && (
          <p className="text-xs text-destructive">{errors.title}</p>
        )}
      </div>

      {/* 설명 */}
      <div className="space-y-1">
        <Label htmlFor={p("description")} className="text-xs">설명</Label>
        <Textarea
          id={p("description")}
          placeholder="설명 (선택사항)"
          value={values.description}
          onChange={(e) => onChange({ description: e.target.value })}
          maxLength={2000}
        />
      </div>

      {/* 장소 이름 */}
      <div className="space-y-1">
        <Label htmlFor={p("location")} className="text-xs">장소 이름</Label>
        <LocationCombobox
          id={p("location")}
          groupId={groupId}
          value={values.location}
          onChange={(val) => onChange({ location: val })}
        />
      </div>

      {/* 주소 검색 */}
      <div className="space-y-1">
        <Label className="text-xs">주소 검색</Label>
        <AddressSearch
          value={values.address}
          onSelect={(addr, lat, lng) => {
            onChange({ address: addr, latitude: lat, longitude: lng });
          }}
          onClear={() => {
            onChange({
              address: "",
              latitude: null,
              longitude: null,
              ...(values.attendanceMethod === "location" ? { attendanceMethod: "admin" as const } : {}),
            });
          }}
        />
      </div>

      {/* 출석 체크 방식 */}
      <div className="space-y-1">
        <Label className="text-xs">출석 체크 방식</Label>
        <Select
          value={values.attendanceMethod}
          onValueChange={(v) => onChange({ attendanceMethod: v as AttendanceMethod })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">관리자 입력</SelectItem>
            <SelectItem value="location" disabled={!values.address}>
              참석자 위치기반{!values.address ? " (주소 필수)" : ""}
            </SelectItem>
            <SelectItem value="none">안함</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 출석 세부 설정 */}
      {values.attendanceMethod !== "none" && (
        <div className="space-y-2 rounded border p-2.5">
          <p className="text-[11px] font-medium text-muted-foreground">출석 세부 설정</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor={p("lateThreshold")} className="text-xs">출석인정시간</Label>
              <Input
                id={p("lateThreshold")}
                type="time"
                value={values.lateThresholdTime}
                onChange={(e) => onChange({ lateThresholdTime: e.target.value })}
              />
              <p className="text-[10px] text-muted-foreground">이후 체크인 시 지각 처리</p>
            </div>
            <div className="space-y-1">
              <Label htmlFor={p("attendanceDeadline")} className="text-xs">출석마감시간</Label>
              <Input
                id={p("attendanceDeadline")}
                type="time"
                value={values.attendanceDeadlineTime}
                onChange={(e) => onChange({ attendanceDeadlineTime: e.target.value })}
              />
              <p className="text-[10px] text-muted-foreground">이후 출석 불가</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id={p("requireCheckout")}
              checked={values.requireCheckout}
              onCheckedChange={(checked) => onChange({ requireCheckout: checked === true })}
            />
            <Label htmlFor={p("requireCheckout")} className="font-normal cursor-pointer text-xs">
              종료 시 체크아웃 필수
            </Label>
          </div>
        </div>
      )}

      {/* 날짜/반복 섹션 (외부에서 주입) */}
      {dateSection}

      {/* 시작/종료 시간 */}
      <div className="space-y-1">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor={p("startTime")} className="text-xs">
              시작 시간 <span className="text-destructive">*</span>
            </Label>
            <Input
              id={p("startTime")}
              type="time"
              value={values.startTime}
              onChange={(e) => onChange({ startTime: e.target.value })}
              onBlur={onBlurTime}
              required
              className={errors.timeRange ? "border-destructive focus-visible:ring-destructive" : ""}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={p("endTime")} className="text-xs">
              종료 시간 <span className="text-destructive">*</span>
            </Label>
            <Input
              id={p("endTime")}
              type="time"
              value={values.endTime}
              onChange={(e) => onChange({ endTime: e.target.value })}
              onBlur={onBlurTime}
              required
              className={errors.timeRange ? "border-destructive focus-visible:ring-destructive" : ""}
            />
          </div>
        </div>
        {errors.timeRange && (
          <p className="text-xs text-destructive">{errors.timeRange}</p>
        )}
      </div>

      {/* 정원 설정 */}
      <div className="space-y-1">
        <Label htmlFor={p("maxAttendees")} className="text-xs">정원 (선택사항)</Label>
        <Input
          id={p("maxAttendees")}
          type="number"
          min={1}
          placeholder="제한 없음"
          value={values.maxAttendees}
          onChange={(e) => onChange({ maxAttendees: e.target.value })}
        />
        <p className="text-[10px] text-muted-foreground">정원 초과 시 대기 명단 등록 가능</p>
      </div>
    </>
  );
}
