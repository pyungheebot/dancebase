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
  ChevronDown,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  ShieldCheck,
  ShieldOff,
  AlertTriangle,
  IdCard,
} from "lucide-react";
import { toast } from "sonner";
import { useStageAccess } from "@/hooks/use-stage-access";
import type {
  StageAccessPass,
  StageAccessRole,
  StageAccessZone,
  StageAccessStatus,
} from "@/types";

// ─── 레이블/색상 맵 ─────────────────────────────────────────

const ROLE_LABELS: Record<StageAccessRole, string> = {
  출연진: "출연진",
  스태프: "스태프",
  VIP: "VIP",
  미디어: "미디어",
  기타: "기타",
};

const ROLE_COLORS: Record<StageAccessRole, string> = {
  출연진: "bg-purple-100 text-purple-700",
  스태프: "bg-blue-100 text-blue-700",
  VIP: "bg-yellow-100 text-yellow-700",
  미디어: "bg-pink-100 text-pink-700",
  기타: "bg-gray-100 text-gray-600",
};

const ZONE_LABELS: Record<StageAccessZone, string> = {
  무대: "무대",
  백스테이지: "백스테이지",
  관객석: "관객석",
  모든구역: "모든구역",
};

const ZONE_COLORS: Record<StageAccessZone, string> = {
  무대: "bg-orange-100 text-orange-700",
  백스테이지: "bg-indigo-100 text-indigo-700",
  관객석: "bg-cyan-100 text-cyan-700",
  모든구역: "bg-green-100 text-green-700",
};

const STATUS_COLORS: Record<StageAccessStatus, string> = {
  활성: "bg-green-100 text-green-700",
  비활성: "bg-gray-100 text-gray-600",
  분실: "bg-red-100 text-red-700",
};

const STATUS_ICONS: Record<StageAccessStatus, React.ReactNode> = {
  활성: <ShieldCheck className="h-3 w-3" />,
  비활성: <ShieldOff className="h-3 w-3" />,
  분실: <AlertTriangle className="h-3 w-3" />,
};

const ALL_ROLES: StageAccessRole[] = ["출연진", "스태프", "VIP", "미디어", "기타"];
const ALL_ZONES: StageAccessZone[] = ["무대", "백스테이지", "관객석", "모든구역"];
const ALL_STATUSES: StageAccessStatus[] = ["활성", "비활성", "분실"];

// ─── 폼 상태 타입 ────────────────────────────────────────────

type PassFormState = Omit<StageAccessPass, "id" | "createdAt">;

function buildEmptyForm(): PassFormState {
  return {
    name: "",
    role: "출연진",
    zone: "무대",
    passNumber: "",
    issuedAt: new Date().toISOString().slice(0, 10),
    expiresAt: "",
    status: "활성",
  };
}

// ─── 패스 행 컴포넌트 ─────────────────────────────────────────

