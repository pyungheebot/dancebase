"use client";

import { useState } from "react";
import { useAsyncAction } from "@/hooks/use-async-action";
import { toast } from "sonner";
import {
  Cake,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Gift,
  PartyPopper,
  MessageSquare,
  ChevronRight,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  useBirthdayCalendarLocal,
  calcDDay,
} from "@/hooks/use-birthday-calendar-local";
import type { BirthdayCalendarEntry } from "@/types";

// ─── 상수 ──────────────────────────────────────────────────────
const MONTH_NAMES = [
  "1월", "2월", "3월", "4월", "5월", "6월",
  "7월", "8월", "9월", "10월", "11월", "12월",
];

// ─── 유틸 ──────────────────────────────────────────────────────
function formatMonthDay(birthday: string): string {
  const [mm, dd] = birthday.split("-");
  return `${Number(mm)}월 ${Number(dd)}일`;
}

function getDDayLabel(dDay: number): { text: string; color: string } {
  if (dDay === 0) return { text: "D-Day", color: "bg-pink-500 text-white" };
  if (dDay <= 7) return { text: `D-${dDay}`, color: "bg-orange-400 text-white" };
  if (dDay <= 30) return { text: `D-${dDay}`, color: "bg-yellow-400 text-yellow-900" };
  return { text: `D-${dDay}`, color: "bg-gray-100 text-gray-500" };
}

