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
  FileText,
  RefreshCw,
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useDanceCertificationManager,
  CERT_CATEGORY_LABELS,
  CERT_STATUS_LABELS,
  CERT_STATUS_COLORS,
  CERT_CATEGORY_COLORS,
  RENEWAL_WARNING_DAYS,
} from "@/hooks/use-dance-certification-manager";
import type {
  DanceCertificationCategory,
  DanceCertificationStatus,
  DanceCertificationEntry,
} from "@/types";

// ============================================
// 카테고리 순서
// ============================================

const CATEGORY_ORDER: DanceCertificationCategory[] = [
  "genre",
  "instructor",
  "judge",
  "safety",
  "other",
];

const STATUS_ORDER: DanceCertificationStatus[] = ["valid", "renewal", "expired"];

// ============================================
// 컴포넌트 Props
// ============================================

interface DanceCertificationCardProps {
  memberId: string;
  memberName?: string;
}

// ============================================
// 폼 초기값
// ============================================

type FormState = {
  name: string;
  issuer: string;
  issuedAt: string;
  expiresAt: string;
  grade: string;
  category: DanceCertificationCategory;
  fileUrl: string;
  note: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  issuer: "",
  issuedAt: "",
  expiresAt: "",
  grade: "",
  category: "genre",
  fileUrl: "",
  note: "",
};

// ============================================
// 메인 컴포넌트
// ============================================

