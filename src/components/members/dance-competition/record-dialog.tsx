"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  COMPETITION_TEAM_OR_SOLO_LABELS,
  SUGGESTED_COMPETITION_GENRES,
  SUGGESTED_PLACEMENTS,
} from "@/hooks/use-dance-competition";
import type { FormState } from "./types";

// ============================================================
// 기록 다이얼로그 (추가/수정)
// ============================================================

interface RecordDialogProps {
  open: boolean;
  initial: FormState;
  onClose: () => void;
  onSave: (form: FormState) => void;
}

export function RecordDialog({
  open,
  initial,
  onClose,
  onSave,
}: RecordDialogProps) {
  const [form, setForm] = useState<FormState>(initial);

  // open 상태가 바뀔 때 폼 초기화
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setForm(initial);
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit() {
    if (!form.competitionName.trim()) {
      toast.error(TOAST.MEMBERS.COMPETITION_TITLE_REQUIRED);
      return;
    }
    if (!form.date) {
      toast.error(TOAST.MEMBERS.COMPETITION_DATE_REQUIRED);
      return;
    }
    onSave(form);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") onClose();
  }

  if (!open) return null;

  const isEdit = Boolean(initial.competitionName);
  const dialogTitle = isEdit ? "대회 기록 수정" : "대회 기록 추가";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={dialogTitle}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={handleKeyDown}
    >
      <div className="w-full max-w-lg rounded-lg bg-background shadow-xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 id="record-dialog-title" className="text-sm font-semibold">
            {dialogTitle}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted"
            aria-label="닫기"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* 본문 */}
        <div className="max-h-[70vh] overflow-y-auto px-4 py-4 space-y-3">
          {/* 대회명 */}
          <div className="space-y-1">
            <label
              htmlFor="competition-name"
              className="text-xs font-medium text-muted-foreground"
            >
              대회명 <span className="text-red-500" aria-hidden="true">*</span>
              <span className="sr-only">(필수)</span>
            </label>
            <Input
              id="competition-name"
              className="h-8 text-xs"
              placeholder="예) 2024 전국댄스컴피티션"
              value={form.competitionName}
              onChange={(e) => set("competitionName", e.target.value)}
              aria-required="true"
            />
          </div>

          {/* 날짜 / 장소 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label
                htmlFor="competition-date"
                className="text-xs font-medium text-muted-foreground"
              >
                날짜 <span className="text-red-500" aria-hidden="true">*</span>
                <span className="sr-only">(필수)</span>
              </label>
              <Input
                id="competition-date"
                type="date"
                className="h-8 text-xs"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
                aria-required="true"
              />
            </div>
            <div className="space-y-1">
              <label
                htmlFor="competition-location"
                className="text-xs font-medium text-muted-foreground"
              >
                장소
              </label>
              <Input
                id="competition-location"
                className="h-8 text-xs"
                placeholder="예) 올림픽공원"
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
              />
            </div>
          </div>

          {/* 참가 유형 */}
          <fieldset className="space-y-1">
            <legend className="text-xs font-medium text-muted-foreground">
              참가 유형
            </legend>
            <div
              role="radiogroup"
              aria-label="참가 유형 선택"
              className="flex gap-2"
            >
              {(["solo", "team", "duo"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  role="radio"
                  aria-checked={form.teamOrSolo === type}
                  onClick={() => set("teamOrSolo", type)}
                  className={`rounded-md border px-3 py-1 text-xs transition-colors ${
                    form.teamOrSolo === type
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {COMPETITION_TEAM_OR_SOLO_LABELS[type]}
                </button>
              ))}
            </div>
          </fieldset>

          {/* 팀명 (팀/듀오 선택 시) */}
          {form.teamOrSolo !== "solo" && (
            <div className="space-y-1">
              <label
                htmlFor="competition-team-name"
                className="text-xs font-medium text-muted-foreground"
              >
                팀명
              </label>
              <Input
                id="competition-team-name"
                className="h-8 text-xs"
                placeholder="예) 크루 네온"
                value={form.teamName}
                onChange={(e) => set("teamName", e.target.value)}
              />
            </div>
          )}

          {/* 장르 / 부문 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label
                htmlFor="competition-genre"
                className="text-xs font-medium text-muted-foreground"
              >
                장르
              </label>
              <Input
                id="competition-genre"
                className="h-8 text-xs"
                placeholder="예) 힙합"
                value={form.genre}
                onChange={(e) => set("genre", e.target.value)}
                list="competition-genres"
              />
              <datalist id="competition-genres">
                {SUGGESTED_COMPETITION_GENRES.map((g) => (
                  <option key={g} value={g} />
                ))}
              </datalist>
            </div>
            <div className="space-y-1">
              <label
                htmlFor="competition-category"
                className="text-xs font-medium text-muted-foreground"
              >
                부문/카테고리
              </label>
              <Input
                id="competition-category"
                className="h-8 text-xs"
                placeholder="예) 오픈부, 고등부"
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
              />
            </div>
          </div>

          {/* 결과 */}
          <div className="space-y-1">
            <label
              htmlFor="competition-placement"
              className="text-xs font-medium text-muted-foreground"
            >
              결과/순위
            </label>
            <Input
              id="competition-placement"
              className="h-8 text-xs"
              placeholder="예) 1위, 결선진출, 예선탈락"
              value={form.placement}
              onChange={(e) => set("placement", e.target.value)}
              list="competition-placements"
            />
            <datalist id="competition-placements">
              {SUGGESTED_PLACEMENTS.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
            {/* 빠른 선택 */}
            <div
              role="group"
              aria-label="결과 빠른 선택"
              className="flex flex-wrap gap-1 pt-1"
            >
              {SUGGESTED_PLACEMENTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  aria-pressed={form.placement === p}
                  onClick={() => set("placement", p)}
                  className={`rounded-full border px-2 py-0.5 text-[10px] transition-colors ${
                    form.placement === p
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* 수상 증명서 URL */}
          <div className="space-y-1">
            <label
              htmlFor="competition-certificate-url"
              className="text-xs font-medium text-muted-foreground"
            >
              수상 증명서 URL (선택)
            </label>
            <Input
              id="competition-certificate-url"
              className="h-8 text-xs"
              placeholder="https://..."
              value={form.certificateUrl}
              onChange={(e) => set("certificateUrl", e.target.value)}
              type="url"
            />
          </div>

          {/* 메모 */}
          <div className="space-y-1">
            <label
              htmlFor="competition-notes"
              className="text-xs font-medium text-muted-foreground"
            >
              메모
            </label>
            <Textarea
              id="competition-notes"
              className="min-h-[60px] text-xs resize-none"
              placeholder="대회 소감, 준비 과정, 기억할 내용..."
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex justify-end gap-2 border-t px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={onClose}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            {isEdit ? "수정" : "추가"}
          </Button>
        </div>
      </div>
    </div>
  );
}
