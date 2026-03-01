"use client";

import { useState } from "react";
import { Grid3X3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import type { FormationScene } from "@/types";
import { QUICK_LABELS } from "./types";

// ============================================
// 씬 추가 다이얼로그
// ============================================

interface AddSceneDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (label: string) => void;
  scenes: FormationScene[];
}

export function AddSceneDialog({
  open,
  onClose,
  onAdd,
  scenes,
}: AddSceneDialogProps) {
  const [label, setLabel] = useState("");

  function handleAdd() {
    if (!label.trim()) {
      toast.error(TOAST.FORMATION_EDITOR.SECTION_REQUIRED);
      return;
    }
    onAdd(label.trim());
    setLabel("");
    onClose();
  }

  function handleClose() {
    onClose();
    setLabel("");
  }

  const availableQuickLabels = QUICK_LABELS.filter(
    (l) => !scenes.some((s) => s.label === l)
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) handleClose();
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Grid3X3 className="h-4 w-4 text-indigo-500" aria-hidden="true" />
            구간(씬) 추가
          </DialogTitle>
        </DialogHeader>

        <div className="py-2 space-y-3">
          <div>
            <Label
              htmlFor="scene-label-input"
              className="text-xs text-muted-foreground mb-1.5 block"
            >
              구간 이름
            </Label>
            <Input
              id="scene-label-input"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="예: 인트로, 후렴, 브릿지"
              className="text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
              }}
              autoFocus
              aria-describedby={
                availableQuickLabels.length > 0 ? "quick-label-hint" : undefined
              }
            />
          </div>

          {/* 빠른 선택 */}
          {availableQuickLabels.length > 0 && (
            <div>
              <p
                id="quick-label-hint"
                className="text-[10px] text-muted-foreground mb-1.5"
              >
                빠른 선택
              </p>
              <div
                role="radiogroup"
                aria-label="구간 이름 빠른 선택"
                className="flex flex-wrap gap-1"
              >
                {availableQuickLabels.map((l) => (
                  <button
                    key={l}
                    role="radio"
                    aria-checked={label === l}
                    onClick={() => setLabel(l)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setLabel(l);
                      }
                    }}
                    className={[
                      "text-[11px] px-2 py-0.5 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      label === l
                        ? "bg-primary text-primary-foreground border-primary"
                        : "hover:bg-muted",
                    ].join(" ")}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={handleClose}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-8 text-xs"
            onClick={handleAdd}
            disabled={!label.trim()}
            aria-disabled={!label.trim()}
          >
            추가
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
