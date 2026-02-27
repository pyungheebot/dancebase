"use client";

import { useState } from "react";
import {
  ClipboardList,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  useDecisionLog,
  type DecisionLogInput,
} from "@/hooks/use-decision-log";
import type { DecisionCategory, DecisionImpact, DecisionLogItem } from "@/types";
import { DECISION_CATEGORIES } from "@/types";

// ============================================
// 상수 - 레이블 / 색상
// ============================================

const CATEGORY_COLORS: Record<DecisionCategory, string> = {
  "규칙 변경": "bg-orange-100 text-orange-700",
  "멤버 관리": "bg-blue-100 text-blue-700",
  재무: "bg-green-100 text-green-700",
  일정: "bg-purple-100 text-purple-700",
  기타: "bg-gray-100 text-gray-600",
};

const IMPACT_COLORS: Record<DecisionImpact, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-gray-100 text-gray-600",
};

const IMPACT_LABELS: Record<DecisionImpact, string> = {
  high: "높음",
  medium: "보통",
  low: "낮음",
};

// 타임라인 마커 색상
const IMPACT_MARKER_COLORS: Record<DecisionImpact, string> = {
  high: "bg-red-500",
  medium: "bg-yellow-400",
  low: "bg-gray-400",
};

// ============================================
// 날짜 포맷
// ============================================

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ============================================
// 추가 Dialog
// ============================================

const DEFAULT_FORM: DecisionLogInput = {
  title: "",
  category: "기타",
  description: "",
  decidedBy: "",
  impact: "medium",
};

interface AddDecisionDialogProps {
  onAdd: (input: DecisionLogInput) => boolean;
  disabled?: boolean;
}

