"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Tag, BarChart2, ChevronDown, ChevronUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useDanceMoodBoard } from "@/hooks/use-dance-mood-board";
import type { MoodBoardCategory, MoodBoardItem } from "@/types";

const CATEGORIES: MoodBoardCategory[] = [
  "안무영감",
  "의상",
  "무대연출",
  "음악",
  "감정표현",
  "기타",
];

const CATEGORY_COLORS: Record<MoodBoardCategory, string> = {
  안무영감: "bg-purple-100 text-purple-700 border-purple-200",
  의상: "bg-pink-100 text-pink-700 border-pink-200",
  무대연출: "bg-orange-100 text-orange-700 border-orange-200",
  음악: "bg-cyan-100 text-cyan-700 border-cyan-200",
  감정표현: "bg-rose-100 text-rose-700 border-rose-200",
  기타: "bg-gray-100 text-gray-700 border-gray-200",
};

const CATEGORY_BAR_COLORS: Record<MoodBoardCategory, string> = {
  안무영감: "bg-purple-400",
  의상: "bg-pink-400",
  무대연출: "bg-orange-400",
  음악: "bg-cyan-400",
  감정표현: "bg-rose-400",
  기타: "bg-gray-400",
};

const DEFAULT_COLORS = [
  "#f9a8d4", "#fcd34d", "#6ee7b7", "#93c5fd",
  "#c4b5fd", "#fdba74", "#a5f3fc", "#d9f99d",
];

type FormState = {
  title: string;
  memo: string;
  category: MoodBoardCategory;
  color: string;
  tagInput: string;
  tags: string[];
};

const INITIAL_FORM: FormState = {
  title: "",
  memo: "",
  category: "안무영감",
  color: DEFAULT_COLORS[0],
  tagInput: "",
  tags: [],
};

