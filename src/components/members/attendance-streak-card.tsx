"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  Flame,
  Plus,
  Trash2,
  Trophy,
  Users,
  BarChart2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { useAttendanceStreak } from "@/hooks/use-attendance-streak";
import type { MemberStreak } from "@/types";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { cn } from "@/lib/utils";

// ─── 날짜 헬퍼 ────────────────────────────────────────────────

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** YYYY-MM-DD → M/D 포맷 */
function formatShort(date: string): string {
  const [, m, d] = date.split("-");
  return `${parseInt(m)}/${parseInt(d)}`;
}

/** 해당 월의 날짜 배열 생성 (YYYY-MM-DD) */
function getDaysInMonth(year: number, month: number): string[] {
  const days: string[] = [];
  const total = new Date(year, month, 0).getDate(); // month는 1-indexed
  for (let d = 1; d <= total; d++) {
    days.push(
      `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    );
  }
  return days;
}

/** 해당 월 1일의 요일(0=일 ~ 6=토) */
function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay();
}

// ─── 불꽃 색상 (스트릭 크기별) ────────────────────────────────

function flameColor(streak: number): string {
  if (streak >= 10) return "text-orange-500";
  if (streak >= 5) return "text-yellow-500";
  if (streak >= 1) return "text-amber-400";
  return "text-muted-foreground";
}

// ─── 멤버 추가 다이얼로그 ─────────────────────────────────────

function AddMemberDialog({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (name: string) => void;
}) {
  const [name, setName] = useState("");

  function handleSubmit() {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error(TOAST.MEMBERS.ATTENDANCE_NAME_REQUIRED);
      return;
    }
    onAdd(trimmed);
    setName("");
  }

  function handleClose() {
    setName("");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">멤버 추가</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div className="space-y-1">
            <Label className="text-xs">이름</Label>
            <Input
              placeholder="이름 입력"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="h-8 text-xs"
              maxLength={20}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={handleClose}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            추가
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── 출석 기록 다이얼로그 ─────────────────────────────────────

function RecordAttendanceDialog({
  open,
  member,
  onClose,
  onRecord,
  onDeleteRecord,
}: {
  open: boolean;
  member: MemberStreak | null;
  onClose: () => void;
  onRecord: (memberId: string, date: string, attended: boolean) => void;
  onDeleteRecord: (memberId: string, date: string) => void;
}) {
  const [date, setDate] = useState(today());
  const [attended, setAttended] = useState(true);

  if (!member) return null;

  // 현재 선택한 날짜의 기존 기록 확인
  const existingRecord = member.records.find((r) => r.date === date);

  function handleSubmit() {
    if (!date) {
      toast.error(TOAST.MEMBERS.ATTENDANCE_DATE_REQUIRED);
      return;
    }
    onRecord(member!.id, date, attended);
    toast.success(
      `${member!.memberName}: ${formatShort(date)} ${attended ? "출석" : "결석"} 기록 완료`
    );
    onClose();
  }

  function handleDelete() {
    if (!existingRecord) return;
    onDeleteRecord(member!.id, date);
    toast.success(`${formatShort(date)} 기록이 삭제되었습니다.`);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">
            출석 기록 — {member.memberName}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <div className="space-y-1">
            <Label className="text-xs">날짜</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">출석 여부</Label>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-xs",
                  attended ? "text-muted-foreground" : "text-red-500 font-medium"
                )}
              >
                결석
              </span>
              <Switch
                checked={attended}
                onCheckedChange={setAttended}
              />
              <span
                className={cn(
                  "text-xs",
                  attended ? "text-green-600 font-medium" : "text-muted-foreground"
                )}
              >
                출석
              </span>
            </div>
          </div>
          {existingRecord && (
            <p className="text-[10px] text-muted-foreground">
              기존 기록:{" "}
              <span
                className={
                  existingRecord.attended ? "text-green-600" : "text-red-500"
                }
              >
                {existingRecord.attended ? "출석" : "결석"}
              </span>{" "}
              — 덮어씁니다.
            </p>
          )}
        </div>
        <DialogFooter className="flex-col gap-1.5 sm:flex-row">
          {existingRecord && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs text-red-500 hover:text-red-600 w-full sm:w-auto"
              onClick={handleDelete}
            >
              기록 삭제
            </Button>
          )}
          <div className="flex gap-1.5 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs flex-1 sm:flex-none"
              onClick={onClose}
            >
              취소
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs flex-1 sm:flex-none"
              onClick={handleSubmit}
            >
              저장
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── 월간 캘린더 그리드 ───────────────────────────────────────

function MonthlyCalendar({
  member,
  year,
  month,
}: {
  member: MemberStreak;
  year: number;
  month: number;
}) {
  const days = getDaysInMonth(year, month);
  const firstDow = getFirstDayOfWeek(year, month);
  const recordMap = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const r of member.records) {
      map.set(r.date, r.attended);
    }
    return map;
  }, [member.records]);

  const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <div className="space-y-1">
      <p className="text-[10px] text-muted-foreground font-medium">
        {year}년 {month}월
      </p>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {WEEKDAYS.map((w) => (
          <span key={w} className="text-[9px] text-muted-foreground py-0.5">
            {w}
          </span>
        ))}
        {/* 빈 칸: 1일 전 요일 채움 */}
        {Array.from({ length: firstDow }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {days.map((d) => {
          const val = recordMap.get(d);
          const isToday = d === today();
          return (
            <div
              key={d}
              title={`${formatShort(d)}${val === true ? " 출석" : val === false ? " 결석" : " 미기록"}`}
              className={cn(
                "aspect-square rounded-sm flex items-center justify-center text-[9px] font-medium",
                val === true
                  ? "bg-green-500 text-white"
                  : val === false
                  ? "bg-red-400 text-white"
                  : "bg-muted text-muted-foreground",
                isToday && "ring-1 ring-primary ring-offset-1"
              )}
            >
              {parseInt(d.slice(8), 10)}
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-3 pt-0.5">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm bg-green-500" />
          <span className="text-[9px] text-muted-foreground">출석</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm bg-red-400" />
          <span className="text-[9px] text-muted-foreground">결석</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm bg-muted" />
          <span className="text-[9px] text-muted-foreground">미기록</span>
        </div>
      </div>
    </div>
  );
}

// ─── 멤버 행 ─────────────────────────────────────────────────

function MemberRow({
  member,
  isBest,
  onRecord,
  onDelete,
}: {
  member: MemberStreak;
  isBest: boolean;
  onRecord: (member: MemberStreak) => void;
  onDelete: (memberId: string) => void;
}) {
  const [calOpen, setCalOpen] = useState(false);
  const now = new Date();

  const attendanceRate =
    member.totalSessions === 0
      ? 0
      : Math.round((member.totalAttended / member.totalSessions) * 100);

  return (
    <div className="rounded-md border bg-muted/30 p-2.5 space-y-2">
      {/* 상단: 이름 + 스트릭 */}
      <div className="flex items-center gap-2">
        <Flame
          className={cn("h-4 w-4 shrink-0", flameColor(member.currentStreak))}
        />
        <span className="text-xs font-medium flex-1 truncate">
          {member.memberName}
        </span>
        {isBest && (
          <span className="text-[10px] px-1.5 py-0 bg-yellow-100 text-yellow-700 rounded-full font-medium inline-flex items-center gap-0.5">
            <Trophy className="h-2.5 w-2.5" />
            최장 스트릭
          </span>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-1.5 text-[10px]"
          onClick={() => onRecord(member)}
        >
          기록
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-1 text-muted-foreground hover:text-red-500"
          onClick={() => onDelete(member.id)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* 스트릭 수치 */}
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
        <span>
          현재{" "}
          <span className={cn("font-semibold", flameColor(member.currentStreak))}>
            {member.currentStreak}
          </span>
          연속
        </span>
        <span>
          최장{" "}
          <span className="font-semibold text-foreground">
            {member.longestStreak}
          </span>
          연속
        </span>
        <span>
          {member.totalAttended}/{member.totalSessions}회
        </span>
      </div>

      {/* 출석률 바 */}
      <div className="space-y-0.5">
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>출석률</span>
          <span>{attendanceRate}%</span>
        </div>
        <Progress value={attendanceRate} className="h-1.5" />
      </div>

      {/* 월간 캘린더 토글 */}
      <button
        type="button"
        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
        onClick={() => setCalOpen((v) => !v)}
      >
        {calOpen ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
        이번 달 캘린더
      </button>

      {calOpen && (
        <MonthlyCalendar
          member={member}
          year={now.getFullYear()}
          month={now.getMonth() + 1}
        />
      )}
    </div>
  );
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────

interface AttendanceStreakCardProps {
  groupId: string;
}

export function AttendanceStreakCard({ groupId }: AttendanceStreakCardProps) {
  const [open, setOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [recordTarget, setRecordTarget] = useState<MemberStreak | null>(null);

  const {
    members,
    addMember,
    deleteMember,
    recordAttendance,
    deleteRecord,
    bestStreaker,
    avgStreak,
    groupAttendanceRate,
  } = useAttendanceStreak(groupId);

  // ── 핸들러 ───────────────────────────────────────────────

  function handleAddMember(name: string) {
    const ok = addMember(name);
    if (!ok) {
      toast.error(TOAST.MEMBERS.ATTENDANCE_DUPLICATE_MEMBER);
      return;
    }
    toast.success(`${name} 멤버가 추가되었습니다.`);
    setAddOpen(false);
  }

  function handleDeleteMember(memberId: string) {
    const target = members.find((m) => m.id === memberId);
    const ok = deleteMember(memberId);
    if (!ok) {
      toast.error(TOAST.MEMBERS.ATTENDANCE_MEMBER_DELETE_ERROR);
      return;
    }
    toast.success(`${target?.memberName ?? ""} 멤버가 삭제되었습니다.`);
  }

  function handleRecord(
    memberId: string,
    date: string,
    attended: boolean
  ) {
    const ok = recordAttendance(memberId, date, attended);
    if (!ok) {
      toast.error(TOAST.MEMBERS.ATTENDANCE_STREAK_SAVE_ERROR);
    }
  }

  function handleDeleteRecord(memberId: string, date: string) {
    const ok = deleteRecord(memberId, date);
    if (!ok) {
      toast.error(TOAST.MEMBERS.ATTENDANCE_STREAK_DELETE_ERROR);
    }
  }

  // 현재 스트릭 내림차순 정렬
  const sortedMembers = [...members].sort(
    (a, b) => b.currentStreak - a.currentStreak
  );

  return (
    <>
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          {/* 헤더 */}
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors rounded-lg"
            >
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">연습 출결 스트릭</span>
                {members.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0 bg-orange-100 text-orange-700 rounded-full">
                    {members.length}명
                  </span>
                )}
                {bestStreaker && bestStreaker.longestStreak > 0 && (
                  <span className="text-[10px] px-1.5 py-0 bg-yellow-100 text-yellow-700 rounded-full hidden sm:inline-flex items-center gap-0.5">
                    <Trophy className="h-2.5 w-2.5" />
                    {bestStreaker.memberName} {bestStreaker.longestStreak}연속
                  </span>
                )}
              </div>
              {open ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="px-4 pb-4 space-y-4 border-t pt-3">
              {/* 통계 요약 */}
              {members.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-md bg-muted/50 px-2 py-1.5 text-center space-y-0.5">
                    <div className="flex items-center justify-center gap-1 text-orange-500">
                      <Flame className="h-3 w-3" />
                      <span className="text-xs font-bold">{avgStreak}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">평균 스트릭</p>
                  </div>
                  <div className="rounded-md bg-muted/50 px-2 py-1.5 text-center space-y-0.5">
                    <div className="flex items-center justify-center gap-1 text-green-600">
                      <BarChart2 className="h-3 w-3" />
                      <span className="text-xs font-bold">{groupAttendanceRate}%</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">전체 출석률</p>
                  </div>
                  <div className="rounded-md bg-muted/50 px-2 py-1.5 text-center space-y-0.5">
                    <div className="flex items-center justify-center gap-1 text-blue-500">
                      <Users className="h-3 w-3" />
                      <span className="text-xs font-bold">{members.length}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">등록 멤버</p>
                  </div>
                </div>
              )}

              {/* 멤버 목록 */}
              {sortedMembers.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3">
                  등록된 멤버가 없습니다. 멤버를 추가해주세요.
                </p>
              ) : (
                <div className="space-y-2">
                  {sortedMembers.map((m) => (
                    <MemberRow
                      key={m.id}
                      member={m}
                      isBest={
                        bestStreaker?.id === m.id &&
                        m.longestStreak > 0
                      }
                      onRecord={(member) => setRecordTarget(member)}
                      onDelete={handleDeleteMember}
                    />
                  ))}
                </div>
              )}

              {/* 멤버 추가 버튼 */}
              <Button
                variant="outline"
                size="sm"
                className="w-full h-7 text-xs"
                onClick={() => setAddOpen(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                멤버 추가
              </Button>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* 다이얼로그 */}
      <AddMemberDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={handleAddMember}
      />
      <RecordAttendanceDialog
        open={recordTarget !== null}
        member={recordTarget}
        onClose={() => setRecordTarget(null)}
        onRecord={handleRecord}
        onDeleteRecord={handleDeleteRecord}
      />
    </>
  );
}
