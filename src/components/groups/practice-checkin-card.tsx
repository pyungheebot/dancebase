"use client";

import { useState } from "react";
import {
  UserCheck,
  ChevronDown,
  ChevronUp,
  Plus,
  Check,
  LogOut,
  X,
  Clock,
  CalendarIcon,
  Trash2,
  Users,
  StopCircle,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
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
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { usePracticeCheckin } from "@/hooks/use-practice-checkin";
import type { PracticeCheckinSession, PracticeCheckinRecord } from "@/types";

// ============================================
// Props
// ============================================

type Props = {
  groupId: string;
  memberNames: string[];
};

// ============================================
// 상태 메타
// ============================================

const STATUS_META = {
  checked_in: {
    label: "체크인",
    icon: Check,
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200",
    badgeClass: "bg-green-100 text-green-700",
  },
  checked_out: {
    label: "체크아웃",
    icon: LogOut,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    badgeClass: "bg-blue-100 text-blue-700",
  },
  absent: {
    label: "결석",
    icon: X,
    color: "text-red-500",
    bg: "bg-red-50",
    border: "border-red-200",
    badgeClass: "bg-red-100 text-red-600",
  },
  pending: {
    label: "대기",
    icon: Clock,
    color: "text-gray-400",
    bg: "bg-gray-50",
    border: "border-gray-200",
    badgeClass: "bg-gray-100 text-gray-500",
  },
} as const;

// ============================================
// 멤버 상태 타일
// ============================================

function MemberTile({
  memberName,
  record,
  session,
  onCheckin,
  onCheckout,
  onMarkAbsent,
}: {
  memberName: string;
  record: PracticeCheckinRecord | undefined;
  session: PracticeCheckinSession;
  onCheckin: () => void;
  onCheckout: () => void;
  onMarkAbsent: () => void;
}) {
  const statusKey = record?.status ?? "pending";
  // "pending" 은 STATUS_META에 직접 있으므로 타입 단언 필요
  const meta =
    statusKey === "pending"
      ? STATUS_META.pending
      : STATUS_META[statusKey as keyof typeof STATUS_META];

  const StatusIcon = meta.icon;

  const handleClick = () => {
    if (!session.isActive) return;
    if (!record || statusKey === "pending") {
      onCheckin();
    } else if (statusKey === "checked_in") {
      onCheckout();
    } else if (statusKey === "checked_out") {
      onCheckin();
    } else if (statusKey === "absent") {
      onCheckin();
    }
  };

  return (
    <div
      className={cn(
        "rounded-lg border p-2 cursor-pointer transition-all",
        meta.bg,
        meta.border,
        session.isActive && "hover:opacity-80 active:scale-95"
      )}
      onClick={handleClick}
      title={
        session.isActive
          ? statusKey === "pending"
            ? "클릭하여 체크인"
            : statusKey === "checked_in"
            ? "클릭하여 체크아웃"
            : "클릭하여 체크인"
          : undefined
      }
    >
      <div className="flex items-center justify-between gap-1 mb-1">
        <span className="text-xs font-medium text-gray-800 truncate max-w-[80px]">
          {memberName}
        </span>
        <StatusIcon className={cn("h-3 w-3 shrink-0", meta.color)} />
      </div>
      <div className="flex items-center gap-1 flex-wrap">
        <span
          className={cn(
            "text-[10px] px-1.5 py-0 rounded-full font-medium",
            meta.badgeClass
          )}
        >
          {meta.label}
        </span>
        {record?.lateMinutes != null && record.lateMinutes > 0 && (
          <span className="text-[10px] text-orange-500 font-medium">
            +{record.lateMinutes}분
          </span>
        )}
      </div>
      {record?.checkinTime && (
        <p className="text-[10px] text-gray-400 mt-0.5">{record.checkinTime}</p>
      )}
      {/* 결석 버튼 (활성 세션 + 대기/체크인 상태만) */}
      {session.isActive && statusKey !== "absent" && (
        <button
          className="mt-1 text-[10px] text-red-400 hover:text-red-600 underline"
          onClick={(e) => {
            e.stopPropagation();
            onMarkAbsent();
          }}
        >
          결석
        </button>
      )}
    </div>
  );
}

// ============================================
// 과거 세션 행
// ============================================

function PastSessionRow({
  session,
  records,
  memberNames,
  onDelete,
}: {
  session: PracticeCheckinSession;
  records: PracticeCheckinRecord[];
  memberNames: string[];
  onDelete: () => void;
}) {
  const total = memberNames.length;
  const attended = records.filter(
    (r) => r.status === "checked_in" || r.status === "checked_out"
  ).length;
  const rate = total > 0 ? Math.round((attended / total) * 100) : 0;
  const absent = records.filter((r) => r.status === "absent").length;

  return (
    <div className="border rounded-lg p-3 bg-gray-50">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <p className="text-xs font-medium text-gray-800">{session.title}</p>
          <p className="text-[10px] text-gray-500">
            {session.date} · {session.startTime}
            {session.endTime ? ` ~ ${session.endTime}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-gray-500">
            {attended}/{total}명
          </span>
          <button
            onClick={onDelete}
            className="text-gray-300 hover:text-red-400 transition-colors"
            title="세션 삭제"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-gray-500">출석률</span>
          <span className="text-[10px] font-medium text-gray-700">
            {rate}%
            {absent > 0 && (
              <span className="text-red-400 ml-1">· 결석 {absent}명</span>
            )}
          </span>
        </div>
        <Progress value={rate} className="h-1.5" />
      </div>
      {/* 지각자 표시 */}
      {records.some((r) => (r.lateMinutes ?? 0) > 0) && (
        <div className="mt-2 flex flex-wrap gap-1">
          {records
            .filter((r) => (r.lateMinutes ?? 0) > 0)
            .map((r) => (
              <span
                key={r.id}
                className="text-[10px] bg-orange-50 text-orange-600 border border-orange-200 rounded-full px-1.5 py-0"
              >
                {r.memberName} +{r.lateMinutes}분
              </span>
            ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// 세션 생성 다이얼로그
// ============================================

function CreateSessionDialog({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (date: string, title: string, startTime: string) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const nowTime = new Date().toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const [date, setDate] = useState(today);
  const [title, setTitle] = useState("정기 연습");
  const [startTime, setStartTime] = useState(nowTime);

  const handleSubmit = () => {
    if (!date || !title.trim() || !startTime) {
      toast.error("날짜, 제목, 시작 시간을 모두 입력해주세요.");
      return;
    }
    onCreate(date, title.trim(), startTime);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            연습 세션 시작
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs">날짜</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">세션 제목</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 정기 연습, 특별 연습..."
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">시작 시간</Label>
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={onClose}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            세션 시작
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 메인 카드 컴포넌트
// ============================================

export function PracticeCheckinCard({ groupId, memberNames }: Props) {
  const [isOpen, setIsOpen] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [showPastSessions, setShowPastSessions] = useState(false);

  const {
    sessions,

    activeSession,
    totalSessions,
    averageAttendanceRate,
    createSession,
    endSession,
    deleteSession,
    checkin,
    checkout,
    markAbsent,
    getSessionRecords,
  } = usePracticeCheckin(groupId);

  const pastSessions = sessions.filter((s) => !s.isActive);

  // ─── 핸들러 ─────────────────────────────────────────
  const handleCreateSession = (
    date: string,
    title: string,
    startTime: string
  ) => {
    createSession(date, title, startTime);
    toast.success("연습 세션이 시작되었습니다.");
  };

  const handleEndSession = (sessionId: string) => {
    endSession(sessionId);
    toast.success("세션이 종료되었습니다.");
  };

  const handleDeleteSession = (sessionId: string) => {
    deleteSession(sessionId);
    toast.success("세션이 삭제되었습니다.");
  };

  const handleCheckin = (sessionId: string, memberName: string) => {
    checkin(sessionId, memberName);
    toast.success(`${memberName} 체크인 완료`);
  };

  const handleCheckout = (sessionId: string, memberName: string) => {
    checkout(sessionId, memberName);
    toast.success(`${memberName} 체크아웃 완료`);
  };

  const handleMarkAbsent = (sessionId: string, memberName: string) => {
    markAbsent(sessionId, memberName);
    toast.error(`${memberName} 결석 처리`);
  };

  // ─── 활성 세션 출석 통계 ────────────────────────────
  const activeRecords = activeSession
    ? getSessionRecords(activeSession.id)
    : [];
  const checkedInCount = activeRecords.filter(
    (r) => r.status === "checked_in" || r.status === "checked_out"
  ).length;
  const totalMembers = memberNames.length;

  return (
    <>
      <Card className="w-full">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          {/* ─ 헤더 ─ */}
          <CardHeader className="pb-2 pt-3 px-4">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer select-none">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-semibold text-gray-800">
                    연습 체크인
                  </span>
                  {activeSession && (
                    <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 border-green-200">
                      진행 중
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {/* 세션 없을 때 요약 통계 */}
                  {!activeSession && totalSessions > 0 && (
                    <span className="text-[10px] text-gray-400">
                      평균 {averageAttendanceRate}%
                    </span>
                  )}
                  {/* 활성 세션 시 출석 현황 */}
                  {activeSession && (
                    <span className="text-[10px] text-green-600 font-medium">
                      {checkedInCount}/{totalMembers}명
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
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="px-4 pb-4 space-y-4">
              {/* ─ 활성 세션 없을 때 ─ */}
              {!activeSession && (
                <div className="text-center py-4 space-y-3">
                  <div className="flex flex-col items-center gap-1">
                    <UserCheck className="h-8 w-8 text-gray-300" />
                    <p className="text-xs text-gray-400">
                      진행 중인 연습 세션이 없습니다
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => setCreateDialogOpen(true)}
                  >
                    <Plus className="h-3 w-3" />
                    세션 시작
                  </Button>
                </div>
              )}

              {/* ─ 활성 세션 ─ */}
              {activeSession && (
                <div className="space-y-3">
                  {/* 세션 정보 헤더 */}
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    <div>
                      <p className="text-xs font-semibold text-green-800">
                        {activeSession.title}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <CalendarIcon className="h-3 w-3 text-green-600" />
                        <span className="text-[10px] text-green-600">
                          {activeSession.date}
                        </span>
                        <Clock className="h-3 w-3 text-green-600 ml-1" />
                        <span className="text-[10px] text-green-600">
                          {activeSession.startTime} 시작
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 text-[10px] px-2 border-green-300 text-green-700 hover:bg-green-100 gap-1"
                      onClick={() => handleEndSession(activeSession.id)}
                    >
                      <StopCircle className="h-3 w-3" />
                      종료
                    </Button>
                  </div>

                  {/* 전체 체크인 버튼 */}
                  {memberNames.length > 0 && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs flex-1 gap-1 border-green-300 text-green-700 hover:bg-green-50"
                        onClick={() => {
                          memberNames.forEach((name) => {
                            const rec = activeRecords.find(
                              (r) => r.memberName === name
                            );
                            if (!rec || rec.status === "absent") {
                              checkin(activeSession.id, name);
                            }
                          });
                          toast.success("전원 체크인 완료");
                        }}
                      >
                        <Users className="h-3 w-3" />
                        전원 체크인
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs flex-1 gap-1 border-red-300 text-red-600 hover:bg-red-50"
                        onClick={() => {
                          memberNames.forEach((name) => {
                            const rec = activeRecords.find(
                              (r) => r.memberName === name
                            );
                            if (!rec || rec.status !== "absent") {
                              markAbsent(activeSession.id, name);
                            }
                          });
                          toast.error("전원 결석 처리");
                        }}
                      >
                        <AlertTriangle className="h-3 w-3" />
                        전원 결석
                      </Button>
                    </div>
                  )}

                  {/* 멤버 그리드 */}
                  {memberNames.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {memberNames.map((name) => {
                        const rec = activeRecords.find(
                          (r) => r.memberName === name
                        );
                        return (
                          <MemberTile
                            key={name}
                            memberName={name}
                            record={rec}
                            session={activeSession}
                            onCheckin={() =>
                              handleCheckin(activeSession.id, name)
                            }
                            onCheckout={() =>
                              handleCheckout(activeSession.id, name)
                            }
                            onMarkAbsent={() =>
                              handleMarkAbsent(activeSession.id, name)
                            }
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 text-center py-2">
                      멤버 목록이 없습니다.
                    </p>
                  )}

                  {/* 출석 진행 바 */}
                  {totalMembers > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-500">
                          출석 현황
                        </span>
                        <span className="text-[10px] font-medium text-gray-700">
                          {checkedInCount}/{totalMembers}명 (
                          {Math.round((checkedInCount / totalMembers) * 100)}%)
                        </span>
                      </div>
                      <Progress
                        value={Math.round(
                          (checkedInCount / totalMembers) * 100
                        )}
                        className="h-1.5"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* ─ 새 세션 시작 버튼 (활성 세션 있을 때도 보임) ─ */}
              {activeSession && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs w-full gap-1 text-gray-500"
                  onClick={() => setCreateDialogOpen(true)}
                >
                  <Plus className="h-3 w-3" />
                  새 세션 시작 (현재 세션 종료 후)
                </Button>
              )}

              {/* ─ 과거 세션 목록 ─ */}
              {pastSessions.length > 0 && (
                <div className="space-y-2">
                  <button
                    className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-gray-700 transition-colors"
                    onClick={() => setShowPastSessions((v) => !v)}
                  >
                    {showPastSessions ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                    과거 세션 {pastSessions.length}개
                    {!activeSession && (
                      <span className="ml-1 text-gray-400">
                        · 평균 출석률 {averageAttendanceRate}%
                      </span>
                    )}
                  </button>
                  {showPastSessions && (
                    <div className="space-y-2">
                      {pastSessions.map((session) => (
                        <PastSessionRow
                          key={session.id}
                          session={session}
                          records={getSessionRecords(session.id)}
                          memberNames={memberNames}
                          onDelete={() => handleDeleteSession(session.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* ─ 세션 생성 다이얼로그 ─ */}
      <CreateSessionDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onCreate={handleCreateSession}
      />
    </>
  );
}
