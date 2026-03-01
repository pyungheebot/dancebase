"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { Button } from "@/components/ui/button";
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
import type { MarketingCampaignTask, MarketingChannel } from "@/types";
import type { AddTaskParams } from "@/hooks/use-marketing-campaign";
import { CHANNEL_LABELS, STATUS_LABELS, ALL_STATUSES, ALL_CHANNELS } from "./types";

export type TaskDialogMode = "add" | "edit";

export type TaskDialogProps = {
  open: boolean;
  mode: TaskDialogMode;
  initial?: Partial<MarketingCampaignTask>;
  onClose: () => void;
  onSubmit: (params: AddTaskParams) => void;
};

export function TaskDialog({
  open,
  mode,
  initial,
  onClose,
  onSubmit,
}: TaskDialogProps) {
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
      toast.error(TOAST.CAMPAIGN.TASK_TITLE_REQUIRED);
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

  const dialogId = mode === "add" ? "task-add-dialog" : "task-edit-dialog";
  const titleId = `${dialogId}-title`;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md" aria-labelledby={titleId}>
        <DialogHeader>
          <DialogTitle id={titleId} className="text-sm">
            {mode === "add" ? "태스크 추가" : "태스크 수정"}
          </DialogTitle>
        </DialogHeader>

        <fieldset className="space-y-3 py-1 border-0 p-0 m-0">
          <legend className="sr-only">
            {mode === "add" ? "새 태스크 정보" : "태스크 수정 정보"}
          </legend>

          {/* 제목 */}
          <div className="space-y-1">
            <Label htmlFor={`${dialogId}-title-input`} className="text-xs">
              제목 *
            </Label>
            <Input
              id={`${dialogId}-title-input`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예) 공연 홍보 인스타그램 릴스 제작"
              className="h-8 text-xs"
              aria-required="true"
            />
          </div>

          {/* 채널 */}
          <div className="space-y-1">
            <Label htmlFor={`${dialogId}-channel`} className="text-xs">
              채널 *
            </Label>
            <Select
              value={channel}
              onValueChange={(v) => setChannel(v as MarketingChannel)}
            >
              <SelectTrigger
                id={`${dialogId}-channel`}
                className="h-8 text-xs"
                aria-required="true"
              >
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
            <Label htmlFor={`${dialogId}-status`} className="text-xs">
              상태
            </Label>
            <Select
              value={status}
              onValueChange={(v) =>
                setStatus(v as MarketingCampaignTask["status"])
              }
            >
              <SelectTrigger
                id={`${dialogId}-status`}
                className="h-8 text-xs"
              >
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
              <Label htmlFor={`${dialogId}-assignee`} className="text-xs">
                담당자
              </Label>
              <Input
                id={`${dialogId}-assignee`}
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                placeholder="이름"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`${dialogId}-due-date`} className="text-xs">
                마감일
              </Label>
              <Input
                id={`${dialogId}-due-date`}
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* 콘텐츠 URL */}
          <div className="space-y-1">
            <Label htmlFor={`${dialogId}-content-url`} className="text-xs">
              콘텐츠 URL
            </Label>
            <Input
              id={`${dialogId}-content-url`}
              value={contentUrl}
              onChange={(e) => setContentUrl(e.target.value)}
              placeholder="https://..."
              className="h-8 text-xs"
              type="url"
            />
          </div>

          {/* 메모 */}
          <div className="space-y-1">
            <Label htmlFor={`${dialogId}-notes`} className="text-xs">
              메모
            </Label>
            <Textarea
              id={`${dialogId}-notes`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="추가 내용을 입력하세요"
              className="text-xs min-h-[60px] resize-none"
            />
          </div>
        </fieldset>

        <DialogFooter className="gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={onClose}
          >
            <X className="h-3 w-3 mr-1" aria-hidden="true" />
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
