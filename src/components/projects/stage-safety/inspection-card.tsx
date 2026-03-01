"use client";

import { useState, useId } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import type {
  AddCheckItemParams,
} from "@/hooks/use-stage-safety";
import type { SafetyCheckItem, SafetyInspection } from "@/types";
import { CATEGORY_LABELS, CATEGORY_ICONS } from "./types";
import { OverallStatusBadge } from "./status-badge";
import { CheckItemRow } from "./check-item-row";

// ============================================================
// 점검 기록 카드 (펼치기/접기)
// ============================================================

interface InspectionCardProps {
  inspection: SafetyInspection;
  onDelete: () => void;
  onStatusChange: (
    itemId: string,
    status: SafetyCheckItem["status"]
  ) => void;
  onRemoveItem: (itemId: string) => void;
  onAddItem: (params: AddCheckItemParams) => void;
  onSetOverall: (
    status: SafetyInspection["overallStatus"],
    signedBy?: string | null
  ) => void;
}

export function InspectionCard({
  inspection,
  onDelete,
  onStatusChange,
  onRemoveItem,
  onAddItem,
  onSetOverall,
}: InspectionCardProps) {
  const [open, setOpen] = useState(false);
  const [addItemOpen, setAddItemOpen] = useState(false);

  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] =
    useState<SafetyCheckItem["category"]>("other");
  const [newNotes, setNewNotes] = useState("");
  const [newInspector, setNewInspector] = useState("");

  const uid = useId();
  const descId = `desc-${uid}`;
  const notesId = `notes-${uid}`;
  const inspectorId = `inspector-${uid}`;
  const categoryId = `category-${uid}`;
  const progressId = `progress-${uid}`;
  const collapsibleId = `collapsible-${uid}`;

  const totalItems = inspection.items.filter((i) => i.status !== "na").length;
  const passItems = inspection.items.filter((i) => i.status === "pass").length;
  const passRate =
    totalItems === 0 ? 0 : Math.round((passItems / totalItems) * 100);

  const grouped = inspection.items.reduce<
    Partial<Record<SafetyCheckItem["category"], SafetyCheckItem[]>>
  >((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category]!.push(item);
    return acc;
  }, {});

  function handleAddItem() {
    if (!newDesc.trim()) {
      toast.error(TOAST.STAGE_SAFETY.CHECK_CONTENT_REQUIRED);
      return;
    }
    onAddItem({
      category: newCategory,
      description: newDesc.trim(),
      status: "pending",
      notes: newNotes.trim() || null,
      inspectorName: newInspector.trim() || null,
    });
    setNewDesc("");
    setNewNotes("");
    setNewInspector("");
    setAddItemOpen(false);
    toast.success(TOAST.STAGE_SAFETY.CHECK_ITEM_ADDED);
  }

  function handleDescKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleAddItem();
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-lg border border-border bg-card">
        {/* 헤더 */}
        <CollapsibleTrigger asChild>
          <div
            role="button"
            tabIndex={0}
            aria-expanded={open}
            aria-controls={collapsibleId}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setOpen((prev) => !prev);
              }
            }}
            className="flex items-center gap-2 p-3 cursor-pointer hover:bg-muted/40 rounded-t-lg"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium truncate">
                  {inspection.title}
                </span>
                <OverallStatusBadge status={inspection.overallStatus} />
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                <time dateTime={inspection.date}>{inspection.date}</time>
                {inspection.venue && <span>· {inspection.venue}</span>}
                <span>
                  · 항목 {inspection.items.length}개 / 통과율 {passRate}%
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                aria-label={`${inspection.title} 점검 삭제`}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="sr-only">점검 삭제</span>
              </Button>
              {open ? (
                <ChevronUp
                  className="h-4 w-4 text-muted-foreground"
                  aria-hidden="true"
                />
              ) : (
                <ChevronDown
                  className="h-4 w-4 text-muted-foreground"
                  aria-hidden="true"
                />
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent id={collapsibleId}>
          <div className="px-3 pb-3 space-y-3 border-t border-border pt-3">
            {/* 통과율 진행률 바 */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span id={progressId}>통과율</span>
                <span className="font-medium text-foreground">
                  {passItems}/{totalItems} ({passRate}%)
                </span>
              </div>
              <div
                role="progressbar"
                aria-valuenow={passRate}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-labelledby={progressId}
                className="h-1.5 w-full rounded-full bg-muted overflow-hidden"
              >
                <div
                  className="h-full rounded-full bg-green-500 transition-all duration-300"
                  style={{ width: `${passRate}%` }}
                  aria-hidden="true"
                />
              </div>
            </div>

            {/* 카테고리별 항목 */}
            {inspection.items.length === 0 ? (
              <p
                role="alert"
                aria-live="polite"
                className="text-xs text-muted-foreground text-center py-2"
              >
                점검 항목이 없습니다.
              </p>
            ) : (
              <div className="space-y-3">
                {(
                  Object.keys(CATEGORY_LABELS) as SafetyCheckItem["category"][]
                ).map((cat) => {
                  const items = grouped[cat];
                  if (!items || items.length === 0) return null;
                  const Icon = CATEGORY_ICONS[cat];
                  return (
                    <div key={cat} className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <Icon
                          className="h-3 w-3 text-muted-foreground"
                          aria-hidden="true"
                        />
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                          {CATEGORY_LABELS[cat]}
                        </span>
                      </div>
                      <ul
                        role="list"
                        aria-label={`${CATEGORY_LABELS[cat]} 점검 항목`}
                        className="space-y-1 pl-4"
                      >
                        {items.map((item) => (
                          <CheckItemRow
                            key={item.id}
                            item={item}
                            onStatusChange={(status) =>
                              onStatusChange(item.id, status)
                            }
                            onRemove={() => onRemoveItem(item.id)}
                          />
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 항목 추가 폼 */}
            {addItemOpen && (
              <fieldset className="rounded-md border border-dashed border-border p-3 space-y-2 bg-muted/30">
                <legend className="text-xs font-medium px-1">
                  새 점검 항목
                </legend>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor={categoryId} className="text-[10px]">
                      카테고리
                    </Label>
                    <Select
                      value={newCategory}
                      onValueChange={(v) =>
                        setNewCategory(v as SafetyCheckItem["category"])
                      }
                    >
                      <SelectTrigger
                        id={categoryId}
                        className="h-7 text-xs"
                        aria-label="카테고리 선택"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(
                          Object.entries(
                            CATEGORY_LABELS
                          ) as [SafetyCheckItem["category"], string][]
                        ).map(([val, label]) => (
                          <SelectItem
                            key={val}
                            value={val}
                            className="text-xs"
                          >
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={inspectorId} className="text-[10px]">
                      점검자
                    </Label>
                    <Input
                      id={inspectorId}
                      className="h-7 text-xs"
                      placeholder="홍길동"
                      value={newInspector}
                      onChange={(e) => setNewInspector(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor={descId} className="text-[10px]">
                    점검 내용{" "}
                    <span aria-hidden="true">*</span>
                    <span className="sr-only">(필수)</span>
                  </Label>
                  <Input
                    id={descId}
                    required
                    aria-required="true"
                    className="h-7 text-xs"
                    placeholder="예: 전기 배선 상태 확인"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    onKeyDown={handleDescKeyDown}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={notesId} className="text-[10px]">
                    비고
                  </Label>
                  <Input
                    id={notesId}
                    className="h-7 text-xs"
                    placeholder="추가 메모"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setAddItemOpen(false)}
                  >
                    취소
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 text-xs"
                    onClick={handleAddItem}
                  >
                    추가
                  </Button>
                </div>
              </fieldset>
            )}

            {/* 하단 버튼 */}
            <div className="flex items-center gap-2 flex-wrap">
              {!addItemOpen && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setAddItemOpen(true)}
                  aria-label="점검 항목 추가"
                >
                  <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
                  항목 추가
                </Button>
              )}

              {/* 전체 결과 변경 */}
              <div
                className="flex items-center gap-1 ml-auto"
                role="group"
                aria-label="전체 점검 결과"
              >
                <span className="text-[10px] text-muted-foreground">
                  전체 결과:
                </span>
                <Select
                  value={inspection.overallStatus}
                  onValueChange={(v) =>
                    onSetOverall(v as SafetyInspection["overallStatus"])
                  }
                >
                  <SelectTrigger
                    className="h-6 w-28 text-[10px] px-1.5"
                    aria-label="전체 결과 선택"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved" className="text-xs">
                      승인
                    </SelectItem>
                    <SelectItem value="conditional" className="text-xs">
                      조건부 승인
                    </SelectItem>
                    <SelectItem value="rejected" className="text-xs">
                      불승인
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 서명자 */}
            {inspection.signedBy && (
              <p className="text-[10px] text-muted-foreground">
                서명자: {inspection.signedBy}
              </p>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
