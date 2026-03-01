"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import type { DressCodeCategory, DressCodeGuideItem } from "@/types";
import { CATEGORY_LABELS, ALL_CATEGORIES, type GuideDialogProps } from "./types";

export function GuideDialog({
  open,
  mode,
  initial,
  onClose,
  onSubmit,
}: GuideDialogProps) {
  const [category, setCategory] = useState<DressCodeCategory>(
    initial?.category ?? "outfit"
  );
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [colorCode, setColorCode] = useState(initial?.colorCode ?? "");
  const [imageDescription, setImageDescription] = useState(
    initial?.imageDescription ?? ""
  );
  const [isRequired, setIsRequired] = useState(initial?.isRequired ?? true);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) onClose();
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error(TOAST.DRESS_CODE.ITEM_TITLE_REQUIRED);
      return;
    }
    if (!description.trim()) {
      toast.error(TOAST.DRESS_CODE.ITEM_DESC_REQUIRED);
      return;
    }
    onSubmit({
      category,
      title: title.trim(),
      description: description.trim(),
      colorCode: colorCode.trim() || undefined,
      imageDescription: imageDescription.trim() || undefined,
      isRequired,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-md"
        aria-describedby="guide-dialog-desc"
      >
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {mode === "add" ? "가이드 항목 추가" : "가이드 항목 편집"}
          </DialogTitle>
        </DialogHeader>
        <p id="guide-dialog-desc" className="sr-only">
          {mode === "add"
            ? "새 드레스 코드 가이드 항목을 추가합니다."
            : "드레스 코드 가이드 항목을 편집합니다."}
        </p>

        <div className="space-y-3 py-2">
          {/* 카테고리 */}
          <div className="space-y-1">
            <Label htmlFor="guide-category" className="text-xs text-muted-foreground">
              카테고리
            </Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as DressCodeCategory)}
            >
              <SelectTrigger id="guide-category" className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c} className="text-xs">
                    {CATEGORY_LABELS[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 제목 */}
          <div className="space-y-1">
            <Label htmlFor="guide-title" className="text-xs text-muted-foreground">
              항목 제목
            </Label>
            <Input
              id="guide-title"
              className="h-8 text-xs"
              placeholder="예: 블랙 슬랙스"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* 설명 */}
          <div className="space-y-1">
            <Label htmlFor="guide-description" className="text-xs text-muted-foreground">
              설명
            </Label>
            <Textarea
              id="guide-description"
              className="text-xs min-h-[64px] resize-none"
              placeholder="예: 무릎 위 10cm 기장, 핏이 맞는 스타일"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* 색상 코드 */}
          <div className="space-y-1">
            <Label htmlFor="guide-color" className="text-xs text-muted-foreground">
              색상 코드 (선택)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="guide-color"
                className="h-8 text-xs flex-1"
                placeholder="#000000 또는 블랙"
                value={colorCode}
                onChange={(e) => setColorCode(e.target.value)}
              />
              {colorCode && colorCode.startsWith("#") && (
                <div
                  className="h-8 w-8 rounded border border-border flex-shrink-0"
                  style={{ backgroundColor: colorCode }}
                  role="img"
                  aria-label={`색상 미리보기: ${colorCode}`}
                />
              )}
            </div>
          </div>

          {/* 이미지 설명 */}
          <div className="space-y-1">
            <Label htmlFor="guide-image-desc" className="text-xs text-muted-foreground">
              이미지 설명 (선택)
            </Label>
            <Input
              id="guide-image-desc"
              className="h-8 text-xs"
              placeholder="예: 참고 이미지 URL 또는 설명"
              value={imageDescription}
              onChange={(e) => setImageDescription(e.target.value)}
            />
          </div>

          {/* 필수 여부 */}
          <fieldset className="flex items-center gap-2 border-none p-0 m-0">
            <Checkbox
              id="isRequired"
              checked={isRequired}
              onCheckedChange={(checked) => setIsRequired(checked === true)}
            />
            <Label htmlFor="isRequired" className="text-xs cursor-pointer">
              필수 항목
            </Label>
          </fieldset>
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
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            {mode === "add" ? "추가" : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
