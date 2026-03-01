"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useAsyncAction } from "@/hooks/use-async-action";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  UserCog,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Users,
} from "lucide-react";
import { useRoleHistory } from "@/hooks/use-role-history";
import type { MemberRoleType } from "@/types";
import { formatYearMonthDay } from "@/lib/date-utils";

// ============================================
// Props
// ============================================

type RoleHistoryCardProps = {
  groupId: string;
  memberNames: string[];
};

// ============================================
// 역할 메타데이터
// ============================================

type RoleMeta = {
  label: string;
  color: string;
  badgeClass: string;
};

const ROLE_META: Record<MemberRoleType, RoleMeta> = {
  leader: {
    label: "리더",
    color: "bg-red-500",
    badgeClass: "bg-red-100 text-red-700 border-red-200",
  },
  sub_leader: {
    label: "부리더",
    color: "bg-orange-500",
    badgeClass: "bg-orange-100 text-orange-700 border-orange-200",
  },
  treasurer: {
    label: "총무",
    color: "bg-green-500",
    badgeClass: "bg-green-100 text-green-700 border-green-200",
  },
  secretary: {
    label: "서기",
    color: "bg-blue-500",
    badgeClass: "bg-blue-100 text-blue-700 border-blue-200",
  },
  choreographer: {
    label: "안무가",
    color: "bg-purple-500",
    badgeClass: "bg-purple-100 text-purple-700 border-purple-200",
  },
  trainer: {
    label: "트레이너",
    color: "bg-cyan-500",
    badgeClass: "bg-cyan-100 text-cyan-700 border-cyan-200",
  },
  member: {
    label: "일반 멤버",
    color: "bg-gray-400",
    badgeClass: "bg-gray-100 text-gray-600 border-gray-200",
  },
  other: {
    label: "기타",
    color: "bg-gray-500",
    badgeClass: "bg-gray-100 text-gray-700 border-gray-200",
  },
};

const ROLE_OPTIONS: MemberRoleType[] = [
  "leader",
  "sub_leader",
  "treasurer",
  "secretary",
  "choreographer",
  "trainer",
  "member",
  "other",
];

// ============================================
// 날짜 포맷 헬퍼
// ============================================

// ============================================
// 역할 배정 다이얼로그
// ============================================

type AssignRoleDialogProps = {
  groupId: string;
  memberNames: string[];
  onAssigned: () => void;
};

