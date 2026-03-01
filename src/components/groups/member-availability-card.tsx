"use client";

import { useState, KeyboardEvent } from "react";
import {
  useMemberAvailabilitySchedule,
  AVAILABILITY_DAY_LABELS,
  AVAILABILITY_DAY_ORDER,

  AVAILABILITY_TIME_SLOTS,
} from "@/hooks/use-member-availability-schedule";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CalendarClock,
  ChevronDown,
  ChevronUp,
  Plus,

  UserPlus,
  X,
  Users,
  Clock,
  Pencil,

} from "lucide-react";
import { toast } from "sonner";
import type {
  MemberAvailabilityDay,
  MemberAvailabilityLevel,
  MemberAvailabilitySlot,
  MemberAvailabilityEntry,
  MemberAvailabilityOverlap,
} from "@/types";

// ============================================
// 상수 & 스타일 헬퍼
// ============================================

const LEVEL_CONFIG: Record<
  MemberAvailabilityLevel,
  { label: string; bg: string; text: string; badgeClass: string }
> = {
  available: {
    label: "가능",
    bg: "bg-green-100",
    text: "text-green-700",
    badgeClass: "bg-green-100 text-green-700 border-green-200",
  },
  difficult: {
    label: "어려움",
    bg: "bg-yellow-100",
    text: "text-yellow-700",
    badgeClass: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  unavailable: {
    label: "불가",
    bg: "bg-red-100",
    text: "text-red-600",
    badgeClass: "bg-red-100 text-red-600 border-red-200",
  },
};

// 겹침 인원 수에 따른 배경색
function overlapBg(count: number): string {
  if (count >= 5) return "bg-green-500";
  if (count >= 4) return "bg-green-400";
  if (count >= 3) return "bg-green-300";
  if (count >= 2) return "bg-green-200";
  return "bg-green-100";
}

// ============================================
// 하위 컴포넌트: 멤버 행 (요일별 슬롯 요약)
// ============================================

function MemberRow({
  entry,
  onOpenDetail,
  onRemove,
}: {
  entry: MemberAvailabilityEntry;
  onOpenDetail: () => void;
  onRemove: () => void;
}) {
  const totalSlots = Object.values(entry.slots).reduce(
    (acc, arr) => acc + (arr?.length ?? 0),
    0
  );

  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/40 transition-colors">
      <span className="text-sm font-medium w-20 truncate" title={entry.memberName}>
        {entry.memberName}
      </span>
      <div className="flex gap-1 flex-wrap flex-1">
        {AVAILABILITY_DAY_ORDER.map((day) => {
          const slots = entry.slots[day] ?? [];
          if (slots.length === 0) return null;
          const hasAvailable = slots.some((s) => s.level === "available");
          const hasDifficult =
            !hasAvailable && slots.some((s) => s.level === "difficult");
          const level: MemberAvailabilityLevel = hasAvailable
            ? "available"
            : hasDifficult
            ? "difficult"
            : "unavailable";
          const cfg = LEVEL_CONFIG[level];
          return (
            <span
              key={day}
              className={`text-[10px] px-1 py-0.5 rounded font-medium ${cfg.bg} ${cfg.text}`}
            >
              {AVAILABILITY_DAY_LABELS[day]}
            </span>
          );
        })}
        {totalSlots === 0 && (
          <span className="text-[11px] text-muted-foreground">미설정</span>
        )}
      </div>
      <div className="flex items-center gap-1 ml-auto">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={onOpenDetail}
        >
          <Pencil className="h-3 w-3 mr-1" />
          편집
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
          onClick={onRemove}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// ============================================
// 하위 컴포넌트: 멤버 상세 편집 다이얼로그
// ============================================

function MemberDetailDialog({
  open,
  entry,
  onClose,
  onUpsertSlot,
  onRemoveSlot,
  onClearDay,
  onUpdateNotes,
}: {
  open: boolean;
  entry: MemberAvailabilityEntry | null;
  onClose: () => void;
  onUpsertSlot: (
    memberId: string,
    day: MemberAvailabilityDay,
    slot: MemberAvailabilitySlot
  ) => void;
  onRemoveSlot: (
    memberId: string,
    day: MemberAvailabilityDay,
    startTime: string
  ) => void;
  onClearDay: (memberId: string, day: MemberAvailabilityDay) => void;
  onUpdateNotes: (memberId: string, notes: string) => void;
}) {
  const [selectedDay, setSelectedDay] =
    useState<MemberAvailabilityDay>("mon");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("12:00");
  const [level, setLevel] = useState<MemberAvailabilityLevel>("available");
  const [slotNote, setSlotNote] = useState("");
  const [notes, setNotes] = useState(entry?.notes ?? "");

  // notes 동기화
  const handleNotesBlur = () => {
    if (!entry) return;
    onUpdateNotes(entry.id, notes);
  };

  const handleAddSlot = () => {
    if (!entry) return;
    if (startTime >= endTime) {
      toast.error("종료 시각은 시작 시각보다 늦어야 합니다.");
      return;
    }
    onUpsertSlot(entry.id, selectedDay, {
      startTime,
      endTime,
      level,
      note: slotNote.trim() || undefined,
    });
    setSlotNote("");
    toast.success("시간대가 추가되었습니다.");
  };

  if (!entry) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4 text-primary" />
            {entry.memberName} &ndash; 가용 시간 편집
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 슬롯 추가 영역 */}
          <div className="rounded-lg border p-3 space-y-3 bg-muted/30">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              시간대 추가
            </p>
            <div className="grid grid-cols-2 gap-2">
              {/* 요일 */}
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground mb-1">요일</p>
                <div className="flex gap-1 flex-wrap">
                  {AVAILABILITY_DAY_ORDER.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setSelectedDay(d)}
                      className={`text-xs px-2 py-1 rounded font-medium transition-colors ${
                        selectedDay === d
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      {AVAILABILITY_DAY_LABELS[d]}
                    </button>
                  ))}
                </div>
              </div>
              {/* 시작/종료 시각 */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">시작</p>
                <Select value={startTime} onValueChange={setStartTime}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABILITY_TIME_SLOTS.map((t) => (
                      <SelectItem key={t} value={t} className="text-xs">
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">종료</p>
                <Select value={endTime} onValueChange={setEndTime}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABILITY_TIME_SLOTS.filter((t) => t > startTime).map(
                      (t) => (
                        <SelectItem key={t} value={t} className="text-xs">
                          {t}
                        </SelectItem>
                      )
                    )}
                    <SelectItem value="24:00" className="text-xs">
                      24:00
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* 가용 수준 */}
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground mb-1">가용 수준</p>
                <div className="flex gap-2">
                  {(
                    Object.entries(LEVEL_CONFIG) as [
                      MemberAvailabilityLevel,
                      (typeof LEVEL_CONFIG)[MemberAvailabilityLevel]
                    ][]
                  ).map(([lv, cfg]) => (
                    <button
                      key={lv}
                      type="button"
                      onClick={() => setLevel(lv)}
                      className={`text-xs px-3 py-1.5 rounded font-medium border transition-colors ${
                        level === lv
                          ? cfg.badgeClass + " border-2"
                          : "bg-muted border-transparent hover:bg-muted/60"
                      }`}
                    >
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* 슬롯 메모 */}
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground mb-1">메모 (선택)</p>
                <Input
                  value={slotNote}
                  onChange={(e) => setSlotNote(e.target.value)}
                  placeholder="예: 점심 식사 후 가능"
                  className="h-8 text-xs"
                />
              </div>
            </div>
            <Button
              size="sm"
              className="h-7 text-xs w-full"
              onClick={handleAddSlot}
            >
              <Plus className="h-3 w-3 mr-1" />
              시간대 추가
            </Button>
          </div>

          {/* 등록된 슬롯 목록 */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              등록된 시간대
            </p>
            {AVAILABILITY_DAY_ORDER.map((day) => {
              const slots = entry.slots[day] ?? [];
              if (slots.length === 0) return null;
              return (
                <div key={day} className="rounded border p-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">
                      {AVAILABILITY_DAY_LABELS[day]}요일
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 px-1.5 text-[10px] text-red-500 hover:text-red-600"
                      onClick={() => onClearDay(entry.id, day)}
                    >
                      전체삭제
                    </Button>
                  </div>
                  {slots.map((slot) => {
                    const cfg = LEVEL_CONFIG[slot.level];
                    return (
                      <div
                        key={slot.startTime}
                        className={`flex items-center gap-2 text-xs px-2 py-1 rounded ${cfg.bg}`}
                      >
                        <span className={`font-medium ${cfg.text}`}>
                          {slot.startTime} ~ {slot.endTime}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1 py-0 ${cfg.badgeClass}`}
                        >
                          {cfg.label}
                        </Badge>
                        {slot.note && (
                          <span className="text-muted-foreground truncate flex-1">
                            {slot.note}
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 ml-auto text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() =>
                            onRemoveSlot(entry.id, day, slot.startTime)
                          }
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              );
            })}
            {Object.keys(entry.slots).length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">
                등록된 시간대가 없습니다.
              </p>
            )}
          </div>

          {/* 전반적인 메모 */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
              멤버 메모
            </p>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleNotesBlur}
              placeholder="예: 주로 오후만 가능, 토요일은 항상 참석 가능"
              className="text-xs resize-none"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onClose}>
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 하위 컴포넌트: 겹치는 시간대 패널
// ============================================

