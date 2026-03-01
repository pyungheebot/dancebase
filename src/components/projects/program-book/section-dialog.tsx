"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import type { ProgramBookSection } from "@/types/localStorage/stage";
import type { ProgramSectionType } from "./types";
import { ALL_SECTION_TYPES, sectionTypeLabel } from "./types";
import { SectionTypeIcon } from "./section-type-icon";

export interface SectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  initial?: ProgramBookSection;
  onSubmit: (
    type: ProgramSectionType,
    title: string,
    content: string
  ) => void;
}

export function SectionDialog({
  open,
  onOpenChange,
  mode,
  initial,
  onSubmit,
}: SectionDialogProps) {
  const [type, setType] = useState<ProgramSectionType>(
    initial?.type ?? "program_list"
  );
  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content ?? "");

  const resetForm = () => {
    setType(initial?.type ?? "program_list");
    setTitle(initial?.title ?? "");
    setContent(initial?.content ?? "");
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error(TOAST.PROGRAM_BOOK.SECTION_TITLE_REQUIRED);
      return;
    }
    onSubmit(type, title.trim(), content);
    onOpenChange(false);
  };

  const dialogId = mode === "add" ? "section-add-desc" : "section-edit-desc";

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetForm();
        onOpenChange(v);
      }}
    >
      <DialogContent
        className="max-w-sm max-h-[90vh] overflow-y-auto"
        aria-describedby={dialogId}
      >
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {mode === "add" ? "섹션 추가" : "섹션 편집"}
          </DialogTitle>
        </DialogHeader>
        <p id={dialogId} className="sr-only">
          {mode === "add"
            ? "새로운 섹션 유형, 제목, 내용을 입력하세요."
            : "섹션 유형, 제목, 내용을 수정하세요."}
        </p>
        <div className="space-y-3 pt-1">
          {/* 유형 */}
          <div className="space-y-1">
            <Label htmlFor="section-type" className="text-xs text-muted-foreground">
              유형 *
            </Label>
            <Select
              value={type}
              onValueChange={(v) => {
                setType(v as ProgramSectionType);
                if (!title.trim()) {
                  setTitle(sectionTypeLabel(v as ProgramSectionType));
                }
              }}
            >
              <SelectTrigger id="section-type" className="h-7 text-xs" aria-required="true">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_SECTION_TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">
                    <span className="flex items-center gap-1.5">
                      <SectionTypeIcon type={t} className="h-3 w-3" />
                      {sectionTypeLabel(t)}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 제목 */}
          <div className="space-y-1">
            <Label htmlFor="section-title" className="text-xs text-muted-foreground">
              제목 *
            </Label>
            <Input
              id="section-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="섹션 제목을 입력하세요"
              className="h-7 text-xs"
              aria-required="true"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
          </div>

          {/* 내용 */}
          <div className="space-y-1">
            <Label htmlFor="section-content" className="text-xs text-muted-foreground">
              내용
            </Label>
            <Textarea
              id="section-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="섹션 내용을 입력하세요"
              className="text-xs min-h-[96px] resize-none"
              rows={4}
            />
          </div>

          <div className="flex gap-1.5 justify-end pt-0.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
            >
              취소
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
              {mode === "add" ? "추가" : "저장"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
