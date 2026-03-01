"use client";

import { useState, useCallback } from "react";
import { useAsyncAction } from "@/hooks/use-async-action";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Target,
  CheckCircle2,
  Clock,
  XCircle,
  StickyNote,
  Send,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import {
  useEngagementCampaign,
  type CreateCampaignInput,
} from "@/hooks/use-engagement-campaign";
import type {
  EngagementCampaign,
  EngagementCampaignStatus,
  EngagementGoalType,
} from "@/types";
import {
  ENGAGEMENT_GOAL_TYPE_LABELS,
  ENGAGEMENT_GOAL_TYPE_UNITS,
  ENGAGEMENT_CAMPAIGN_STATUS_LABELS,
  ENGAGEMENT_CAMPAIGN_MAX,
} from "@/types";

// ============================================
// Props
// ============================================

type EngagementCampaignCardProps = {
  groupId: string;
};

// ============================================
// 상수: 상태별 스타일
// ============================================

const STATUS_CONFIG: Record<
  EngagementCampaignStatus,
  {
    icon: React.ElementType;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    barColor: string;
  }
> = {
  active: {
    icon: Clock,
    badgeBg: "bg-blue-100",
    badgeText: "text-blue-700",
    badgeBorder: "border-blue-300",
    barColor: "bg-blue-500",
  },
  completed: {
    icon: CheckCircle2,
    badgeBg: "bg-green-100",
    badgeText: "text-green-700",
    badgeBorder: "border-green-300",
    barColor: "bg-green-500",
  },
  expired: {
    icon: XCircle,
    badgeBg: "bg-gray-100",
    badgeText: "text-gray-600",
    badgeBorder: "border-gray-300",
    barColor: "bg-gray-400",
  },
};

const GOAL_TYPE_OPTIONS: { value: EngagementGoalType; label: string }[] = [
  { value: "attendance", label: ENGAGEMENT_GOAL_TYPE_LABELS.attendance },
  { value: "posts", label: ENGAGEMENT_GOAL_TYPE_LABELS.posts },
  { value: "comments", label: ENGAGEMENT_GOAL_TYPE_LABELS.comments },
];

// ============================================
// 진행률 바 컴포넌트
// ============================================

function ProgressBar({
  current,
  goal,
  status,
}: {
  current: number;
  goal: number;
  status: EngagementCampaignStatus;
}) {
  const pct = goal > 0 ? Math.min(100, Math.round((current / goal) * 100)) : 0;
  const cfg = STATUS_CONFIG[status];

  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${cfg.barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] tabular-nums text-gray-500 shrink-0">
        {current}/{goal} ({pct}%)
      </span>
    </div>
  );
}

// ============================================
// 캠페인 생성 Dialog
// ============================================

const DEFAULT_FORM: CreateCampaignInput = {
  targetMemberName: "",
  goalType: "attendance",
  goalValue: 5,
  startDate: "",
  endDate: "",
  memo: "",
};

function CreateCampaignDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (input: CreateCampaignInput) => void;
}) {
  const [form, setForm] = useState<CreateCampaignInput>(DEFAULT_FORM);
  const { pending: submitting, execute } = useAsyncAction();

  const handleClose = useCallback(() => {
    setForm(DEFAULT_FORM);
    onOpenChange(false);
  }, [onOpenChange]);

  const handleSubmit = useCallback(() => {
    void execute(async () => {
      onSubmit(form);
      setForm(DEFAULT_FORM);
    });
  }, [execute, form, onSubmit]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">새 캠페인 생성</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* 대상 멤버 */}
          <div className="space-y-1">
            <Label className="text-xs">대상 멤버</Label>
            <Input
              className="h-8 text-xs"
              placeholder="멤버 이름 입력"
              value={form.targetMemberName}
              onChange={(e) => setForm((f) => ({ ...f, targetMemberName: e.target.value }))}
            />
          </div>

          {/* 기간 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">시작일</Label>
              <Input
                type="date"
                className="h-8 text-xs"
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">종료일</Label>
              <Input
                type="date"
                className="h-8 text-xs"
                value={form.endDate}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
              />
            </div>
          </div>

          {/* 목표 유형 + 목표값 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">목표 유형</Label>
              <Select
                value={form.goalType}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, goalType: v as EngagementGoalType }))
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GOAL_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">
                목표값 ({ENGAGEMENT_GOAL_TYPE_UNITS[form.goalType]})
              </Label>
              <Input
                type="number"
                min={1}
                className="h-8 text-xs"
                value={form.goalValue}
                onChange={(e) =>
                  setForm((f) => ({ ...f, goalValue: parseInt(e.target.value, 10) || 1 }))
                }
              />
            </div>
          </div>

          {/* 초기 메모 */}
          <div className="space-y-1">
            <Label className="text-xs">메모 (선택)</Label>
            <Textarea
              className="text-xs resize-none h-16"
              placeholder="캠페인 시작 시 남길 메모..."
              value={form.memo}
              onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleClose}>
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSubmit}
            disabled={submitting}
          >
            생성
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 캠페인 단일 행 컴포넌트
// ============================================

