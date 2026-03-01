"use client";

import { useState } from "react";
import { useAsyncAction } from "@/hooks/use-async-action";
import { useDeleteConfirm } from "@/hooks/use-delete-confirm";
import {
  Music,
  ChevronDown,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  FileText,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useMusicLicense } from "@/hooks/use-music-license";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { MusicLicenseEntry, MusicLicenseType, MusicLicenseStatus } from "@/types";

// ============================================================
// 상수 / 레이블 맵
// ============================================================

const LICENSE_TYPE_LABEL: Record<MusicLicenseType, string> = {
  royalty_free: "로열티 프리",
  licensed: "라이선스 구매",
  original: "자작곡",
  cover: "커버",
  public_domain: "퍼블릭 도메인",
};

const LICENSE_TYPE_BADGE: Record<MusicLicenseType, string> = {
  royalty_free: "bg-cyan-100 text-cyan-700",
  licensed: "bg-purple-100 text-purple-700",
  original: "bg-green-100 text-green-700",
  cover: "bg-orange-100 text-orange-700",
  public_domain: "bg-gray-100 text-gray-600",
};

const STATUS_LABEL: Record<MusicLicenseStatus, string> = {
  active: "유효",
  expiring_soon: "만료임박",
  expired: "만료",
  pending: "검토중",
};

const STATUS_BADGE: Record<MusicLicenseStatus, string> = {
  active: "bg-green-100 text-green-700",
  expiring_soon: "bg-yellow-100 text-yellow-700",
  expired: "bg-red-100 text-red-700",
  pending: "bg-blue-100 text-blue-700",
};

type FilterTab = "all" | MusicLicenseStatus;

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "active", label: "유효" },
  { key: "expiring_soon", label: "만료임박" },
  { key: "expired", label: "만료" },
];

// ============================================================
// D-day 계산 헬퍼
// ============================================================

