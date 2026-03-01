"use client";

import { useState } from "react";
import {
  Megaphone,
  Plus,
  Pencil,
  Trash2,
  X,
  Instagram,
  Youtube,
  Twitter,
  Facebook,
  Mail,
  FileText,
  Printer,
  Globe,
  Users,
  Wallet,
  Link,
  User,
  CalendarClock,
  CheckCircle2,
  Circle,
  Loader,
  Settings,
} from "lucide-react";
import { toast } from "sonner";

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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  useMarketingCampaign,
  type AddTaskParams,
} from "@/hooks/use-marketing-campaign";
import type { MarketingCampaignTask, MarketingChannel } from "@/types";

// ============================================================
// 상수
// ============================================================

const CHANNEL_LABELS: Record<MarketingChannel, string> = {
  instagram: "인스타그램",
  youtube: "유튜브",
  tiktok: "틱톡",
  twitter: "트위터",
  facebook: "페이스북",
  poster: "포스터",
  flyer: "전단지",
  email: "이메일",
  other: "기타",
};

const CHANNEL_BADGE_CLASS: Record<MarketingChannel, string> = {
  instagram: "bg-pink-100 text-pink-700 border-pink-200",
  youtube: "bg-red-100 text-red-700 border-red-200",
  tiktok: "bg-gray-100 text-gray-700 border-gray-200",
  twitter: "bg-sky-100 text-sky-700 border-sky-200",
  facebook: "bg-blue-100 text-blue-700 border-blue-200",
  poster: "bg-purple-100 text-purple-700 border-purple-200",
  flyer: "bg-orange-100 text-orange-700 border-orange-200",
  email: "bg-green-100 text-green-700 border-green-200",
  other: "bg-slate-100 text-slate-700 border-slate-200",
};

const STATUS_LABELS: Record<MarketingCampaignTask["status"], string> = {
  todo: "할 일",
  in_progress: "진행 중",
  done: "완료",
};

const STATUS_COLUMN_CLASS: Record<MarketingCampaignTask["status"], string> = {
  todo: "border-blue-200 bg-blue-50/40",
  in_progress: "border-yellow-200 bg-yellow-50/40",
  done: "border-green-200 bg-green-50/40",
};

const STATUS_HEADER_CLASS: Record<MarketingCampaignTask["status"], string> = {
  todo: "text-blue-700",
  in_progress: "text-yellow-700",
  done: "text-green-700",
};

const ALL_STATUSES: MarketingCampaignTask["status"][] = [
  "todo",
  "in_progress",
  "done",
];

const ALL_CHANNELS: MarketingChannel[] = [
  "instagram",
  "youtube",
  "tiktok",
  "twitter",
  "facebook",
  "poster",
  "flyer",
  "email",
  "other",
];

// ============================================================
// 채널 아이콘 컴포넌트
// ============================================================

function ChannelIcon({ channel }: { channel: MarketingChannel }) {
  const cls = "h-3 w-3";
  switch (channel) {
    case "instagram":
      return <Instagram className={cls} />;
    case "youtube":
      return <Youtube className={cls} />;
    case "tiktok":
      return <Globe className={cls} />;
    case "twitter":
      return <Twitter className={cls} />;
    case "facebook":
      return <Facebook className={cls} />;
    case "poster":
      return <FileText className={cls} />;
    case "flyer":
      return <Printer className={cls} />;
    case "email":
      return <Mail className={cls} />;
    default:
      return <Globe className={cls} />;
  }
}

// ============================================================
// 상태 아이콘 컴포넌트
// ============================================================

function StatusIcon({ status }: { status: MarketingCampaignTask["status"] }) {
  const cls = "h-3.5 w-3.5";
  switch (status) {
    case "todo":
      return <Circle className={`${cls} text-blue-500`} />;
    case "in_progress":
      return <Loader className={`${cls} text-yellow-500`} />;
    case "done":
      return <CheckCircle2 className={`${cls} text-green-500`} />;
  }
}

