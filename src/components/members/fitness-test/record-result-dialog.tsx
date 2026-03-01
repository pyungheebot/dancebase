"use client";

import { useState } from "react";
import { Activity, X } from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useAsyncAction } from "@/hooks/use-async-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FITNESS_CATEGORY_LABELS,
  FITNESS_CATEGORY_COLORS,
  FITNESS_CATEGORY_ORDER,
} from "@/hooks/use-fitness-test";
import type { FitnessTestCategory, RecordResultDialogProps } from "./types";
import type { FitnessTestItem } from "./types";

const MEMBER_SELECT_ID = "record-result-member";
const DATE_INPUT_ID = "record-result-date";
const NOTES_ID = "record-result-notes";

/**
 * 체력 테스트 결과 기록 다이얼로그
 */
export function RecordResultDialog({
  open,
  onOpenChange,
  testItems,
  memberNames,
  onSubmit,
}: RecordResultDialogProps) {
  const [memberName, setMemberName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [values, setValues] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const { pending: submitting, execute } = useAsyncAction();

  function resetForm() {
    setMemberName("");
    setDate(new Date().toISOString().slice(0, 10));
    setValues({});
    setNotes("");
  }

  function handleClose() {
    resetForm();
    onOpenChange(false);
  }

  function handleSubmit() {
    if (!memberName) {
      toast.error(TOAST.MEMBERS.FITNESS_MEMBER_REQUIRED);
      return;
    }
    if (!date) {
      toast.error(TOAST.MEMBERS.FITNESS_DATE_REQUIRED);
      return;
    }

    const recordedItems = testItems
      .map((item) => ({
        itemName: item.name,
        value: parseFloat(values[item.name] ?? ""),
        category: item.category,
      }))
      .filter((it) => !isNaN(it.value));

    if (recordedItems.length === 0) {
      toast.error(TOAST.MEMBERS.FITNESS_MIN_VALUE_REQUIRED);
      return;
    }

    void execute(async () => {
      onSubmit(memberName, date, recordedItems, notes.trim() || undefined);
      resetForm();
    });
  }

  // 카테고리별 그룹화
  const itemsByCategory = FITNESS_CATEGORY_ORDER.reduce<
    Record<FitnessTestCategory, FitnessTestItem[]>
  >(
    (acc, cat) => {
      acc[cat] = testItems.filter((it) => it.category === cat);
      return acc;
    },
    {
      flexibility: [],
      endurance: [],
      strength: [],
      balance: [],
      agility: [],
      rhythm: [],
    }
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md max-h-[85vh] overflow-y-auto"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4 text-rose-500" aria-hidden="true" />
            체력 테스트 결과 기록
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* 멤버 + 날짜 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label
                htmlFor={MEMBER_SELECT_ID}
                className="text-xs text-muted-foreground font-medium"
              >
                멤버 <span className="text-destructive" aria-hidden="true">*</span>
                <span className="sr-only">(필수)</span>
              </label>
              <Select value={memberName} onValueChange={setMemberName}>
                <SelectTrigger id={MEMBER_SELECT_ID} className="h-8 text-xs" aria-required="true">
                  <SelectValue placeholder="멤버 선택" />
                </SelectTrigger>
                <SelectContent>
                  {memberNames.map((name) => (
                    <SelectItem key={name} value={name} className="text-xs">
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label
                htmlFor={DATE_INPUT_ID}
                className="text-xs text-muted-foreground font-medium"
              >
                측정일 <span className="text-destructive" aria-hidden="true">*</span>
                <span className="sr-only">(필수)</span>
              </label>
              <Input
                id={DATE_INPUT_ID}
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-8 text-xs"
                aria-required="true"
              />
            </div>
          </div>

          {/* 항목별 수치 입력 */}
          {testItems.length === 0 ? (
            <div
              role="status"
              className="rounded-md border bg-muted/20 px-3 py-4 text-center text-muted-foreground"
            >
              <p className="text-xs">등록된 테스트 항목이 없습니다.</p>
              <p className="text-[11px] mt-0.5">
                항목 관리 탭에서 먼저 항목을 추가해주세요.
              </p>
            </div>
          ) : (
            <div className="space-y-3" role="group" aria-label="항목별 측정값 입력">
              {FITNESS_CATEGORY_ORDER.map((cat) => {
                const catItems = itemsByCategory[cat];
                if (catItems.length === 0) return null;
                const colors = FITNESS_CATEGORY_COLORS[cat];
                return (
                  <div key={cat} className="space-y-2">
                    <Badge className={`text-[10px] px-1.5 py-0 border ${colors.badge}`}>
                      {FITNESS_CATEGORY_LABELS[cat]}
                    </Badge>
                    <div className="space-y-1.5 ml-1">
                      {catItems.map((item) => {
                        const inputId = `record-item-${item.name.replace(/\s+/g, "-")}`;
                        return (
                          <div key={item.name} className="flex items-center gap-2">
                            <div className="min-w-0 flex-1">
                              <label
                                htmlFor={inputId}
                                className="text-[11px] text-muted-foreground truncate block"
                              >
                                {item.name}
                              </label>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Input
                                id={inputId}
                                type="number"
                                placeholder="0"
                                value={values[item.name] ?? ""}
                                onChange={(e) =>
                                  setValues((prev) => ({
                                    ...prev,
                                    [item.name]: e.target.value,
                                  }))
                                }
                                className="h-7 text-xs w-20 text-right"
                                aria-label={`${item.name} 측정값 (${item.unit})`}
                              />
                              <span
                                className="text-[11px] text-muted-foreground w-6 shrink-0"
                                aria-hidden="true"
                              >
                                {item.unit}
                              </span>
                              {values[item.name] && (
                                <button
                                  type="button"
                                  aria-label={`${item.name} 값 지우기`}
                                  onClick={() =>
                                    setValues((prev) => {
                                      const next = { ...prev };
                                      delete next[item.name];
                                      return next;
                                    })
                                  }
                                  className="text-muted-foreground hover:text-destructive"
                                >
                                  <X className="h-3 w-3" aria-hidden="true" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 메모 */}
          <div className="space-y-1">
            <label
              htmlFor={NOTES_ID}
              className="text-xs text-muted-foreground font-medium"
            >
              메모 (선택)
            </label>
            <Textarea
              id={NOTES_ID}
              placeholder="특이사항이나 컨디션 메모"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs min-h-[56px] resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={handleClose}
            disabled={submitting}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSubmit}
            disabled={submitting}
            aria-busy={submitting}
          >
            <Activity className="h-3 w-3 mr-1" aria-hidden="true" />
            {submitting ? "기록 중..." : "결과 기록"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
