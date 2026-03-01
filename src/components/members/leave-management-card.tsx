"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CalendarOff,
  ChevronDown,
  ChevronUp,
  Plus,
  Check,
  X,
  RotateCcw,
  Trash2,
  Clock,
  UserCheck,
} from "lucide-react";
import { useLeaveManagement } from "@/hooks/use-leave-management";
import type { MemberLeaveStatus, MemberLeaveReason, MemberLeaveEntry } from "@/types";

// ============================================
// Props
// ============================================

interface LeaveManagementCardProps {
  groupId: string;
  memberNames: string[];
}

// ============================================
// 상수
// ============================================

const REASON_LABELS: Record<MemberLeaveReason, string> = {
  health: "건강",
  travel: "여행",
  personal: "개인 사정",
  academic: "학업",
  work: "업무",
  other: "기타",
};

const STATUS_LABELS: Record<MemberLeaveStatus, string> = {
  applied: "신청중",
  approved: "승인됨",
  active: "진행중",
  completed: "완료",
  rejected: "거절됨",
};

const STATUS_BADGE_CLASS: Record<MemberLeaveStatus, string> = {
  applied: "bg-yellow-100 text-yellow-800 border-yellow-200",
  approved: "bg-blue-100 text-blue-800 border-blue-200",
  active: "bg-green-100 text-green-800 border-green-200",
  completed: "bg-gray-100 text-gray-600 border-gray-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
};

const FILTER_TABS: { value: "all" | MemberLeaveStatus; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "applied", label: "신청중" },
  { value: "approved", label: "승인" },
  { value: "active", label: "진행중" },
  { value: "completed", label: "완료" },
];

// ============================================
// 휴가 신청 다이얼로그
// ============================================

interface ApplyDialogProps {
  memberNames: string[];
  onApply: (
    memberName: string,
    reason: MemberLeaveReason,
    reasonDetail: string,
    startDate: string,
    endDate: string
  ) => void;
}

