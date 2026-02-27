"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tags, X, Plus } from "lucide-react";
import type { FinanceCategory } from "@/types";

type Props = {
  groupId: string;
  projectId?: string | null;
  categories: FinanceCategory[];
  onSuccess: () => void;
};

export function FinanceCategoryManager({ groupId, projectId, categories, onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    setLoading(true);

    const { error } = await supabase.from("finance_categories").insert({
      group_id: groupId,
      project_id: projectId || null,
      name,
      sort_order: categories.length,
    });

    setLoading(false);
    if (!error) {
      setNewName("");
      onSuccess();
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("finance_categories").delete().eq("id", id);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs px-2.5">
          <Tags className="h-3 w-3 mr-1" />
          카테고리
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>카테고리 관리</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex gap-1.5">
            <Input
              placeholder="새 카테고리 이름"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAdd();
                }
              }}
              className="h-8 text-sm"
            />
            <Button onClick={handleAdd} disabled={loading || !newName.trim()} size="icon" className="h-8 w-8 shrink-0">
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>

          {categories.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              카테고리가 없습니다
            </p>
          ) : (
            <div className="rounded-lg border divide-y">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between px-3 py-1.5"
                >
                  <span className="text-sm">{cat.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(cat.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
