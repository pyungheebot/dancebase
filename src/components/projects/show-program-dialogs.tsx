"use client";

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
import { BookOpen, Users, Star } from "lucide-react";
import type { ShowProgramCreditRole } from "@/types";
import { CREDIT_ROLE_LABELS, CREDIT_ROLE_OPTIONS } from "./show-program-rows";

// ============================================================
// 폼 타입 (공유)
// ============================================================

export type BasicInfoForm = {
  showTitle: string;
  showSubtitle: string;
  showDate: string;
  venue: string;
  greeting: string;
  closingMessage: string;
  specialThanks: string;
};

export type PieceForm = {
  title: string;
  subtitle: string;
  choreographer: string;
  performers: string;
  duration: string;
  notes: string;
};

export type CreditForm = {
  role: ShowProgramCreditRole;
  roleLabel: string;
  names: string;
};

export type SponsorForm = {
  name: string;
  tier: string;
  description: string;
};

export function emptyPieceForm(): PieceForm {
  return {
    title: "",
    subtitle: "",
    choreographer: "",
    performers: "",
    duration: "",
    notes: "",
  };
}

export function emptyCreditForm(): CreditForm {
  return { role: "director", roleLabel: "", names: "" };
}

export function emptySponsorForm(): SponsorForm {
  return { name: "", tier: "", description: "" };
}

// ============================================================
// 기본 정보 편집 다이얼로그
// ============================================================

