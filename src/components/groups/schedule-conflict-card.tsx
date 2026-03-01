"use client";

import { useState } from "react";
import {
  CalendarX2,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useScheduleConflict } from "@/hooks/use-schedule-conflict";
import type { PersonalScheduleType, ScheduleConflictResult } from "@/types";

// ============================================
// 유형별 색상/라벨
// ============================================

const TYPE_CONFIG: Record<
  PersonalScheduleType,
  { label: string; className: string }
> = {
  work: {
    label: "업무",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  school: {
    label: "학업",
    className: "bg-purple-100 text-purple-700 border-purple-200",
  },
  appointment: {
    label: "약속",
    className: "bg-orange-100 text-orange-700 border-orange-200",
  },
  travel: {
    label: "여행",
    className: "bg-green-100 text-green-700 border-green-200",
  },
  family: {
    label: "가족",
    className: "bg-pink-100 text-pink-700 border-pink-200",
  },
  other: {
    label: "기타",
    className: "bg-gray-100 text-gray-700 border-gray-200",
  },
};

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

function TypeBadge({ type }: { type: PersonalScheduleType }) {
  const cfg = TYPE_CONFIG[type];
  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0 text-[10px] font-medium ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}

// ============================================
// 충돌 수 경고 배지
// ============================================

function ConflictCountBadge({ count }: { count: number }) {
  if (count === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded border px-1.5 py-0 text-[10px] font-medium bg-green-100 text-green-700 border-green-200">
        <CheckCircle2 className="h-2.5 w-2.5" />
        충돌 없음
      </span>
    );
  }
  if (count <= 2) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded border px-1.5 py-0 text-[10px] font-medium bg-yellow-100 text-yellow-700 border-yellow-200">
        <AlertTriangle className="h-2.5 w-2.5" />
        {count}명 충돌
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 rounded border px-1.5 py-0 text-[10px] font-medium bg-red-100 text-red-700 border-red-200">
      <AlertTriangle className="h-2.5 w-2.5" />
      {count}명 충돌
    </span>
  );
}

// ============================================
// 일정 추가 다이얼로그
// ============================================

interface AddScheduleDialogProps {
  open: boolean;
  onClose: () => void;
  memberNames: string[];
  onAdd: (
    memberName: string,
    title: string,
    type: PersonalScheduleType,
    date: string,
    startTime: string,
    endTime: string,
    recurring: boolean,
    recurringDay?: number
  ) => void;
}

const DEFAULT_FORM = {
  memberName: "",
  title: "",
  type: "work" as PersonalScheduleType,
  date: "",
  startTime: "",
  endTime: "",
  recurring: false,
  recurringDay: 0,
};