function calcDday(expiryDate: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const diffMs = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "D-Day";
  if (diffDays > 0) return `D-${diffDays}`;
  return `D+${Math.abs(diffDays)}`;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function formatCost(cost?: number): string {
  if (cost === undefined || cost === null) return "-";
  return cost.toLocaleString("ko-KR") + "원";
}

// ============================================================
// 폼 초기값
// ============================================================

type FormState = {
  songTitle: string;
  artist: string;
  licenseType: MusicLicenseType;
  purchaseDate: string;
  expiryDate: string;
  cost: string;
  licensee: string;
  usageScope: string;
  documentUrl: string;
  notes: string;
};

const EMPTY_FORM: FormState = {
  songTitle: "",
  artist: "",
  licenseType: "licensed",
  purchaseDate: "",
  expiryDate: "",
  cost: "",
  licensee: "",
  usageScope: "",
  documentUrl: "",
  notes: "",
};

// ============================================================
// 컴포넌트
// ============================================================

export function MusicLicenseCard({ groupId }: { groupId: string }) {
  const {
    licenses,
    loading,
    addLicense,
    updateLicense,
    deleteLicense,
    getExpiringLicenses,
    stats,
  } = useMusicLicense(groupId);

  const [open, setOpen] = useState(false);
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<MusicLicenseEntry | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const { pending: saving, execute } = useAsyncAction();
  const deleteConfirm = useDeleteConfirm<{ id: string; songTitle: string }>();

  // 만료 임박 (30일 이내)
  const expiringList = getExpiringLicenses(30);

  // 필터링된 목록
  const filteredLicenses =
    filterTab === "all"
      ? licenses
      : licenses.filter((l) => l.status === filterTab);

  // 폼 필드 업데이트
  const setField = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // 다이얼로그 열기 (추가)
  const handleOpenAdd = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  // 다이얼로그 열기 (편집)
  const handleOpenEdit = (entry: MusicLicenseEntry) => {
    setEditTarget(entry);
    setForm({
      songTitle: entry.songTitle,
      artist: entry.artist,
      licenseType: entry.licenseType,
      purchaseDate: entry.purchaseDate ?? "",
      expiryDate: entry.expiryDate ?? "",
      cost: entry.cost !== undefined ? String(entry.cost) : "",
      licensee: entry.licensee,
      usageScope: entry.usageScope,
      documentUrl: entry.documentUrl ?? "",
      notes: entry.notes ?? "",
    });
    setDialogOpen(true);
  };

  // 저장
  const handleSave = async () => {
    if (!form.songTitle.trim()) {
      toast.error("곡명을 입력해주세요.");
      return;
    }
    if (!form.artist.trim()) {
      toast.error("아티스트를 입력해주세요.");
      return;
    }
    if (!form.licensee.trim()) {
      toast.error("사용자(licensee)를 입력해주세요.");
      return;
    }
    if (!form.usageScope.trim()) {
      toast.error("사용 범위를 입력해주세요.");
      return;
    }

    await execute(async () => {
      const costNum = form.cost.trim() ? Number(form.cost.replace(/[^0-9]/g, "")) : undefined;

      if (editTarget) {
        const ok = updateLicense(editTarget.id, {
          songTitle: form.songTitle.trim(),
          artist: form.artist.trim(),
          licenseType: form.licenseType,
          purchaseDate: form.purchaseDate || undefined,
          expiryDate: form.expiryDate || undefined,
          cost: costNum,
          licensee: form.licensee.trim(),
          usageScope: form.usageScope.trim(),
          documentUrl: form.documentUrl.trim() || undefined,
          notes: form.notes.trim() || undefined,
        });
        if (ok) {
          toast.success("라이선스 정보가 수정되었습니다.");
        } else {
          toast.error("수정에 실패했습니다.");
        }
      } else {
        addLicense({
          songTitle: form.songTitle.trim(),
          artist: form.artist.trim(),
          licenseType: form.licenseType,
          purchaseDate: form.purchaseDate || undefined,
          expiryDate: form.expiryDate || undefined,
          cost: costNum,
          licensee: form.licensee.trim(),
          usageScope: form.usageScope.trim(),
          documentUrl: form.documentUrl.trim() || undefined,
          notes: form.notes.trim() || undefined,
        });
        toast.success("라이선스가 추가되었습니다.");
      }
      setDialogOpen(false);
    });
  };

  // 삭제
  const handleDelete = () => {
    const target = deleteConfirm.confirm();
    if (!target) return;
    const ok = deleteLicense(target.id);
    if (ok) {
      toast.success("라이선스가 삭제되었습니다.");
    } else {
      toast.error("삭제에 실패했습니다.");
    }
  };

  return (
    <>
      <Card className="w-full">
        <Collapsible open={open} onOpenChange={setOpen}>
          {/* 헤더 */}
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg">
              <div className="flex items-center gap-2">
                <Music className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-semibold">음악 저작권 관리</span>
                {stats.expiringCount > 0 && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-yellow-100 text-yellow-700">
                    만료임박 {stats.expiringCount}
                  </Badge>
                )}
                {stats.expiredCount > 0 && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-red-100 text-red-700">
                    만료 {stats.expiredCount}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  총 {stats.totalLicenses}건
                </span>
                {open ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="px-4 pb-4 pt-0 space-y-3">
              {/* 만료 임박 경고 배너 */}
              {expiringList.length > 0 && (
                <div className="flex items-start gap-2 rounded-md bg-yellow-50 border border-yellow-200 px-3 py-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                  <div className="text-xs text-yellow-800">
                    <span className="font-semibold">{expiringList.length}개</span>의 라이선스가 30일 이내에 만료됩니다.{" "}
                    {expiringList.slice(0, 2).map((l) => l.songTitle).join(", ")}
                    {expiringList.length > 2 && ` 외 ${expiringList.length - 2}건`}
                  </div>
                </div>
              )}

              {/* 요약 통계 */}
              <div className="grid grid-cols-4 gap-2">
                <div className="rounded-lg bg-muted/40 px-3 py-2 text-center">
                  <div className="text-base font-bold text-foreground">{stats.totalLicenses}</div>
                  <div className="text-[10px] text-muted-foreground">전체</div>
                </div>
                <div className="rounded-lg bg-green-50 px-3 py-2 text-center">
                  <div className="text-base font-bold text-green-700">{stats.activeLicenses}</div>
                  <div className="text-[10px] text-green-600">유효</div>
                </div>
                <div className="rounded-lg bg-yellow-50 px-3 py-2 text-center">
                  <div className="text-base font-bold text-yellow-700">{stats.expiringCount}</div>
                  <div className="text-[10px] text-yellow-600">만료임박</div>
                </div>
                <div className="rounded-lg bg-red-50 px-3 py-2 text-center">
                  <div className="text-base font-bold text-red-700">{stats.expiredCount}</div>
                  <div className="text-[10px] text-red-600">만료</div>
                </div>
              </div>

              {/* 총 비용 */}
              {stats.totalCost > 0 && (
                <div className="text-xs text-muted-foreground text-right">
                  총 라이선스 비용:{" "}
                  <span className="font-semibold text-foreground">
                    {stats.totalCost.toLocaleString("ko-KR")}원
                  </span>
                </div>
              )}

              {/* 필터 탭 + 추가 버튼 */}
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {FILTER_TABS.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setFilterTab(tab.key)}
                      className={cn(
                        "text-xs px-2 py-1 rounded-md transition-colors",
                        filterTab === tab.key
                          ? "bg-foreground text-background font-semibold"
                          : "text-muted-foreground hover:bg-muted/60"
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleOpenAdd}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  추가
                </Button>
              </div>

              {/* 라이선스 목록 */}
              {loading ? (
                <div className="text-xs text-muted-foreground text-center py-4">
                  불러오는 중...
                </div>
              ) : filteredLicenses.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-4">
                  {filterTab === "all"
                    ? "등록된 라이선스가 없습니다."
                    : `${STATUS_LABEL[filterTab as MusicLicenseStatus]} 상태의 라이선스가 없습니다.`}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredLicenses.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-lg border bg-card px-3 py-2.5 space-y-1.5"
                    >
                      {/* 상단: 곡명 + 상태 배지 + 액션 */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-semibold leading-tight">
                            {entry.songTitle}
                          </span>
                          <Badge
                            className={cn(
                              "text-[10px] px-1.5 py-0",
                              STATUS_BADGE[entry.status]
                            )}
                          >
                            {STATUS_LABEL[entry.status]}
                          </Badge>
                          <Badge
                            className={cn(
                              "text-[10px] px-1.5 py-0",
                              LICENSE_TYPE_BADGE[entry.licenseType]
                            )}
                          >
                            {LICENSE_TYPE_LABEL[entry.licenseType]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleOpenEdit(entry)}
                            className="p-1 rounded hover:bg-muted/60 text-muted-foreground"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => deleteConfirm.request({ id: entry.id, songTitle: entry.songTitle })}
                            className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      {/* 아티스트 */}
                      <div className="text-xs text-muted-foreground">
                        아티스트: {entry.artist}
                      </div>

                      {/* 만료일 + D-day + 비용 */}
                      <div className="flex items-center gap-3 flex-wrap text-xs">
                        {entry.expiryDate && (
                          <span className="flex items-center gap-1">
                            <span className="text-muted-foreground">만료일:</span>
                            <span className="font-medium">{formatDate(entry.expiryDate)}</span>
                            <span
                              className={cn(
                                "font-semibold",
                                entry.status === "expired"
                                  ? "text-red-600"
                                  : entry.status === "expiring_soon"
                                  ? "text-yellow-600"
                                  : "text-muted-foreground"
                              )}
                            >
                              ({calcDday(entry.expiryDate)})
                            </span>
                          </span>
                        )}
                        {entry.cost !== undefined && (
                          <span className="flex items-center gap-1">
                            <span className="text-muted-foreground">비용:</span>
                            <span className="font-medium">{formatCost(entry.cost)}</span>
                          </span>
                        )}
                      </div>

                      {/* 사용 범위 */}
                      <div className="text-xs text-muted-foreground">
                        사용 범위: {entry.usageScope}
                      </div>

                      {/* 문서 링크 */}
                      {entry.documentUrl && (
                        <a
                          href={entry.documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-blue-600 hover:underline w-fit"
                        >
                          <FileText className="h-3 w-3" />
                          라이선스 문서
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}

                      {/* 메모 */}
                      {entry.notes && (
                        <div className="text-xs text-muted-foreground italic">
                          {entry.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* 추가/편집 다이얼로그 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editTarget ? "라이선스 편집" : "라이선스 추가"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* 곡명 */}
            <div className="space-y-1">
              <Label className="text-xs">곡명 *</Label>
              <Input
                className="h-8 text-sm"
                placeholder="예: Dynamite"
                value={form.songTitle}
                onChange={(e) => setField("songTitle", e.target.value)}
              />
            </div>

            {/* 아티스트 */}
            <div className="space-y-1">
              <Label className="text-xs">아티스트 *</Label>
              <Input
                className="h-8 text-sm"
                placeholder="예: BTS"
                value={form.artist}
                onChange={(e) => setField("artist", e.target.value)}
              />
            </div>

            {/* 라이선스 유형 */}
            <div className="space-y-1">
              <Label className="text-xs">라이선스 유형 *</Label>
              <Select
                value={form.licenseType}
                onValueChange={(v) => setField("licenseType", v as MusicLicenseType)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="유형 선택" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(LICENSE_TYPE_LABEL) as MusicLicenseType[]).map((k) => (
                    <SelectItem key={k} value={k} className="text-sm">
                      {LICENSE_TYPE_LABEL[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 구매일 / 만료일 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">구매일</Label>
                <Input
                  type="date"
                  className="h-8 text-sm"
                  value={form.purchaseDate}
                  onChange={(e) => setField("purchaseDate", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">만료일</Label>
                <Input
                  type="date"
                  className="h-8 text-sm"
                  value={form.expiryDate}
                  onChange={(e) => setField("expiryDate", e.target.value)}
                />
              </div>
            </div>

            {/* 비용 */}
            <div className="space-y-1">
              <Label className="text-xs">비용 (원)</Label>
              <Input
                className="h-8 text-sm"
                placeholder="예: 50000"
                value={form.cost}
                onChange={(e) => setField("cost", e.target.value)}
              />
            </div>

            {/* 사용자 (licensee) */}
            <div className="space-y-1">
              <Label className="text-xs">사용자 / 라이선시 *</Label>
              <Input
                className="h-8 text-sm"
                placeholder="예: 그룹명 또는 개인명"
                value={form.licensee}
                onChange={(e) => setField("licensee", e.target.value)}
              />
            </div>

            {/* 사용 범위 */}
            <div className="space-y-1">
              <Label className="text-xs">사용 범위 *</Label>
              <Input
                className="h-8 text-sm"
                placeholder="예: 정기 공연, 유튜브 업로드 등"
                value={form.usageScope}
                onChange={(e) => setField("usageScope", e.target.value)}
              />
            </div>

            {/* 문서 URL */}
            <div className="space-y-1">
              <Label className="text-xs">라이선스 문서 URL</Label>
              <Input
                className="h-8 text-sm"
                placeholder="https://..."
                value={form.documentUrl}
                onChange={(e) => setField("documentUrl", e.target.value)}
              />
            </div>

            {/* 메모 */}
            <div className="space-y-1">
              <Label className="text-xs">메모</Label>
              <Textarea
                className="text-sm min-h-[60px] resize-none"
                placeholder="추가 메모사항을 입력하세요."
                value={form.notes}
                onChange={(e) => setField("notes", e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              취소
            </Button>
            <Button
              size="sm"
              className="h-8 text-xs"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "저장 중..." : editTarget ? "수정" : "추가"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={deleteConfirm.onOpenChange}
        title="라이선스 삭제"
        description={deleteConfirm.target ? `"${deleteConfirm.target.songTitle}" 라이선스를 삭제하시겠습니까?` : ""}
        onConfirm={handleDelete}
        destructive
      />
    </>
  );
}
