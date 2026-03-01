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
import { Textarea } from "@/components/ui/textarea";
import { Globe, Plus, Trash2 } from "lucide-react";
import type { MediaPressKitEntry } from "@/types";
import type { AddMediaPressKitInput } from "@/hooks/use-media-press-kit";

export type EntryFormState = AddMediaPressKitInput & { attachmentInput: string };

interface EntryDialogProps {
  open: boolean;
  editTarget: MediaPressKitEntry | null;
  form: EntryFormState;
  saving: boolean;
  onFormChange: (form: EntryFormState) => void;
  onAddAttachment: () => void;
  onRemoveAttachment: (idx: number) => void;
  onSave: () => void;
  onClose: () => void;
}

export function EntryDialog({
  open,
  editTarget,
  form,
  saving,
  onFormChange,
  onAddAttachment,
  onRemoveAttachment,
  onSave,
  onClose,
}: EntryDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent
        className="max-w-lg max-h-[90vh] overflow-y-auto"
        aria-describedby="entry-dialog-desc"
      >
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {editTarget ? "보도자료 수정" : "보도자료 추가"}
          </DialogTitle>
        </DialogHeader>
        <p id="entry-dialog-desc" className="sr-only">
          {editTarget
            ? "기존 보도자료의 정보를 수정합니다."
            : "새 보도자료를 추가합니다."}
        </p>

        <div className="space-y-3 py-2">
          {/* 제목 */}
          <div className="space-y-1">
            <Label htmlFor="entry-title" className="text-xs">
              제목 *
            </Label>
            <Input
              id="entry-title"
              value={form.title}
              onChange={(e) =>
                onFormChange({ ...form, title: e.target.value })
              }
              placeholder="보도자료 제목"
              className="h-8 text-sm"
              aria-required="true"
            />
          </div>

          {/* 작성일 */}
          <div className="space-y-1">
            <Label htmlFor="entry-written-at" className="text-xs">
              작성일 *
            </Label>
            <Input
              id="entry-written-at"
              type="date"
              value={form.writtenAt}
              onChange={(e) =>
                onFormChange({ ...form, writtenAt: e.target.value })
              }
              className="h-8 text-sm"
              aria-required="true"
            />
          </div>

          {/* 내용 */}
          <div className="space-y-1">
            <Label htmlFor="entry-content" className="text-xs">
              내용 *
            </Label>
            <Textarea
              id="entry-content"
              value={form.content}
              onChange={(e) =>
                onFormChange({ ...form, content: e.target.value })
              }
              placeholder="보도자료 내용을 입력하세요"
              rows={5}
              className="text-sm resize-none"
              aria-required="true"
            />
          </div>

          {/* 홍보 담당자 */}
          <div className="space-y-1">
            <Label htmlFor="entry-contact-name" className="text-xs">
              홍보 담당자 *
            </Label>
            <Input
              id="entry-contact-name"
              value={form.contactName}
              onChange={(e) =>
                onFormChange({ ...form, contactName: e.target.value })
              }
              placeholder="담당자 이름"
              className="h-8 text-sm"
              aria-required="true"
            />
          </div>

          {/* 이메일 / 전화 */}
          <fieldset>
            <legend className="sr-only">담당자 연락처 (선택)</legend>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="entry-contact-email" className="text-xs">
                  이메일 (선택)
                </Label>
                <Input
                  id="entry-contact-email"
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) =>
                    onFormChange({ ...form, contactEmail: e.target.value })
                  }
                  placeholder="example@email.com"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="entry-contact-phone" className="text-xs">
                  연락처 (선택)
                </Label>
                <Input
                  id="entry-contact-phone"
                  type="tel"
                  value={form.contactPhone}
                  onChange={(e) =>
                    onFormChange({ ...form, contactPhone: e.target.value })
                  }
                  placeholder="010-0000-0000"
                  className="h-8 text-sm"
                />
              </div>
            </div>
          </fieldset>

          {/* 첨부파일 URL */}
          <div className="space-y-1">
            <Label htmlFor="entry-attachment-input" className="text-xs">
              첨부파일 URL (선택)
            </Label>
            <div className="flex gap-2">
              <Input
                id="entry-attachment-input"
                value={form.attachmentInput}
                onChange={(e) =>
                  onFormChange({ ...form, attachmentInput: e.target.value })
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onAddAttachment();
                  }
                }}
                placeholder="https://..."
                className="h-8 text-sm flex-1"
                aria-describedby="attachment-hint"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={onAddAttachment}
                aria-label="첨부파일 URL 추가"
              >
                <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
                추가
              </Button>
            </div>
            <p id="attachment-hint" className="sr-only">
              URL 입력 후 Enter 키 또는 추가 버튼을 누르세요
            </p>
            {(form.attachmentUrls ?? []).length > 0 && (
              <ul
                className="space-y-1 mt-1"
                role="list"
                aria-label="추가된 첨부파일 목록"
              >
                {(form.attachmentUrls ?? []).map((url, idx) => (
                  <li
                    key={idx}
                    role="listitem"
                    className="flex items-center gap-2 bg-gray-50 rounded px-2 py-1"
                  >
                    <Globe className="h-3 w-3 text-gray-400 shrink-0" aria-hidden="true" />
                    <span className="text-[11px] text-gray-600 truncate flex-1">
                      {url}
                    </span>
                    <button
                      onClick={() => onRemoveAttachment(idx)}
                      className="text-gray-300 hover:text-red-400"
                      aria-label={`첨부파일 ${idx + 1} 삭제`}
                    >
                      <Trash2 className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
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
            disabled={
              saving ||
              !form.title.trim() ||
              !form.writtenAt ||
              !form.content.trim() ||
              !form.contactName.trim()
            }
            aria-busy={saving}
          >
            {saving ? "저장 중..." : editTarget ? "수정" : "추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
