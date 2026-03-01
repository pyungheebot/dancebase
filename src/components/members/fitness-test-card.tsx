"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAsyncAction } from "@/hooks/use-async-action";
import {
  Activity,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Users,
  ClipboardList,
  TrendingUp,
  Crown,
  X,
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
  useFitnessTest,
  FITNESS_CATEGORY_LABELS,
  FITNESS_CATEGORY_COLORS,
  FITNESS_CATEGORY_ORDER,
} from "@/hooks/use-fitness-test";
import type { FitnessTestCategory, FitnessTestItem, FitnessTestResult } from "@/types";

// ============================================================
// Props
// ============================================================

interface FitnessTestCardProps {
  groupId: string;
  memberNames: string[];
}

// ============================================================
// 메인 카드
// ============================================================

export function FitnessTestCard({ groupId, memberNames }: FitnessTestCardProps) {
  const {
    testItems,
    results,
    loading,
    addTestItem,
    deleteTestItem,
    addResult,
    deleteResult,
    stats,
  } = useFitnessTest(groupId);

  const [open, setOpen] = useState(false);
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);
  const [filterMember, setFilterMember] = useState<string>("__all__");

  // 날짜 내림차순 정렬 + 멤버 필터
  const filteredResults = results
    .filter((r) => filterMember === "__all__" || r.memberName === filterMember)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  function handleDeleteResult(id: string, memberName: string) {
    deleteResult(id);
    toast.success(`${memberName}님의 결과가 삭제되었습니다.`);
  }

  function handleDeleteItem(name: string) {
    deleteTestItem(name);
    toast.success(`"${name}" 항목이 삭제되었습니다.`);
  }

  return (
    <Card className="w-full">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader className="pb-2">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer select-none">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-rose-500" />
                <CardTitle className="text-sm font-semibold">
                  체력 테스트
                </CardTitle>
                <Badge className="text-[10px] px-1.5 py-0 bg-rose-100 text-rose-700 border-rose-300">
                  {stats.totalResults}건 기록
                </Badge>
                <Badge className="text-[10px] px-1.5 py-0 bg-slate-100 text-slate-700 border-slate-300">
                  {testItems.length}개 항목
                </Badge>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!open) setOpen(true);
                    setRecordDialogOpen(true);
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  결과 기록
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
            {/* 카테고리별 통계 요약 */}
            {stats.totalResults > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {FITNESS_CATEGORY_ORDER.map((cat) => {
                  const colors = FITNESS_CATEGORY_COLORS[cat];
                  const top = stats.topPerformer[cat];
                  return (
                    <div
                      key={cat}
                      className={`rounded-md border px-2 py-1.5 text-center ${colors.bg}`}
                    >
                      <p className={`text-[10px] font-semibold ${colors.text}`}>
                        {FITNESS_CATEGORY_LABELS[cat]}
                      </p>
                      {top ? (
                        <>
                          <div className="flex items-center justify-center gap-0.5 mt-0.5">
                            <Crown className={`h-2.5 w-2.5 ${colors.text}`} />
                            <p className="text-[10px] font-bold truncate max-w-[56px]">
                              {top.memberName}
                            </p>
                          </div>
                          <p className="text-[9px] text-muted-foreground">{top.value}</p>
                        </>
                      ) : (
                        <p className="text-[10px] text-muted-foreground mt-1">-</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* 로딩 */}
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-md" />
                ))}
              </div>
            ) : (
              <Tabs defaultValue="results">
                <TabsList className="h-8">
                  <TabsTrigger value="results" className="text-xs h-7 px-3">
                    <ClipboardList className="h-3 w-3 mr-1" />
                    테스트 결과
                  </TabsTrigger>
                  <TabsTrigger value="items" className="text-xs h-7 px-3">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    항목 관리
                  </TabsTrigger>
                </TabsList>

                {/* 테스트 결과 탭 */}
                <TabsContent value="results" className="mt-3 space-y-3">
                  {/* 멤버 필터 */}
                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <Select value={filterMember} onValueChange={setFilterMember}>
                      <SelectTrigger className="h-8 text-xs flex-1">
                        <SelectValue placeholder="전체 멤버" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__" className="text-xs">
                          전체 멤버
                        </SelectItem>
                        {memberNames.map((name) => (
                          <SelectItem key={name} value={name} className="text-xs">
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {filteredResults.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="h-10 w-10 mx-auto mb-2 opacity-20" />
                      <p className="text-xs">기록된 결과가 없습니다.</p>
                      <p className="text-[11px] mt-0.5">
                        위 버튼으로 첫 테스트 결과를 기록해보세요.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredResults.map((result) => (
                        <ResultCard
                          key={result.id}
                          result={result}
                          testItems={testItems}
                          onDelete={() =>
                            handleDeleteResult(result.id, result.memberName)
                          }
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* 항목 관리 탭 */}
                <TabsContent value="items" className="mt-3 space-y-4">
                  <AddItemForm onAdd={(name, cat, unit, higher) => {
                    addTestItem(name, cat, unit, higher);
                    toast.success(`"${name}" 항목이 추가되었습니다.`);
                  }} />

                  {testItems.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-20" />
                      <p className="text-xs">등록된 테스트 항목이 없습니다.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {FITNESS_CATEGORY_ORDER.map((cat) => {
                        const catItems = testItems.filter((item) => item.category === cat);
                        if (catItems.length === 0) return null;
                        const colors = FITNESS_CATEGORY_COLORS[cat];
                        return (
                          <div key={cat} className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge
                                className={`text-[10px] px-1.5 py-0 border ${colors.badge}`}
                              >
                                {FITNESS_CATEGORY_LABELS[cat]}
                              </Badge>
                              <span className="text-[11px] text-muted-foreground">
                                {catItems.length}개 항목
                              </span>
                            </div>
                            <div className="space-y-1.5 ml-1">
                              {catItems.map((item) => (
                                <TestItemRow
                                  key={item.name}
                                  item={item}
                                  onDelete={() => handleDeleteItem(item.name)}
                                />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>

      {/* 결과 기록 다이얼로그 */}
      <RecordResultDialog
        open={recordDialogOpen}
        onOpenChange={setRecordDialogOpen}
        testItems={testItems}
        memberNames={memberNames}
        onSubmit={(memberName, date, items, notes) => {
          addResult(memberName, date, items, notes);
          toast.success(`${memberName}님의 체력 테스트 결과가 기록되었습니다.`);
          setRecordDialogOpen(false);
        }}
      />
    </Card>
  );
}

// ============================================================
// 결과 카드 서브컴포넌트
// ============================================================

interface ResultCardProps {
  result: FitnessTestResult;
  testItems: FitnessTestItem[];
  onDelete: () => void;
}

function ResultCard({ result, testItems, onDelete }: ResultCardProps) {
  const [expanded, setExpanded] = useState(false);

  // 카테고리별 그룹화
  const byCategory = FITNESS_CATEGORY_ORDER.reduce<
    Record<FitnessTestCategory, typeof result.testItems>
  >(
    (acc, cat) => {
      acc[cat] = result.testItems.filter((ti) => ti.category === cat);
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

  // 카테고리별 최대값(정규화용)
  function getMax(cat: FitnessTestCategory): number {
    const vals = result.testItems
      .filter((ti) => ti.category === cat)
      .map((ti) => ti.value);
    return vals.length > 0 ? Math.max(...vals) : 1;
  }

  return (
    <div className="rounded-md border bg-background overflow-hidden">
      <div
        className="flex items-start justify-between px-3 py-2 gap-2 cursor-pointer"
        onClick={() => setExpanded((p) => !p)}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs font-semibold">{result.memberName}</p>
            <span className="text-[10px] text-muted-foreground">{result.date}</span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {result.testItems.length}개 항목
            </Badge>
            {result.overallScore !== undefined && (
              <Badge className="text-[10px] px-1.5 py-0 bg-rose-100 text-rose-700 border-rose-300">
                총점 {result.overallScore}
              </Badge>
            )}
          </div>
          {/* 카테고리 미니 바 */}
          <div className="flex gap-1 mt-1.5 flex-wrap">
            {FITNESS_CATEGORY_ORDER.map((cat) => {
              const catItems = byCategory[cat];
              if (catItems.length === 0) return null;
              const colors = FITNESS_CATEGORY_COLORS[cat];
              // 해당 카테고리 아이템들 중 평균값으로 바 표시
              const avg =
                catItems.reduce((sum, ti) => sum + ti.value, 0) / catItems.length;
              const itemDef = testItems.find(
                (it) => it.name === catItems[0]?.itemName
              );
              const higherIsBetter = itemDef?.higherIsBetter ?? true;
              // 같은 카테고리 전체 최대값은 단순히 avg/100 클램프
              const barPct = Math.min(100, Math.max(4, (avg / Math.max(getMax(cat), 1)) * 100));
              const _ = higherIsBetter; // suppress unused warning
              void _;
              return (
                <div key={cat} className="flex items-center gap-1">
                  <span className={`text-[9px] ${colors.text}`}>
                    {FITNESS_CATEGORY_LABELS[cat].slice(0, 2)}
                  </span>
                  <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${colors.bar}`}
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
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
        <div className="border-t px-3 py-2 space-y-3 bg-muted/20">
          {/* 카테고리별 항목 상세 */}
          {FITNESS_CATEGORY_ORDER.map((cat) => {
            const catItems = byCategory[cat];
            if (catItems.length === 0) return null;
            const colors = FITNESS_CATEGORY_COLORS[cat];
            const maxVal = getMax(cat);
            return (
              <div key={cat} className="space-y-1.5">
                <Badge className={`text-[10px] px-1.5 py-0 border ${colors.badge}`}>
                  {FITNESS_CATEGORY_LABELS[cat]}
                </Badge>
                <div className="space-y-1.5 ml-1">
                  {catItems.map((ti) => {
                    const itemDef = testItems.find((it) => it.name === ti.itemName);
                    const unit = itemDef?.unit ?? "";
                    const barPct = Math.min(
                      100,
                      Math.max(4, (ti.value / Math.max(maxVal, 1)) * 100)
                    );
                    return (
                      <div key={ti.itemName} className="space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-muted-foreground">
                            {ti.itemName}
                          </span>
                          <span className="text-[11px] font-semibold">
                            {ti.value}
                            {unit && (
                              <span className="font-normal text-muted-foreground ml-0.5">
                                {unit}
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full ${colors.bar} transition-all`}
                            style={{ width: `${barPct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {result.notes && (
            <div className="rounded-md bg-background border px-2.5 py-1.5">
              <p className="text-[10px] text-muted-foreground font-medium mb-0.5">
                메모
              </p>
              <p className="text-xs text-muted-foreground">{result.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// 테스트 항목 행 서브컴포넌트
// ============================================================

interface TestItemRowProps {
  item: FitnessTestItem;
  onDelete: () => void;
}

function TestItemRow({ item, onDelete }: TestItemRowProps) {
  const colors = FITNESS_CATEGORY_COLORS[item.category];
  return (
    <div className="flex items-center justify-between rounded-md border bg-background px-3 py-2 gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <p className="text-xs font-medium truncate">{item.name}</p>
        <span className="text-[10px] text-muted-foreground shrink-0">
          단위: {item.unit}
        </span>
        <span
          className={`text-[9px] shrink-0 ${
            item.higherIsBetter ? "text-green-600" : "text-orange-600"
          }`}
        >
          {item.higherIsBetter ? "높을수록 좋음" : "낮을수록 좋음"}
        </span>
      </div>
      <Button
        size="sm"
        variant="ghost"
        className={`h-6 w-6 p-0 shrink-0 ${colors.text} hover:text-destructive`}
        onClick={onDelete}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}

// ============================================================
// 항목 추가 폼 서브컴포넌트
// ============================================================

interface AddItemFormProps {
  onAdd: (
    name: string,
    category: FitnessTestCategory,
    unit: string,
    higherIsBetter: boolean
  ) => void;
}

function AddItemForm({ onAdd }: AddItemFormProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<FitnessTestCategory | "">("");
  const [unit, setUnit] = useState("");
  const [higherIsBetter, setHigherIsBetter] = useState(true);

  function handleAdd() {
    if (!name.trim()) {
      toast.error("항목명을 입력하세요.");
      return;
    }
    if (!category) {
      toast.error("카테고리를 선택하세요.");
      return;
    }
    if (!unit.trim()) {
      toast.error("단위를 입력하세요.");
      return;
    }
    onAdd(name.trim(), category, unit.trim(), higherIsBetter);
    setName("");
    setCategory("");
    setUnit("");
    setHigherIsBetter(true);
  }

  return (
    <div className="rounded-md border bg-muted/20 px-3 py-3 space-y-2.5">
      <p className="text-xs font-medium text-muted-foreground">새 항목 추가</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground">항목명</label>
          <Input
            placeholder="예: 앉아서 윗몸 굽히기"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-7 text-xs"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground">단위</label>
          <Input
            placeholder="예: cm, 초, 회"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="h-7 text-xs"
          />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-[10px] text-muted-foreground">카테고리</label>
        <div className="flex flex-wrap gap-1.5">
          {FITNESS_CATEGORY_ORDER.map((cat) => {
            const colors = FITNESS_CATEGORY_COLORS[cat];
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`text-[11px] px-2 py-1 rounded-md border font-medium transition-colors ${
                  category === cat
                    ? `${colors.badge} border-current`
                    : "bg-background text-muted-foreground border-border hover:bg-accent"
                }`}
              >
                {FITNESS_CATEGORY_LABELS[cat]}
              </button>
            );
          })}
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-[10px] text-muted-foreground">방향</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setHigherIsBetter(true)}
            className={`text-[11px] px-2.5 py-1 rounded-md border font-medium transition-colors ${
              higherIsBetter
                ? "bg-green-100 text-green-700 border-green-300"
                : "bg-background text-muted-foreground border-border hover:bg-accent"
            }`}
          >
            높을수록 좋음
          </button>
          <button
            type="button"
            onClick={() => setHigherIsBetter(false)}
            className={`text-[11px] px-2.5 py-1 rounded-md border font-medium transition-colors ${
              !higherIsBetter
                ? "bg-orange-100 text-orange-700 border-orange-300"
                : "bg-background text-muted-foreground border-border hover:bg-accent"
            }`}
          >
            낮을수록 좋음
          </button>
        </div>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="h-7 text-xs w-full"
        onClick={handleAdd}
      >
        <Plus className="h-3 w-3 mr-1" />
        항목 추가
      </Button>
    </div>
  );
}

// ============================================================
// 결과 기록 다이얼로그
// ============================================================

interface RecordResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testItems: FitnessTestItem[];
  memberNames: string[];
  onSubmit: (
    memberName: string,
    date: string,
    items: { itemName: string; value: number; category: FitnessTestCategory }[],
    notes?: string
  ) => void;
}

function RecordResultDialog({
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
      toast.error("멤버를 선택하세요.");
      return;
    }
    if (!date) {
      toast.error("날짜를 입력하세요.");
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
      toast.error("최소 하나 이상의 항목에 수치를 입력하세요.");
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
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4 text-rose-500" />
            체력 테스트 결과 기록
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* 멤버 + 날짜 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">
                멤버 <span className="text-destructive">*</span>
              </label>
              <Select value={memberName} onValueChange={setMemberName}>
                <SelectTrigger className="h-8 text-xs">
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
          </div>

          {/* 항목별 수치 입력 */}
          {testItems.length === 0 ? (
            <div className="rounded-md border bg-muted/20 px-3 py-4 text-center text-muted-foreground">
              <p className="text-xs">
                등록된 테스트 항목이 없습니다.
              </p>
              <p className="text-[11px] mt-0.5">
                항목 관리 탭에서 먼저 항목을 추가해주세요.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
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
                      {catItems.map((item) => (
                        <div key={item.name} className="flex items-center gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] text-muted-foreground truncate">
                              {item.name}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Input
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
                            />
                            <span className="text-[11px] text-muted-foreground w-6 shrink-0">
                              {item.unit}
                            </span>
                            {values[item.name] && (
                              <button
                                type="button"
                                onClick={() =>
                                  setValues((prev) => {
                                    const next = { ...prev };
                                    delete next[item.name];
                                    return next;
                                  })
                                }
                                className="text-muted-foreground hover:text-destructive"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
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
          >
            <Activity className="h-3 w-3 mr-1" />
            {submitting ? "기록 중..." : "결과 기록"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