export function DanceCertificationCard({
  memberId,
  memberName,
}: DanceCertificationCardProps) {
  const {
    entries,
    loading,
    expiringEntries,
    expiredEntries,
    categoryStats,
    addEntry,
    updateEntry,
    deleteEntry,
    syncStatuses,
  } = useDanceCertificationManager(memberId);

  const [open, setOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<DanceCertificationStatus | "all">("all");
  const [filterCategory, setFilterCategory] = useState<DanceCertificationCategory | "all">("all");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const totalCount = entries.length;

  // 필터 적용
  const filteredEntries = entries.filter((e) => {
    if (filterStatus !== "all" && e.status !== filterStatus) return false;
    if (filterCategory !== "all" && e.category !== filterCategory) return false;
    return true;
  });

  // 폼 초기화
  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
  }

  // 편집 시작
  function startEdit(entry: DanceCertificationEntry) {
    setForm({
      name: entry.name,
      issuer: entry.issuer,
      issuedAt: entry.issuedAt,
      expiresAt: entry.expiresAt ?? "",
      grade: entry.grade ?? "",
      category: entry.category,
      fileUrl: entry.fileUrl ?? "",
      note: entry.note ?? "",
    });
    setEditingId(entry.id);
    setFormOpen(true);
    if (!open) setOpen(true);
  }

  // 유효성 검사
  function validate(): boolean {
    if (!form.name.trim()) {
      toast.error("자격증명을 입력하세요.");
      return false;
    }
    if (!form.issuer.trim()) {
      toast.error("발급 기관을 입력하세요.");
      return false;
    }
    if (!form.issuedAt) {
      toast.error("취득일을 입력하세요.");
      return false;
    }
    return true;
  }

  // 저장 (추가 또는 수정)
  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        issuer: form.issuer.trim(),
        issuedAt: form.issuedAt,
        expiresAt: form.expiresAt || undefined,
        grade: form.grade.trim() || undefined,
        category: form.category,
        fileUrl: form.fileUrl.trim() || undefined,
        note: form.note.trim() || undefined,
      };

      if (editingId) {
        await updateEntry(editingId, payload);
        toast.success(`"${form.name.trim()}" 자격증이 수정되었습니다.`);
      } else {
        await addEntry(payload);
        toast.success(`"${form.name.trim()}" 자격증이 추가되었습니다.`);
      }
      resetForm();
      setFormOpen(false);
    } catch {
      toast.error("저장 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  // 삭제
  async function handleDelete(entry: DanceCertificationEntry) {
    try {
      await deleteEntry(entry.id);
      toast.success(`"${entry.name}" 자격증이 삭제되었습니다.`);
    } catch {
      toast.error("삭제 중 오류가 발생했습니다.");
    }
  }

  // 상태 동기화
  async function handleSync() {
    try {
      await syncStatuses();
      toast.success("자격증 상태가 최신 날짜 기준으로 동기화되었습니다.");
    } catch {
      toast.error("동기화 중 오류가 발생했습니다.");
    }
  }

  // 날짜 포매터
  function formatDate(iso: string) {
    return iso.slice(0, 10).replace(/-/g, ".");
  }

  // 만료까지 남은 일수
  function daysUntilExpiry(expiresAt: string): number {
    const diffMs = new Date(expiresAt).getTime() - Date.now();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  return (
    <Card className="w-full">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader className="pb-2">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer select-none">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-yellow-500" />
                <CardTitle className="text-sm font-semibold">
                  {memberName ? `${memberName}의 ` : ""}댄스 자격증
                </CardTitle>
                <Badge className="text-[10px] px-1.5 py-0 bg-yellow-100 text-yellow-700 border border-yellow-300">
                  {totalCount}건
                </Badge>
                {expiringEntries.length > 0 && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-yellow-50 text-yellow-600 border border-yellow-300">
                    <AlertTriangle className="h-2.5 w-2.5 mr-0.5 inline" />
                    갱신 {expiringEntries.length}건
                  </Badge>
                )}
                {expiredEntries.length > 0 && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-gray-100 text-gray-500 border border-gray-300">
                    만료 {expiredEntries.length}건
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!open) setOpen(true);
                    resetForm();
                    setFormOpen((prev) => !prev);
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  자격증 추가
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
            {expiringEntries.length > 0 && (
              <div className="rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 flex items-start gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-yellow-600 mt-0.5 shrink-0" />
                <div className="text-xs text-yellow-700 space-y-0.5">
                  <p className="font-semibold">갱신이 필요한 자격증</p>
                  {expiringEntries.map((e) => (
                    <p key={e.id}>
                      {e.name}
                      {e.expiresAt && (
                        <span className="ml-1 text-[11px]">
                          ({daysUntilExpiry(e.expiresAt) > 0
                            ? `${daysUntilExpiry(e.expiresAt)}일 후 만료`
                            : "곧 만료"})
                        </span>
                      )}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* 자격증 추가/수정 폼 */}
            {formOpen && (
              <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {editingId ? "자격증 수정" : "신규 자격증 추가"}
                </p>

                {/* 자격증명 */}
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">자격증명 *</label>
                  <Input
                    placeholder="예: 사교댄스 1급 지도자 자격증"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="h-8 text-xs"
                  />
                </div>

                {/* 발급 기관 */}
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">발급 기관 *</label>
                  <Input
                    placeholder="예: 한국댄스스포츠연맹"
                    value={form.issuer}
                    onChange={(e) => setForm((f) => ({ ...f, issuer: e.target.value }))}
                    className="h-8 text-xs"
                  />
                </div>

                {/* 취득일 / 등급 */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">취득일 *</label>
                    <Input
                      type="date"
                      value={form.issuedAt}
                      onChange={(e) => setForm((f) => ({ ...f, issuedAt: e.target.value }))}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">등급 (선택)</label>
                    <Input
                      placeholder="예: 1급, 마스터"
                      value={form.grade}
                      onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value }))}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                {/* 만료일 */}
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">
                    만료일 (선택, 없으면 영구)
                  </label>
                  <Input
                    type="date"
                    value={form.expiresAt}
                    onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                    className="h-8 text-xs"
                  />
                  {form.expiresAt && (
                    <p className="text-[10px] text-muted-foreground">
                      만료까지 {daysUntilExpiry(form.expiresAt) > 0
                        ? `${daysUntilExpiry(form.expiresAt)}일`
                        : "이미 만료됨"}
                    </p>
                  )}
                </div>

                {/* 카테고리 */}
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">카테고리</label>
                  <Select
                    value={form.category}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, category: v as DanceCertificationCategory }))
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_ORDER.map((cat) => (
                        <SelectItem key={cat} value={cat} className="text-xs">
                          {CERT_CATEGORY_LABELS[cat]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 파일 URL */}
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">파일 URL (선택)</label>
                  <Input
                    placeholder="https://..."
                    value={form.fileUrl}
                    onChange={(e) => setForm((f) => ({ ...f, fileUrl: e.target.value }))}
                    className="h-8 text-xs"
                  />
                </div>

                {/* 메모 */}
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">메모 (선택)</label>
                  <Input
                    placeholder="자격증 관련 메모"
                    value={form.note}
                    onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                    className="h-8 text-xs"
                  />
                </div>

                {/* 버튼 */}
                <div className="flex gap-2 justify-end pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => {
                      resetForm();
                      setFormOpen(false);
                    }}
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
                    {submitting ? "저장 중..." : editingId ? "수정 완료" : "추가"}
                  </Button>
                </div>
              </div>
            )}

            {/* 카테고리별 통계 */}
            {totalCount > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {CATEGORY_ORDER.filter((cat) => categoryStats[cat] > 0).map((cat) => (
                  <Badge
                    key={cat}
                    className={`text-[10px] px-1.5 py-0 border cursor-pointer ${
                      filterCategory === cat
                        ? CERT_CATEGORY_COLORS[cat]
                        : "bg-muted text-muted-foreground border-transparent"
                    }`}
                    onClick={() =>
                      setFilterCategory((prev) => (prev === cat ? "all" : cat))
                    }
                  >
                    {CERT_CATEGORY_LABELS[cat]} {categoryStats[cat]}
                  </Badge>
                ))}
              </div>
            )}

            {/* 상태 필터 */}
            {totalCount > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setFilterStatus("all")}
                  className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                    filterStatus === "all"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:bg-accent"
                  }`}
                >
                  전체 {totalCount}
                </button>
                {STATUS_ORDER.map((st) => {
                  const count = entries.filter((e) => e.status === st).length;
                  if (count === 0) return null;
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() =>
                        setFilterStatus((prev) => (prev === st ? "all" : st))
                      }
                      className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                        filterStatus === st
                          ? `${CERT_STATUS_COLORS[st].badge} border-current`
                          : "bg-background text-muted-foreground border-border hover:bg-accent"
                      }`}
                    >
                      {CERT_STATUS_LABELS[st]} {count}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={handleSync}
                  className="ml-auto text-[11px] px-2 py-0.5 rounded-full border bg-background text-muted-foreground border-border hover:bg-accent transition-colors flex items-center gap-1"
                  title="상태 동기화"
                >
                  <RefreshCw className="h-2.5 w-2.5" />
                  상태 동기화
                </button>
              </div>
            )}

            {/* 자격증 목록 */}
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-md" />
                ))}
              </div>
            ) : totalCount === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Award className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">등록된 자격증이 없습니다.</p>
                <p className="text-[11px] mt-0.5">위 버튼으로 자격증을 추가하세요.</p>
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <p className="text-xs">필터 조건에 맞는 자격증이 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredEntries.map((entry) => (
                  <CertEntryRow
                    key={entry.id}
                    entry={entry}
                    onEdit={() => startEdit(entry)}
                    onDelete={() => handleDelete(entry)}
                    formatDate={formatDate}
                    daysUntilExpiry={daysUntilExpiry}
                  />
                ))}
              </div>
            )}

          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// ============================================
