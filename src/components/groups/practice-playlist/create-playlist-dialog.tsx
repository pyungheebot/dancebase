"use client";

import { useState } from "react";
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

export interface CreatePlaylistDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}

export function CreatePlaylistDialog({
  open,
  onClose,
  onCreate,
}: CreatePlaylistDialogProps) {
  const [name, setName] = useState("");

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onCreate(trimmed);
    setName("");
    onClose();
    toast.success(TOAST.PLAYLIST.CREATED);
  };

  const handleClose = () => {
    setName("");
    onClose();
  };

  const inputId = "create-playlist-name";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-xs" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-sm">새 플레이리스트</DialogTitle>
        </DialogHeader>
        <div className="py-1">
          <Label
            htmlFor={inputId}
            className="text-[10px] text-muted-foreground mb-1 block"
          >
            이름 <span className="text-destructive" aria-hidden="true">*</span>
            <span className="sr-only">(필수)</span>
          </Label>
          <Input
            id={inputId}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="플레이리스트 이름"
            className="h-7 text-xs"
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            autoFocus
            aria-required="true"
          />
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={handleClose}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSubmit}
            disabled={!name.trim()}
            aria-disabled={!name.trim()}
          >
            생성
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