function ApplyDialog({ memberNames, onApply }: ApplyDialogProps) {
  const [open, setOpen] = useState(false);
  const [memberName, setMemberName] = useState("");
  const [reason, setReason] = useState<MemberLeaveReason | "">("");
  const [reasonDetail, setReasonDetail] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  function handleSubmit() {
    if (!memberName) {
      toast.error(TOAST.MEMBERS.LEAVE_MEMBER_REQUIRED);
      return;
    }
    if (!reason) {
      toast.error(TOAST.MEMBERS.LEAVE_REASON_REQUIRED);
      return;
    }
    if (!startDate || !endDate) {
      toast.error(TOAST.MEMBERS.LEAVE_DATE_REQUIRED);
      return;
    }
    if (startDate > endDate) {
      toast.error(TOAST.MEMBERS.LEAVE_DATE_ORDER);
      return;
    }

    onApply(memberName, reason as MemberLeaveReason, reasonDetail, startDate, endDate);
    toast.success(`${memberName}의 휴가 신청이 접수되었습니다.`);
    setMemberName("");
    setReason("");
    setReasonDetail("");
    setStartDate("");
    setEndDate("");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 text-xs gap-1">
          <Plus className="h-3 w-3" />
          휴가 신청
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">휴가 신청</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-1">
          {/* 멤버 선택 */}
          <div className="space-y-1">
            <Label className="text-xs">멤버</Label>
            <Select value={memberName} onValueChange={setMemberName}>
              <SelectTrigger className="h-8 text-xs">
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

          {/* 사유 선택 */}
          <div className="space-y-1">
            <Label className="text-xs">휴가 사유</Label>
            <Select
              value={reason}
              onValueChange={(v) => setReason(v as MemberLeaveReason)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="사유 선택" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(REASON_LABELS) as MemberLeaveReason[]).map((r) => (
                  <SelectItem key={r} value={r} className="text-xs">
                    {REASON_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 상세 사유 */}
          <div className="space-y-1">
            <Label className="text-xs">상세 사유 (선택)</Label>
            <Input
              value={reasonDetail}
              onChange={(e) => setReasonDetail(e.target.value)}
              placeholder="구체적인 사유를 입력하세요"
              className="h-8 text-xs"
            />
          </div>

          {/* 시작일 */}
          <div className="space-y-1">
            <Label className="text-xs">시작일</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* 종료일 */}
          <div className="space-y-1">
            <Label className="text-xs">종료일</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          <Button onClick={handleSubmit} className="w-full h-8 text-xs">
            신청하기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 휴가 항목 행
// ============================================

interface LeaveRowProps {
  entry: MemberLeaveEntry;
  onApprove: (id: string, approverName: string) => void;
  onReject: (id: string) => void;
  onActivate: (id: string) => void;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  calcDday: (endDate: string) => number;
}

function LeaveRow({
  entry,
  onApprove,
  onReject,
  onActivate,
  onComplete,
  onDelete,
  calcDday,
}: LeaveRowProps) {
  const dday = calcDday(entry.endDate);
  const ddayText =
    dday > 0 ? `D-${dday}` : dday === 0 ? "D-Day" : `D+${Math.abs(dday)}`;

  function handleApprove() {
    const approver = "관리자"; // 실제 구현 시 로그인 유저 이름 사용
    onApprove(entry.id, approver);
    toast.success(`${entry.memberName}의 휴가를 승인했습니다.`);
  }

  function handleReject() {
    onReject(entry.id);
    toast.success(`${entry.memberName}의 휴가 신청을 거절했습니다.`);
  }

  function handleActivate() {
    onActivate(entry.id);
    toast.success(`${entry.memberName}의 휴가가 진행 중으로 변경되었습니다.`);
  }

  function handleComplete() {
    onComplete(entry.id);
    toast.success(`${entry.memberName}의 복귀 처리가 완료되었습니다.`);
  }

  function handleDelete() {
    onDelete(entry.id);
    toast.success(TOAST.MEMBERS.LEAVE_DELETED);
  }

  return (
    <div className="rounded-md border border-gray-100 bg-gray-50/50 p-2.5 space-y-1.5">
      {/* 헤더 행 */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs font-medium text-gray-800 truncate">
            {entry.memberName}
          </span>
          <Badge
            className={`text-[10px] px-1.5 py-0 border ${STATUS_BADGE_CLASS[entry.status]}`}
          >
            {STATUS_LABELS[entry.status]}
          </Badge>
        </div>
        {(entry.status === "active") && (
          <span className="text-[10px] text-green-700 font-semibold shrink-0">
            {ddayText}
          </span>
        )}
      </div>

      {/* 정보 행 */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-gray-500">
        <span>{REASON_LABELS[entry.reason]}</span>
        {entry.reasonDetail && (
          <>
            <span className="text-gray-300">·</span>
            <span className="truncate max-w-[120px]">{entry.reasonDetail}</span>
          </>
        )}
        <span className="text-gray-300">·</span>
        <span>
          {entry.startDate} ~ {entry.endDate}
        </span>
        {entry.approvedBy && (
          <>
            <span className="text-gray-300">·</span>
            <span className="flex items-center gap-0.5">
              <UserCheck className="h-2.5 w-2.5" />
              {entry.approvedBy}
            </span>
          </>
        )}
      </div>

      {/* 액션 버튼 */}
      <div className="flex items-center gap-1 pt-0.5">
        {entry.status === "applied" && (
          <>
            <Button
              size="sm"
              className="h-6 text-[10px] px-2 bg-blue-500 hover:bg-blue-600"
              onClick={handleApprove}
            >
              <Check className="h-3 w-3 mr-0.5" />
              승인
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-6 text-[10px] px-2 text-red-600 border-red-200 hover:bg-red-50"
              onClick={handleReject}
            >
              <X className="h-3 w-3 mr-0.5" />
              거절
            </Button>
          </>
        )}
        {entry.status === "approved" && (
          <Button
            size="sm"
            className="h-6 text-[10px] px-2 bg-green-500 hover:bg-green-600"
            onClick={handleActivate}
          >
            <Clock className="h-3 w-3 mr-0.5" />
            진행 중
          </Button>
        )}
        {entry.status === "active" && (
          <Button
            size="sm"
            className="h-6 text-[10px] px-2 bg-gray-500 hover:bg-gray-600"
            onClick={handleComplete}
          >
            <RotateCcw className="h-3 w-3 mr-0.5" />
            복귀 처리
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="h-6 text-[10px] px-1.5 text-gray-400 hover:text-red-500 ml-auto"
          onClick={handleDelete}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// ============================================
// 메인 카드 컴포넌트
// ============================================

export function LeaveManagementCard({
  groupId,
  memberNames,
}: LeaveManagementCardProps) {
  const [open, setOpen] = useState(true);
  const [filterTab, setFilterTab] = useState<"all" | MemberLeaveStatus>("all");

  const {
    entries,
    applyLeave,
    approveLeave,
    rejectLeave,
    activateLeave,
    completeLeave,
    deleteLeave,
    getCurrentlyOnLeave,
    calcDday,
    totalLeaves,
    activeCount,
    pendingCount,
    loading,
  } = useLeaveManagement(groupId);

  const currentlyOnLeave = useMemo(() => getCurrentlyOnLeave(), [getCurrentlyOnLeave]);

  const filteredEntries = useMemo(() => {
    if (filterTab === "all") return entries;
    return entries.filter((e) => e.status === filterTab);
  }, [entries, filterTab]);

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-4 text-xs text-gray-400">로딩 중...</CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader className="pb-2 pt-3 px-4">
          <div className="flex items-center justify-between gap-2">
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <CalendarOff className="h-4 w-4 text-orange-500" />
                <CardTitle className="text-sm font-semibold">
                  멤버 휴가 관리
                </CardTitle>
                {open ? (
                  <ChevronUp className="h-3.5 w-3.5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                )}
              </button>
            </CollapsibleTrigger>
            <ApplyDialog memberNames={memberNames} onApply={applyLeave} />
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="px-4 pb-4 pt-0 space-y-3">
            {/* 통계 배지 */}
            <div className="flex flex-wrap gap-1.5">
              <div className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1">
                <span className="text-[10px] text-gray-500">전체 신청</span>
                <span className="text-[10px] font-bold text-gray-700">
                  {totalLeaves}건
                </span>
              </div>
              <div className="flex items-center gap-1 rounded-full bg-yellow-50 px-2.5 py-1">
                <span className="text-[10px] text-yellow-600">승인 대기</span>
                <span className="text-[10px] font-bold text-yellow-700">
                  {pendingCount}건
                </span>
              </div>
              <div className="flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1">
                <span className="text-[10px] text-green-600">현재 휴가중</span>
                <span className="text-[10px] font-bold text-green-700">
                  {activeCount}명
                </span>
              </div>
            </div>

            {/* 현재 휴가중 멤버 섹션 */}
            {currentlyOnLeave.length > 0 && (
              <div className="rounded-md border border-green-100 bg-green-50/50 p-2.5">
                <p className="text-[10px] font-semibold text-green-700 mb-1.5 flex items-center gap-1">
                  <CalendarOff className="h-3 w-3" />
                  현재 휴가중인 멤버
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {currentlyOnLeave.map((e) => {
                    const dday = calcDday(e.endDate);
                    const ddayText =
                      dday > 0
                        ? `복귀 D-${dday}`
                        : dday === 0
                        ? "오늘 복귀"
                        : `D+${Math.abs(dday)}`;
                    return (
                      <div
                        key={e.id}
                        className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5"
                      >
                        <span className="text-[10px] font-medium text-green-800">
                          {e.memberName}
                        </span>
                        <span className="text-[10px] text-green-600">
                          {ddayText}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 상태별 필터 탭 */}
            <div className="flex flex-wrap gap-1">
              {FILTER_TABS.map((tab) => {
                const count =
                  tab.value === "all"
                    ? entries.length
                    : entries.filter((e) => e.status === tab.value).length;
                return (
                  <button
                    key={tab.value}
                    onClick={() => setFilterTab(tab.value)}
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-colors ${
                      filterTab === tab.value
                        ? "bg-orange-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {tab.label}
                    {count > 0 && (
                      <span className="ml-1 opacity-80">({count})</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* 휴가 목록 */}
            {filteredEntries.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-400">
                {filterTab === "all"
                  ? "등록된 휴가 신청이 없습니다."
                  : `${STATUS_LABELS[filterTab as MemberLeaveStatus]} 상태의 휴가가 없습니다.`}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredEntries.map((entry) => (
                  <LeaveRow
                    key={entry.id}
                    entry={entry}
                    onApprove={approveLeave}
                    onReject={rejectLeave}
                    onActivate={activateLeave}
                    onComplete={completeLeave}
                    onDelete={deleteLeave}
                    calcDday={calcDday}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
