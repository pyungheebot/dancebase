"use client";

// ============================================
// dance-networking/contact-form.tsx
// 연락처 추가/수정 폼 (SnsRow, GenreInput 포함)
// ============================================

import { useState } from "react";
import { Plus, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import {
  ROLE_OPTIONS,
  SNS_PLATFORM_OPTIONS,
} from "@/hooks/use-dance-networking";
import type { DanceNetworkingRole, DanceNetworkingSns } from "@/types";
import type { NetworkingFormState } from "./types";

// ============================================
// SNS 입력 행
// ============================================

function SnsRow({
  item,
  index,
  onChange,
  onRemove,
}: {
  item: DanceNetworkingSns;
  index: number;
  onChange: (updated: DanceNetworkingSns) => void;
  onRemove: () => void;
}) {
  const snsId = `sns-handle-${index}`;
  return (
    <div className="flex gap-1 items-center" role="group" aria-label={`SNS 계정 ${index + 1}`}>
      <Select
        value={item.platform}
        onValueChange={(v) =>
          onChange({ ...item, platform: v as DanceNetworkingSns["platform"] })
        }
      >
        <SelectTrigger className="h-7 text-xs w-28 shrink-0" aria-label="SNS 플랫폼 선택">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SNS_PLATFORM_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value} className="text-xs">
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <label htmlFor={snsId} className="sr-only">
        {SNS_PLATFORM_OPTIONS.find((o) => o.value === item.platform)?.label ?? "SNS"} 아이디 또는 URL
      </label>
      <Input
        id={snsId}
        className="h-7 text-xs flex-1"
        placeholder="@아이디 또는 URL"
        value={item.handle}
        onChange={(e) => onChange({ ...item, handle: e.target.value })}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 text-gray-400 hover:text-red-500"
        onClick={onRemove}
        aria-label="SNS 계정 삭제"
      >
        <X className="h-3 w-3" aria-hidden="true" />
      </Button>
    </div>
  );
}

// ============================================
// 장르 태그 입력
// ============================================

