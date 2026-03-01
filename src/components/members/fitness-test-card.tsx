"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Activity,
  ChevronDown,
  ChevronUp,
  Plus,
  Users,
  ClipboardList,
  TrendingUp,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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

// 서브 컴포넌트
import { CategoryStats } from "./fitness-test/category-stats";
import { ResultCard } from "./fitness-test/result-card";
import { TestItemRow } from "./fitness-test/test-item-row";
import { AddItemForm } from "./fitness-test/add-item-form";
import { RecordResultDialog } from "./fitness-test/record-result-dialog";

// ============================================================
// Props
// ============================================================

interface FitnessTestCardProps {
  groupId: string;
  memberNames: string[];
}

// ============================================================
// 메인 카드 컨테이너
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

  const memberFilterId = "fitness-member-filter";

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

  function handleOpenRecord(e: React.MouseEvent) {
    e.stopPropagation();
    if (!open) setOpen(true);
    setRecordDialogOpen(true);
  }

  return (
    <Card className="w-full">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader className="pb-2">
          <CollapsibleTrigger asChild>
            <div
              role="button"
              tabIndex={0}
              aria-expanded={open}
              aria-controls="fitness-collapsible-content"
              className="flex items-center justify-between cursor-pointer select-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setOpen((prev) => !prev);
                }
              }}
            >
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-rose-500" aria-hidden="true" />
                <CardTitle className="text-sm font-semibold">
                  체력 테스트
                </CardTitle>
                <Badge className="text-[10px] px-1.5 py-0 bg-rose-100 text-rose-700 border-rose-300">
                  <span className="sr-only">총 기록 수: </span>
                  {stats.totalResults}건 기록
                </Badge>
                <Badge className="text-[10px] px-1.5 py-0 bg-slate-100 text-slate-700 border-slate-300">
                  <span className="sr-only">등록된 항목 수: </span>
                  {testItems.length}개 항목
                </Badge>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleOpenRecord}
                  aria-label="체력 테스트 결과 기록 다이얼로그 열기"
                >
                  <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
                  결과 기록
                </Button>
                {open ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                )}
              </div>
            </div>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent id="fitness-collapsible-content">
          <CardContent className="pt-0 space-y-4">
            {/* 카테고리별 통계 요약 */}
            <CategoryStats stats={stats} />

            {/* 로딩 */}
            {loading ? (
              <div
                role="status"
                aria-label="데이터 로딩 중"
                className="space-y-2"
              >
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-md" />
                ))}
              </div>
            ) : (
              <Tabs defaultValue="results">
                <TabsList className="h-8">
                  <TabsTrigger value="results" className="text-xs h-7 px-3">
                    <ClipboardList className="h-3 w-3 mr-1" aria-hidden="true" />
                    테스트 결과
                  </TabsTrigger>
                  <TabsTrigger value="items" className="text-xs h-7 px-3">
                    <TrendingUp className="h-3 w-3 mr-1" aria-hidden="true" />
                    항목 관리
                  </TabsTrigger>
                </TabsList>

                {/* 테스트 결과 탭 */}
                <TabsContent value="results" className="mt-3 space-y-3">
                  {/* 멤버 필터 */}
                  <div className="flex items-center gap-2">
                    <label htmlFor={memberFilterId} className="sr-only">
                      멤버 필터
                    </label>
                    <Users
                      className="h-3.5 w-3.5 text-muted-foreground shrink-0"
                      aria-hidden="true"
                    />
                    <Select value={filterMember} onValueChange={setFilterMember}>
                      <SelectTrigger
                        id={memberFilterId}
                        className="h-8 text-xs flex-1"
                      >
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
                    <div
                      role="status"
                      className="text-center py-8 text-muted-foreground"
                    >
                      <Activity
                        className="h-10 w-10 mx-auto mb-2 opacity-20"
                        aria-hidden="true"
                      />
                      <p className="text-xs">기록된 결과가 없습니다.</p>
                      <p className="text-[11px] mt-0.5">
                        위 버튼으로 첫 테스트 결과를 기록해보세요.
                      </p>
                    </div>
                  ) : (
                    <div
                      role="list"
                      aria-label="테스트 결과 목록"
                      aria-live="polite"
                      className="space-y-3"
                    >
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
                  <AddItemForm
                    onAdd={(name, cat, unit, higher) => {
                      addTestItem(name, cat, unit, higher);
                      toast.success(`"${name}" 항목이 추가되었습니다.`);
                    }}
                  />

                  {testItems.length === 0 ? (
                    <div
                      role="status"
                      className="text-center py-6 text-muted-foreground"
                    >
                      <TrendingUp
                        className="h-8 w-8 mx-auto mb-2 opacity-20"
                        aria-hidden="true"
                      />
                      <p className="text-xs">등록된 테스트 항목이 없습니다.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {FITNESS_CATEGORY_ORDER.map((cat) => {
                        const catItems = testItems.filter(
                          (item) => item.category === cat
                        );
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
                            <div
                              role="list"
                              aria-label={`${FITNESS_CATEGORY_LABELS[cat]} 항목 목록`}
                              className="space-y-1.5 ml-1"
                            >
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
