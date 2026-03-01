"use client";

import { useState } from "react";
import { useAsyncAction } from "@/hooks/use-async-action";
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
import { Checkbox } from "@/components/ui/checkbox";
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
  Users,
  Plus,
  Trash2,
  Pencil,
  MoreVertical,
  MapPin,
  Clock,
  Phone,
  CheckCircle2,
  Circle,
  AlignLeft,
  ClipboardList,
} from "lucide-react";
import { useStaffCall } from "@/hooks/use-staff-call";
import type { StaffCallItem, StaffCallRole } from "@/types";
import type { AddStaffCallInput } from "@/hooks/use-staff-call";

// ============================================================
// 상수
// ============================================================

const ROLE_CONFIG: Record<
  StaffCallRole,
  { label: string; color: string }
> = {
  stage_manager: {
    label: "무대감독",
    color: "bg-purple-100 text-purple-700 border-purple-200",
  },
  sound: {
    label: "음향",
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
  lighting: {
    label: "조명",
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  costume: {
    label: "의상",
    color: "bg-pink-100 text-pink-700 border-pink-200",
  },
  makeup: {
    label: "메이크업",
    color: "bg-rose-100 text-rose-700 border-rose-200",
  },
  stage_crew: {
    label: "무대스태프",
    color: "bg-orange-100 text-orange-700 border-orange-200",
  },
  front_of_house: {
    label: "프론트",
    color: "bg-cyan-100 text-cyan-700 border-cyan-200",
  },
  other: {
    label: "기타",
    color: "bg-gray-100 text-gray-700 border-gray-200",
  },
};

const ROLE_OPTIONS: StaffCallRole[] = [
  "stage_manager",
  "sound",
  "lighting",
  "costume",
  "makeup",
  "stage_crew",
  "front_of_house",
  "other",
];

const EMPTY_FORM: AddStaffCallInput = {
  name: "",
  role: "stage_manager",
  callTime: "",
  location: "",
  phone: "",
  note: "",
};

// ============================================================
// 역할 배지
// ============================================================

function RoleBadge({ role }: { role: StaffCallRole }) {
  const cfg = ROLE_CONFIG[role];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-1.5 py-0 text-[10px] font-medium ${cfg.color}`}
    >
      {cfg.label}
    </span>
  );
}

// ============================================================
// 스태프 폼 다이얼로그
// ============================================================

type StaffCallFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: StaffCallItem;
  onSubmit: (input: AddStaffCallInput) => Promise<boolean>;
  title: string;
};

function StaffCallFormDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
  title,
}: StaffCallFormDialogProps) {
  const [form, setForm] = useState<AddStaffCallInput>(
    initial
      ? {
          name: initial.name,
          role: initial.role,
          callTime: initial.callTime,
          location: initial.location ?? "",
          phone: initial.phone ?? "",
          note: initial.note ?? "",
        }
      : EMPTY_FORM
  );
  const { pending: saving, execute } = useAsyncAction();

  function setField<K extends keyof AddStaffCallInput>(
    key: K,
    value: AddStaffCallInput[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    await execute(async () => {
      const ok = await onSubmit(form);
      if (ok) {
        setForm(EMPTY_FORM);
        onOpenChange(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 이름 & 역할 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                이름 <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="스태프 이름"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                역할 <span className="text-red-500">*</span>
              </Label>
              <Select
                value={form.role}
                onValueChange={(v) => setField("role", v as StaffCallRole)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((r) => (
                    <SelectItem key={r} value={r} className="text-sm">
                      {ROLE_CONFIG[r].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 콜 시간 */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              콜 시간 <span className="text-red-500">*</span>
            </Label>
            <Input
              type="time"
              value={form.callTime}
              onChange={(e) => setField("callTime", e.target.value)}
              className="h-8 text-sm"
            />
          </div>

          {/* 집결 장소 */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">집결 장소</Label>
            <Input
              placeholder="예: 무대 뒤 분장실, 1층 로비"
              value={form.location}
              onChange={(e) => setField("location", e.target.value)}
              className="h-8 text-sm"
            />
          </div>

          {/* 연락처 */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">연락처</Label>
            <Input
              placeholder="예: 010-0000-0000"
              value={form.phone}
              onChange={(e) => setField("phone", e.target.value)}
              className="h-8 text-sm"
            />
          </div>

          {/* 특이사항 */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">특이사항</Label>
            <Textarea
              placeholder="특이사항이나 추가 안내 사항을 입력하세요"
              value={form.note}
              onChange={(e) => setField("note", e.target.value)}
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
            disabled={saving}
          >
            {saving ? "저장 중..." : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 스태프 항목 행
// ============================================================

type StaffCallItemRowProps = {
  item: StaffCallItem;
  onEdit: (item: StaffCallItem) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
};

function StaffCallItemRow({
  item,
  onEdit,
  onDelete,
  onToggle,
}: StaffCallItemRowProps) {
  return (
    <div
      className={`rounded-lg border px-3 py-2.5 transition-colors ${
        item.confirmed
          ? "bg-green-50/50 border-green-200/60"
          : "bg-card hover:bg-muted/10"
      }`}
    >
      <div className="flex items-start gap-2.5">
        {/* 확인 체크 */}
        <div className="pt-0.5 shrink-0">
          <Checkbox
            checked={item.confirmed}
            onCheckedChange={() => onToggle(item.id)}
            className="h-4 w-4"
          />
        </div>

        {/* 메인 내용 */}
        <div className="flex-1 min-w-0 space-y-1">
          {/* 이름, 역할, 콜 시간 */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-sm font-medium ${
                item.confirmed ? "text-muted-foreground line-through" : ""
              }`}
            >
              {item.name}
            </span>
            <RoleBadge role={item.role} />
            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-primary">
              <Clock className="h-2.5 w-2.5" />
              {item.callTime}
            </span>
            {item.confirmed && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-green-600">
                <CheckCircle2 className="h-2.5 w-2.5" />
                확인
              </span>
            )}
          </div>

          {/* 장소 & 연락처 */}
          <div className="flex items-center gap-3 flex-wrap">
            {item.location && (
              <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                <MapPin className="h-2.5 w-2.5" />
                {item.location}
              </span>
            )}
            {item.phone && (
              <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                <Phone className="h-2.5 w-2.5" />
                {item.phone}
              </span>
            )}
          </div>

          {/* 특이사항 */}
          {item.note && (
            <div className="flex items-start gap-1 text-[11px] text-muted-foreground">
              <AlignLeft className="h-3 w-3 mt-0.5 shrink-0" />
              <span className="line-clamp-2">{item.note}</span>
            </div>
          )}
        </div>

        {/* 액션 */}
        <div className="shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="text-xs">
              <DropdownMenuItem
                className="text-xs gap-1.5"
                onClick={() => onEdit(item)}
              >
                <Pencil className="h-3 w-3" />
                수정
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-xs gap-1.5"
                onClick={() => onToggle(item.id)}
              >
                {item.confirmed ? (
                  <>
                    <Circle className="h-3 w-3" />
                    미확인으로 변경
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3 w-3" />
                    확인으로 변경
                  </>
                )}
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
      </div>
    </div>
  );
}

