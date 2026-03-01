"use client";

import { useState } from "react";
import { usePerformanceCheckin } from "@/hooks/use-performance-checkin";
import type { CheckinMember, CheckinStatus, PerformanceCheckinEvent } from "@/types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChevronDown,
  ChevronRight,
  UserCheck,
  Plus,
  Trash2,
  ChevronRight as ArrowRight,
  Clock,
  CheckCircle2,
  Circle,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

// ============================================
// 상태 레이블 / 색상 헬퍼
// ============================================

function statusLabel(status: CheckinStatus): string {
  switch (status) {
    case "pending":
      return "대기";
    case "arrived":
      return "도착";
    case "costume_ready":
      return "복장 완료";
    case "stage_ready":
      return "무대 준비";
  }
}

function statusBadgeClass(status: CheckinStatus): string {
  switch (status) {
    case "pending":
      return "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100";
    case "arrived":
      return "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100";
    case "costume_ready":
      return "bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100";
    case "stage_ready":
      return "bg-green-100 text-green-700 border-green-200 hover:bg-green-100";
  }
}

function progressBarClass(status: CheckinStatus): string {
  switch (status) {
    case "pending":
      return "bg-gray-300";
    case "arrived":
      return "bg-blue-400";
    case "costume_ready":
      return "bg-orange-400";
    case "stage_ready":
      return "bg-green-500";
  }
}

function statusWidth(status: CheckinStatus): number {
  switch (status) {
    case "pending":
      return 0;
    case "arrived":
      return 33;
    case "costume_ready":
      return 66;
    case "stage_ready":
      return 100;
  }
}

function isFinalStatus(status: CheckinStatus): boolean {
  return status === "stage_ready";
}

// ============================================
// 이벤트 생성 다이얼로그
// ============================================

interface CreateEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (eventName: string, eventDate: string, callTime: string) => void;
}

function CreateEventDialog({
  open,
  onOpenChange,
  onSubmit,
}: CreateEventDialogProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState(today);
  const [callTime, setCallTime] = useState("18:00");

  const resetForm = () => {
    setEventName("");
    setEventDate(today);
    setCallTime("18:00");
  };

  const handleSubmit = () => {
    if (!eventName.trim()) {
      toast.error(TOAST.CHECKIN_EVENT.NAME_REQUIRED);
      return;
    }
    if (!eventDate) {
      toast.error(TOAST.CHECKIN_EVENT.DATE_REQUIRED);
      return;
    }
    if (!callTime) {
      toast.error(TOAST.CHECKIN_EVENT.GATHERING_TIME_REQUIRED);
      return;
    }
    onSubmit(eventName.trim(), eventDate, callTime);
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            공연 체크인 이벤트 생성
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-1">
          {/* 이벤트명 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">이벤트명 *</Label>
            <Input
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="예: 2026 봄 공연"
              className="h-7 text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
          </div>

          {/* 날짜 + 집합 시간 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">공연 날짜 *</Label>
              <Input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="h-7 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">집합 시간 *</Label>
              <Input
                type="time"
                value={callTime}
                onChange={(e) => setCallTime(e.target.value)}
                className="h-7 text-xs"
              />
            </div>
          </div>

          <div className="flex gap-1.5 justify-end pt-0.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
            >
              취소
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
              생성
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 멤버 행 컴포넌트
// ============================================

interface MemberRowProps {
  member: CheckinMember;
  onUpdateStatus: (memberId: string) => void;
  onToggleReady: (memberId: string) => void;
}

function MemberRow({ member, onUpdateStatus, onToggleReady }: MemberRowProps) {
  const final = isFinalStatus(member.status);

  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-md border bg-card hover:bg-muted/20 transition-colors">
      {/* 준비 완료 토글 버튼 */}
      <button
        onClick={() => onToggleReady(member.id)}
        className="flex-shrink-0"
        aria-label={member.isReady ? "준비 해제" : "준비 완료"}
        title={member.isReady ? "준비 해제" : "준비 완료 표시"}
      >
        {member.isReady ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
        ) : (
          <Circle className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>

      {/* 이름 */}
      <span className="text-xs font-medium flex-1 min-w-0 truncate">
        {member.memberName}
      </span>

      {/* 상태 프로그레스 바 */}
      <div className="flex flex-col gap-0.5 w-20 flex-shrink-0">
        <div className="relative h-1 rounded-full bg-muted overflow-hidden">
          <div
            className={`absolute left-0 top-0 h-full rounded-full transition-all duration-300 ${progressBarClass(member.status)}`}
            style={{ width: `${statusWidth(member.status)}%` }}
          />
        </div>
      </div>

      {/* 상태 배지 */}
      <Badge
        variant="outline"
        className={`text-[10px] px-1.5 py-0 flex-shrink-0 ${statusBadgeClass(member.status)}`}
      >
        {statusLabel(member.status)}
      </Badge>

      {/* 도착 시간 */}
      {member.arrivedAt && (
        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 flex-shrink-0">
          <Clock className="h-2.5 w-2.5" />
          {new Date(member.arrivedAt).toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })}
        </span>
      )}

      {/* 상태 변경 버튼 */}
      <Button
        variant="outline"
        size="sm"
        className={`h-6 text-[10px] px-1.5 flex-shrink-0 ${
          final ? "opacity-40 cursor-default" : ""
        }`}
        onClick={() => {
          if (!final) onUpdateStatus(member.id);
        }}
        disabled={final}
        title={final ? "최종 단계입니다" : "다음 단계로"}
      >
        <ArrowRight className="h-3 w-3" />
      </Button>
    </div>
  );
}

