"use client";

import { useMemo } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateRecurringDates, formatKoreanDate, type RecurringPattern } from "@/lib/recurring-schedule";

const PREVIEW_LIMIT = 10;

export type RecurringScheduleValue = {
  enabled: boolean;
  pattern: RecurringPattern;
  endDate: string;
};

type RecurringScheduleFormProps = {
  value: RecurringScheduleValue;
  onChange: (value: RecurringScheduleValue) => void;
  /** 시작일 (yyyy-MM-dd) — 부모 폼에서 설정된 날짜 */
  startDate: string;
};

/**
 * 반복 일정 설정 서브컴포넌트.
 * 기존 일정 생성 폼의 날짜 섹션에 삽입하여 사용합니다.
 */
export function RecurringScheduleForm({
  value,
  onChange,
  startDate,
}: RecurringScheduleFormProps) {
  const previewDates = useMemo(() => {
    if (!value.enabled || !startDate || !value.endDate) return [];
    return generateRecurringDates(startDate, value.endDate, value.pattern);
  }, [value.enabled, value.pattern, startDate, value.endDate]);

  const hiddenCount = previewDates.length > PREVIEW_LIMIT
    ? previewDates.length - PREVIEW_LIMIT
    : 0;

  const visibleDates = previewDates.slice(0, PREVIEW_LIMIT);

  return (
    <div className="space-y-3">
      {/* 반복 활성화 토글 */}
      <div className="flex items-center justify-between">
        <Label htmlFor="recurring-toggle" className="text-xs font-medium cursor-pointer">
          반복 일정
        </Label>
        <Switch
          id="recurring-toggle"
          checked={value.enabled}
          onCheckedChange={(checked) =>
            onChange({ ...value, enabled: checked })
          }
        />
      </div>

      {value.enabled && (
        <div className="space-y-3 rounded-md border p-3 bg-muted/30">
          {/* 반복 패턴 선택 */}
          <div className="space-y-1">
            <Label className="text-xs">반복 주기</Label>
            <Select
              value={value.pattern}
              onValueChange={(v) =>
                onChange({ ...value, pattern: v as RecurringPattern })
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">매주</SelectItem>
                <SelectItem value="biweekly">격주</SelectItem>
                <SelectItem value="monthly">매월</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 종료일 */}
          <div className="space-y-1">
            <Label htmlFor="recurring-end-date" className="text-xs">
              종료일 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="recurring-end-date"
              type="date"
              value={value.endDate}
              min={startDate || undefined}
              onChange={(e) =>
                onChange({ ...value, endDate: e.target.value })
              }
              className="h-8 text-xs"
            />
          </div>

          {/* 미리보기 */}
          {previewDates.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                생성 예정 일정 ({previewDates.length}개)
              </p>
              <ul className="space-y-0.5">
                {visibleDates.map((d) => (
                  <li
                    key={d}
                    className="text-[11px] text-foreground flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    {formatKoreanDate(d)}
                  </li>
                ))}
                {hiddenCount > 0 && (
                  <li className="text-[11px] text-muted-foreground pl-3">
                    외 {hiddenCount}건
                  </li>
                )}
              </ul>
            </div>
          )}

          {value.endDate && startDate && previewDates.length === 0 && (
            <p className="text-[11px] text-muted-foreground">
              해당 기간에 생성될 일정이 없습니다.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