function PassRow({
  pass,
  onEdit,
  onDelete,
}: {
  pass: StageAccessPass;
  onEdit: (pass: StageAccessPass) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 py-2 px-3 rounded-md hover:bg-muted/40 group transition-colors">
      {/* 상태 배지 */}
      <span
        className={`flex items-center gap-1 shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium ${STATUS_COLORS[pass.status]}`}
      >
        {STATUS_ICONS[pass.status]}
        <span>{pass.status}</span>
      </span>

      {/* 이름 + 패스번호 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-medium truncate">{pass.name}</span>
          <span className="text-[10px] text-muted-foreground font-mono">
            #{pass.passNumber}
          </span>
        </div>
        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
          <span
            className={`text-[10px] px-1.5 py-0 rounded-full font-medium ${ROLE_COLORS[pass.role]}`}
          >
            {ROLE_LABELS[pass.role]}
          </span>
          <span
            className={`text-[10px] px-1.5 py-0 rounded-full font-medium ${ZONE_COLORS[pass.zone]}`}
          >
            {ZONE_LABELS[pass.zone]}
          </span>
          {pass.expiresAt && (
            <span className="text-[10px] text-muted-foreground">
              ~{pass.expiresAt}
            </span>
          )}
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0"
          onClick={() => onEdit(pass)}
        >
          <Pencil className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
          onClick={() => onDelete(pass.id)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// ─── 역할별 바 차트 ────────────────────────────────────────────

function RoleBarChart({ byRole }: { byRole: Record<StageAccessRole, number> }) {
  const maxCount = Math.max(...Object.values(byRole), 1);

  return (
    <div className="space-y-1.5">
      {ALL_ROLES.map((role) => {
        const count = byRole[role];
        const pct = Math.round((count / maxCount) * 100);
        return (
          <div key={role} className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground w-14 shrink-0">
              {role}
            </span>
            <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${ROLE_COLORS[role].replace("text-", "bg-").replace(/-\d+$/, "-400")}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[10px] font-medium w-4 text-right shrink-0">
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── 패스 다이얼로그 폼 ──────────────────────────────────────────

function PassDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: PassFormState;
  onSubmit: (form: PassFormState) => void;
}) {
  const [form, setForm] = useState<PassFormState>(initial);

  // 다이얼로그 열릴 때 초기값 동기화
  const handleOpenChange = (v: boolean) => {
    if (v) setForm(initial);
    onOpenChange(v);
  };

  function set<K extends keyof PassFormState>(key: K, value: PassFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("이름을 입력해주세요.");
      return;
    }
    if (!form.passNumber.trim()) {
      toast.error("패스 번호를 입력해주세요.");
      return;
    }
    onSubmit(form);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">
            {initial.name ? "패스 수정" : "패스 추가"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* 이름 */}
          <div className="space-y-1">
            <Label className="text-xs">이름</Label>
            <Input
              className="h-8 text-xs"
              placeholder="홍길동"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </div>

          {/* 역할 */}
          <div className="space-y-1">
            <Label className="text-xs">역할</Label>
            <Select
              value={form.role}
              onValueChange={(v) => set("role", v as StageAccessRole)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_ROLES.map((r) => (
                  <SelectItem key={r} value={r} className="text-xs">
                    {ROLE_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 출입 가능 구역 */}
          <div className="space-y-1">
            <Label className="text-xs">출입 가능 구역</Label>
            <Select
              value={form.zone}
              onValueChange={(v) => set("zone", v as StageAccessZone)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_ZONES.map((z) => (
                  <SelectItem key={z} value={z} className="text-xs">
                    {ZONE_LABELS[z]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 패스 번호 */}
          <div className="space-y-1">
            <Label className="text-xs">패스 번호</Label>
            <Input
              className="h-8 text-xs font-mono"
              placeholder="A-001"
              value={form.passNumber}
              onChange={(e) => set("passNumber", e.target.value)}
            />
          </div>

          {/* 발급일 / 유효기간 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">발급일</Label>
              <Input
                type="date"
                className="h-8 text-xs"
                value={form.issuedAt}
                onChange={(e) => set("issuedAt", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">유효기간</Label>
              <Input
                type="date"
                className="h-8 text-xs"
                value={form.expiresAt}
                onChange={(e) => set("expiresAt", e.target.value)}
              />
            </div>
          </div>

          {/* 상태 */}
          <div className="space-y-1">
            <Label className="text-xs">상태</Label>
            <Select
              value={form.status}
              onValueChange={(v) => set("status", v as StageAccessStatus)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="text-xs">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => onOpenChange(false)}
            >
              취소
            </Button>
            <Button type="submit" size="sm" className="h-7 text-xs">
              저장
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── 메인 카드 컴포넌트 ──────────────────────────────────────────

export function StageAccessCard({ projectId }: { projectId: string }) {
  const { data, stats, addPass, updatePass, removePass } =
    useStageAccess(projectId);

  const [open, setOpen] = useState(false);
  const [roleFilter, setRoleFilter] = useState<StageAccessRole | "전체">("전체");
  const [statusFilter, setStatusFilter] =
    useState<StageAccessStatus | "전체">("전체");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<StageAccessPass | null>(null);

  // 필터링된 패스 목록
  const filtered = data.passes.filter((p) => {
    const roleMatch = roleFilter === "전체" || p.role === roleFilter;
    const statusMatch = statusFilter === "전체" || p.status === statusFilter;
    return roleMatch && statusMatch;
  });

  // 추가 다이얼로그 열기
  function openAdd() {
    setEditTarget(null);
    setDialogOpen(true);
  }

  // 수정 다이얼로그 열기
  function openEdit(pass: StageAccessPass) {
    setEditTarget(pass);
    setDialogOpen(true);
  }

  // 저장 처리
  function handleSubmit(form: PassFormState) {
    if (editTarget) {
      updatePass(editTarget.id, form);
      toast.success("패스가 수정되었습니다.");
    } else {
      addPass(form);
      toast.success("패스가 추가되었습니다.");
    }
  }

  // 삭제 처리
  function handleDelete(id: string) {
    removePass(id);
    toast.success("패스가 삭제되었습니다.");
  }

  const dialogInitial: PassFormState = editTarget
    ? {
        name: editTarget.name,
        role: editTarget.role,
        zone: editTarget.zone,
        passNumber: editTarget.passNumber,
        issuedAt: editTarget.issuedAt,
        expiresAt: editTarget.expiresAt,
        status: editTarget.status,
      }
    : buildEmptyForm();

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      {/* 카드 헤더 */}
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/30 rounded-lg transition-colors">
          <div className="flex items-center gap-2">
            <IdCard className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">무대 출입 관리</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {stats.total}
            </Badge>
            {stats.active > 0 && (
              <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 border-0">
                활성 {stats.active}
              </Badge>
            )}
          </div>
          {open ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="px-3 pb-3 space-y-3">
          {/* 통계 요약 */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-muted/40 rounded-md p-2 text-center">
              <p className="text-lg font-bold">{stats.total}</p>
              <p className="text-[10px] text-muted-foreground">전체 패스</p>
            </div>
            <div className="bg-green-50 rounded-md p-2 text-center">
              <p className="text-lg font-bold text-green-700">{stats.active}</p>
              <p className="text-[10px] text-muted-foreground">활성</p>
            </div>
            <div className="bg-red-50 rounded-md p-2 text-center">
              <p className="text-lg font-bold text-red-700">
                {stats.byStatus["분실"]}
              </p>
              <p className="text-[10px] text-muted-foreground">분실</p>
            </div>
          </div>

          {/* 역할별 바 차트 */}
          {stats.total > 0 && (
            <div className="bg-muted/30 rounded-md p-2.5">
              <p className="text-[10px] font-medium text-muted-foreground mb-2">
                역할별 인원
              </p>
              <RoleBarChart byRole={stats.byRole} />
            </div>
          )}

          {/* 필터 + 추가 버튼 */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* 역할 필터 */}
            <Select
              value={roleFilter}
              onValueChange={(v) =>
                setRoleFilter(v as StageAccessRole | "전체")
              }
            >
              <SelectTrigger className="h-7 text-xs w-28">
                <SelectValue placeholder="역할" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="전체" className="text-xs">
                  전체 역할
                </SelectItem>
                {ALL_ROLES.map((r) => (
                  <SelectItem key={r} value={r} className="text-xs">
                    {ROLE_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 상태 필터 */}
            <Select
              value={statusFilter}
              onValueChange={(v) =>
                setStatusFilter(v as StageAccessStatus | "전체")
              }
            >
              <SelectTrigger className="h-7 text-xs w-24">
                <SelectValue placeholder="상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="전체" className="text-xs">
                  전체 상태
                </SelectItem>
                {ALL_STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="text-xs">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex-1" />

            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={openAdd}
            >
              <Plus className="h-3 w-3 mr-1" />
              패스 추가
            </Button>
          </div>

          {/* 패스 목록 */}
          {filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              {data.passes.length === 0
                ? "등록된 출입 패스가 없습니다."
                : "필터 조건에 맞는 패스가 없습니다."}
            </p>
          ) : (
            <div className="space-y-0.5">
              {filtered.map((pass) => (
                <PassRow
                  key={pass.id}
                  pass={pass}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </CollapsibleContent>

      {/* 패스 추가/수정 다이얼로그 */}
      <PassDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={dialogInitial}
        onSubmit={handleSubmit}
      />
    </Collapsible>
  );
}
