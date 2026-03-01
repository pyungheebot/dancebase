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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
  StickyNote,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { useVipGuest } from "@/hooks/use-vip-guest";
import { useAsyncAction } from "@/hooks/use-async-action";
import { useDeleteConfirm } from "@/hooks/use-delete-confirm";
import type { VipGuestEntry, VipGuestTier, VipGuestStatus } from "@/types";

// ============================================================
// 상수 & 레이블
// ============================================================

const TIER_LABELS: Record<VipGuestTier, string> = {
  VVIP: "VVIP",
  VIP: "VIP",
  general: "일반 초대",
};

const TIER_COLORS: Record<VipGuestTier, string> = {
  VVIP: "bg-amber-100 text-amber-800 border-amber-300",
  VIP: "bg-purple-100 text-purple-800 border-purple-300",
  general: "bg-gray-100 text-gray-700 border-gray-300",
};

const TIER_DOT_COLORS: Record<VipGuestTier, string> = {
  VVIP: "bg-amber-400",
  VIP: "bg-purple-400",
  general: "bg-gray-400",
};

const STATUS_LABELS: Record<VipGuestStatus, string> = {
  pending: "초대 예정",
  invited: "초대 완료",
  confirmed: "참석 확정",
  declined: "불참",
};

const STATUS_COLORS: Record<VipGuestStatus, string> = {
  pending: "bg-blue-100 text-blue-700 border-blue-300",
  invited: "bg-yellow-100 text-yellow-700 border-yellow-300",
  confirmed: "bg-green-100 text-green-700 border-green-300",
  declined: "bg-gray-100 text-gray-600 border-gray-300",
};

const STATUS_DOT_COLORS: Record<VipGuestStatus, string> = {
  pending: "bg-blue-400",
  invited: "bg-yellow-400",
  confirmed: "bg-green-500",
  declined: "bg-gray-400",
};

const TIER_OPTIONS: VipGuestTier[] = ["VVIP", "VIP", "general"];
const STATUS_OPTIONS: VipGuestStatus[] = ["pending", "invited", "confirmed", "declined"];

// ============================================================
// 폼 타입
// ============================================================

type GuestFormData = {
  name: string;
  organization: string;
  title: string;
  phone: string;
  email: string;
  tier: VipGuestTier;
  status: VipGuestStatus;
  seatZone: string;
  seatNumber: string;
  specialRequest: string;
};

function emptyForm(): GuestFormData {
  return {
    name: "",
    organization: "",
    title: "",
    phone: "",
    email: "",
    tier: "VIP",
    status: "pending",
    seatZone: "",
    seatNumber: "",
    specialRequest: "",
  };
}

