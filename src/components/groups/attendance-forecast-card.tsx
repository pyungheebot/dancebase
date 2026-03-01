"use client";

import { useState } from "react";
import {
  UserCheck,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  CalendarDays,
  MapPin,
  Clock,
  ChevronRight,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAttendanceForecastSessions } from "@/hooks/use-attendance-forecast-sessions";
import type { AttendanceForecastSession, AttendanceForecastIntent } from "@/types";
import { formatYearMonthDay } from "@/lib/date-utils";

// ─── 날짜 포맷 헬퍼 ──────────────────────────────────────────


function isUpcoming(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dateStr) >= today;
}

// ─── 인텐트 표시 헬퍼 ─────────────────────────────────────────

const INTENT_LABELS: Record<AttendanceForecastIntent, string> = {
  yes: "참석",
  maybe: "미정",
  no: "불참",
  pending: "미응답",
};

const INTENT_COLORS: Record<AttendanceForecastIntent, string> = {
  yes: "bg-green-100 text-green-700",
  maybe: "bg-yellow-100 text-yellow-700",
  no: "bg-red-100 text-red-600",
  pending: "bg-gray-100 text-gray-500",
};

const INTENT_BAR_COLORS: Record<AttendanceForecastIntent, string> = {
  yes: "bg-green-400",
  maybe: "bg-yellow-400",
  no: "bg-red-400",
  pending: "bg-gray-200",
};

// ─── 세션 추가 다이얼로그 ─────────────────────────────────────

interface SessionForm {
  title: string;
  date: string;
  time: string;
  location: string;
}

function emptyForm(): SessionForm {
  const today = new Date();
  const dateStr = today.toISOString().split("T")[0];
  return { title: "", date: dateStr, time: "", location: "" };
}

