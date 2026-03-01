"use client";

import { useState, useEffect, startTransition } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, GripVertical, RotateCcw, LayoutGrid } from "lucide-react";
import type { DashboardOrderItem } from "@/hooks/use-dashboard-order";

type Props = {
  cards: DashboardOrderItem[];
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onReset: () => void;
};

export function DashboardCardReorder({ cards, onMoveUp, onMoveDown, onReset }: Props) {
  const [open, setOpen] = useState(false);
  // 로컬 미리보기용 순서 (Sheet가 열릴 때 복사)
  const [localCards, setLocalCards] = useState<DashboardOrderItem[]>(cards);

  useEffect(() => {
    if (open) {
      startTransition(() => { setLocalCards(cards); });
    }
  }, [open, cards]);

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const next = [...localCards];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    setLocalCards(next);
    onMoveUp(index);
  };

  const handleMoveDown = (index: number) => {
    if (index >= localCards.length - 1) return;
    const next = [...localCards];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    setLocalCards(next);
    onMoveDown(index);
  };

  const handleReset = () => {
    onReset();
    // 부모 상태 반영 후 로컬 업데이트는 useEffect에서 처리
    // 즉시 UI 반영을 위해 cards prop을 사용할 수 없으므로
    // 리셋 후 Sheet를 닫았다가 다시 열면 기본 순서 반영됨
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs gap-1 px-2"
          aria-label="카드 순서 조정"
        >
          <LayoutGrid className="h-3 w-3" />
          순서 조정
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-72 sm:max-w-xs p-0">
        <SheetHeader className="px-4 pt-4 pb-2 border-b">
          <SheetTitle className="text-xs font-semibold flex items-center gap-1.5">
            <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
            대시보드 카드 순서
          </SheetTitle>
          <p className="text-[10px] text-muted-foreground">
            위/아래 버튼으로 카드 순서를 변경합니다.
          </p>
        </SheetHeader>

        <div className="px-3 py-2 space-y-1 flex-1 overflow-y-auto">
          {localCards.map((card, index) => (
            <div
              key={card.id}
              className="flex items-center gap-1.5 rounded border bg-background px-2 py-1.5 hover:bg-muted/40 transition-colors"
            >
              {/* 순서 번호 배지 */}
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 min-w-[1.25rem] justify-center shrink-0 tabular-nums"
              >
                {index + 1}
              </Badge>

              {/* 카드 이름 */}
              <span className="flex-1 text-xs truncate">{card.label}</span>

              {/* 위/아래 버튼 */}
              <div className="flex gap-0.5 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  disabled={index === 0}
                  onClick={() => handleMoveUp(index)}
                  aria-label={`${card.label} 위로 이동`}
                >
                  <ArrowUp className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  disabled={index === localCards.length - 1}
                  onClick={() => handleMoveDown(index)}
                  aria-label={`${card.label} 아래로 이동`}
                >
                  <ArrowDown className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}

          {localCards.length === 0 && (
            <p className="text-[11px] text-muted-foreground text-center py-4">
              표시 중인 카드가 없습니다.
            </p>
          )}
        </div>

        <SheetFooter className="flex-row gap-2 px-3 py-3 border-t mt-auto">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1 flex-1"
            onClick={handleReset}
          >
            <RotateCcw className="h-3 w-3" />
            기본 순서로 초기화
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs px-3"
            onClick={() => setOpen(false)}
          >
            완료
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
