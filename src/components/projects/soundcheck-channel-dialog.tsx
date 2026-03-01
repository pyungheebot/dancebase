"use client";

/**
 * 사운드체크 채널 추가/편집 다이얼로그
 * 채널 번호, 소스명, 유형, 볼륨, 팬, EQ 설정, 채널 메모를 입력받습니다.
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Headphones } from "lucide-react";
import type { SoundcheckChannel } from "@/types";
import {
  CHANNEL_TYPE_LABELS,
  CHANNEL_TYPE_OPTIONS,
  formatPan,
  type ChannelFormData,
} from "./soundcheck-sheet-types";

// ============================================================
// Props 타입
// ============================================================

type ChannelDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: ChannelFormData;
  setForm: (f: ChannelFormData) => void;
  onSave: () => void;
  saving: boolean;
  /** true이면 "수정" 모드, false이면 "추가" 모드 */
  isEdit: boolean;
};

// ============================================================
// 컴포넌트
// ============================================================

export const ChannelDialog = memo(function ChannelDialog({
  open,
  onOpenChange,
  form,
  setForm,
  onSave,
  saving,
  isEdit,
}: ChannelDialogProps) {
  /** 특정 필드 값만 업데이트하는 헬퍼 */
  function set<K extends keyof ChannelFormData>(
    key: K,
    value: ChannelFormData[K]
  ) {
    setForm({ ...form, [key]: value });
  }

  const volNum = parseInt(form.volume, 10);
  const panNum = parseInt(form.pan, 10);
  const dialogDescId = "channel-dialog-desc";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md max-h-[90vh] overflow-y-auto"
        aria-describedby={dialogDescId}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Headphones className="h-4 w-4 text-cyan-500" aria-hidden="true" />
            {isEdit ? "채널 수정" : "채널 추가"}
          </DialogTitle>
          <DialogDescription id={dialogDescId} className="sr-only">
            {isEdit
              ? "사운드체크 채널 정보를 수정합니다."
              : "새 사운드체크 채널을 추가합니다."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* 채널 번호 + 소스명 */}
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label htmlFor="ch-number" className="text-xs">
                채널 번호{" "}
                <span className="text-destructive" aria-hidden="true">*</span>
              </Label>
              <Input
                id="ch-number"
                className="h-8 text-xs"
                type="number"
                min="1"
                placeholder="1"
                value={form.channelNumber}
                onChange={(e) => set("channelNumber", e.target.value)}
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label htmlFor="ch-source" className="text-xs">
                소스 이름{" "}
                <span className="text-destructive" aria-hidden="true">*</span>
              </Label>
              <Input
                id="ch-source"
                className="h-8 text-xs"
                placeholder="예: 리드보컬, 킥드럼"
                value={form.source}
                onChange={(e) => set("source", e.target.value)}
              />
            </div>
          </div>

          {/* 유형 선택 */}
          <div className="space-y-1">
            <Label htmlFor="ch-type" className="text-xs">
              유형
            </Label>
            <Select
              value={form.type}
              onValueChange={(v) =>
                set("type", v as SoundcheckChannel["type"])
              }
            >
              <SelectTrigger id="ch-type" className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHANNEL_TYPE_OPTIONS.map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">
                    {CHANNEL_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 볼륨 슬라이더 */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <Label htmlFor="ch-volume" className="text-xs">
                볼륨
              </Label>
              <span className="text-[10px] text-muted-foreground" aria-live="polite">
                {isNaN(volNum) ? 0 : volNum}
              </span>
            </div>
            <Input
              id="ch-volume"
              className="h-8 text-xs"
              type="range"
              min="0"
              max="100"
              value={form.volume}
              onChange={(e) => set("volume", e.target.value)}
              aria-label="볼륨 슬라이더"
            />
            {/* 볼륨 시각화 바 */}
            <div
              className="h-1.5 bg-muted rounded-full overflow-hidden"
              role="presentation"
            >
              <div
                className="h-full bg-cyan-400 rounded-full transition-all"
                style={{ width: `${isNaN(volNum) ? 0 : volNum}%` }}
              />
            </div>
          </div>

          {/* 팬 슬라이더 */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <Label htmlFor="ch-pan" className="text-xs">
                팬 (Pan)
              </Label>
              <span className="text-[10px] text-muted-foreground" aria-live="polite">
                {isNaN(panNum) ? "C" : formatPan(panNum)}
              </span>
            </div>
            <Input
              id="ch-pan"
              className="h-8 text-xs"
              type="range"
              min="-100"
              max="100"
              value={form.pan}
              onChange={(e) => set("pan", e.target.value)}
              aria-label="팬 슬라이더"
            />
            {/* L/C/R 레이블 */}
            <div className="flex justify-between text-[9px] text-muted-foreground" aria-hidden="true">
              <span>L</span>
              <span>C</span>
              <span>R</span>
            </div>
          </div>

          {/* EQ 설정 */}
          <div className="space-y-1">
            <Label htmlFor="ch-eq" className="text-xs">
              EQ 설정
            </Label>
            <Input
              id="ch-eq"
              className="h-8 text-xs"
              placeholder="예: Hi 3kHz +2dB, Lo 100Hz -3dB"
              value={form.eq}
              onChange={(e) => set("eq", e.target.value)}
            />
          </div>

          {/* 채널 메모 */}
          <div className="space-y-1">
            <Label htmlFor="ch-notes" className="text-xs">
              채널 메모
            </Label>
            <Textarea
              id="ch-notes"
              className="text-xs min-h-[48px] resize-none"
              placeholder="이 채널에 대한 특이사항"
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
          >
            {saving ? "저장 중..." : isEdit ? "수정" : "추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
