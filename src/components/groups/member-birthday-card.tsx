"use client";

import { useState } from "react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import {
  Cake,
  Plus,
  Trash2,
  Gift,
  PartyPopper,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Pencil,
  X,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  useMemberBirthday,
  calcMemberBirthdayDDay,
} from "@/hooks/use-member-birthday";
import type { MemberBirthdayEntry, BirthdayCelebration } from "@/types";

// ─── 상수 ─────────────────────────────────────────────────────
const MONTH_NAMES = [
  "1월", "2월", "3월", "4월", "5월", "6월",
  "7월", "8월", "9월", "10월", "11월", "12월",
];

// ─── 유틸 ─────────────────────────────────────────────────────
function formatBirthday(month: number, day: number): string {
  return `${month}월 ${day}일`;
}

function getDDayLabel(dDay: number): { text: string; color: string } {
  if (dDay === 0) return { text: "D-Day", color: "bg-pink-500 text-white" };
  if (dDay <= 7)
    return { text: `D-${dDay}`, color: "bg-orange-400 text-white" };
  if (dDay <= 30)
    return {
      text: `D-${dDay}`,
      color: "bg-yellow-400 text-yellow-900",
    };
  return { text: `D-${dDay}`, color: "bg-gray-100 text-gray-500" };
}

// ─── 축하 메시지 영역 ─────────────────────────────────────────
function CelebrationSection({
  birthdayId,
  celebrations,
  onAdd,
  onDelete,
}: {
  birthdayId: string;
  celebrations: BirthdayCelebration[];
  onAdd: (birthdayId: string, fromName: string, message: string) => void;
  onDelete: (id: string) => void;
}) {
  const [fromName, setFromName] = useState("");
  const [message, setMessage] = useState("");
  const myCelebrations = celebrations.filter(
    (c) => c.birthdayId === birthdayId
  );

  function handleAdd() {
    if (!message.trim()) {
      toast.error(TOAST.MEMBER_BIRTHDAY.MESSAGE_REQUIRED);
      return;
    }
    onAdd(birthdayId, fromName.trim() || "익명", message.trim());
    toast.success(TOAST.MEMBER_BIRTHDAY.MESSAGE_ADDED);
    setFromName("");
    setMessage("");
  }

  return (
    <div className="mt-2 rounded-md bg-gray-50 p-2">
      {myCelebrations.length > 0 ? (
        <ul className="mb-2 space-y-1">
          {myCelebrations.map((c) => (
            <li
              key={c.id}
              className="flex items-start justify-between gap-1"
            >
              <div className="flex items-start gap-1 text-[11px] text-gray-700 min-w-0">
                <span className="font-medium text-indigo-600 shrink-0">
                  {c.fromName}:
                </span>
                <span className="break-words">{c.message}</span>
              </div>
              <button
                type="button"
                className="shrink-0 text-gray-300 hover:text-red-400 transition-colors"
                onClick={() => onDelete(c.id)}
              >
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-2 text-[11px] text-gray-400">
          아직 축하 메시지가 없습니다.
        </p>
      )}
      <div className="flex gap-1.5">
        <input
          type="text"
          value={fromName}
          onChange={(e) => setFromName(e.target.value.slice(0, 15))}
          placeholder="이름"
          className="w-20 shrink-0 rounded border border-gray-200 bg-background px-1.5 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-300"
        />
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, 60))}
          placeholder="축하 메시지 입력"
          className="flex-1 rounded border border-gray-200 bg-background px-1.5 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-300"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
          }}
        />
        <Button size="sm" className="h-6 px-2 text-[11px]" onClick={handleAdd}>
          추가
        </Button>
      </div>
    </div>
  );
}

