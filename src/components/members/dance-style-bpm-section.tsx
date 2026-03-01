"use client";

import { useState } from "react";
import { Music, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";

interface BpmRange {
  min: number;
  max: number;
}

interface DanceStyleBpmSectionProps {
  bpmRange: BpmRange;
  onSave: (range: BpmRange) => Promise<void>;
}

export function DanceStyleBpmSection({ bpmRange, onSave }: DanceStyleBpmSectionProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<[number, number]>([80, 140]);

  function startEdit() {
    setDraft([bpmRange.min, bpmRange.max]);
    setEditing(true);
  }

  async function handleSave() {
    try {
      await onSave({ min: draft[0], max: draft[1] });
      toast.success(TOAST.MEMBERS.FLEXIBILITY_BPM_SAVED);
      setEditing(false);
    } catch {
      toast.error(TOAST.SAVE_ERROR);
    }
  }

  return (
    <section aria-labelledby="section-bpm" className="space-y-2">
      <div className="flex items-center justify-between">
        <span
          id="section-bpm"
          className="text-xs font-medium text-muted-foreground flex items-center gap-1"
        >
          <Music className="h-3 w-3" aria-hidden="true" />
          선호 음악 BPM 범위
        </span>
        {!editing && (
          <Button
            size="sm"
            variant="ghost"
            className="h-6 text-[10px] px-1.5"
            onClick={startEdit}
            aria-label="BPM 범위 편집"
          >
            <Pencil className="h-2.5 w-2.5 mr-0.5" aria-hidden="true" />
            편집
          </Button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3 px-1">
          <div
            className="flex items-center justify-between text-xs text-muted-foreground"
            aria-live="polite"
            aria-atomic="true"
          >
            <span>{draft[0]} BPM</span>
            <span className="text-[10px]">~</span>
            <span>{draft[1]} BPM</span>
          </div>
          <Slider
            min={40}
            max={220}
            step={5}
            value={draft}
            onValueChange={(v) => {
              if (v.length === 2) setDraft([v[0], v[1]]);
            }}
            className="w-full"
            aria-label="BPM 범위 슬라이더"
          />
          <div className="flex justify-end gap-1.5">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => setEditing(false)}
            >
              <X className="h-3 w-3 mr-1" aria-hidden="true" />
              취소
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={handleSave}>
              <Check className="h-3 w-3 mr-1" aria-hidden="true" />
              저장
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2" aria-live="polite">
          <Badge
            variant="outline"
            className="text-[10px] px-2 py-0.5 bg-violet-50 text-violet-700 border-violet-200"
          >
            {bpmRange.min} BPM
          </Badge>
          <span className="text-[10px] text-muted-foreground" aria-hidden="true">
            ~
          </span>
          <Badge
            variant="outline"
            className="text-[10px] px-2 py-0.5 bg-violet-50 text-violet-700 border-violet-200"
          >
            {bpmRange.max} BPM
          </Badge>
          {bpmRange.max - bpmRange.min > 0 && (
            <span className="text-[10px] text-muted-foreground">
              ({bpmRange.max - bpmRange.min} 폭)
            </span>
          )}
        </div>
      )}
    </section>
  );
}
