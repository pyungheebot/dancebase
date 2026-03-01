"use client";

import { useState } from "react";
import { useAsyncAction } from "@/hooks/use-async-action";
import { useAuth } from "@/hooks/use-auth";
import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import { invalidateMemberNote } from "@/lib/swr/invalidate";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StickyNote } from "lucide-react";
import { toast } from "sonner";
import type { MemberNote } from "@/types";

type MemberNotePopoverProps = {
  groupId: string;
  targetUserId: string;
  targetName: string;
};

export function MemberNotePopover({
  groupId,
  targetUserId,
  targetName,
}: MemberNotePopoverProps) {
  const supabase = createClient();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const { pending: saving, execute: executeSave } = useAsyncAction();
  const { pending: deleting, execute: executeDelete } = useAsyncAction();

  const { data: note, isLoading } = useSWR<MemberNote | null>(
    swrKeys.memberNote(groupId, targetUserId),
    async () => {
      const { data, error } = await supabase
        .from("member_notes")
        .select("*")
        .eq("group_id", groupId)
        .eq("target_user_id", targetUserId)
        .maybeSingle();
      if (error) return null;
      return data;
    }
  );

  const hasNote = !!note;

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      setDraft(note?.content ?? "");
    }
  };

  const handleSave = async () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    await executeSave(async () => {
      if (!user) {
        toast.error("인증 정보를 확인할 수 없습니다");
        return;
      }

      const { error } = await supabase.from("member_notes").upsert(
        {
          group_id: groupId,
          target_user_id: targetUserId,
          author_id: user.id,
          content: trimmed,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "group_id,target_user_id,author_id" }
      );

      if (error) {
        toast.error("메모 저장에 실패했습니다");
        return;
      }

      toast.success("메모가 저장되었습니다");
      invalidateMemberNote(groupId, targetUserId);
      setOpen(false);
    });
  };

  const handleDelete = async () => {
    if (!note) return;
    await executeDelete(async () => {
      const { error } = await supabase
        .from("member_notes")
        .delete()
        .eq("id", note.id);

      if (error) {
        toast.error("메모 삭제에 실패했습니다");
        return;
      }

      toast.success("메모가 삭제되었습니다");
      invalidateMemberNote(groupId, targetUserId);
      setDraft("");
      setOpen(false);
    });
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          className={`shrink-0 transition-colors ${
            hasNote
              ? "text-yellow-500 hover:text-yellow-600"
              : "text-muted-foreground hover:text-foreground"
          }`}
          aria-label={`${targetName} 메모`}
          title={hasNote ? "메모 있음 - 클릭하여 편집" : "메모 추가"}
        >
          <StickyNote className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="end">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-foreground">
            {targetName} 메모
          </p>
          <p className="text-[11px] text-muted-foreground">
            이 메모는 본인에게만 보입니다.
          </p>
          {isLoading ? (
            <div className="h-20 flex items-center justify-center">
              <span className="text-xs text-muted-foreground">불러오는 중...</span>
            </div>
          ) : (
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="멤버에 대한 메모를 입력하세요..."
              className="text-xs resize-none h-24"
              maxLength={500}
            />
          )}
          <div className="flex items-center justify-between gap-2">
            {hasNote && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-destructive hover:text-destructive px-2"
                onClick={handleDelete}
                disabled={deleting || saving}
              >
                {deleting ? "삭제 중..." : "삭제"}
              </Button>
            )}
            <div className="flex items-center gap-1 ml-auto">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs px-2"
                onClick={() => setOpen(false)}
                disabled={saving || deleting}
              >
                취소
              </Button>
              <Button
                size="sm"
                className="h-7 text-xs px-2"
                onClick={handleSave}
                disabled={!draft.trim() || saving || deleting || isLoading}
              >
                {saving ? "저장 중..." : "저장"}
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
