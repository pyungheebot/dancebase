"use client";

// ============================================================
// 백스테이지 체크 다이얼로그 컴포넌트
//  - CreateSessionDialog: 새 체크 세션 생성
//  - AddItemDialog: 세션에 체크 항목 추가
// ============================================================

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import type { BackstageCategory } from "@/types";
import { ALL_BACKSTAGE_CATEGORIES, categoryLabel } from "./backstage-check-types";

// ============================================
// 세션 생성 다이얼로그
// ============================================

export interface CreateSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (eventName: string, eventDate: string) => void;
}

export function CreateSessionDialog({
  open,
  onOpenChange,
  onSubmit,
}: CreateSessionDialogProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState(today);

  // 폼 초기화
  const resetForm = () => {
    setEventName("");
    setEventDate(today);
  };

  const handleSubmit = () => {
    if (!eventName.trim()) {
      toast.error(TOAST.BACKSTAGE_CHECK.EVENT_NAME_REQUIRED);
      return;
    }
    if (!eventDate) {
      toast.error(TOAST.BACKSTAGE_CHECK.DATE_REQUIRED);
      return;
    }
    onSubmit(eventName.trim(), eventDate);
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            백스테이지 체크 세션 생성
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-1">
          {/* 이벤트명 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">이벤트명 *</Label>
            <Input
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="예: 2026 봄 공연"
              className="h-7 text-xs"
              aria-label="이벤트명"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
          </div>

          {/* 공연 날짜 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">공연 날짜 *</Label>
            <Input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="h-7 text-xs"
              aria-label="공연 날짜"
            />
          </div>

          <div className="flex gap-1.5 justify-end pt-0.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
            >
              취소
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
              생성
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 항목 추가 다이얼로그
// ============================================

export interface AddItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberNames: string[];
  onSubmit: (
    category: BackstageCategory,
    title: string,
    description: string,
    assignedTo: string,
    priority: "high" | "medium" | "low"
  ) => void;
}

export function AddItemDialog({
  open,
  onOpenChange,
  memberNames,
  onSubmit,
}: AddItemDialogProps) {
  const [category, setCategory] = useState<BackstageCategory>("sound");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium");

  // 폼 초기화
  const resetForm = () => {
    setCategory("sound");
    setTitle("");
    setDescription("");
    setAssignedTo("");
    setPriority("medium");
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error(TOAST.BACKSTAGE_CHECK.ITEM_TITLE_REQUIRED);
      return;
    }
    onSubmit(category, title.trim(), description.trim(), assignedTo, priority);
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            체크 항목 추가
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-1">
          {/* 카테고리 선택 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">카테고리 *</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as BackstageCategory)}
            >
              <SelectTrigger className="h-7 text-xs" aria-label="카테고리 선택">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_BACKSTAGE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-xs">
                    {categoryLabel(cat)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 제목 입력 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">제목 *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 마이크 배터리 교체 확인"
              className="h-7 text-xs"
              aria-label="항목 제목"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
          </div>

          {/* 설명 입력 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">설명 (선택)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="상세 내용을 입력하세요"
              className="text-xs min-h-[56px] resize-none"
              aria-label="항목 설명"
              rows={2}
            />
          </div>

          {/* 담당자 선택 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">담당자 (선택)</Label>
            <Select
              value={assignedTo || "__none__"}
              onValueChange={(v) => setAssignedTo(v === "__none__" ? "" : v)}
            >
              <SelectTrigger className="h-7 text-xs" aria-label="담당자 선택">
                <SelectValue placeholder="담당자 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__" className="text-xs">
                  미지정
                </SelectItem>
                {memberNames.map((name) => (
                  <SelectItem key={name} value={name} className="text-xs">
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 우선순위 선택 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">우선순위 *</Label>
            <Select
              value={priority}
              onValueChange={(v) =>
                setPriority(v as "high" | "medium" | "low")
              }
            >
              <SelectTrigger className="h-7 text-xs" aria-label="우선순위 선택">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high" className="text-xs">
                  높음
                </SelectItem>
                <SelectItem value="medium" className="text-xs">
                  보통
                </SelectItem>
                <SelectItem value="low" className="text-xs">
                  낮음
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-1.5 justify-end pt-0.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
            >
              취소
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
              추가
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