function GenreInput({
  genres,
  onChange,
}: {
  genres: string[];
  onChange: (genres: string[]) => void;
}) {
  const [inputVal, setInputVal] = useState("");
  const genreInputId = "genre-input";

  function addGenre() {
    const trimmed = inputVal.trim();
    if (!trimmed) return;
    if (genres.includes(trimmed)) {
      toast.error(TOAST.MEMBERS.NETWORKING_GENRE_DUPLICATE);
      return;
    }
    onChange([...genres, trimmed]);
    setInputVal("");
  }

  function removeGenre(genre: string) {
    onChange(genres.filter((g) => g !== genre));
  }

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        <label htmlFor={genreInputId} className="sr-only">
          장르 입력
        </label>
        <Input
          id={genreInputId}
          className="h-7 text-xs flex-1"
          placeholder="장르 입력 후 Enter (예: 팝핀, 힙합)"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addGenre();
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={addGenre}
          aria-label="장르 추가"
        >
          추가
        </Button>
      </div>
      {genres.length > 0 && (
        <div
          className="flex flex-wrap gap-1"
          role="list"
          aria-label="추가된 장르 목록"
        >
          {genres.map((g) => (
            <Badge
              key={g}
              role="listitem"
              variant="secondary"
              className="text-[10px] px-1.5 py-0 gap-0.5 cursor-pointer hover:bg-red-100 hover:text-red-600"
              onClick={() => removeGenre(g)}
              aria-label={`${g} 장르 삭제`}
            >
              {g}
              <X className="h-2.5 w-2.5 ml-0.5" aria-hidden="true" />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// 연락처 폼
// ============================================

export function ContactForm({
  initial,
  formId,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  initial: NetworkingFormState;
  formId: string;
  onSubmit: (form: NetworkingFormState) => void;
  onCancel: () => void;
  submitLabel: string;
}) {
  const [form, setForm] = useState<NetworkingFormState>(initial);

  function set<K extends keyof NetworkingFormState>(
    key: K,
    value: NetworkingFormState[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSnsChange(idx: number, updated: DanceNetworkingSns) {
    const next = [...form.snsAccounts];
    next[idx] = updated;
    set("snsAccounts", next);
  }

  function handleSnsRemove(idx: number) {
    set(
      "snsAccounts",
      form.snsAccounts.filter((_, i) => i !== idx)
    );
  }

  function handleAddSns() {
    set("snsAccounts", [
      ...form.snsAccounts,
      { platform: "instagram", handle: "" },
    ]);
  }

  function handleSubmit() {
    if (!form.name.trim()) {
      toast.error(TOAST.MEMBERS.NETWORKING_NAME_REQUIRED);
      return;
    }
    onSubmit(form);
  }

  const nameId = `${formId}-name`;
  const affiliationId = `${formId}-affiliation`;
  const roleId = `${formId}-role`;
  const phoneId = `${formId}-phone`;
  const emailId = `${formId}-email`;
  const metAtId = `${formId}-met-at`;
  const metDateId = `${formId}-met-date`;
  const notesId = `${formId}-notes`;

  return (
    <div className="space-y-3 pt-2" role="form" aria-label={`${submitLabel} 연락처 폼`}>
      {/* 이름 + 역할 */}
      <div className="flex gap-2">
        <div className="flex-1 space-y-1">
          <label
            htmlFor={nameId}
            className="text-[10px] font-medium text-gray-500"
          >
            이름 <span aria-hidden="true">*</span>
            <span className="sr-only">(필수)</span>
          </label>
          <Input
            id={nameId}
            className="h-7 text-xs"
            placeholder="홍길동"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            required
            aria-required="true"
          />
        </div>
        <div className="w-32 space-y-1">
          <label
            htmlFor={roleId}
            className="text-[10px] font-medium text-gray-500"
          >
            관계
          </label>
          <Select
            value={form.role}
            onValueChange={(v) => set("role", v as DanceNetworkingRole)}
          >
            <SelectTrigger id={roleId} className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLE_OPTIONS.map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                  className="text-xs"
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 소속 */}
      <div className="space-y-1">
        <label
          htmlFor={affiliationId}
          className="text-[10px] font-medium text-gray-500"
        >
          소속 (팀/스튜디오)
        </label>
        <Input
          id={affiliationId}
          className="h-7 text-xs"
          placeholder="소속 팀 또는 스튜디오"
          value={form.affiliation}
          onChange={(e) => set("affiliation", e.target.value)}
        />
      </div>

      {/* 전문 장르 */}
      <div className="space-y-1">
        <p className="text-[10px] font-medium text-gray-500" id={`${formId}-genre-label`}>
          전문 장르
        </p>
        <GenreInput genres={form.genres} onChange={(g) => set("genres", g)} />
      </div>

      {/* 연락처 */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label
            htmlFor={phoneId}
            className="text-[10px] font-medium text-gray-500"
          >
            전화번호
          </label>
          <Input
            id={phoneId}
            type="tel"
            className="h-7 text-xs"
            placeholder="010-0000-0000"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label
            htmlFor={emailId}
            className="text-[10px] font-medium text-gray-500"
          >
            이메일
          </label>
          <Input
            id={emailId}
            type="email"
            className="h-7 text-xs"
            placeholder="example@email.com"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
          />
        </div>
      </div>

      {/* SNS */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <p
            className="text-[10px] font-medium text-gray-500"
            id={`${formId}-sns-label`}
          >
            SNS 계정
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 text-[10px] text-blue-600 hover:text-blue-700 px-1.5"
            onClick={handleAddSns}
            aria-label="SNS 계정 추가"
          >
            <Plus className="h-3 w-3 mr-0.5" aria-hidden="true" />
            추가
          </Button>
        </div>
        <div
          className="space-y-1"
          role="list"
          aria-labelledby={`${formId}-sns-label`}
          aria-label="SNS 계정 목록"
        >
          {form.snsAccounts.map((sns, idx) => (
            <div role="listitem" key={idx}>
              <SnsRow
                item={sns}
                index={idx}
                onChange={(updated) => handleSnsChange(idx, updated)}
                onRemove={() => handleSnsRemove(idx)}
              />
            </div>
          ))}
          {form.snsAccounts.length === 0 && (
            <p className="text-[10px] text-gray-400 italic" aria-live="polite">
              SNS 계정이 없습니다.
            </p>
          )}
        </div>
      </div>

      {/* 만남 정보 */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label
            htmlFor={metAtId}
            className="text-[10px] font-medium text-gray-500"
          >
            만남 장소
          </label>
          <Input
            id={metAtId}
            className="h-7 text-xs"
            placeholder="공연장, 스튜디오 등"
            value={form.metAt}
            onChange={(e) => set("metAt", e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label
            htmlFor={metDateId}
            className="text-[10px] font-medium text-gray-500"
          >
            만난 날짜
          </label>
          <Input
            id={metDateId}
            type="date"
            className="h-7 text-xs"
            value={form.metDate}
            onChange={(e) => set("metDate", e.target.value)}
          />
        </div>
      </div>

      {/* 메모 */}
      <div className="space-y-1">
        <label
          htmlFor={notesId}
          className="text-[10px] font-medium text-gray-500"
        >
          메모
        </label>
        <Textarea
          id={notesId}
          className="text-xs min-h-[56px] resize-none"
          placeholder="특이사항, 협업 경험, 인상 등..."
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
        />
      </div>

      {/* 버튼 */}
      <div className="flex gap-2 pt-1">
        <Button
          size="sm"
          className="h-7 text-xs flex-1"
          onClick={handleSubmit}
        >
          <Check className="h-3 w-3 mr-1" aria-hidden="true" />
          {submitLabel}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={onCancel}
        >
          취소
        </Button>
      </div>
    </div>
  );
}