function CampaignRow({
  campaign,
  onComplete,
  onDelete,
  onAddMemo,
  onUpdateProgress,
}: {
  campaign: EngagementCampaign;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onAddMemo: (id: string, content: string) => void;
  onUpdateProgress: (id: string, value: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [memoInput, setMemoInput] = useState("");
  const [progressInput, setProgressInput] = useState(String(campaign.currentValue));

  const cfg = STATUS_CONFIG[campaign.status];
  const StatusIcon = cfg.icon;

  const handleAddMemo = useCallback(() => {
    if (!memoInput.trim()) return;
    onAddMemo(campaign.id, memoInput);
    setMemoInput("");
  }, [campaign.id, memoInput, onAddMemo]);

  const handleProgressBlur = useCallback(() => {
    const val = parseInt(progressInput, 10);
    if (!isNaN(val) && val !== campaign.currentValue) {
      onUpdateProgress(campaign.id, val);
    }
  }, [campaign.id, campaign.currentValue, progressInput, onUpdateProgress]);

  return (
    <div className="border border-gray-100 rounded-md overflow-hidden">
      {/* 행 헤더 */}
      <button
        type="button"
        className="w-full px-3 py-2 flex flex-col gap-1 text-left hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* 멤버명 + 상태 배지 */}
        <div className="flex items-center gap-1.5">
          <StatusIcon className={`h-3 w-3 shrink-0 ${cfg.badgeText}`} />
          <span className="text-xs font-medium text-gray-800 flex-1 min-w-0 truncate">
            {campaign.targetMemberName}
          </span>
          <Badge
            className={`text-[9px] px-1.5 py-0 border shrink-0 ${cfg.badgeBg} ${cfg.badgeText} ${cfg.badgeBorder}`}
          >
            {ENGAGEMENT_CAMPAIGN_STATUS_LABELS[campaign.status]}
          </Badge>
          {expanded ? (
            <ChevronUp className="h-3 w-3 text-gray-400 shrink-0" />
          ) : (
            <ChevronDown className="h-3 w-3 text-gray-400 shrink-0" />
          )}
        </div>

        {/* 목표 설명 */}
        <p className="text-[10px] text-gray-500 pl-4">
          {ENGAGEMENT_GOAL_TYPE_LABELS[campaign.goalType].replace(
            "N",
            String(campaign.goalValue),
          )}{" "}
          &middot; {campaign.startDate} ~ {campaign.endDate}
        </p>

        {/* 진행률 바 */}
        <div className="pl-4">
          <ProgressBar
            current={campaign.currentValue}
            goal={campaign.goalValue}
            status={campaign.status}
          />
        </div>
      </button>

      {/* 펼침 내용 */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50/50 px-3 py-2 space-y-2">
          {/* 진행값 수동 수정 */}
          {campaign.status === "active" && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-500 shrink-0">진행값 수정</span>
              <Input
                type="number"
                min={0}
                className="h-6 text-xs w-20"
                value={progressInput}
                onChange={(e) => setProgressInput(e.target.value)}
                onBlur={handleProgressBlur}
              />
              <span className="text-[10px] text-gray-400">
                / {campaign.goalValue} {ENGAGEMENT_GOAL_TYPE_UNITS[campaign.goalType]}
              </span>
            </div>
          )}

          {/* 메모 이력 */}
          {campaign.memos.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-[10px] text-gray-500 font-medium">
                <StickyNote className="h-2.5 w-2.5" />
                메모 이력
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {campaign.memos.map((memo) => (
                  <div
                    key={memo.id}
                    className="text-[10px] text-gray-600 bg-muted/30 rounded px-2 py-1 border border-gray-100"
                  >
                    <p>{memo.content}</p>
                    <p className="text-gray-400 mt-0.5">
                      {new Date(memo.createdAt).toLocaleDateString("ko-KR", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 메모 추가 입력 */}
          <div className="flex gap-1.5 items-end">
            <Textarea
              className="text-xs resize-none h-12 flex-1"
              placeholder="진행 메모 추가..."
              value={memoInput}
              onChange={(e) => setMemoInput(e.target.value)}
            />
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0 shrink-0"
              onClick={handleAddMemo}
              disabled={!memoInput.trim()}
            >
              <Send className="h-3 w-3" />
            </Button>
          </div>

          {/* 액션 버튼 */}
          <div className="flex items-center gap-1.5 pt-0.5">
            {campaign.status === "active" && (
              <Button
                size="sm"
                className="h-6 text-[10px] px-2 bg-green-600 hover:bg-green-700 text-white"
                onClick={() => onComplete(campaign.id)}
              >
                <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                완료 처리
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[10px] px-2 text-red-500 hover:text-red-600 hover:bg-red-50 ml-auto"
              onClick={() => onDelete(campaign.id)}
            >
              <Trash2 className="h-2.5 w-2.5 mr-1" />
              삭제
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// 스켈레톤
// ============================================

function CampaignSkeleton() {
  return (
    <div className="space-y-2 p-3">
      {[1, 2].map((i) => (
        <div key={i} className="border border-gray-100 rounded-md px-3 py-2 space-y-1.5">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-3 w-24 flex-1" />
            <Skeleton className="h-4 w-12 rounded-full" />
          </div>
          <Skeleton className="h-2.5 w-40 ml-4" />
          <Skeleton className="h-1.5 w-full ml-4" />
        </div>
      ))}
    </div>
  );
}

// ============================================
// 메인 컴포넌트
// ============================================

export function EngagementCampaignCard({ groupId }: EngagementCampaignCardProps) {
  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const {
    campaigns,
    loading,
    activeCount,
    createCampaign,
    completeCampaign,
    updateProgress,
    addMemo,
    deleteCampaign,
  } = useEngagementCampaign(groupId);

  // ---- 캠페인 생성 핸들러 ----
  const handleCreate = useCallback(
    (input: CreateCampaignInput) => {
      const result = createCampaign(input);
      if (!result.ok) {
        toast.error(result.message ?? "캠페인 생성에 실패했습니다.");
        return;
      }
      toast.success(TOAST.MEMBERS.CAMPAIGN_CREATED);
      setDialogOpen(false);
    },
    [createCampaign],
  );

  // ---- 완료 핸들러 ----
  const handleComplete = useCallback(
    (id: string) => {
      completeCampaign(id);
      toast.success(TOAST.MEMBERS.CAMPAIGN_COMPLETED);
    },
    [completeCampaign],
  );

  // ---- 삭제 핸들러 ----
  const handleDelete = useCallback(
    (id: string) => {
      deleteCampaign(id);
      toast.success(TOAST.MEMBERS.CAMPAIGN_DELETED);
    },
    [deleteCampaign],
  );

  // ---- 메모 추가 핸들러 ----
  const handleAddMemo = useCallback(
    (id: string, content: string) => {
      const result = addMemo(id, content);
      if (!result.ok) {
        toast.error(result.message ?? "메모 추가에 실패했습니다.");
        return;
      }
      toast.success(TOAST.MEMBERS.CAMPAIGN_MEMO_ADDED);
    },
    [addMemo],
  );

  // ---- 진행값 업데이트 핸들러 ----
  const handleUpdateProgress = useCallback(
    (id: string, value: number) => {
      updateProgress(id, value);
    },
    [updateProgress],
  );

  // ---- 로딩 상태 ----
  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-card mt-4 overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2.5">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-3 w-32" />
          <div className="ml-auto">
            <Skeleton className="h-6 w-20 rounded" />
          </div>
        </div>
        <CampaignSkeleton />
      </div>
    );
  }

  return (
    <>
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="rounded-lg border border-indigo-200 mt-4 overflow-hidden">
          {/* 카드 헤더 */}
          <div className="flex items-center gap-2 px-3 py-2.5 bg-indigo-50/60">
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="flex-1 flex items-center gap-2 h-auto p-0 hover:bg-transparent justify-start"
              >
                <Target className="h-4 w-4 text-indigo-600 shrink-0" />
                <span className="text-xs font-semibold text-indigo-800">참여도 목표 캠페인</span>
                {activeCount > 0 && (
                  <Badge className="text-[9px] px-1.5 py-0 border bg-indigo-100 text-indigo-700 border-indigo-300">
                    진행 중 {activeCount}
                  </Badge>
                )}
                {campaigns.length > 0 && (
                  <Badge className="text-[9px] px-1.5 py-0 border bg-gray-100 text-gray-600 border-gray-300">
                    전체 {campaigns.length}/{ENGAGEMENT_CAMPAIGN_MAX}
                  </Badge>
                )}
                {open ? (
                  <ChevronUp className="h-3.5 w-3.5 text-indigo-500 ml-auto" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-indigo-500 ml-auto" />
                )}
              </Button>
            </CollapsibleTrigger>

            {/* 새 캠페인 버튼 */}
            <Button
              size="sm"
              className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white shrink-0"
              onClick={() => setDialogOpen(true)}
              disabled={campaigns.length >= ENGAGEMENT_CAMPAIGN_MAX}
            >
              <Plus className="h-3 w-3 mr-1" />
              새 캠페인
            </Button>
          </div>

          {/* 펼침 내용 */}
          <CollapsibleContent>
            <div className="border-t border-indigo-100 p-3 space-y-2">
              {campaigns.length === 0 ? (
                <p className="text-[11px] text-gray-400 text-center py-3">
                  등록된 캠페인이 없습니다.
                </p>
              ) : (
                campaigns.map((campaign) => (
                  <CampaignRow
                    key={campaign.id}
                    campaign={campaign}
                    onComplete={handleComplete}
                    onDelete={handleDelete}
                    onAddMemo={handleAddMemo}
                    onUpdateProgress={handleUpdateProgress}
                  />
                ))
              )}

              {campaigns.length >= ENGAGEMENT_CAMPAIGN_MAX && (
                <p className="text-[10px] text-amber-600 text-center">
                  최대 {ENGAGEMENT_CAMPAIGN_MAX}개까지 생성할 수 있습니다.
                </p>
              )}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* 캠페인 생성 Dialog */}
      <CreateCampaignDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreate}
      />
    </>
  );
}