// ─── 생일 항목 카드 ───────────────────────────────────────────
function EntryItem({
  entry,
  onToggleParty,
  onDelete,
  onAddMessage,
  messages,
}: {
  entry: BirthdayCalendarEntry;
  onToggleParty: () => void;
  onDelete: () => void;
  onAddMessage: (author: string, content: string) => void;
  messages: ReturnType<typeof useBirthdayCalendarLocal>["messages"];
}) {
  const [showMessages, setShowMessages] = useState(false);
  const [msgAuthor, setMsgAuthor] = useState("");
  const [msgContent, setMsgContent] = useState("");

  const dDay = calcDDay(entry.birthday);
  const { text: dDayText, color: dDayColor } = getDDayLabel(dDay);
  const entryMessages = messages.filter((m) => m.entryId === entry.id);
  const isToday = dDay === 0;

  function handleAddMessage() {
    if (!msgContent.trim()) {
      toast.error("메시지 내용을 입력해주세요.");
      return;
    }
    onAddMessage(msgAuthor.trim() || "익명", msgContent.trim());
    toast.success("축하 메시지가 추가되었습니다.");
    setMsgAuthor("");
    setMsgContent("");
  }

  return (
    <div
      className={`rounded-lg border p-3 ${
        isToday
          ? "border-pink-300 bg-pink-50"
          : "border-gray-200 bg-white"
      }`}
    >
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Cake
            className={`h-4 w-4 shrink-0 ${
              isToday ? "text-pink-500" : "text-gray-400"
            }`}
          />
          <div className="min-w-0">
            <span className="block truncate text-sm font-medium text-gray-800">
              {entry.name}
            </span>
            <span className="text-[11px] text-gray-500">
              {formatMonthDay(entry.birthday)}
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
            className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
            onClick={onDelete}
            title="삭제"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* 선물/케이크 선호 */}
      {entry.giftPreference && (
        <div className="mt-1.5 flex items-center gap-1 text-[11px] text-gray-500">
          <Gift className="h-3 w-3 text-purple-400" />
          <span>{entry.giftPreference}</span>
        </div>
      )}

      {/* 메모 */}
      {entry.note && (
        <p className="mt-1 text-[11px] text-gray-500 leading-relaxed">
          {entry.note}
        </p>
      )}

      {/* 파티 계획 토글 */}
      <div className="mt-2 flex items-center justify-between">
        <button
          type="button"
          className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-pink-500 transition-colors"
          onClick={onToggleParty}
        >
          {entry.partyPlanned ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-pink-500" />
          ) : (
            <Circle className="h-3.5 w-3.5" />
          )}
          <PartyPopper
            className={`h-3 w-3 ${
              entry.partyPlanned ? "text-pink-400" : "text-gray-300"
            }`}
          />
          <span className={entry.partyPlanned ? "text-pink-500 font-medium" : ""}>
            {entry.partyPlanned ? "파티 계획됨" : "파티 계획 없음"}
          </span>
        </button>

        {/* 메시지 토글 */}
        <button
          type="button"
          className="flex items-center gap-0.5 text-[11px] text-gray-400 hover:text-indigo-500 transition-colors"
          onClick={() => setShowMessages((v) => !v)}
        >
          <MessageSquare className="h-3 w-3" />
          <span>메시지 {entryMessages.length > 0 ? `(${entryMessages.length})` : ""}</span>
          <ChevronRight
            className={`h-3 w-3 transition-transform ${showMessages ? "rotate-90" : ""}`}
          />
        </button>
      </div>

      {/* 메시지 영역 */}
      {showMessages && (
        <div className="mt-2 rounded-md bg-gray-50 p-2">
          {/* 기존 메시지 */}
          {entryMessages.length > 0 ? (
            <ul className="mb-2 space-y-1">
              {entryMessages.map((msg) => (
                <li
                  key={msg.id}
                  className="flex items-start gap-1.5 text-[11px] text-gray-700"
                >
                  <span className="font-medium text-indigo-600 shrink-0">
                    {msg.author}:
                  </span>
                  <span className="break-words">{msg.content}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mb-2 text-[11px] text-gray-400">
              아직 축하 메시지가 없습니다.
            </p>
          )}

          {/* 메시지 입력 */}
          <div className="flex gap-1.5">
            <input
              type="text"
              value={msgAuthor}
              onChange={(e) => setMsgAuthor(e.target.value.slice(0, 15))}
              placeholder="이름"
              className="w-20 shrink-0 rounded border border-gray-200 bg-white px-1.5 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-300"
            />
            <input
              type="text"
              value={msgContent}
              onChange={(e) => setMsgContent(e.target.value.slice(0, 60))}
              placeholder="축하 메시지 입력"
              className="flex-1 rounded border border-gray-200 bg-white px-1.5 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-300"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddMessage();
              }}
            />
            <Button
              size="sm"
              className="h-6 px-2 text-[11px]"
              onClick={handleAddMessage}
            >
              추가
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 생일 추가 폼 ──────────────────────────────────────────────
function AddEntryForm({
  onAdd,
}: {
  onAdd: ReturnType<typeof useBirthdayCalendarLocal>["addEntry"];
}) {
  const [name, setName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [giftPreference, setGiftPreference] = useState("");
  const [note, setNote] = useState("");
  const [partyPlanned, setPartyPlanned] = useState(false);
  const { pending: submitting, execute } = useAsyncAction();

  async function handleSubmit() {
    if (!name.trim()) {
      toast.error("멤버 이름을 입력해주세요.");
      return;
    }
    if (!birthday || !/^\d{2}-\d{2}$/.test(birthday)) {
      toast.error("생일을 MM-DD 형식으로 입력해주세요. (예: 03-15)");
      return;
    }
    const [mm, dd] = birthday.split("-").map(Number);
    if (mm < 1 || mm > 12 || dd < 1 || dd > 31) {
      toast.error("올바른 생일 날짜를 입력해주세요.");
      return;
    }

    await execute(async () => {
      onAdd({
        name: name.trim(),
        birthday,
        giftPreference: giftPreference.trim() || undefined,
        partyPlanned,
        note: note.trim() || undefined,
      });
      toast.success(`${name.trim()} 님의 생일이 추가되었습니다.`);
      setName("");
      setBirthday("");
      setGiftPreference("");
      setNote("");
      setPartyPlanned(false);
    });
  }

  return (
    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3">
      <p className="mb-2.5 text-xs font-medium text-gray-600">생일 추가</p>

      <div className="mb-2 grid grid-cols-2 gap-2">
        {/* 이름 */}
        <div>
          <label className="mb-0.5 block text-[10px] text-gray-500">
            멤버 이름 <span className="text-red-400">*</span>
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 20))}
            placeholder="홍길동"
            className="h-7 text-xs"
            disabled={submitting}
          />
        </div>

        {/* 생일 */}
        <div>
          <label className="mb-0.5 block text-[10px] text-gray-500">
            생일 (MM-DD) <span className="text-red-400">*</span>
          </label>
          <Input
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            placeholder="03-15"
            maxLength={5}
            className="h-7 text-xs"
            disabled={submitting}
          />
        </div>
      </div>

      {/* 선물/케이크 선호 */}
      <div className="mb-2">
        <label className="mb-0.5 block text-[10px] text-gray-500">
          선호 선물/케이크
        </label>
        <Input
          value={giftPreference}
          onChange={(e) => setGiftPreference(e.target.value.slice(0, 50))}
          placeholder="예: 딸기 케이크, 꽃다발"
          className="h-7 text-xs"
          disabled={submitting}
        />
      </div>

      {/* 메모 */}
      <div className="mb-2">
        <label className="mb-0.5 block text-[10px] text-gray-500">메모</label>
        <Input
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 100))}
          placeholder="추가 메모 (선택)"
          className="h-7 text-xs"
          disabled={submitting}
        />
      </div>

      {/* 파티 계획 */}
      <label className="mb-3 flex cursor-pointer items-center gap-1.5 text-xs text-gray-600">
        <input
          type="checkbox"
          checked={partyPlanned}
          onChange={(e) => setPartyPlanned(e.target.checked)}
          className="h-3.5 w-3.5 rounded border-gray-300 accent-pink-500"
          disabled={submitting}
        />
        파티 계획 있음
      </label>

      <Button
        size="sm"
        className="h-7 w-full text-xs"
        onClick={handleSubmit}
        disabled={submitting}
      >
        <Plus className="mr-1 h-3 w-3" />
        생일 추가
      </Button>
    </div>
  );
}