function AssignRoleDialog({
  groupId,
  memberNames,
  onAssigned,
}: AssignRoleDialogProps) {
  const { assignRole } = useRoleHistory(groupId);
  const [open, setOpen] = useState(false);
  const [memberName, setMemberName] = useState("");
  const [role, setRole] = useState<MemberRoleType | "">("");
  const [customRoleTitle, setCustomRoleTitle] = useState("");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [assignedBy, setAssignedBy] = useState("");
  const [notes, setNotes] = useState("");
  const { pending: submitting, execute } = useAsyncAction();

  const handleSubmit = () => {
    if (!memberName) {
      toast.error("멤버를 선택해주세요.");
      return;
    }
    if (!role) {
      toast.error("역할을 선택해주세요.");
      return;
    }
    if (!startDate) {
      toast.error("시작일을 입력해주세요.");
      return;
    }
    if (role === "other" && !customRoleTitle.trim()) {
      toast.error("기타 역할명을 입력해주세요.");
      return;
    }

    void execute(async () => {
      assignRole({
        memberName,
        role,
        customRoleTitle: role === "other" ? customRoleTitle.trim() : undefined,
        startDate,
        assignedBy: assignedBy.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      toast.success(`${memberName}님께 역할이 배정되었습니다.`);
      setOpen(false);
      setMemberName("");
      setRole("");
      setCustomRoleTitle("");
      setStartDate(new Date().toISOString().split("T")[0]);
      setAssignedBy("");
      setNotes("");
      onAssigned();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 text-xs gap-1">
          <Plus className="h-3 w-3" />
          역할 배정
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">역할 배정</DialogTitle>
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

          {/* 역할 선택 */}
          <div className="space-y-1">
            <Label className="text-xs">역할</Label>
            <Select
              value={role}
              onValueChange={(v) => setRole(v as MemberRoleType)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="역할 선택" />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((r) => (
                  <SelectItem key={r} value={r} className="text-xs">
                    {ROLE_META[r].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 기타 역할명 */}
          {role === "other" && (
            <div className="space-y-1">
              <Label className="text-xs">역할명 (직접 입력)</Label>
              <Input
                className="h-8 text-xs"
                placeholder="예: 홍보담당"
                value={customRoleTitle}
                onChange={(e) => setCustomRoleTitle(e.target.value)}
              />
            </div>
          )}

          {/* 시작일 */}
          <div className="space-y-1">
            <Label className="text-xs">시작일</Label>
            <Input
              type="date"
              className="h-8 text-xs"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          {/* 배정자 */}
          <div className="space-y-1">
            <Label className="text-xs">배정자 (선택)</Label>
            <Input
              className="h-8 text-xs"
              placeholder="배정한 사람 이름"
              value={assignedBy}
              onChange={(e) => setAssignedBy(e.target.value)}
            />
          </div>

          {/* 메모 */}
          <div className="space-y-1">
            <Label className="text-xs">메모 (선택)</Label>
            <Textarea
              className="text-xs resize-none"
              rows={2}
              placeholder="역할 배정 관련 메모"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setOpen(false)}
            >
              취소
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={handleSubmit}
              disabled={submitting}
            >
              배정
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 역할 종료 확인 다이얼로그
// ============================================

type EndRoleDialogProps = {
  entryId: string;
  memberName: string;
  groupId: string;
  onEnded: () => void;
};

function EndRoleDialog({
  entryId,
  memberName,
  groupId,
  onEnded,
}: EndRoleDialogProps) {
  const { endRole } = useRoleHistory(groupId);
  const [open, setOpen] = useState(false);
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const handleEnd = () => {
    if (!endDate) {
      toast.error("종료일을 입력해주세요.");
      return;
    }
    endRole(entryId, endDate);
    toast.success(`${memberName}님의 역할이 종료되었습니다.`);
    setOpen(false);
    onEnded();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-[10px] px-1.5 text-muted-foreground hover:text-orange-600"
        >
          <CheckCircle2 className="h-3 w-3 mr-0.5" />
          종료
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-sm">역할 종료</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-1">
          <p className="text-xs text-muted-foreground">
            {memberName}님의 역할 종료일을 입력하세요.
          </p>
          <div className="space-y-1">
            <Label className="text-xs">종료일</Label>
            <Input
              type="date"
              className="h-8 text-xs"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setOpen(false)}
            >
              취소
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs"
              variant="destructive"
              onClick={handleEnd}
            >
              종료 처리
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 메인 카드 컴포넌트
// ============================================

export function RoleHistoryCard({ groupId, memberNames }: RoleHistoryCardProps) {
  const {
    entries,
    loading,
    deleteEntry,
    getByMember,

    stats,
    refetch,
  } = useRoleHistory(groupId);

  const [open, setOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  // 현재 역할 현황: 역할별 멤버 그리드
  const activeRoles = useMemo(() => {
    return stats.roleDistribution.filter((d) => d.count > 0);
  }, [stats.roleDistribution]);

  // 멤버 선택 시 해당 멤버 이력
  const memberHistory = useMemo(() => {
    if (!selectedMember) return [];
    return getByMember(selectedMember);
  }, [selectedMember, getByMember]);

  const handleDelete = (id: string, memberName: string) => {
    deleteEntry(id);
    toast.success(`${memberName}님의 역할 이력이 삭제되었습니다.`);
    refetch();
  };

  if (loading) {
    return (
      <Card className="border">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <UserCog className="h-4 w-4 text-muted-foreground" />
            멤버 역할 히스토리
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <p className="text-xs text-muted-foreground">불러오는 중...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="border">
        {/* 헤더 */}
        <CollapsibleTrigger asChild>
          <CardHeader className="py-3 px-4 cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <UserCog className="h-4 w-4 text-muted-foreground" />
                멤버 역할 히스토리
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0 ml-1"
                >
                  활성 {stats.activeRoles}
                </Badge>
              </CardTitle>
              <div className="flex items-center gap-2">
                {open && (
                  <div onClick={(e) => e.stopPropagation()}>
                    <AssignRoleDialog
                      groupId={groupId}
                      memberNames={memberNames}
                      onAssigned={refetch}
                    />
                  </div>
                )}
                {open ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="px-4 pb-4 space-y-4">

            {/* 현재 역할 현황 */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                <Users className="h-3 w-3" />
                현재 역할 현황
              </p>
              {activeRoles.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2 text-center border rounded-md">
                  배정된 역할이 없습니다
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {activeRoles.map(({ role, members }) => {
                    const meta = ROLE_META[role];
                    return (
                      <div
                        key={role}
                        className="rounded-md border p-2 space-y-1"
                      >
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`h-2 w-2 rounded-full ${meta.color}`}
                          />
                          <span className="text-[11px] font-medium">
                            {meta.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {members.map((name) => (
                            <button
                              key={name}
                              onClick={() =>
                                setSelectedMember(
                                  selectedMember === name ? null : name
                                )
                              }
                              className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                                selectedMember === name
                                  ? `${meta.badgeClass} font-semibold`
                                  : "bg-muted text-muted-foreground border-transparent hover:border-muted-foreground/30"
                              }`}
                            >
                              {name}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 멤버별 역할 이력 (선택 시 표시) */}
            {selectedMember && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {selectedMember}님 역할 이력
                </p>
                {memberHistory.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2 text-center border rounded-md">
                    역할 이력이 없습니다
                  </p>
                ) : (
                  <div className="relative pl-4 space-y-2">
                    {/* 타임라인 세로선 */}
                    <div className="absolute left-1.5 top-1 bottom-1 w-px bg-border" />
                    {memberHistory.map((entry) => {
                      const meta = ROLE_META[entry.role];
                      const roleLabel =
                        entry.role === "other" && entry.customRoleTitle
                          ? entry.customRoleTitle
                          : meta.label;
                      return (
                        <div key={entry.id} className="relative">
                          {/* 타임라인 점 */}
                          <span
                            className={`absolute -left-3 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-background ${meta.color}`}
                          />
                          <div className="rounded-md border p-2 space-y-1 bg-card">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] px-1.5 py-0 border ${meta.badgeClass}`}
                                >
                                  {roleLabel}
                                </Badge>
                                {entry.isActive && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] px-1.5 py-0 bg-green-50 text-green-700 border-green-200"
                                  >
                                    활성
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-0.5">
                                {entry.isActive && (
                                  <EndRoleDialog
                                    entryId={entry.id}
                                    memberName={entry.memberName}
                                    groupId={groupId}
                                    onEnded={refetch}
                                  />
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                  onClick={() =>
                                    handleDelete(entry.id, entry.memberName)
                                  }
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                              {formatYearMonthDay(entry.startDate)}
                              {entry.endDate
                                ? ` ~ ${formatYearMonthDay(entry.endDate)}`
                                : " ~ 현재"}
                            </p>
                            {entry.assignedBy && (
                              <p className="text-[10px] text-muted-foreground">
                                배정: {entry.assignedBy}
                              </p>
                            )}
                            {entry.notes && (
                              <p className="text-[10px] text-muted-foreground bg-muted/50 rounded px-1.5 py-0.5">
                                {entry.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 멤버 선택 안내 (이력이 없거나 선택 안된 경우) */}
            {!selectedMember && entries.length > 0 && (
              <p className="text-[10px] text-muted-foreground text-center">
                역할 현황에서 멤버 이름을 클릭하면 이력을 확인할 수 있습니다
              </p>
            )}

            {/* 역할 이력이 아예 없는 경우 */}
            {entries.length === 0 && (
              <div className="text-center py-4">
                <UserCog className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">
                  아직 역할 이력이 없습니다
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  역할 배정 버튼으로 첫 역할을 기록해보세요
                </p>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
