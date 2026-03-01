"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useAsyncAction } from "@/hooks/use-async-action";
import { SectionNoteRow } from "./section-note-row";
import type { SectionDraft } from "./types";
import type { ChoreoSectionNote } from "@/types";

// ============================================
// 버전 추가 폼
// ============================================

export interface AddVersionFormProps {
  onAdd: (payload: {
    label: string;
    description: string;
    sections: Omit<ChoreoSectionNote, "changed">[];
    createdBy: string;
  }) => boolean;
  onClose: () => void;
}

export function AddVersionForm({ onAdd, onClose }: AddVersionFormProps) {
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [createdBy, setCreatedBy] = useState("");
  const [sections, setSections] = useState<SectionDraft[]>([
    { id: crypto.randomUUID(), sectionName: "", content: "" },
  ]);
  const { pending: submitting, execute } = useAsyncAction();

  const labelId = "add-version-label";
  const descId = "add-version-description";
  const createdById = "add-version-created-by";
  const formId = "add-version-form";

  function handleAddSection() {
    if (sections.length >= 20) {
      toast.error(TOAST.CHOREO_VERSION.SECTION_MAX);
      return;
    }
    setSections((prev) => [
      ...prev,
      { id: crypto.randomUUID(), sectionName: "", content: "" },
    ]);
  }

  function handleSectionChange(id: string, patch: Partial<Omit<SectionDraft, "id">>) {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
    );
  }

  function handleSectionDelete(id: string) {
    setSections((prev) => prev.filter((s) => s.id !== id));
  }

  async function handleSubmit() {
    if (!label.trim()) {
      toast.error(TOAST.CHOREO_VERSION.LABEL_REQUIRED);
      return;
    }
    const validSections = sections.filter((s) => s.sectionName.trim());
    await execute(async () => {
      const ok = onAdd({
        label,
        description,
        sections: validSections.map(({ sectionName, content }) => ({
          sectionName,
          content,
        })),
        createdBy,
      });
      if (ok) {
        toast.success(TOAST.CHOREO_VERSION.VERSION_ADDED);
        onClose();
      } else {
        toast.error(TOAST.CHOREO_VERSION.VERSION_MAX);
      }
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleSubmit();
    if (e.key === "Escape") onClose();
  }

  return (
    <section
      id={formId}
      aria-label="새 버전 추가 폼"
      className="border rounded-md p-3 space-y-3 bg-muted/30 mt-2"
    >
      <p className="text-xs font-medium text-muted-foreground" aria-live="polite">
        새 버전 추가
      </p>

      {/* 라벨 */}
      <div>
        <Label htmlFor={labelId} className="text-[10px] text-muted-foreground mb-0.5 block">
          버전 라벨 <span aria-hidden="true">*</span>
          <span className="sr-only">(필수)</span>
        </Label>
        <Input
          id={labelId}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="예: 초안, 수정본, 최종본, v2"
          className="h-7 text-xs"
          autoFocus
          required
          aria-required="true"
          aria-describedby={`${labelId}-hint`}
        />
        <span id={`${labelId}-hint`} className="sr-only">
          버전을 구분하는 이름을 입력하세요
        </span>
      </div>

      {/* 변경사항 설명 */}
      <div>
        <Label htmlFor={descId} className="text-[10px] text-muted-foreground mb-0.5 block">
          주요 변경사항
        </Label>
        <Textarea
          id={descId}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="이 버전에서 달라진 점을 적어주세요"
          className="text-xs resize-none min-h-[56px]"
        />
      </div>

      {/* 수정자 */}
      <div>
        <Label htmlFor={createdById} className="text-[10px] text-muted-foreground mb-0.5 block">
          수정자
        </Label>
        <Input
          id={createdById}
          value={createdBy}
          onChange={(e) => setCreatedBy(e.target.value)}
          placeholder="이름 또는 닉네임 (선택)"
          className="h-7 text-xs"
        />
      </div>

      {/* 섹션별 노트 */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">구간별 노트</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[10px] text-muted-foreground gap-0.5"
            onClick={handleAddSection}
            aria-label="구간 추가"
          >
            <Plus className="h-3 w-3" aria-hidden="true" />
            구간 추가
          </Button>
        </div>
        <div role="list" aria-label="구간별 노트 목록">
          {sections.map((sec, idx) => (
            <SectionNoteRow
              key={sec.id}
              section={sec}
              index={idx}
              onChange={(patch) => handleSectionChange(sec.id, patch)}
              onDelete={() => handleSectionDelete(sec.id)}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-1.5 pt-1">
        <Button
          size="sm"
          className="h-7 text-xs flex-1"
          onClick={handleSubmit}
          disabled={submitting || !label.trim()}
          aria-disabled={submitting || !label.trim()}
        >
          <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
          추가
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={onClose}
        >
          취소
        </Button>
      </div>
    </section>
  );
}