// ─── 월별 섹션 ────────────────────────────────────────────────
function MonthSection({
  month,
  entries,
  onToggleParty,
  onDelete,
  onAddMessage,
  messages,
}: {
  month: number;
  entries: BirthdayCalendarEntry[];
  onToggleParty: (id: string) => void;
  onDelete: (id: string) => void;
  onAddMessage: (entryId: string, author: string, content: string) => void;
  messages: ReturnType<typeof useBirthdayCalendarLocal>["messages"];
}) {
  const [open, setOpen] = useState(true);
  const currentMonth = new Date().getMonth() + 1;
  const isCurrentMonth = month === currentMonth;

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
            {entries.length}
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
            <EntryItem
              key={entry.id}
              entry={entry}
              onToggleParty={() => onToggleParty(entry.id)}
              onDelete={() => onDelete(entry.id)}
              onAddMessage={(author, content) =>
                onAddMessage(entry.id, author, content)
              }
              messages={messages}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ─── 메인 카드 ────────────────────────────────────────────────
interface BirthdayCalendarCardProps {
  groupId: string;
}

export function BirthdayCalendarCard({ groupId }: BirthdayCalendarCardProps) {
  const [open, setOpen] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  const {
    entries,
    messages,
    loading,
    upcomingBirthdays,
    todayBirthdays,
    byMonth,
    addEntry,
    deleteEntry,
    togglePartyPlanned,
    addMessage,
  } = useBirthdayCalendarLocal(groupId);

  function handleDelete(entryId: string) {
    deleteEntry(entryId);
    toast.success("생일 정보가 삭제되었습니다.");
  }

  function handleAddMessage(entryId: string, author: string, content: string) {
    addMessage({ entryId, author, content });
  }

  const sortedMonths = Object.keys(byMonth)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      {/* 헤더 */}
      <div className="flex items-center justify-between rounded-t-lg border border-b-0 border-gray-200 bg-white px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Cake className="h-4 w-4 text-pink-500" />
          <span className="text-sm font-semibold text-gray-800">
            생일 캘린더
          </span>
          {entries.length > 0 && (
            <Badge className="bg-pink-100 text-[10px] px-1.5 py-0 text-pink-600 hover:bg-pink-100">
              {entries.length}명
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
            onClick={() => setShowAddForm((v) => !v)}
          >
            <Plus className="mr-0.5 h-3 w-3" />
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
        <div className="rounded-b-lg border border-gray-200 bg-white p-4">
          {/* 로딩 */}
          {loading && (
            <div className="py-6 text-center text-xs text-gray-400">
              불러오는 중...
            </div>
          )}

          {!loading && (
            <>
              {/* 다가오는 생일 (30일 이내) */}
              {upcomingBirthdays.length > 0 && (
                <div className="mb-4">
                  <p className="mb-2 flex items-center gap-1 text-xs font-semibold text-gray-700">
                    <Gift className="h-3.5 w-3.5 text-orange-400" />
                    다가오는 생일
                  </p>
                  <div className="space-y-1.5">
                    {upcomingBirthdays.map((entry) => {
                      const { text: dDayText, color: dDayColor } = getDDayLabel(
                        entry.dDay
                      );
                      return (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between rounded-md bg-orange-50 px-3 py-1.5"
                        >
                          <div className="flex items-center gap-2">
                            <Cake className="h-3.5 w-3.5 text-orange-400" />
                            <span className="text-xs font-medium text-gray-700">
                              {entry.name}
                            </span>
                            <span className="text-[11px] text-gray-400">
                              {formatMonthDay(entry.birthday)}
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

              {/* 생일 추가 폼 */}
              {showAddForm && (
                <div className="mb-4">
                  <AddEntryForm onAdd={addEntry} />
                  <Separator className="mt-4 mb-0" />
                </div>
              )}

              {/* 월별 목록 */}
              {sortedMonths.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {sortedMonths.map((month) => (
                    <MonthSection
                      key={month}
                      month={month}
                      entries={byMonth[month] ?? []}
                      onToggleParty={togglePartyPlanned}
                      onDelete={handleDelete}
                      onAddMessage={handleAddMessage}
                      messages={messages}
                    />
                  ))}
                </div>
              ) : (
                !showAddForm && (
                  <div className="flex flex-col items-center justify-center gap-2 py-8 text-gray-400">
                    <Cake className="h-10 w-10 opacity-20" />
                    <p className="text-xs">등록된 생일 정보가 없습니다.</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-1 h-7 text-xs"
                      onClick={() => setShowAddForm(true)}
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      첫 번째 생일 추가하기
                    </Button>
                  </div>
                )
              )}
            </>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
