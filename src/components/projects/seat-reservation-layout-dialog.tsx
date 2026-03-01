"use client";

import { Armchair } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { LayoutFormData } from "./seat-reservation-types";
import { LAYOUT_VALIDATION } from "./seat-reservation-types";

// ============================================================
// 배치 생성 다이얼로그
// ============================================================

interface LayoutCreateDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: LayoutFormData;
  setForm: (f: LayoutFormData) => void;
  onSave: () => void;
  saving: boolean;
}

export function LayoutCreateDialog({
  open,
  onOpenChange,
  form,
  setForm,
  onSave,
  saving,
}: LayoutCreateDialogProps) {
  function set<K extends keyof LayoutFormData>(
    key: K,
    value: LayoutFormData[K]
  ) {
    setForm({ ...form, [key]: value });
  }

  const rows = parseInt(form.rows, 10);
  const seatsPerRow = parseInt(form.seatsPerRow, 10);
  const totalSeats =
    !isNaN(rows) && !isNaN(seatsPerRow) ? rows * seatsPerRow : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Armchair className="h-4 w-4 text-purple-500" aria-hidden="true" />
            좌석 배치 생성
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* 배치 이름 */}
          <div className="space-y-1">
            <Label htmlFor="layout-name" className="text-xs">
              배치 이름{" "}
              <span className="text-destructive" aria-hidden="true">
                *
              </span>
              <span className="sr-only">(필수)</span>
            </Label>
            <Input
              id="layout-name"
              className="h-8 text-xs"
              placeholder="예: 1층 관람석, VIP석"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              aria-required="true"
            />
          </div>

          {/* 행 수 + 행당 좌석 수 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="layout-rows" className="text-xs">
                행 수{" "}
                <span className="text-destructive" aria-hidden="true">
                  *
                </span>
                <span className="sr-only">(필수)</span>{" "}
                <span className="text-muted-foreground font-normal">
                  ({LAYOUT_VALIDATION.ROW_MIN}~{LAYOUT_VALIDATION.ROW_MAX})
                </span>
              </Label>
              <Input
                id="layout-rows"
                className="h-8 text-xs"
                type="number"
                min={LAYOUT_VALIDATION.ROW_MIN}
                max={LAYOUT_VALIDATION.ROW_MAX}
                value={form.rows}
                onChange={(e) => set("rows", e.target.value)}
                aria-required="true"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="layout-seats-per-row" className="text-xs">
                행당 좌석 수{" "}
                <span className="text-destructive" aria-hidden="true">
                  *
                </span>
                <span className="sr-only">(필수)</span>{" "}
                <span className="text-muted-foreground font-normal">
                  ({LAYOUT_VALIDATION.SEAT_MIN}~{LAYOUT_VALIDATION.SEAT_MAX})
                </span>
              </Label>
              <Input
                id="layout-seats-per-row"
                className="h-8 text-xs"
                type="number"
                min={LAYOUT_VALIDATION.SEAT_MIN}
                max={LAYOUT_VALIDATION.SEAT_MAX}
                value={form.seatsPerRow}
                onChange={(e) => set("seatsPerRow", e.target.value)}
                aria-required="true"
              />
            </div>
          </div>

          {/* 총 좌석 수 미리보기 */}
          {totalSeats > 0 && (
            <div
              className="rounded-md bg-muted/50 px-3 py-2 text-center"
              aria-live="polite"
              aria-atomic="true"
            >
              <p className="text-xs text-muted-foreground">
                총{" "}
                <span className="font-bold text-foreground text-sm">
                  {totalSeats}
                </span>
                석이 생성됩니다.
              </p>
            </div>
          )}
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
            {saving ? "생성 중..." : "생성"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
