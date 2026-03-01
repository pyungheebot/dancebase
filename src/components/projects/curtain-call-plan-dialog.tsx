"use client";

import { Music, Sparkles } from "lucide-react";
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
import type { PlanFormData } from "./curtain-call-types";

// ============================================================
// 플랜 추가/편집 다이얼로그
// ============================================================

interface PlanDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: PlanFormData;
  setForm: (f: PlanFormData) => void;
  onSave: () => void;
  saving: boolean;
  isEdit: boolean;
}

export function CurtainCallPlanDialog({
  open,
  onOpenChange,
  form,
  setForm,
  onSave,
  saving,
  isEdit,
}: PlanDialogProps) {
  function set<K extends keyof PlanFormData>(key: K, value: PlanFormData[K]) {
    setForm({ ...form, [key]: value });
  }

  const planNameId = "curtain-call-plan-name";
  const musicTrackId = "curtain-call-music-track";
  const notesId = "curtain-call-notes";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-sm"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-pink-500" aria-hidden="true" />
            {isEdit ? "플랜 수정" : "플랜 추가"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* 플랜 이름 */}
          <div className="space-y-1">
            <Label htmlFor={planNameId} className="text-xs">
              플랜 이름 <span className="text-destructive" aria-hidden="true">*</span>
              <span className="sr-only">(필수)</span>
            </Label>
            <Input
              id={planNameId}
              className="h-8 text-xs"
              placeholder="예: 메인 커튼콜, 앵콜 커튼콜"
              value={form.planName}
              onChange={(e) => set("planName", e.target.value)}
              aria-required="true"
            />
          </div>

          {/* 음악 트랙 */}
          <div className="space-y-1">
            <Label htmlFor={musicTrackId} className="text-xs">음악 트랙</Label>
            <div className="relative">
              <Music
                className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id={musicTrackId}
                className="h-8 text-xs pl-6"
                placeholder="예: Finale - Orchestra Ver."
                value={form.musicTrack}
                onChange={(e) => set("musicTrack", e.target.value)}
              />
            </div>
          </div>

          {/* 메모 */}
          <div className="space-y-1">
            <Label htmlFor={notesId} className="text-xs">메모</Label>
            <Textarea
              id={notesId}
              className="text-xs min-h-[56px] resize-none"
              placeholder="플랜에 대한 메모"
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
