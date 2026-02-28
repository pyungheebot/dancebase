"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Award,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Pencil,
  X,
  Check,
  AlertTriangle,
  GraduationCap,
  Trophy,
  BookOpen,
  Star,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  useDanceCertification,
  isExpired,
  isExpiringSoon,
  DANCE_CERT_KIND_LABELS,
  DANCE_CERT_KIND_COLORS,
  DANCE_CERT_KINDS,
} from "@/hooks/use-dance-certification";
import type { DanceCertItem, DanceCertKind } from "@/types";

// ─── 종류별 아이콘 ────────────────────────────────────────────

const KIND_ICONS: Record<DanceCertKind, React.ReactNode> = {
  certificate: <GraduationCap className="h-3 w-3" />,
  completion: <BookOpen className="h-3 w-3" />,
  workshop: <Star className="h-3 w-3" />,
  award: <Trophy className="h-3 w-3" />,
};

// ─── 폼 타입 ─────────────────────────────────────────────────

type FormState = {
  name: string;
  issuer: string;
  acquiredAt: string;
  expiresAt: string;
  kind: DanceCertKind;
  grade: string;
  memo: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  issuer: "",
  acquiredAt: "",
  expiresAt: "",
  kind: "certificate",
  grade: "",
  memo: "",
};

// ─── 날짜 유틸 ───────────────────────────────────────────────

function formatDate(iso: string): string {
  return iso.slice(0, 10).replace(/-/g, ".");
}

