"use client";

import { useState } from "react";
import { formatRelative } from "@/lib/date-utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Users, UserCheck, Clock } from "lucide-react";
import { toast } from "sonner";
import { useWinbackCampaign } from "@/hooks/use-winback-campaign";
import type { WinbackCandidate } from "@/types";

// 메시지 템플릿
const MESSAGE_TEMPLATES = [
  "그동안 연습에 참여하지 못하셨는데, 다음 일정에 함께해요!",
  "팀에서 OO님이 보고 싶어해요. 언제든 편하게 오세요!",
  "새로운 프로젝트가 시작됐어요. 함께 참여하시겠어요?",
] as const;

type WinbackCampaignDialogProps = {
  groupId: string;
};

// 멤버 행 컴포넌트
function CandidateRow({
  candidate,
  checked,
  onCheckedChange,
}: {
  candidate: WinbackCandidate;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  const lastActivityLabel = candidate.lastActivityAt
    ? formatRelative(new Date(candidate.lastActivityAt))
    : "활동 기록 없음";

  const inactiveBadgeColor =
    candidate.inactiveDays >= 90
      ? "bg-red-100 text-red-700 border-red-200 hover:bg-red-100"
      : candidate.inactiveDays >= 60
        ? "bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100"
        : "bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100";

  return (
    <div
      className={`flex items-center gap-2 rounded p-1.5 border transition-colors cursor-pointer ${
        checked ? "bg-muted/50 border-primary/30" : "hover:bg-muted/20"
      }`}
      onClick={() => onCheckedChange(!checked)}
    >
      <Checkbox
        id={`winback-${candidate.userId}`}
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
        onClick={(e) => e.stopPropagation()}
      />
      <Avatar className="h-6 w-6 shrink-0">
        <AvatarImage src={candidate.avatarUrl ?? undefined} />
        <AvatarFallback className="text-[10px]">
          {candidate.name.slice(0, 1)}
        </AvatarFallback>
      </Avatar>
      <label
        htmlFor={`winback-${candidate.userId}`}
        className="flex-1 text-xs font-medium cursor-pointer truncate"
        onClick={(e) => e.stopPropagation()}
      >
        {candidate.name}
      </label>
      <div className="flex items-center gap-1 shrink-0">
        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
          <Clock className="h-2.5 w-2.5" />
          {lastActivityLabel}
        </span>
        <Badge
          variant="outline"
          className={`text-[10px] px-1.5 py-0 ${inactiveBadgeColor}`}
        >
          {candidate.inactiveDays}일
        </Badge>
      </div>
    </div>
  );
}

export function WinbackCampaignDialog({ groupId }: WinbackCampaignDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<string>(MESSAGE_TEMPLATES[0]);

  const { candidates, totalCount, loading, sending, sendWinbackMessages } =
    useWinbackCampaign(groupId);

  // Dialog 열릴 때 초기화
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      // 모든 후보 기본 선택
      setSelectedIds(new Set(candidates.map((c) => c.userId)));
      setMessage(MESSAGE_TEMPLATES[0]);
    }
  };

  // 체크박스 토글
  const toggleMember = (userId: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) {
      next.add(userId);
    } else {
      next.delete(userId);
    }
    setSelectedIds(next);
  };

  // 전체 선택/해제
  const allSelected =
    candidates.length > 0 &&
    candidates.every((c) => selectedIds.has(c.userId));
  const someSelected =
    selectedIds.size > 0 && selectedIds.size < candidates.length;

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(candidates.map((c) => c.userId)));
    }
  };

  // 템플릿 선택
  const handleTemplateSelect = (template: string) => {
    setMessage(template);
  };

  // 발송 핸들러
  const handleSend = async () => {
    if (selectedIds.size === 0) {
      toast.error("발송할 멤버를 선택해주세요");
      return;
    }
    if (!message.trim()) {
      toast.error("메시지를 입력해주세요");
      return;
    }

    const result = await sendWinbackMessages(
      [...selectedIds],
      message.trim()
    );

    if (result.success) {
      toast.success(`${result.count}명에게 재참여 메시지를 발송했습니다`);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs">
          <Users className="h-3 w-3 mr-1" />
          재참여 캠페인
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-1.5">
            <UserCheck className="h-3.5 w-3.5 text-blue-500" />
            멤버 재참여 캠페인
          </DialogTitle>
        </DialogHeader>

        {/* 요약 배너 */}
        <div className="rounded border px-3 py-2 bg-muted/30">
          <p className="text-xs font-medium">
            30일 이상 비활성 멤버
          </p>
          {loading ? (
            <p className="text-[11px] text-muted-foreground mt-0.5">
              분석 중...
            </p>
          ) : (
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {totalCount > 0
                ? `총 ${totalCount}명이 감지됐습니다`
                : "비활성 멤버가 없습니다"}
            </p>
          )}
        </div>

        {loading ? (
          <div className="space-y-2 py-2">
            <div className="h-8 bg-muted animate-pulse rounded" />
            <div className="h-8 bg-muted animate-pulse rounded" />
            <div className="h-8 bg-muted animate-pulse rounded" />
          </div>
        ) : candidates.length === 0 ? (
          <div className="flex items-center gap-2 rounded p-2.5 bg-green-50 border border-green-200">
            <UserCheck className="h-4 w-4 text-green-600 shrink-0" />
            <p className="text-xs text-green-700">
              모든 멤버가 최근 30일 이내에 활동했습니다.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* 전체 선택 토글 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Checkbox
                  id="winback-select-all"
                  checked={allSelected}
                  data-state={someSelected ? "indeterminate" : undefined}
                  onCheckedChange={toggleAll}
                  className="h-3.5 w-3.5"
                />
                <label
                  htmlFor="winback-select-all"
                  className="text-[11px] text-muted-foreground cursor-pointer"
                >
                  {allSelected ? "전체 선택 해제" : "전체 선택"}
                </label>
              </div>
              <span className="text-[11px] text-muted-foreground">
                {selectedIds.size}명 선택됨
              </span>
            </div>

            {/* 멤버 목록 */}
            <div className="max-h-52 overflow-y-auto space-y-1 pr-0.5">
              {candidates.map((candidate) => (
                <CandidateRow
                  key={candidate.userId}
                  candidate={candidate}
                  checked={selectedIds.has(candidate.userId)}
                  onCheckedChange={(checked) =>
                    toggleMember(candidate.userId, checked)
                  }
                />
              ))}
            </div>

            {/* 메시지 템플릿 */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium">메시지 템플릿</p>
              <div className="space-y-1">
                {MESSAGE_TEMPLATES.map((template, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`w-full text-left text-[11px] px-2.5 py-1.5 rounded border transition-colors ${
                      message === template
                        ? "bg-primary/10 border-primary/40 text-primary"
                        : "border-border hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    {template}
                  </button>
                ))}
              </div>
            </div>

            {/* 커스텀 메시지 입력 */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium">발송 메시지</p>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="재참여 메시지를 입력하세요"
                className="text-xs min-h-[72px] resize-none"
                rows={3}
              />
            </div>

            {/* 발송 버튼 */}
            <Button
              size="sm"
              className="w-full h-8 text-xs gap-1.5"
              disabled={sending || selectedIds.size === 0}
              onClick={handleSend}
            >
              <Send className="h-3 w-3" />
              {sending
                ? "발송 중..."
                : `선택 멤버 ${selectedIds.size}명에게 발송`}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
