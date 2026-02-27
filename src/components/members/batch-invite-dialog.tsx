"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Search, Users, Loader2 } from "lucide-react";
import { useMemberBatchInvite } from "@/hooks/use-member-batch-invite";
import type { InviteCandidate } from "@/types";

type BatchInviteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
};

// 후보 행 컴포넌트
function CandidateRow({
  candidate,
  checked,
  onCheckedChange,
}: {
  candidate: InviteCandidate;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  const disabled = candidate.isAlreadyMember;

  return (
    <div
      className={`flex items-center gap-2 rounded-md border px-2.5 py-2 transition-colors ${
        disabled
          ? "opacity-50 cursor-not-allowed bg-muted/20"
          : checked
            ? "bg-muted/60 border-primary/30 cursor-pointer"
            : "hover:bg-muted/30 cursor-pointer"
      }`}
      onClick={() => {
        if (!disabled) onCheckedChange(!checked);
      }}
    >
      <Checkbox
        checked={checked}
        disabled={disabled}
        onCheckedChange={(value) => {
          if (!disabled) onCheckedChange(value === true);
        }}
        onClick={(e) => e.stopPropagation()}
        className="h-3.5 w-3.5 shrink-0"
      />
      <Avatar className="h-6 w-6 shrink-0">
        <AvatarImage src={candidate.avatarUrl ?? undefined} />
        <AvatarFallback className="text-[10px]">
          {candidate.name.slice(0, 1)}
        </AvatarFallback>
      </Avatar>
      <span className="flex-1 text-xs font-medium truncate">
        {candidate.name}
      </span>
      {candidate.isAlreadyMember && (
        <Badge
          variant="outline"
          className="text-[10px] px-1.5 py-0 bg-green-50 text-green-700 border-green-200 shrink-0"
        >
          이미 멤버
        </Badge>
      )}
    </div>
  );
}

export function BatchInviteDialog({
  open,
  onOpenChange,
  groupId,
}: BatchInviteDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { candidates, loading, inviting, filterCandidates, inviteMembers } =
    useMemberBatchInvite(groupId);

  // 검색어로 필터링된 후보 목록
  const filtered = useMemo(
    () => filterCandidates(searchQuery),
    // filterCandidates는 candidates가 변경될 때마다 새 참조가 되므로 candidates도 dep에 포함
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [candidates, searchQuery]
  );

  // 선택 가능한(아직 멤버가 아닌) 후보만
  const selectableCandidates = filtered.filter((c) => !c.isAlreadyMember);

  const allSelected =
    selectableCandidates.length > 0 &&
    selectableCandidates.every((c) => selectedIds.has(c.userId));
  const someSelected =
    selectedIds.size > 0 && !allSelected;

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableCandidates.map((c) => c.userId)));
    }
  };

  const toggleOne = (userId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const handleInvite = async () => {
    const success = await inviteMembers(Array.from(selectedIds));
    if (success) {
      setSelectedIds(new Set());
      setSearchQuery("");
      onOpenChange(false);
    }
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      setSelectedIds(new Set());
      setSearchQuery("");
    }
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-1.5">
            <UserPlus className="h-4 w-4" />
            멤버 일괄 초대
          </DialogTitle>
          <DialogDescription className="text-xs">
            프로필에서 여러 사용자를 검색하고 그룹에 일괄 초대합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* 검색 입력 */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="이름으로 검색..."
              className="pl-8 h-8 text-xs"
            />
          </div>

          {/* 전체 선택 */}
          {!loading && selectableCandidates.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Checkbox
                  id="batch-invite-select-all"
                  checked={allSelected}
                  data-state={someSelected ? "indeterminate" : undefined}
                  onCheckedChange={toggleAll}
                  className="h-3.5 w-3.5"
                />
                <label
                  htmlFor="batch-invite-select-all"
                  className="text-[11px] text-muted-foreground cursor-pointer"
                >
                  {allSelected ? "전체 선택 해제" : "전체 선택"}
                </label>
              </div>
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" />
                {selectedIds.size}명 선택됨
              </span>
            </div>
          )}

          {/* 후보 목록 */}
          {loading ? (
            <div className="space-y-1.5 py-1">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-9 bg-muted animate-pulse rounded-md"
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-[11px] text-muted-foreground py-6 text-center">
              {searchQuery.trim()
                ? "검색 결과가 없습니다"
                : "초대 가능한 사용자가 없습니다"}
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              <div className="space-y-1 pr-0.5">
                {filtered.map((candidate) => (
                  <CandidateRow
                    key={candidate.userId}
                    candidate={candidate}
                    checked={selectedIds.has(candidate.userId)}
                    onCheckedChange={() => toggleOne(candidate.userId)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => handleOpenChange(false)}
            disabled={inviting}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleInvite}
            disabled={inviting || selectedIds.size === 0}
          >
            {inviting ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                초대 중...
              </>
            ) : (
              <>
                <UserPlus className="h-3 w-3 mr-1" />
                {selectedIds.size > 0
                  ? `${selectedIds.size}명 초대`
                  : "멤버를 선택하세요"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