function OverlapPanel({
  overlaps,
}: {
  overlaps: MemberAvailabilityOverlap[];
}) {
  const [open, setOpen] = useState(false);

  if (overlaps.length === 0) return null;

  // 요일별로 그룹화
  const byDay: Partial<Record<MemberAvailabilityDay, MemberAvailabilityOverlap[]>> = {};
  for (const o of overlaps) {
    if (!byDay[o.day]) byDay[o.day] = [];
    byDay[o.day]!.push(o);
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs w-full justify-between"
        >
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3 text-green-600" />
            겹치는 시간대 보기 ({overlaps.length}건)
          </span>
          {open ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 space-y-3">
          {AVAILABILITY_DAY_ORDER.map((day) => {
            const dayOverlaps = byDay[day];
            if (!dayOverlaps || dayOverlaps.length === 0) return null;
            return (
              <div key={day}>
                <p className="text-xs font-semibold text-muted-foreground mb-1">
                  {AVAILABILITY_DAY_LABELS[day]}요일
                </p>
                <div className="space-y-1">
                  {dayOverlaps.map((o, idx) => {
                    const totalCount =
                      o.availableMembers.length + o.difficultMembers.length;
                    return (
                      <TooltipProvider key={idx}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs cursor-default ${overlapBg(
                                o.availableMembers.length
                              )}`}
                            >
                              <span className="font-medium text-green-800">
                                {o.startTime} ~ {o.endTime}
                              </span>
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1 py-0 bg-card/60 border-green-300 text-green-700"
                              >
                                {totalCount}명
                              </Badge>
                              {o.availableMembers.length > 0 && (
                                <span className="text-green-700 truncate">
                                  가능: {o.availableMembers.join(", ")}
                                </span>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs max-w-xs">
                            <div className="space-y-1">
                              {o.availableMembers.length > 0 && (
                                <p>
                                  <span className="font-semibold text-green-600">가능:</span>{" "}
                                  {o.availableMembers.join(", ")}
                                </p>
                              )}
                              {o.difficultMembers.length > 0 && (
                                <p>
                                  <span className="font-semibold text-yellow-600">어려움:</span>{" "}
                                  {o.difficultMembers.join(", ")}
                                </p>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ============================================
// 메인 컴포넌트
// ============================================

export function MemberAvailabilityCard({ groupId }: { groupId: string }) {
  const {
    data,
    loading,
    addMember,
    removeMember,
    upsertSlot,
    removeSlot,
    clearDaySlots,
    updateNotes,
    overlaps,
  } = useMemberAvailabilitySchedule(groupId);

  const [newName, setNewName] = useState("");
  const [isOpen, setIsOpen] = useState(true);
  const [editEntry, setEditEntry] = useState<MemberAvailabilityEntry | null>(
    null
  );

  const handleAddMember = () => {
    const name = newName.trim();
    if (!name) {
      toast.error("멤버 이름을 입력하세요.");
      return;
    }
    const ok = addMember(name);
    if (!ok) {
      toast.error("이미 같은 이름의 멤버가 있습니다.");
      return;
    }
    setNewName("");
    toast.success(`"${name}" 멤버가 추가되었습니다.`);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleAddMember();
  };

  const handleRemoveMember = (entry: MemberAvailabilityEntry) => {
    removeMember(entry.id);
    toast.success(`"${entry.memberName}" 멤버가 삭제되었습니다.`);
    if (editEntry?.id === entry.id) setEditEntry(null);
  };

  // 편집 다이얼로그에 최신 entry 반영
  const currentEditEntry = editEntry
    ? (data.entries.find((e) => e.id === editEntry.id) ?? null)
    : null;

  return (
    <>
      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-primary" />
              멤버 가용 시간표
            </CardTitle>
            <button
              type="button"
              onClick={() => setIsOpen((v) => !v)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {isOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          </div>
        </CardHeader>

        {isOpen && (
          <CardContent className="space-y-4">
            {/* 멤버 추가 */}
            <div className="flex gap-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="멤버 이름 입력"
                className="h-8 text-xs flex-1"
              />
              <Button
                size="sm"
                className="h-8 text-xs"
                onClick={handleAddMember}
              >
                <UserPlus className="h-3 w-3 mr-1" />
                추가
              </Button>
            </div>

            {/* 통계 요약 */}
            {data.entries.length > 0 && (
              <div className="flex gap-3 text-xs text-muted-foreground border rounded px-3 py-2 bg-muted/20">
                <span>
                  <strong className="text-foreground">
                    {data.entries.length}
                  </strong>
                  명 등록
                </span>
                <span>
                  <strong className="text-foreground">
                    {data.entries.reduce(
                      (acc, e) =>
                        acc +
                        Object.values(e.slots).reduce(
                          (a, arr) => a + (arr?.length ?? 0),
                          0
                        ),
                      0
                    )}
                  </strong>
                  개 시간대
                </span>
                <span>
                  <strong className="text-green-600">{overlaps.length}</strong>
                  개 겹침 구간
                </span>
              </div>
            )}

            {/* 로딩 */}
            {loading && (
              <p className="text-xs text-muted-foreground text-center py-3">
                불러오는 중...
              </p>
            )}

            {/* 멤버 목록 */}
            {!loading && data.entries.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                <CalendarClock className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">
                  멤버를 추가하여 가용 시간을 관리하세요.
                </p>
              </div>
            )}

            {!loading && data.entries.length > 0 && (
              <div className="space-y-0.5 divide-y">
                {data.entries.map((entry) => (
                  <MemberRow
                    key={entry.id}
                    entry={entry}
                    onOpenDetail={() => setEditEntry(entry)}
                    onRemove={() => handleRemoveMember(entry)}
                  />
                ))}
              </div>
            )}

            {/* 겹치는 시간대 패널 */}
            {data.entries.length >= 2 && (
              <OverlapPanel overlaps={overlaps} />
            )}

            {/* 범례 */}
            <div className="flex gap-3 items-center pt-1 border-t">
              <span className="text-[10px] text-muted-foreground">범례</span>
              {(
                Object.entries(LEVEL_CONFIG) as [
                  MemberAvailabilityLevel,
                  (typeof LEVEL_CONFIG)[MemberAvailabilityLevel]
                ][]
              ).map(([lv, cfg]) => (
                <span
                  key={lv}
                  className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${cfg.bg} ${cfg.text}`}
                >
                  {cfg.label}
                </span>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* 편집 다이얼로그 */}
      <MemberDetailDialog
        open={currentEditEntry !== null}
        entry={currentEditEntry}
        onClose={() => setEditEntry(null)}
        onUpsertSlot={upsertSlot}
        onRemoveSlot={removeSlot}
        onClearDay={clearDaySlots}
        onUpdateNotes={updateNotes}
      />
    </>
  );
}
