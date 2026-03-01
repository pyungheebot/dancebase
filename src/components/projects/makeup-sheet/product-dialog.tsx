"use client";

import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import type { MakeupSheetArea } from "@/types";
import { AREA_LABELS, ALL_AREAS } from "./types";
import type { ProductDialogProps } from "./types";

export function ProductDialog({
  open,
  mode,
  initial,
  onClose,
  onSubmit,
}: ProductDialogProps) {
  const [area, setArea] = useState<MakeupSheetArea>(
    initial?.area ?? "base"
  );
  const [productName, setProductName] = useState(initial?.productName ?? "");
  const [brand, setBrand] = useState(initial?.brand ?? "");
  const [colorCode, setColorCode] = useState(initial?.colorCode ?? "");
  const [technique, setTechnique] = useState(initial?.technique ?? "");
  const [order, setOrder] = useState(String(initial?.order ?? 0));

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) onClose();
  };

  const handleSubmit = () => {
    if (!productName.trim()) {
      toast.error(TOAST.MAKEUP_SHEET.PRODUCT_NAME_REQUIRED);
      return;
    }
    onSubmit({
      area,
      productName: productName.trim(),
      brand: brand.trim() || undefined,
      colorCode: colorCode.trim() || undefined,
      technique: technique.trim() || undefined,
      order: parseInt(order, 10) || 0,
    });
    onClose();
  };

  const dialogId = "product-dialog";
  const productNameId = `${dialogId}-product-name`;
  const brandId = `${dialogId}-brand`;
  const colorCodeId = `${dialogId}-color-code`;
  const orderId = `${dialogId}-order`;
  const techniqueId = `${dialogId}-technique`;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-md"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {mode === "add" ? "제품 추가" : "제품 편집"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* 부위 */}
          <fieldset className="space-y-1">
            <legend className="text-xs text-muted-foreground">부위</legend>
            <Select
              value={area}
              onValueChange={(v) => setArea(v as MakeupSheetArea)}
            >
              <SelectTrigger className="h-8 text-xs" aria-label="부위 선택">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_AREAS.map((a) => (
                  <SelectItem key={a} value={a} className="text-xs">
                    {AREA_LABELS[a]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </fieldset>

          {/* 제품명 */}
          <div className="space-y-1">
            <Label htmlFor={productNameId} className="text-xs text-muted-foreground">
              제품명
            </Label>
            <Input
              id={productNameId}
              className="h-8 text-xs"
              placeholder="예: 세럼 파운데이션 N23"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              aria-required="true"
            />
          </div>

          {/* 브랜드 */}
          <div className="space-y-1">
            <Label htmlFor={brandId} className="text-xs text-muted-foreground">
              브랜드 (선택)
            </Label>
            <Input
              id={brandId}
              className="h-8 text-xs"
              placeholder="예: 맥, 나스, 에뛰드"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
            />
          </div>

          {/* 색상코드 + 순서 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor={colorCodeId} className="text-xs text-muted-foreground">
                색상 코드 (선택)
              </Label>
              <div className="flex items-center gap-1.5">
                {colorCode && /^#[0-9A-Fa-f]{3,6}$/.test(colorCode) && (
                  <span
                    className="inline-block w-5 h-5 rounded border border-border flex-shrink-0"
                    style={{ backgroundColor: colorCode }}
                    role="img"
                    aria-label={`색상 미리보기: ${colorCode}`}
                  />
                )}
                <Input
                  id={colorCodeId}
                  className="h-8 text-xs"
                  placeholder="#FF6B6B"
                  value={colorCode}
                  onChange={(e) => setColorCode(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor={orderId} className="text-xs text-muted-foreground">
                순서
              </Label>
              <Input
                id={orderId}
                className="h-8 text-xs"
                type="number"
                min={0}
                placeholder="0"
                value={order}
                onChange={(e) => setOrder(e.target.value)}
              />
            </div>
          </div>

          {/* 기법 */}
          <div className="space-y-1">
            <Label htmlFor={techniqueId} className="text-xs text-muted-foreground">
              기법 (선택)
            </Label>
            <Input
              id={techniqueId}
              className="h-8 text-xs"
              placeholder="예: 가볍게 두드려 밀착, 스모키 블렌딩"
              value={technique}
              onChange={(e) => setTechnique(e.target.value)}
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
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            {mode === "add" ? "추가" : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
