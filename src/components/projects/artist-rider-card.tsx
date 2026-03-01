"use client";

import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Music2,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useArtistRider } from "@/hooks/use-artist-rider";
import type {
  ShowRiderItem,
  ShowRiderCategory,
  ShowRiderPriority,
  ShowRiderStatus,
} from "@/types";

// ─── 레이블 맵 ──────────────────────────────────────────────

const CATEGORY_LABELS: Record<ShowRiderCategory, string> = {
  technical: "기술",
  backstage: "백스테이지",
  catering: "케이터링",
  accommodation: "숙박",
  transport: "교통",
  etc: "기타",
};

const PRIORITY_LABELS: Record<ShowRiderPriority, string> = {
  required: "필수",
  preferred: "희망",
  optional: "선택",
};

const STATUS_LABELS: Record<ShowRiderStatus, string> = {
  pending: "미확인",
  secured: "확보",
  unavailable: "불가",
};

const CATEGORY_COLORS: Record<ShowRiderCategory, string> = {
  technical: "bg-blue-100 text-blue-700",
  backstage: "bg-purple-100 text-purple-700",
  catering: "bg-orange-100 text-orange-700",
  accommodation: "bg-cyan-100 text-cyan-700",
  transport: "bg-green-100 text-green-700",
  etc: "bg-gray-100 text-gray-700",
};

const PRIORITY_COLORS: Record<ShowRiderPriority, string> = {
  required: "bg-red-100 text-red-700",
  preferred: "bg-yellow-100 text-yellow-700",
  optional: "bg-gray-100 text-gray-600",
};

const STATUS_ICONS: Record<ShowRiderStatus, React.ReactNode> = {
  pending: <Clock className="h-3 w-3" />,
  secured: <CheckCircle2 className="h-3 w-3" />,
  unavailable: <XCircle className="h-3 w-3" />,
};

const STATUS_COLORS: Record<ShowRiderStatus, string> = {
  pending: "bg-gray-100 text-gray-600",
  secured: "bg-green-100 text-green-700",
  unavailable: "bg-red-100 text-red-700",
};

const ALL_CATEGORIES: ShowRiderCategory[] = [
  "technical",
  "backstage",
  "catering",
  "accommodation",
  "transport",
  "etc",
];

// ─── 항목 폼 기본값 ─────────────────────────────────────────

type ItemFormState = Omit<ShowRiderItem, "id">;

function buildEmptyForm(): ItemFormState {
  return {
    artistName: "",
    category: "technical",
    request: "",
    quantity: 1,
    priority: "required",
    status: "pending",
    note: "",
  };
}

// ─── 항목 행 컴포넌트 ───────────────────────────────────────

