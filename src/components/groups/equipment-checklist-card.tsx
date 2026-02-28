"use client";

import { useState } from "react";
import {
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  CheckSquare,
  Square,
  CalendarIcon,
  User,
  RefreshCw,
  CheckCircle2,
  Circle,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useEquipmentChecklist } from "@/hooks/use-equipment-checklist";
import type {
  EquipmentChecklistPhase,
  EquipmentChecklistRecord,
  EquipmentChecklistItem,
} from "@/types";

// ============================================================
// 상수
// ============================================================

const PHASE_META: Record<
  EquipmentChecklistPhase,
  { label: string; color: string; bg: string; border: string }
> = {
  before: {
    label: "연습 전",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  after: {
    label: "연습 후",
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-200",
  },
};

const CATEGORIES = ["음향", "조명", "시설", "행정", "기타"] as const;

// ============================================================
// Props
// ============================================================

type Props = {
  groupId: string;
  memberNames?: string[];
};

// ============================================================
// 체크 항목 행
// ============================================================

function CheckEntryRow({
  item,
  entry,
  onToggle,
  disabled,
}: {
  item: EquipmentChecklistItem | undefined;
  entry: { itemId: string; checked: boolean; checkedBy?: string; checkedAt?: string };
  onToggle: () => void;
  disabled?: boolean;
}) {
  if (!item) return null;
  const CheckIcon = entry.checked ? CheckSquare : Square;

  return (
    <div
      className={cn(
        "flex items-center gap-2 p-2 rounded-md transition-colors",
        entry.checked ? "bg-green-50" : "bg-gray-50",
        !disabled && "cursor-pointer hover:bg-gray-100"
      )}
      onClick={disabled ? undefined : onToggle}
    >
      <CheckIcon
        className={cn(
          "h-4 w-4 shrink-0",
          entry.checked ? "text-green-600" : "text-gray-400"
        )}
      />
      <div className="flex-1 min-w-0">
        <span
          className={cn(
            "text-xs font-medium",
            entry.checked ? "line-through text-gray-400" : "text-gray-700"
          )}
        >
          {item.name}
        </span>
        {entry.checkedBy && (
          <span className="ml-1 text-[10px] text-gray-400">
            ({entry.checkedBy})
          </span>
        )}
      </div>
      <Badge
        className={cn(
          "text-[10px] px-1.5 py-0 shrink-0",
          "bg-gray-100 text-gray-500"
        )}
      >
        {item.category}
      </Badge>
    </div>
  );
}

// ============================================================
// 기록 카드
// ============================================================

function RecordCard({
  record,
  items,
  onToggle,
  onDelete,
  calcProgress,
}: {
  record: EquipmentChecklistRecord;
  items: EquipmentChecklistItem[];
  onToggle: (itemId: string) => void;
  onDelete: () => void;
  calcProgress: (r: EquipmentChecklistRecord) => {
    total: number;
    checked: number;
    rate: number;
  };
}) {
  const [open, setOpen] = useState(false);
  const phase = PHASE_META[record.phase];
  const prog = calcProgress(record);
  const isComplete = prog.rate === 100;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div
        className={cn(
          "rounded-lg border p-2.5",
          isComplete ? "border-green-200 bg-green-50" : "border-gray-200 bg-white"
        )}
      >
        <CollapsibleTrigger asChild>
          <div className="flex items-center gap-2 cursor-pointer">
            {isComplete ? (
              <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
            ) : (
              <Circle className="h-4 w-4 text-gray-400 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-semibold text-gray-800">
                  {record.date}
                </span>
                <Badge
                  className={cn(
                    "text-[10px] px-1.5 py-0",
                    phase.bg,
                    phase.color
                  )}
                >
                  {phase.label}
                </Badge>
                {isComplete && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700">
                    완료
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Progress value={prog.rate} className="h-1.5 flex-1" />
                <span className="text-[10px] text-gray-500 shrink-0">
                  {prog.checked}/{prog.total}
                </span>
              </div>
              {record.assignee && (
                <div className="flex items-center gap-1 mt-0.5">
                  <User className="h-2.5 w-2.5 text-gray-400" />
                  <span className="text-[10px] text-gray-500">
                    {record.assignee}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
              {open ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <Separator className="my-2" />
          <div className="flex flex-col gap-1">
            {record.entries.map((entry) => {
              const item = items.find((i) => i.id === entry.itemId);
              return (
                <CheckEntryRow
                  key={entry.itemId}
                  item={item}
                  entry={entry}
                  onToggle={() => onToggle(entry.itemId)}
                />
              );
            })}
            {record.entries.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-2">
                항목이 없습니다
              </p>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export function EquipmentChecklistCard({ groupId, memberNames = [] }: Props) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"records" | "template">("records");

  // 기록 생성 다이얼로그
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newDate, setNewDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [newPhase, setNewPhase] = useState<EquipmentChecklistPhase>("before");
  const [newAssignee, setNewAssignee] = useState("");

  // 항목 추가 다이얼로그
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemPhase, setNewItemPhase] = useState<EquipmentChecklistPhase>("before");
  const [newItemCategory, setNewItemCategory] = useState("기타");

  const {
    items,
    beforeItems,
    afterItems,
    records,
    loading,
    refetch,
    addItem,
    deleteItem,
    createRecord,
    toggleEntry,
    deleteRecord,
    calcProgress,
  } = useEquipmentChecklist(groupId);

  // ── 기록 생성 처리 ──
  const handleCreateRecord = async () => {
    const id = await createRecord(newDate, newPhase, newAssignee);
    if (id) {
      setCreateDialogOpen(false);
      setNewAssignee("");
    }
  };

  // ── 항목 추가 처리 ──
  const handleAddItem = async () => {
    const ok = await addItem({
      name: newItemName,
      phase: newItemPhase,
      category: newItemCategory,
    });
    if (ok) {
      setNewItemName("");
      setItemDialogOpen(false);
    }
  };

  // ── 요약 통계 ──
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayRecords = records.filter((r) => r.date === todayStr);
  const totalRecords = records.length;
  const completedRecords = records.filter(
    (r) => calcProgress(r).rate === 100
  ).length;

  return (
    <>
      <Collapsible open={open} onOpenChange={setOpen}>
        <Card className="overflow-hidden">
          <CardHeader className="p-3">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-teal-600 shrink-0" />
                  <span className="text-sm font-semibold text-gray-800">
                    연습 장비 체크리스트
                  </span>
                  {todayRecords.length > 0 && (
                    <Badge className="text-[10px] px-1.5 py-0 bg-teal-100 text-teal-700">
                      오늘 {todayRecords.length}건
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-gray-400">
                    {completedRecords}/{totalRecords} 완료
                  </span>
                  {open ? (
                    <ChevronUp className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              </div>
            </CollapsibleTrigger>
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="p-3 pt-0">
              <Tabs
                value={activeTab}
                onValueChange={(v) =>
                  setActiveTab(v as "records" | "template")
                }
              >
                <div className="flex items-center justify-between mb-2">
                  <TabsList className="h-7">
                    <TabsTrigger value="records" className="text-xs px-2 h-6">
                      기록
                    </TabsTrigger>
                    <TabsTrigger value="template" className="text-xs px-2 h-6">
                      템플릿
                    </TabsTrigger>
                  </TabsList>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600"
                      onClick={() => refetch()}
                      title="새로고침"
                    >
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                    {activeTab === "records" ? (
                      <Button
                        size="sm"
                        className="h-7 text-xs bg-teal-600 hover:bg-teal-700"
                        onClick={() => setCreateDialogOpen(true)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        기록 추가
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="h-7 text-xs bg-teal-600 hover:bg-teal-700"
                        onClick={() => setItemDialogOpen(true)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        항목 추가
                      </Button>
                    )}
                  </div>
                </div>

                {/* 기록 탭 */}
                <TabsContent value="records" className="mt-0">
                  {loading ? (
                    <div className="py-6 text-center text-xs text-gray-400">
                      불러오는 중...
                    </div>
                  ) : records.length === 0 ? (
                    <div className="py-8 text-center">
                      <ClipboardList className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-xs text-gray-400">
                        아직 체크리스트 기록이 없습니다
                      </p>
                      <p className="text-[11px] text-gray-300 mt-1">
                        기록 추가 버튼으로 시작해보세요
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 max-h-96 overflow-y-auto pr-0.5">
                      {records.map((record) => (
                        <RecordCard
                          key={record.id}
                          record={record}
                          items={items}
                          onToggle={(itemId) =>
                            toggleEntry(record.id, itemId)
                          }
                          onDelete={() => deleteRecord(record.id)}
                          calcProgress={calcProgress}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* 템플릿 탭 */}
                <TabsContent value="template" className="mt-0">
                  <div className="flex flex-col gap-3">
                    {/* 연습 전 */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                        <span className="text-xs font-semibold text-blue-700">
                          연습 전 ({beforeItems.length}개)
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        {beforeItems.length === 0 ? (
                          <p className="text-[11px] text-gray-400 py-1 pl-1">
                            항목 없음
                          </p>
                        ) : (
                          beforeItems.map((item) => (
                            <TemplateItemRow
                              key={item.id}
                              item={item}
                              onDelete={() => deleteItem(item.id)}
                            />
                          ))
                        )}
                      </div>
                    </div>

                    <Separator />

                    {/* 연습 후 */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <div className="h-2 w-2 rounded-full bg-orange-500" />
                        <span className="text-xs font-semibold text-orange-700">
                          연습 후 ({afterItems.length}개)
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        {afterItems.length === 0 ? (
                          <p className="text-[11px] text-gray-400 py-1 pl-1">
                            항목 없음
                          </p>
                        ) : (
                          afterItems.map((item) => (
                            <TemplateItemRow
                              key={item.id}
                              item={item}
                              onDelete={() => deleteItem(item.id)}
                            />
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* 기록 생성 다이얼로그 */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">체크리스트 기록 추가</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-gray-600">날짜</Label>
              <div className="relative">
                <CalendarIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <Input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="h-8 text-xs pl-7"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-gray-600">단계</Label>
              <Select
                value={newPhase}
                onValueChange={(v) =>
                  setNewPhase(v as EquipmentChecklistPhase)
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="before" className="text-xs">
                    연습 전
                  </SelectItem>
                  <SelectItem value="after" className="text-xs">
                    연습 후
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-gray-600">담당자 (선택)</Label>
              <div className="relative">
                <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                {memberNames.length > 0 ? (
                  <Select
                    value={newAssignee}
                    onValueChange={setNewAssignee}
                  >
                    <SelectTrigger className="h-8 text-xs pl-7">
                      <SelectValue placeholder="담당자 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="" className="text-xs">
                        미지정
                      </SelectItem>
                      {memberNames.map((name) => (
                        <SelectItem key={name} value={name} className="text-xs">
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    placeholder="담당자 이름 입력"
                    value={newAssignee}
                    onChange={(e) => setNewAssignee(e.target.value)}
                    className="h-8 text-xs pl-7"
                  />
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => setCreateDialogOpen(false)}
            >
              취소
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs bg-teal-600 hover:bg-teal-700"
              onClick={handleCreateRecord}
              disabled={!newDate}
            >
              생성
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 항목 추가 다이얼로그 */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">템플릿 항목 추가</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-gray-600">항목 이름</Label>
              <Input
                placeholder="예: 음향 장비 연결 확인"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="h-8 text-xs"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddItem();
                }}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-gray-600">단계</Label>
              <Select
                value={newItemPhase}
                onValueChange={(v) =>
                  setNewItemPhase(v as EquipmentChecklistPhase)
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="before" className="text-xs">
                    연습 전
                  </SelectItem>
                  <SelectItem value="after" className="text-xs">
                    연습 후
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-gray-600">카테고리</Label>
              <div className="relative">
                <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <Select
                  value={newItemCategory}
                  onValueChange={setNewItemCategory}
                >
                  <SelectTrigger className="h-8 text-xs pl-7">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat} className="text-xs">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => {
                setItemDialogOpen(false);
                setNewItemName("");
              }}
            >
              취소
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs bg-teal-600 hover:bg-teal-700"
              onClick={handleAddItem}
              disabled={!newItemName.trim()}
            >
              추가
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ============================================================
// 템플릿 항목 행 (파일 내 분리 컴포넌트)
// ============================================================

function TemplateItemRow({
  item,
  onDelete,
}: {
  item: EquipmentChecklistItem;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors">
      <CheckSquare className="h-3.5 w-3.5 text-gray-400 shrink-0" />
      <span className="flex-1 text-xs text-gray-700 truncate">{item.name}</span>
      <Badge className="text-[10px] px-1.5 py-0 bg-gray-100 text-gray-500 shrink-0">
        {item.category}
      </Badge>
      <Button
        size="sm"
        variant="ghost"
        className="h-5 w-5 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
        onClick={onDelete}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}
