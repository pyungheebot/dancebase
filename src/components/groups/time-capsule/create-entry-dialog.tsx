"use client";

import { useState } from "react";
import { PackageOpen, CalendarIcon, Target, Music2, ImageIcon, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { dateToYMD } from "./time-capsule-utils";

// ============================================
// 스냅샷 캡슐 생성 다이얼로그 (확장)
// ============================================

export function CreateEntryDialog({
  open,
  onOpenChange,
  onCreate,
  totalCount,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreate: (params: {
    title: string;
    openDate: string;
    currentGoal?: string;
    currentRepertoire?: string[];
    photoUrl?: string;
  }) => boolean;
  totalCount: number;
}) {
  const [title, setTitle] = useState("");
  const [openDate, setOpenDate] = useState<Date | undefined>(undefined);
  const [calOpen, setCalOpen] = useState(false);
  const [currentGoal, setCurrentGoal] = useState("");
  const [repertoireInput, setRepertoireInput] = useState("");
  const [repertoire, setRepertoire] = useState<string[]>([]);
  const [photoUrl, setPhotoUrl] = useState("");

  const reset = () => {
    setTitle("");
    setOpenDate(undefined);
    setCurrentGoal("");
    setRepertoireInput("");
    setRepertoire([]);
    setPhotoUrl("");
  };

  const handleAddRepertoire = () => {
    const trimmed = repertoireInput.trim();
    if (!trimmed) return;
    if (repertoire.includes(trimmed)) {
      toast.error(TOAST.TIME_CAPSULE_CARD.ALREADY_ADDED);
      return;
    }
    setRepertoire((prev) => [...prev, trimmed]);
    setRepertoireInput("");
  };

  const handleRemoveRepertoire = (item: string) => {
    setRepertoire((prev) => prev.filter((r) => r !== item));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error(TOAST.TIME_CAPSULE_CARD.TITLE_REQUIRED);
      return;
    }
    if (!openDate) {
      toast.error(TOAST.TIME_CAPSULE.OPEN_DATE_REQUIRED);
      return;
    }
    const success = onCreate({
      title: title.trim(),
      openDate: dateToYMD(openDate),
      currentGoal: currentGoal.trim() || undefined,
      currentRepertoire: repertoire,
      photoUrl: photoUrl.trim() || undefined,
    });
    if (!success) {
      toast.error(TOAST.TIME_CAPSULE_CARD.MAX_LIMIT);
      return;
    }
    toast.success(TOAST.TIME_CAPSULE_CARD.CREATED);
    reset();
    onOpenChange(false);
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-1.5">
            <PackageOpen className="h-4 w-4 text-indigo-500" />
            스냅샷 타임캡슐 만들기
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
          {/* 제목 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              캡슐 제목 <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="예: 2026년 봄 시즌 스냅샷"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-8 text-xs"
              maxLength={50}
            />
          </div>

          {/* 개봉 예정일 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              개봉 예정일 <span className="text-destructive">*</span>
            </label>
            <Popover open={calOpen} onOpenChange={setCalOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-8 w-full justify-start text-xs font-normal",
                    !openDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="h-3 w-3 mr-1.5 shrink-0" />
                  {openDate ? dateToYMD(openDate) : "날짜 선택"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={openDate}
                  onSelect={(d) => {
                    setOpenDate(d);
                    setCalOpen(false);
                  }}
                  disabled={(d) => {
                    const day = new Date(d);
                    day.setHours(0, 0, 0, 0);
                    return day <= today;
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* 현재 목표 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground flex items-center gap-1">
              <Target className="h-3 w-3 text-orange-500" />
              현재 그룹 목표
            </label>
            <Textarea
              placeholder="이 시점의 그룹 목표를 기록해 두세요."
              value={currentGoal}
              onChange={(e) => setCurrentGoal(e.target.value)}
              className="text-xs resize-none min-h-[56px]"
              maxLength={200}
            />
            <p className="text-[10px] text-muted-foreground text-right">
              {currentGoal.length}/200
            </p>
          </div>

          {/* 현재 레퍼토리 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground flex items-center gap-1">
              <Music2 className="h-3 w-3 text-purple-500" />
              현재 레퍼토리
            </label>
            <div className="flex gap-1">
              <Input
                placeholder="곡명 입력 후 추가"
                value={repertoireInput}
                onChange={(e) => setRepertoireInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddRepertoire();
                  }
                }}
                className="h-7 text-xs flex-1"
                maxLength={50}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs px-2"
                onClick={handleAddRepertoire}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            {repertoire.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-0.5">
                {repertoire.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700"
                  >
                    {item}
                    <button
                      type="button"
                      onClick={() => handleRemoveRepertoire(item)}
                      className="hover:text-destructive"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 그룹 사진 URL */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground flex items-center gap-1">
              <ImageIcon className="h-3 w-3 text-cyan-500" />
              그룹 사진 URL
            </label>
            <Input
              placeholder="https://..."
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              className="h-8 text-xs"
              maxLength={500}
              type="url"
            />
            {photoUrl && (
              <p className="text-[10px] text-muted-foreground truncate">
                미리보기: {photoUrl}
              </p>
            )}
          </div>

          {totalCount >= 30 && (
            <p className="text-[10px] text-destructive">
              최대 30개까지 생성할 수 있습니다.
            </p>
          )}

          <DialogFooter className="pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={handleClose}
            >
              취소
            </Button>
            <Button
              type="submit"
              size="sm"
              className="h-7 text-xs"
              disabled={totalCount >= 30}
            >
              생성
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
