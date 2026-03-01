"use client";

import { useState, useEffect, startTransition } from "react";
import { Clock } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";

interface BoardScheduleInputProps {
  /** 현재 예약 발행 시각 (ISO 문자열 또는 null) */
  value: string | null;
  /** 값이 변경될 때 호출. null이면 예약 해제(즉시 발행) */
  onChange: (publishedAt: string | null) => void;
}

/**
 * 예약 발행 입력 컴포넌트.
 * Switch로 활성화/비활성화하고, 활성화 시 날짜+시간 input을 표시한다.
 * 과거 시간 선택을 방지한다.
 */
export function BoardScheduleInput({ value, onChange }: BoardScheduleInputProps) {
  const [enabled, setEnabled] = useState<boolean>(value !== null);
  // datetime-local 입력값 (YYYY-MM-DDTHH:mm 형식)
  const [localValue, setLocalValue] = useState<string>(() => {
    if (!value) return "";
    // ISO → datetime-local 형식 변환 (로컬 타임존 기준)
    const d = new Date(value);
    return toDatetimeLocal(d);
  });

  // 외부 value가 변경될 때 내부 상태 동기화
  useEffect(() => {
    if (value === null) {
      startTransition(() => {
        setEnabled(false);
        setLocalValue("");
      });
    } else {
      const local = toDatetimeLocal(new Date(value));
      startTransition(() => {
        setEnabled(true);
        setLocalValue(local);
      });
    }
  }, [value]);

  const handleToggle = (checked: boolean) => {
    setEnabled(checked);
    if (checked) {
      // 기본값: 현재 시간 + 1시간 (분 단위 올림)
      const defaultDate = new Date();
      defaultDate.setHours(defaultDate.getHours() + 1);
      defaultDate.setMinutes(0, 0, 0);
      const local = toDatetimeLocal(defaultDate);
      setLocalValue(local);
      onChange(defaultDate.toISOString());
    } else {
      setLocalValue("");
      onChange(null);
    }
  };

  const handleDateChange = (val: string) => {
    setLocalValue(val);
    if (!val) {
      onChange(null);
      return;
    }

    const selected = new Date(val);
    const now = new Date();

    // 과거 시간이면 현재 시간 + 1분으로 보정
    if (selected <= now) {
      const corrected = new Date(now.getTime() + 60 * 1000);
      setLocalValue(toDatetimeLocal(corrected));
      onChange(corrected.toISOString());
      return;
    }

    onChange(selected.toISOString());
  };

  // 현재 시간 이후만 선택 가능하도록 min 값 계산 (마운트 시 1회)
  const [minDatetime] = useState(() => toDatetimeLocal(new Date(Date.now() + 60 * 1000)));

  return (
    <div className="space-y-2 rounded-lg border px-3 py-2.5">
      {/* 토글 행 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
          <Label htmlFor="schedule-toggle" className="text-xs cursor-pointer select-none">
            예약 발행
          </Label>
        </div>
        <Switch
          id="schedule-toggle"
          checked={enabled}
          onCheckedChange={handleToggle}
          aria-label="예약 발행 활성화"
        />
      </div>

      {/* 날짜/시간 선택 */}
      {enabled && (
        <div className="space-y-1">
          <Label htmlFor="schedule-datetime" className="text-[11px] text-muted-foreground">
            발행 시각
          </Label>
          <Input
            id="schedule-datetime"
            type="datetime-local"
            className="h-7 text-xs"
            value={localValue}
            min={minDatetime}
            onChange={(e) => handleDateChange(e.target.value)}
            aria-label="예약 발행 날짜 및 시간 선택"
          />
          <p className="text-[10px] text-muted-foreground">
            선택한 시각 이후에 멤버에게 공개됩니다.
          </p>
        </div>
      )}
    </div>
  );
}

/** Date를 datetime-local input 형식 (YYYY-MM-DDTHH:mm)으로 변환 */
function toDatetimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}