export function BasicInfoDialog({
  open,
  onOpenChange,
  form,
  setForm,
  onSave,
  saving,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: BasicInfoForm;
  setForm: (f: BasicInfoForm) => void;
  onSave: () => void;
  saving: boolean;
}) {
  function set<K extends keyof BasicInfoForm>(key: K, value: BasicInfoForm[K]) {
    setForm({ ...form, [key]: value });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <BookOpen className="h-4 w-4 text-violet-500" />
            공연 기본 정보
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div className="space-y-1">
            <Label className="text-xs">
              공연 제목 <span className="text-destructive">*</span>
            </Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: 봄 정기 공연 2026"
              value={form.showTitle}
              onChange={(e) => set("showTitle", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">부제</Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: 우리들의 이야기"
              value={form.showSubtitle}
              onChange={(e) => set("showSubtitle", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">공연 날짜</Label>
              <Input
                className="h-8 text-xs"
                type="date"
                value={form.showDate}
                onChange={(e) => set("showDate", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">공연 장소</Label>
              <Input
                className="h-8 text-xs"
                placeholder="예: 강남아트센터"
                value={form.venue}
                onChange={(e) => set("venue", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">인사말</Label>
            <Textarea
              className="text-xs min-h-[72px] resize-none"
              placeholder="관객에게 전하는 인사말을 입력하세요."
              value={form.greeting}
              onChange={(e) => set("greeting", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">마무리 인사</Label>
            <Textarea
              className="text-xs min-h-[56px] resize-none"
              placeholder="공연을 마치며 전하는 말을 입력하세요."
              value={form.closingMessage}
              onChange={(e) => set("closingMessage", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">특별 감사</Label>
            <Textarea
              className="text-xs min-h-[56px] resize-none"
              placeholder="특별히 감사한 분들을 입력하세요."
              value={form.specialThanks}
              onChange={(e) => set("specialThanks", e.target.value)}
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
            {saving ? "저장 중..." : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 프로그램 순서 추가/편집 다이얼로그
// ============================================================

export function PieceDialog({
  open,
  onOpenChange,
  form,
  setForm,
  onSave,
  saving,
  isEdit,
  memberNames,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: PieceForm;
  setForm: (f: PieceForm) => void;
  onSave: () => void;
  saving: boolean;
  isEdit: boolean;
  memberNames: string[];
}) {
  function set<K extends keyof PieceForm>(key: K, value: PieceForm[K]) {
    setForm({ ...form, [key]: value });
  }

  function toggleMember(name: string) {
    const current = form.performers
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const next = current.includes(name)
      ? current.filter((n) => n !== name)
      : [...current, name];
    set("performers", next.join(", "));
  }

  const selectedMembers = form.performers
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <BookOpen className="h-4 w-4 text-violet-500" />
            {isEdit ? "프로그램 항목 수정" : "프로그램 순서 추가"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div className="space-y-1">
            <Label className="text-xs">
              작품/곡명 <span className="text-destructive">*</span>
            </Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: Dynamite, 봄날"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">부제</Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: BTS Cover"
              value={form.subtitle}
              onChange={(e) => set("subtitle", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">안무가</Label>
              <Input
                className="h-8 text-xs"
                placeholder="예: 홍길동"
                value={form.choreographer}
                onChange={(e) => set("choreographer", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">소요 시간</Label>
              <Input
                className="h-8 text-xs"
                placeholder="예: 3분 30초"
                value={form.duration}
                onChange={(e) => set("duration", e.target.value)}
              />
            </div>
          </div>

          {/* 출연자 선택 */}
          {memberNames.length > 0 ? (
            <div className="space-y-1">
              <Label className="text-xs">출연자 (다중 선택)</Label>
              <div className="flex flex-wrap gap-1 p-2 rounded-md border bg-muted/30 min-h-[40px]">
                {memberNames.map((name) => {
                  const selected = selectedMembers.includes(name);
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => toggleMember(name)}
                      className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                        selected
                          ? "bg-violet-100 border-violet-400 text-violet-800 font-semibold"
                          : "bg-background border-border text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
              {selectedMembers.length > 0 && (
                <p className="text-[10px] text-muted-foreground">
                  선택됨: {selectedMembers.join(", ")}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              <Label className="text-xs">출연자</Label>
              <Input
                className="h-8 text-xs"
                placeholder="예: 홍길동, 김철수 (쉼표로 구분)"
                value={form.performers}
                onChange={(e) => set("performers", e.target.value)}
              />
            </div>
          )}

          <div className="space-y-1">
            <Label className="text-xs">메모</Label>
            <Textarea
              className="text-xs min-h-[48px] resize-none"
              placeholder="추가 메모 (예: 앙코르 전 인사 포함)"
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
}

// ============================================================
// 크레딧 추가/편집 다이얼로그
// ============================================================

export function CreditDialog({
  open,
  onOpenChange,
  form,
  setForm,
  onSave,
  saving,
  isEdit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: CreditForm;
  setForm: (f: CreditForm) => void;
  onSave: () => void;
  saving: boolean;
  isEdit: boolean;
}) {
  function set<K extends keyof CreditForm>(key: K, value: CreditForm[K]) {
    setForm({ ...form, [key]: value });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-violet-500" />
            {isEdit ? "크레딧 수정" : "크레딧 추가"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div className="space-y-1">
            <Label className="text-xs">
              역할 <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.role}
              onValueChange={(v) => set("role", v as ShowProgramCreditRole)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="역할 선택" />
              </SelectTrigger>
              <SelectContent>
                {CREDIT_ROLE_OPTIONS.map((r) => (
                  <SelectItem key={r} value={r} className="text-xs">
                    {CREDIT_ROLE_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {form.role === "other" && (
            <div className="space-y-1">
              <Label className="text-xs">역할 이름</Label>
              <Input
                className="h-8 text-xs"
                placeholder="예: 진행, 통역"
                value={form.roleLabel}
                onChange={(e) => set("roleLabel", e.target.value)}
              />
            </div>
          )}

          <div className="space-y-1">
            <Label className="text-xs">
              담당자 <span className="text-destructive">*</span>
            </Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: 홍길동, 김철수 (쉼표로 구분)"
              value={form.names}
              onChange={(e) => set("names", e.target.value)}
            />
            <p className="text-[10px] text-muted-foreground">
              여러 명은 쉼표로 구분하세요.
            </p>
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
}

// ============================================================
// 스폰서 추가/편집 다이얼로그
// ============================================================

export function SponsorDialog({
  open,
  onOpenChange,
  form,
  setForm,
  onSave,
  saving,
  isEdit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: SponsorForm;
  setForm: (f: SponsorForm) => void;
  onSave: () => void;
  saving: boolean;
  isEdit: boolean;
}) {
  function set<K extends keyof SponsorForm>(key: K, value: SponsorForm[K]) {
    setForm({ ...form, [key]: value });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Star className="h-4 w-4 text-green-500" />
            {isEdit ? "스폰서 수정" : "스폰서 추가"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div className="space-y-1">
            <Label className="text-xs">
              스폰서명 <span className="text-destructive">*</span>
            </Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: ○○문화재단"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">등급</Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: 골드, 실버, 브론즈"
              value={form.tier}
              onChange={(e) => set("tier", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">설명</Label>
            <Textarea
              className="text-xs min-h-[48px] resize-none"
              placeholder="스폰서 관련 추가 정보"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
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
}
