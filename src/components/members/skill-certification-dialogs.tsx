"use client";

import { useState } from "react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useAsyncAction } from "@/hooks/use-async-action";
import { ShieldCheck, Plus, Square, X, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  SKILL_CERT_LEVEL_LABELS,
  SKILL_CERT_LEVEL_ORDER,
  SKILL_CERT_LEVEL_COLORS,
} from "@/hooks/use-skill-certification";
import type { SkillCertLevel } from "@/types";
import type { CreateCertDialogProps, AwardCertDialogProps } from "./skill-certification-types";

// ============================================================
// 인증 만들기 다이얼로그
// ============================================================

export function CreateCertDialog({
  open,
  onOpenChange,
  onSubmit,
}: CreateCertDialogProps) {
  const [skillName, setSkillName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState<SkillCertLevel | "">("");
  const [requirements, setRequirements] = useState<string[]>([""]);
  const { pending: submitting, execute } = useAsyncAction();

  const skillNameId = "create-cert-skill-name";
  const descriptionId = "create-cert-description";
  const categoryId = "create-cert-category";
  const levelGroupId = "create-cert-level-group";

  function resetForm() {
    setSkillName("");
    setDescription("");
    setCategory("");
    setLevel("");
    setRequirements([""]);
  }

  function handleClose() {
    resetForm();
    onOpenChange(false);
  }

  function addRequirement() {
    setRequirements((prev) => [...prev, ""]);
  }

  function updateRequirement(index: number, value: string) {
    setRequirements((prev) => prev.map((r, i) => (i === index ? value : r)));
  }

  function removeRequirement(index: number) {
    setRequirements((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit() {
    if (!skillName.trim()) {
      toast.error(TOAST.MEMBERS.SKILL_NAME_REQUIRED);
      return;
    }
    if (!category.trim()) {
      toast.error(TOAST.MEMBERS.SKILL_CATEGORY_REQUIRED);
      return;
    }
    if (!level) {
      toast.error(TOAST.MEMBERS.SKILL_LEVEL_REQUIRED);
      return;
    }
    void execute(async () => {
      const filteredReqs = requirements.filter((r) => r.trim() !== "");
      onSubmit({
        skillName: skillName.trim(),
        description: description.trim(),
        category: category.trim(),
        level,
        requirements: filteredReqs,
      });
      resetForm();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-blue-500" aria-hidden="true" />
            새 기술 인증 만들기
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* 스킬명 */}
          <div className="space-y-1">
            <label
              htmlFor={skillNameId}
              className="text-xs text-muted-foreground font-medium"
            >
              스킬명 <span className="text-destructive" aria-hidden="true">*</span>
              <span className="sr-only">(필수)</span>
            </label>
            <Input
              id={skillNameId}
              placeholder="예: 백플립, 웨이브, 프리즈"
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
              className="h-8 text-xs"
              aria-required="true"
            />
          </div>

          {/* 설명 */}
          <div className="space-y-1">
            <label
              htmlFor={descriptionId}
              className="text-xs text-muted-foreground font-medium"
            >
              설명
            </label>
            <Textarea
              id={descriptionId}
              placeholder="기술에 대한 설명을 입력하세요."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-xs min-h-[64px] resize-none"
            />
          </div>

          {/* 카테고리 */}
          <div className="space-y-1">
            <label
              htmlFor={categoryId}
              className="text-xs text-muted-foreground font-medium"
            >
              카테고리 <span className="text-destructive" aria-hidden="true">*</span>
              <span className="sr-only">(필수)</span>
            </label>
            <Input
              id={categoryId}
              placeholder="예: 상체 기술, 하체 기술, 전신 동작"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-8 text-xs"
              aria-required="true"
            />
          </div>

          {/* 레벨 */}
          <div className="space-y-1">
            <p
              id={levelGroupId}
              className="text-xs text-muted-foreground font-medium"
            >
              레벨 <span className="text-destructive" aria-hidden="true">*</span>
              <span className="sr-only">(필수)</span>
            </p>
            <div
              className="flex flex-wrap gap-1.5"
              role="radiogroup"
              aria-labelledby={levelGroupId}
              aria-required="true"
            >
              {SKILL_CERT_LEVEL_ORDER.map((lv) => {
                const colors = SKILL_CERT_LEVEL_COLORS[lv];
                const isSelected = level === lv;
                return (
                  <button
                    key={lv}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setLevel(lv)}
                    className={`text-[11px] px-2.5 py-1 rounded-md border font-medium transition-colors ${
                      isSelected
                        ? `${colors.badge} border-current`
                        : "bg-background text-muted-foreground border-border hover:bg-accent"
                    }`}
                  >
                    {SKILL_CERT_LEVEL_LABELS[lv]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 요구사항 */}
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground font-medium">요구사항</p>
            <ul role="list" className="space-y-1.5" aria-label="요구사항 목록">
              {requirements.map((req, i) => (
                <li key={i} role="listitem" className="flex items-center gap-1.5">
                  <Square
                    className="h-3.5 w-3.5 text-muted-foreground shrink-0"
                    aria-hidden="true"
                  />
                  <Input
                    id={`req-${i}`}
                    placeholder={`요구사항 ${i + 1}`}
                    value={req}
                    onChange={(e) => updateRequirement(i, e.target.value)}
                    className="h-7 text-xs flex-1"
                    aria-label={`요구사항 ${i + 1}`}
                  />
                  {requirements.length > 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      aria-label={`요구사항 ${i + 1} 삭제`}
                      onClick={() => removeRequirement(i)}
                    >
                      <X className="h-3 w-3" aria-hidden="true" />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs w-full"
              onClick={addRequirement}
            >
              <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
              요구사항 추가
            </Button>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={handleClose}
            disabled={submitting}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSubmit}
            disabled={submitting}
          >
            <ShieldCheck className="h-3 w-3 mr-1" aria-hidden="true" />
            {submitting ? "생성 중..." : "인증 생성"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 인증 수여 다이얼로그
// ============================================================

export function AwardCertDialog({
  open,
  onOpenChange,
  certs,
  memberNames,
  existingAwards,
  onSubmit,
}: AwardCertDialogProps) {
  const [certId, setCertId] = useState("");
  const [memberName, setMemberName] = useState("");
  const [certifiedBy, setCertifiedBy] = useState("");
  const [notes, setNotes] = useState("");
  const { pending: submitting, execute: executeAward } = useAsyncAction();

  const certifiedById = "award-cert-certified-by";
  const notesId = "award-cert-notes";
  const duplicateAlertId = "award-cert-duplicate-alert";

  function resetForm() {
    setCertId("");
    setMemberName("");
    setCertifiedBy("");
    setNotes("");
  }

  function handleClose() {
    resetForm();
    onOpenChange(false);
  }

  const alreadyAwarded =
    certId && memberName
      ? existingAwards.some(
          (a) => a.certId === certId && a.memberName === memberName
        )
      : false;

  function handleSubmit() {
    if (!certId) {
      toast.error(TOAST.MEMBERS.CERT_SELECT_REQUIRED);
      return;
    }
    if (!memberName) {
      toast.error(TOAST.MEMBERS.MEMBER_SELECT_DOT);
      return;
    }
    if (!certifiedBy.trim()) {
      toast.error(TOAST.MEMBERS.CERT_CERTIFIER_REQUIRED);
      return;
    }
    if (alreadyAwarded) {
      toast.error(TOAST.MEMBERS.CERT_DUPLICATE);
      return;
    }

    void executeAward(async () => {
      onSubmit({
        certId,
        memberName,
        certifiedBy: certifiedBy.trim(),
        notes: notes.trim() || undefined,
      });
      resetForm();
    });
  }

  const selectedCert = certs.find((c) => c.id === certId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <Award className="h-4 w-4 text-green-500" aria-hidden="true" />
            기술 인증 수여
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* 인증 선택 */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">
              인증 선택 <span className="text-destructive" aria-hidden="true">*</span>
              <span className="sr-only">(필수)</span>
            </label>
            <Select value={certId} onValueChange={setCertId}>
              <SelectTrigger className="h-8 text-xs" aria-required="true">
                <SelectValue placeholder="인증을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {SKILL_CERT_LEVEL_ORDER.map((level) => {
                  const levelCerts = certs.filter((c) => c.level === level);
                  if (levelCerts.length === 0) return null;
                  const colors = SKILL_CERT_LEVEL_COLORS[level];
                  return levelCerts.map((cert) => (
                    <SelectItem key={cert.id} value={cert.id} className="text-xs">
                      <span className={`font-medium ${colors.text}`}>
                        [{SKILL_CERT_LEVEL_LABELS[level]}]
                      </span>{" "}
                      {cert.skillName}
                    </SelectItem>
                  ));
                })}
              </SelectContent>
            </Select>
            {selectedCert && (
              <div
                className="rounded-md border bg-muted/20 px-2.5 py-1.5 space-y-0.5"
                aria-live="polite"
              >
                <p className="text-[11px] text-muted-foreground">
                  {selectedCert.description}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  카테고리: {selectedCert.category}
                </p>
              </div>
            )}
          </div>

          {/* 멤버 선택 */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">
              멤버 <span className="text-destructive" aria-hidden="true">*</span>
              <span className="sr-only">(필수)</span>
            </label>
            <Select
              value={memberName}
              onValueChange={setMemberName}
              aria-describedby={alreadyAwarded ? duplicateAlertId : undefined}
            >
              <SelectTrigger className="h-8 text-xs" aria-required="true">
                <SelectValue placeholder="멤버를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {memberNames.map((name) => (
                  <SelectItem key={name} value={name} className="text-xs">
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {alreadyAwarded && (
              <p
                id={duplicateAlertId}
                className="text-[11px] text-destructive"
                role="alert"
                aria-live="polite"
              >
                이미 해당 멤버에게 수여된 인증입니다.
              </p>
            )}
          </div>

          {/* 인증자 */}
          <div className="space-y-1">
            <label
              htmlFor={certifiedById}
              className="text-xs text-muted-foreground font-medium"
            >
              인증자 <span className="text-destructive" aria-hidden="true">*</span>
              <span className="sr-only">(필수)</span>
            </label>
            <Input
              id={certifiedById}
              placeholder="인증을 수여하는 사람 이름"
              value={certifiedBy}
              onChange={(e) => setCertifiedBy(e.target.value)}
              className="h-8 text-xs"
              aria-required="true"
            />
          </div>

          {/* 비고 */}
          <div className="space-y-1">
            <label
              htmlFor={notesId}
              className="text-xs text-muted-foreground font-medium"
            >
              비고 (선택)
            </label>
            <Textarea
              id={notesId}
              placeholder="인증 관련 메모나 특이사항"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs min-h-[56px] resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={handleClose}
            disabled={submitting}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSubmit}
            disabled={submitting || !!alreadyAwarded}
            aria-disabled={submitting || !!alreadyAwarded}
          >
            <Award className="h-3 w-3 mr-1" aria-hidden="true" />
            {submitting ? "수여 중..." : "인증 수여"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
