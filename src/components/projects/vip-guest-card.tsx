"use client";

import { useState } from "react";
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
import { Progress } from "@/components/ui/progress";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Pencil,
  Crown,
  User,
  Mail,
  Phone,
  MapPin,
  Users,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { useVipGuest } from "@/hooks/use-vip-guest";
import type { VipGuestEntry, VipGuestCategory, VipGuestStatus } from "@/types";

// ============================================================
// 상수 & 레이블
// ============================================================

const CATEGORY_LABELS: Record<VipGuestCategory, string> = {
  sponsor: "스폰서",
  media: "미디어",
  celebrity: "셀럽",
  judge: "심사위원",
  family: "가족/지인",
  other: "기타",
};

const CATEGORY_COLORS: Record<VipGuestCategory, string> = {
  sponsor: "bg-yellow-100 text-yellow-800 border-yellow-300",
  media: "bg-blue-100 text-blue-800 border-blue-300",
  celebrity: "bg-purple-100 text-purple-800 border-purple-300",
  judge: "bg-orange-100 text-orange-800 border-orange-300",
  family: "bg-green-100 text-green-800 border-green-300",
  other: "bg-gray-100 text-gray-700 border-gray-300",
};

const STATUS_LABELS: Record<VipGuestStatus, string> = {
  invited: "초대",
  confirmed: "확정",
  declined: "불참",
  attended: "참석",
  no_show: "미참석",
};

const STATUS_COLORS: Record<VipGuestStatus, string> = {
  invited: "bg-blue-100 text-blue-700 border-blue-300",
  confirmed: "bg-green-100 text-green-700 border-green-300",
  declined: "bg-red-100 text-red-700 border-red-300",
  attended: "bg-emerald-100 text-emerald-700 border-emerald-300",
  no_show: "bg-gray-100 text-gray-600 border-gray-300",
};

const STATUS_FILTER_OPTIONS: Array<{ value: VipGuestStatus | "all"; label: string }> = [
  { value: "all", label: "전체" },
  { value: "invited", label: "초대" },
  { value: "confirmed", label: "확정" },
  { value: "declined", label: "불참" },
  { value: "attended", label: "참석" },
  { value: "no_show", label: "미참석" },
];

const CATEGORY_OPTIONS: VipGuestCategory[] = [
  "sponsor",
  "media",
  "celebrity",
  "judge",
  "family",
  "other",
];

const STATUS_OPTIONS: VipGuestStatus[] = [
  "invited",
  "confirmed",
  "declined",
  "attended",
  "no_show",
];

// ============================================================
// 빈 폼 초기값
// ============================================================

type GuestFormData = Omit<VipGuestEntry, "id" | "createdAt">;

