"use client";

import { useState, useCallback, useId } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import {
  ALL_TRAITS,
  GENRE_SUGGESTIONS,
  STRENGTH_TAGS,
  WEAKNESS_TAGS,
} from "@/hooks/use-dance-style-analysis";
import type { DanceStyleTrait } from "@/types";
import { RadarChart } from "./radar-chart";
import { TraitSlider } from "./trait-controls";
import { TagInput } from "./tag-input";
import { type SnapshotFormState, makeDefaultForm } from "./types";

// ============================================================
// 스냅샷 추가/수정 다이얼로그
// ============================================================

type SnapshotDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (form: SnapshotFormState) => void;
  initialData?: SnapshotFormState;
  title: string;
};

export function SnapshotDialog({
  open,
  onClose,
  onSubmit,
  initialData,
  title,
}: SnapshotDialogProps) {
  const [form, setForm] = useState<SnapshotFormState>(
    initialData ?? makeDefaultForm()
  );

  const dateInputId = useId();
  const notesId = useId();
  const traitSectionId = useId();

  const resetForm = useCallback(() => {
    setForm(initialData ?? makeDefaultForm());
  }, [initialData]);

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      onClose();
      resetForm();
    }
  }

  function handleSubmit() {
    if (form.primaryGenres.length === 0) {
      toast.error(TOAST.MEMBERS.STYLE_ANALYSIS_GENRE_REQUIRED);
      return;
    }
    onSubmit(form);
    onClose();
    setForm(makeDefaultForm());
  }

  function setTrait(trait: DanceStyleTrait, score: number) {
    setForm((prev) => ({
      ...prev,
      traitScores: { ...prev.traitScores, [trait]: score },
    }));
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-lg max-h-[90vh] overflow-y-auto"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle className="text-sm">{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* 날짜 */}
          <div className="space-y-1">
            <Label htmlFor={dateInputId} className="text-xs">
              분석 날짜
            </Label>
            <Input
              id={dateInputId}
              type="date"
              value={form.date}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, date: e.target.value }))
              }
              className="h-7 text-xs"
            />
          </div>

          {/* 주력 장르 */}
          <TagInput
            label="주력 장르"
            tags={form.primaryGenres}
            suggestions={GENRE_SUGGESTIONS.filter(
              (g) => !form.secondaryGenres.includes(g)
            )}
            onAdd={(g) =>
              setForm((prev) => ({
                ...prev,
                primaryGenres: [...prev.primaryGenres, g],
              }))
            }
            onRemove={(g) =>
              setForm((prev) => ({
                ...prev,
                primaryGenres: prev.primaryGenres.filter((x) => x !== g),
              }))
            }
            placeholder="예: 힙합, 팝핑..."
          />

          {/* 부력 장르 */}
          <TagInput
            label="부력 장르"
            tags={form.secondaryGenres}
            suggestions={GENRE_SUGGESTIONS.filter(
              (g) => !form.primaryGenres.includes(g)
            )}
            onAdd={(g) =>
              setForm((prev) => ({
                ...prev,
                secondaryGenres: [...prev.secondaryGenres, g],
              }))
            }
            onRemove={(g) =>
              setForm((prev) => ({
                ...prev,
                secondaryGenres: prev.secondaryGenres.filter((x) => x !== g),
              }))
            }
            placeholder="예: 왁킹, 하우스..."
          />

          {/* 강점 */}
          <TagInput
            label="강점"
            tags={form.strengths}
            suggestions={STRENGTH_TAGS}
            onAdd={(t) =>
              setForm((prev) => ({
                ...prev,
                strengths: [...prev.strengths, t],
              }))
            }
            onRemove={(t) =>
              setForm((prev) => ({
                ...prev,
                strengths: prev.strengths.filter((x) => x !== t),
              }))
            }
            placeholder="강점 입력..."
          />

          {/* 약점 */}
          <TagInput
            label="약점"
            tags={form.weaknesses}
            suggestions={WEAKNESS_TAGS}
            onAdd={(t) =>
              setForm((prev) => ({
                ...prev,
                weaknesses: [...prev.weaknesses, t],
              }))
            }
            onRemove={(t) =>
              setForm((prev) => ({
                ...prev,
                weaknesses: prev.weaknesses.filter((x) => x !== t),
              }))
            }
            placeholder="약점 입력..."
          />

          {/* 특성 점수 + 미리보기 레이더 */}
          <div className="space-y-2" aria-labelledby={traitSectionId}>
            <Label id={traitSectionId} className="text-xs">
              특성 점수 (1-10)
            </Label>
            <div className="flex gap-4">
              {/* 슬라이더 */}
              <div className="flex-1 space-y-2">
                {ALL_TRAITS.map((trait) => (
                  <TraitSlider
                    key={trait}
                    trait={trait}
                    value={form.traitScores[trait]}
                    onChange={(v) => setTrait(trait, v)}
                  />
                ))}
              </div>
              {/* 레이더 미리보기 */}
              <div
                className="flex items-center justify-center"
                aria-hidden="true"
              >
                <RadarChart scores={form.traitScores} size={140} />
              </div>
            </div>
          </div>

          {/* 노트 */}
          <div className="space-y-1">
            <Label htmlFor={notesId} className="text-xs">
              스타일 노트 / 코멘트
            </Label>
            <Textarea
              id={notesId}
              value={form.notes}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="현재 댄스 스타일, 개선 방향, 특이사항 등을 자유롭게 작성하세요..."
              className="text-xs min-h-[72px] resize-none"
            />
          </div>

          {/* 버튼 */}
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                onClose();
                setForm(makeDefaultForm());
              }}
            >
              취소
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-7 text-xs"
              onClick={handleSubmit}
            >
              저장
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
