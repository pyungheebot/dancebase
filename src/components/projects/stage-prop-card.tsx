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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Plus,
  Trash2,
  Pencil,
  Package,
  User,
  MapPin,
  Music,
  DollarSign,
  MoreVertical,
  LayoutGrid,
  List,
  Filter,
  Boxes,
  AlertTriangle,
  Wrench,
  CheckCircle2,
  Clock,
  HelpCircle,
} from "lucide-react";
import { useStageProp } from "@/hooks/use-stage-prop";
import type { StagePropStatus, StagePropEntry } from "@/types";
import type { AddStagePropInput } from "@/hooks/use-stage-prop";

// ============================================================
// 상수
// ============================================================

const STATUS_CONFIG: Record<
  StagePropStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  ready: {
    label: "준비됨",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  in_use: {
    label: "사용중",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: <Clock className="h-3 w-3" />,
  },
  stored: {
    label: "보관중",
    color: "bg-gray-100 text-gray-700 border-gray-200",
    icon: <Package className="h-3 w-3" />,
  },
  repair: {
    label: "수리중",
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
    icon: <Wrench className="h-3 w-3" />,
  },
  lost: {
    label: "분실",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: <AlertTriangle className="h-3 w-3" />,
  },
};

const STATUS_OPTIONS: StagePropStatus[] = [
  "ready",
  "in_use",
  "stored",
  "repair",
  "lost",
];

const EMPTY_FORM: AddStagePropInput = {
  name: "",
  scene: "",
  assignedTo: "",
  storageLocation: "",
  status: "ready",
  quantity: 1,
  cost: undefined,
  photoUrl: "",
  memo: "",
};

// ============================================================
// 상태 배지
// ============================================================

