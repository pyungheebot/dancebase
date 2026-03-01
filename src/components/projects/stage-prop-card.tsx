"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Trash2,
  Pencil,
  Package,
  Armchair,
  Sparkles,
  Hand,
  RectangleHorizontal,
  Lightbulb,
  MoreHorizontal,
  MoreVertical,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  HelpCircle,
  User,
  MapPin,
  Clapperboard,

} from "lucide-react";
import { useStagePropManagement, type StagePropInput } from "@/hooks/use-stage-prop";
import type { StagePropItem, StagePropCategory, StagePropItemStatus } from "@/types";

// ============================================================
// 상수 & 설정
// ============================================================

const CATEGORY_CONFIG: Record<
  StagePropCategory,
  { label: string; icon: React.ReactNode; color: string; badgeColor: string }
> = {
  furniture: {
    label: "가구/소품",
    icon: <Armchair className="h-3.5 w-3.5" />,
    color: "text-amber-600",
    badgeColor: "bg-amber-100 text-amber-700 border-amber-200",
  },
  decoration: {
    label: "장식",
    icon: <Sparkles className="h-3.5 w-3.5" />,
    color: "text-pink-600",
    badgeColor: "bg-pink-100 text-pink-700 border-pink-200",
  },
  handheld: {
    label: "핸드헬드",
    icon: <Hand className="h-3.5 w-3.5" />,
    color: "text-blue-600",
    badgeColor: "bg-blue-100 text-blue-700 border-blue-200",
  },
  backdrop: {
    label: "배경막",
    icon: <RectangleHorizontal className="h-3.5 w-3.5" />,
    color: "text-purple-600",
    badgeColor: "bg-purple-100 text-purple-700 border-purple-200",
  },
  lighting_prop: {
    label: "조명 소품",
    icon: <Lightbulb className="h-3.5 w-3.5" />,
    color: "text-yellow-600",
    badgeColor: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  other: {
    label: "기타",
    icon: <MoreHorizontal className="h-3.5 w-3.5" />,
    color: "text-gray-600",
    badgeColor: "bg-gray-100 text-gray-700 border-gray-200",
  },
};

const STATUS_CONFIG: Record<
  StagePropItemStatus,
  { label: string; icon: React.ReactNode; badgeColor: string; summaryBg: string; summaryText: string }
> = {
  available: {
    label: "사용 가능",
    icon: <CheckCircle2 className="h-3 w-3" />,
    badgeColor: "bg-green-100 text-green-700 border-green-200",
    summaryBg: "bg-green-50 border-green-200",
    summaryText: "text-green-700",
  },
  in_use: {
    label: "사용 중",
    icon: <Clock className="h-3 w-3" />,
    badgeColor: "bg-blue-100 text-blue-700 border-blue-200",
    summaryBg: "bg-blue-50 border-blue-200",
    summaryText: "text-blue-700",
  },
  damaged: {
    label: "손상됨",
    icon: <AlertTriangle className="h-3 w-3" />,
    badgeColor: "bg-orange-100 text-orange-700 border-orange-200",
    summaryBg: "bg-orange-50 border-orange-200",
    summaryText: "text-orange-700",
  },
  missing: {
    label: "분실",
    icon: <HelpCircle className="h-3 w-3" />,
    badgeColor: "bg-red-100 text-red-700 border-red-200",
    summaryBg: "bg-red-50 border-red-200",
    summaryText: "text-red-700",
  },
};

const CATEGORIES: StagePropCategory[] = [
  "furniture",
  "decoration",
  "handheld",
  "backdrop",
  "lighting_prop",
  "other",
];

const STATUSES: StagePropItemStatus[] = [
  "available",
  "in_use",
  "damaged",
  "missing",
];

const EMPTY_FORM: StagePropInput = {
  name: "",
  category: "other",
  quantity: 1,
  scene: null,
  placement: null,
  responsiblePerson: null,
  status: "available",
  notes: "",
};

// ============================================================
// 카테고리 배지
// ============================================================

function CategoryBadge({ category }: { category: StagePropCategory }) {
  const cfg = CATEGORY_CONFIG[category];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0 text-[10px] font-medium ${cfg.badgeColor}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ============================================================
// 상태 배지
// ============================================================

function StatusBadge({ status }: { status: StagePropItemStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0 text-[10px] font-medium ${cfg.badgeColor}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ============================================================
// 소품 추가/수정 다이얼로그
// ============================================================

type PropFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: StagePropItem;
  onSubmit: (input: StagePropInput) => boolean | StagePropItem | null;
  title: string;
};

function PropFormDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
  title,
}: PropFormDialogProps) {
  const [form, setForm] = useState<StagePropInput>(
    initial
      ? {
          name: initial.name,
          category: initial.category,
          quantity: initial.quantity,
          scene: initial.scene,
          placement: initial.placement,
          responsiblePerson: initial.responsiblePerson,
          status: initial.status,
          notes: initial.notes,
        }
      : { ...EMPTY_FORM }
  );

  function setField<K extends keyof StagePropInput>(
    key: K,
    value: StagePropInput[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit() {
    const result = onSubmit(form);
    if (result !== false && result !== null) {
      setForm({ ...EMPTY_FORM });
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 소품 이름 */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              소품 이름 <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="예: 마이크 스탠드, 의자, 조명 반사판"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              className="h-8 text-sm"
            />
          </div>

          {/* 카테고리 & 상태 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">카테고리</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setField("category", v as StagePropCategory)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c} className="text-sm">
                      {CATEGORY_CONFIG[c].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">상태</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setField("status", v as StagePropItemStatus)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="text-sm">
                      {STATUS_CONFIG[s].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 수량 */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">수량</Label>
            <Input
              type="number"
              min={1}
              value={form.quantity}
              onChange={(e) =>
                setField("quantity", Math.max(1, parseInt(e.target.value) || 1))
              }
              className="h-8 text-sm"
            />
          </div>

          {/* 씬/장면 & 배치 위치 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">씬/장면</Label>
              <Input
                placeholder="예: 1막 2장면"
                value={form.scene ?? ""}
                onChange={(e) =>
                  setField("scene", e.target.value.trim() || null)
                }
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">배치 위치</Label>
              <Input
                placeholder="예: 무대 왼쪽, 중앙"
                value={form.placement ?? ""}
                onChange={(e) =>
                  setField("placement", e.target.value.trim() || null)
                }
                className="h-8 text-sm"
              />
            </div>
          </div>

          {/* 담당자 */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">담당자</Label>
            <Input
              placeholder="담당자 이름"
              value={form.responsiblePerson ?? ""}
              onChange={(e) =>
                setField("responsiblePerson", e.target.value.trim() || null)
              }
              className="h-8 text-sm"
            />
          </div>

          {/* 메모 */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">메모</Label>
            <Textarea
              placeholder="추가 메모를 입력하세요"
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
              rows={2}
              className="text-sm resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onOpenChange(false)}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSubmit}
            disabled={!form.name.trim()}
          >
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 소품 행 컴포넌트
// ============================================================

type PropRowProps = {
  item: StagePropItem;
  onEdit: (item: StagePropItem) => void;
  onDelete: (id: string) => void;
};

function PropRow({ item, onEdit, onDelete }: PropRowProps) {
  const catCfg = CATEGORY_CONFIG[item.category];
  return (
    <div className="flex items-start gap-3 rounded-md border px-3 py-2.5 hover:bg-muted/30 transition-colors">
      {/* 카테고리 아이콘 */}
      <div className={`mt-0.5 shrink-0 ${catCfg.color}`}>{catCfg.icon}</div>

      {/* 내용 */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">{item.name}</span>
          <CategoryBadge category={item.category} />
          <StatusBadge status={item.status} />
          <span className="text-[10px] text-muted-foreground">x{item.quantity}</span>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {item.scene && (
            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <Clapperboard className="h-2.5 w-2.5" />
              {item.scene}
            </span>
          )}
          {item.placement && (
            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <MapPin className="h-2.5 w-2.5" />
              {item.placement}
            </span>
          )}
          {item.responsiblePerson && (
            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <User className="h-2.5 w-2.5" />
              {item.responsiblePerson}
            </span>
          )}
        </div>
        {item.notes && (
          <p className="text-[10px] text-muted-foreground line-clamp-1">
            {item.notes}
          </p>
        )}
      </div>

      {/* 액션 */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0">
            <MoreVertical className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            className="text-xs gap-1.5"
            onClick={() => onEdit(item)}
          >
            <Pencil className="h-3 w-3" />
            수정
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-xs gap-1.5 text-red-600 focus:text-red-600"
            onClick={() => onDelete(item.id)}
          >
            <Trash2 className="h-3 w-3" />
            삭제
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ============================================================
// 카테고리 분포 차트 (CSS div 기반)
// ============================================================

function CategoryChart({
  breakdown,
  total,
}: {
  breakdown: Record<StagePropCategory, number>;
  total: number;
}) {
  if (total === 0) return null;

  const entries = CATEGORIES.map((c) => ({
    category: c,
    count: breakdown[c],
    pct: Math.round((breakdown[c] / total) * 100),
  })).filter((e) => e.count > 0);

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">카테고리 분포</p>
      <div className="space-y-1.5">
        {entries.map(({ category, count, pct }) => {
          const cfg = CATEGORY_CONFIG[category];
          return (
            <div key={category} className="flex items-center gap-2">
              <div className={`shrink-0 ${cfg.color}`}>{cfg.icon}</div>
              <span className="text-[11px] text-muted-foreground w-20 shrink-0">
                {cfg.label}
              </span>
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full ${cfg.badgeColor.split(" ")[0]}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground w-12 text-right shrink-0">
                {count}개 ({pct}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// 상태 요약 카드
// ============================================================

function StatusSummaryCards({
  statusSummary,
}: {
  statusSummary: Record<StagePropItemStatus, number>;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {STATUSES.map((s) => {
        const cfg = STATUS_CONFIG[s];
        const count = statusSummary[s];
        return (
          <div
            key={s}
            className={`rounded-lg border px-3 py-2 space-y-1 ${cfg.summaryBg}`}
          >
            <div className={`flex items-center gap-1.5 ${cfg.summaryText}`}>
              {cfg.icon}
              <span className="text-[11px] font-medium">{cfg.label}</span>
            </div>
            <p className={`text-lg font-bold leading-none ${cfg.summaryText}`}>
              {count}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// 메인 컴포넌트
// ============================================================

type StagePropCardProps = {
  projectId: string;
};

export function StagePropCard({ projectId }: StagePropCardProps) {
  const {
    props,
    loading,
    addProp,
    updateProp,
    deleteProp,
    totalProps,
    categoryBreakdown,
    statusSummary,
    sceneDistribution,
  } = useStagePropManagement(projectId);

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<StagePropItem | null>(null);
  const [filterCategory, setFilterCategory] = useState<StagePropCategory | "all">("all");
  const [filterScene, setFilterScene] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<StagePropItemStatus | "all">("all");

  // 씬 목록
  const scenes = useMemo(() => {
    const set = new Set<string>();
    for (const p of props) {
      if (p.scene) set.add(p.scene);
    }
    return Array.from(set).sort();
  }, [props]);

  // 필터 적용
  const filtered = useMemo(() => {
    return props.filter((p) => {
      if (filterCategory !== "all" && p.category !== filterCategory) return false;
      if (filterScene !== "all") {
        if (filterScene === "__none__" && p.scene !== null) return false;
        if (filterScene !== "__none__" && p.scene !== filterScene) return false;
      }
      if (filterStatus !== "all" && p.status !== filterStatus) return false;
      return true;
    });
  }, [props, filterCategory, filterScene, filterStatus]);

  function handleEdit(item: StagePropItem) {
    setEditTarget(item);
  }

  function handleUpdate(input: StagePropInput): boolean {
    if (!editTarget) return false;
    const ok = updateProp(editTarget.id, input);
    if (ok) setEditTarget(null);
    return ok;
  }

  function handleDelete(id: string) {
    deleteProp(id);
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          불러오는 중...
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-semibold">
                무대 소품 관리
              </CardTitle>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {totalProps}개
              </Badge>
            </div>
            <Button
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => setAddOpen(true)}
            >
              <Plus className="h-3 w-3" />
              소품 추가
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 상태별 요약 카드 */}
          {totalProps > 0 && (
            <StatusSummaryCards statusSummary={statusSummary} />
          )}

          {/* 카테고리 분포 차트 */}
          {totalProps > 0 && (
            <CategoryChart breakdown={categoryBreakdown} total={totalProps} />
          )}

          {/* 필터 */}
          {totalProps > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="h-3 w-3 text-muted-foreground shrink-0" />

              {/* 카테고리 필터 */}
              <Select
                value={filterCategory}
                onValueChange={(v) =>
                  setFilterCategory(v as StagePropCategory | "all")
                }
              >
                <SelectTrigger className="h-7 text-xs w-32">
                  <SelectValue placeholder="카테고리" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">전체 카테고리</SelectItem>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c} className="text-xs">
                      {CATEGORY_CONFIG[c].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* 씬 필터 */}
              {scenes.length > 0 && (
                <Select
                  value={filterScene}
                  onValueChange={setFilterScene}
                >
                  <SelectTrigger className="h-7 text-xs w-32">
                    <SelectValue placeholder="씬" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">전체 씬</SelectItem>
                    {scenes.map((s) => (
                      <SelectItem key={s} value={s} className="text-xs">
                        {s}
                      </SelectItem>
                    ))}
                    <SelectItem value="__none__" className="text-xs">
                      씬 없음
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}

              {/* 상태 필터 */}
              <Select
                value={filterStatus}
                onValueChange={(v) =>
                  setFilterStatus(v as StagePropItemStatus | "all")
                }
              >
                <SelectTrigger className="h-7 text-xs w-28">
                  <SelectValue placeholder="상태" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">전체 상태</SelectItem>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="text-xs">
                      {STATUS_CONFIG[s].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* 필터 초기화 */}
              {(filterCategory !== "all" ||
                filterScene !== "all" ||
                filterStatus !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs px-2 text-muted-foreground"
                  onClick={() => {
                    setFilterCategory("all");
                    setFilterScene("all");
                    setFilterStatus("all");
                  }}
                >
                  초기화
                </Button>
              )}
            </div>
          )}

          {/* 씬 분포 요약 */}
          {totalProps > 0 && Object.keys(sceneDistribution).length > 1 && (
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(sceneDistribution).map(([scene, count]) => (
                <span
                  key={scene}
                  className="inline-flex items-center gap-1 text-[10px] bg-muted/50 rounded-full px-2 py-0.5"
                >
                  <Clapperboard className="h-2.5 w-2.5 text-muted-foreground" />
                  {scene}: {count}개
                </span>
              ))}
            </div>
          )}

          {/* 빈 상태 */}
          {filtered.length === 0 && (
            <div className="py-10 text-center space-y-2">
              <Package className="h-8 w-8 mx-auto text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                {totalProps === 0
                  ? "등록된 소품이 없습니다"
                  : "조건에 맞는 소품이 없습니다"}
              </p>
              {totalProps === 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => setAddOpen(true)}
                >
                  <Plus className="h-3 w-3" />
                  첫 번째 소품 추가
                </Button>
              )}
            </div>
          )}

          {/* 소품 목록 */}
          {filtered.length > 0 && (
            <div className="space-y-1.5">
              {filtered.map((item) => (
                <PropRow
                  key={item.id}
                  item={item}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}

          {/* 필터 결과 수 */}
          {totalProps > 0 && filtered.length !== totalProps && (
            <p className="text-[10px] text-muted-foreground text-right">
              {filtered.length} / {totalProps}개 표시
            </p>
          )}
        </CardContent>
      </Card>

      {/* 추가 다이얼로그 */}
      <PropFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSubmit={addProp}
        title="소품 추가"
      />

      {/* 수정 다이얼로그 */}
      {editTarget && (
        <PropFormDialog
          open={!!editTarget}
          onOpenChange={(open) => {
            if (!open) setEditTarget(null);
          }}
          initial={editTarget}
          onSubmit={handleUpdate}
          title="소품 수정"
        />
      )}
    </>
  );
}