function daysUntilExpiry(expiresAt: string): number {
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

// ─── 메인 카드 ───────────────────────────────────────────────

export function DanceCertificationCard({ memberId }: { memberId: string }) {
  const { items, loading, addItem, updateItem, deleteItem, stats } =
    useDanceCertification(memberId);

  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DanceCertItem | null>(null);
  const [activeKind, setActiveKind] = useState<DanceCertKind | "all">("all");

  // 만료 임박 항목
  const expiringSoonItems = items.filter(isExpiringSoon);

  // 탭 필터 적용
  const filteredItems =
    activeKind === "all" ? items : items.filter((i) => i.kind === activeKind);

  function openAddDialog() {
    setEditingItem(null);
    setDialogOpen(true);
    if (!open) setOpen(true);
  }

  function openEditDialog(item: DanceCertItem) {
    setEditingItem(item);
    setDialogOpen(true);
    if (!open) setOpen(true);
  }

  function handleDelete(item: DanceCertItem) {
    const ok = deleteItem(item.id);
    if (ok) {
      toast.success(`"${item.name}" 항목이 삭제되었습니다.`);
    } else {
      toast.error("삭제 중 오류가 발생했습니다.");
    }
  }

  // 종류별 가장 큰 카운트 (바 차트 비율용)
  const maxKindCount = Math.max(
    1,
    ...DANCE_CERT_KINDS.map((k) => stats.byKind[k])
  );

  return (
    <Card className="w-full">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader className="pb-2">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer select-none">
              <div className="flex items-center gap-2 flex-wrap">
                <Award className="h-4 w-4 text-yellow-500" />
                <CardTitle className="text-sm font-semibold">
                  댄스 자격증 관리
                </CardTitle>
                <Badge className="text-[10px] px-1.5 py-0 bg-yellow-100 text-yellow-700 border border-yellow-300">
                  총 {stats.total}건
                </Badge>
                {expiringSoonItems.length > 0 && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-orange-100 text-orange-700 border border-orange-300">
                    <AlertTriangle className="h-2.5 w-2.5 mr-0.5 inline" />
                    만료 임박 {expiringSoonItems.length}건
                  </Badge>
                )}
                {stats.expired > 0 && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-gray-100 text-gray-500 border border-gray-300">
                    만료 {stats.expired}건
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    openAddDialog();
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  항목 추가
                </Button>
                {open ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">

            {/* 만료 임박 경고 배너 */}
            {expiringSoonItems.length > 0 && (
              <div className="rounded-md border border-orange-200 bg-orange-50 px-3 py-2 flex items-start gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-orange-600 mt-0.5 shrink-0" />
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-orange-700">
                    30일 이내 만료 예정 항목
                  </p>
                  {expiringSoonItems.map((item) => (
                    <p key={item.id} className="text-xs text-orange-600">
                      {item.name}
                      {item.expiresAt && (
                        <span className="ml-1 text-[11px]">
                          (D-{daysUntilExpiry(item.expiresAt)})
                        </span>
                      )}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* 요약 통계 */}
            {stats.total > 0 && (
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-md border bg-muted/20 px-2.5 py-2 text-center">
                  <p className="text-lg font-bold">{stats.total}</p>
                  <p className="text-[10px] text-muted-foreground">총 취득</p>
                </div>
                <div className="rounded-md border bg-green-50 px-2.5 py-2 text-center">
                  <p className="text-lg font-bold text-green-700">{stats.valid}</p>
                  <p className="text-[10px] text-muted-foreground">유효</p>
                </div>
                <div className="rounded-md border bg-gray-50 px-2.5 py-2 text-center">
                  <p className="text-lg font-bold text-gray-500">{stats.expired}</p>
                  <p className="text-[10px] text-muted-foreground">만료</p>
                </div>
              </div>
            )}

            {/* 종류별 통계 바 차트 */}
            {stats.total > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  종류별 현황
                </p>
                {DANCE_CERT_KINDS.map((kind) => {
                  const count = stats.byKind[kind];
                  if (count === 0) return null;
                  const pct = Math.round((count / maxKindCount) * 100);
                  const colors = DANCE_CERT_KIND_COLORS[kind];
                  return (
                    <div key={kind} className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground w-14 shrink-0">
                        {DANCE_CERT_KIND_LABELS[kind]}
                      </span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${colors.bar}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-medium w-4 text-right">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 목록 */}
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-md" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Award className="h-10 w-10 mx-auto mb-2 opacity-20" />
                <p className="text-xs">등록된 자격증/수료증이 없습니다.</p>
                <p className="text-[11px] mt-0.5">
                  위 버튼으로 첫 항목을 추가해 보세요.
                </p>
              </div>
            ) : (
              <Tabs
                value={activeKind}
                onValueChange={(v) => setActiveKind(v as DanceCertKind | "all")}
              >
                <TabsList className="h-8 flex-wrap gap-0.5">
                  <TabsTrigger value="all" className="text-xs h-7 px-2.5">
                    전체 ({items.length})
                  </TabsTrigger>
                  {DANCE_CERT_KINDS.map((kind) => {
                    const count = stats.byKind[kind];
                    if (count === 0) return null;
                    return (
                      <TabsTrigger
                        key={kind}
                        value={kind}
                        className="text-xs h-7 px-2.5"
                      >
                        {KIND_ICONS[kind]}
                        <span className="ml-1">
                          {DANCE_CERT_KIND_LABELS[kind]} ({count})
                        </span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {(["all", ...DANCE_CERT_KINDS] as Array<DanceCertKind | "all">).map(
                  (kind) => (
                    <TabsContent key={kind} value={kind} className="mt-3 space-y-2">
                      {filteredItems.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">
                          <p className="text-xs">해당 종류의 항목이 없습니다.</p>
                        </div>
                      ) : (
                        filteredItems.map((item) => (
                          <CertItemRow
                            key={item.id}
                            item={item}
                            onEdit={() => openEditDialog(item)}
                            onDelete={() => handleDelete(item)}
                          />
                        ))
                      )}
                    </TabsContent>
                  )
                )}
              </Tabs>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>

      {/* 추가/수정 다이얼로그 */}
      <CertFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingItem={editingItem}
        onSubmit={(params) => {
          if (editingItem) {
            const ok = updateItem(editingItem.id, params);
            if (ok) {
              toast.success(`"${params.name}" 항목이 수정되었습니다.`);
            } else {
              toast.error("수정 중 오류가 발생했습니다.");
              return;
            }
          } else {
            const ok = addItem(params);
            if (ok) {
              toast.success(`"${params.name}" 항목이 추가되었습니다.`);
            } else {
              toast.error("추가 중 오류가 발생했습니다.");
              return;
            }
          }
          setDialogOpen(false);
        }}
      />
    </Card>
  );
}

// ─── 항목 행 ─────────────────────────────────────────────────

interface CertItemRowProps {
  item: DanceCertItem;
  onEdit: () => void;
  onDelete: () => void;
}

function CertItemRow({ item, onEdit, onDelete }: CertItemRowProps) {
  const expired = isExpired(item);
  const expiringSoon = isExpiringSoon(item);
  const colors = DANCE_CERT_KIND_COLORS[item.kind];

  return (
    <div
      className={`rounded-md border px-3 py-2 space-y-1 ${
        expired ? "opacity-60 bg-muted/20" : "bg-background"
      } ${expiringSoon ? "border-orange-300" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          <span className="text-xs font-semibold">{item.name}</span>
          {item.grade && (
            <Badge className="text-[10px] px-1.5 py-0 bg-indigo-100 text-indigo-700 border border-indigo-300 shrink-0">
              {item.grade}
            </Badge>
          )}
          <Badge className={`text-[10px] px-1.5 py-0 border shrink-0 ${colors.badge}`}>
            {KIND_ICONS[item.kind]}
            <span className="ml-0.5">{DANCE_CERT_KIND_LABELS[item.kind]}</span>
          </Badge>
          {expired && (
            <Badge className="text-[10px] px-1.5 py-0 bg-gray-100 text-gray-500 border border-gray-300 shrink-0">
              만료됨
            </Badge>
          )}
          {expiringSoon && !expired && (
            <Badge className="text-[10px] px-1.5 py-0 bg-orange-100 text-orange-700 border border-orange-300 shrink-0">
              <AlertTriangle className="h-2.5 w-2.5 mr-0.5 inline" />
              D-{daysUntilExpiry(item.expiresAt!)}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
            onClick={onEdit}
            title="수정"
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
            onClick={onDelete}
            title="삭제"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap text-[10px] text-muted-foreground">
        <span>{item.issuer}</span>
        <span>취득: {formatDate(item.acquiredAt)}</span>
        {item.expiresAt ? (
          <span
            className={
              expired
                ? "text-gray-500"
                : expiringSoon
                ? "text-orange-600 font-medium"
                : ""
            }
          >
            만료: {formatDate(item.expiresAt)}
          </span>
        ) : (
          <span>만료: 영구</span>
        )}
        {item.memo && (
          <span className="italic truncate max-w-[150px]">{item.memo}</span>
        )}
      </div>
    </div>
  );
}

// ─── 추가/수정 다이얼로그 ─────────────────────────────────────

interface CertFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem: DanceCertItem | null;
  onSubmit: (params: {
    name: string;
    issuer: string;
    acquiredAt: string;
    expiresAt?: string;
    kind: DanceCertKind;
    grade?: string;
    memo?: string;
  }) => void;
}

function CertFormDialog({
  open,
  onOpenChange,
  editingItem,
  onSubmit,
}: CertFormDialogProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  // 다이얼로그가 열릴 때 폼 초기화
  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      if (editingItem) {
        setForm({
          name: editingItem.name,
          issuer: editingItem.issuer,
          acquiredAt: editingItem.acquiredAt,
          expiresAt: editingItem.expiresAt ?? "",
          kind: editingItem.kind,
          grade: editingItem.grade ?? "",
          memo: editingItem.memo ?? "",
        });
      } else {
        setForm(EMPTY_FORM);
      }
    }
    onOpenChange(nextOpen);
  }

  function handleSubmit() {
    if (!form.name.trim()) {
      toast.error("이름을 입력하세요.");
      return;
    }
    if (!form.issuer.trim()) {
      toast.error("발급기관을 입력하세요.");
      return;
    }
    if (!form.acquiredAt) {
      toast.error("취득일을 입력하세요.");
      return;
    }
    if (form.expiresAt && form.expiresAt < form.acquiredAt) {
      toast.error("만료일은 취득일 이후여야 합니다.");
      return;
    }
    setSubmitting(true);
    try {
      onSubmit({
        name: form.name.trim(),
        issuer: form.issuer.trim(),
        acquiredAt: form.acquiredAt,
        expiresAt: form.expiresAt || undefined,
        kind: form.kind,
        grade: form.grade.trim() || undefined,
        memo: form.memo.trim() || undefined,
      });
    } finally {
      setSubmitting(false);
    }
  }

  const isEdit = !!editingItem;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <Award className="h-4 w-4 text-yellow-500" />
            {isEdit ? "자격증 수정" : "자격증 추가"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* 이름 */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">
              이름 <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="예: K-POP 댄스 지도자 1급"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="h-8 text-xs"
            />
          </div>

          {/* 발급기관 */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">
              발급기관 <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="예: 한국댄스스포츠연맹"
              value={form.issuer}
              onChange={(e) => setForm((f) => ({ ...f, issuer: e.target.value }))}
              className="h-8 text-xs"
            />
          </div>

          {/* 종류 */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">
              종류 <span className="text-destructive">*</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {DANCE_CERT_KINDS.map((kind) => {
                const colors = DANCE_CERT_KIND_COLORS[kind];
                return (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, kind }))}
                    className={`text-[11px] px-2.5 py-1 rounded-md border font-medium transition-colors flex items-center gap-1 ${
                      form.kind === kind
                        ? `${colors.badge} border-current`
                        : "bg-background text-muted-foreground border-border hover:bg-accent"
                    }`}
                  >
                    {KIND_ICONS[kind]}
                    {DANCE_CERT_KIND_LABELS[kind]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 취득일 / 등급 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">
                취득일 <span className="text-destructive">*</span>
              </label>
              <Input
                type="date"
                value={form.acquiredAt}
                onChange={(e) =>
                  setForm((f) => ({ ...f, acquiredAt: e.target.value }))
                }
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">
                등급 (선택)
              </label>
              <Input
                placeholder="예: 1급, 마스터"
                value={form.grade}
                onChange={(e) =>
                  setForm((f) => ({ ...f, grade: e.target.value }))
                }
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* 만료일 */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">
              만료일 (선택 — 없으면 영구 유효)
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={form.expiresAt}
                onChange={(e) =>
                  setForm((f) => ({ ...f, expiresAt: e.target.value }))
                }
                className="h-8 text-xs flex-1"
              />
              {form.expiresAt && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => setForm((f) => ({ ...f, expiresAt: "" }))}
                  title="만료일 지우기"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            {form.expiresAt && form.acquiredAt && form.expiresAt >= form.acquiredAt && (
              <p className="text-[10px] text-muted-foreground">
                {daysUntilExpiry(form.expiresAt) > 0
                  ? `만료까지 ${daysUntilExpiry(form.expiresAt)}일 남음`
                  : "이미 만료된 날짜입니다."}
              </p>
            )}
          </div>

          {/* 메모 */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">
              메모 (선택)
            </label>
            <Textarea
              placeholder="자격증 관련 메모나 특이사항을 입력하세요."
              value={form.memo}
              onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))}
              className="text-xs min-h-[56px] resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            <X className="h-3 w-3 mr-1" />
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSubmit}
            disabled={submitting}
          >
            <Check className="h-3 w-3 mr-1" />
            {submitting ? "저장 중..." : isEdit ? "수정 완료" : "추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