// ============================================
// 이벤트 패널 컴포넌트
// ============================================

interface EventStats {
  total: number;
  arrivedCount: number;
  readyCount: number;
  pendingCount: number;
  stageReadyCount: number;
  readyRate: number;
}

interface EventPanelProps {
  event: PerformanceCheckinEvent;
  stats: EventStats;
  onDeleteEvent: (eventId: string) => void;
  onAddMember: (eventId: string, name: string) => boolean;
  onUpdateStatus: (eventId: string, memberId: string) => void;
  onToggleReady: (eventId: string, memberId: string) => void;
}

function EventPanel({
  event,
  stats,
  onDeleteEvent,
  onAddMember,
  onUpdateStatus,
  onToggleReady,
}: EventPanelProps) {
  const [expanded, setExpanded] = useState(true);
  const [newName, setNewName] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const handleDeleteEvent = () => {
    onDeleteEvent(event.id);
    toast.success(TOAST.CHECKIN_EVENT.DELETED);
  };

  const handleAddMember = () => {
    if (!newName.trim()) return;
    const ok = onAddMember(event.id, newName.trim());
    if (ok) {
      setNewName("");
      toast.success(`"${newName.trim()}" 멤버가 추가되었습니다.`);
    } else {
      toast.error(TOAST.CHECKIN_EVENT.MEMBER_ADD_ERROR);
    }
  };

  // 상태별 그룹핑 (stage_ready → costume_ready → arrived → pending 순)
  const grouped: Record<CheckinStatus, CheckinMember[]> = {
    stage_ready: event.members.filter((m) => m.status === "stage_ready"),
    costume_ready: event.members.filter((m) => m.status === "costume_ready"),
    arrived: event.members.filter((m) => m.status === "arrived"),
    pending: event.members.filter((m) => m.status === "pending"),
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* 이벤트 헤더 */}
      <div
        className="flex items-center gap-2 px-3 py-2 bg-muted/20 cursor-pointer select-none hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded((prev) => !prev)}
      >
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold truncate">{event.eventName}</span>
            <span className="text-[10px] text-muted-foreground flex-shrink-0">
              {event.eventDate}
            </span>
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 flex-shrink-0">
              <Clock className="h-2.5 w-2.5" />
              집합 {event.callTime}
            </span>
          </div>
        </div>

        {/* 통계 배지들 */}
        <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100"
            title="도착 인원"
          >
            <Users className="h-2.5 w-2.5 mr-0.5" />
            {stats.arrivedCount}/{stats.total}
          </Badge>
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 ${
              stats.readyRate >= 80
                ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-100"
                : stats.readyRate >= 50
                ? "bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100"
                : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100"
            }`}
            title="무대 준비율"
          >
            {stats.readyRate}% 준비
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
            onClick={() => setDeleteConfirmOpen(true)}
            title="이벤트 삭제"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* 이벤트 바디 */}
      {expanded && (
        <div className="px-3 py-2.5 space-y-3 bg-card">
          {/* 전체 진행 바 */}
          {stats.total > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">
                  무대 준비 현황
                </span>
                <span className="text-[10px] font-medium">
                  {stats.stageReadyCount}/{stats.total}명
                </span>
              </div>
              <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full rounded-full transition-all duration-500 bg-green-500"
                  style={{ width: `${stats.readyRate}%` }}
                />
              </div>
            </div>
          )}

          {/* 멤버 리스트 - 상태별 그룹 */}
          {event.members.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <Users className="h-5 w-5 mx-auto mb-1 opacity-30" />
              <p className="text-[11px]">등록된 멤버가 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(["stage_ready", "costume_ready", "arrived", "pending"] as CheckinStatus[]).map(
                (status) => {
                  const members = grouped[status];
                  if (members.length === 0) return null;
                  return (
                    <div key={status} className="space-y-1">
                      <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                        <span
                          className={`inline-block w-1.5 h-1.5 rounded-full ${
                            status === "stage_ready"
                              ? "bg-green-500"
                              : status === "costume_ready"
                              ? "bg-orange-400"
                              : status === "arrived"
                              ? "bg-blue-400"
                              : "bg-gray-300"
                          }`}
                        />
                        {statusLabel(status)}
                        <span className="text-[10px] text-muted-foreground">
                          ({members.length})
                        </span>
                      </p>
                      <div className="space-y-1 pl-2.5">
                        {members.map((member) => (
                          <MemberRow
                            key={member.id}
                            member={member}
                            onUpdateStatus={(memberId) =>
                              onUpdateStatus(event.id, memberId)
                            }
                            onToggleReady={(memberId) =>
                              onToggleReady(event.id, memberId)
                            }
                          />
                        ))}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}

          {/* 멤버 추가 입력 */}
          <div className="flex gap-1 pt-0.5">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="멤버 이름 입력"
              className="h-7 text-xs flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddMember();
                }
              }}
            />
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs px-2 flex-shrink-0"
              onClick={handleAddMember}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={(v) => !v && setDeleteConfirmOpen(false)}
        title="이벤트 삭제"
        description={`"${event.eventName}" 이벤트를 삭제하시겠습니까?`}
        onConfirm={handleDeleteEvent}
        destructive
      />
    </div>
  );
}

// ============================================
// 메인 카드 컴포넌트
// ============================================

interface PerformanceCheckinCardProps {
  groupId: string;
  projectId: string;
}

export function PerformanceCheckinCard({
  groupId,
  projectId,
}: PerformanceCheckinCardProps) {
  const [open, setOpen] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const {
    events,
    createEvent,
    deleteEvent,
    addMember,
    updateStatus,
    toggleReady,
    getStats,
    loading,
  } = usePerformanceCheckin(groupId, projectId);

  const handleCreateEvent = (
    eventName: string,
    eventDate: string,
    callTime: string
  ) => {
    const ok = createEvent(eventName, eventDate, callTime);
    if (ok) {
      toast.success(`"${eventName}" 체크인 이벤트가 생성되었습니다.`);
      setOpen(true);
    } else {
      toast.error(TOAST.CHECKIN_EVENT.CREATE_ERROR);
    }
  };

  // 전체 통계 집계
  const totalMembers = events.reduce((acc, e) => acc + e.members.length, 0);
  const totalStageReady = events.reduce(
    (acc, e) =>
      acc + e.members.filter((m) => m.status === "stage_ready").length,
    0
  );
  const overallRate =
    totalMembers === 0
      ? 0
      : Math.round((totalStageReady / totalMembers) * 100);

  return (
    <>
      <CreateEventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreateEvent}
      />

      <Collapsible open={open} onOpenChange={setOpen}>
        {/* 카드 헤더 */}
        <div className="flex items-center justify-between px-3 py-2 border rounded-t-lg bg-card">
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-2 flex-1 min-w-0 text-left">
              {open ? (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              )}
              <UserCheck className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span className="text-sm font-semibold">공연 당일 체크인</span>

              {events.length > 0 && (
                <span className="ml-1 text-[10px] text-muted-foreground">
                  {events.length}개 이벤트
                </span>
              )}
            </button>
          </CollapsibleTrigger>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* 전체 준비 완료율 배지 */}
            {totalMembers > 0 && (
              <Badge
                variant="outline"
                className={`text-[10px] px-1.5 py-0 ${
                  overallRate >= 80
                    ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-100"
                    : overallRate >= 50
                    ? "bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100"
                    : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100"
                }`}
              >
                준비 {overallRate}%
              </Badge>
            )}

            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                setDialogOpen(true);
                setOpen(true);
              }}
            >
              <Plus className="h-3 w-3 mr-1" />
              이벤트 추가
            </Button>
          </div>
        </div>

        {/* 카드 바디 */}
        <CollapsibleContent>
          <div className="border border-t-0 rounded-b-lg p-3 space-y-3 bg-card">
            {loading && (
              <div className="text-center py-6 text-muted-foreground">
                <p className="text-xs">불러오는 중...</p>
              </div>
            )}

            {!loading && events.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <UserCheck className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">등록된 체크인 이벤트가 없습니다.</p>
                <p className="text-[11px] mt-0.5">
                  상단의 &ldquo;이벤트 추가&rdquo; 버튼으로 공연 체크인을
                  시작하세요.
                </p>
              </div>
            )}

            {!loading && events.length > 0 && (
              <div className="space-y-2">
                {events.map((event) => (
                  <EventPanel
                    key={event.id}
                    event={event}
                    stats={getStats(event)}
                    onDeleteEvent={deleteEvent}
                    onAddMember={addMember}
                    onUpdateStatus={updateStatus}
                    onToggleReady={toggleReady}
                  />
                ))}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </>
  );
}
