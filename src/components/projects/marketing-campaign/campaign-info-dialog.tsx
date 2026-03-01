"use client";

import { useState } from "react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
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

export type CampaignInfoDialogProps = {
  open: boolean;
  campaignName: string;
  targetAudience: string | null;
  budget: number | null;
  onClose: () => void;
  onSubmit: (
    name: string,
    audience: string | null,
    budget: number | null
  ) => void;
};

export function CampaignInfoDialog({
  open,
  campaignName,
  targetAudience,
  budget,
  onClose,
  onSubmit,
}: CampaignInfoDialogProps) {
  const [name, setName] = useState(campaignName);
  const [audience, setAudience] = useState(targetAudience ?? "");
  const [budgetStr, setBudgetStr] = useState(
    budget != null ? String(budget) : ""
  );

  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setName(campaignName);
      setAudience(targetAudience ?? "");
      setBudgetStr(budget != null ? String(budget) : "");
    }
  }

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error(TOAST.CAMPAIGN.NAME_REQUIRED);
      return;
    }
    const parsedBudget =
      budgetStr.trim() !== "" ? Number(budgetStr.replace(/,/g, "")) : null;
    onSubmit(
      name.trim(),
      audience.trim() || null,
      isNaN(parsedBudget as number) ? null : parsedBudget
    );
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-sm"
        aria-labelledby="campaign-info-dialog-title"
      >
        <DialogHeader>
          <DialogTitle id="campaign-info-dialog-title" className="text-sm">
            캠페인 정보 설정
          </DialogTitle>
        </DialogHeader>

        <fieldset className="space-y-3 py-1 border-0 p-0 m-0">
          <legend className="sr-only">캠페인 기본 정보</legend>

          <div className="space-y-1">
            <Label htmlFor="campaign-info-name" className="text-xs">
              캠페인 이름 *
            </Label>
            <Input
              id="campaign-info-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예) 봄 공연 홍보 캠페인"
              className="h-8 text-xs"
              aria-required="true"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="campaign-info-audience" className="text-xs">
              타겟 관객
            </Label>
            <Input
              id="campaign-info-audience"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="예) 10~30대 댄스 관심 SNS 사용자"
              className="h-8 text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="campaign-info-budget" className="text-xs">
              예산 (원)
            </Label>
            <Input
              id="campaign-info-budget"
              type="number"
              value={budgetStr}
              onChange={(e) => setBudgetStr(e.target.value)}
              placeholder="예) 200000"
              className="h-8 text-xs"
              min={0}
            />
          </div>
        </fieldset>

        <DialogFooter className="gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={onClose}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
