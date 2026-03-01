"use client";

/**
 * 사운드체크 시트 추가/편집 다이얼로그
 * 시트 이름, 담당 엔지니어, 체크 날짜, 전체 메모를 입력받습니다.
 */

import { memo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Headphones, User, Calendar } from "lucide-react";
import type { SheetFormData } from "./soundcheck-sheet-types";

// ============================================================
// Props 타입
// ============================================================

type SheetDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: SheetFormData;
  setForm: (f: SheetFormData) => void;
  onSave: () => void;
  saving: boolean;
  /** true이면 "수정" 모드, false이면 "추가" 모드 */
  isEdit: boolean;
};

// ============================================================
// 컴포넌트
// ============================================================

export const SheetDialog = memo(function SheetDialog({
  open,
  onOpenChange,
  form,
  setForm,
  onSave,
  saving,
  isEdit,
}: SheetDialogProps) {
  /** 특정 필드 값만 업데이트하는 헬퍼 */
  function set<K extends keyof SheetFormData>(key: K, value: SheetFormData[K]) {
    setForm({ ...form, [key]: value });
  }

  const dialogDescId = "sheet-dialog-desc";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" aria-describedby={dialogDescId}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Headphones className="h-4 w-4 text-cyan-500" aria-hidden="true" />
            {isEdit ? "시트 수정" : "시트 추가"}
          </DialogTitle>
          <DialogDescription id={dialogDescId} className="sr-only">
            {isEdit
              ? "사운드체크 시트 정보를 수정합니다."
              : "새 사운드체크 시트를 추가합니다."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* 시트 이름 */}
          <div className="space-y-1">
            <Label htmlFor="sheet-name" className="text-xs">
              시트 이름 <span className="text-destructive" aria-hidden="true">*</span>
            </Label>
            <Input
              id="sheet-name"
              className="h-8 text-xs"
              placeholder="예: 1부 사운드체크, 리허설 시트"
              value={form.sheetName}
              onChange={(e) => set("sheetName", e.target.value)}
            />
          </div>

          {/* 담당 엔지니어 + 체크 날짜 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="sheet-engineer" className="text-xs">
                담당 엔지니어
              </Label>
              <div className="relative">
                <User
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="sheet-engineer"
                  className="h-8 text-xs pl-6"
                  placeholder="예: 홍길동"
                  value={form.engineer}
                  onChange={(e) => set("engineer", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="sheet-check-date" className="text-xs">
                체크 날짜
              </Label>
              <div className="relative">
                <Calendar
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="sheet-check-date"
                  className="h-8 text-xs pl-6"
                  type="date"
                  value={form.checkDate}
                  onChange={(e) => set("checkDate", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* 전체 메모 */}
          <div className="space-y-1">
            <Label htmlFor="sheet-overall-notes" className="text-xs">
              전체 메모
            </Label>
            <Textarea
              id="sheet-overall-notes"
              className="text-xs min-h-[56px] resize-none"
              placeholder="사운드체크 전체에 대한 메모"
              value={form.overallNotes}
              onChange={(e) => set("overallNotes", e.target.value)}
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
          >
            {saving ? "저장 중..." : isEdit ? "수정" : "추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