function emptyForm(): GuestFormData {
  return {
    name: "",
    category: "other",
    status: "invited",
    organization: "",
    email: "",
    phone: "",
    seatAssignment: "",
    plusOne: false,
    specialRequirements: "",
    invitedBy: "",
    notes: "",
  };
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export function VipGuestCard({
  groupId,
  projectId,
}: {
  groupId: string;
  projectId: string;
}) {
  const { guests, loading, addGuest, updateGuest, deleteGuest, updateStatus, stats } =
    useVipGuest(groupId, projectId);

  const [isOpen, setIsOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<VipGuestStatus | "all">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<VipGuestEntry | null>(null);
  const [form, setForm] = useState<GuestFormData>(emptyForm());
  const [saving, setSaving] = useState(false);

  // 필터링된 게스트 목록
  const filtered =
    statusFilter === "all"
      ? guests
      : guests.filter((g) => g.status === statusFilter);

  // 확정률 (확정+참석 / 전체)
  const confirmRate =
    stats.totalGuests > 0
      ? Math.round((stats.confirmedGuests / stats.totalGuests) * 100)
      : 0;

  // ── 다이얼로그 열기 ──
  function openAdd() {
    setEditTarget(null);
    setForm(emptyForm());
    setDialogOpen(true);
  }

  function openEdit(guest: VipGuestEntry) {
    setEditTarget(guest);
    setForm({
      name: guest.name,
      category: guest.category,
      status: guest.status,
      organization: guest.organization ?? "",
      email: guest.email ?? "",
      phone: guest.phone ?? "",
      seatAssignment: guest.seatAssignment ?? "",
      plusOne: guest.plusOne,
      specialRequirements: guest.specialRequirements ?? "",
      invitedBy: guest.invitedBy,
      notes: guest.notes ?? "",
    });
    setDialogOpen(true);
  }

  // ── 저장 ──
  async function handleSave() {
    if (!form.name.trim()) {
      toast.error("게스트 이름을 입력해주세요.");
      return;
    }
    if (!form.invitedBy.trim()) {
      toast.error("초대자를 입력해주세요.");
      return;
    }
    setSaving(true);
    try {
      if (editTarget) {
        await updateGuest(editTarget.id, form);
        toast.success("게스트 정보가 수정되었습니다.");
      } else {
        await addGuest(form);
        toast.success("VIP 게스트가 추가되었습니다.");
      }
      setDialogOpen(false);
    } catch {
      toast.error("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  // ── 삭제 ──
  async function handleDelete(guest: VipGuestEntry) {
    try {
      await deleteGuest(guest.id);
      toast.success(`${guest.name} 게스트가 삭제되었습니다.`);
    } catch {
      toast.error("삭제에 실패했습니다.");
    }
  }

  // ── 상태 변경 ──
  async function handleStatusChange(guestId: string, status: VipGuestStatus) {
    try {
      await updateStatus(guestId, status);
      toast.success("상태가 변경되었습니다.");
    } catch {
      toast.error("상태 변경에 실패했습니다.");
    }
  }

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity">
                  <Crown className="h-4 w-4 text-yellow-500" />
                  <CardTitle className="text-sm font-semibold">
                    VIP 게스트 관리
                  </CardTitle>
                  <Badge className="text-[10px] px-1.5 py-0 bg-yellow-100 text-yellow-800 border border-yellow-300">
                    {stats.totalGuests}명
                  </Badge>
                  {isOpen ? (
                    <ChevronUp className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  )}
                </button>
              </CollapsibleTrigger>
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  openAdd();
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                게스트 추가
              </Button>
            </div>

            {/* 요약 통계 */}
            {stats.totalGuests > 0 && (
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>확정률</span>
                  <span className="font-medium text-foreground">
                    {stats.confirmedGuests}/{stats.totalGuests} ({confirmRate}%)
                  </span>
                </div>
                <Progress value={confirmRate} className="h-1.5" />
                <div className="flex gap-2 flex-wrap">
                  {(Object.entries(stats.categoryBreakdown) as [VipGuestCategory, number][])
                    .filter(([, count]) => count > 0)
                    .map(([cat, count]) => (
                      <span
                        key={cat}
                        className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${CATEGORY_COLORS[cat]}`}
                      >
                        {CATEGORY_LABELS[cat]} {count}
                      </span>
                    ))}
                </div>
              </div>
            )}
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="pt-0">
              {/* 상태 필터 */}
              <div className="flex gap-1 flex-wrap mb-3">
                {STATUS_FILTER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setStatusFilter(opt.value)}
                    className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                      statusFilter === opt.value
                        ? "bg-foreground text-background border-foreground"
                        : "bg-background text-muted-foreground border-border hover:border-foreground/50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* 게스트 목록 */}
              {loading ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  불러오는 중...
                </p>
              ) : filtered.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  {statusFilter === "all"
                    ? "등록된 VIP 게스트가 없습니다."
                    : `${STATUS_LABELS[statusFilter as VipGuestStatus]} 상태의 게스트가 없습니다.`}
                </p>
              ) : (
                <div className="space-y-2">
                  {filtered.map((guest) => (
                    <GuestRow
                      key={guest.id}
                      guest={guest}
                      onEdit={() => openEdit(guest)}
                      onDelete={() => handleDelete(guest)}
                      onStatusChange={(status) =>
                        handleStatusChange(guest.id, status)
                      }
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* 추가/편집 다이얼로그 */}
      <GuestDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        form={form}
        setForm={setForm}
        onSave={handleSave}
        saving={saving}
        isEdit={!!editTarget}
      />
    </>
  );
}

// ============================================================
// 게스트 행 컴포넌트
// ============================================================

function GuestRow({
  guest,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  guest: VipGuestEntry;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: VipGuestStatus) => void;
}) {
  return (
    <div className="flex items-start gap-2 p-2 rounded-md border bg-card hover:bg-accent/30 transition-colors">
      {/* 아이콘 */}
      <div className="mt-0.5 flex-shrink-0">
        <User className="h-3.5 w-3.5 text-muted-foreground" />
      </div>

      {/* 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold truncate">{guest.name}</span>
          {guest.plusOne && (
            <span className="text-[10px] px-1 py-0 rounded bg-violet-100 text-violet-700 border border-violet-200 font-medium">
              +1
            </span>
          )}
          <span
            className={`text-[10px] px-1.5 py-0 rounded-full border font-medium ${CATEGORY_COLORS[guest.category]}`}
          >
            {CATEGORY_LABELS[guest.category]}
          </span>
        </div>

        {guest.organization && (
          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
            {guest.organization}
          </p>
        )}

        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {guest.seatAssignment && (
            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <MapPin className="h-2.5 w-2.5" />
              {guest.seatAssignment}
            </span>
          )}
          {guest.email && (
            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <Mail className="h-2.5 w-2.5" />
              <span className="truncate max-w-[120px]">{guest.email}</span>
            </span>
          )}
        </div>
      </div>

      {/* 상태 드롭다운 + 액션 */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium flex items-center gap-0.5 cursor-pointer hover:opacity-80 transition-opacity ${STATUS_COLORS[guest.status]}`}
            >
              {STATUS_LABELS[guest.status]}
              <ChevronRight className="h-2.5 w-2.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-28">
            {STATUS_OPTIONS.map((s) => (
              <DropdownMenuItem
                key={s}
                className="text-xs cursor-pointer"
                onClick={() => onStatusChange(s)}
              >
                <span
                  className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${
                    s === "confirmed" || s === "attended"
                      ? "bg-green-500"
                      : s === "declined" || s === "no_show"
                      ? "bg-red-400"
                      : "bg-blue-400"
                  }`}
                />
                {STATUS_LABELS[s]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0"
          onClick={onEdit}
        >
          <Pencil className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// 추가/편집 다이얼로그
// ============================================================

function GuestDialog({
  open,
  onOpenChange,
  form,
  setForm,
  onSave,
  saving,
  isEdit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: GuestFormData;
  setForm: (f: GuestFormData) => void;
  onSave: () => void;
  saving: boolean;
  isEdit: boolean;
}) {
  function set<K extends keyof GuestFormData>(key: K, value: GuestFormData[K]) {
    setForm({ ...form, [key]: value });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Crown className="h-4 w-4 text-yellow-500" />
            {isEdit ? "VIP 게스트 수정" : "VIP 게스트 추가"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* 이름 */}
          <div className="space-y-1">
            <Label className="text-xs">
              이름 <span className="text-destructive">*</span>
            </Label>
            <Input
              className="h-8 text-xs"
              placeholder="게스트 이름"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </div>

          {/* 카테고리 + 상태 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">카테고리</Label>
              <Select
                value={form.category}
                onValueChange={(v) => set("category", v as VipGuestCategory)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c} className="text-xs">
                      {CATEGORY_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">상태</Label>
              <Select
                value={form.status}
                onValueChange={(v) => set("status", v as VipGuestStatus)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s} className="text-xs">
                      {STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 소속 */}
          <div className="space-y-1">
            <Label className="text-xs">소속/기관</Label>
            <Input
              className="h-8 text-xs"
              placeholder="회사명, 기관명 등"
              value={form.organization}
              onChange={(e) => set("organization", e.target.value)}
            />
          </div>

          {/* 이메일 + 전화 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1">
                <Mail className="h-3 w-3" /> 이메일
              </Label>
              <Input
                className="h-8 text-xs"
                placeholder="이메일"
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1">
                <Phone className="h-3 w-3" /> 전화번호
              </Label>
              <Input
                className="h-8 text-xs"
                placeholder="전화번호"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
              />
            </div>
          </div>

          {/* 좌석 + 초대자 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1">
                <MapPin className="h-3 w-3" /> 좌석
              </Label>
              <Input
                className="h-8 text-xs"
                placeholder="예: A-01, VIP석"
                value={form.seatAssignment}
                onChange={(e) => set("seatAssignment", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1">
                <Users className="h-3 w-3" /> 초대자{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                className="h-8 text-xs"
                placeholder="초대한 멤버"
                value={form.invitedBy}
                onChange={(e) => set("invitedBy", e.target.value)}
              />
            </div>
          </div>

          {/* +1 동반인 */}
          <div className="flex items-center justify-between rounded-md border p-2">
            <div>
              <p className="text-xs font-medium">동반인 (+1)</p>
              <p className="text-[10px] text-muted-foreground">
                1명 추가 동반 여부
              </p>
            </div>
            <Switch
              checked={form.plusOne}
              onCheckedChange={(v) => set("plusOne", v)}
            />
          </div>

          {/* 특별 요구사항 */}
          <div className="space-y-1">
            <Label className="text-xs">특별 요구사항</Label>
            <Textarea
              className="text-xs min-h-[60px] resize-none"
              placeholder="식이 제한, 접근성 필요 등"
              value={form.specialRequirements}
              onChange={(e) => set("specialRequirements", e.target.value)}
            />
          </div>

          {/* 메모 */}
          <div className="space-y-1">
            <Label className="text-xs">메모</Label>
            <Textarea
              className="text-xs min-h-[60px] resize-none"
              placeholder="기타 메모"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
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
            onClick={onSave}
            disabled={saving}
          >
            {saving ? "저장 중..." : isEdit ? "수정" : "추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