// ============================================================
// 태스크 카드 컴포넌트
// ============================================================

type TaskCardProps = {
  task: MarketingCampaignTask;
  onEdit: (task: MarketingCampaignTask) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (taskId: string, status: MarketingCampaignTask["status"]) => void;
};

function TaskCard({ task, onEdit, onDelete, onStatusChange }: TaskCardProps) {
  const isOverdue =
    task.dueDate &&
    task.status !== "done" &&
    new Date(task.dueDate) < new Date(new Date().toDateString());

  return (
    <div className="bg-card rounded-md border border-gray-100 p-2.5 shadow-sm space-y-1.5">
      {/* 채널 배지 + 상태 아이콘 */}
      <div className="flex items-center justify-between gap-1">
        <Badge
          variant="outline"
          className={`text-[10px] px-1.5 py-0 gap-0.5 ${CHANNEL_BADGE_CLASS[task.channel]}`}
        >
          <ChannelIcon channel={task.channel} />
          <span className="ml-0.5">{CHANNEL_LABELS[task.channel]}</span>
        </Badge>
        <div className="flex items-center gap-1">
          <Select
            value={task.status}
            onValueChange={(val) =>
              onStatusChange(task.id, val as MarketingCampaignTask["status"])
            }
          >
            <SelectTrigger className="h-5 w-auto text-[10px] border-0 shadow-none p-0 gap-0.5 focus:ring-0">
              <StatusIcon status={task.status} />
            </SelectTrigger>
            <SelectContent align="end">
              {ALL_STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="text-xs">
                  {STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            onClick={() => onEdit(task)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="수정"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="text-gray-400 hover:text-red-500 transition-colors"
            aria-label="삭제"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* 태스크 제목 */}
      <p className={`text-xs font-medium leading-tight ${task.status === "done" ? "line-through text-gray-400" : "text-gray-800"}`}>
        {task.title}
      </p>

      {/* 메타 정보 */}
      <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-gray-400">
        {task.assignee && (
          <span className="flex items-center gap-0.5">
            <User className="h-3 w-3" />
            {task.assignee}
          </span>
        )}
        {task.dueDate && (
          <span
            className={`flex items-center gap-0.5 ${isOverdue ? "text-red-500 font-medium" : ""}`}
          >
            <CalendarClock className="h-3 w-3" />
            {task.dueDate}
            {isOverdue && " (기한 초과)"}
          </span>
        )}
        {task.contentUrl && (
          <a
            href={task.contentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-0.5 text-blue-400 hover:text-blue-600"
            onClick={(e) => e.stopPropagation()}
          >
            <Link className="h-3 w-3" />
            링크
          </a>
        )}
      </div>

      {/* 메모 */}
      {task.notes && (
        <p className="text-[10px] text-gray-400 leading-tight line-clamp-2">
          {task.notes}
        </p>
      )}
    </div>
  );
}

// ============================================================
// 태스크 다이얼로그
// ============================================================

type TaskDialogMode = "add" | "edit";

type TaskDialogProps = {
  open: boolean;
  mode: TaskDialogMode;
  initial?: Partial<MarketingCampaignTask>;
  onClose: () => void;
  onSubmit: (params: AddTaskParams) => void;
};

function TaskDialog({ open, mode, initial, onClose, onSubmit }: TaskDialogProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [channel, setChannel] = useState<MarketingChannel>(
    initial?.channel ?? "instagram"
  );
  const [assignee, setAssignee] = useState(initial?.assignee ?? "");
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? "");
  const [status, setStatus] = useState<MarketingCampaignTask["status"]>(
    initial?.status ?? "todo"
  );
  const [contentUrl, setContentUrl] = useState(initial?.contentUrl ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  // open 변경 시 초기값 재설정
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setTitle(initial?.title ?? "");
      setChannel(initial?.channel ?? "instagram");
      setAssignee(initial?.assignee ?? "");
      setDueDate(initial?.dueDate ?? "");
      setStatus(initial?.status ?? "todo");
      setContentUrl(initial?.contentUrl ?? "");
      setNotes(initial?.notes ?? "");
    }
  }

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("태스크 제목을 입력해주세요.");
      return;
    }
    onSubmit({
      title: title.trim(),
      channel,
      assignee: assignee.trim() || null,
      dueDate: dueDate || null,
      status,
      contentUrl: contentUrl.trim() || null,
      notes: notes.trim(),
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">
            {mode === "add" ? "태스크 추가" : "태스크 수정"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* 제목 */}
          <div className="space-y-1">
            <Label className="text-xs">제목 *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예) 공연 홍보 인스타그램 릴스 제작"
              className="h-8 text-xs"
            />
          </div>

          {/* 채널 */}
          <div className="space-y-1">
            <Label className="text-xs">채널 *</Label>
            <Select
              value={channel}
              onValueChange={(v) => setChannel(v as MarketingChannel)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_CHANNELS.map((ch) => (
                  <SelectItem key={ch} value={ch} className="text-xs">
                    {CHANNEL_LABELS[ch]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 상태 */}
          <div className="space-y-1">
            <Label className="text-xs">상태</Label>
            <Select
              value={status}
              onValueChange={(v) =>
                setStatus(v as MarketingCampaignTask["status"])
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="text-xs">
                    {STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 담당자 / 마감일 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">담당자</Label>
              <Input
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                placeholder="이름"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">마감일</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* 콘텐츠 URL */}
          <div className="space-y-1">
            <Label className="text-xs">콘텐츠 URL</Label>
            <Input
              value={contentUrl}
              onChange={(e) => setContentUrl(e.target.value)}
              placeholder="https://..."
              className="h-8 text-xs"
            />
          </div>

          {/* 메모 */}
          <div className="space-y-1">
            <Label className="text-xs">메모</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="추가 내용을 입력하세요"
              className="text-xs min-h-[60px] resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={onClose}
          >
            <X className="h-3 w-3 mr-1" />
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            {mode === "add" ? "추가" : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 캠페인 정보 수정 다이얼로그
// ============================================================

type CampaignInfoDialogProps = {
  open: boolean;
  campaignName: string;
  targetAudience: string | null;
  budget: number | null;
  onClose: () => void;
  onSubmit: (name: string, audience: string | null, budget: number | null) => void;
};

function CampaignInfoDialog({
  open,
  campaignName,
  targetAudience,
  budget,
  onClose,
  onSubmit,
}: CampaignInfoDialogProps) {
  const [name, setName] = useState(campaignName);
  const [audience, setAudience] = useState(targetAudience ?? "");
  const [budgetStr, setBudgetStr] = useState(budget != null ? String(budget) : "");

  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setName(campaignName);
      setAudience(targetAudience ?? "");
      setBudgetStr(budget != null ? String(budget) : "");
    }
  }

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("캠페인 이름을 입력해주세요.");
      return;
    }
    const parsedBudget =
      budgetStr.trim() !== "" ? Number(budgetStr.replace(/,/g, "")) : null;
    onSubmit(
      name.trim(),
      audience.trim() || null,
      isNaN(parsedBudget as number) ? null : parsedBudget
    );
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">캠페인 정보 설정</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div className="space-y-1">
            <Label className="text-xs">캠페인 이름 *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예) 봄 공연 홍보 캠페인"
              className="h-8 text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">타겟 관객</Label>
            <Input
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="예) 10~30대 댄스 관심 SNS 사용자"
              className="h-8 text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">예산 (원)</Label>
            <Input
              type="number"
              value={budgetStr}
              onChange={(e) => setBudgetStr(e.target.value)}
              placeholder="예) 200000"
              className="h-8 text-xs"
              min={0}
            />
          </div>
        </div>

        <DialogFooter className="gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={onClose}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 메인 컴포넌트
// ============================================================

type MarketingCampaignCardProps = {
  projectId: string;
};

export function MarketingCampaignCard({ projectId }: MarketingCampaignCardProps) {
  const {
    campaign,
    loading,
    addTask,
    updateTask,
    deleteTask,
    setCampaignInfo,
    totalTasks,
    completedTasks,
    progressRate,
    channelBreakdown,
    upcomingDeadlines,
  } = useMarketingCampaign(projectId);

  // 다이얼로그 상태
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<MarketingCampaignTask | null>(null);
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // ——— 핸들러 ———

  const handleAddTask = (params: AddTaskParams) => {
    addTask(params);
    toast.success("태스크가 추가되었습니다.");
  };

  const handleUpdateTask = (params: AddTaskParams) => {
    if (!editingTask) return;
    updateTask(editingTask.id, params);
    toast.success("태스크가 수정되었습니다.");
    setEditingTask(null);
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTask(taskId);
    toast.success("태스크가 삭제되었습니다.");
    setDeleteConfirmId(null);
  };

  const handleStatusChange = (
    taskId: string,
    status: MarketingCampaignTask["status"]
  ) => {
    updateTask(taskId, { status });
    toast.success(`상태가 "${STATUS_LABELS[status]}"로 변경되었습니다.`);
  };

  const handleSetCampaignInfo = (
    name: string,
    audience: string | null,
    budget: number | null
  ) => {
    setCampaignInfo({ campaignName: name, targetAudience: audience, budget });
    toast.success("캠페인 정보가 저장되었습니다.");
  };

  // ——— 칸반 컬럼별 태스크 분류 ———
  const tasksByStatus = (status: MarketingCampaignTask["status"]) =>
    campaign.tasks.filter((t) => t.status === status);

  // ——— 로딩 상태 ———
  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-xs text-gray-400">
          불러오는 중...
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Megaphone className="h-4 w-4 text-pink-500" />
              <CardTitle className="text-sm">공연 마케팅 캠페인</CardTitle>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs px-2"
                onClick={() => setInfoDialogOpen(true)}
              >
                <Settings className="h-3 w-3 mr-1" />
                설정
              </Button>
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={() => setTaskDialogOpen(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                추가
              </Button>
            </div>
          </div>

          {/* 캠페인 정보 헤더 */}
          <div className="mt-2 space-y-1">
            {campaign.campaignName ? (
              <p className="text-sm font-medium text-gray-800">
                {campaign.campaignName}
              </p>
            ) : (
              <p className="text-xs text-gray-400 italic">
                캠페인 이름을 설정해주세요
              </p>
            )}
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500">
              {campaign.targetAudience && (
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {campaign.targetAudience}
                </span>
              )}
              {campaign.budget != null && (
                <span className="flex items-center gap-1">
                  <Wallet className="h-3 w-3" />
                  {campaign.budget.toLocaleString()}원
                </span>
              )}
            </div>
          </div>

          {/* 진행률 바 */}
          {totalTasks > 0 && (
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-[10px] text-gray-500">
                <span>
                  전체 진행률 ({completedTasks}/{totalTasks} 완료)
                </span>
                <span className="font-medium text-gray-700">{progressRate}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-pink-400 to-rose-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressRate}%` }}
                />
              </div>
            </div>
          )}

          {/* 다가오는 마감 알림 */}
          {upcomingDeadlines.length > 0 && (
            <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
              <p className="text-[10px] font-medium text-amber-700 mb-1">
                7일 이내 마감 태스크 ({upcomingDeadlines.length}개)
              </p>
              <div className="space-y-0.5">
                {upcomingDeadlines.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between text-[10px] text-amber-600"
                  >
                    <span className="truncate max-w-[60%]">{task.title}</span>
                    <span>{task.dueDate}</span>
                  </div>
                ))}
                {upcomingDeadlines.length > 3 && (
                  <p className="text-[10px] text-amber-500">
                    +{upcomingDeadlines.length - 3}개 더
                  </p>
                )}
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="pt-0 space-y-4">
          {/* 빈 상태 */}
          {totalTasks === 0 && (
            <div className="text-center py-8 text-gray-400">
              <Megaphone className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">아직 마케팅 태스크가 없습니다.</p>
              <p className="text-[10px] mt-0.5">
                SNS 홍보, 포스터 제작 등 캠페인 업무를 추가해보세요.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-3 h-7 text-xs"
                onClick={() => setTaskDialogOpen(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                첫 태스크 추가
              </Button>
            </div>
          )}

          {/* 칸반 보드 */}
          {totalTasks > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {ALL_STATUSES.map((status) => {
                const tasks = tasksByStatus(status);
                return (
                  <div
                    key={status}
                    className={`rounded-lg border p-2 min-h-[120px] ${STATUS_COLUMN_CLASS[status]}`}
                  >
                    {/* 컬럼 헤더 */}
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-[11px] font-semibold ${STATUS_HEADER_CLASS[status]}`}
                      >
                        {STATUS_LABELS[status]}
                      </span>
                      <span className="text-[10px] text-gray-400 bg-background rounded-full px-1.5 py-0.5 border">
                        {tasks.length}
                      </span>
                    </div>

                    {/* 태스크 목록 */}
                    <div className="space-y-1.5">
                      {tasks.length === 0 && (
                        <p className="text-[10px] text-gray-300 text-center pt-4">
                          없음
                        </p>
                      )}
                      {tasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onEdit={(t) => setEditingTask(t)}
                          onDelete={(id) => setDeleteConfirmId(id)}
                          onStatusChange={handleStatusChange}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 채널별 분포 차트 */}
          {channelBreakdown.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-gray-600">채널별 분포</p>
              <div className="space-y-1">
                {channelBreakdown.map(({ channel, total, done }) => {
                  const rate = Math.round((done / total) * 100);
                  return (
                    <div key={channel} className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 gap-0.5 shrink-0 w-20 justify-center ${CHANNEL_BADGE_CLASS[channel]}`}
                      >
                        <ChannelIcon channel={channel} />
                        <span className="ml-0.5 truncate">
                          {CHANNEL_LABELS[channel]}
                        </span>
                      </Badge>
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-pink-400 to-rose-500 rounded-full transition-all"
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-500 shrink-0 w-12 text-right">
                        {done}/{total} ({rate}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 태스크 추가 다이얼로그 */}
      <TaskDialog
        open={taskDialogOpen}
        mode="add"
        onClose={() => setTaskDialogOpen(false)}
        onSubmit={handleAddTask}
      />

      {/* 태스크 수정 다이얼로그 */}
      {editingTask && (
        <TaskDialog
          open={!!editingTask}
          mode="edit"
          initial={editingTask}
          onClose={() => setEditingTask(null)}
          onSubmit={handleUpdateTask}
        />
      )}

      {/* 캠페인 정보 설정 다이얼로그 */}
      <CampaignInfoDialog
        open={infoDialogOpen}
        campaignName={campaign.campaignName}
        targetAudience={campaign.targetAudience}
        budget={campaign.budget}
        onClose={() => setInfoDialogOpen(false)}
        onSubmit={handleSetCampaignInfo}
      />

      {/* 삭제 확인 다이얼로그 */}
      <Dialog
        open={!!deleteConfirmId}
        onOpenChange={(v) => !v && setDeleteConfirmId(null)}
      >
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-sm">태스크 삭제</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-gray-600 py-1">
            이 태스크를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
          </p>
          <DialogFooter className="gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setDeleteConfirmId(null)}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="h-7 text-xs"
              onClick={() =>
                deleteConfirmId && handleDeleteTask(deleteConfirmId)
              }
            >
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