function AddSessionDialog({
  currentMemberName,
  onAdd,
}: {
  currentMemberName: string;
  onAdd: (
    payload: Omit<AttendanceForecastSession, "id" | "responses" | "createdAt">
  ) => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<SessionForm>(emptyForm());

  function handleSubmit() {
    if (!form.title.trim()) {
      toast.error("세션 제목을 입력해주세요.");
      return;
    }
    if (!form.date) {
      toast.error("날짜를 선택해주세요.");
      return;
    }
    onAdd({
      title: form.title.trim(),
      date: form.date,
      time: form.time.trim() || undefined,
      location: form.location.trim() || undefined,
      createdBy: currentMemberName,
    });
    setOpen(false);
    setForm(emptyForm());
    toast.success("연습 세션이 추가되었습니다.");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 text-xs gap-1">
          <Plus className="h-3 w-3" />
          세션 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">연습 세션 추가</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          {/* 제목 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">
              세션 제목 <span className="text-red-400">*</span>
            </label>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="예) 정기 연습, 공연 리허설"
              className="text-xs h-8"
              autoFocus
            />
          </div>

          {/* 날짜 + 시간 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">
                날짜 <span className="text-red-400">*</span>
              </label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="text-xs h-8"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">시간</label>
              <Input
                type="time"
                value={form.time}
                onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                className="text-xs h-8"
              />
            </div>
          </div>

          {/* 장소 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">장소</label>
            <Input
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              placeholder="예) 연습실 A, 홍대 스튜디오"
              className="text-xs h-8"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => setOpen(false)}
            >
              취소
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
              추가
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── 빠른 응답 버튼 ───────────────────────────────────────────

function QuickResponseButtons({
  sessionId,
  memberName,
  currentIntent,
  onRespond,
}: {
  sessionId: string;
  memberName: string;
  currentIntent: AttendanceForecastIntent | null;
  onRespond: (
    sessionId: string,
    memberName: string,
    intent: AttendanceForecastIntent,
    reason?: string
  ) => void;
}) {
  const [reasonOpen, setReasonOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pendingIntent, setPendingIntent] = useState<AttendanceForecastIntent | null>(null);

  function handleClick(intent: AttendanceForecastIntent) {
    if (intent === "no") {
      setPendingIntent("no");
      setReasonOpen(true);
      return;
    }
    onRespond(sessionId, memberName, intent);
    toast.success(`${INTENT_LABELS[intent]}으로 응답했습니다.`);
  }

  function handleReasonSubmit() {
    if (!pendingIntent) return;
    onRespond(sessionId, memberName, pendingIntent, reason || undefined);
    toast.success(`${INTENT_LABELS[pendingIntent]}으로 응답했습니다.`);
    setReasonOpen(false);
    setReason("");
    setPendingIntent(null);
  }

  const buttons: { intent: AttendanceForecastIntent; label: string; cls: string }[] = [
    {
      intent: "yes",
      label: "참석",
      cls:
        currentIntent === "yes"
          ? "bg-green-500 text-white border-green-500"
          : "border-green-200 text-green-600 hover:bg-green-50",
    },
    {
      intent: "maybe",
      label: "미정",
      cls:
        currentIntent === "maybe"
          ? "bg-yellow-400 text-white border-yellow-400"
          : "border-yellow-200 text-yellow-600 hover:bg-yellow-50",
    },
    {
      intent: "no",
      label: "불참",
      cls:
        currentIntent === "no"
          ? "bg-red-500 text-white border-red-500"
          : "border-red-200 text-red-500 hover:bg-red-50",
    },
  ];

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        {buttons.map((b) => (
          <button
            key={b.intent}
            onClick={() => handleClick(b.intent)}
            className={`text-[10px] font-medium px-2.5 py-1 rounded-md border transition-colors ${b.cls}`}
          >
            {b.label}
          </button>
        ))}
      </div>

      {/* 불참 사유 입력 */}
      {reasonOpen && (
        <div className="space-y-1.5 p-2 bg-red-50 rounded-lg border border-red-100">
          <p className="text-[10px] text-red-600 font-medium">불참 사유 (선택)</p>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="사유를 입력해주세요..."
            className="text-xs min-h-[48px] resize-none bg-background"
            autoFocus
          />
          <div className="flex gap-1.5 justify-end">
            <Button
              size="sm"
              variant="outline"
              className="h-6 text-[10px]"
              onClick={() => {
                setReasonOpen(false);
                setReason("");
                setPendingIntent(null);
              }}
            >
              취소
            </Button>
            <Button size="sm" className="h-6 text-[10px] bg-red-500 hover:bg-red-600" onClick={handleReasonSubmit}>
              확인
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 응답 현황 바 ─────────────────────────────────────────────

function ResponseBar({
  yes,
  maybe,
  no,
  total,
}: {
  yes: number;
  maybe: number;
  no: number;
  total: number;
}) {
  if (total === 0) {
    return (
      <div className="h-2 bg-gray-100 rounded-full w-full" />
    );
  }

  const pending = total - yes - maybe - no;

  const segments: { key: string; count: number; color: string }[] = [
    { key: "yes", count: yes, color: "bg-green-400" },
    { key: "maybe", count: maybe, color: "bg-yellow-400" },
    { key: "no", count: no, color: "bg-red-400" },
    { key: "pending", count: pending, color: "bg-gray-200" },
  ].filter((s) => s.count > 0);

  return (
    <div className="flex h-2 rounded-full overflow-hidden gap-px">
      {segments.map((s) => (
        <div
          key={s.key}
          className={`${s.color} transition-all`}
          style={{ width: `${(s.count / total) * 100}%` }}
        />
      ))}
    </div>
  );
}

// ─── 응답자 목록 ──────────────────────────────────────────────

function ResponseList({
  responses,
  memberNames,
}: {
  responses: AttendanceForecastSession["responses"];
  memberNames: string[];
}) {
  const [expanded, setExpanded] = useState(false);

  const respondedNames = new Set(responses.map((r) => r.memberName));
  const pendingNames = memberNames.filter((n) => !respondedNames.has(n));

  const allItems = [
    ...responses.map((r) => ({ name: r.memberName, intent: r.intent as AttendanceForecastIntent, reason: r.reason })),
    ...pendingNames.map((n) => ({ name: n, intent: "pending" as AttendanceForecastIntent, reason: undefined })),
  ];

  if (allItems.length === 0) return null;

  return (
    <div className="space-y-1">
      <button
        className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-gray-700 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <Users className="h-3 w-3" />
        응답자 목록
        <ChevronRight
          className={`h-3 w-3 transition-transform ${expanded ? "rotate-90" : ""}`}
        />
      </button>

      {expanded && (
        <div className="space-y-1 pl-1">
          {allItems.map((item) => (
            <div
              key={item.name}
              className="flex items-start gap-2 py-0.5"
            >
              <Badge
                className={`text-[10px] px-1.5 py-0 shrink-0 ${INTENT_COLORS[item.intent]}`}
              >
                {INTENT_LABELS[item.intent]}
              </Badge>
              <div className="min-w-0">
                <span className="text-[10px] text-gray-700 font-medium">
                  {item.name}
                </span>
                {item.reason && (
                  <p className="text-[10px] text-gray-400 truncate">
                    {item.reason}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 세션 카드 ────────────────────────────────────────────────

function SessionItem({
  session,
  memberNames,
  currentMemberName,
  onRespond,
  onDelete,
  getStats,
}: {
  session: AttendanceForecastSession;
  memberNames: string[];
  currentMemberName: string;
  onRespond: (
    sessionId: string,
    memberName: string,
    intent: AttendanceForecastIntent,
    reason?: string
  ) => void;
  onDelete: (sessionId: string) => void;
  getStats: (id: string) => { yes: number; maybe: number; no: number; pending: number; total: number };
}) {
  const stats = getStats(session.id);
  const upcoming = isUpcoming(session.date);

  const myResponse = currentMemberName
    ? session.responses.find((r) => r.memberName === currentMemberName)
    : null;

  // 예상 참석률 계산: yes + maybe * 0.5 / 응답자 수 (미응답 제외)
  const responded = stats.yes + stats.maybe + stats.no;
  const forecastRate =
    responded > 0
      ? Math.round(((stats.yes + stats.maybe * 0.5) / responded) * 100)
      : null;

  // 전체 멤버 수(응답자 + 미응답자)
  const totalWithPending =
    memberNames.length > 0
      ? memberNames.length
      : stats.total;

  return (
    <div
      className={`border rounded-lg overflow-hidden ${
        upcoming ? "border-blue-100" : "border-gray-100"
      }`}
    >
      {/* 세션 헤더 */}
      <div
        className={`px-3 py-2.5 ${upcoming ? "bg-blue-50/50" : "bg-gray-50/50"}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-semibold text-gray-800 truncate">
                {session.title}
              </span>
              {upcoming ? (
                <Badge className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-600 hover:bg-blue-100 shrink-0">
                  예정
                </Badge>
              ) : (
                <Badge className="text-[10px] px-1.5 py-0 bg-gray-100 text-gray-500 hover:bg-gray-100 shrink-0">
                  완료
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="flex items-center gap-0.5 text-[10px] text-gray-500">
                <CalendarDays className="h-2.5 w-2.5" />
                {formatYearMonthDay(session.date)}
              </span>
              {session.time && (
                <span className="flex items-center gap-0.5 text-[10px] text-gray-500">
                  <Clock className="h-2.5 w-2.5" />
                  {session.time}
                </span>
              )}
              {session.location && (
                <span className="flex items-center gap-0.5 text-[10px] text-gray-500 truncate">
                  <MapPin className="h-2.5 w-2.5 shrink-0" />
                  {session.location}
                </span>
              )}
            </div>
          </div>

          {/* 삭제 버튼 */}
          <button
            onClick={() => {
              onDelete(session.id);
              toast.success("세션이 삭제되었습니다.");
            }}
            className="text-gray-200 hover:text-red-400 transition-colors shrink-0 mt-0.5"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* 응답 현황 */}
      <div className="px-3 py-2.5 space-y-2.5">
        {/* 현황 바 */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              {(["yes", "maybe", "no", "pending"] as AttendanceForecastIntent[]).map(
                (intent) => {
                  const count =
                    intent === "pending"
                      ? Math.max(
                          0,
                          totalWithPending - stats.yes - stats.maybe - stats.no
                        )
                      : stats[intent];
                  if (count === 0 && intent !== "pending") return null;
                  return (
                    <span
                      key={intent}
                      className="flex items-center gap-0.5 text-[10px] text-gray-500"
                    >
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${INTENT_BAR_COLORS[intent]}`}
                      />
                      {INTENT_LABELS[intent]} {count}
                    </span>
                  );
                }
              )}
            </div>
            {forecastRate !== null && (
              <span className="text-[10px] font-semibold text-blue-600">
                예상 {forecastRate}%
              </span>
            )}
          </div>
          <ResponseBar
            yes={stats.yes}
            maybe={stats.maybe}
            no={stats.no}
            total={totalWithPending}
          />
        </div>

        {/* 빠른 응답 (예정 세션 + 멤버 이름 있을 때만) */}
        {upcoming && currentMemberName && (
          <div className="space-y-1">
            <p className="text-[10px] text-gray-400">
              {myResponse
                ? `현재 응답: ${INTENT_LABELS[myResponse.intent]}`
                : "아직 응답하지 않았습니다."}
            </p>
            <QuickResponseButtons
              sessionId={session.id}
              memberName={currentMemberName}
              currentIntent={myResponse?.intent ?? null}
              onRespond={onRespond}
            />
          </div>
        )}

        {/* 응답자 목록 */}
        <ResponseList
          responses={session.responses}
          memberNames={memberNames}
        />
      </div>
    </div>
  );
}

// ─── 메인 카드 ────────────────────────────────────────────────

export function AttendanceForecastCard({
  groupId,
  memberNames = [],
  currentMemberName = "",
}: {
  groupId: string;
  memberNames?: string[];
  currentMemberName?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const {
    sessions,
    addSession,
    deleteSession,
    respond,
    getSessionStats,
    stats,
  } = useAttendanceForecastSessions(groupId);

  const upcomingList = sessions.filter((s) => isUpcoming(s.date));
  const pastList = sessions.filter((s) => !isUpcoming(s.date));

  const resolvedMemberName = currentMemberName.trim();

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="border border-gray-100 rounded-xl bg-card shadow-sm">
        {/* 헤더 */}
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 rounded-xl transition-colors">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-semibold text-gray-800">
                그룹 연습 출석 예측
              </span>
              {stats.upcomingSessions > 0 && (
                <Badge className="text-[10px] px-1.5 py-0 bg-blue-50 text-blue-600 hover:bg-blue-50">
                  예정 {stats.upcomingSessions}건
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {stats.averageYesRate > 0 && (
                <span className="hidden sm:block text-[10px] text-gray-400 mr-1">
                  평균 참석률{" "}
                  <span className="font-semibold text-gray-600">
                    {stats.averageYesRate}%
                  </span>
                </span>
              )}
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <Separator />
          <div className="p-4 space-y-4">
            {/* 통계 요약 */}
            {stats.totalSessions > 0 && (
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-blue-50 rounded-lg px-3 py-2 text-center">
                  <p className="text-base font-bold text-blue-600">
                    {stats.totalSessions}
                  </p>
                  <p className="text-[10px] text-blue-500">전체 세션</p>
                </div>
                <div className="bg-green-50 rounded-lg px-3 py-2 text-center">
                  <p className="text-base font-bold text-green-600">
                    {stats.upcomingSessions}
                  </p>
                  <p className="text-[10px] text-green-500">예정 세션</p>
                </div>
                <div className="bg-purple-50 rounded-lg px-3 py-2 text-center">
                  <p className="text-base font-bold text-purple-600">
                    {stats.averageYesRate}%
                  </p>
                  <p className="text-[10px] text-purple-500">평균 참석률</p>
                </div>
              </div>
            )}

            {/* 예정 세션 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-600">
                  예정 세션{" "}
                  <span className="font-normal text-gray-400">
                    ({upcomingList.length}건)
                  </span>
                </p>
                <AddSessionDialog
                  currentMemberName={resolvedMemberName || "운영자"}
                  onAdd={addSession}
                />
              </div>

              {upcomingList.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-gray-200 rounded-lg">
                  <CalendarDays className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">예정된 세션이 없습니다.</p>
                  <p className="text-[10px] text-gray-300 mt-0.5">
                    세션 추가 버튼을 눌러 연습 일정을 등록해보세요.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {upcomingList.map((s) => (
                    <SessionItem
                      key={s.id}
                      session={s}
                      memberNames={memberNames}
                      currentMemberName={resolvedMemberName}
                      onRespond={respond}
                      onDelete={deleteSession}
                      getStats={getSessionStats}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* 지난 세션 */}
            {pastList.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-400">
                    지난 세션 ({pastList.length}건)
                  </p>
                  <div className="space-y-2">
                    {pastList.map((s) => (
                      <SessionItem
                        key={s.id}
                        session={s}
                        memberNames={memberNames}
                        currentMemberName={resolvedMemberName}
                        onRespond={respond}
                        onDelete={deleteSession}
                        getStats={getSessionStats}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
