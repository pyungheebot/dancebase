"use client";

// ============================================================
// 공연 후원/스폰서 관리 — 폼 다이얼로그 컴포넌트
// ============================================================

import { useState } from "react";
import { HandHeart, Target, X } from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PerfSponsorTier } from "@/types";
import {
  TIER_ORDER,
  TIER_LABELS,
  type SponsorFormData,
  validateSponsorForm,
  validateGoalAmount,
} from "./performance-sponsor-types";

// ── 스폰서 추가/수정 다이얼로그 ───────────────────────────

interface SponsorDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: SponsorFormData;
  onSubmit: (form: SponsorFormData) => void;
}

export function SponsorDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
}: SponsorDialogProps) {
  const [form, setForm] = useState<SponsorFormData>(initial);
  const isEdit = !!initial.name;
  const dialogTitleId = "sponsor-dialog-title";

  const handleOpenChange = (v: boolean) => {
    if (v) setForm(initial);
    onOpenChange(v);
  };

  const set = <K extends keyof SponsorFormData>(
    key: K,
    value: SponsorFormData[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = () => {
    const result = validateSponsorForm(form);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    onSubmit(form);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-lg max-h-[90vh] overflow-y-auto"
        aria-labelledby={dialogTitleId}
      >
        <DialogHeader>
          <DialogTitle
            id={dialogTitleId}
            className="flex items-center gap-2"
          >
            <HandHeart className="h-4 w-4" aria-hidden="true" />
            스폰서 {isEdit ? "수정" : "추가"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 스폰서명 */}
          <div className="space-y-1.5">
            <Label htmlFor="sponsor-name" className="text-xs font-medium">
              스폰서명 <span className="text-destructive" aria-hidden="true">*</span>
              <span className="sr-only">(필수)</span>
            </Label>
            <Input
              id="sponsor-name"
              className="h-8 text-sm"
              placeholder="기업 또는 개인 이름"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              aria-required="true"
              autoComplete="organization"
            />
          </div>

          {/* 담당자 / 이메일 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sponsor-contact" className="text-xs font-medium">
                담당자
              </Label>
              <Input
                id="sponsor-contact"
                className="h-8 text-sm"
                placeholder="홍길동"
                value={form.contactPerson}
                onChange={(e) => set("contactPerson", e.target.value)}
                autoComplete="name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sponsor-email" className="text-xs font-medium">
                이메일
              </Label>
              <Input
                id="sponsor-email"
                className="h-8 text-sm"
                placeholder="contact@example.com"
                type="email"
                value={form.contactEmail}
                onChange={(e) => set("contactEmail", e.target.value)}
                autoComplete="email"
              />
            </div>
          </div>

          {/* 등급 / 금액 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sponsor-tier" className="text-xs font-medium">
                후원 등급
              </Label>
              <Select
                value={form.tier}
                onValueChange={(v) => set("tier", v as PerfSponsorTier)}
              >
                <SelectTrigger
                  id="sponsor-tier"
                  className="h-8 text-sm"
                  aria-label="후원 등급 선택"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIER_ORDER.map((tier) => (
                    <SelectItem key={tier} value={tier} className="text-sm">
                      {TIER_LABELS[tier]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sponsor-amount" className="text-xs font-medium">
                후원 금액 (원)
              </Label>
              <Input
                id="sponsor-amount"
                className="h-8 text-sm"
                placeholder="0"
                type="number"
                min={0}
                value={form.amount}
                onChange={(e) => set("amount", e.target.value)}
                inputMode="numeric"
              />
            </div>
          </div>

          {/* 상태 */}
          <div className="space-y-1.5">
            <Label htmlFor="sponsor-status" className="text-xs font-medium">
              후원 상태
            </Label>
            <Select
              value={form.status}
              onValueChange={(v) =>
                set("status", v as SponsorFormData["status"])
              }
            >
              <SelectTrigger
                id="sponsor-status"
                className="h-8 text-sm"
                aria-label="후원 상태 선택"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending" className="text-sm">
                  보류 (협의 중)
                </SelectItem>
                <SelectItem value="confirmed" className="text-sm">
                  확정
                </SelectItem>
                <SelectItem value="declined" className="text-sm">
                  거절
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 현물 후원 */}
          <div className="space-y-1.5">
            <Label htmlFor="sponsor-inkind" className="text-xs font-medium">
              현물 후원 내역
            </Label>
            <Input
              id="sponsor-inkind"
              className="h-8 text-sm"
              placeholder="의상 협찬, 장비 대여 등 (없으면 비워두세요)"
              value={form.inKind}
              onChange={(e) => set("inKind", e.target.value)}
            />
          </div>

          {/* 로고 게재 위치 */}
          <div className="space-y-1.5">
            <Label
              htmlFor="sponsor-logo-placement"
              className="text-xs font-medium"
            >
              로고 게재 위치
            </Label>
            <Input
              id="sponsor-logo-placement"
              className="h-8 text-sm"
              placeholder="무대 배너, 팸플릿 표지 등"
              value={form.logoPlacement}
              onChange={(e) => set("logoPlacement", e.target.value)}
            />
          </div>

          {/* 혜택 목록 */}
          <div className="space-y-1.5">
            <Label htmlFor="sponsor-benefits" className="text-xs font-medium">
              제공 혜택 (쉼표로 구분)
            </Label>
            <Input
              id="sponsor-benefits"
              className="h-8 text-sm"
              placeholder="VIP 좌석 2석, SNS 홍보, 현장 부스"
              value={form.benefitsRaw}
              onChange={(e) => set("benefitsRaw", e.target.value)}
              aria-describedby="sponsor-benefits-hint"
            />
            <p
              id="sponsor-benefits-hint"
              className="text-[10px] text-muted-foreground"
            >
              쉼표(,)로 구분하여 여러 혜택을 입력하세요.
            </p>
          </div>

          {/* 메모 */}
          <div className="space-y-1.5">
            <Label htmlFor="sponsor-notes" className="text-xs font-medium">
              메모
            </Label>
            <Textarea
              id="sponsor-notes"
              className="text-sm min-h-[60px] resize-none"
              placeholder="협의 사항, 특이 조건 등"
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
          >
            <X className="h-3 w-3 mr-1" aria-hidden="true" />
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

// ── 목표 금액 설정 다이얼로그 ──────────────────────────────

interface GoalDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  currentGoal: number | null;
  onSave: (goal: number | null) => void;
}

export function GoalDialog({
  open,
  onOpenChange,
  currentGoal,
  onSave,
}: GoalDialogProps) {
  const [value, setValue] = useState(
    currentGoal != null ? String(currentGoal) : ""
  );
  const dialogTitleId = "goal-dialog-title";

  const handleOpenChange = (v: boolean) => {
    if (v) setValue(currentGoal != null ? String(currentGoal) : "");
    onOpenChange(v);
  };

  const handleSave = () => {
    const result = validateGoalAmount(value);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    if (!value.trim()) {
      onSave(null);
    } else {
      onSave(Number(value.replace(/,/g, "")));
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-sm"
        aria-labelledby={dialogTitleId}
      >
        <DialogHeader>
          <DialogTitle
            id={dialogTitleId}
            className="flex items-center gap-2"
          >
            <Target className="h-4 w-4" aria-hidden="true" />
            후원 목표 금액 설정
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-1.5 py-2">
          <Label htmlFor="goal-amount" className="text-xs font-medium">
            목표 금액 (원)
          </Label>
          <Input
            id="goal-amount"
            className="h-8 text-sm"
            placeholder="5000000"
            type="number"
            min={0}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            aria-describedby="goal-amount-hint"
            inputMode="numeric"
          />
          <p id="goal-amount-hint" className="text-[10px] text-muted-foreground">
            비워두면 목표 설정을 해제합니다.
          </p>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onOpenChange(false)}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSave}>
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
