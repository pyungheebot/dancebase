"use client";

import { memo } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import type { DanceProfileInspirationEntry } from "@/types";
import { InspirationDialog } from "./dance-style-profile-dialogs";

interface InspirationListItemProps {
  item: DanceProfileInspirationEntry;
  onUpdate: (name: string, updated: DanceProfileInspirationEntry) => Promise<void>;
  onRemove: (name: string) => Promise<void>;
}

export const InspirationListItem = memo(function InspirationListItem({
  item,
  onUpdate,
  onRemove,
}: InspirationListItemProps) {
  return (
    <div
      role="listitem"
      className="flex items-start justify-between rounded-md border px-2.5 py-1.5 bg-muted/20 group"
      aria-label={item.memo ? `${item.name}: ${item.memo}` : item.name}
    >
      <div className="min-w-0">
        <p className="text-xs font-medium">{item.name}</p>
        {item.memo && (
          <p className="text-[10px] text-muted-foreground mt-0.5">{item.memo}</p>
        )}
      </div>
      <div
        className="flex items-center gap-1 shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100"
        role="group"
        aria-label={`${item.name} 관리`}
      >
        <InspirationDialog
          initial={item}
          existingNames={[]}
          onSave={async (updated) => {
            await onUpdate(item.name, updated);
            toast.success(TOAST.MEMBERS.STYLE_PROFILE_DANCER_UPDATED);
          }}
          trigger={
            <button
              type="button"
              className="p-1 hover:text-blue-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
              aria-label={`${item.name} 댄서 편집`}
            >
              <Pencil className="h-3 w-3" aria-hidden="true" />
            </button>
          }
        />
        <button
          type="button"
          onClick={() => onRemove(item.name)}
          className="p-1 hover:text-red-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
          aria-label={`${item.name} 댄서 삭제`}
        >
          <Trash2 className="h-3 w-3" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
});
