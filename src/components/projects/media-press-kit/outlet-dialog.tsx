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
import type { MediaPressKitOutletType } from "@/types";
import type { AddOutletInput } from "@/hooks/use-media-press-kit";
import { OUTLET_TYPE_CONFIG } from "./types";

interface OutletDialogProps {
  open: boolean;
  form: AddOutletInput;
  saving: boolean;
  onFormChange: (form: AddOutletInput) => void;
  onSave: () => void;
  onClose: () => void;
}

export function OutletDialog({
  open,
  form,
  saving,
  onFormChange,
  onSave,
  onClose,
}: OutletDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent
        className="max-w-sm"
        aria-describedby="outlet-dialog-desc"
      >
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            배포 매체 추가
          </DialogTitle>
        </DialogHeader>
        <p id="outlet-dialog-desc" className="sr-only">
          보도자료를 배포할 매체를 추가합니다.
        </p>

        <div className="space-y-3 py-2">
          {/* 매체명 */}
          <div className="space-y-1">
            <Label htmlFor="outlet-name" className="text-xs">
              매체명 *
            </Label>
            <Input
              id="outlet-name"
              value={form.name}
              onChange={(e) =>
                onFormChange({ ...form, name: e.target.value })
              }
              placeholder="매체 이름"
              className="h-8 text-sm"
              aria-required="true"
            />
          </div>

          {/* 유형 */}
          <div className="space-y-1">
            <Label htmlFor="outlet-type" className="text-xs">
              유형
            </Label>
            <Select
              value={form.type}
              onValueChange={(v) =>
                onFormChange({ ...form, type: v as MediaPressKitOutletType })
              }
            >
              <SelectTrigger
                id="outlet-type"
                className="h-8 text-xs"
                aria-label="매체 유형 선택"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(
                  Object.entries(OUTLET_TYPE_CONFIG) as [
                    MediaPressKitOutletType,
                    { label: string; color: string },
                  ][]
                ).map(([key, conf]) => (
                  <SelectItem key={key} value={key} className="text-xs">
                    {conf.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 담당자 / 이메일 */}
          <fieldset>
            <legend className="sr-only">매체 담당자 정보 (선택)</legend>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="outlet-contact-name" className="text-xs">
                  담당자 (선택)
                </Label>
                <Input
                  id="outlet-contact-name"
                  value={form.contactName ?? ""}
                  onChange={(e) =>
                    onFormChange({ ...form, contactName: e.target.value })
                  }
                  placeholder="기자 이름"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="outlet-contact-email" className="text-xs">
                  이메일 (선택)
                </Label>
                <Input
                  id="outlet-contact-email"
                  type="email"
                  value={form.contactEmail ?? ""}
                  onChange={(e) =>
                    onFormChange({ ...form, contactEmail: e.target.value })
                  }
                  placeholder="press@media.com"
                  className="h-8 text-sm"
                />
              </div>
            </div>
          </fieldset>

          {/* 메모 */}
          <div className="space-y-1">
            <Label htmlFor="outlet-note" className="text-xs">
              메모 (선택)
            </Label>
            <Input
              id="outlet-note"
              value={form.note ?? ""}
              onChange={(e) =>
                onFormChange({ ...form, note: e.target.value })
              }
              placeholder="배포 관련 메모"
              className="h-8 text-sm"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={onClose}
            disabled={saving}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={onSave}
            disabled={saving || !form.name.trim()}
            aria-busy={saving}
          >
            {saving ? "저장 중..." : "추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
