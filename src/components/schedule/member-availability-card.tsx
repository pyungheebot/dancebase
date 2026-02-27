"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Plus, X, Clock, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useMemberAvailability } from "@/hooks/use-member-availability";
import type { DayOfWeek, AvailabilitySlot } from "@/types";

// ============================================================
// 상수
// ============================================================

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: "mon", label: "월" },
  { key: "tue", label: "화" },
  { key: "wed", label: "수" },
  { key: "thu", label: "목" },
  { key: "fri", label: "금" },
  { key: "sat", label: "토" },
  { key: "sun", label: "일" },
];

// 30분 단위 시간 옵션 (00:00 ~ 23:30)
const TIME_OPTIONS: string[] = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, "0");
  const m = i % 2 === 0 ? "00" : "30";
  return `${h}:${m}`;
});

// ============================================================
// 서브 컴포넌트: 슬롯 추가 폼
// ============================================================

interface AddSlotFormProps {
  day: DayOfWeek;
  dayLabel: string;
  onAdd: (slot: AvailabilitySlot) => void;
  onCancel: () => void;
}

function AddSlotForm({ day, dayLabel, onAdd, onCancel }: AddSlotFormProps) {
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("11:00");

  function handleSubmit() {
    if (startTime >= endTime) {
      toast.error("종료 시간은 시작 시간보다 늦어야 합니다.");
      return;
    }
    onAdd({ day, startTime, endTime });
  }

  return (
    <div className="mt-2 rounded-md border border-blue-200 bg-blue-50 p-3 space-y-2">
      <p className="text-xs font-medium text-blue-700">{dayLabel}요일 가용 시간 추가</p>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <p className="text-[10px] text-muted-foreground mb-1">시작</p>
          <Select value={startTime} onValueChange={setStartTime}>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_OPTIONS.map((t) => (
                <SelectItem key={t} value={t} className="text-xs">
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span className="text-xs text-muted-foreground mt-4">~</span>
        <div className="flex-1">
          <p className="text-[10px] text-muted-foreground mb-1">종료</p>
          <Select value={endTime} onValueChange={setEndTime}>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_OPTIONS.map((t) => (
                <SelectItem key={t} value={t} className="text-xs">
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" className="h-7 text-xs flex-1" onClick={handleSubmit}>
          추가
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={onCancel}
        >
          취소
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// 서브 컴포넌트: 요일 행
// ============================================================

interface DayRowProps {
  day: DayOfWeek;
  label: string;
  slots: AvailabilitySlot[];
  onAdd: (slot: AvailabilitySlot) => void;
  onRemove: (slot: AvailabilitySlot) => void;
  isWeekend: boolean;
}

function DayRow({ day, label, slots, onAdd, onRemove, isWeekend }: DayRowProps) {
  const [showForm, setShowForm] = useState(false);

  function handleAdd(slot: AvailabilitySlot) {
    onAdd(slot);
    setShowForm(false);
  }

  return (
    <div className={`rounded-md p-2 ${isWeekend ? "bg-orange-50/60" : "bg-muted/30"}`}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <span
            className={`text-xs font-semibold w-5 text-center ${
              isWeekend ? "text-orange-600" : "text-foreground"
            }`}
          >
            {label}
          </span>
          {slots.length > 0 && (
            <Badge className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 border-blue-200">
              {slots.length}개
            </Badge>
          )}
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0"
          onClick={() => setShowForm((v) => !v)}
          title="가용 시간 추가"
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      {/* 등록된 슬롯 목록 */}
      {slots.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1">
          {slots.map((slot) => (
            <div
              key={`${slot.day}-${slot.startTime}-${slot.endTime}`}
              className="flex items-center gap-1 rounded bg-blue-500 text-white px-2 py-0.5 text-[10px]"
            >
              <Clock className="h-2.5 w-2.5" />
              <span>
                {slot.startTime} ~ {slot.endTime}
              </span>
              <button
                onClick={() => onRemove(slot)}
                className="ml-0.5 hover:text-blue-200 transition-colors"
                title="슬롯 제거"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {slots.length === 0 && !showForm && (
        <p className="text-[10px] text-muted-foreground">등록된 시간 없음</p>
      )}

      {showForm && (
        <AddSlotForm
          day={day}
          dayLabel={label}
          onAdd={handleAdd}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
}

// ============================================================
// 메인 컴포넌트
// ============================================================

interface MemberAvailabilityCardProps {
  groupId: string;
  userId: string;
  /** 카드 헤더에 표시할 멤버 이름 (선택) */
  memberName?: string;
  /** 초기 펼침 여부 */
  defaultOpen?: boolean;
}

export function MemberAvailabilityCard({
  groupId,
  userId,
  memberName,
  defaultOpen = false,
}: MemberAvailabilityCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  const { slots, addSlot, removeSlot, getSlotsByDay, clearAll } =
    useMemberAvailability(groupId, userId);

  function handleAdd(slot: AvailabilitySlot) {
    const result = addSlot(slot);
    if (result === "max_exceeded") {
      toast.error("슬롯은 최대 21개까지 등록할 수 있습니다.");
    } else if (result === "overlap") {
      toast.error("해당 시간대에 이미 겹치는 슬롯이 있습니다.");
    } else {
      toast.success("가용 시간이 등록되었습니다.");
    }
  }

  function handleRemove(slot: AvailabilitySlot) {
    removeSlot(slot);
    toast.success("가용 시간이 제거되었습니다.");
  }

  function handleClearAll() {
    clearAll();
    toast.success("모든 가용 시간이 초기화되었습니다.");
  }

  const totalSlots = slots.length;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      {/* 헤더 */}
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between cursor-pointer rounded-lg border bg-card px-4 py-3 hover:bg-muted/30 transition-colors select-none">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">
              {memberName ? `${memberName}의 가용 시간` : "내 가용 시간"}
            </span>
            {totalSlots > 0 && (
              <Badge className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 border-blue-200">
                {totalSlots}개 등록
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {totalSlots > 0 && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-[10px] px-2 text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearAll();
                }}
                title="전체 초기화"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                초기화
              </Button>
            )}
            {open ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </CollapsibleTrigger>

      {/* 본문 */}
      <CollapsibleContent>
        <div className="rounded-b-lg border border-t-0 bg-card px-4 pb-4 pt-3 space-y-2">
          <p className="text-[11px] text-muted-foreground">
            요일별로 가용한 시간대를 등록하세요. 슬롯은 최대 21개 (하루 3개 x 7일)까지
            등록할 수 있습니다.
          </p>

          {/* 7일 그리드 */}
          <div className="grid grid-cols-1 gap-1.5">
            {DAYS.map(({ key, label }) => (
              <DayRow
                key={key}
                day={key}
                label={label}
                slots={getSlotsByDay(key)}
                onAdd={handleAdd}
                onRemove={handleRemove}
                isWeekend={key === "sat" || key === "sun"}
              />
            ))}
          </div>

          {totalSlots === 0 && (
            <div className="text-center py-4 text-xs text-muted-foreground">
              아직 등록된 가용 시간이 없습니다.
              <br />각 요일의 + 버튼을 눌러 시간대를 추가하세요.
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
