"use client";

import { memo } from "react";
import { Pencil, Trash2, Star } from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DanceProfileGenreEntry, DanceProfileSkillStar } from "@/types";
import { STAR_COLORS, STAR_LABELS } from "./dance-style-profile-types";
import { GenreDialog } from "./dance-style-profile-dialogs";

interface GenreListItemProps {
  entry: DanceProfileGenreEntry;
  onUpdate: (genre: string, updated: DanceProfileGenreEntry) => Promise<void>;
  onRemove: (genre: string) => Promise<void>;
}

export const GenreListItem = memo(function GenreListItem({
  entry,
  onUpdate,
  onRemove,
}: GenreListItemProps) {
  async function handleRemove() {
    await onRemove(entry.genre);
    toast.success(`"${entry.genre}" 장르를 삭제했습니다.`);
  }

  return (
    <div
      role="listitem"
      className="flex items-center justify-between rounded-md border px-2.5 py-1.5 bg-muted/20 hover:bg-muted/40 transition-colors group"
      aria-label={`${entry.genre} - ${STAR_LABELS[entry.stars]}`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xs font-medium truncate">{entry.genre}</span>
        <div
          className="flex items-center gap-0.5 shrink-0"
          aria-hidden="true"
        >
          {([1, 2, 3, 4, 5] as DanceProfileSkillStar[]).map((n) => (
            <Star
              key={n}
              className={cn(
                "h-3 w-3 transition-colors",
                n <= entry.stars
                  ? `fill-current ${STAR_COLORS[entry.stars]}`
                  : "text-muted-foreground/20"
              )}
            />
          ))}
        </div>
        <Badge
          variant="outline"
          className="text-[10px] px-1.5 py-0 shrink-0 bg-muted/30"
        >
          {STAR_LABELS[entry.stars]}
        </Badge>
      </div>

      <div
        className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100"
        role="group"
        aria-label={`${entry.genre} 관리`}
      >
        <GenreDialog
          initial={entry}
          existingGenres={[]}
          onSave={async (updated) => {
            await onUpdate(entry.genre, updated);
            toast.success(TOAST.MEMBERS.STYLE_PROFILE_GENRE_UPDATED);
          }}
          trigger={
            <button
              type="button"
              className="p-1 hover:text-blue-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
              aria-label={`${entry.genre} 장르 편집`}
            >
              <Pencil className="h-3 w-3" aria-hidden="true" />
            </button>
          }
        />
        <button
          type="button"
          onClick={handleRemove}
          className="p-1 hover:text-red-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
          aria-label={`${entry.genre} 장르 삭제`}
        >
          <Trash2 className="h-3 w-3" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
});