export function DanceMoodBoardCard({ memberId }: { memberId: string }) {
  const { items, loading, categoryStats, topTags, addItem, updateItem, removeItem } =
    useDanceMoodBoard(memberId);

  const [filterCategory, setFilterCategory] = useState<MoodBoardCategory | "전체">("전체");
  const [statsOpen, setStatsOpen] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);

  // 모달 상태
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MoodBoardItem | null>(null);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  const filteredItems =
    filterCategory === "전체"
      ? items
      : items.filter((item) => item.category === filterCategory);

  const totalItems = items.length;
  const maxCount = Math.max(...Object.values(categoryStats), 1);

  function openAddDialog() {
    setEditingItem(null);
    setForm(INITIAL_FORM);
    setDialogOpen(true);
  }

  function openEditDialog(item: MoodBoardItem) {
    setEditingItem(item);
    setForm({
      title: item.title,
      memo: item.memo,
      category: item.category,
      color: item.color,
      tagInput: "",
      tags: [...item.tags],
    });
    setDialogOpen(true);
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === "Enter" || e.key === ",") && form.tagInput.trim()) {
      e.preventDefault();
      const newTag = form.tagInput.trim().replace(/,/g, "");
      if (newTag && !form.tags.includes(newTag)) {
        setForm((prev) => ({ ...prev, tags: [...prev.tags, newTag], tagInput: "" }));
      } else {
        setForm((prev) => ({ ...prev, tagInput: "" }));
      }
    }
  }

  function removeTag(tag: string) {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  }

  async function handleSave() {
    if (!form.title.trim()) {
      toast.error("제목을 입력해주세요.");
      return;
    }
    setSaving(true);
    try {
      if (editingItem) {
        await updateItem(editingItem.id, {
          title: form.title.trim(),
          memo: form.memo.trim(),
          category: form.category,
          color: form.color,
          tags: form.tags,
        });
        toast.success("항목이 수정되었습니다.");
      } else {
        await addItem({
          title: form.title.trim(),
          memo: form.memo.trim(),
          category: form.category,
          color: form.color,
          tags: form.tags,
        });
        toast.success("항목이 추가되었습니다.");
      }
      setDialogOpen(false);
    } catch {
      toast.error("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await removeItem(id);
      toast.success("항목이 삭제되었습니다.");
    } catch {
      toast.error("삭제에 실패했습니다.");
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <span className="text-base">무드보드</span>
            <Badge className="text-[10px] px-1.5 py-0 bg-indigo-100 text-indigo-700 border-indigo-200 border">
              {totalItems}개
            </Badge>
          </CardTitle>
          <Button size="sm" className="h-7 text-xs gap-1" onClick={openAddDialog}>
            <Plus className="h-3 w-3" />
            추가
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* 카테고리 통계 - Collapsible */}
        <Collapsible open={statsOpen} onOpenChange={setStatsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 text-xs w-full justify-between px-2">
              <span className="flex items-center gap-1">
                <BarChart2 className="h-3 w-3" />
                카테고리 통계
              </span>
              {statsOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-1 space-y-1.5 px-1">
              {CATEGORIES.map((cat) => {
                const count = categoryStats[cat];
                const pct = totalItems === 0 ? 0 : Math.round((count / maxCount) * 100);
                return (
                  <div key={cat} className="flex items-center gap-2">
                    <span className="text-[10px] w-14 text-muted-foreground shrink-0">{cat}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${CATEGORY_BAR_COLORS[cat]}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground w-4 text-right shrink-0">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* 태그 클라우드 - Collapsible */}
        <Collapsible open={tagsOpen} onOpenChange={setTagsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 text-xs w-full justify-between px-2">
              <span className="flex items-center gap-1">
                <Tag className="h-3 w-3" />
                태그 클라우드
              </span>
              {tagsOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-1 px-1 flex flex-wrap gap-1">
              {topTags.length === 0 ? (
                <span className="text-[10px] text-muted-foreground">태그가 없습니다.</span>
              ) : (
                topTags.map(({ tag, count }) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100"
                  >
                    #{tag}
                    <span className="text-indigo-400">({count})</span>
                  </span>
                ))
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* 카테고리 필터 */}
        <div className="flex flex-wrap gap-1">
          {(["전체", ...CATEGORIES] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                filterCategory === cat
                  ? "bg-indigo-100 text-indigo-700 border-indigo-300 font-medium"
                  : "bg-muted text-muted-foreground border-transparent hover:border-muted-foreground/30"
              }`}
            >
              {cat}
              {cat !== "전체" && (
                <span className="ml-0.5 opacity-60">{categoryStats[cat]}</span>
              )}
            </button>
          ))}
        </div>

        {/* 무드보드 그리드 */}
        {loading ? (
          <div className="text-xs text-muted-foreground text-center py-6">불러오는 중...</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-6">
            {filterCategory === "전체"
              ? "아직 항목이 없습니다. 추가 버튼을 눌러 시작해보세요."
              : `'${filterCategory}' 카테고리 항목이 없습니다.`}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="relative rounded-lg p-3 min-h-[90px] flex flex-col justify-between group border border-black/5"
                style={{ backgroundColor: item.color }}
              >
                {/* 액션 버튼 (호버 시) */}
                <div className="absolute top-1.5 right-1.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEditDialog(item)}
                    className="h-5 w-5 rounded bg-white/70 hover:bg-white flex items-center justify-center"
                    title="수정"
                  >
                    <Pencil className="h-3 w-3 text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="h-5 w-5 rounded bg-white/70 hover:bg-red-50 flex items-center justify-center"
                    title="삭제"
                  >
                    <Trash2 className="h-3 w-3 text-red-500" />
                  </button>
                </div>

                <div className="space-y-1 pr-6">
                  <p className="text-xs font-semibold text-gray-800 leading-tight line-clamp-2">
                    {item.title}
                  </p>
                  {item.memo && (
                    <p className="text-[10px] text-gray-600 line-clamp-2 leading-tight">
                      {item.memo}
                    </p>
                  )}
                </div>

                <div className="mt-1.5 space-y-1">
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full border ${CATEGORY_COLORS[item.category]} inline-block`}
                  >
                    {item.category}
                  </span>
                  {item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-0.5">
                      {item.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-[9px] px-1 py-0 rounded bg-white/50 text-gray-600"
                        >
                          #{tag}
                        </span>
                      ))}
                      {item.tags.length > 3 && (
                        <span className="text-[9px] text-gray-500">+{item.tags.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* 추가/수정 다이얼로그 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">
              {editingItem ? "무드보드 항목 수정" : "무드보드 항목 추가"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-1">
            {/* 제목 */}
            <div className="space-y-1">
              <Label className="text-xs">제목 *</Label>
              <Input
                className="h-8 text-xs"
                placeholder="항목 제목을 입력하세요"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>

            {/* 메모 */}
            <div className="space-y-1">
              <Label className="text-xs">메모</Label>
              <Textarea
                className="text-xs min-h-[64px] resize-none"
                placeholder="영감이나 메모를 남겨보세요"
                value={form.memo}
                onChange={(e) => setForm((prev) => ({ ...prev, memo: e.target.value }))}
              />
            </div>

            {/* 카테고리 */}
            <div className="space-y-1">
              <Label className="text-xs">카테고리</Label>
              <Select
                value={form.category}
                onValueChange={(val) =>
                  setForm((prev) => ({ ...prev, category: val as MoodBoardCategory }))
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-xs">
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 색상 */}
            <div className="space-y-1">
              <Label className="text-xs">배경 색상</Label>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {DEFAULT_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setForm((prev) => ({ ...prev, color: c }))}
                      className={`h-5 w-5 rounded-full border-2 transition-transform ${
                        form.color === c
                          ? "border-gray-700 scale-110"
                          : "border-transparent hover:scale-105"
                      }`}
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-1 ml-1">
                  <input
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm((prev) => ({ ...prev, color: e.target.value }))}
                    className="h-5 w-8 cursor-pointer rounded border border-input"
                    title="직접 선택"
                  />
                  <span className="text-[10px] text-muted-foreground">{form.color}</span>
                </div>
              </div>
            </div>

            {/* 태그 */}
            <div className="space-y-1">
              <Label className="text-xs">태그</Label>
              <Input
                className="h-8 text-xs"
                placeholder="태그 입력 후 Enter 또는 쉼표로 추가"
                value={form.tagInput}
                onChange={(e) => setForm((prev) => ({ ...prev, tagInput: e.target.value }))}
                onKeyDown={handleTagKeyDown}
              />
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {form.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100"
                    >
                      #{tag}
                      <button onClick={() => removeTag(tag)}>
                        <X className="h-2.5 w-2.5 ml-0.5 text-indigo-400 hover:text-indigo-700" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 미리보기 */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">미리보기</Label>
              <div
                className="rounded-lg p-3 min-h-[70px] border border-black/5"
                style={{ backgroundColor: form.color }}
              >
                <p className="text-xs font-semibold text-gray-800">
                  {form.title || "제목 없음"}
                </p>
                {form.memo && (
                  <p className="text-[10px] text-gray-600 mt-0.5 line-clamp-2">{form.memo}</p>
                )}
                <div className="mt-1.5 flex flex-wrap gap-1 items-center">
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full border ${CATEGORY_COLORS[form.category]} inline-block`}
                  >
                    {form.category}
                  </span>
                  {form.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[9px] px-1 py-0 rounded bg-white/50 text-gray-600"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              취소
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "저장 중..." : editingItem ? "수정" : "추가"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