// ============================================================
// 역할 그룹 섹션
// ============================================================

type RoleGroupSectionProps = {
  role: StaffCallRole;
  items: StaffCallItem[];
  onEdit: (item: StaffCallItem) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
};

function RoleGroupSection({
  role,
  items,
  onEdit,
  onDelete,
  onToggle,
}: RoleGroupSectionProps) {
  if (items.length === 0) return null;

  const confirmedCount = items.filter((i) => i.confirmed).length;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <RoleBadge role={role} />
        <span className="text-[10px] text-muted-foreground">
          {confirmedCount}/{items.length} 확인
        </span>
      </div>
      <div className="space-y-1.5 pl-1">
        {items.map((item) => (
          <StaffCallItemRow
            key={item.id}
            item={item}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 메인 컴포넌트
// ============================================================

type StaffCallCardProps = {
  groupId: string;
  projectId: string;
};

type ViewMode = "timeline" | "role";

export function StaffCallCard({ groupId, projectId }: StaffCallCardProps) {
  const {
    items,
    loading,
    addItem,
    updateItem,
    deleteItem,
    toggleConfirmed,
    getByRole,
    stats,
  } = useStaffCall(groupId, projectId);

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<StaffCallItem | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("timeline");

  function handleEdit(item: StaffCallItem) {
    setEditTarget(item);
  }

  async function handleUpdate(input: AddStaffCallInput): Promise<boolean> {
    if (!editTarget) return false;
    const ok = await updateItem(editTarget.id, input);
    if (ok) setEditTarget(null);
    return ok;
  }

  async function handleDelete(id: string) {
    await deleteItem(id);
  }

  async function handleToggle(id: string) {
    await toggleConfirmed(id);
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
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-semibold">
                스태프 콜시트
              </CardTitle>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {stats.total}명
              </Badge>
            </div>
            <div className="flex items-center gap-1.5">
              {/* 보기 모드 토글 */}
              <div className="flex rounded-md border overflow-hidden text-[10px]">
                <button
                  onClick={() => setViewMode("timeline")}
                  className={`px-2 py-1 transition-colors ${
                    viewMode === "timeline"
                      ? "bg-primary text-primary-foreground"
                      : "bg-background hover:bg-muted"
                  }`}
                >
                  시간순
                </button>
                <button
                  onClick={() => setViewMode("role")}
                  className={`px-2 py-1 transition-colors ${
                    viewMode === "role"
                      ? "bg-primary text-primary-foreground"
                      : "bg-background hover:bg-muted"
                  }`}
                >
                  역할별
                </button>
              </div>
              <Button
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => setAddOpen(true)}
              >
                <Plus className="h-3 w-3" />
                스태프 추가
              </Button>
            </div>
          </div>

          {/* 통계 요약 */}
          {stats.total > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="text-[10px] text-muted-foreground bg-muted/50 rounded px-2 py-0.5">
                확인 {stats.confirmed} / 전체 {stats.total}
              </span>
              {stats.pending > 0 && (
                <span className="text-[10px] text-yellow-600 bg-yellow-50 rounded px-2 py-0.5">
                  미확인 {stats.pending}명
                </span>
              )}
              {stats.confirmed === stats.total && stats.total > 0 && (
                <span className="text-[10px] text-green-600 bg-green-50 rounded px-2 py-0.5">
                  전원 확인 완료
                </span>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-3">
          {/* 빈 상태 */}
          {items.length === 0 && (
            <div className="py-10 text-center space-y-2">
              <Users className="h-8 w-8 mx-auto text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                등록된 스태프가 없습니다
              </p>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => setAddOpen(true)}
              >
                <Plus className="h-3 w-3" />
                첫 번째 스태프 추가
              </Button>
            </div>
          )}

          {/* 시간순 목록 */}
          {viewMode === "timeline" && items.length > 0 && (
            <div className="space-y-1.5">
              {items.map((item) => (
                <StaffCallItemRow
                  key={item.id}
                  item={item}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggle={handleToggle}
                />
              ))}
            </div>
          )}

          {/* 역할별 목록 */}
          {viewMode === "role" && items.length > 0 && (
            <div className="space-y-4">
              {ROLE_OPTIONS.map((role) => (
                <RoleGroupSection
                  key={role}
                  role={role}
                  items={getByRole(role)}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggle={handleToggle}
                />
              ))}
            </div>
          )}

          {/* 확인율 프로그레스 */}
          {stats.total > 0 && (
            <div className="pt-1 space-y-1">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>확인 완료율</span>
                <span>
                  {Math.round((stats.confirmed / stats.total) * 100)}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-green-500 transition-all"
                  style={{
                    width: `${Math.round((stats.confirmed / stats.total) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 추가 다이얼로그 */}
      <StaffCallFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSubmit={addItem}
        title="스태프 추가"
      />

      {/* 수정 다이얼로그 */}
      {editTarget && (
        <StaffCallFormDialog
          open={!!editTarget}
          onOpenChange={(open) => {
            if (!open) setEditTarget(null);
          }}
          initial={editTarget}
          onSubmit={handleUpdate}
          title="스태프 수정"
        />
      )}
    </>
  );
}
