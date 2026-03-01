"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAsyncAction } from "@/hooks/use-async-action";
import {
  useFinanceSplits,
  type FinanceSplitWithMembers,
} from "@/hooks/use-finance-splits";
import { invalidateFinanceSplits, invalidateFinanceSplitMembers } from "@/lib/swr/invalidate";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Plus, ChevronDown, ChevronUp, CheckCircle2, Circle } from "lucide-react";
import { toast } from "sonner";
import { SplitPresetManager } from "@/components/finance/split-preset-manager";
import type { GroupMemberWithProfile } from "@/types";

type Props = {
  groupId: string;
  projectId?: string | null;
  groupMembers: GroupMemberWithProfile[];
  nicknameMap: Record<string, string>;
  canManage: boolean;
  currentUserId: string;
};

function formatAmount(amount: number) {
  return amount.toLocaleString("ko-KR") + "원";
}

// 분할 정산 생성 다이얼로그
function CreateSplitDialog({
  open,
  onOpenChange,
  groupId,
  projectId,
  groupMembers,
  nicknameMap,
  currentUserId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  projectId?: string | null;
  groupMembers: GroupMemberWithProfile[];
  nicknameMap: Record<string, string>;
  currentUserId: string;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [paidBy, setPaidBy] = useState(currentUserId);
  const [selectedMembers, setSelectedMembers] = useState<string[]>(
    groupMembers.map((m) => m.user_id)
  );
  const { pending: submitting, execute } = useAsyncAction();

  const memberCount = selectedMembers.length;
  const parsedAmount = parseInt(totalAmount.replace(/,/g, ""), 10) || 0;
  const perPerson = memberCount > 0 ? Math.floor(parsedAmount / memberCount) : 0;
  const remainder = parsedAmount - perPerson * memberCount;

  const handleToggleMember = (userId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    setTotalAmount(raw ? parseInt(raw, 10).toLocaleString("ko-KR") : "");
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("제목을 입력해주세요");
      return;
    }
    if (parsedAmount <= 0) {
      toast.error("총액을 입력해주세요");
      return;
    }
    if (selectedMembers.length === 0) {
      toast.error("참여 멤버를 한 명 이상 선택해주세요");
      return;
    }

    await execute(async () => {
      const supabase = createClient();

      // 1. finance_splits 행 생성
      const { data: split, error: splitError } = await supabase
        .from("finance_splits")
        .insert({
          group_id: groupId,
          project_id: projectId ?? null,
          title: title.trim(),
          total_amount: parsedAmount,
          paid_by: paidBy,
          split_type: "equal",
        })
        .select()
        .single();

      if (splitError || !split) {
        toast.error("분할 정산 생성에 실패했습니다");
        return;
      }

      // 2. 멤버별 금액 계산 (균등 분할, 나머지는 첫 번째 멤버에게)
      const memberRows = selectedMembers.map((userId, idx) => ({
        split_id: split.id,
        user_id: userId,
        amount: idx === 0 ? perPerson + remainder : perPerson,
        is_settled: false,
      }));

      const { error: membersError } = await supabase
        .from("finance_split_members")
        .insert(memberRows);

      if (membersError) {
        toast.error("참여 멤버 등록에 실패했습니다");
        // 생성된 split 롤백
        await supabase.from("finance_splits").delete().eq("id", split.id);
        return;
      }

      toast.success("분할 정산이 생성되었습니다");
      invalidateFinanceSplits(groupId, projectId);
      onSuccess();
      onOpenChange(false);
      setTitle("");
      setTotalAmount("");
      setPaidBy(currentUserId);
      setSelectedMembers(groupMembers.map((m) => m.user_id));
    });
  };

  const getMemberName = (userId: string) => {
    const member = groupMembers.find((m) => m.user_id === userId);
    if (!member) return userId;
    return nicknameMap[userId] || member.profiles.name;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm">새 분할 정산</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 제목 */}
          <div className="space-y-1.5">
            <Label className="text-xs">제목</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 연습실 대여비"
              className="h-8 text-xs"
            />
          </div>

          {/* 총액 */}
          <div className="space-y-1.5">
            <Label className="text-xs">총액</Label>
            <div className="relative">
              <Input
                value={totalAmount}
                onChange={handleAmountChange}
                placeholder="0"
                className="h-8 text-xs pr-6"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground">
                원
              </span>
            </div>
          </div>

          {/* 결제자 선택 */}
          <div className="space-y-1.5">
            <Label className="text-xs">결제자</Label>
            <Select value={paidBy} onValueChange={setPaidBy}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {groupMembers.map((m) => (
                  <SelectItem key={m.user_id} value={m.user_id} className="text-xs">
                    {nicknameMap[m.user_id] || m.profiles.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 참여 멤버 선택 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs">참여 멤버</Label>
              <button
                type="button"
                onClick={() => {
                  if (selectedMembers.length === groupMembers.length) {
                    setSelectedMembers([]);
                  } else {
                    setSelectedMembers(groupMembers.map((m) => m.user_id));
                  }
                }}
                className="text-[11px] text-blue-600 hover:text-blue-700"
              >
                {selectedMembers.length === groupMembers.length ? "전체 해제" : "전체 선택"}
              </button>
            </div>
            <div className="rounded-md border divide-y max-h-40 overflow-y-auto">
              {groupMembers.map((m) => (
                <label
                  key={m.user_id}
                  className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/40"
                >
                  <Checkbox
                    checked={selectedMembers.includes(m.user_id)}
                    onCheckedChange={() => handleToggleMember(m.user_id)}
                    className="h-3.5 w-3.5"
                  />
                  <span className="text-xs">
                    {nicknameMap[m.user_id] || m.profiles.name}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* 균등 분할 계산 미리보기 */}
          {parsedAmount > 0 && memberCount > 0 && (
            <div className="rounded-md bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 px-3 py-2 space-y-0.5">
              <p className="text-[11px] text-blue-700 dark:text-blue-400 font-medium">
                균등 분할 미리보기
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-300">
                {memberCount}명 기준 1인당{" "}
                <span className="font-semibold">{formatAmount(perPerson)}</span>
                {remainder > 0 && (
                  <span className="text-[11px] ml-1 text-blue-500">
                    (첫 번째 멤버 +{formatAmount(remainder)})
                  </span>
                )}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "생성 중..." : "생성"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// 분할 정산 상세 행
function SplitDetailRow({
  split,
  nicknameMap,
  groupMembers,
  canManage,
  currentUserId,
  onSettled,
}: {
  split: FinanceSplitWithMembers;
  nicknameMap: Record<string, string>;
  groupMembers: GroupMemberWithProfile[];
  canManage: boolean;
  currentUserId: string;
  onSettled: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [settlingId, setSettlingId] = useState<string | null>(null);

  const paidByName = split.paid_by_profile
    ? nicknameMap[split.paid_by_profile.id] || split.paid_by_profile.name
    : "";

  const totalMembers = split.finance_split_members.length;
  const settledMembers = split.finance_split_members.filter((m) => m.is_settled).length;
  const isFullySettled = totalMembers > 0 && settledMembers === totalMembers;

  const getMemberName = (userId: string) => {
    const member = groupMembers.find((m) => m.user_id === userId);
    if (!member) return userId;
    return nicknameMap[userId] || member.profiles.name;
  };

  const handleToggleSettled = async (memberId: string, userId: string, current: boolean) => {
    // 본인 또는 관리자만 토글 가능
    if (!canManage && userId !== currentUserId) return;

    setSettlingId(memberId);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("finance_split_members")
        .update({
          is_settled: !current,
          settled_at: !current ? new Date().toISOString() : null,
        })
        .eq("id", memberId);

      if (error) {
        toast.error("정산 상태 변경에 실패했습니다");
      } else {
        toast.success(!current ? "정산 완료로 변경되었습니다" : "미정산으로 변경되었습니다");
        invalidateFinanceSplitMembers(split.id);
        invalidateFinanceSplits(split.group_id, split.project_id);
        onSettled();
      }
    } finally {
      setSettlingId(null);
    }
  };

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      {/* 헤더 행 */}
      <button
        type="button"
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-muted/40 transition-colors text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium truncate">{split.title}</span>
              {isFullySettled ? (
                <Badge className="text-[10px] px-1.5 py-0 h-4 bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/40">
                  정산완료
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 h-4 bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800/40"
                >
                  정산중
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
              <span className="font-semibold text-foreground">
                {formatAmount(split.total_amount)}
              </span>
              <span className="text-muted-foreground/40">·</span>
              <span>{paidByName} 결제</span>
              <span className="text-muted-foreground/40">·</span>
              <span>
                {settledMembers}/{totalMembers}명 정산
              </span>
            </div>
          </div>
        </div>
        <div className="shrink-0 text-muted-foreground ml-2">
          {expanded ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </div>
      </button>

      {/* 상세 멤버 목록 */}
      {expanded && (
        <div className="border-t divide-y">
          {split.finance_split_members.map((sm) => {
            const memberName = getMemberName(sm.user_id);
            const canToggle = canManage || sm.user_id === currentUserId;
            const isSettling = settlingId === sm.id;

            return (
              <div
                key={sm.id}
                className="flex items-center justify-between px-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {sm.is_settled ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                  ) : (
                    <Circle className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                  )}
                  <span
                    className={`text-xs truncate ${
                      sm.is_settled ? "text-muted-foreground line-through" : ""
                    }`}
                  >
                    {memberName}
                  </span>
                  {sm.user_id === split.paid_by && (
                    <Badge
                      variant="outline"
                      className="text-[9px] px-1 py-0 h-3.5 font-normal"
                    >
                      결제자
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-xs font-medium tabular-nums ${
                      sm.is_settled ? "text-muted-foreground" : ""
                    }`}
                  >
                    {formatAmount(sm.amount)}
                  </span>
                  {canToggle && (
                    <Button
                      variant={sm.is_settled ? "outline" : "default"}
                      size="sm"
                      className={`h-6 text-[10px] px-2 ${
                        sm.is_settled
                          ? "border-green-200 text-green-700 hover:bg-green-50 dark:border-green-800/40 dark:text-green-400"
                          : ""
                      }`}
                      onClick={() => handleToggleSettled(sm.id, sm.user_id, sm.is_settled)}
                      disabled={isSettling}
                    >
                      {isSettling
                        ? "..."
                        : sm.is_settled
                        ? "정산완료"
                        : "정산하기"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// 메인 컴포넌트
export function FinanceSplitSection({
  groupId,
  projectId,
  groupMembers,
  nicknameMap,
  canManage,
  currentUserId,
}: Props) {
  const { splits, loading, refetch } = useFinanceSplits(groupId, projectId);
  const [createOpen, setCreateOpen] = useState(false);

  const pendingSplits = useMemo(
    () =>
      splits.filter(
        (s) => s.finance_split_members.some((m) => !m.is_settled)
      ),
    [splits]
  );
  const completedSplits = useMemo(
    () =>
      splits.filter(
        (s) => s.finance_split_members.length > 0 && s.finance_split_members.every((m) => m.is_settled)
      ),
    [splits]
  );

  return (
    <div className="space-y-3">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium text-muted-foreground">분할 정산</h3>
        <div className="flex items-center gap-1">
          <SplitPresetManager
            groupId={groupId}
            groupMembers={groupMembers}
            nicknameMap={nicknameMap}
            canEdit={canManage}
          />
          {canManage && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="h-3 w-3" />
              새 정산
            </Button>
          )}
        </div>
      </div>

      {/* 목록 */}
      {loading ? (
        <div className="py-6 text-center text-xs text-muted-foreground">
          불러오는 중...
        </div>
      ) : splits.length === 0 ? (
        <div className="py-8 text-center text-xs text-muted-foreground">
          분할 정산 내역이 없습니다
        </div>
      ) : (
        <div className="space-y-2">
          {/* 정산 중 */}
          {pendingSplits.length > 0 && (
            <div className="space-y-2">
              {pendingSplits.map((split) => (
                <SplitDetailRow
                  key={split.id}
                  split={split}
                  nicknameMap={nicknameMap}
                  groupMembers={groupMembers}
                  canManage={canManage}
                  currentUserId={currentUserId}
                  onSettled={refetch}
                />
              ))}
            </div>
          )}

          {/* 정산 완료 */}
          {completedSplits.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] text-muted-foreground/60 px-0.5">
                완료된 정산
              </p>
              {completedSplits.map((split) => (
                <SplitDetailRow
                  key={split.id}
                  split={split}
                  nicknameMap={nicknameMap}
                  groupMembers={groupMembers}
                  canManage={canManage}
                  currentUserId={currentUserId}
                  onSettled={refetch}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 생성 다이얼로그 */}
      <CreateSplitDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        groupId={groupId}
        projectId={projectId}
        groupMembers={groupMembers}
        nicknameMap={nicknameMap}
        currentUserId={currentUserId}
        onSuccess={refetch}
      />
    </div>
  );
}
