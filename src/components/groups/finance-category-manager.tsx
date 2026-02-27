"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tags, X, Plus, Pencil, Check } from "lucide-react";
import { toast } from "sonner";
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
  const [newFeeRate, setNewFeeRate] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editFeeRate, setEditFeeRate] = useState("");
  const supabase = createClient();

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    const feeRate = parseFloat(newFeeRate) || 0;
    if (feeRate < 0 || feeRate > 100) {
      toast.error("수수료 비율은 0~100 사이로 입력해주세요");
      return;
    }
    setLoading(true);

    const { error } = await supabase.from("finance_categories").insert({
      group_id: groupId,
      project_id: projectId || null,
      name,
      sort_order: categories.length,
      fee_rate: feeRate,
    });

    setLoading(false);
    if (error) {
      toast.error("카테고리 추가에 실패했습니다");
    } else {
      setNewName("");
      setNewFeeRate("");
      onSuccess();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("finance_categories").delete().eq("id", id);
    if (error) {
      toast.error("카테고리 삭제에 실패했습니다");
    } else {
      onSuccess();
    }
  };

  const handleEditStart = (cat: FinanceCategory) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditFeeRate(cat.fee_rate > 0 ? String(cat.fee_rate) : "");
  };

  const handleEditSave = async (id: string) => {
    const name = editName.trim();
    if (!name) {
      toast.error("카테고리 이름을 입력해주세요");
      return;
    }
    const feeRate = parseFloat(editFeeRate) || 0;
    if (feeRate < 0 || feeRate > 100) {
      toast.error("수수료 비율은 0~100 사이로 입력해주세요");
      return;
    }

    const { error } = await supabase
      .from("finance_categories")
      .update({ name, fee_rate: feeRate })
      .eq("id", id);

    if (error) {
      toast.error("카테고리 수정에 실패했습니다");
    } else {
      setEditingId(null);
      onSuccess();
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditName("");
    setEditFeeRate("");
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
          {/* 새 카테고리 추가 폼 */}
          <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">새 카테고리 추가</p>
            <div className="flex gap-1.5">
              <Input
                placeholder="카테고리 이름"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAdd();
                  }
                }}
                className="h-8 text-sm flex-1"
              />
              <Button
                onClick={handleAdd}
                disabled={loading || !newName.trim()}
                size="icon"
                className="h-8 w-8 shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground shrink-0 w-24">수수료 비율 (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                step={0.1}
                placeholder="0"
                value={newFeeRate}
                onChange={(e) => setNewFeeRate(e.target.value)}
                className="h-7 text-xs w-24"
              />
              <p className="text-[11px] text-muted-foreground">0이면 수수료 없음</p>
            </div>
          </div>

          {/* 카테고리 목록 */}
          {categories.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              카테고리가 없습니다
            </p>
          ) : (
            <div className="rounded-lg border divide-y">
              {categories.map((cat) =>
                editingId === cat.id ? (
                  // 수정 모드
                  <div key={cat.id} className="px-3 py-2 space-y-2 bg-muted/20">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleEditSave(cat.id);
                        }
                        if (e.key === "Escape") handleEditCancel();
                      }}
                      className="h-7 text-xs"
                      autoFocus
                    />
                    <div className="flex items-center gap-2">
                      <Label className="text-[11px] text-muted-foreground shrink-0">수수료 비율 (%)</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step={0.1}
                        placeholder="0"
                        value={editFeeRate}
                        onChange={(e) => setEditFeeRate(e.target.value)}
                        className="h-7 text-xs w-20"
                      />
                    </div>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                        onClick={handleEditCancel}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-green-600 hover:text-green-700"
                        onClick={() => handleEditSave(cat.id)}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  // 일반 표시 모드
                  <div
                    key={cat.id}
                    className="flex items-center justify-between px-3 py-1.5"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm truncate">{cat.name}</span>
                      {cat.fee_rate > 0 && (
                        <span className="text-[10px] px-1.5 py-0 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 shrink-0">
                          {cat.fee_rate}%
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                        onClick={() => handleEditStart(cat)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(cat.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