// 자격증 항목 행
// ============================================

interface CertEntryRowProps {
  entry: DanceCertificationEntry;
  onEdit: () => void;
  onDelete: () => void;
  formatDate: (iso: string) => string;
  daysUntilExpiry: (expiresAt: string) => number;
}

function CertEntryRow({
  entry,
  onEdit,
  onDelete,
  formatDate,
  daysUntilExpiry,
}: CertEntryRowProps) {
  const statusColor = CERT_STATUS_COLORS[entry.status];
  const categoryColor = CERT_CATEGORY_COLORS[entry.category];

  return (
    <div
      className={`rounded-md border px-3 py-2 space-y-1 ${
        entry.status === "expired" ? "opacity-60 bg-muted/20" : "bg-background"
      }`}
    >
      {/* 상단: 자격증명 + 배지 + 액션 버튼 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          <span className="text-xs font-semibold truncate max-w-[140px] sm:max-w-none">
            {entry.name}
          </span>
          {entry.grade && (
            <Badge className="text-[10px] px-1.5 py-0 bg-indigo-100 text-indigo-700 border border-indigo-300 shrink-0">
              {entry.grade}
            </Badge>
          )}
          <Badge
            className={`text-[10px] px-1.5 py-0 border shrink-0 ${categoryColor}`}
          >
            {CERT_CATEGORY_LABELS[entry.category]}
          </Badge>
          <Badge
            className={`text-[10px] px-1.5 py-0 border shrink-0 ${statusColor.badge}`}
          >
            {entry.status === "renewal" && (
              <AlertTriangle className="h-2.5 w-2.5 mr-0.5 inline" />
            )}
            {CERT_STATUS_LABELS[entry.status]}
          </Badge>
        </div>

        {/* 액션 버튼 */}
        <div className="flex items-center gap-1 shrink-0">
          {entry.fileUrl && (
            <a
              href={entry.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center h-6 w-6 rounded hover:bg-accent text-muted-foreground"
              title="파일 보기"
              onClick={(e) => e.stopPropagation()}
            >
              <FileText className="h-3 w-3" />
            </a>
          )}
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

      {/* 하단: 발급 기관, 날짜 정보 */}
      <div className="flex items-center gap-3 flex-wrap text-[10px] text-muted-foreground">
        <span>{entry.issuer}</span>
        <span>취득: {formatDate(entry.issuedAt)}</span>
        {entry.expiresAt ? (
          <span
            className={
              entry.status === "expired"
                ? "text-red-500"
                : entry.status === "renewal"
                ? "text-yellow-600 font-medium"
                : ""
            }
          >
            만료: {formatDate(entry.expiresAt)}
            {entry.status === "renewal" && (
              <span className="ml-1">
                (D-{daysUntilExpiry(entry.expiresAt)})
              </span>
            )}
            {entry.status === "expired" && <span className="ml-1">(만료됨)</span>}
          </span>
        ) : (
          <span>만료일: 영구</span>
        )}
        {entry.note && <span className="italic truncate max-w-[120px]">{entry.note}</span>}
      </div>
    </div>
  );
}
