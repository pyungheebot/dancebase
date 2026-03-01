"use client";

import { useState, useId } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import type { CreateInspectionParams } from "@/hooks/use-stage-safety";
import type { SafetyCheckItem } from "@/types";
import { CATEGORY_LABELS } from "./types";

// ============================================================
// 점검 생성 다이얼로그
// ============================================================

interface CreateInspectionDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (params: CreateInspectionParams) => void;
}

export function CreateInspectionDialog({
  open,
  onClose,
  onCreate,
}: CreateInspectionDialogProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(today);
  const [venue, setVenue] = useState("");
  const [signedBy, setSignedBy] = useState("");

  const [quickItems, setQuickItems] = useState<
    { desc: string; category: SafetyCheckItem["category"] }[]
  >([]);
  const [quickDesc, setQuickDesc] = useState("");
  const [quickCat, setQuickCat] =
    useState<SafetyCheckItem["category"]>("other");

  const uid = useId();
  const titleId = `title-${uid}`;
  const dateId = `date-${uid}`;
  const venueId = `venue-${uid}`;
  const signedById = `signedBy-${uid}`;
  const quickDescId = `quickDesc-${uid}`;
  const quickCatId = `quickCat-${uid}`;

  function reset() {
    setTitle("");
    setDate(today);
    setVenue("");
    setSignedBy("");
    setQuickItems([]);
    setQuickDesc("");
    setQuickCat("other");
  }

  function handleClose() {
    reset();
    onClose();
  }

  function addQuickItem() {
    if (!quickDesc.trim()) return;
    setQuickItems((prev) => [
      ...prev,
      { desc: quickDesc.trim(), category: quickCat },
    ]);
    setQuickDesc("");
  }

  function removeQuickItem(idx: number) {
    setQuickItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleQuickDescKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addQuickItem();
    }
  }

  function handleCreate() {
    if (!title.trim()) {
      toast.error(TOAST.STAGE_SAFETY.CHECK_TITLE_REQUIRED);
      return;
    }
    if (!date) {
      toast.error(TOAST.STAGE_SAFETY.CHECK_DATE_REQUIRED);
      return;
    }
    onCreate({
      title: title.trim(),
      date,
      venue: venue.trim() || null,
      items: quickItems.map((qi) => ({
        category: qi.category,
        description: qi.desc,
        status: "pending",
        notes: null,
        inspectorName: signedBy.trim() || null,
      })),
    });
    toast.success(TOAST.STAGE_SAFETY.CHECK_CREATED);
    handleClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-sm">새 안전 점검 생성</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor={titleId} className="text-xs">
              점검 제목{" "}
              <span aria-hidden="true">*</span>
              <span className="sr-only">(필수)</span>
            </Label>
            <Input
              id={titleId}
              required
              aria-required="true"
              className="h-8 text-xs"
              placeholder="예: 2024 봄 공연 사전 안전 점검"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor={dateId} className="text-xs">
                점검 일자{" "}
                <span aria-hidden="true">*</span>
                <span className="sr-only">(필수)</span>
              </Label>
              <Input
                id={dateId}
                type="date"
                required
                aria-required="true"
                className="h-8 text-xs"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={venueId} className="text-xs">
                공연장
              </Label>
              <Input
                id={venueId}
                className="h-8 text-xs"
                placeholder="예: OO 아트홀"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor={signedById} className="text-xs">
              점검자/서명자
            </Label>
            <Input
              id={signedById}
              className="h-8 text-xs"
              placeholder="예: 홍길동"
              value={signedBy}
              onChange={(e) => setSignedBy(e.target.value)}
            />
          </div>

          {/* 초기 항목 빠른 추가 */}
          <fieldset className="space-y-2">
            <legend className="text-xs font-medium">
              초기 점검 항목 (선택)
            </legend>
            <div className="flex gap-1">
              <Select
                value={quickCat}
                onValueChange={(v) =>
                  setQuickCat(v as SafetyCheckItem["category"])
                }
              >
                <SelectTrigger
                  id={quickCatId}
                  className="h-7 w-24 text-xs shrink-0"
                  aria-label="항목 카테고리"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.entries(
                      CATEGORY_LABELS
                    ) as [SafetyCheckItem["category"], string][]
                  ).map(([val, label]) => (
                    <SelectItem key={val} value={val} className="text-xs">
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                id={quickDescId}
                className="h-7 text-xs flex-1"
                placeholder="점검 항목 내용"
                value={quickDesc}
                onChange={(e) => setQuickDesc(e.target.value)}
                onKeyDown={handleQuickDescKeyDown}
                aria-label="점검 항목 내용 입력"
              />
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0 shrink-0"
                onClick={addQuickItem}
                aria-label="항목 추가"
              >
                <Plus className="h-3 w-3" aria-hidden="true" />
                <span className="sr-only">항목 추가</span>
              </Button>
            </div>
            {quickItems.length > 0 && (
              <ul
                role="list"
                aria-label="추가된 점검 항목 목록"
                className="space-y-1 max-h-32 overflow-y-auto"
              >
                {quickItems.map((qi, idx) => (
                  <li
                    key={idx}
                    role="listitem"
                    className="flex items-center gap-1.5 text-xs bg-muted/50 rounded px-2 py-1"
                  >
                    <span className="text-[10px] text-muted-foreground w-8 shrink-0">
                      {CATEGORY_LABELS[qi.category]}
                    </span>
                    <span className="flex-1 truncate">{qi.desc}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0"
                      onClick={() => removeQuickItem(idx)}
                      aria-label={`${qi.desc} 항목 제거`}
                    >
                      <Trash2 className="h-3 w-3" aria-hidden="true" />
                      <span className="sr-only">항목 제거</span>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </fieldset>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={handleClose}
          >
            취소
          </Button>
          <Button size="sm" className="h-8 text-xs" onClick={handleCreate}>
            생성
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