function entryToForm(entry: VipGuestEntry): GuestFormData {
  return {
    name: entry.name,
    organization: entry.organization ?? "",
    title: entry.title ?? "",
    phone: entry.phone ?? "",
    email: entry.email ?? "",
    tier: entry.tier,
    status: entry.status,
    seatZone: entry.seatZone ?? "",
    seatNumber: entry.seatNumber ?? "",
    specialRequest: entry.specialRequest ?? "",
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
  const { entries, loading, addEntry, updateEntry, deleteEntry, stats } =
    useVipGuest(groupId, projectId);

  const [isOpen, setIsOpen] = useState(false);
  const [tierFilter, setTierFilter] = useState<VipGuestTier | "all">("all");
  const [statusFilter, setStatusFilter] = useState<VipGuestStatus | "all">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<VipGuestEntry | null>(null);
  const [form, setForm] = useState<GuestFormData>(emptyForm());
  const { pending: saving, execute: executeSave } = useAsyncAction();
  const deleteConfirm = useDeleteConfirm<VipGuestEntry>();

  // 필터링된 게스트 목록
  const filtered = entries.filter((e) => {
    if (tierFilter !== "all" && e.tier !== tierFilter) return false;
    if (statusFilter !== "all" && e.status !== statusFilter) return false;
    return true;
  });

  // 다이얼로그 열기
  function openAdd() {
    setEditTarget(null);
    setForm(emptyForm());
    setDialogOpen(true);
  }

  function openEdit(entry: VipGuestEntry) {
    setEditTarget(entry);
    setForm(entryToForm(entry));
    setDialogOpen(true);
  }

  // 저장
  async function handleSave() {
    if (!form.name.trim()) {
      toast.error("게스트 이름을 입력해주세요.");
      return;
    }
    await executeSave(async () => {
      if (editTarget) {
        const ok = updateEntry(editTarget.id, {
          name: form.name,
          organization: form.organization,
          title: form.title,
          phone: form.phone,
          email: form.email,
          tier: form.tier,
          status: form.status,
          seatZone: form.seatZone,
          seatNumber: form.seatNumber,
          specialRequest: form.specialRequest,
        });
        if (ok) {
          toast.success("게스트 정보가 수정되었습니다.");
        } else {
          toast.error("수정에 실패했습니다.");
        }
      } else {
        addEntry({
          name: form.name,
          organization: form.organization || undefined,
          title: form.title || undefined,
          phone: form.phone || undefined,
          email: form.email || undefined,
          tier: form.tier,
          status: form.status,
          seatZone: form.seatZone || undefined,
          seatNumber: form.seatNumber || undefined,
          specialRequest: form.specialRequest || undefined,
        });
        toast.success("VIP 게스트가 추가되었습니다.");
      }
      setDialogOpen(false);
    });
  }

  // 삭제 확인
  function handleDeleteConfirm() {
    const target = deleteConfirm.confirm();
    if (!target) return;
    const ok = deleteEntry(target.id);
    if (ok) {
      toast.success(`${target.name} 게스트가 삭제되었습니다.`);
    } else {
      toast.error("삭제에 실패했습니다.");
    }
  }

  // 상태 변경
  function handleStatusChange(entryId: string, status: VipGuestStatus) {
    const ok = updateEntry(entryId, { status });
    if (ok) {
      toast.success(`상태가 "${STATUS_LABELS[status]}"(으)로 변경되었습니다.`);
    } else {
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
                  <Crown className="h-4 w-4 text-amber-500" />
                  <CardTitle className="text-sm font-semibold">
                    VIP 게스트 관리
                  </CardTitle>
                  <Badge className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-800 border border-amber-300">
                    {stats.total}명
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
            {stats.total > 0 && (
              <div className="mt-2 flex gap-2 flex-wrap">
                {/* 등급별 */}
                {TIER_OPTIONS.filter((t) => stats.byTier[t] > 0).map((t) => (
                  <span
                    key={t}
                    className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${TIER_COLORS[t]}`}
                  >
                    {TIER_LABELS[t]} {stats.byTier[t]}
                  </span>
                ))}
                <span className="text-[10px] px-1.5 py-0.5 rounded-full border font-medium bg-green-100 text-green-700 border-green-300">
                  참석 확정 {stats.confirmedCount}
                </span>
                {stats.seatedCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full border font-medium bg-indigo-100 text-indigo-700 border-indigo-300">
                    좌석 배정 {stats.seatedCount}
                  </span>
                )}
              </div>
            )}
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="pt-0">
              {/* 필터 */}
              <div className="space-y-1.5 mb-3">
                {/* 등급 필터 */}
                <div className="flex gap-1 flex-wrap">
                  <button
                    onClick={() => setTierFilter("all")}
                    className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                      tierFilter === "all"
                        ? "bg-foreground text-background border-foreground"
                        : "bg-background text-muted-foreground border-border hover:border-foreground/50"
                    }`}
                  >
                    전체 등급
                  </button>
                  {TIER_OPTIONS.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTierFilter(t)}
                      className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                        tierFilter === t
                          ? "bg-foreground text-background border-foreground"
                          : "bg-background text-muted-foreground border-border hover:border-foreground/50"
                      }`}
                    >
                      {TIER_LABELS[t]}
                    </button>
                  ))}
                </div>
                {/* 상태 필터 */}
                <div className="flex gap-1 flex-wrap">
                  <button
                    onClick={() => setStatusFilter("all")}
                    className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                      statusFilter === "all"
                        ? "bg-foreground text-background border-foreground"
                        : "bg-background text-muted-foreground border-border hover:border-foreground/50"
                    }`}
                  >
                    전체 상태
                  </button>
                  {STATUS_OPTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                        statusFilter === s
                          ? "bg-foreground text-background border-foreground"
                          : "bg-background text-muted-foreground border-border hover:border-foreground/50"
                      }`}
                    >
                      {STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>

              {/* 게스트 목록 */}
              {loading ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  불러오는 중...
                </p>
              ) : filtered.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  {entries.length === 0
                    ? "등록된 VIP 게스트가 없습니다."
                    : "필터 조건에 맞는 게스트가 없습니다."}
                </p>
              ) : (
                <div className="space-y-2">
                  {filtered.map((entry) => (
                    <GuestRow
                      key={entry.id}
                      entry={entry}
                      onEdit={() => openEdit(entry)}
                      onDelete={() => deleteConfirm.request(entry)}
                      onStatusChange={(status) =>
                        handleStatusChange(entry.id, status)
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

      {/* 삭제 확인 */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={deleteConfirm.onOpenChange}
        title="게스트 삭제"
        description={`${deleteConfirm.target?.name} 게스트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        onConfirm={handleDeleteConfirm}
        destructive
      />
    </>
  );
}

// ============================================================
// 게스트 행 컴포넌트
// ============================================================

function GuestRow({
  entry,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  entry: VipGuestEntry;
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
          <span className="text-xs font-semibold truncate">{entry.name}</span>
          {entry.title && (
            <span className="text-[10px] text-muted-foreground">{entry.title}</span>
          )}
          <span
            className={`text-[10px] px-1.5 py-0 rounded-full border font-medium ${TIER_COLORS[entry.tier]}`}
          >
            {TIER_LABELS[entry.tier]}
          </span>
        </div>

        {entry.organization && (
          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
            {entry.organization}
          </p>
        )}

        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {(entry.seatZone || entry.seatNumber) && (
            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <MapPin className="h-2.5 w-2.5" />
              {[entry.seatZone, entry.seatNumber].filter(Boolean).join(" - ")}
            </span>
          )}
          {entry.email && (
            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <Mail className="h-2.5 w-2.5" />
              <span className="truncate max-w-[120px]">{entry.email}</span>
            </span>
          )}
          {entry.phone && (
            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <Phone className="h-2.5 w-2.5" />
              {entry.phone}
            </span>
          )}
          {entry.specialRequest && (
            <span className="flex items-center gap-0.5 text-[10px] text-amber-600">
              <StickyNote className="h-2.5 w-2.5" />
              특별 요청
            </span>
          )}
        </div>
      </div>

      {/* 상태 드롭다운 + 액션 */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium flex items-center gap-0.5 cursor-pointer hover:opacity-80 transition-opacity ${STATUS_COLORS[entry.status]}`}
            >
              {STATUS_LABELS[entry.status]}
              <ChevronRight className="h-2.5 w-2.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            {STATUS_OPTIONS.map((s) => (
              <DropdownMenuItem
                key={s}
                className="text-xs cursor-pointer"
                onClick={() => onStatusChange(s)}
              >
                <span
                  className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${STATUS_DOT_COLORS[s]}`}
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
            <Crown className="h-4 w-4 text-amber-500" />
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

          {/* 직함 + 소속 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">직함</Label>
              <Input
                className="h-8 text-xs"
                placeholder="예: 대표, 감독"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">소속</Label>
              <Input
                className="h-8 text-xs"
                placeholder="회사명, 기관명"
                value={form.organization}
                onChange={(e) => set("organization", e.target.value)}
              />
            </div>
          </div>

          {/* 등급 + 상태 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">등급</Label>
              <Select
                value={form.tier}
                onValueChange={(v) => set("tier", v as VipGuestTier)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIER_OPTIONS.map((t) => (
                    <SelectItem key={t} value={t} className="text-xs">
                      <span className="flex items-center gap-1.5">
                        <span className={`inline-block w-1.5 h-1.5 rounded-full ${TIER_DOT_COLORS[t]}`} />
                        {TIER_LABELS[t]}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">초대 상태</Label>
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
                      <span className="flex items-center gap-1.5">
                        <span className={`inline-block w-1.5 h-1.5 rounded-full ${STATUS_DOT_COLORS[s]}`} />
                        {STATUS_LABELS[s]}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 연락처 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1">
                <Phone className="h-3 w-3" /> 연락처
              </Label>
              <Input
                className="h-8 text-xs"
                placeholder="010-0000-0000"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1">
                <Mail className="h-3 w-3" /> 이메일
              </Label>
              <Input
                className="h-8 text-xs"
                placeholder="이메일 주소"
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </div>
          </div>

          {/* 좌석 배정 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1">
                <MapPin className="h-3 w-3" /> 좌석 구역
              </Label>
              <Input
                className="h-8 text-xs"
                placeholder="예: VIP존, A구역"
                value={form.seatZone}
                onChange={(e) => set("seatZone", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">좌석 번호</Label>
              <Input
                className="h-8 text-xs"
                placeholder="예: A-01, 3번"
                value={form.seatNumber}
                onChange={(e) => set("seatNumber", e.target.value)}
              />
            </div>
          </div>

          {/* 특별 요청 사항 */}
          <div className="space-y-1">
            <Label className="text-xs flex items-center gap-1">
              <StickyNote className="h-3 w-3" /> 특별 요청 사항
            </Label>
            <Textarea
              className="text-xs min-h-[64px] resize-none"
              placeholder="식이 제한, 접근성 요청, 기타 메모 등"
              value={form.specialRequest}
              onChange={(e) => set("specialRequest", e.target.value)}
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
