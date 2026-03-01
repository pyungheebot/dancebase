"use client";

import { useState } from "react";
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
import { Plus, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";

export interface CreateAlbumDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string, description?: string) => void;
}

export function CreateAlbumDialog({
  open,
  onClose,
  onSubmit,
}: CreateAlbumDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error(TOAST.GALLERY.ALBUM_NAME_REQUIRED);
      return;
    }
    onSubmit(trimmedName, description.trim() || undefined);
    setName("");
    setDescription("");
    onClose();
  }

  function handleClose() {
    setName("");
    setDescription("");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-sm" aria-describedby="create-album-desc">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-indigo-500" aria-hidden="true" />
            새 앨범 만들기
          </DialogTitle>
          <p id="create-album-desc" className="sr-only">
            앨범 이름과 설명을 입력하여 새 앨범을 만드세요.
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 py-1">
          <div className="space-y-1">
            <Label htmlFor="album-name" className="text-xs">
              앨범 이름 <span className="text-destructive" aria-hidden="true">*</span>
              <span className="sr-only">(필수)</span>
            </Label>
            <Input
              id="album-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 2026 봄 공연"
              className="h-7 text-xs"
              autoFocus
              required
              aria-required="true"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="album-desc" className="text-xs">설명</Label>
            <Textarea
              id="album-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="앨범 설명을 입력하세요..."
              className="text-xs resize-none min-h-[56px]"
              rows={3}
            />
          </div>
          <DialogFooter className="pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={handleClose}
            >
              취소
            </Button>
            <Button type="submit" size="sm" className="h-7 text-xs">
              <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
              만들기
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
