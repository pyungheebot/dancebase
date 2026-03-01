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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users } from "lucide-react";
import type { SponsoredGoodsItem } from "@/types";

// ============================================================
// Props
// ============================================================

type DistributeDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  item: SponsoredGoodsItem | null;
  remaining: number;
  memberNames: string[];
  memberValue: string;
  onMemberChange: (v: string) => void;
  qtyValue: string;
  onQtyChange: (v: string) => void;
  onSave: () => void;
  saving: boolean;
};

// ============================================================
// 컴포넌트
// ============================================================

export function SponsoredGoodsDistributeDialog({
  open,
  onOpenChange,
  item,
  remaining,
  memberNames,
  memberValue,
  onMemberChange,
  qtyValue,
  onQtyChange,
  onSave,
  saving,
}: DistributeDialogProps) {
  if (!item) return null;

  const dialogId = "sponsored-goods-distribute-dialog";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-sm"
        aria-labelledby={`${dialogId}-title`}
        aria-describedby={`${dialogId}-desc`}
      >
        <DialogHeader>
          <DialogTitle
            id={`${dialogId}-title`}
            className="flex items-center gap-2 text-sm"
          >
            <Users className="h-4 w-4 text-blue-500" aria-hidden="true" />
            협찬품 배분
          </DialogTitle>
        </DialogHeader>

        <p id={`${dialogId}-desc`} className="sr-only">
          협찬품을 멤버에게 배분합니다. 멤버와 수량을 선택 후 배분 버튼을 누르세요.
        </p>

        <div className="space-y-3 py-1" role="form" aria-label="협찬품 배분 입력">
          {/* 물품 정보 */}
          <div
            className="rounded-md bg-muted/50 px-3 py-2 space-y-0.5"
            aria-label="배분할 협찬품 정보"
          >
            <p className="text-xs font-semibold">{item.itemName}</p>
            <p className="text-[10px] text-muted-foreground">
              스폰서: {item.sponsor} · 잔여:{" "}
              <span aria-label={`잔여 ${remaining}개`}>{remaining}개</span>
            </p>
          </div>

          {/* 멤버 선택 */}
          <div className="space-y-1">
            <Label htmlFor={`${dialogId}-member`} className="text-xs">
              멤버{" "}
              <span className="text-destructive" aria-hidden="true">
                *
              </span>
              <span className="sr-only">(필수)</span>
            </Label>
            {memberNames.length > 0 ? (
              <Select value={memberValue} onValueChange={onMemberChange}>
                <SelectTrigger
                  id={`${dialogId}-member`}
                  className="h-8 text-xs"
                  aria-label="배분할 멤버 선택"
                  aria-required="true"
                >
                  <SelectValue placeholder="멤버 선택" />
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
                id={`${dialogId}-member`}
                className="h-8 text-xs"
                placeholder="멤버 이름 직접 입력"
                value={memberValue}
                onChange={(e) => onMemberChange(e.target.value)}
                aria-required="true"
              />
            )}
          </div>

          {/* 수량 */}
          <div className="space-y-1">
            <Label htmlFor={`${dialogId}-qty`} className="text-xs">
              배분 수량{" "}
              <span className="text-destructive" aria-hidden="true">
                *
              </span>
              <span className="sr-only">(필수)</span>{" "}
              <span className="text-muted-foreground font-normal">
                (최대 {remaining}개)
              </span>
            </Label>
            <Input
              id={`${dialogId}-qty`}
              className="h-8 text-xs"
              type="number"
              min="1"
              max={remaining}
              value={qtyValue}
              onChange={(e) => onQtyChange(e.target.value)}
              aria-required="true"
              aria-describedby={`${dialogId}-qty-hint`}
            />
            <p id={`${dialogId}-qty-hint`} className="sr-only">
              최대 {remaining}개까지 배분할 수 있습니다.
            </p>
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
            {saving ? "배분 중..." : "배분"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
