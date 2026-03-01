/**
 * 관객 안내 섹션 추가 다이얼로그
 *
 * 섹션 유형, 제목, 초기 내용을 입력받아 새 섹션을 생성한다.
 */

"use client";

import React, { memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { SECTION_TYPE_ICONS, ALL_SECTION_TYPES } from "./audience-guide-types";
import { SECTION_TYPE_LABELS } from "@/hooks/use-audience-guide";
import type { AudienceGuideSectionType } from "@/types";

// ============================================================
// Props
// ============================================================

export interface AudienceGuideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 선택된 섹션 유형 */
  sectionType: AudienceGuideSectionType;
  onSectionTypeChange: (type: AudienceGuideSectionType) => void;
  /** 섹션 제목 */
  sectionTitle: string;
  onSectionTitleChange: (title: string) => void;
  /** 섹션 초기 내용 */
  sectionContent: string;
  onSectionContentChange: (content: string) => void;
  /** 추가 확인 핸들러 */
  onConfirm: () => void;
  /** 취소 핸들러 */
  onCancel: () => void;
}

// ============================================================
// 컴포넌트
// ============================================================

const DIALOG_DESC_ID = "audience-guide-dialog-desc";

/** 새 섹션 추가를 위한 다이얼로그 */
export const AudienceGuideDialog = memo(function AudienceGuideDialog({
  open,
  onOpenChange,
  sectionType,
  onSectionTypeChange,
  sectionTitle,
  onSectionTitleChange,
  sectionContent,
  onSectionContentChange,
  onConfirm,
  onCancel,
}: AudienceGuideDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" aria-describedby={DIALOG_DESC_ID}>
        <DialogHeader>
          <DialogTitle className="text-sm">섹션 추가</DialogTitle>
          <DialogDescription id={DIALOG_DESC_ID} className="text-xs">
            관객 안내 매뉴얼에 새로운 섹션을 추가합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* 섹션 유형 선택 */}
          <div>
            <Label className="text-xs mb-1 block">섹션 유형</Label>
            <Select
              value={sectionType}
              onValueChange={(val) =>
                onSectionTypeChange(val as AudienceGuideSectionType)
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_SECTION_TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">
                    <span className="flex items-center gap-1.5">
                      {SECTION_TYPE_ICONS[t]}
                      {SECTION_TYPE_LABELS[t]}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 섹션 제목 입력 */}
          <div>
            <Label className="text-xs mb-1 block">섹션 제목</Label>
            <Input
              value={sectionTitle}
              onChange={(e) => onSectionTitleChange(e.target.value)}
              placeholder="예: 오시는 길"
              className="h-8 text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter") onConfirm();
              }}
              autoFocus
            />
          </div>

          {/* 초기 내용 입력 (선택) */}
          <div>
            <Label className="text-xs mb-1 block">
              내용{" "}
              <span className="text-muted-foreground">(선택)</span>
            </Label>
            <Textarea
              value={sectionContent}
              onChange={(e) => onSectionContentChange(e.target.value)}
              placeholder="초기 내용을 입력하세요..."
              rows={3}
              className="text-xs resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={onCancel}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={onConfirm}
          >
            <Plus className="h-3 w-3 mr-1" aria-hidden />
            추가
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