function AddScheduleDialog({
  open,
  onClose,
  memberNames,
  onAdd,
}: AddScheduleDialogProps) {
  const [form, setForm] = useState(DEFAULT_FORM);

  const set = <K extends keyof typeof DEFAULT_FORM>(
    key: K,
    value: (typeof DEFAULT_FORM)[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = () => {
    if (!form.memberName) {
      toast.error(TOAST.SCHEDULE_CONFLICT_CARD.MEMBER_REQUIRED);
      return;
    }
    if (!form.title.trim()) {
      toast.error(TOAST.SCHEDULE_CONFLICT_CARD.TITLE_REQUIRED);
      return;
    }
    if (!form.date && !form.recurring) {
      toast.error(TOAST.SCHEDULE_CONFLICT_CARD.DATE_REQUIRED);
      return;
    }
    if (!form.startTime || !form.endTime) {
      toast.error(TOAST.SCHEDULE_CONFLICT_CARD.TIME_REQUIRED);
      return;
    }
    if (form.startTime >= form.endTime) {
      toast.error(TOAST.SCHEDULE_CONFLICT_CARD.END_AFTER_START);
      return;
    }

    onAdd(
      form.memberName,
      form.title,
      form.type,
      form.recurring ? new Date().toISOString().slice(0, 10) : form.date,
      form.startTime,
      form.endTime,
      form.recurring,
      form.recurring ? form.recurringDay : undefined
    );
    setForm(DEFAULT_FORM);
    onClose();
    toast.success(TOAST.SCHEDULE_CONFLICT_CARD.SCHEDULE_ADDED);
  };

  const handleClose = () => {
    setForm(DEFAULT_FORM);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">개인 일정 추가</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* 멤버 */}
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">
              멤버 <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.memberName}
              onValueChange={(v) => set("memberName", v)}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue placeholder="멤버 선택" />
              </SelectTrigger>
              <SelectContent>
                {memberNames.map((name) => (
                  <SelectItem key={name} value={name} className="text-xs">
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 제목 */}
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">
              제목 <span className="text-destructive">*</span>
            </Label>
            <Input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="일정 제목"
              className="h-7 text-xs"
              autoFocus
            />
          </div>

          {/* 유형 */}
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">
              유형
            </Label>
            <Select
              value={form.type}
              onValueChange={(v) => set("type", v as PersonalScheduleType)}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(TYPE_CONFIG) as PersonalScheduleType[]).map(
                  (t) => (
                    <SelectItem key={t} value={t} className="text-xs">
                      {TYPE_CONFIG[t].label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          {/* 반복 여부 */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="recurring"
              checked={form.recurring}
              onCheckedChange={(v) => set("recurring", !!v)}
            />
            <Label
              htmlFor="recurring"
              className="text-xs cursor-pointer select-none"
            >
              매주 반복
            </Label>
          </div>

          {/* 날짜 or 반복 요일 */}
          {form.recurring ? (
            <div>
              <Label className="text-[10px] text-muted-foreground mb-1 block">
                반복 요일 <span className="text-destructive">*</span>
              </Label>
              <Select
                value={String(form.recurringDay)}
                onValueChange={(v) => set("recurringDay", Number(v))}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAY_LABELS.map((label, idx) => (
                    <SelectItem key={idx} value={String(idx)} className="text-xs">
                      {label}요일
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div>
              <Label className="text-[10px] text-muted-foreground mb-1 block">
                날짜 <span className="text-destructive">*</span>
              </Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
                className="h-7 text-xs"
              />
            </div>
          )}

          {/* 시작/종료 시간 */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Label className="text-[10px] text-muted-foreground mb-1 block">
                시작 시간 <span className="text-destructive">*</span>
              </Label>
              <Input
                type="time"
                value={form.startTime}
                onChange={(e) => set("startTime", e.target.value)}
                className="h-7 text-xs"
              />
            </div>
            <div className="flex-1">
              <Label className="text-[10px] text-muted-foreground mb-1 block">
                종료 시간 <span className="text-destructive">*</span>
              </Label>
              <Input
                type="time"
                value={form.endTime}
                onChange={(e) => set("endTime", e.target.value)}
                className="h-7 text-xs"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={handleClose}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSubmit}
            disabled={!form.memberName || !form.title.trim()}
          >
            추가
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 충돌 결과 행
// ============================================

function ConflictResultRow({ result }: { result: ScheduleConflictResult }) {
  const { personalSchedule, overlapMinutes } = result;
  return (
    <div className="flex items-start gap-2 rounded border border-red-100 bg-red-50/50 px-3 py-2">
      <AlertTriangle className="h-3 w-3 text-red-500 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-medium text-gray-800">
            {result.memberName}
          </span>
          <TypeBadge type={personalSchedule.type} />
          {personalSchedule.recurring && (
            <span className="inline-flex items-center gap-0.5 rounded border px-1.5 py-0 text-[10px] font-medium bg-indigo-50 text-indigo-700 border-indigo-200">
              <RefreshCw className="h-2 w-2" />
              반복
            </span>
          )}
        </div>
        <p className="text-[11px] text-gray-600 mt-0.5 truncate">
          {personalSchedule.title}
        </p>
        <div className="flex items-center gap-1 mt-0.5">
          <Clock className="h-2.5 w-2.5 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">
            {personalSchedule.startTime} ~ {personalSchedule.endTime}
          </span>
          <span className="text-[10px] text-red-600 font-medium ml-1">
            ({overlapMinutes}분 겹침)
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================
// 멤버별 일정 행
// ============================================

interface ScheduleRowProps {
  schedule: import("@/types").PersonalScheduleEntry;
  onDelete: (id: string) => void;
}

function ScheduleRow({ schedule, onDelete }: ScheduleRowProps) {
  return (
    <div className="flex items-start gap-2 rounded border bg-background px-3 py-2 group hover:bg-muted/30 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-medium text-gray-800 truncate">
            {schedule.title}
          </span>
          <TypeBadge type={schedule.type} />
          {schedule.recurring && (
            <span className="inline-flex items-center gap-0.5 rounded border px-1.5 py-0 text-[10px] font-medium bg-indigo-50 text-indigo-700 border-indigo-200">
              <RefreshCw className="h-2 w-2" />
              매주 {DAY_LABELS[schedule.recurringDay ?? 0]}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <Clock className="h-2.5 w-2.5 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">
            {schedule.recurring
              ? `매주 ${DAY_LABELS[schedule.recurringDay ?? 0]}요일`
              : schedule.date}{" "}
            {schedule.startTime} ~ {schedule.endTime}
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onDelete(schedule.id)}
        className="shrink-0 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
        title="삭제"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}

// ============================================
// 메인 카드 컴포넌트
// ============================================

interface ScheduleConflictCardProps {
  groupId: string;
  memberNames: string[];
}

export function ScheduleConflictCard({
  groupId,
  memberNames,
}: ScheduleConflictCardProps) {
  const {
    schedules,
    addSchedule,
    deleteSchedule,
    getByMember,
    checkConflicts,
    totalSchedules,
    membersWithSchedules,
    recurringCount,
  } = useScheduleConflict(groupId);

  const [open, setOpen] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);

  // 충돌 감지 섹션 상태
  const [conflictDate, setConflictDate] = useState("");
  const [conflictStart, setConflictStart] = useState("19:00");
  const [conflictEnd, setConflictEnd] = useState("22:00");
  const [conflictResults, setConflictResults] = useState<
    ScheduleConflictResult[] | null
  >(null);

  // 멤버별 일정 필터 상태
  const [filterMember, setFilterMember] = useState<string>("__all__");

  const filteredSchedules =
    filterMember === "__all__"
      ? schedules
      : getByMember(filterMember);

  const handleCheckConflicts = () => {
    if (!conflictDate) {
      toast.error(TOAST.SCHEDULE_CONFLICT_CARD.DATE_SELECT);
      return;
    }
    if (!conflictStart || !conflictEnd) {
      toast.error(TOAST.SCHEDULE_CONFLICT_CARD.TIME_REQUIRED);
      return;
    }
    if (conflictStart >= conflictEnd) {
      toast.error(TOAST.SCHEDULE_CONFLICT_CARD.END_AFTER_START);
      return;
    }
    const results = checkConflicts(conflictDate, conflictStart, conflictEnd);
    setConflictResults(results);
  };

  const handleDeleteSchedule = (id: string) => {
    deleteSchedule(id);
    // 충돌 결과 초기화 (데이터 변경으로 재확인 필요)
    setConflictResults(null);
    toast.success(TOAST.SCHEDULE_CONFLICT_CARD.SCHEDULE_DELETED);
  };

  return (
    <>
      <Collapsible open={open} onOpenChange={setOpen}>
        {/* 헤더 */}
        <div className="flex items-center justify-between rounded-t-lg border border-b-0 border-gray-200 bg-background px-4 py-2.5">
          <div className="flex items-center gap-2">
            <CalendarX2 className="h-4 w-4 text-rose-500" />
            <span className="text-sm font-semibold text-gray-800">
              일정 충돌 감지
            </span>
            {totalSchedules > 0 && (
              <Badge className="bg-rose-100 text-[10px] px-1.5 py-0 text-rose-600 hover:bg-rose-100">
                {totalSchedules}건
              </Badge>
            )}
            {membersWithSchedules > 0 && (
              <Badge className="bg-gray-100 text-[10px] px-1.5 py-0 text-gray-600 hover:bg-gray-100">
                {membersWithSchedules}명
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {open && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[10px] px-2 gap-0.5"
                onClick={() => setShowAddDialog(true)}
              >
                <Plus className="h-3 w-3" />
                일정 추가
              </Button>
            )}
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
          <div className="rounded-b-lg border border-gray-200 bg-card p-4 space-y-4">

            {/* ---- 충돌 감지 섹션 ---- */}
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                <Search className="h-3 w-3 text-rose-500" />
                충돌 감지
              </p>

              {/* 입력 행 */}
              <div className="flex flex-wrap gap-2 items-end mb-2">
                <div>
                  <Label className="text-[10px] text-muted-foreground mb-1 block">
                    날짜
                  </Label>
                  <Input
                    type="date"
                    value={conflictDate}
                    onChange={(e) => {
                      setConflictDate(e.target.value);
                      setConflictResults(null);
                    }}
                    className="h-7 text-xs w-36"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground mb-1 block">
                    시작
                  </Label>
                  <Input
                    type="time"
                    value={conflictStart}
                    onChange={(e) => {
                      setConflictStart(e.target.value);
                      setConflictResults(null);
                    }}
                    className="h-7 text-xs w-28"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground mb-1 block">
                    종료
                  </Label>
                  <Input
                    type="time"
                    value={conflictEnd}
                    onChange={(e) => {
                      setConflictEnd(e.target.value);
                      setConflictResults(null);
                    }}
                    className="h-7 text-xs w-28"
                  />
                </div>
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleCheckConflicts}
                >
                  확인
                </Button>
              </div>

              {/* 충돌 결과 */}
              {conflictResults !== null && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <ConflictCountBadge count={conflictResults.length} />
                    {conflictResults.length > 0 && (
                      <span className="text-[10px] text-muted-foreground">
                        {conflictDate} {conflictStart}~{conflictEnd}
                      </span>
                    )}
                  </div>
                  {conflictResults.length > 0 && (
                    <div className="space-y-1 mt-1">
                      {conflictResults.map((r) => (
                        <ConflictResultRow
                          key={r.personalSchedule.id}
                          result={r}
                        />
                      ))}
                    </div>
                  )}
                  {conflictResults.length === 0 && (
                    <p className="text-[11px] text-muted-foreground">
                      해당 시간대에 충돌하는 개인 일정이 없습니다.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* 구분선 */}
            <div className="border-t border-gray-100" />

            {/* ---- 멤버별 일정 목록 ---- */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                  <User className="h-3 w-3 text-blue-500" />
                  멤버별 개인 일정
                </p>
                <Select
                  value={filterMember}
                  onValueChange={setFilterMember}
                >
                  <SelectTrigger className="h-7 text-xs w-32">
                    <SelectValue placeholder="전체" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__" className="text-xs">
                      전체
                    </SelectItem>
                    {memberNames.map((name) => (
                      <SelectItem key={name} value={name} className="text-xs">
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {filteredSchedules.length === 0 ? (
                <div className="py-6 flex flex-col items-center gap-2 text-muted-foreground">
                  <CalendarX2 className="h-8 w-8 opacity-25" />
                  <p className="text-xs">
                    {filterMember === "__all__"
                      ? "등록된 개인 일정이 없습니다."
                      : `${filterMember}의 일정이 없습니다.`}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setShowAddDialog(true)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    일정 추가
                  </Button>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredSchedules.map((s) => (
                    <ScheduleRow
                      key={s.id}
                      schedule={s}
                      onDelete={handleDeleteSchedule}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* ---- 통계 ---- */}
            {totalSchedules > 0 && (
              <div className="pt-3 border-t border-gray-100 flex flex-wrap gap-4 text-[10px] text-muted-foreground">
                <span>
                  전체{" "}
                  <strong className="text-foreground">{totalSchedules}</strong>
                  건
                </span>
                <span>
                  등록 멤버{" "}
                  <strong className="text-foreground">
                    {membersWithSchedules}
                  </strong>
                  명
                </span>
                {recurringCount > 0 && (
                  <span>
                    반복{" "}
                    <strong className="text-foreground">{recurringCount}</strong>
                    건
                  </span>
                )}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* 일정 추가 다이얼로그 */}
      <AddScheduleDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        memberNames={memberNames}
        onAdd={addSchedule}
      />
    </>
  );
}
