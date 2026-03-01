"use client";

import { useState } from "react";
import { Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface DanceStyleBioSectionProps {
  bio: string;
  onSave: (bio: string) => Promise<void>;
}

export function DanceStyleBioSection({ bio, onSave }: DanceStyleBioSectionProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  function startEdit() {
    setDraft(bio);
    setEditing(true);
  }

  async function handleSave() {
    try {
      await onSave(draft);
      toast.success(TOAST.MEMBERS.PERSONALITY_SAVED);
      setEditing(false);
    } catch {
      toast.error(TOAST.SAVE_ERROR);
    }
  }

  return (
    <section aria-labelledby="section-bio" className="space-y-2">
      <div className="flex items-center justify-between">
        <span
          id="section-bio"
          className="text-xs font-medium text-muted-foreground"
        >
          한줄 자기소개
        </span>
        {!editing && (
          <Button
            size="sm"
            variant="ghost"
            className="h-6 text-[10px] px-1.5"
            onClick={startEdit}
            aria-label="자기소개 편집"
          >
            <Pencil className="h-2.5 w-2.5 mr-0.5" aria-hidden="true" />
            편집
          </Button>
        )}
      </div>

      {editing ? (
        <div className="space-y-1.5">
          <Textarea
            id="bio-edit-textarea"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="춤에 대한 한줄 소개를 입력하세요."
            className="text-xs min-h-[60px] resize-none"
            aria-label="자기소개 입력"
            aria-multiline="true"
          />
          <div className="flex justify-end gap-1.5">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => setEditing(false)}
            >
              <X className="h-3 w-3 mr-1" aria-hidden="true" />
              취소
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={handleSave}>
              <Check className="h-3 w-3 mr-1" aria-hidden="true" />
              저장
            </Button>
          </div>
        </div>
      ) : bio ? (
        <p
          className="text-xs text-muted-foreground leading-relaxed bg-muted/30 rounded-md px-3 py-2"
          aria-live="polite"
        >
          {bio}
        </p>
      ) : (
        <button
          type="button"
          onClick={startEdit}
          className="w-full text-[11px] text-muted-foreground text-center py-2 border border-dashed rounded-md hover:border-indigo-300 hover:text-indigo-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="자기소개 추가하기"
        >
          + 자기소개 추가
        </button>
      )}
    </section>
  );
}
