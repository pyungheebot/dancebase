"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGroupMemoryAlbum } from "@/hooks/use-group-memory-album";
import { BookHeart, Plus, Trash2 } from "lucide-react";
import type { MemoryCategory } from "@/types";

const CATEGORIES: MemoryCategory[] = ["공연", "연습", "모임", "축하", "대회", "기타"];
const CATEGORY_COLORS: Record<MemoryCategory, string> = {
  "공연": "bg-purple-50 text-purple-700 border-purple-200",
  "연습": "bg-blue-50 text-blue-700 border-blue-200",
  "모임": "bg-green-50 text-green-700 border-green-200",
  "축하": "bg-pink-50 text-pink-700 border-pink-200",
  "대회": "bg-orange-50 text-orange-700 border-orange-200",
  "기타": "bg-gray-50 text-gray-600 border-gray-200",
};

export function GroupMemoryAlbum({ groupId }: { groupId: string }) {
  const { items, totalCount, addItem, deleteItem, categoryFilter, setCategoryFilter, yearFilter, setYearFilter, availableYears } = useGroupMemoryAlbum(groupId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState<MemoryCategory>("기타");
  const [emoji, setEmoji] = useState("🎉");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  function handleCreate() {
    if (!title.trim() || !date) return;
    addItem({ title: title.trim(), description: description.trim(), date, category, emoji: emoji || "🎉" });
    setTitle(""); setDescription(""); setDate(""); setCategory("기타"); setEmoji("🎉");
    setDialogOpen(false);
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <BookHeart className="h-4 w-4 mr-1" />추억 앨범
          {totalCount > 0 && <Badge className="ml-1 h-4 px-1 text-[10px]">{totalCount}</Badge>}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            추억 앨범
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="h-3 w-3 mr-1" />추가</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>추억 기록</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>제목</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목" /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label>날짜</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
                    <div><Label>이모지</Label><Input value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="🎉" /></div>
                  </div>
                  <div>
                    <Label>카테고리</Label>
                    <Select value={category} onValueChange={(v) => setCategory(v as MemoryCategory)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>설명</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="추억을 기록하세요" rows={3} /></div>
                  <Button onClick={handleCreate} disabled={!title.trim() || !date} className="w-full">저장</Button>
                </div>
              </DialogContent>
            </Dialog>
          </SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          {/* 필터 */}
          <div className="flex gap-2">
            <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as MemoryCategory | "all")}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="카테고리" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="h-8 text-xs w-24"><SelectValue placeholder="연도" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                {availableYears.map((y) => <SelectItem key={y} value={y}>{y}년</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">기록된 추억이 없습니다.</p>}

          {/* 타임라인 */}
          <div className="relative pl-6">
            <div className="absolute left-2 top-0 bottom-0 w-px bg-border" />
            {items.map((item) => (
              <div key={item.id} className="relative mb-4">
                <div className="absolute -left-4 top-1 w-4 h-4 rounded-full border-2 border-background bg-primary flex items-center justify-center text-[8px]">
                  {item.emoji}
                </div>
                <div className="border rounded-lg p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{item.date}</span>
                      <Badge variant="outline" className={`text-[10px] ${CATEGORY_COLORS[item.category]}`}>{item.category}</Badge>
                    </div>
                    <Button
                      variant="ghost" size="icon" className={`h-5 w-5 ${deleteConfirm === item.id ? "text-red-600" : ""}`}
                      onClick={() => { if (deleteConfirm === item.id) { deleteItem(item.id); setDeleteConfirm(null); } else setDeleteConfirm(item.id); }}
                      onBlur={() => setDeleteConfirm(null)}
                      aria-label="삭제"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="font-medium text-sm">{item.emoji} {item.title}</p>
                  {item.description && <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