function RiderItemRow({
  item,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  item: ShowRiderItem;
  onEdit: (item: ShowRiderItem) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: ShowRiderStatus) => void;
}) {
  const nextStatus: Record<ShowRiderStatus, ShowRiderStatus> = {
    pending: "secured",
    secured: "unavailable",
    unavailable: "pending",
  };

  return (
    <div className="flex items-start gap-2 py-2 px-3 rounded-md hover:bg-muted/40 group transition-colors">
      {/* 확보 상태 토글 버튼 */}
      <button
        type="button"
        onClick={() => onStatusChange(item.id, nextStatus[item.status])}
        className={`flex items-center gap-1 shrink-0 mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${STATUS_COLORS[item.status]}`}
        title="클릭하여 상태 변경"
      >
        {STATUS_ICONS[item.status]}
        <span>{STATUS_LABELS[item.status]}</span>
      </button>

      {/* 내용 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-medium truncate">{item.request}</span>
          {item.quantity > 1 && (
            <span className="text-[10px] text-muted-foreground">x{item.quantity}</span>
          )}
        </div>
        {item.note && (
          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{item.note}</p>
        )}
      </div>

      {/* 배지들 */}
      <div className="flex items-center gap-1 shrink-0">
        <span className={`text-[10px] px-1.5 py-0 rounded-full font-medium ${PRIORITY_COLORS[item.priority]}`}>
          {PRIORITY_LABELS[item.priority]}
        </span>
      </div>

      {/* 액션 버튼 */}
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0"
          onClick={() => onEdit(item)}
        >
          <Pencil className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
          onClick={() => onDelete(item.id)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// ─── 아티스트 그룹 섹션 ─────────────────────────────────────

function ArtistSection({
  artistName,
  items,
  activeCategory,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  artistName: string;
  items: ShowRiderItem[];
  activeCategory: ShowRiderCategory | "all";
  onEdit: (item: ShowRiderItem) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: ShowRiderStatus) => void;
}) {
  const [open, setOpen] = useState(true);

  const filtered =
    activeCategory === "all"
      ? items
      : items.filter((i) => i.category === activeCategory);

  const securedCount = items.filter((i) => i.status === "secured").length;
  const requiredUnresolved = items.filter(
    (i) => i.priority === "required" && i.status !== "secured"
  ).length;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 w-full py-1.5 px-2 rounded hover:bg-muted/50 transition-colors">
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        )}
        <span className="text-sm font-semibold flex-1 text-left">{artistName}</span>
        <div className="flex items-center gap-1.5">
          {requiredUnresolved > 0 && (
            <Badge className="text-[10px] px-1.5 py-0 bg-red-100 text-red-700 border-0">
              필수 미확보 {requiredUnresolved}
            </Badge>
          )}
          <span className="text-[10px] text-muted-foreground">
            {securedCount}/{items.length} 확보
          </span>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        {filtered.length === 0 ? (
          <p className="text-[11px] text-muted-foreground py-2 px-4">해당 카테고리 항목 없음</p>
        ) : (
          <div className="ml-4 border-l border-border/50 pl-2">
            {filtered.map((item) => (
              <RiderItemRow
                key={item.id}
                item={item}
                onEdit={onEdit}
                onDelete={onDelete}
                onStatusChange={onStatusChange}
              />
            ))}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

// ─── 항목 추가/수정 다이얼로그 ─────────────────────────────

function ItemFormDialog({
  open,
  initialData,
  onClose,
  onSubmit,
}: {
  open: boolean;
  initialData: ItemFormState | null;
  onClose: () => void;
  onSubmit: (data: ItemFormState) => void;
}) {
  const isEdit = initialData !== null;
  const [form, setForm] = useState<ItemFormState>(
    initialData ?? buildEmptyForm()
  );

  // 다이얼로그가 열릴 때마다 폼 초기화
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setForm(initialData ?? buildEmptyForm());
    }
  }

  function handleSubmit() {
    if (!form.artistName.trim()) {
      toast.error(TOAST.ARTIST_RIDER.ARTIST_REQUIRED);
      return;
    }
    if (!form.request.trim()) {
      toast.error(TOAST.ARTIST_RIDER.REQUEST_REQUIRED);
      return;
    }
    if (form.quantity < 1) {
      toast.error(TOAST.ARTIST_RIDER.QUANTITY_REQUIRED);
      return;
    }
    onSubmit(form);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">
            {isEdit ? "라이더 항목 수정" : "라이더 항목 추가"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* 아티스트/팀명 */}
          <div className="space-y-1">
            <Label className="text-xs">아티스트/팀명 *</Label>
            <Input
              className="h-8 text-xs"
              placeholder="예) Team Alpha"
              value={form.artistName}
              onChange={(e) => setForm((f) => ({ ...f, artistName: e.target.value }))}
            />
          </div>

          {/* 카테고리 */}
          <div className="space-y-1">
            <Label className="text-xs">카테고리 *</Label>
            <Select
              value={form.category}
              onValueChange={(v) => setForm((f) => ({ ...f, category: v as ShowRiderCategory }))}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-xs">
                    {CATEGORY_LABELS[cat]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 요청 내용 */}
          <div className="space-y-1">
            <Label className="text-xs">요청 내용 *</Label>
            <Input
              className="h-8 text-xs"
              placeholder="예) 무선 마이크 헤드셋"
              value={form.request}
              onChange={(e) => setForm((f) => ({ ...f, request: e.target.value }))}
            />
          </div>

          {/* 수량 / 우선순위 / 확보 상태 */}
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">수량</Label>
              <Input
                type="number"
                min={1}
                className="h-8 text-xs"
                value={form.quantity}
                onChange={(e) =>
                  setForm((f) => ({ ...f, quantity: Math.max(1, Number(e.target.value)) }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">우선순위</Label>
              <Select
                value={form.priority}
                onValueChange={(v) => setForm((f) => ({ ...f, priority: v as ShowRiderPriority }))}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="required" className="text-xs">필수</SelectItem>
                  <SelectItem value="preferred" className="text-xs">희망</SelectItem>
                  <SelectItem value="optional" className="text-xs">선택</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">확보 상태</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm((f) => ({ ...f, status: v as ShowRiderStatus }))}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending" className="text-xs">미확인</SelectItem>
                  <SelectItem value="secured" className="text-xs">확보</SelectItem>
                  <SelectItem value="unavailable" className="text-xs">불가</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 메모 */}
          <div className="space-y-1">
            <Label className="text-xs">메모</Label>
            <Textarea
              className="text-xs resize-none"
              rows={2}
              placeholder="추가 설명 (선택)"
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onClose}>
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            {isEdit ? "저장" : "추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── 메인 카드 ──────────────────────────────────────────────

export function ArtistRiderCard({ projectId }: { projectId: string }) {
  const { data, stats, addItem, updateItem, removeItem, setStatus } =
    useArtistRider(projectId);

  const [activeCategory, setActiveCategory] = useState<ShowRiderCategory | "all">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ShowRiderItem | null>(null);

  // 아티스트별 그룹핑
  const artistGroups = (() => {
    const map = new Map<string, ShowRiderItem[]>();
    for (const item of data.items) {
      const key = item.artistName.trim() || "미지정";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  })();

  function handleOpenAdd() {
    setEditTarget(null);
    setDialogOpen(true);
  }

  function handleOpenEdit(item: ShowRiderItem) {
    setEditTarget(item);
    setDialogOpen(true);
  }

  function handleDialogSubmit(formData: Omit<ShowRiderItem, "id">) {
    if (editTarget) {
      updateItem(editTarget.id, formData);
      toast.success(TOAST.ARTIST_RIDER.ITEM_UPDATED);
    } else {
      addItem(formData);
      toast.success(TOAST.ARTIST_RIDER.ITEM_ADDED);
    }
    setDialogOpen(false);
  }

  function handleDelete(itemId: string) {
    removeItem(itemId);
    toast.success(TOAST.ARTIST_RIDER.ITEM_DELETED);
  }

  function handleStatusChange(itemId: string, status: ShowRiderStatus) {
    setStatus(itemId, status);
  }

  return (
    <>
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <Music2 className="h-4 w-4 text-purple-500" />
            <h3 className="text-sm font-semibold">아티스트 라이더</h3>
            <Badge className="text-[10px] px-1.5 py-0 bg-purple-100 text-purple-700 border-0">
              {stats.total}개 항목
            </Badge>
          </div>
          <Button size="sm" className="h-7 text-xs gap-1" onClick={handleOpenAdd}>
            <Plus className="h-3 w-3" />
            항목 추가
          </Button>
        </div>

        {/* 전체 확보율 프로그레스 바 */}
        <div className="px-4 py-3 border-b space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">전체 확보율</span>
            <span className="text-xs font-semibold">
              {stats.secured}/{stats.total} ({stats.securedRate}%)
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-300"
              style={{ width: `${stats.securedRate}%` }}
            />
          </div>

          {/* 필수 미확보 경고 */}
          {stats.requiredUnresolved > 0 && (
            <div className="flex items-center gap-1.5 mt-1 px-2 py-1.5 rounded-md bg-red-50 border border-red-200">
              <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />
              <p className="text-[11px] text-red-700">
                필수 항목 중 <strong>{stats.requiredUnresolved}건</strong>이 미확보 상태입니다.
              </p>
            </div>
          )}
        </div>

        {/* 카테고리별 통계 바 */}
        <div className="px-4 py-2.5 border-b flex gap-1.5 flex-wrap">
          <button
            onClick={() => setActiveCategory("all")}
            className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-colors ${
              activeCategory === "all"
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            전체 {stats.total}
          </button>
          {ALL_CATEGORIES.map((cat) => {
            const count = stats.byCategory[cat];
            if (count === 0) return null;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-colors ${
                  activeCategory === cat
                    ? `${CATEGORY_COLORS[cat]} ring-1 ring-current`
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {CATEGORY_LABELS[cat]} {count}
              </button>
            );
          })}
        </div>

        {/* 아티스트별 목록 */}
        <div className="px-3 py-2 space-y-0.5 max-h-[420px] overflow-y-auto">
          {artistGroups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Music2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">등록된 라이더 항목이 없습니다.</p>
              <p className="text-[11px] mt-0.5">항목 추가 버튼으로 첫 라이더를 등록하세요.</p>
            </div>
          ) : (
            artistGroups.map(([artistName, items]) => (
              <ArtistSection
                key={artistName}
                artistName={artistName}
                items={items}
                activeCategory={activeCategory}
                onEdit={handleOpenEdit}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
              />
            ))
          )}
        </div>
      </div>

      {/* 항목 추가/수정 다이얼로그 */}
      <ItemFormDialog
        open={dialogOpen}
        initialData={
          editTarget
            ? {
                artistName: editTarget.artistName,
                category: editTarget.category,
                request: editTarget.request,
                quantity: editTarget.quantity,
                priority: editTarget.priority,
                status: editTarget.status,
                note: editTarget.note,
              }
            : null
        }
        onClose={() => setDialogOpen(false)}
        onSubmit={handleDialogSubmit}
      />
    </>
  );
}
