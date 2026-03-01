"use client";

// ============================================================
// 무대 평면도 - 다이얼로그 컴포넌트 (플랜 추가 / 아이템 추가·수정)
// ============================================================

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
import type { StageLayoutItemType } from "@/types";
import {
  ITEM_TYPES,
  ITEM_TYPE_ICONS,
  ITEM_TYPE_LABELS,
  type ItemFormState,
  type PlanFormState,
  clampPosition,
  clampSize,
  normalizeRotation,
} from "./stage-layout-types";

// ── 플랜 추가 다이얼로그 ──────────────────────────────────

interface PlanFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: PlanFormState;
  onFormChange: React.Dispatch<React.SetStateAction<PlanFormState>>;
  onSubmit: () => void;
  saving: boolean;
}

export function PlanFormDialog({
  open,
  onOpenChange,
  form,
  onFormChange,
  onSubmit,
  saving,
}: PlanFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]" aria-describedby="plan-dialog-desc">
        <DialogHeader>
          <DialogTitle className="text-sm" id="plan-dialog-title">
            새 플랜 추가
          </DialogTitle>
        </DialogHeader>
        <p id="plan-dialog-desc" className="sr-only">
          무대 평면도 플랜 이름과 무대 규격을 입력하세요.
        </p>

        <div className="space-y-3 py-2">
          {/* 플랜 이름 */}
          <div className="space-y-1.5">
            <Label htmlFor="plan-name" className="text-xs">
              플랜 이름 <span aria-hidden="true">*</span>
              <span className="sr-only">(필수)</span>
            </Label>
            <Input
              id="plan-name"
              className="h-8 text-xs"
              placeholder="예) 메인 공연 무대"
              value={form.planName}
              onChange={(e) =>
                onFormChange((f) => ({ ...f, planName: e.target.value }))
              }
              aria-required="true"
            />
          </div>

          {/* 무대 규격 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="stage-width" className="text-xs">
                무대 너비 (m)
              </Label>
              <Input
                id="stage-width"
                className="h-8 text-xs"
                type="number"
                placeholder="예) 12"
                value={form.stageWidth}
                onChange={(e) =>
                  onFormChange((f) => ({ ...f, stageWidth: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="stage-depth" className="text-xs">
                무대 깊이 (m)
              </Label>
              <Input
                id="stage-depth"
                className="h-8 text-xs"
                type="number"
                placeholder="예) 8"
                value={form.stageDepth}
                onChange={(e) =>
                  onFormChange((f) => ({ ...f, stageDepth: e.target.value }))
                }
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onOpenChange(false)}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={onSubmit}
            disabled={saving}
            aria-busy={saving}
          >
            {saving ? "저장 중..." : "추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── 아이템 추가·수정 다이얼로그 ──────────────────────────

interface ItemFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  form: ItemFormState;
  onFormChange: React.Dispatch<React.SetStateAction<ItemFormState>>;
  onSubmit: () => void;
  saving: boolean;
  submitLabel: string;
}

export function ItemFormDialog({
  open,
  onOpenChange,
  title,
  form,
  onFormChange,
  onSubmit,
  saving,
  submitLabel,
}: ItemFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]" aria-describedby="item-dialog-desc">
        <DialogHeader>
          <DialogTitle className="text-sm" id="item-dialog-title">
            {title}
          </DialogTitle>
        </DialogHeader>
        <p id="item-dialog-desc" className="sr-only">
          무대 아이템의 유형, 라벨, 위치, 크기, 회전 등을 입력하세요.
        </p>

        <div className="space-y-3 py-2">
          {/* 유형 */}
          <div className="space-y-1.5">
            <Label htmlFor="item-type" className="text-xs">
              유형 <span aria-hidden="true">*</span>
              <span className="sr-only">(필수)</span>
            </Label>
            <Select
              value={form.type}
              onValueChange={(v) =>
                onFormChange((f) => ({ ...f, type: v as StageLayoutItemType }))
              }
            >
              <SelectTrigger id="item-type" className="h-8 text-xs" aria-required="true">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ITEM_TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">
                    <span className="flex items-center gap-1.5">
                      {ITEM_TYPE_ICONS[t]}
                      {ITEM_TYPE_LABELS[t]}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 라벨 */}
          <div className="space-y-1.5">
            <Label htmlFor="item-label" className="text-xs">
              라벨 <span aria-hidden="true">*</span>
              <span className="sr-only">(필수)</span>
            </Label>
            <Input
              id="item-label"
              className="h-8 text-xs"
              placeholder="예) 메인 스피커 L"
              value={form.label}
              onChange={(e) =>
                onFormChange((f) => ({ ...f, label: e.target.value }))
              }
              aria-required="true"
            />
          </div>

          {/* 위치 */}
          <fieldset>
            <legend className="text-xs font-medium mb-1.5">위치</legend>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="item-x" className="text-xs">
                  X 위치 (0~100%)
                </Label>
                <Input
                  id="item-x"
                  className="h-8 text-xs"
                  type="number"
                  min={0}
                  max={100}
                  value={form.x}
                  onChange={(e) =>
                    onFormChange((f) => ({
                      ...f,
                      x: clampPosition(Number(e.target.value)),
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="item-y" className="text-xs">
                  Y 위치 (0~100%)
                </Label>
                <Input
                  id="item-y"
                  className="h-8 text-xs"
                  type="number"
                  min={0}
                  max={100}
                  value={form.y}
                  onChange={(e) =>
                    onFormChange((f) => ({
                      ...f,
                      y: clampPosition(Number(e.target.value)),
                    }))
                  }
                />
              </div>
            </div>
          </fieldset>

          {/* 크기 */}
          <fieldset>
            <legend className="text-xs font-medium mb-1.5">크기</legend>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="item-width" className="text-xs">
                  너비 (%)
                </Label>
                <Input
                  id="item-width"
                  className="h-8 text-xs"
                  type="number"
                  min={1}
                  max={50}
                  value={form.width}
                  onChange={(e) =>
                    onFormChange((f) => ({
                      ...f,
                      width: clampSize(Number(e.target.value)),
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="item-height" className="text-xs">
                  높이 (%)
                </Label>
                <Input
                  id="item-height"
                  className="h-8 text-xs"
                  type="number"
                  min={1}
                  max={50}
                  value={form.height}
                  onChange={(e) =>
                    onFormChange((f) => ({
                      ...f,
                      height: clampSize(Number(e.target.value)),
                    }))
                  }
                />
              </div>
            </div>
          </fieldset>

          {/* 회전 */}
          <div className="space-y-1.5">
            <Label htmlFor="item-rotation" className="text-xs">
              회전 (도)
            </Label>
            <Input
              id="item-rotation"
              className="h-8 text-xs"
              type="number"
              min={0}
              max={359}
              value={form.rotation}
              onChange={(e) =>
                onFormChange((f) => ({
                  ...f,
                  rotation: normalizeRotation(Number(e.target.value)),
                }))
              }
            />
          </div>

          {/* 메모 */}
          <div className="space-y-1.5">
            <Label htmlFor="item-notes" className="text-xs">
              메모
            </Label>
            <Textarea
              id="item-notes"
              className="text-xs min-h-[60px] resize-none"
              placeholder="추가 정보를 입력해주세요."
              value={form.notes}
              onChange={(e) =>
                onFormChange((f) => ({ ...f, notes: e.target.value }))
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onOpenChange(false)}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={onSubmit}
            disabled={saving}
            aria-busy={saving}
          >
            {saving ? "저장 중..." : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
