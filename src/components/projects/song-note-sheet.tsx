"use client";

import { useState } from "react";
import { useSongNotes } from "@/hooks/use-song-notes";
import { createClient } from "@/lib/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StickyNote, Plus, Trash2, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import useSWR from "swr";

interface SongNoteSheetProps {
  songId: string;
  songTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function useCurrentUserId() {
  const { data } = useSWR("current-user-id", async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id ?? null;
  });
  return data ?? null;
}

export function SongNoteSheet({
  songId,
  songTitle,
  open,
  onOpenChange,
}: SongNoteSheetProps) {
  const { notes, loading, addNote, deleteNote } = useSongNotes(songId);
  const currentUserId = useCurrentUserId();
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleAdd() {
    if (!content.trim()) return;
    setSubmitting(true);
    const ok = await addNote(content);
    if (ok) {
      setContent("");
    }
    setSubmitting(false);
  }

  async function handleDelete(noteId: string) {
    setDeletingId(noteId);
    await deleteNote(noteId);
    setDeletingId(null);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleAdd();
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[360px] sm:w-[420px] flex flex-col p-0">
        <SheetHeader className="px-4 py-3 border-b shrink-0">
          <SheetTitle className="flex items-center gap-2 text-sm">
            <StickyNote className="h-4 w-4 text-muted-foreground" />
            <span className="truncate">{songTitle}</span>
            <span className="text-muted-foreground font-normal">연습 메모</span>
          </SheetTitle>
        </SheetHeader>

        {/* 노트 목록 */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <StickyNote className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-xs">등록된 메모가 없습니다</p>
              <p className="text-[10px] mt-0.5">아래에서 첫 메모를 추가하세요</p>
            </div>
          ) : (
            notes.map((note) => {
              const isOwner = currentUserId === note.created_by;
              const initials = note.profiles?.name
                ? note.profiles.name.slice(0, 2)
                : "?";

              return (
                <div
                  key={note.id}
                  className="flex items-start gap-2 group"
                >
                  <Avatar className="h-6 w-6 shrink-0 mt-0.5">
                    <AvatarImage
                      src={note.profiles?.avatar_url ?? undefined}
                      alt={note.profiles?.name}
                    />
                    <AvatarFallback className="text-[10px]">
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-xs font-medium leading-none truncate">
                        {note.profiles?.name ?? "알 수 없음"}
                      </span>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {formatDistanceToNow(new Date(note.created_at), {
                          addSuffix: true,
                          locale: ko,
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-foreground whitespace-pre-wrap break-words leading-relaxed bg-muted/40 rounded px-2 py-1.5">
                      {note.content}
                    </p>
                  </div>

                  {isOwner && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5"
                      onClick={() => handleDelete(note.id)}
                      disabled={deletingId === note.id}
                    >
                      {deletingId === note.id ? (
                        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                      ) : (
                        <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                      )}
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* 새 노트 입력 영역 */}
        <div className="px-4 py-3 border-t shrink-0 space-y-2">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="연습 메모를 입력하세요 (Ctrl+Enter로 추가)"
            className="text-xs resize-none min-h-[72px] max-h-[120px]"
            disabled={submitting}
          />
          <Button
            size="sm"
            className="h-7 text-xs w-full"
            onClick={handleAdd}
            disabled={submitting || !content.trim()}
          >
            {submitting ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <Plus className="h-3 w-3 mr-1" />
            )}
            메모 추가
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
