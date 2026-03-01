"use client";

import { useState } from "react";
import { useAsyncAction } from "@/hooks/use-async-action";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Target, X } from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import type { MemberGoalCategory, MemberGoalPriority } from "@/types";
import {
  CATEGORY_LABELS,
  ALL_CATEGORIES,
  DEFAULT_ADD_GOAL_FORM,
  todayStr,
  type AddGoalFormData,
} from "./member-goal-types";

// ============================================
// 타입
// ============================================

type AddGoalDialogProps = {
  memberNames: string[];
  onAdd: (params: AddGoalFormData) => void;
};

// ============================================
// 컴포넌트
// ============================================

export function AddGoalDialog({ memberNames, onAdd }: AddGoalDialogProps) {
  const [open, setOpen] = useState(false);
  const [memberName, setMemberName] = useState(memberNames[0] ?? "");
  const [category, setCategory] = useState<MemberGoalCategory>(
    DEFAULT_ADD_GOAL_FORM.category
  );
  const [title, setTitle] = useState(DEFAULT_ADD_GOAL_FORM.title);
  const [description, setDescription] = useState(DEFAULT_ADD_GOAL_FORM.description);
  const [priority, setPriority] = useState<MemberGoalPriority>(
    DEFAULT_ADD_GOAL_FORM.priority
  );
  const [targetDate, setTargetDate] = useState(DEFAULT_ADD_GOAL_FORM.targetDate);
  const [milestoneInput, setMilestoneInput] = useState("");
  const [milestones, setMilestones] = useState<string[]>([]);
  const { pending: submitting, execute } = useAsyncAction();

  const memberSelectId = "add-goal-member";
  const categorySelectId = "add-goal-category";
  const titleInputId = "add-goal-title";
  const descInputId = "add-goal-desc";
  const prioritySelectId = "add-goal-priority";
  const dateInputId = "add-goal-date";
  const milestoneInputId = "add-goal-milestone-input";

  const resetForm = () => {
    setMemberName(memberNames[0] ?? "");
    setCategory(DEFAULT_ADD_GOAL_FORM.category);
    setTitle(DEFAULT_ADD_GOAL_FORM.title);
    setDescription(DEFAULT_ADD_GOAL_FORM.description);
    setPriority(DEFAULT_ADD_GOAL_FORM.priority);
    setTargetDate(DEFAULT_ADD_GOAL_FORM.targetDate);
    setMilestoneInput("");
    setMilestones([]);
  };

  const handleAddMilestone = () => {
    const trimmed = milestoneInput.trim();
    if (!trimmed) return;
    if (milestones.length >= 10) {
      toast.error(TOAST.MEMBERS.GOAL_MILESTONE_MAX);
      return;
    }
    setMilestones((prev) => [...prev, trimmed]);
    setMilestoneInput("");
  };

  const handleRemoveMilestone = (index: number) => {
    setMilestones((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!memberName) {
      toast.error(TOAST.MEMBERS.GOAL_MEMBER_REQUIRED);
      return;
    }
    if (!title.trim()) {
      toast.error(TOAST.MEMBERS.GOAL_TITLE_REQUIRED);
      return;
    }
    if (!targetDate) {
      toast.error(TOAST.MEMBERS.GOAL_DATE_REQUIRED);
      return;
    }
    void execute(async () => {
      onAdd({
        memberName,
        category,
        title: title.trim(),
        description: description.trim(),
        priority,
        targetDate,
        milestones,
      });
      resetForm();
      setOpen(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={(e) => e.stopPropagation()}
          aria-label="새 목표 추가 다이얼로그 열기"
        >
          <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
          목표 추가
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-sm"
        onClick={(e) => e.stopPropagation()}
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-1.5 text-sm">
            <Target className="h-4 w-4 text-primary" aria-hidden="true" />
            멤버 목표 추가
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          {/* 멤버 선택 */}
          <div className="space-y-1">
            <label
              htmlFor={memberSelectId}
              className="text-[11px] font-medium text-muted-foreground"
            >
              멤버 <span className="text-destructive" aria-hidden="true">*</span>
              <span className="sr-only">(필수)</span>
            </label>
            <Select value={memberName} onValueChange={setMemberName}>
              <SelectTrigger id={memberSelectId} className="h-8 text-xs">
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

          {/* 카테고리 */}
          <div className="space-y-1">
            <label
              htmlFor={categorySelectId}
              className="text-[11px] font-medium text-muted-foreground"
            >
              카테고리 <span className="text-destructive" aria-hidden="true">*</span>
              <span className="sr-only">(필수)</span>
            </label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as MemberGoalCategory)}
            >
              <SelectTrigger id={categorySelectId} className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(CATEGORY_LABELS) as [MemberGoalCategory, string][]).map(
                  ([key, label]) => (
                    <SelectItem key={key} value={key} className="text-xs">
                      {label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          {/* 제목 */}
          <div className="space-y-1">
            <label
              htmlFor={titleInputId}
              className="text-[11px] font-medium text-muted-foreground"
            >
              목표 제목 <span className="text-destructive" aria-hidden="true">*</span>
              <span className="sr-only">(필수)</span>
            </label>
            <Input
              id={titleInputId}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 백 텀블링 완성하기"
              className="h-8 text-xs"
              maxLength={60}
              aria-required="true"
            />
          </div>

          {/* 설명 */}
          <div className="space-y-1">
            <label
              htmlFor={descInputId}
              className="text-[11px] font-medium text-muted-foreground"
            >
              설명 (선택)
            </label>
            <Textarea
              id={descInputId}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="목표에 대한 상세 내용"
              className="text-xs min-h-[56px] resize-none"
              maxLength={200}
            />
          </div>

          {/* 우선순위 + 목표일 */}
          <div className="flex gap-2">
            <div className="space-y-1 flex-1">
              <label
                htmlFor={prioritySelectId}
                className="text-[11px] font-medium text-muted-foreground"
              >
                우선순위
              </label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as MemberGoalPriority)}
              >
                <SelectTrigger id={prioritySelectId} className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high" className="text-xs">높음</SelectItem>
                  <SelectItem value="medium" className="text-xs">보통</SelectItem>
                  <SelectItem value="low" className="text-xs">낮음</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 flex-1">
              <label
                htmlFor={dateInputId}
                className="text-[11px] font-medium text-muted-foreground"
              >
                목표 날짜 <span className="text-destructive" aria-hidden="true">*</span>
                <span className="sr-only">(필수)</span>
              </label>
              <Input
                id={dateInputId}
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                min={todayStr()}
                className="h-8 text-xs"
                aria-required="true"
              />
            </div>
          </div>

          {/* 마일스톤 */}
          <div className="space-y-1.5">
            <label
              htmlFor={milestoneInputId}
              className="text-[11px] font-medium text-muted-foreground"
            >
              마일스톤 (선택, 최대 10개)
            </label>
            <div className="flex gap-1.5">
              <Input
                id={milestoneInputId}
                value={milestoneInput}
                onChange={(e) => setMilestoneInput(e.target.value)}
                placeholder="마일스톤 입력 후 Enter"
                className="h-7 text-xs flex-1"
                maxLength={50}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddMilestone();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs px-2"
                onClick={handleAddMilestone}
                aria-label="마일스톤 추가"
              >
                <Plus className="h-3 w-3" aria-hidden="true" />
              </Button>
            </div>
            {milestones.length > 0 && (
              <ul
                role="list"
                className="space-y-1"
                aria-label="추가된 마일스톤 목록"
              >
                {milestones.map((m, i) => (
                  <li
                    key={i}
                    role="listitem"
                    className="flex items-center justify-between rounded border px-2 py-1 bg-muted/40"
                  >
                    <span className="text-[11px] truncate">{m}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMilestone(i)}
                      className="text-muted-foreground hover:text-destructive ml-1 shrink-0"
                      aria-label={`마일스톤 "${m}" 삭제`}
                    >
                      <X className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 버튼 */}
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
              disabled={submitting || !title.trim() || !targetDate || !memberName}
              aria-disabled={submitting || !title.trim() || !targetDate || !memberName}
            >
              목표 추가
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