function AddDecisionDialog({ onAdd, disabled }: AddDecisionDialogProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<DecisionLogInput>(DEFAULT_FORM);

  const isValid = form.title.trim().length > 0 && form.decidedBy.trim().length > 0;

  const handleSubmit = () => {
    const ok = onAdd(form);
    if (ok) {
      setForm(DEFAULT_FORM);
      setOpen(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setForm(DEFAULT_FORM);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="h-7 text-xs gap-0.5 shrink-0"
          disabled={disabled}
          title={disabled ? "최대 100개 기록 제한" : undefined}
        >
          <Plus className="h-3 w-3" />
          기록 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">의사결정 기록 추가</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-1">
          {/* 제목 */}
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">
              제목 <span className="text-destructive">*</span>
            </Label>
            <Input
              value={form.title}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="의사결정 제목을 입력하세요"
              className="h-7 text-xs"
              maxLength={120}
            />
          </div>

          {/* 카테고리 */}
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">
              카테고리
            </Label>
            <Select
              value={form.category}
              onValueChange={(v) =>
                setForm((prev) => ({
                  ...prev,
                  category: v as DecisionCategory,
                }))
              }
            >
              <SelectTrigger size="sm" className="h-7 text-xs w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DECISION_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-xs">
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 설명 */}
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">
              상세 설명
            </Label>
            <Textarea
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="결정 배경, 이유, 세부 내용 등을 입력하세요"
              className="text-xs min-h-[80px] resize-none"
            />
          </div>

          {/* 결정자 */}
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">
              결정자 <span className="text-destructive">*</span>
            </Label>
            <Input
              value={form.decidedBy}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, decidedBy: e.target.value }))
              }
              placeholder="결정자 이름 또는 역할"
              className="h-7 text-xs"
              maxLength={60}
            />
          </div>

          {/* 영향도 */}
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1.5 block">
              영향도
            </Label>
            <RadioGroup
              value={form.impact}
              onValueChange={(v) =>
                setForm((prev) => ({ ...prev, impact: v as DecisionImpact }))
              }
              className="flex items-center gap-4"
            >
              {(["high", "medium", "low"] as DecisionImpact[]).map((imp) => (
                <div key={imp} className="flex items-center gap-1.5">
                  <RadioGroupItem
                    value={imp}
                    id={`impact-${imp}`}
                    className="h-3.5 w-3.5"
                  />
                  <Label
                    htmlFor={`impact-${imp}`}
                    className="text-xs cursor-pointer"
                  >
                    {IMPACT_LABELS[imp]}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* 버튼 */}
          <div className="flex items-center gap-1.5 pt-0.5">
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={handleSubmit}
              disabled={!isValid}
            >
              기록 추가
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => handleOpenChange(false)}
            >
              취소
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 타임라인 항목 카드
// ============================================

interface DecisionTimelineItemProps {
  item: DecisionLogItem;
  isLast: boolean;
  onDelete: (id: string) => void;
}

function DecisionTimelineItem({
  item,
  isLast,
  onDelete,
}: DecisionTimelineItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDelete(item.id);
  };

  return (
    <div className="flex gap-3">
      {/* 타임라인 세로선 + 마커 */}
      <div className="flex flex-col items-center">
        <div
          className={`mt-1 h-2.5 w-2.5 rounded-full shrink-0 ring-2 ring-background ${IMPACT_MARKER_COLORS[item.impact]}`}
        />
        {!isLast && <div className="flex-1 w-px bg-border mt-1" />}
      </div>

      {/* 항목 본문 */}
      <div className="flex-1 pb-4 min-w-0">
        {/* 날짜 + 배지 행 */}
        <div className="flex items-center gap-1.5 flex-wrap mb-1">
          <span className="text-[10px] text-muted-foreground shrink-0">
            {formatDate(item.decidedAt)}
          </span>
          <span
            className={`inline-flex items-center rounded px-1.5 py-0 text-[10px] font-medium ${CATEGORY_COLORS[item.category]}`}
          >
            {item.category}
          </span>
          <span
            className={`inline-flex items-center rounded px-1.5 py-0 text-[10px] font-medium ${IMPACT_COLORS[item.impact]}`}
          >
            영향도 {IMPACT_LABELS[item.impact]}
          </span>
        </div>

        {/* 제목 + 펼침 버튼 */}
        <button
          type="button"
          className="w-full text-left group"
          onClick={() => setExpanded((prev) => !prev)}
        >
          <div className="flex items-start justify-between gap-1">
            <p className="text-xs font-semibold leading-snug group-hover:text-foreground/80 transition-colors">
              {item.title}
            </p>
            {expanded ? (
              <ChevronUp className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
            ) : (
              <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
            )}
          </div>
        </button>

        {/* 결정자 */}
        <p className="text-[10px] text-muted-foreground mt-0.5">
          결정자: {item.decidedBy}
        </p>

        {/* 펼침: 상세 설명 + 삭제 */}
        {expanded && (
          <div className="mt-2 space-y-2">
            {item.description ? (
              <p className="text-[11px] text-muted-foreground whitespace-pre-wrap leading-relaxed rounded bg-muted/40 px-2.5 py-2">
                {item.description}
              </p>
            ) : (
              <p className="text-[11px] text-muted-foreground/50 italic">
                상세 설명이 없습니다.
              </p>
            )}
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                className={`h-6 px-1.5 text-[10px] gap-0.5 ${
                  confirmDelete
                    ? "text-destructive bg-destructive/10"
                    : "text-muted-foreground hover:text-destructive"
                }`}
                onClick={handleDelete}
                onBlur={() => setConfirmDelete(false)}
              >
                <Trash2 className="h-3 w-3" />
                {confirmDelete ? "정말 삭제" : "삭제"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// 메인 패널
// ============================================

interface DecisionLogPanelProps {
  groupId: string;
  canEdit?: boolean;
}

export function DecisionLogPanel({
  groupId,
  canEdit = true,
}: DecisionLogPanelProps) {
  const {
    filteredItems,
    loading,
    categoryFilter,
    setCategoryFilter,
    impactFilter,
    setImpactFilter,
    addItem,
    deleteItem,
    totalCount,
    maxReached,
  } = useDecisionLog(groupId);

  const handleSheetOpenChange = () => {
    // 시트 열림/닫힘 시 별도 상태 초기화 필요 없음
  };

  return (
    <Sheet onOpenChange={handleSheetOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
          <ClipboardList className="h-3 w-3" />
          의사결정 로그
          {totalCount > 0 && (
            <Badge className="text-[10px] px-1.5 py-0 h-4 min-w-4 bg-muted text-muted-foreground border border-border">
              {totalCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col gap-0"
      >
        <SheetHeader className="px-4 py-3 border-b">
          <SheetTitle className="text-sm flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
            그룹 의사결정 로그
          </SheetTitle>
        </SheetHeader>

        {/* 필터 + 추가 버튼 */}
        <div className="px-4 py-3 border-b space-y-2">
          <div className="flex items-center gap-2">
            {/* 카테고리 필터 */}
            <Select
              value={categoryFilter}
              onValueChange={(v) =>
                setCategoryFilter(v as DecisionCategory | "all")
              }
            >
              <SelectTrigger size="sm" className="h-7 text-xs flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  전체 카테고리
                </SelectItem>
                {DECISION_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-xs">
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 영향도 필터 */}
            <Select
              value={impactFilter}
              onValueChange={(v) =>
                setImpactFilter(v as DecisionImpact | "all")
              }
            >
              <SelectTrigger size="sm" className="h-7 text-xs flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  전체 영향도
                </SelectItem>
                {(["high", "medium", "low"] as DecisionImpact[]).map((imp) => (
                  <SelectItem key={imp} value={imp} className="text-xs">
                    {IMPACT_LABELS[imp]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 추가 버튼 */}
            {canEdit && (
              <AddDecisionDialog onAdd={addItem} disabled={maxReached} />
            )}
          </div>
        </div>

        {/* 타임라인 목록 */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-foreground" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
              <ClipboardList className="h-8 w-8 text-muted-foreground/40" />
              {totalCount === 0 ? (
                <>
                  <p className="text-xs font-medium text-muted-foreground">
                    첫 번째 의사결정을 기록해보세요
                  </p>
                  <p className="text-[11px] text-muted-foreground/70">
                    그룹의 주요 결정 사항을 투명하게 관리할 수 있습니다.
                  </p>
                  {canEdit && (
                    <AddDecisionDialog onAdd={addItem} disabled={maxReached} />
                  )}
                </>
              ) : (
                <p className="text-xs text-muted-foreground">
                  필터 조건에 맞는 기록이 없습니다
                </p>
              )}
            </div>
          ) : (
            <div>
              {filteredItems.map((item, idx) => (
                <DecisionTimelineItem
                  key={item.id}
                  item={item}
                  isLast={idx === filteredItems.length - 1}
                  onDelete={deleteItem}
                />
              ))}
            </div>
          )}
        </div>

        {/* 하단 기록 수 */}
        {totalCount > 0 && (
          <div className="px-4 py-2 border-t text-[10px] text-muted-foreground text-right">
            {totalCount} / 100개
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
