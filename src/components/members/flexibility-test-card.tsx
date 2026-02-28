"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Zap,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Target,
  History,
  ClipboardList,
  TrendingUp,
  TrendingDown,
  Minus,
  Settings,
  BarChart2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useFlexibilityTest,
  calcProgress,
  FLEXIBILITY_UNIT_LABELS,
  DEFAULT_FLEXIBILITY_ITEMS,
} from "@/hooks/use-flexibility-test";
import type { FlexibilityTestUnit, FlexibilityTestEntry } from "@/types";

// ============================================================
// Props
// ============================================================

interface FlexibilityTestCardProps {
  memberId: string;
  memberName?: string;
}

// ============================================================
// 진행률 바 컴포넌트
// ============================================================

function ProgressBar({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) {
  const clampedValue = Math.min(100, Math.max(0, value));
  const color =
    clampedValue >= 80
      ? "bg-green-500"
      : clampedValue >= 50
      ? "bg-blue-500"
      : clampedValue >= 30
      ? "bg-yellow-500"
      : "bg-rose-400";

  return (
    <div className={`w-full h-1.5 rounded-full bg-muted overflow-hidden ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-300 ${color}`}
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );
}

// ============================================================
// 메인 카드 컴포넌트
// ============================================================

export function FlexibilityTestCard({
  memberId,
  memberName,
}: FlexibilityTestCardProps) {
  const {
    items,
    records,
    loading,
    latestRecord,
    overallProgress,
    initDefaultItems,
    addItem,
    updateItemTarget,
    deleteItem,
    addRecord,
    deleteRecord,
    getLatestValue,
    getItemProgress,
    getItemHistory,
  } = useFlexibilityTest(memberId);

  const [open, setOpen] = useState(false);
  const [addRecordOpen, setAddRecordOpen] = useState(false);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [targetEditId, setTargetEditId] = useState<string | null>(null);
  const [targetInput, setTargetInput] = useState("");

  // 초기화 처리
  function handleInit() {
    initDefaultItems();
    toast.success("기본 유연성 테스트 항목이 추가되었습니다.");
  }

  // 목표값 저장
  function handleSaveTarget(itemId: string) {
    const val = parseFloat(targetInput);
    if (isNaN(val) || val <= 0) {
      toast.error("올바른 목표값을 입력하세요.");
      return;
    }
    updateItemTarget(itemId, val);
    toast.success("목표값이 설정되었습니다.");
    setTargetEditId(null);
    setTargetInput("");
  }

  // 목표값 삭제
  function handleClearTarget(itemId: string) {
    updateItemTarget(itemId, undefined);
    toast.success("목표값이 삭제되었습니다.");
  }

  // 항목 삭제
  function handleDeleteItem(itemId: string, itemName: string) {
    deleteItem(itemId);
    toast.success(`"${itemName}" 항목이 삭제되었습니다.`);
  }

  // 기록 삭제
  function handleDeleteRecord(recordId: string) {
    deleteRecord(recordId);
    toast.success("기록이 삭제되었습니다.");
  }

  return (
    <Card className="w-full">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader className="pb-2">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer select-none">
              <div className="flex items-center gap-2 flex-wrap">
                <Zap className="h-4 w-4 text-violet-500" />
                <CardTitle className="text-sm font-semibold">
                  유연성 테스트
                </CardTitle>
                <Badge className="text-[10px] px-1.5 py-0 bg-violet-100 text-violet-700 border-violet-300">
                  {records.length}건 기록
                </Badge>
                <Badge className="text-[10px] px-1.5 py-0 bg-slate-100 text-slate-700 border-slate-300">
                  {items.length}개 항목
                </Badge>
                {overallProgress !== null && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 border-green-300">
                    목표 {overallProgress}%
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!open) setOpen(true);
                    setAddRecordOpen(true);
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  기록 추가
                </Button>
                {open ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* 로딩 */}
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-md" />
                ))}
              </div>
            ) : items.length === 0 ? (
              /* 항목 없음 - 초기화 유도 */
              <div className="text-center py-8 text-muted-foreground space-y-3">
                <Zap className="h-10 w-10 mx-auto opacity-20" />
                <div>
                  <p className="text-xs font-medium">등록된 테스트 항목이 없습니다.</p>
                  <p className="text-[11px] mt-0.5">
                    기본 항목으로 시작하거나 직접 추가하세요.
                  </p>
                </div>
                <div className="flex justify-center gap-2">
                  <Button
                    size="sm"
                    className="h-7 text-xs"
                    onClick={handleInit}
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    기본 항목으로 시작
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => setAddItemOpen(true)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    직접 추가
                  </Button>
                </div>
              </div>
            ) : (
              <Tabs defaultValue="overview">
                <TabsList className="h-8">
                  <TabsTrigger value="overview" className="text-xs h-7 px-3">
                    <BarChart2 className="h-3 w-3 mr-1" />
                    현황
                  </TabsTrigger>
                  <TabsTrigger value="history" className="text-xs h-7 px-3">
                    <History className="h-3 w-3 mr-1" />
                    기록 이력
                  </TabsTrigger>
                  <TabsTrigger value="items" className="text-xs h-7 px-3">
                    <Settings className="h-3 w-3 mr-1" />
                    항목 관리
                  </TabsTrigger>
                </TabsList>

                {/* 현황 탭 */}
                <TabsContent value="overview" className="mt-3 space-y-3">
                  {overallProgress !== null && (
                    <div className="rounded-md border bg-muted/20 px-3 py-2.5">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium">전체 목표 달성률</span>
                        <span className="text-xs font-bold text-violet-600">
                          {overallProgress}%
                        </span>
                      </div>
                      <ProgressBar value={overallProgress} />
                    </div>
                  )}

                  {latestRecord && (
                    <p className="text-[11px] text-muted-foreground">
                      최근 측정일: {latestRecord.date}
                    </p>
                  )}

                  <div className="space-y-2">
                    {items.map((item) => {
                      const latest = getLatestValue(item.id);
                      const progress = getItemProgress(item.id);
                      const history = getItemHistory(item.id);
                      const prevValue =
                        history.length >= 2
                          ? history[history.length - 2].value
                          : null;
                      const diff =
                        latest !== null && prevValue !== null
                          ? latest - prevValue
                          : null;
                      const improved =
                        diff === null
                          ? null
                          : item.higherIsBetter
                          ? diff > 0
                          : diff < 0;

                      return (
                        <div
                          key={item.id}
                          className="rounded-md border bg-background px-3 py-2.5 space-y-1.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-xs font-medium truncate">
                                {item.name}
                              </p>
                              {item.description && (
                                <p className="text-[10px] text-muted-foreground truncate">
                                  {item.description}
                                </p>
                              )}
                            </div>
                            <div className="shrink-0 text-right">
                              {latest !== null ? (
                                <div className="flex items-center gap-1">
                                  {diff !== null && (
                                    <span
                                      className={`text-[10px] flex items-center gap-0.5 ${
                                        improved
                                          ? "text-green-600"
                                          : improved === false
                                          ? "text-rose-500"
                                          : "text-muted-foreground"
                                      }`}
                                    >
                                      {improved ? (
                                        <TrendingUp className="h-2.5 w-2.5" />
                                      ) : improved === false ? (
                                        <TrendingDown className="h-2.5 w-2.5" />
                                      ) : (
                                        <Minus className="h-2.5 w-2.5" />
                                      )}
                                      {diff > 0 ? "+" : ""}
                                      {diff.toFixed(1)}
                                    </span>
                                  )}
                                  <span className="text-sm font-bold">
                                    {latest}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">
                                    {item.unit}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[10px] text-muted-foreground">
                                  미측정
                                </span>
                              )}
                              {item.targetValue !== undefined && (
                                <p className="text-[10px] text-muted-foreground">
                                  목표:{" "}
                                  <span className="font-medium">
                                    {item.targetValue}
                                    {item.unit}
                                  </span>
                                </p>
                              )}
                            </div>
                          </div>

                          {/* 진행률 바 */}
                          {progress !== null && (
                            <div className="space-y-0.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-muted-foreground">
                                  목표 달성률
                                </span>
                                <span
                                  className={`text-[10px] font-semibold ${
                                    progress >= 80
                                      ? "text-green-600"
                                      : progress >= 50
                                      ? "text-blue-600"
                                      : "text-rose-500"
                                  }`}
                                >
                                  {progress}%
                                </span>
                              </div>
                              <ProgressBar value={progress} />
                            </div>
                          )}

                          {/* 미니 이력 바 */}
                          {history.length >= 2 && (
                            <div className="flex items-end gap-0.5 h-6 mt-1">
                              {history.slice(-8).map((h, idx) => {
                                const maxVal = Math.max(...history.slice(-8).map((x) => x.value));
                                const minVal = Math.min(...history.slice(-8).map((x) => x.value));
                                const range = maxVal - minVal || 1;
                                const heightPct = item.higherIsBetter
                                  ? ((h.value - minVal) / range) * 100
                                  : ((maxVal - h.value) / range) * 100;
                                const barH = Math.max(15, Math.round(heightPct));
                                return (
                                  <div
                                    key={idx}
                                    className="flex-1 bg-violet-400 rounded-sm opacity-70"
                                    style={{ height: `${barH}%` }}
                                    title={`${h.date}: ${h.value}${item.unit}`}
                                  />
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </TabsContent>

                {/* 기록 이력 탭 */}
                <TabsContent value="history" className="mt-3 space-y-3">
                  {records.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-20" />
                      <p className="text-xs">기록된 이력이 없습니다.</p>
                      <p className="text-[11px] mt-0.5">
                        위 버튼으로 첫 측정 결과를 기록해보세요.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {records.map((rec) => (
                        <RecordRow
                          key={rec.id}
                          record={rec}
                          items={items}
                          onDelete={() => handleDeleteRecord(rec.id)}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* 항목 관리 탭 */}
                <TabsContent value="items" className="mt-3 space-y-3">
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => setAddItemOpen(true)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      항목 추가
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-md border bg-background px-3 py-2.5 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-medium">{item.name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 py-0"
                              >
                                단위: {item.unit}
                              </Badge>
                              <span
                                className={`text-[10px] ${
                                  item.higherIsBetter
                                    ? "text-green-600"
                                    : "text-orange-500"
                                }`}
                              >
                                {item.higherIsBetter
                                  ? "높을수록 좋음"
                                  : "낮을수록 좋음"}
                              </span>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive shrink-0"
                            onClick={() => handleDeleteItem(item.id, item.name)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>

                        {/* 목표값 설정 */}
                        <div className="flex items-center gap-2">
                          <Target className="h-3 w-3 text-muted-foreground shrink-0" />
                          {targetEditId === item.id ? (
                            <div className="flex items-center gap-1 flex-1">
                              <Input
                                type="number"
                                placeholder="목표값"
                                value={targetInput}
                                onChange={(e) => setTargetInput(e.target.value)}
                                className="h-6 text-xs w-20"
                                autoFocus
                              />
                              <span className="text-[11px] text-muted-foreground">
                                {item.unit}
                              </span>
                              <Button
                                size="sm"
                                className="h-6 text-[10px] px-2"
                                onClick={() => handleSaveTarget(item.id)}
                              >
                                저장
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 text-[10px] px-2"
                                onClick={() => {
                                  setTargetEditId(null);
                                  setTargetInput("");
                                }}
                              >
                                취소
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 flex-1">
                              <span className="text-[11px] text-muted-foreground">
                                목표값:{" "}
                                {item.targetValue !== undefined ? (
                                  <span className="font-medium text-foreground">
                                    {item.targetValue}
                                    {item.unit}
                                  </span>
                                ) : (
                                  "미설정"
                                )}
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 text-[10px] px-2 ml-auto"
                                onClick={() => {
                                  setTargetEditId(item.id);
                                  setTargetInput(
                                    item.targetValue?.toString() ?? ""
                                  );
                                }}
                              >
                                <Target className="h-2.5 w-2.5 mr-1" />
                                {item.targetValue !== undefined
                                  ? "수정"
                                  : "설정"}
                              </Button>
                              {item.targetValue !== undefined && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 text-[10px] px-1 text-muted-foreground hover:text-destructive"
                                  onClick={() => handleClearTarget(item.id)}
                                >
                                  <Trash2 className="h-2.5 w-2.5" />
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>

      {/* 기록 추가 다이얼로그 */}
      <AddRecordDialog
        open={addRecordOpen}
        onOpenChange={setAddRecordOpen}
        items={items}
        memberName={memberName}
        onSubmit={(date, entries, notes) => {
          if (entries.length === 0) {
            toast.error("최소 하나 이상의 항목에 값을 입력하세요.");
            return;
          }
          addRecord(date, entries, notes);
          toast.success("유연성 테스트 기록이 추가되었습니다.");
          setAddRecordOpen(false);
        }}
      />

      {/* 항목 추가 다이얼로그 */}
      <AddItemDialog
        open={addItemOpen}
        onOpenChange={setAddItemOpen}
        existingNames={items.map((i) => i.name)}
        onSubmit={(name, unit, higherIsBetter, targetValue, description) => {
          addItem(name, unit, higherIsBetter, targetValue, description);
          toast.success(`"${name}" 항목이 추가되었습니다.`);
          setAddItemOpen(false);
        }}
      />
    </Card>
  );
}

// ============================================================
// 기록 행 서브컴포넌트
// ============================================================

interface RecordRowProps {
  record: {
    id: string;
    date: string;
    entries: FlexibilityTestEntry[];
    notes?: string;
  };
  items: Array<{
    id: string;
    name: string;
    unit: string;
  }>;
  onDelete: () => void;
}

function RecordRow({ record, items, onDelete }: RecordRowProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-md border bg-background overflow-hidden">
      <div
        className="flex items-start justify-between px-3 py-2 gap-2 cursor-pointer"
        onClick={() => setExpanded((p) => !p)}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold">{record.date}</span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {record.entries.length}개 측정
            </Badge>
          </div>
          {/* 미니 항목 요약 */}
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
            {record.entries.slice(0, 4).map((entry) => {
              const item = items.find((i) => i.id === entry.itemId);
              if (!item) return null;
              return (
                <span key={entry.itemId} className="text-[10px] text-muted-foreground">
                  {item.name.slice(0, 6)}:{" "}
                  <span className="font-medium text-foreground">
                    {entry.value}
                    {item.unit}
                  </span>
                </span>
              );
            })}
            {record.entries.length > 4 && (
              <span className="text-[10px] text-muted-foreground">
                +{record.entries.length - 4}개
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
          {expanded ? (
            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="border-t px-3 py-2 space-y-1.5 bg-muted/20">
          {record.entries.map((entry) => {
            const item = items.find((i) => i.id === entry.itemId);
            if (!item) return null;
            return (
              <div key={entry.itemId} className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">
                  {item.name}
                </span>
                <span className="text-[11px] font-semibold">
                  {entry.value}
                  <span className="font-normal text-muted-foreground ml-0.5">
                    {item.unit}
                  </span>
                </span>
              </div>
            );
          })}
          {record.notes && (
            <div className="rounded-md bg-background border px-2.5 py-1.5 mt-2">
              <p className="text-[10px] text-muted-foreground font-medium mb-0.5">
                메모
              </p>
              <p className="text-xs text-muted-foreground">{record.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// 기록 추가 다이얼로그
// ============================================================

interface AddRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: Array<{
    id: string;
    name: string;
    unit: string;
    higherIsBetter: boolean;
    targetValue?: number;
  }>;
  memberName?: string;
  onSubmit: (
    date: string,
    entries: FlexibilityTestEntry[],
    notes?: string
  ) => void;
}

function AddRecordDialog({
  open,
  onOpenChange,
  items,
  memberName,
  onSubmit,
}: AddRecordDialogProps) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [values, setValues] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");

  function resetForm() {
    setDate(new Date().toISOString().slice(0, 10));
    setValues({});
    setNotes("");
  }

  function handleClose() {
    resetForm();
    onOpenChange(false);
  }

  function handleSubmit() {
    if (!date) {
      toast.error("날짜를 입력하세요.");
      return;
    }
    const entries: FlexibilityTestEntry[] = items
      .map((item) => ({
        itemId: item.id,
        value: parseFloat(values[item.id] ?? ""),
      }))
      .filter((e) => !isNaN(e.value));

    onSubmit(date, entries, notes.trim() || undefined);
    resetForm();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <Zap className="h-4 w-4 text-violet-500" />
            유연성 테스트 기록 추가
            {memberName && (
              <span className="text-muted-foreground font-normal">
                — {memberName}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* 날짜 */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">
              측정일 <span className="text-destructive">*</span>
            </label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* 항목별 값 입력 */}
          {items.length === 0 ? (
            <div className="rounded-md border bg-muted/20 px-3 py-4 text-center text-muted-foreground">
              <p className="text-xs">등록된 테스트 항목이 없습니다.</p>
              <p className="text-[11px] mt-0.5">
                항목 관리 탭에서 먼저 항목을 추가하세요.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground font-medium">
                측정값 입력
              </label>
              {items.map((item) => {
                const val = parseFloat(values[item.id] ?? "");
                const progress =
                  item.targetValue !== undefined && !isNaN(val)
                    ? calcProgress(val, item.targetValue, item.higherIsBetter)
                    : null;

                return (
                  <div
                    key={item.id}
                    className="rounded-md border bg-background px-3 py-2 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-medium truncate">
                          {item.name}
                        </p>
                        {item.targetValue !== undefined && (
                          <p className="text-[10px] text-muted-foreground">
                            목표: {item.targetValue}
                            {item.unit}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Input
                          type="number"
                          placeholder="0"
                          value={values[item.id] ?? ""}
                          onChange={(e) =>
                            setValues((prev) => ({
                              ...prev,
                              [item.id]: e.target.value,
                            }))
                          }
                          className="h-7 text-xs w-20 text-right"
                        />
                        <span className="text-[11px] text-muted-foreground w-6 shrink-0">
                          {item.unit}
                        </span>
                      </div>
                    </div>
                    {progress !== null && (
                      <div className="space-y-0.5">
                        <div className="flex justify-between">
                          <span className="text-[10px] text-muted-foreground">
                            목표 달성률
                          </span>
                          <span
                            className={`text-[10px] font-semibold ${
                              progress >= 80
                                ? "text-green-600"
                                : progress >= 50
                                ? "text-blue-600"
                                : "text-rose-500"
                            }`}
                          >
                            {progress}%
                          </span>
                        </div>
                        <ProgressBar value={progress} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 메모 */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">
              메모 (선택)
            </label>
            <Textarea
              placeholder="컨디션, 특이사항 등을 기록하세요"
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
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            <Zap className="h-3 w-3 mr-1" />
            기록 저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 항목 추가 다이얼로그
// ============================================================

interface AddItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingNames: string[];
  onSubmit: (
    name: string,
    unit: FlexibilityTestUnit,
    higherIsBetter: boolean,
    targetValue?: number,
    description?: string
  ) => void;
}

function AddItemDialog({
  open,
  onOpenChange,
  existingNames,
  onSubmit,
}: AddItemDialogProps) {
  const [name, setName] = useState("");
  const [unit, setUnit] = useState<FlexibilityTestUnit>("cm");
  const [higherIsBetter, setHigherIsBetter] = useState(true);
  const [targetValue, setTargetValue] = useState("");
  const [description, setDescription] = useState("");
  const [usePreset, setUsePreset] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState("");

  function resetForm() {
    setName("");
    setUnit("cm");
    setHigherIsBetter(true);
    setTargetValue("");
    setDescription("");
    setUsePreset(false);
    setSelectedPreset("");
  }

  function handleClose() {
    resetForm();
    onOpenChange(false);
  }

  function handlePresetSelect(presetName: string) {
    setSelectedPreset(presetName);
    const preset = DEFAULT_FLEXIBILITY_ITEMS.find((p) => p.name === presetName);
    if (preset) {
      setName(preset.name);
      setUnit(preset.unit as FlexibilityTestUnit);
      setHigherIsBetter(preset.higherIsBetter);
      setDescription(preset.description ?? "");
    }
  }

  function handleSubmit() {
    if (!name.trim()) {
      toast.error("항목명을 입력하세요.");
      return;
    }
    if (existingNames.includes(name.trim())) {
      toast.error("이미 존재하는 항목명입니다.");
      return;
    }
    const tv = targetValue ? parseFloat(targetValue) : undefined;
    if (targetValue && (isNaN(tv!) || tv! <= 0)) {
      toast.error("올바른 목표값을 입력하세요.");
      return;
    }
    onSubmit(
      name.trim(),
      unit,
      higherIsBetter,
      tv,
      description.trim() || undefined
    );
    resetForm();
  }

  const availablePresets = DEFAULT_FLEXIBILITY_ITEMS.filter(
    (p) => !existingNames.includes(p.name)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <Plus className="h-4 w-4 text-violet-500" />
            테스트 항목 추가
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* 프리셋 / 직접 입력 선택 */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setUsePreset(false)}
              className={`flex-1 text-[11px] py-1.5 rounded-md border font-medium transition-colors ${
                !usePreset
                  ? "bg-violet-100 text-violet-700 border-violet-300"
                  : "bg-background text-muted-foreground border-border hover:bg-accent"
              }`}
            >
              직접 입력
            </button>
            <button
              type="button"
              onClick={() => setUsePreset(true)}
              className={`flex-1 text-[11px] py-1.5 rounded-md border font-medium transition-colors ${
                usePreset
                  ? "bg-violet-100 text-violet-700 border-violet-300"
                  : "bg-background text-muted-foreground border-border hover:bg-accent"
              }`}
              disabled={availablePresets.length === 0}
            >
              기본 항목에서 선택
              {availablePresets.length === 0 && " (모두 추가됨)"}
            </button>
          </div>

          {usePreset && availablePresets.length > 0 && (
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">
                기본 항목 선택
              </label>
              <Select value={selectedPreset} onValueChange={handlePresetSelect}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="항목 선택..." />
                </SelectTrigger>
                <SelectContent>
                  {availablePresets.map((p) => (
                    <SelectItem key={p.name} value={p.name} className="text-xs">
                      {p.name} ({p.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 항목명 */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">
              항목명 <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="예: 앞으로 굽히기"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* 단위 */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">
              단위 <span className="text-destructive">*</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(FLEXIBILITY_UNIT_LABELS) as FlexibilityTestUnit[]).map(
                (u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setUnit(u)}
                    className={`text-[11px] px-2.5 py-1 rounded-md border font-medium transition-colors ${
                      unit === u
                        ? "bg-violet-100 text-violet-700 border-violet-300"
                        : "bg-background text-muted-foreground border-border hover:bg-accent"
                    }`}
                  >
                    {FLEXIBILITY_UNIT_LABELS[u]}
                  </button>
                )
              )}
            </div>
          </div>

          {/* 방향 */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">
              측정 방향
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setHigherIsBetter(true)}
                className={`flex-1 text-[11px] py-1.5 rounded-md border font-medium transition-colors ${
                  higherIsBetter
                    ? "bg-green-100 text-green-700 border-green-300"
                    : "bg-background text-muted-foreground border-border hover:bg-accent"
                }`}
              >
                <TrendingUp className="h-3 w-3 inline mr-1" />
                높을수록 좋음
              </button>
              <button
                type="button"
                onClick={() => setHigherIsBetter(false)}
                className={`flex-1 text-[11px] py-1.5 rounded-md border font-medium transition-colors ${
                  !higherIsBetter
                    ? "bg-orange-100 text-orange-700 border-orange-300"
                    : "bg-background text-muted-foreground border-border hover:bg-accent"
                }`}
              >
                <TrendingDown className="h-3 w-3 inline mr-1" />
                낮을수록 좋음
              </button>
            </div>
          </div>

          {/* 목표값 */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">
              목표값 (선택)
            </label>
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                placeholder="목표값"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                className="h-8 text-xs flex-1"
              />
              <span className="text-xs text-muted-foreground shrink-0">
                {unit}
              </span>
            </div>
          </div>

          {/* 설명 */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">
              설명 (선택)
            </label>
            <Textarea
              placeholder="측정 방법이나 참고 사항"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-xs min-h-[48px] resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={handleClose}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            <Plus className="h-3 w-3 mr-1" />
            항목 추가
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
