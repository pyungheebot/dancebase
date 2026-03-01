"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import type { PosterVersion } from "@/types";

// ============================================================
// 버전 추가 다이얼로그
// ============================================================

export interface AddVersionPayload {
  title: string;
  designer: string;
  description: string;
  dimensions?: string;
  colorScheme?: string[];
}

interface AddVersionDialogProps {
  posterId: string;
  onAdd: (
    posterId: string,
    partial: AddVersionPayload
  ) => PosterVersion | null;
}

export function AddVersionDialog({ posterId, onAdd }: AddVersionDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [designer, setDesigner] = useState("");
  const [description, setDescription] = useState("");
  const [dimensions, setDimensions] = useState("");
  const [colorInput, setColorInput] = useState("");
  const [colors, setColors] = useState<string[]>([]);

  const titleId = `add-version-title-${posterId}`;
  const designerId = `add-version-designer-${posterId}`;
  const descriptionId = `add-version-description-${posterId}`;
  const dimensionsId = `add-version-dimensions-${posterId}`;
  const colorInputId = `add-version-color-${posterId}`;

  function addColor() {
    const trimmed = colorInput.trim();
    if (!trimmed || colors.includes(trimmed)) return;
    setColors([...colors, trimmed]);
    setColorInput("");
  }

  function removeColor(c: string) {
    setColors(colors.filter((x) => x !== c));
  }

  function handleSubmit() {
    if (!title.trim()) {
      toast.error(TOAST.POSTER.VERSION_TITLE_REQUIRED);
      return;
    }
    if (!designer.trim()) {
      toast.error(TOAST.POSTER.DESIGNER_REQUIRED);
      return;
    }
    if (!description.trim()) {
      toast.error(TOAST.POSTER.DESCRIPTION_REQUIRED);
      return;
    }

    const result = onAdd(posterId, {
      title: title.trim(),
      designer: designer.trim(),
      description: description.trim(),
      dimensions: dimensions.trim() || undefined,
      colorScheme: colors,
    });

    if (result) {
      toast.success(TOAST.POSTER.VERSION_ADDED);
      setTitle("");
      setDesigner("");
      setDescription("");
      setDimensions("");
      setColorInput("");
      setColors([]);
      setOpen(false);
    } else {
      toast.error(TOAST.POSTER.VERSION_ADD_ERROR);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 text-xs" aria-label="새 버전 추가">
          <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
          버전 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">새 포스터 버전 추가</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <div className="space-y-1">
            <Label htmlFor={titleId} className="text-xs">
              버전 제목 <span aria-label="필수 항목">*</span>
            </Label>
            <Input
              id={titleId}
              className="h-8 text-xs"
              placeholder="예: 어두운 배경 버전"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-required="true"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={designerId} className="text-xs">
              디자이너 <span aria-label="필수 항목">*</span>
            </Label>
            <Input
              id={designerId}
              className="h-8 text-xs"
              placeholder="디자이너 이름"
              value={designer}
              onChange={(e) => setDesigner(e.target.value)}
              aria-required="true"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={descriptionId} className="text-xs">
              설명 <span aria-label="필수 항목">*</span>
            </Label>
            <Textarea
              id={descriptionId}
              className="text-xs min-h-[60px] resize-none"
              placeholder="디자인 컨셉, 특징 등"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              aria-required="true"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={dimensionsId} className="text-xs">
              사이즈/치수
            </Label>
            <Input
              id={dimensionsId}
              className="h-8 text-xs"
              placeholder="예: A2 (420×594mm)"
              value={dimensions}
              onChange={(e) => setDimensions(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={colorInputId} className="text-xs">
              색상 팔레트
            </Label>
            <div className="flex gap-1">
              <Input
                id={colorInputId}
                className="h-8 text-xs flex-1"
                placeholder="색상 이름 입력 후 추가"
                value={colorInput}
                onChange={(e) => setColorInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addColor()}
                aria-describedby={
                  colors.length > 0 ? `color-list-${posterId}` : undefined
                }
              />
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs px-2"
                onClick={addColor}
                aria-label="색상 추가"
              >
                추가
              </Button>
            </div>
            {colors.length > 0 && (
              <div
                id={`color-list-${posterId}`}
                className="flex flex-wrap gap-1 pt-1"
                role="list"
                aria-label="추가된 색상 목록"
              >
                {colors.map((c) => (
                  <span
                    key={c}
                    role="listitem"
                    className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-700"
                  >
                    {c}
                    <X
                      className="h-2.5 w-2.5 cursor-pointer hover:text-red-500"
                      role="button"
                      aria-label={`${c} 색상 제거`}
                      tabIndex={0}
                      onClick={() => removeColor(c)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          removeColor(c);
                        }
                      }}
                    />
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => setOpen(false)}
            >
              취소
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
              추가
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