// ─── 생일 항목 ────────────────────────────────────────────────
function BirthdayItem({
  entry,
  celebrations,
  onEdit,
  onDelete,
  onAddCelebration,
  onDeleteCelebration,
}: {
  entry: MemberBirthdayEntry;
  celebrations: BirthdayCelebration[];
  onEdit: (entry: MemberBirthdayEntry) => void;
  onDelete: (id: string) => void;
  onAddCelebration: (birthdayId: string, fromName: string, message: string) => void;
  onDeleteCelebration: (id: string) => void;
}) {
  const [showCelebrations, setShowCelebrations] = useState(false);
  const dDay = calcMemberBirthdayDDay(entry.birthMonth, entry.birthDay);
  const { text: dDayText, color: dDayColor } = getDDayLabel(dDay);
  const isToday = dDay === 0;
  const celebCount = celebrations.filter(
    (c) => c.birthdayId === entry.id
  ).length;

  return (
    <div
      className={`rounded-lg border p-3 ${
        isToday
          ? "border-pink-300 bg-pink-50"
          : "border-gray-200 bg-card"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Cake
            className={`h-4 w-4 shrink-0 ${
              isToday ? "text-pink-500" : "text-gray-400"
            }`}
          />
          <div className="min-w-0">
            <span className="block truncate text-sm font-medium text-gray-800">
              {entry.memberName}
            </span>
            <span className="text-[11px] text-gray-500">
              {formatBirthday(entry.birthMonth, entry.birthDay)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${dDayColor}`}
          >
            {dDayText}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-gray-400 hover:text-blue-500"
            onClick={() => onEdit(entry)}
            title="수정"
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
            onClick={() => onDelete(entry.id)}
            title="삭제"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {entry.wishMessage && (
        <div className="mt-1.5 flex items-center gap-1 text-[11px] text-gray-500">
          <Gift className="h-3 w-3 text-purple-400 shrink-0" />
          <span className="break-words">{entry.wishMessage}</span>
        </div>
      )}

      <div className="mt-2 flex items-center justify-end">
        <button
          type="button"
          className="flex items-center gap-0.5 text-[11px] text-gray-400 hover:text-indigo-500 transition-colors"
          onClick={() => setShowCelebrations((v) => !v)}
        >
          <MessageSquare className="h-3 w-3" />
          <span>
            축하 메시지{celebCount > 0 ? ` (${celebCount})` : ""}
          </span>
          <ChevronRight
            className={`h-3 w-3 transition-transform ${
              showCelebrations ? "rotate-90" : ""
            }`}
          />
        </button>
      </div>

      {showCelebrations && (
        <CelebrationSection
          birthdayId={entry.id}
          celebrations={celebrations}
          onAdd={onAddCelebration}
          onDelete={onDeleteCelebration}
        />
      )}
    </div>
  );
}

