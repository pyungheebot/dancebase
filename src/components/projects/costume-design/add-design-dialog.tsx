"use client";

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
import { Plus, Palette } from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { ColorChip } from "./color-chip";
import { CATEGORY_OPTIONS } from "./types";

// ============================================================
// 디자인 추가 다이얼로그
// ============================================================

interface AddDesignDialogProps {
  open: boolean;
  onClose: () => void;
  memberNames: string[];
  onSubmit: (
    title: string,
    description: string,
    designedBy: string,
    category: string,
    colorScheme: string[],
    materialNotes?: string,
    estimatedCost?: number
  ) => void;
}

export function AddDesignDialog({
  open,
  onClose,
  memberNames,
  onSubmit,
}: AddDesignDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [designedBy, setDesignedBy] = useState(memberNames[0] ?? "");
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
  const [colorInput, setColorInput] = useState("");
  const [materialNotes, setMaterialNotes] = useState("");
  const [estimatedCostInput, setEstimatedCostInput] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      toast.error(TOAST.COSTUME_DESIGN.TITLE_REQUIRED);
      return;
    }
    if (!designedBy.trim()) {
      toast.error(TOAST.COSTUME_DESIGN.DESIGNER_REQUIRED);
      return;
    }
    const colorScheme = colorInput
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);

    const estimatedCost =
      estimatedCostInput.trim() !== ""
        ? Number(estimatedCostInput)
        : undefined;

    onSubmit(
      trimmedTitle,
      description.trim(),
      designedBy.trim(),
      category,
      colorScheme,
      materialNotes.trim() || undefined,
      isNaN(estimatedCost as number) ? undefined : estimatedCost
    );

    setTitle("");
    setDescription("");
    setDesignedBy(memberNames[0] ?? "");
    setCategory(CATEGORY_OPTIONS[0]);
    setColorInput("");
    setMaterialNotes("");
    setEstimatedCostInput("");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-2">
            <Palette className="h-4 w-4 text-pink-500" aria-hidden="true" />
            디자인 아이디어 추가
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 py-1" aria-label="디자인 아이디어 추가 양식">
          {/* 제목 */}
          <div className="space-y-1">
            <Label htmlFor="cd-title" className="text-xs">
              제목 <span className="text-destructive" aria-hidden="true">*</span>
            </Label>
            <Input
              id="cd-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 블랙 크롭 재킷"
              className="h-7 text-xs"
              aria-required="true"
            />
          </div>

          {/* 설명 */}
          <div className="space-y-1">
            <Label htmlFor="cd-desc" className="text-xs">설명</Label>
            <Textarea
              id="cd-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="디자인 컨셉, 스타일 방향 등..."
              className="text-xs resize-none min-h-[60px]"
              rows={3}
            />
          </div>

          {/* 디자이너 */}
          <div className="space-y-1">
            <Label htmlFor="cd-designer" className="text-xs">
              디자이너 <span className="text-destructive" aria-hidden="true">*</span>
            </Label>
            {memberNames.length > 0 ? (
              <Select value={designedBy} onValueChange={setDesignedBy}>
                <SelectTrigger className="h-7 text-xs" aria-label="디자이너 선택">
                  <SelectValue placeholder="디자이너 선택" />
                </SelectTrigger>
                <SelectContent>
                  {memberNames.map((name) => (
                    <SelectItem key={name} value={name} className="text-xs">
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="cd-designer"
                value={designedBy}
                onChange={(e) => setDesignedBy(e.target.value)}
                placeholder="디자이너 이름"
                className="h-7 text-xs"
                aria-required="true"
              />
            )}
          </div>

          {/* 카테고리 */}
          <div className="space-y-1">
            <Label className="text-xs">카테고리</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-7 text-xs" aria-label="카테고리 선택">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-xs">
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 색상 (쉼표 구분) */}
          <div className="space-y-1">
            <Label htmlFor="cd-colors" className="text-xs">
              색상 팔레트{" "}
              <span className="text-muted-foreground">(쉼표로 구분)</span>
            </Label>
            <Input
              id="cd-colors"
              value={colorInput}
              onChange={(e) => setColorInput(e.target.value)}
              placeholder="예: black, white, crimson"
              className="h-7 text-xs"
              aria-describedby="cd-colors-hint"
            />
            <span id="cd-colors-hint" className="sr-only">
              색상 이름을 쉼표로 구분하여 입력하세요. 예: black, white, crimson
            </span>
            {/* 미리보기 */}
            {colorInput.trim() && (
              <div
                className="flex flex-wrap gap-1 pt-1"
                role="list"
                aria-label="색상 미리보기"
              >
                {colorInput
                  .split(",")
                  .map((c) => c.trim())
                  .filter(Boolean)
                  .map((c, i) => (
                    <div key={i} className="flex items-center gap-1" role="listitem">
                      <ColorChip colorName={c} />
                      <span className="text-[10px] text-muted-foreground">{c}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* 소재 메모 */}
          <div className="space-y-1">
            <Label htmlFor="cd-material" className="text-xs">소재 메모</Label>
            <Input
              id="cd-material"
              value={materialNotes}
              onChange={(e) => setMaterialNotes(e.target.value)}
              placeholder="예: 폴리에스터 80%, 신축성 원단 권장"
              className="h-7 text-xs"
            />
          </div>

          {/* 예상 비용 */}
          <div className="space-y-1">
            <Label htmlFor="cd-cost" className="text-xs">예상 비용 (원)</Label>
            <Input
              id="cd-cost"
              type="number"
              min={0}
              value={estimatedCostInput}
              onChange={(e) => setEstimatedCostInput(e.target.value)}
              placeholder="예: 150000"
              className="h-7 text-xs"
            />
          </div>

          <DialogFooter className="pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={onClose}
            >
              취소
            </Button>
            <Button type="submit" size="sm" className="h-7 text-xs">
              <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
              추가
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