function StatusBadge({ status }: { status: StagePropStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0 text-[10px] font-medium ${cfg.color}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ============================================================
// 소품 폼 다이얼로그
// ============================================================

type PropFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: StagePropEntry;
  onSubmit: (input: AddStagePropInput) => Promise<boolean>;
  title: string;
};

function PropFormDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
  title,
}: PropFormDialogProps) {
  const [form, setForm] = useState<AddStagePropInput>(
    initial
      ? {
          name: initial.name,
          scene: initial.scene ?? "",
          assignedTo: initial.assignedTo ?? "",
          storageLocation: initial.storageLocation ?? "",
          status: initial.status,
          quantity: initial.quantity,
          cost: initial.cost,
          photoUrl: initial.photoUrl ?? "",
          memo: initial.memo ?? "",
        }
      : EMPTY_FORM
  );
  const [saving, setSaving] = useState(false);

  function setField<K extends keyof AddStagePropInput>(
    key: K,
    value: AddStagePropInput[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    setSaving(true);
    const ok = await onSubmit(form);
    setSaving(false);
    if (ok) {
      setForm(EMPTY_FORM);
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

          {/* 사용 곡/장면 */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">사용 곡/장면</Label>
            <Input
              placeholder="예: 1곡 인트로, 2번 장면"
              value={form.scene}
              onChange={(e) => setField("scene", e.target.value)}
              className="h-8 text-sm"
            />
          </div>

          {/* 담당자 & 보관 위치 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">담당자</Label>
              <Input
                placeholder="담당자 이름"
                value={form.assignedTo}
                onChange={(e) => setField("assignedTo", e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">보관 위치</Label>
              <Input
                placeholder="예: 창고 A-3"
                value={form.storageLocation}
                onChange={(e) => setField("storageLocation", e.target.value)}
                className="h-8 text-sm"
              />
            </div>
          </div>

          {/* 상태 & 수량 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">상태</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setField("status", v as StagePropStatus)
                }
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s} className="text-sm">
                      {STATUS_CONFIG[s].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
          </div>

          {/* 비용 & 사진 URL */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">비용 (원)</Label>
              <Input
                type="number"
                min={0}
                placeholder="0"
                value={form.cost ?? ""}
                onChange={(e) =>
                  setField(
                    "cost",
                    e.target.value === "" ? undefined : Number(e.target.value)
                  )
                }
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">사진 URL</Label>
              <Input
                placeholder="https://..."
                value={form.photoUrl}
                onChange={(e) => setField("photoUrl", e.target.value)}
                className="h-8 text-sm"
              />
            </div>
          </div>

          {/* 메모 */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">메모</Label>
            <Textarea
              placeholder="추가 메모를 입력하세요"
              value={form.memo}
              onChange={(e) => setField("memo", e.target.value)}
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
            disabled={saving}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSubmit}
            disabled={saving || !form.name.trim()}
          >
            {saving ? "저장 중..." : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 소품 카드 (그리드 뷰)
// ============================================================

type PropGridItemProps = {
  entry: StagePropEntry;
  onEdit: (entry: StagePropEntry) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: StagePropStatus) => void;
};

function PropGridItem({
  entry,
  onEdit,
  onDelete,
  onStatusChange,
}: PropGridItemProps) {
  return (
    <div className="rounded-lg border bg-card p-3 flex flex-col gap-2 hover:shadow-sm transition-shadow">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Package className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium truncate">{entry.name}</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0">
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="text-xs">
            <DropdownMenuItem
              className="text-xs gap-1.5"
              onClick={() => onEdit(entry)}
            >
              <Pencil className="h-3 w-3" />
              수정
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {STATUS_OPTIONS.filter((s) => s !== entry.status).map((s) => (
              <DropdownMenuItem
                key={s}
                className="text-xs gap-1.5"
                onClick={() => onStatusChange(entry.id, s)}
              >
                {STATUS_CONFIG[s].icon}
                {STATUS_CONFIG[s].label}(으)로 변경
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-xs gap-1.5 text-red-600 focus:text-red-600"
              onClick={() => onDelete(entry.id)}
            >
              <Trash2 className="h-3 w-3" />
              삭제
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 상태 & 수량 */}
      <div className="flex items-center gap-2">
        <StatusBadge status={entry.status} />
        <span className="text-[10px] text-muted-foreground">
          x{entry.quantity}
        </span>
      </div>

      {/* 사용 곡/장면 */}
      {entry.scene && (
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Music className="h-3 w-3 shrink-0" />
          <span className="truncate">{entry.scene}</span>
        </div>
      )}

      {/* 담당자 */}
      {entry.assignedTo && (
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <User className="h-3 w-3 shrink-0" />
          <span className="truncate">{entry.assignedTo}</span>
        </div>
      )}

      {/* 보관 위치 */}
      {entry.storageLocation && (
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{entry.storageLocation}</span>
        </div>
      )}

      {/* 비용 */}
      {entry.cost !== undefined && entry.cost > 0 && (
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <DollarSign className="h-3 w-3 shrink-0" />
          <span>{entry.cost.toLocaleString()}원</span>
        </div>
      )}

      {/* 사진 미리보기 */}
      {entry.photoUrl && (
        <img
          src={entry.photoUrl}
          alt={entry.name}
          className="w-full h-20 object-cover rounded border"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      )}

      {/* 메모 */}
      {entry.memo && (
        <p className="text-[10px] text-muted-foreground line-clamp-2">
          {entry.memo}
        </p>
      )}
    </div>
  );
}

// ============================================================
// 소품 행 (리스트 뷰)
// ============================================================

type PropListItemProps = {
  entry: StagePropEntry;
  onEdit: (entry: StagePropEntry) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: StagePropStatus) => void;
};

function PropListItem({
  entry,
  onEdit,
  onDelete,
  onStatusChange,
}: PropListItemProps) {
  return (
    <div className="flex items-center gap-3 rounded-md border px-3 py-2 hover:bg-muted/30 transition-colors">
      <Package className="h-3.5 w-3.5 text-muted-foreground shrink-0" />

      {/* 이름 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{entry.name}</span>
          <StatusBadge status={entry.status} />
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          {entry.scene && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <Music className="h-2.5 w-2.5" />
              {entry.scene}
            </span>
          )}
          {entry.assignedTo && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <User className="h-2.5 w-2.5" />
              {entry.assignedTo}
            </span>
          )}
          {entry.storageLocation && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <MapPin className="h-2.5 w-2.5" />
              {entry.storageLocation}
            </span>
          )}
        </div>
      </div>

      {/* 수량 & 비용 */}
      <div className="text-right shrink-0">
        <div className="text-xs font-medium">x{entry.quantity}</div>
        {entry.cost !== undefined && entry.cost > 0 && (
          <div className="text-[10px] text-muted-foreground">
            {entry.cost.toLocaleString()}원
          </div>
        )}
      </div>

      {/* 액션 */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0">
            <MoreVertical className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="text-xs">
          <DropdownMenuItem
            className="text-xs gap-1.5"
            onClick={() => onEdit(entry)}
          >
            <Pencil className="h-3 w-3" />
            수정
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {STATUS_OPTIONS.filter((s) => s !== entry.status).map((s) => (
            <DropdownMenuItem
              key={s}
              className="text-xs gap-1.5"
              onClick={() => onStatusChange(entry.id, s)}
            >
              {STATUS_CONFIG[s].icon}
              {STATUS_CONFIG[s].label}(으)로 변경
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-xs gap-1.5 text-red-600 focus:text-red-600"
            onClick={() => onDelete(entry.id)}
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
// 메인 컴포넌트
// ============================================================

type StagePropCardProps = {
  groupId: string;
  projectId: string;
};

export function StagePropCard({ groupId, projectId }: StagePropCardProps) {
  const {
    entries,
    loading,
    addProp,
    updateProp,
    deleteProp,
    changeStatus,
    filterByStatus,
    stats,
  } = useStageProp(groupId, projectId);

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [statusFilter, setStatusFilter] = useState<StagePropStatus | "all">(
    "all"
  );
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<StagePropEntry | null>(null);

  const filtered = useMemo(
    () => filterByStatus(statusFilter),
    [filterByStatus, statusFilter]
  );

  function handleEdit(entry: StagePropEntry) {
    setEditTarget(entry);
  }

  async function handleUpdate(input: AddStagePropInput): Promise<boolean> {
    if (!editTarget) return false;
    const ok = await updateProp(editTarget.id, input);
    if (ok) setEditTarget(null);
    return ok;
  }

  async function handleDelete(id: string) {
    await deleteProp(id);
  }

  async function handleStatusChange(id: string, status: StagePropStatus) {
    await changeStatus(id, status);
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
              <Boxes className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-semibold">
                무대 소품 관리
              </CardTitle>
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0"
              >
                {stats.total}개
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

          {/* 통계 요약 */}
          {stats.total > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="text-[10px] text-muted-foreground bg-muted/50 rounded px-2 py-0.5">
                총 수량 {stats.totalQuantity}개
              </span>
              {stats.totalCost > 0 && (
                <span className="text-[10px] text-muted-foreground bg-muted/50 rounded px-2 py-0.5">
                  총 비용 {stats.totalCost.toLocaleString()}원
                </span>
              )}
              {stats.byStatus.lost > 0 && (
                <span className="text-[10px] text-red-600 bg-red-50 rounded px-2 py-0.5">
                  분실 {stats.byStatus.lost}개
                </span>
              )}
              {stats.byStatus.repair > 0 && (
                <span className="text-[10px] text-yellow-600 bg-yellow-50 rounded px-2 py-0.5">
                  수리중 {stats.byStatus.repair}개
                </span>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-3">
          {/* 필터 & 뷰 토글 */}
          {stats.total > 0 && (
            <div className="flex items-center justify-between gap-2">
              <Tabs
                value={statusFilter}
                onValueChange={(v) =>
                  setStatusFilter(v as StagePropStatus | "all")
                }
                className="flex-1"
              >
                <TabsList className="h-7 text-xs gap-0">
                  <TabsTrigger value="all" className="h-6 text-[10px] px-2">
                    전체 ({stats.total})
                  </TabsTrigger>
                  {STATUS_OPTIONS.map((s) => {
                    const count = stats.byStatus[s];
                    if (count === 0) return null;
                    return (
                      <TabsTrigger
                        key={s}
                        value={s}
                        className="h-6 text-[10px] px-2"
                      >
                        {STATUS_CONFIG[s].label} ({count})
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {/* 탭 콘텐츠 (필터는 상위에서 useMemo로 처리) */}
                <TabsContent value={statusFilter} className="mt-0" />
              </Tabs>

              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* 빈 상태 */}
          {filtered.length === 0 && (
            <div className="py-10 text-center space-y-2">
              <Package className="h-8 w-8 mx-auto text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                {statusFilter === "all"
                  ? "등록된 소품이 없습니다"
                  : `${STATUS_CONFIG[statusFilter].label} 소품이 없습니다`}
              </p>
              {statusFilter === "all" && (
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

          {/* 그리드 뷰 */}
          {viewMode === "grid" && filtered.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {filtered.map((entry) => (
                <PropGridItem
                  key={entry.id}
                  entry={entry}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          )}

          {/* 리스트 뷰 */}
          {viewMode === "list" && filtered.length > 0 && (
            <div className="space-y-1">
              {filtered.map((entry) => (
                <PropListItem
                  key={entry.id}
                  entry={entry}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
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