// ─── 생일 등록/수정 다이얼로그 ────────────────────────────────
function BirthdayDialog({
  open,
  onClose,
  onSave,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (
    memberName: string,
    birthMonth: number,
    birthDay: number,
    wishMessage: string | null
  ) => void;
  initial?: MemberBirthdayEntry | null;
}) {
  const [memberName, setMemberName] = useState(
    initial?.memberName ?? ""
  );
  const [birthMonth, setBirthMonth] = useState(
    initial ? String(initial.birthMonth) : ""
  );
  const [birthDay, setBirthDay] = useState(
    initial ? String(initial.birthDay) : ""
  );
  const [wishMessage, setWishMessage] = useState(
    initial?.wishMessage ?? ""
  );

  // 다이얼로그가 열릴 때마다 초기값 동기화
  function handleOpenChange() {
    setMemberName(initial?.memberName ?? "");
    setBirthMonth(initial ? String(initial.birthMonth) : "");
    setBirthDay(initial ? String(initial.birthDay) : "");
    setWishMessage(initial?.wishMessage ?? "");
  }

  function handleSave() {
    if (!memberName.trim()) {
      toast.error(TOAST.MEMBER_BIRTHDAY.NAME_REQUIRED);
      return;
    }
    const mm = Number(birthMonth);
    const dd = Number(birthDay);
    if (!birthMonth || isNaN(mm) || mm < 1 || mm > 12) {
      toast.error(TOAST.MEMBER_BIRTHDAY.MONTH_RANGE);
      return;
    }
    if (!birthDay || isNaN(dd) || dd < 1 || dd > 31) {
      toast.error(TOAST.MEMBER_BIRTHDAY.DAY_RANGE);
      return;
    }
    onSave(
      memberName.trim(),
      mm,
      dd,
      wishMessage.trim() || null
    );
    onClose();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
        else handleOpenChange();
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {initial ? "생일 정보 수정" : "생일 등록"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div>
            <label className="mb-0.5 block text-[11px] font-medium text-gray-600">
              멤버 이름 <span className="text-red-400">*</span>
            </label>
            <Input
              value={memberName}
              onChange={(e) => setMemberName(e.target.value.slice(0, 20))}
              placeholder="홍길동"
              className="h-8 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-0.5 block text-[11px] font-medium text-gray-600">
                생일 월 <span className="text-red-400">*</span>
              </label>
              <Input
                type="number"
                value={birthMonth}
                onChange={(e) => setBirthMonth(e.target.value)}
                placeholder="1~12"
                min={1}
                max={12}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <label className="mb-0.5 block text-[11px] font-medium text-gray-600">
                생일 일 <span className="text-red-400">*</span>
              </label>
              <Input
                type="number"
                value={birthDay}
                onChange={(e) => setBirthDay(e.target.value)}
                placeholder="1~31"
                min={1}
                max={31}
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="mb-0.5 block text-[11px] font-medium text-gray-600">
              희망/소원 메시지 <span className="text-gray-400">(선택)</span>
            </label>
            <Input
              value={wishMessage}
              onChange={(e) => setWishMessage(e.target.value.slice(0, 80))}
              placeholder="예: 딸기 케이크, 꽃다발"
              className="h-8 text-xs"
            />
          </div>
        </div>

        <DialogFooter className="gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={onClose}
          >
            <X className="mr-1 h-3 w-3" />
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSave}>
            <Check className="mr-1 h-3 w-3" />
            {initial ? "저장" : "등록"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── 월별 섹션 ────────────────────────────────────────────────
function MonthSection({
  month,
  entries,
  celebrations,
  onEdit,
  onDelete,
  onAddCelebration,
  onDeleteCelebration,
}: {
  month: number;
  entries: MemberBirthdayEntry[];
  celebrations: BirthdayCelebration[];
  onEdit: (entry: MemberBirthdayEntry) => void;
  onDelete: (id: string) => void;
  onAddCelebration: (birthdayId: string, fromName: string, message: string) => void;
  onDeleteCelebration: (id: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const currentMonth = new Date().getMonth() + 1;
  const isCurrentMonth = month === currentMonth;

  if (entries.length === 0) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-1 py-1 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-1.5">
          <span
            className={`text-xs font-semibold ${
              isCurrentMonth ? "text-pink-600" : "text-gray-600"
            }`}
          >
            {MONTH_NAMES[month - 1]}
          </span>
          <Badge
            className={`text-[10px] px-1.5 py-0 ${
              isCurrentMonth
                ? "bg-pink-100 text-pink-600 hover:bg-pink-100"
                : "bg-gray-100 text-gray-500 hover:bg-gray-100"
            }`}
          >
            {entries.length}명
          </Badge>
          {isCurrentMonth && (
            <Badge className="bg-pink-500 text-[10px] px-1.5 py-0 text-white hover:bg-pink-500">
              이번 달
            </Badge>
          )}
        </div>
        {open ? (
          <ChevronUp className="h-3.5 w-3.5 text-gray-400" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-1.5 space-y-2 pl-1">
          {entries.map((entry) => (
            <BirthdayItem
              key={entry.id}
              entry={entry}
              celebrations={celebrations}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddCelebration={onAddCelebration}
              onDeleteCelebration={onDeleteCelebration}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ─── 메인 카드 ────────────────────────────────────────────────
interface MemberBirthdayCardProps {
  groupId: string;
}

export function MemberBirthdayCard({ groupId }: MemberBirthdayCardProps) {
  const [open, setOpen] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<MemberBirthdayEntry | null>(null);

  const {
    birthdays,
    celebrations,
    loading,
    upcomingBirthdays,
    todayBirthdays,
    monthlyDistribution,
    totalMembers,
    addBirthday,
    updateBirthday,
    deleteBirthday,
    addCelebration,
    deleteCelebration,
  } = useMemberBirthday(groupId);

  function handleOpenAdd() {
    setEditTarget(null);
    setDialogOpen(true);
  }

  function handleEdit(entry: MemberBirthdayEntry) {
    setEditTarget(entry);
    setDialogOpen(true);
  }

  function handleSave(
    memberName: string,
    birthMonth: number,
    birthDay: number,
    wishMessage: string | null
  ) {
    if (editTarget) {
      updateBirthday(editTarget.id, { memberName, birthMonth, birthDay, wishMessage });
      toast.success(`${memberName} 님의 생일 정보가 수정되었습니다.`);
    } else {
      addBirthday({ memberName, birthMonth, birthDay, wishMessage });
      toast.success(`${memberName} 님의 생일이 등록되었습니다.`);
    }
  }

  function handleDelete(id: string) {
    const entry = birthdays.find((b) => b.id === id);
    deleteBirthday(id);
    toast.success(
      entry ? `${entry.memberName} 님의 생일이 삭제되었습니다.` : "생일이 삭제되었습니다."
    );
  }

  function handleAddCelebration(
    birthdayId: string,
    fromName: string,
    message: string
  ) {
    addCelebration({ birthdayId, fromName, message });
  }

  // 생일이 있는 월만 추출 (1~12 순서)
  const activeMonths = Array.from({ length: 12 }, (_, i) => i + 1).filter(
    (m) => (monthlyDistribution[m]?.length ?? 0) > 0
  );

  return (
    <>
      <Collapsible open={open} onOpenChange={setOpen}>
        {/* 헤더 */}
        <div className="flex items-center justify-between rounded-t-lg border border-b-0 border-gray-200 bg-background px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Cake className="h-4 w-4 text-pink-500" />
            <span className="text-sm font-semibold text-gray-800">
              멤버 생일 캘린더
            </span>
            {totalMembers > 0 && (
              <Badge className="bg-pink-100 text-[10px] px-1.5 py-0 text-pink-600 hover:bg-pink-100">
                {totalMembers}명
              </Badge>
            )}
            {todayBirthdays.length > 0 && (
              <Badge className="bg-pink-500 text-[10px] px-1.5 py-0 text-white hover:bg-pink-500">
                <PartyPopper className="mr-0.5 h-2.5 w-2.5" />
                오늘 생일 {todayBirthdays.length}명
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-pink-500 hover:text-pink-600 hover:bg-pink-50"
              onClick={handleOpenAdd}
            >
              <Plus className="mr-0.5 h-3 w-3" />
              생일 등록
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
          <div className="rounded-b-lg border border-gray-200 bg-card p-4">
            {/* 로딩 */}
            {loading && (
              <div className="py-6 text-center text-xs text-gray-400">
                불러오는 중...
              </div>
            )}

            {!loading && (
              <>
                {/* 다가오는 생일 알림 (60일 이내) */}
                {upcomingBirthdays.length > 0 && (
                  <div className="mb-4">
                    <p className="mb-2 flex items-center gap-1 text-xs font-semibold text-gray-700">
                      <Cake className="h-3.5 w-3.5 text-pink-400" />
                      다가오는 생일
                    </p>
                    <div className="space-y-1.5">
                      {upcomingBirthdays.map((entry) => {
                        const { text: dDayText, color: dDayColor } =
                          getDDayLabel(entry.dDay);
                        const isToday = entry.dDay === 0;
                        return (
                          <div
                            key={entry.id}
                            className={`flex items-center justify-between rounded-md px-3 py-1.5 ${
                              isToday ? "bg-pink-100" : "bg-orange-50"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Cake
                                className={`h-3.5 w-3.5 ${
                                  isToday
                                    ? "text-pink-500"
                                    : "text-orange-400"
                                }`}
                              />
                              <span className="text-xs font-medium text-gray-700">
                                {entry.memberName}
                              </span>
                              <span className="text-[11px] text-gray-400">
                                {formatBirthday(entry.birthMonth, entry.birthDay)}
                              </span>
                            </div>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${dDayColor}`}
                            >
                              {dDayText}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <Separator className="mt-4 mb-0" />
                  </div>
                )}

                {/* 월별 생일 목록 */}
                {activeMonths.length > 0 ? (
                  <>
                    {/* 월별 분포 요약 (CSS grid 12개월) */}
                    <div className="mb-4">
                      <p className="mb-2 text-xs font-semibold text-gray-600">
                        월별 분포
                      </p>
                      <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-12">
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(
                          (m) => {
                            const count =
                              monthlyDistribution[m]?.length ?? 0;
                            const isCurrentMonth =
                              m === new Date().getMonth() + 1;
                            return (
                              <div
                                key={m}
                                className={`flex flex-col items-center gap-0.5 rounded-md py-1.5 text-center ${
                                  isCurrentMonth
                                    ? "bg-pink-100"
                                    : count > 0
                                    ? "bg-gray-50"
                                    : "bg-gray-50 opacity-40"
                                }`}
                              >
                                <span
                                  className={`text-[10px] font-medium ${
                                    isCurrentMonth
                                      ? "text-pink-600"
                                      : "text-gray-500"
                                  }`}
                                >
                                  {m}월
                                </span>
                                <span
                                  className={`text-[11px] font-bold ${
                                    count > 0
                                      ? isCurrentMonth
                                        ? "text-pink-600"
                                        : "text-gray-700"
                                      : "text-gray-300"
                                  }`}
                                >
                                  {count > 0 ? count : "-"}
                                </span>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                    <Separator className="mb-4" />

                    {/* 월별 상세 목록 */}
                    <div className="space-y-3">
                      {activeMonths.map((month) => (
                        <MonthSection
                          key={month}
                          month={month}
                          entries={monthlyDistribution[month] ?? []}
                          celebrations={celebrations}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          onAddCelebration={handleAddCelebration}
                          onDeleteCelebration={deleteCelebration}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  /* 빈 상태 */
                  <div className="flex flex-col items-center justify-center gap-2 py-8 text-gray-400">
                    <Cake className="h-10 w-10 opacity-20" />
                    <p className="text-xs">등록된 생일 정보가 없습니다.</p>
                    <p className="text-[11px] text-gray-300">
                      멤버들의 생일을 등록하고 잊지 않고 축하해 주세요.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-1 h-7 text-xs"
                      onClick={handleOpenAdd}
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      첫 번째 생일 등록하기
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* 생일 등록/수정 다이얼로그 */}
      <BirthdayDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditTarget(null);
        }}
        onSave={handleSave}
        initial={editTarget}
      />
    </>
  );
}
