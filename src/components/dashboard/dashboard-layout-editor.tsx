"use client";

import { useState, useEffect, startTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Settings,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { useDashboardLayout } from "@/hooks/use-dashboard-layout";
import { DASHBOARD_WIDGETS } from "@/types";
import type { DashboardWidgetId, DashboardWidgetItem } from "@/types";

// ============================================
// 내부 상태용 타입: 위젯 메타 + 레이아웃 정보 결합
// ============================================

type WidgetRow = DashboardWidgetItem & {
  label: string;
};

// ============================================
// 메인 컴포넌트
// ============================================

export function DashboardLayoutEditor() {
  const [open, setOpen] = useState(false);
  const { layout, applyLayout, resetLayout } = useDashboardLayout();

  // 다이얼로그 내부 로컬 상태 (적용 버튼 클릭 전까지 실제 저장소에 반영되지 않음)
  const [localRows, setLocalRows] = useState<WidgetRow[]>([]);

  // 다이얼로그가 열릴 때 현재 레이아웃 복사
  useEffect(() => {
    if (open) {
      const rows: WidgetRow[] = layout
        .map((item) => {
          const meta = DASHBOARD_WIDGETS.find((w) => w.id === item.id);
          return meta ? { ...item, label: meta.label } : null;
        })
        .filter((row): row is WidgetRow => row !== null)
        .sort((a, b) => a.order - b.order);
      startTransition(() => { setLocalRows(rows); });
    }
  }, [open, layout]);

  // 로컬: 토글
  const handleToggle = (id: DashboardWidgetId) => {
    setLocalRows((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, visible: !row.visible } : row
      )
    );
  };

  // 로컬: 위로 이동
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    setLocalRows((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next.map((row, i) => ({ ...row, order: i }));
    });
  };

  // 로컬: 아래로 이동
  const handleMoveDown = (index: number) => {
    setLocalRows((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next.map((row, i) => ({ ...row, order: i }));
    });
  };

  // 초기화: 기본 레이아웃으로 되돌리고 로컬 상태도 갱신
  const handleReset = () => {
    resetLayout();
    const defaultRows: WidgetRow[] = DASHBOARD_WIDGETS.map((w, i) => ({
      id: w.id,
      label: w.label,
      visible: true,
      order: i,
    }));
    setLocalRows(defaultRows);
    toast.success("대시보드 레이아웃이 초기화되었습니다.");
  };

  // 적용: 로컬 상태를 실제 저장소에 한 번에 반영
  const handleApply = () => {
    const newLayout = localRows.map((row, i) => ({
      id: row.id,
      visible: row.visible,
      order: i,
    }));
    applyLayout(newLayout);
    toast.success("대시보드 레이아웃이 저장되었습니다.");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs gap-1 px-2"
          aria-label="대시보드 레이아웃 설정"
        >
          <Settings className="h-3 w-3" />
          위젯 설정
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-sm p-0 gap-0">
        <DialogHeader className="px-4 pt-4 pb-2 border-b">
          <DialogTitle className="text-sm font-semibold flex items-center gap-1.5">
            <Settings className="h-3.5 w-3.5 text-muted-foreground" />
            대시보드 위젯 설정
          </DialogTitle>
          <p className="text-[11px] text-muted-foreground">
            표시할 위젯을 선택하고 순서를 조정합니다.
          </p>
        </DialogHeader>

        {/* 위젯 목록 */}
        <div className="px-3 py-2 space-y-1 max-h-80 overflow-y-auto">
          {localRows.map((row, index) => (
            <div
              key={row.id}
              className={`flex items-center gap-2 rounded border px-2.5 py-1.5 transition-colors ${
                row.visible
                  ? "bg-background hover:bg-muted/40"
                  : "bg-muted/20 opacity-60"
              }`}
            >
              {/* 체크박스 */}
              <Checkbox
                id={`widget-${row.id}`}
                checked={row.visible}
                onCheckedChange={() => handleToggle(row.id)}
                aria-label={`${row.label} 표시 여부`}
              />

              {/* 가시성 아이콘 */}
              <span
                className={`shrink-0 ${
                  row.visible ? "text-foreground" : "text-muted-foreground"
                }`}
                aria-hidden
              >
                {row.visible ? (
                  <Eye className="h-3 w-3" />
                ) : (
                  <EyeOff className="h-3 w-3" />
                )}
              </span>

              {/* 위젯 라벨 */}
              <label
                htmlFor={`widget-${row.id}`}
                className={`flex-1 text-xs cursor-pointer select-none ${
                  row.visible ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {row.label}
              </label>

              {/* 위/아래 이동 버튼 */}
              <div className="flex gap-0.5 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  disabled={index === 0}
                  onClick={() => handleMoveUp(index)}
                  aria-label={`${row.label} 위로 이동`}
                >
                  <ChevronUp className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  disabled={index === localRows.length - 1}
                  onClick={() => handleMoveDown(index)}
                  aria-label={`${row.label} 아래로 이동`}
                >
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}

          {localRows.length === 0 && (
            <p className="text-[11px] text-muted-foreground text-center py-4">
              위젯이 없습니다.
            </p>
          )}
        </div>

        {/* 하단 버튼 */}
        <DialogFooter className="flex-row gap-2 px-3 py-3 border-t">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1 flex-1"
            onClick={handleReset}
          >
            <RotateCcw className="h-3 w-3" />
            초기화
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs px-4 flex-1"
            onClick={handleApply}
          >
            적용
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
