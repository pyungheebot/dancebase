"use client";

import { useState, useEffect, startTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { invalidateSubgroups } from "@/lib/swr/invalidate";

interface SubgroupEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subgroup: {
    id: string;
    name: string;
    description: string | null;
  };
  parentGroupId: string;
  onUpdated?: () => void;
}

export function SubgroupEditDialog({
  open,
  onOpenChange,
  subgroup,
  parentGroupId,
  onUpdated,
}: SubgroupEditDialogProps) {
  const [name, setName] = useState(subgroup.name);
  const [description, setDescription] = useState(subgroup.description ?? "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      startTransition(() => {
        setName(subgroup.name);
        setDescription(subgroup.description ?? "");
      });
    }
  }, [open, subgroup]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("groups")
      .update({
        name: name.trim(),
        description: description.trim() || null,
      })
      .eq("id", subgroup.id);

    if (error) {
      toast.error("하위그룹 수정에 실패했습니다");
    } else {
      toast.success("하위그룹이 수정되었습니다");
      invalidateSubgroups(parentGroupId);
      onOpenChange(false);
      onUpdated?.();
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">하위그룹 수정</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-name" className="text-xs">
              이름 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="하위그룹 이름"
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-description" className="text-xs">
              설명
            </Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="하위그룹 설명 (선택)"
              className="text-sm resize-none"
              rows={3}
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={loading || !name.trim()}
          >
            {loading ? "저장 중..." : "저장"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
