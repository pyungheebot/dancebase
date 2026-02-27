"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus, Check } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { MemberCategory, GroupMemberWithProfile } from "@/types";
import { CATEGORY_COLORS, getCategoryColorClasses } from "@/types";

type MemberCategoryManagerProps = {
  groupId: string;
  categories: MemberCategory[];
  members: GroupMemberWithProfile[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
};

export function MemberCategoryManager({
  groupId,
  categories,
  members,
  open,
  onOpenChange,
  onUpdate,
}: MemberCategoryManagerProps) {
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [colorPopoverId, setColorPopoverId] = useState<string | null>(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const supabase = createClient();

  const getMemberCount = (categoryId: string) =>
    members.filter((m) => m.category_id === categoryId).length;

  const handleAdd = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    setAdding(true);
    const nextOrder = categories.length > 0
      ? Math.max(...categories.map((c) => c.sort_order)) + 1
      : 0;

    const { error } = await supabase.from("member_categories").insert({
      group_id: groupId,
      name: trimmed,
      sort_order: nextOrder,
    });

    if (error) { toast.error("카테고리 추가에 실패했습니다"); setAdding(false); return; }
    setNewName("");
    setAdding(false);
    onUpdate();
  };

  const handleDelete = async (categoryId: string) => {
    setDeleting(categoryId);
    const { error } = await supabase.from("member_categories").delete().eq("id", categoryId);
    if (error) { toast.error("카테고리 삭제에 실패했습니다"); setDeleting(null); return; }
    setDeleting(null);
    onUpdate();
  };

  const getDeleteMessage = (categoryId: string) => {
    const count = getMemberCount(categoryId);
    return count > 0
      ? `이 카테고리에 ${count}명의 멤버가 있습니다. 삭제하면 해당 멤버의 카테고리가 해제됩니다.`
      : "이 카테고리를 삭제하시겠습니까?";
  };

  const startEditing = (cat: MemberCategory) => {
    setEditingId(cat.id);
    setEditingName(cat.name);
  };

  const saveEditing = async () => {
    if (!editingId) return;
    const trimmed = editingName.trim();
    if (!trimmed) {
      cancelEditing();
      return;
    }
    const { error } = await supabase
      .from("member_categories")
      .update({ name: trimmed })
      .eq("id", editingId);
    if (error) { toast.error("이름 변경에 실패했습니다"); return; }
    setEditingId(null);
    setEditingName("");
    onUpdate();
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName("");
  };

  const handleColorChange = async (categoryId: string, colorKey: string) => {
    const { error } = await supabase
      .from("member_categories")
      .update({ color: colorKey })
      .eq("id", categoryId);
    if (error) { toast.error("색상 변경에 실패했습니다"); return; }
    setColorPopoverId(null);
    onUpdate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>카테고리 관리</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {categories.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">
              등록된 카테고리가 없습니다
            </p>
          )}

          {categories.map((cat) => {
            const isEditing = editingId === cat.id;
            const colorClasses = getCategoryColorClasses(cat.color || "gray");

            return (
              <div
                key={cat.id}
                className="flex items-center justify-between p-2 rounded-lg border"
              >
                <div className="flex items-center gap-2">
                  <Popover
                    open={colorPopoverId === cat.id}
                    onOpenChange={(open) => setColorPopoverId(open ? cat.id : null)}
                  >
                    <PopoverTrigger asChild>
                      <button
                        className={`w-5 h-5 rounded-full border-2 shrink-0 ${colorClasses.bg} ${colorClasses.border}`}
                        aria-label="색상 변경"
                      />
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2" align="start">
                      <div className="grid grid-cols-4 gap-1.5">
                        {CATEGORY_COLORS.map((c) => {
                          const cc = getCategoryColorClasses(c.key);
                          const isSelected = (cat.color || "gray") === c.key;
                          return (
                            <button
                              key={c.key}
                              className={`w-7 h-7 rounded-full border-2 flex items-center justify-center ${cc.bg} ${cc.border}`}
                              onClick={() => handleColorChange(cat.id, c.key)}
                              title={c.label}
                            >
                              {isSelected && <Check className={`h-3.5 w-3.5 ${cc.text}`} />}
                            </button>
                          );
                        })}
                      </div>
                    </PopoverContent>
                  </Popover>

                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEditing();
                          if (e.key === "Escape") cancelEditing();
                        }}
                        onBlur={saveEditing}
                        className="h-7 w-28 text-sm"
                        maxLength={30}
                        autoFocus
                      />
                    </div>
                  ) : (
                    <>
                      <button
                        className="text-sm font-medium hover:underline text-left"
                        onClick={() => startEditing(cat)}
                      >
                        {cat.name}
                      </button>
                      <span className="text-xs text-muted-foreground">
                        {getMemberCount(cat.id)}명
                      </span>
                    </>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setDeletingCategoryId(cat.id)}
                  disabled={deleting === cat.id}
                  aria-label="카테고리 삭제"
                >
                  <X className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            );
          })}

          <div className="flex gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
              }}
              placeholder="새 카테고리 이름"
              maxLength={30}
              className="flex-1"
            />
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={adding || !newName.trim()}
            >
              <Plus className="h-4 w-4 mr-1" />
              추가
            </Button>
          </div>
        </div>
      </DialogContent>
      <ConfirmDialog
        open={!!deletingCategoryId}
        onOpenChange={(open) => { if (!open) setDeletingCategoryId(null); }}
        title="카테고리 삭제"
        description={deletingCategoryId ? getDeleteMessage(deletingCategoryId) : ""}
        onConfirm={() => { if (deletingCategoryId) { handleDelete(deletingCategoryId); setDeletingCategoryId(null); } }}
        destructive
      />
    </Dialog>
  );
}
