"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Gift } from "lucide-react";
import type { SponsoredGoodsStatus } from "@/types";
import { STATUS_OPTIONS, STATUS_LABELS, type ItemFormData } from "./sponsored-goods-types";

// ============================================================
// Props
// ============================================================

type ItemDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: ItemFormData;
  setForm: (f: ItemFormData) => void;
  onSave: () => void;
  saving: boolean;
  isEdit: boolean;
};

// ============================================================
// 컴포넌트
// ============================================================

export function SponsoredGoodsItemDialog({
  open,
  onOpenChange,
  form,
  setForm,
  onSave,
  saving,
  isEdit,
}: ItemDialogProps) {
  const dialogId = "sponsored-goods-item-dialog";

  function set<K extends keyof ItemFormData>(key: K, value: ItemFormData[K]) {
    setForm({ ...form, [key]: value });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md max-h-[90vh] overflow-y-auto"
        aria-labelledby={`${dialogId}-title`}
        aria-describedby={`${dialogId}-desc`}
      >
        <DialogHeader>
          <DialogTitle
            id={`${dialogId}-title`}
            className="flex items-center gap-2 text-sm"
          >
            <Gift className="h-4 w-4 text-pink-500" aria-hidden="true" />
            {isEdit ? "협찬품 수정" : "협찬품 추가"}
          </DialogTitle>
        </DialogHeader>

        <p id={`${dialogId}-desc`} className="sr-only">
          {isEdit
            ? "협찬품 정보를 수정합니다. 필수 항목을 입력 후 수정 버튼을 누르세요."
            : "새 협찬품을 추가합니다. 필수 항목을 입력 후 추가 버튼을 누르세요."}
        </p>

        <div className="space-y-3 py-1" role="form" aria-label="협찬품 정보 입력">
          {/* 물품명 */}
          <div className="space-y-1">
            <Label htmlFor={`${dialogId}-item-name`} className="text-xs">
              물품명 <span className="text-destructive" aria-hidden="true">*</span>
              <span className="sr-only">(필수)</span>
            </Label>
            <Input
              id={`${dialogId}-item-name`}
              className="h-8 text-xs"
              placeholder="예: 티셔츠, 굿즈 세트"
              value={form.itemName}
              onChange={(e) => set("itemName", e.target.value)}
              aria-required="true"
            />
          </div>

          {/* 스폰서 + 카테고리 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor={`${dialogId}-sponsor`} className="text-xs">
                스폰서 <span className="text-destructive" aria-hidden="true">*</span>
                <span className="sr-only">(필수)</span>
              </Label>
              <Input
                id={`${dialogId}-sponsor`}
                className="h-8 text-xs"
                placeholder="스폰서명"
                value={form.sponsor}
                onChange={(e) => set("sponsor", e.target.value)}
                aria-required="true"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`${dialogId}-category`} className="text-xs">
                카테고리
              </Label>
              <Input
                id={`${dialogId}-category`}
                className="h-8 text-xs"
                placeholder="예: 의류, 식음료"
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
              />
            </div>
          </div>

          {/* 수량 + 추정가치 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor={`${dialogId}-quantity`} className="text-xs">
                수량 <span className="text-destructive" aria-hidden="true">*</span>
                <span className="sr-only">(필수)</span>
              </Label>
              <Input
                id={`${dialogId}-quantity`}
                className="h-8 text-xs"
                type="number"
                min="1"
                placeholder="수량"
                value={form.quantity}
                onChange={(e) => set("quantity", e.target.value)}
                aria-required="true"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`${dialogId}-estimated-value`} className="text-xs">
                추정가치 (원)
              </Label>
              <Input
                id={`${dialogId}-estimated-value`}
                className="h-8 text-xs"
                type="number"
                min="0"
                placeholder="예: 50000"
                value={form.estimatedValue}
                onChange={(e) => set("estimatedValue", e.target.value)}
              />
            </div>
          </div>

          {/* 상태 */}
          <div className="space-y-1">
            <Label htmlFor={`${dialogId}-status`} className="text-xs">
              상태
            </Label>
            <Select
              value={form.status}
              onValueChange={(v) => set("status", v as SponsoredGoodsStatus)}
            >
              <SelectTrigger
                id={`${dialogId}-status`}
                className="h-8 text-xs"
                aria-label="협찬품 상태 선택"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s} className="text-xs">
                    {STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 수령일 + 반납기한 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor={`${dialogId}-received-date`} className="text-xs">
                수령일
              </Label>
              <Input
                id={`${dialogId}-received-date`}
                className="h-8 text-xs"
                type="date"
                value={form.receivedDate}
                onChange={(e) => set("receivedDate", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`${dialogId}-return-due-date`} className="text-xs">
                반납 기한
              </Label>
              <Input
                id={`${dialogId}-return-due-date`}
                className="h-8 text-xs"
                type="date"
                value={form.returnDueDate}
                onChange={(e) => set("returnDueDate", e.target.value)}
              />
            </div>
          </div>

          {/* 메모 */}
          <div className="space-y-1">
            <Label htmlFor={`${dialogId}-notes`} className="text-xs">
              메모
            </Label>
            <Textarea
              id={`${dialogId}-notes`}
              className="text-xs min-h-[60px] resize-none"
              placeholder="추가 메모"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={onSave}
            disabled={saving}
            aria-busy={saving}
          >
            {saving ? "저장 중..." : isEdit ? "수정" : "추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
