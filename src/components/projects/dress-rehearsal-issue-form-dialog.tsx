"use client";

// ============================================================
// 이슈 추가/수정 폼 다이얼로그
// ============================================================

import { useState } from "react";
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
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useAsyncAction } from "@/hooks/use-async-action";
import { CATEGORIES, SEVERITIES } from "./dress-rehearsal-types";
import type {
  DressRehearsalCategory,
  DressRehearsalSeverity,
  DressRehearsalIssue,
} from "@/types";

export interface IssueFormValues {
  section: string;
  content: string;
  category: DressRehearsalCategory;
  severity: DressRehearsalSeverity;
  assignee?: string;
}

interface IssueFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (params: IssueFormValues) => void;
  /** 수정 모드일 때 기존 이슈 */
  editIssue?: DressRehearsalIssue | null;
}

export function IssueFormDialog({
  open,
  onClose,
  onSubmit,
  editIssue,
}: IssueFormDialogProps) {
  const [section, setSection] = useState(editIssue?.section ?? "");
  const [content, setContent] = useState(editIssue?.content ?? "");
  const [category, setCategory] = useState<DressRehearsalCategory>(
    editIssue?.category ?? "안무"
  );
  const [severity, setSeverity] = useState<DressRehearsalSeverity>(
    editIssue?.severity ?? "보통"
  );
  const [assignee, setAssignee] = useState(editIssue?.assignee ?? "");
  const { pending: saving, execute } = useAsyncAction();

  // 다이얼로그가 열릴 때 폼 값 초기화
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setSection(editIssue?.section ?? "");
      setContent(editIssue?.content ?? "");
      setCategory(editIssue?.category ?? "안무");
      setSeverity(editIssue?.severity ?? "보통");
      setAssignee(editIssue?.assignee ?? "");
    }
    if (!isOpen) onClose();
  };

  const handleSubmit = async () => {
    if (!section.trim()) {
      toast.error(TOAST.DRESS_REHEARSAL.SCENE_REQUIRED);
      return;
    }
    if (!content.trim()) {
      toast.error(TOAST.DRESS_REHEARSAL.ISSUE_REQUIRED);
      return;
    }
    await execute(async () => {
      onSubmit({
        section,
        content,
        category,
        severity,
        assignee: assignee || undefined,
      });
      onClose();
    });
  };

  const dialogDescId = editIssue
    ? "issue-edit-dialog-desc"
    : "issue-add-dialog-desc";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md" aria-describedby={dialogDescId}>
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {editIssue ? "이슈 수정" : "이슈 추가"}
          </DialogTitle>
        </DialogHeader>
        {/* 접근성: 다이얼로그 설명 */}
        <p id={dialogDescId} className="sr-only">
          {editIssue
            ? "리허설 이슈 내용을 수정합니다."
            : "새 리허설 이슈를 추가합니다."}
        </p>
        <div className="space-y-3 py-2">
          {/* 장면/섹션 */}
          <div className="space-y-1">
            <Label htmlFor="issue-section" className="text-xs">
              장면/섹션 <span className="text-red-500" aria-hidden="true">*</span>
            </Label>
            <Input
              id="issue-section"
              value={section}
              onChange={(e) => setSection(e.target.value)}
              placeholder="예: 1막 오프닝, 피날레 등"
              className="h-8 text-xs"
              required
              aria-required="true"
            />
          </div>

          {/* 이슈 내용 */}
          <div className="space-y-1">
            <Label htmlFor="issue-content" className="text-xs">
              이슈 내용 <span className="text-red-500" aria-hidden="true">*</span>
            </Label>
            <Textarea
              id="issue-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="발견된 이슈를 상세히 작성하세요"
              className="text-xs min-h-[72px] resize-none"
              required
              aria-required="true"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* 카테고리 */}
            <div className="space-y-1">
              <Label htmlFor="issue-category" className="text-xs">카테고리</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as DressRehearsalCategory)}
              >
                <SelectTrigger id="issue-category" className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c} className="text-xs">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 심각도 */}
            <div className="space-y-1">
              <Label htmlFor="issue-severity" className="text-xs">심각도</Label>
              <Select
                value={severity}
                onValueChange={(v) => setSeverity(v as DressRehearsalSeverity)}
              >
                <SelectTrigger id="issue-severity" className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEVERITIES.map((s) => (
                    <SelectItem key={s} value={s} className="text-xs">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 담당자 */}
          <div className="space-y-1">
            <Label htmlFor="issue-assignee" className="text-xs">담당자</Label>
            <Input
              id="issue-assignee"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              placeholder="담당자 이름 (선택)"
              className="h-8 text-xs"
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={onClose}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSubmit}
            disabled={saving}
          >
            {editIssue ? "수정" : "추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
