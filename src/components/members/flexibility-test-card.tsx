"use client";

import { useState } from "react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useFlexibilityTest,
} from "@/hooks/use-flexibility-test";

import { ProgressBar, RecordRow } from "./flexibility-test-rows";
import { AddRecordDialog, AddItemDialog } from "./flexibility-test-dialogs";

// ============================================================
// Props
// ============================================================

interface FlexibilityTestCardProps {
  memberId: string;
  memberName?: string;
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

  function handleInit() {
    initDefaultItems();
    toast.success(TOAST.MEMBERS.FLEX_CARD_DEFAULT_ADDED);
  }

  function handleSaveTarget(itemId: string) {
    const val = parseFloat(targetInput);
    if (isNaN(val) || val <= 0) {
      toast.error(TOAST.MEMBERS.FLEX_CARD_GOAL_INVALID);
      return;
    }
    updateItemTarget(itemId, val);
    toast.success(TOAST.MEMBERS.FLEX_CARD_GOAL_SET);
    setTargetEditId(null);
    setTargetInput("");
  }

  function handleClearTarget(itemId: string) {
    updateItemTarget(itemId, undefined);
    toast.success(TOAST.MEMBERS.FLEX_CARD_GOAL_DELETED);
  }

  function handleDeleteItem(itemId: string, itemName: string) {
    deleteItem(itemId);
    toast.success(`"${itemName}" 항목이 삭제되었습니다.`);
  }

  function handleDeleteRecord(recordId: string) {
    deleteRecord(recordId);
    toast.success(TOAST.MEMBERS.FLEX_CARD_RECORD_DELETED);
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
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-md" />
                ))}
              </div>
            ) : items.length === 0 ? (
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
                                      ) : null}
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

      <AddRecordDialog
        open={addRecordOpen}
        onOpenChange={setAddRecordOpen}
        items={items}
        memberName={memberName}
        onSubmit={(date, entries, notes) => {
          if (entries.length === 0) {
            toast.error(TOAST.MEMBERS.FLEX_CARD_MIN_VALUE_REQUIRED);
            return;
          }
          addRecord(date, entries, notes);
          toast.success(TOAST.MEMBERS.FLEX_CARD_RECORD_ADDED);
          setAddRecordOpen(false);
        }}
      />

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
