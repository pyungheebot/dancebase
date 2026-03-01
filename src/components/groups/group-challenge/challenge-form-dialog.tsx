"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DanceGroupChallengeCategory } from "@/types";
import { EMPTY_FORM, type ChallengeFormValues } from "./types";

interface ChallengeFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: ChallengeFormValues) => boolean;
  initialValues?: ChallengeFormValues;
  mode: "create" | "edit";
}

export function ChallengeFormDialog({
  open,
  onClose,
  onSubmit,
  initialValues,
  mode,
}: ChallengeFormDialogProps) {
  const [form, setForm] = useState<ChallengeFormValues>(
    initialValues ?? EMPTY_FORM
  );

  const titleId = "challenge-form-title";
  const descId = "challenge-form-desc";
  const categoryId = "challenge-form-category";
  const startDateId = "challenge-form-start-date";
  const endDateId = "challenge-form-end-date";

  const handleSubmit = () => {
    const success = onSubmit(form);
    if (success && mode === "create") {
      setForm(EMPTY_FORM);
      onClose();
    } else if (success && mode === "edit") {
      onClose();
    }
  };

  const handleOpenChange = (v: boolean) => {
    if (v && initialValues) setForm(initialValues);
    if (!v) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "새 챌린지 만들기" : "챌린지 수정"}
          </DialogTitle>
        </DialogHeader>

        <fieldset className="space-y-3 border-0 p-0 m-0">
          <legend className="sr-only">
            {mode === "create" ? "새 챌린지 정보 입력" : "챌린지 정보 수정"}
          </legend>

          {/* 제목 */}
          <div>
            <label htmlFor={titleId} className="text-xs font-medium mb-1 block">
              제목 <span aria-hidden="true">*</span>
              <span className="sr-only">(필수)</span>
            </label>
            <Input
              id={titleId}
              className="h-8 text-sm"
              placeholder="챌린지 제목"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
              aria-required="true"
            />
          </div>

          {/* 설명 */}
          <div>
            <label htmlFor={descId} className="text-xs font-medium mb-1 block">
              설명
            </label>
            <Input
              id={descId}
              className="h-8 text-sm"
              placeholder="간단한 설명 (선택)"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </div>

          {/* 카테고리 */}
          <div>
            <label htmlFor={categoryId} className="text-xs font-medium mb-1 block">
              카테고리 <span aria-hidden="true">*</span>
              <span className="sr-only">(필수)</span>
            </label>
            <Select
              value={form.category}
              onValueChange={(v) =>
                setForm((f) => ({
                  ...f,
                  category: v as DanceGroupChallengeCategory,
                }))
              }
            >
              <SelectTrigger
                id={categoryId}
                className="h-8 text-sm"
                aria-required="true"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="choreography">안무도전</SelectItem>
                <SelectItem value="freestyle">프리스타일</SelectItem>
                <SelectItem value="cover">커버댄스</SelectItem>
                <SelectItem value="fitness">체력챌린지</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 날짜 */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor={startDateId} className="text-xs font-medium mb-1 block">
                시작일 <span aria-hidden="true">*</span>
                <span className="sr-only">(필수)</span>
              </label>
              <Input
                id={startDateId}
                type="date"
                className="h-8 text-sm"
                value={form.startDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, startDate: e.target.value }))
                }
                required
                aria-required="true"
              />
            </div>
            <div>
              <label htmlFor={endDateId} className="text-xs font-medium mb-1 block">
                종료일 <span aria-hidden="true">*</span>
                <span className="sr-only">(필수)</span>
              </label>
              <Input
                id={endDateId}
                type="date"
                className="h-8 text-sm"
                value={form.endDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, endDate: e.target.value }))
                }
                required
                aria-required="true"
              />
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={onClose}
            >
              취소
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-7 text-xs"
              onClick={handleSubmit}
            >
              {mode === "create" ? "생성" : "저장"}
            </Button>
          </div>
        </fieldset>
      </DialogContent>
    </Dialog>
  );
}
