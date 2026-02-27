"use client";

import { useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  AlertTriangle,
  Clock,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  useWeeklyTimetable,
  SLOT_TYPE_COLORS,
  SLOT_TYPE_LABELS,
} from "@/hooks/use-weekly-timetable";
import type { TimetableDay, TimetableSlot, TimetableSlotType } from "@/types";

// ─── 상수 ────────────────────────────────────────────────────

const DAYS: { key: TimetableDay; label: string }[] = [
  { key: "mon", label: "월" },
  { key: "tue", label: "화" },
  { key: "wed", label: "수" },
  { key: "thu", label: "목" },
  { key: "fri", label: "금" },
  { key: "sat", label: "토" },
  { key: "sun", label: "일" },
];

const SLOT_TYPES = Object.keys(SLOT_TYPE_LABELS) as TimetableSlotType[];

// ─── 슬롯 추가/수정 폼 ────────────────────────────────────────

interface SlotFormProps {
  initialDay?: TimetableDay;
  onSubmit: (data: Omit<TimetableSlot, "id">) => void;
  onClose: () => void;
  conflictSlot: TimetableSlot | null;
}

function SlotForm({ initialDay, onSubmit, onClose, conflictSlot }: SlotFormProps) {
  const [day, setDay] = useState<TimetableDay>(initialDay ?? "mon");
  const [startTime, setStartTime] = useState("19:00");
  const [endTime, setEndTime] = useState("21:00");
  const [type, setType] = useState<TimetableSlotType>("practice");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [color, setColor] = useState(SLOT_TYPE_COLORS.practice);
  const [note, setNote] = useState("");

  // 슬롯 타입 변경 시 색상 자동 업데이트
  function handleTypeChange(newType: TimetableSlotType) {
    setType(newType);
    setColor(SLOT_TYPE_COLORS[newType]);
  }

  function handleSubmit() {
    if (!title.trim()) {
      toast.error("제목을 입력해주세요.");
      return;
    }
    if (!startTime || !endTime) {
      toast.error("시간을 입력해주세요.");
      return;
    }
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    if (sh * 60 + sm >= eh * 60 + em) {
      toast.error("종료 시간은 시작 시간보다 늦어야 합니다.");
      return;
    }
    onSubmit({
      day,
      startTime,
      endTime,
      type,
      title: title.trim(),
      location: location.trim(),
      color,
      note: note.trim(),
    });
  }

  return (
    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 space-y-2">
      <p className="text-xs font-medium text-gray-600">새 슬롯 추가</p>

      {/* 충돌 경고 */}
      {conflictSlot && (
        <div className="flex items-start gap-1.5 rounded-md bg-amber-50 border border-amber-200 px-2.5 py-2">
          <AlertTriangle className="h-3 w-3 shrink-0 text-amber-500 mt-0.5" />
          <p className="text-[11px] text-amber-700">
            <span className="font-medium">{conflictSlot.title}</span>
            {" "}({conflictSlot.startTime}~{conflictSlot.endTime})과 시간이 겹칩니다.
          </p>
        </div>
      )}

      {/* 요일 선택 */}
      <div className="flex gap-1">
        {DAYS.map((d) => (
          <button
            key={d.key}
            type="button"
            onClick={() => setDay(d.key)}
            className={`flex-1 rounded py-1 text-[11px] font-medium transition-colors ${
              day === d.key
                ? "bg-gray-800 text-white"
                : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-100"
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* 시작/종료 시간 */}
      <div className="flex items-center gap-2">
        <input
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="flex-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-300"
          title="시작 시간"
        />
        <span className="text-xs text-gray-400">~</span>
        <input
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          className="flex-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-300"
          title="종료 시간"
        />
      </div>

      {/* 유형 선택 */}
      <div className="flex flex-wrap gap-1">
        {SLOT_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => handleTypeChange(t)}
            className={`rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors ${
              type === t
                ? "text-white"
                : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-100"
            }`}
            style={type === t ? { backgroundColor: SLOT_TYPE_COLORS[t] } : {}}
          >
            {SLOT_TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {/* 제목 */}
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value.slice(0, 30))}
        placeholder="제목 (예: 전체 연습)"
        className="h-8 text-xs"
      />

      {/* 장소 + 색상 */}
      <div className="flex gap-2">
        <Input
          value={location}
          onChange={(e) => setLocation(e.target.value.slice(0, 30))}
          placeholder="장소 (선택)"
          className="h-8 flex-1 text-xs"
        />
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] text-gray-500">색상</span>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-7 w-8 cursor-pointer rounded border border-gray-200 p-0.5"
            title="슬롯 색상"
          />
        </div>
      </div>

      {/* 메모 */}
      <Input
        value={note}
        onChange={(e) => setNote(e.target.value.slice(0, 100))}
        placeholder="메모 (선택)"
        className="h-8 text-xs"
      />

      {/* 버튼 */}
      <div className="flex gap-2">
        <Button size="sm" className="h-7 flex-1 text-xs" onClick={handleSubmit}>
          <Plus className="mr-1 h-3 w-3" />
          추가
        </Button>
        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onClose}>
          취소
        </Button>
      </div>
    </div>
  );
}

// ─── 슬롯 카드 ───────────────────────────────────────────────

interface SlotCardProps {
  slot: TimetableSlot;
  onDelete: () => void;
}

function SlotCard({ slot, onDelete }: SlotCardProps) {
  return (
    <div
      className="group relative rounded-md px-2 py-1.5 text-white"
      style={{ backgroundColor: slot.color }}
    >
      {/* 삭제 버튼 */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute right-1 top-1 hidden rounded p-0.5 hover:bg-black/20 group-hover:flex"
        title="삭제"
      >
        <Trash2 className="h-2.5 w-2.5" />
      </button>

      {/* 시간 */}
      <div className="flex items-center gap-0.5 text-[10px] opacity-90">
        <Clock className="h-2.5 w-2.5" />
        <span>{slot.startTime}~{slot.endTime}</span>
      </div>

      {/* 제목 */}
      <p className="mt-0.5 text-[11px] font-semibold leading-tight truncate pr-4">
        {slot.title}
      </p>

      {/* 장소 */}
      {slot.location && (
        <div className="mt-0.5 flex items-center gap-0.5 text-[10px] opacity-80">
          <MapPin className="h-2.5 w-2.5 shrink-0" />
          <span className="truncate">{slot.location}</span>
        </div>
      )}
    </div>
  );
}

// ─── 범례 ────────────────────────────────────────────────────

function Legend() {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1">
      {SLOT_TYPES.map((type) => (
        <div key={type} className="flex items-center gap-1">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: SLOT_TYPE_COLORS[type] }}
          />
          <span className="text-[10px] text-gray-500">{SLOT_TYPE_LABELS[type]}</span>
        </div>
      ))}
    </div>
  );
}

// ─── 메인 카드 ────────────────────────────────────────────────

interface WeeklyTimetableCardProps {
  groupId: string;
}

export function WeeklyTimetableCard({ groupId }: WeeklyTimetableCardProps) {
  const [open, setOpen] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [conflictSlot, setConflictSlot] = useState<TimetableSlot | null>(null);

  const { slots, addSlot, deleteSlot, getSlotsByDay } = useWeeklyTimetable(groupId);

  function handleAdd(data: Omit<TimetableSlot, "id">) {
    const result = addSlot(data);
    if (result.ok) {
      toast.success("슬롯이 추가되었습니다.");
      setShowForm(false);
      setConflictSlot(null);
    } else if (result.conflict) {
      setConflictSlot(result.conflict);
      toast.error(`시간 충돌: "${result.conflict.title}"과 겹칩니다.`);
    } else {
      toast.error("슬롯 추가에 실패했습니다.");
    }
  }

  function handleDelete(id: string) {
    const ok = deleteSlot(id);
    if (ok) {
      toast.success("슬롯이 삭제되었습니다.");
    } else {
      toast.error("슬롯 삭제에 실패했습니다.");
    }
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      {/* 헤더 */}
      <div className="flex items-center justify-between rounded-t-lg border border-b-0 border-gray-200 bg-white px-4 py-2.5">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-indigo-500" />
          <span className="text-sm font-semibold text-gray-800">주간 시간표</span>
          {slots.length > 0 && (
            <Badge className="bg-indigo-100 text-[10px] px-1.5 py-0 text-indigo-600 hover:bg-indigo-100">
              {slots.length}개
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-xs text-gray-500"
            onClick={() => {
              setShowForm((prev) => !prev);
              setConflictSlot(null);
            }}
          >
            <Plus className="h-3 w-3" />
            추가
          </Button>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              {open ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </Button>
          </CollapsibleTrigger>
        </div>
      </div>

      {/* 본문 */}
      <CollapsibleContent>
        <div className="rounded-b-lg border border-gray-200 bg-white p-4 space-y-4">
          {/* 슬롯 추가 폼 */}
          {showForm && (
            <SlotForm
              onSubmit={handleAdd}
              onClose={() => {
                setShowForm(false);
                setConflictSlot(null);
              }}
              conflictSlot={conflictSlot}
            />
          )}

          {/* 빈 상태 */}
          {slots.length === 0 && !showForm && (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-gray-400">
              <CalendarDays className="h-8 w-8 opacity-30" />
              <p className="text-xs">등록된 시간표가 없습니다.</p>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => setShowForm(true)}
              >
                <Plus className="mr-1 h-3 w-3" />
                첫 슬롯 추가
              </Button>
            </div>
          )}

          {/* 7열 그리드 시간표 */}
          {slots.length > 0 && (
            <>
              {/* 요일 헤더 */}
              <div className="grid grid-cols-7 gap-1.5">
                {DAYS.map((d) => {
                  const daySlotsCount = getSlotsByDay(d.key).length;
                  return (
                    <div key={d.key} className="text-center">
                      <span
                        className={`text-[11px] font-semibold ${
                          d.key === "sat"
                            ? "text-blue-500"
                            : d.key === "sun"
                            ? "text-red-500"
                            : "text-gray-600"
                        }`}
                      >
                        {d.label}
                      </span>
                      {daySlotsCount > 0 && (
                        <span className="ml-0.5 text-[9px] text-gray-400">
                          ({daySlotsCount})
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* 슬롯 그리드 */}
              <div className="grid grid-cols-7 gap-1.5 items-start">
                {DAYS.map((d) => {
                  const daySlots = getSlotsByDay(d.key);
                  return (
                    <div key={d.key} className="flex flex-col gap-1">
                      {daySlots.length === 0 ? (
                        <div className="rounded-md border border-dashed border-gray-100 py-4" />
                      ) : (
                        daySlots.map((slot) => (
                          <SlotCard
                            key={slot.id}
                            slot={slot}
                            onDelete={() => handleDelete(slot.id)}
                          />
                        ))
                      )}
                    </div>
                  );
                })}
              </div>

              <Separator />

              {/* 범례 */}
              <Legend />
            </>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
