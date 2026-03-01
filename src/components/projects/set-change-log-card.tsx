"use client";

import { useState } from "react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Clock,
  ArrowRight,
  Users,
  Package,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useSetChangeLog } from "@/hooks/use-set-change-log";
import type { SetChangeItem } from "@/types";

// ─── 폼 초기값 ────────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  fromScene: "",
  toScene: "",
  targetSeconds: 30,
  actualSeconds: "" as string | number,
  staffList: "" as string,
  propList: "" as string,
  memo: "",
  completed: false,
};

type FormState = typeof EMPTY_FORM;

function itemToForm(item: SetChangeItem): FormState {
  return {
    fromScene: item.fromScene,
    toScene: item.toScene,
    targetSeconds: item.targetSeconds,
    actualSeconds: item.actualSeconds ?? "",
    staffList: item.staffList.join(", "),
    propList: item.propList.join(", "),
    memo: item.memo,
    completed: item.completed,
  };
}

function splitList(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// ─── 통계 헬퍼 ────────────────────────────────────────────────────────────────

function calcStats(items: SetChangeItem[]) {
  const completed = items.filter(
    (i) => i.completed && i.actualSeconds !== null
  );
  const withinTarget = completed.filter(
    (i) => (i.actualSeconds ?? Infinity) <= i.targetSeconds
  );
  const successRate =
    completed.length > 0
      ? Math.round((withinTarget.length / completed.length) * 100)
      : null;
  const avgActual =
    completed.length > 0
      ? Math.round(
          completed.reduce((sum, i) => sum + (i.actualSeconds ?? 0), 0) /
            completed.length
        )
      : null;
  return { successRate, avgActual, completedCount: completed.length };
}

// ─── 바 차트 ──────────────────────────────────────────────────────────────────

function TimeBarChart({ items }: { items: SetChangeItem[] }) {
  const measuredItems = items.filter((i) => i.actualSeconds !== null);
  if (measuredItems.length === 0) return null;

  const maxVal = Math.max(
    ...measuredItems.map((i) =>
      Math.max(i.targetSeconds, i.actualSeconds ?? 0)
    ),
    1
  );

  return (
    <div className="space-y-1.5">
      {measuredItems.map((item) => {
        const actual = item.actualSeconds ?? 0;
        const targetPct = Math.min((item.targetSeconds / maxVal) * 100, 100);
        const actualPct = Math.min((actual / maxVal) * 100, 100);
        const over = actual > item.targetSeconds;

        return (
          <div key={item.id} className="flex items-center gap-2">
            {/* 레이블 */}
            <span className="w-14 shrink-0 text-[10px] text-muted-foreground truncate text-right">
              #{item.order}
            </span>
            {/* 바 영역 */}
            <div className="relative flex-1 h-4 bg-muted rounded overflow-hidden">
              {/* 실제 시간 바 */}
              <div
                className={`absolute left-0 top-0 h-full rounded transition-all ${
                  over ? "bg-red-400" : "bg-green-400"
                }`}
                style={{ width: `${actualPct}%` }}
              />
              {/* 목표 기준선 */}
              <div
                className="absolute top-0 h-full w-0.5 bg-blue-500 z-10"
                style={{ left: `${targetPct}%` }}
              />
            </div>
            {/* 수치 */}
            <span
              className={`w-12 shrink-0 text-[10px] font-medium ${
                over ? "text-red-500" : "text-green-600"
              }`}
            >
              {actual}s
            </span>
          </div>
        );
      })}
      <div className="flex items-center gap-1 mt-1">
        <div className="w-2 h-2 rounded-sm bg-blue-500" />
        <span className="text-[10px] text-muted-foreground">목표 기준선</span>
        <div className="w-2 h-2 rounded-sm bg-green-400 ml-2" />
        <span className="text-[10px] text-muted-foreground">목표 이내</span>
        <div className="w-2 h-2 rounded-sm bg-red-400 ml-2" />
        <span className="text-[10px] text-muted-foreground">초과</span>
      </div>
    </div>
  );
}

// ─── 항목 폼 ──────────────────────────────────────────────────────────────────

function ItemForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  initial: FormState;
  onSubmit: (form: FormState) => void;
  onCancel: () => void;
  submitLabel: string;
}) {
  const [form, setForm] = useState<FormState>(initial);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit() {
    if (!form.fromScene.trim() || !form.toScene.trim()) {
      toast.error(TOAST.SET_CHANGE.SCENE_REQUIRED);
      return;
    }
    if (!form.targetSeconds || Number(form.targetSeconds) <= 0) {
      toast.error(TOAST.SET_CHANGE.TARGET_TIME_REQUIRED);
      return;
    }
    onSubmit(form);
  }

  return (
    <div className="space-y-2 p-3 border rounded-lg bg-muted/30">
      {/* 장면 */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">이전 장면 *</Label>
          <Input
            value={form.fromScene}
            onChange={(e) => set("fromScene", e.target.value)}
            placeholder="예: 1막 3장"
            className="h-7 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">다음 장면 *</Label>
          <Input
            value={form.toScene}
            onChange={(e) => set("toScene", e.target.value)}
            placeholder="예: 2막 1장"
            className="h-7 text-xs"
          />
        </div>
      </div>
      {/* 시간 */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">목표 시간(초) *</Label>
          <Input
            type="number"
            min={1}
            value={form.targetSeconds}
            onChange={(e) => set("targetSeconds", Number(e.target.value))}
            className="h-7 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">실제 시간(초)</Label>
          <Input
            type="number"
            min={0}
            value={form.actualSeconds}
            onChange={(e) =>
              set("actualSeconds", e.target.value === "" ? "" : Number(e.target.value))
            }
            placeholder="미입력 가능"
            className="h-7 text-xs"
          />
        </div>
      </div>
      {/* 스태프/소품 */}
      <div className="space-y-1">
        <Label className="text-xs">담당 스태프 (쉼표 구분)</Label>
        <Input
          value={form.staffList}
          onChange={(e) => set("staffList", e.target.value)}
          placeholder="예: 홍길동, 김철수"
          className="h-7 text-xs"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">필요 소품 (쉼표 구분)</Label>
        <Input
          value={form.propList}
          onChange={(e) => set("propList", e.target.value)}
          placeholder="예: 의자, 마이크"
          className="h-7 text-xs"
        />
      </div>
      {/* 메모 */}
      <div className="space-y-1">
        <Label className="text-xs">메모</Label>
        <Textarea
          value={form.memo}
          onChange={(e) => set("memo", e.target.value)}
          placeholder="특이사항 메모..."
          className="text-xs min-h-[52px] resize-none"
        />
      </div>
      {/* 완료 여부 */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="completed"
          checked={form.completed}
          onCheckedChange={(v) => set("completed", !!v)}
        />
        <Label htmlFor="completed" className="text-xs cursor-pointer">
          전환 완료
        </Label>
      </div>
      {/* 버튼 */}
      <div className="flex gap-2 justify-end pt-1">
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onCancel}>
          <X className="h-3 w-3 mr-1" />
          취소
        </Button>
        <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
          <Check className="h-3 w-3 mr-1" />
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}

// ─── 항목 행 ──────────────────────────────────────────────────────────────────

function ItemRow({
  item,
  onEdit,
  onDelete,
  onToggleComplete,
}: {
  item: SetChangeItem;
  onEdit: () => void;
  onDelete: () => void;
  onToggleComplete: () => void;
}) {
  const hasActual = item.actualSeconds !== null;
  const over = hasActual && (item.actualSeconds ?? 0) > item.targetSeconds;
  const diff = hasActual
    ? (item.actualSeconds ?? 0) - item.targetSeconds
    : null;

  return (
    <div
      className={`rounded-lg border p-2.5 space-y-1.5 text-xs ${
        item.completed ? "bg-muted/40" : "bg-card"
      }`}
    >
      {/* 헤더 행 */}
      <div className="flex items-center gap-2">
        <Checkbox
          checked={item.completed}
          onCheckedChange={onToggleComplete}
          className="shrink-0"
        />
        <Badge
          variant="outline"
          className="text-[10px] px-1.5 py-0 shrink-0 font-mono"
        >
          #{item.order}
        </Badge>
        <div className="flex items-center gap-1 flex-1 min-w-0 font-medium">
          <span className="truncate">{item.fromScene}</span>
          <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />
          <span className="truncate">{item.toScene}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={onEdit}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* 시간 정보 */}
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground pl-6">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          목표 {item.targetSeconds}s
        </span>
        {hasActual && (
          <span
            className={`flex items-center gap-1 font-medium ${
              over ? "text-red-500" : "text-green-600"
            }`}
          >
            실제 {item.actualSeconds}s
            {diff !== null && (
              <span>({diff > 0 ? `+${diff}` : diff}s)</span>
            )}
          </span>
        )}
        {item.completed && (
          <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 border-green-200">
            완료
          </Badge>
        )}
      </div>

      {/* 스태프/소품 */}
      {(item.staffList.length > 0 || item.propList.length > 0) && (
        <div className="flex flex-wrap gap-1 pl-6">
          {item.staffList.map((s, i) => (
            <Badge
              key={i}
              variant="outline"
              className="text-[10px] px-1.5 py-0 gap-0.5"
            >
              <Users className="h-2.5 w-2.5" />
              {s}
            </Badge>
          ))}
          {item.propList.map((p, i) => (
            <Badge
              key={i}
              variant="outline"
              className="text-[10px] px-1.5 py-0 gap-0.5 text-orange-600 border-orange-200"
            >
              <Package className="h-2.5 w-2.5" />
              {p}
            </Badge>
          ))}
        </div>
      )}

      {/* 메모 */}
      {item.memo && (
        <p className="text-[10px] text-muted-foreground pl-6 italic line-clamp-2">
          {item.memo}
        </p>
      )}
    </div>
  );
}

// ─── 메인 카드 ────────────────────────────────────────────────────────────────

export function SetChangeLogCard({ projectId }: { projectId: string }) {
  const { data, loading, addItem, updateItem, deleteItem } =
    useSetChangeLog(projectId);

  const [open, setOpen] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [chartOpen, setChartOpen] = useState(false);

  const stats = calcStats(data.items);

  // 항목 추가
  async function handleAdd(form: FormState) {
    try {
      await addItem({
        fromScene: form.fromScene.trim(),
        toScene: form.toScene.trim(),
        targetSeconds: Number(form.targetSeconds),
        actualSeconds:
          form.actualSeconds === "" ? null : Number(form.actualSeconds),
        staffList: splitList(String(form.staffList)),
        propList: splitList(String(form.propList)),
        memo: form.memo.trim(),
        completed: form.completed,
      });
      toast.success(TOAST.SET_CHANGE.ITEM_ADDED);
      setShowAddForm(false);
    } catch {
      toast.error(TOAST.ITEM_ADD_ERROR);
    }
  }

  // 항목 수정
  async function handleUpdate(id: string, form: FormState) {
    try {
      await updateItem(id, {
        fromScene: form.fromScene.trim(),
        toScene: form.toScene.trim(),
        targetSeconds: Number(form.targetSeconds),
        actualSeconds:
          form.actualSeconds === "" ? null : Number(form.actualSeconds),
        staffList: splitList(String(form.staffList)),
        propList: splitList(String(form.propList)),
        memo: form.memo.trim(),
        completed: form.completed,
      });
      toast.success(TOAST.ITEM_UPDATED);
      setEditingId(null);
    } catch {
      toast.error(TOAST.UPDATE_ERROR);
    }
  }

  // 항목 삭제
  async function handleDelete(id: string) {
    try {
      await deleteItem(id);
      toast.success(TOAST.ITEM_DELETED);
    } catch {
      toast.error(TOAST.DELETE_ERROR);
    }
  }

  // 완료 토글
  async function handleToggle(item: SetChangeItem) {
    try {
      await updateItem(item.id, { completed: !item.completed });
    } catch {
      toast.error(TOAST.STATUS_ERROR);
    }
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      {/* 카드 헤더 */}
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/30 rounded-t-xl transition-colors">
            <div className="flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-semibold">세트 전환 기록</span>
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0"
              >
                {data.items.length}건
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {/* 통계 요약 */}
              {stats.successRate !== null && (
                <Badge
                  className={`text-[10px] px-1.5 py-0 ${
                    stats.successRate >= 80
                      ? "bg-green-100 text-green-700 border-green-200"
                      : stats.successRate >= 50
                      ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                      : "bg-red-100 text-red-700 border-red-200"
                  }`}
                >
                  성공률 {stats.successRate}%
                </Badge>
              )}
              {stats.avgActual !== null && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0"
                >
                  평균 {stats.avgActual}s
                </Badge>
              )}
              {open ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-3">
            {/* 통계 행 */}
            {data.items.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg bg-muted/50 p-2 text-center">
                  <div className="text-xs font-bold text-foreground">
                    {data.items.length}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    전체 전환
                  </div>
                </div>
                <div className="rounded-lg bg-muted/50 p-2 text-center">
                  <div
                    className={`text-xs font-bold ${
                      stats.successRate === null
                        ? "text-muted-foreground"
                        : stats.successRate >= 80
                        ? "text-green-600"
                        : stats.successRate >= 50
                        ? "text-yellow-600"
                        : "text-red-500"
                    }`}
                  >
                    {stats.successRate !== null ? `${stats.successRate}%` : "-"}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    성공률
                  </div>
                </div>
                <div className="rounded-lg bg-muted/50 p-2 text-center">
                  <div className="text-xs font-bold text-foreground">
                    {stats.avgActual !== null ? `${stats.avgActual}s` : "-"}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    평균 시간
                  </div>
                </div>
              </div>
            )}

            {/* 차트 토글 */}
            {data.items.some((i) => i.actualSeconds !== null) && (
              <Collapsible open={chartOpen} onOpenChange={setChartOpen}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs w-full"
                  >
                    {chartOpen ? (
                      <ChevronUp className="h-3 w-3 mr-1" />
                    ) : (
                      <ChevronDown className="h-3 w-3 mr-1" />
                    )}
                    전환 시간 추이 차트
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 p-3 rounded-lg border bg-muted/20">
                    <TimeBarChart items={data.items} />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* 항목 목록 */}
            {loading && (
              <p className="text-xs text-muted-foreground text-center py-4">
                불러오는 중...
              </p>
            )}
            {!loading && data.items.length === 0 && !showAddForm && (
              <p className="text-xs text-muted-foreground text-center py-4">
                등록된 전환 항목이 없습니다.
              </p>
            )}

            <div className="space-y-2">
              {data.items.map((item) =>
                editingId === item.id ? (
                  <ItemForm
                    key={item.id}
                    initial={itemToForm(item)}
                    onSubmit={(form) => handleUpdate(item.id, form)}
                    onCancel={() => setEditingId(null)}
                    submitLabel="수정"
                  />
                ) : (
                  <ItemRow
                    key={item.id}
                    item={item}
                    onEdit={() => {
                      setShowAddForm(false);
                      setEditingId(item.id);
                    }}
                    onDelete={() => handleDelete(item.id)}
                    onToggleComplete={() => handleToggle(item)}
                  />
                )
              )}
            </div>

            {/* 추가 폼 */}
            {showAddForm && (
              <ItemForm
                initial={EMPTY_FORM}
                onSubmit={handleAdd}
                onCancel={() => setShowAddForm(false)}
                submitLabel="추가"
              />
            )}

            {/* 추가 버튼 */}
            {!showAddForm && editingId === null && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs w-full"
                onClick={() => setShowAddForm(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                전환 항목 추가
              </Button>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
