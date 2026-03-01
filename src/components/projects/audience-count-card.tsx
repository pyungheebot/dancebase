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
  TrendingUp,
  Star,
  BarChart2,
} from "lucide-react";
import {
  useAudienceCount,
  calcOccupancyRate,
} from "@/hooks/use-audience-count";
import type { AudienceCountRecord } from "@/types";

// ============================================================
// 상수
// ============================================================

const TYPE_CONFIG: Record<
  "paid" | "invited" | "free" | "staff",
  { label: string; color: string; barColor: string }
> = {
  paid: {
    label: "유료",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    barColor: "bg-blue-500",
  },
  invited: {
    label: "초대",
    color: "bg-green-100 text-green-700 border-green-200",
    barColor: "bg-green-500",
  },
  free: {
    label: "무료",
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
    barColor: "bg-yellow-500",
  },
  staff: {
    label: "관계자",
    color: "bg-gray-100 text-gray-600 border-gray-200",
    barColor: "bg-gray-400",
  },
};

// ============================================================
// 서브 컴포넌트: 점유율 바
// ============================================================

function OccupancyBar({ rate, size = "md" }: { rate: number; size?: "sm" | "md" }) {
  const barColor =
    rate >= 90
      ? "bg-green-500"
      : rate >= 70
      ? "bg-blue-500"
      : rate >= 50
      ? "bg-yellow-500"
      : "bg-red-400";

  return (
    <div className={`flex items-center gap-2 ${size === "sm" ? "w-full" : ""}`}>
      <div
        className={`relative rounded-full overflow-hidden bg-gray-100 ${
          size === "sm" ? "h-1.5 flex-1" : "h-2 w-32"
        }`}
      >
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all ${barColor}`}
          style={{ width: `${rate}%` }}
        />
      </div>
      <span className="text-xs font-medium tabular-nums text-gray-700">
        {rate}%
      </span>
    </div>
  );
}

// ============================================================
// 서브 컴포넌트: 유형별 비율 파이 (CSS div 기반)
// ============================================================

function TypePieChart({
  byType,
  total,
}: {
  byType: AudienceCountRecord["byType"];
  total: number;
}) {
  if (total <= 0) {
    return (
      <div className="text-xs text-gray-400 text-center py-2">데이터 없음</div>
    );
  }

  const types = (["paid", "invited", "free", "staff"] as const).filter(
    (t) => byType[t] > 0
  );

  return (
    <div className="space-y-1">
      {types.map((type) => {
        const pct = Math.round((byType[type] / total) * 100);
        return (
          <div key={type} className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500 w-10 shrink-0">
              {TYPE_CONFIG[type].label}
            </span>
            <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className={`h-full rounded-full ${TYPE_CONFIG[type].barColor}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[10px] tabular-nums text-gray-600 w-14 text-right shrink-0">
              {byType[type].toLocaleString()}명 ({pct}%)
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// 서브 컴포넌트: 기록 카드 행
// ============================================================

function RecordRow({
  record,
  onEdit,
  onDelete,
}: {
  record: AudienceCountRecord;
  onEdit: (r: AudienceCountRecord) => void;
  onDelete: (id: string) => void;
}) {
  const rate = calcOccupancyRate(record.totalSeats, record.actualCount);
  const typeTotal =
    record.byType.paid +
    record.byType.invited +
    record.byType.free +
    record.byType.staff;

  return (
    <div className="rounded-lg border border-gray-100 bg-white p-3 space-y-2">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Badge className="text-[10px] px-1.5 py-0 bg-purple-100 text-purple-700 border-purple-200 shrink-0">
            {record.sessionNumber}회차
          </Badge>
          {record.sessionLabel && (
            <span className="text-xs text-gray-600 truncate">
              {record.sessionLabel}
            </span>
          )}
          <span className="text-[10px] text-gray-400 shrink-0">
            {record.date}
          </span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0">
              <MoreVertical className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(record)}>
              <Pencil className="h-3 w-3 mr-2" />
              수정
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => onDelete(record.id)}
            >
              <Trash2 className="h-3 w-3 mr-2" />
              삭제
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 관객 수 / 좌석 */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <Users className="h-3 w-3 text-gray-400" />
          <span className="text-sm font-semibold tabular-nums">
            {record.actualCount.toLocaleString()}
          </span>
          <span className="text-xs text-gray-400">
            / {record.totalSeats.toLocaleString()}석
          </span>
        </div>
        {record.vipCount > 0 && (
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 text-yellow-500" />
            <span className="text-xs text-gray-600 tabular-nums">
              VIP {record.vipCount}명
            </span>
          </div>
        )}
      </div>

      {/* 점유율 바 */}
      <OccupancyBar rate={rate} size="sm" />

      {/* 유형별 비율 */}
      {typeTotal > 0 && (
        <TypePieChart byType={record.byType} total={typeTotal} />
      )}

      {/* 메모 */}
      {record.note && (
        <p className="text-[11px] text-gray-500 bg-gray-50 rounded px-2 py-1 leading-relaxed">
          {record.note}
        </p>
      )}
    </div>
  );
}

// ============================================================
// 폼 초기값
// ============================================================

const EMPTY_FORM = {
  sessionNumber: 1,
  sessionLabel: "",
  date: "",
  totalSeats: 0,
  actualCount: 0,
  vipCount: 0,
  paid: 0,
  invited: 0,
  free: 0,
  staff: 0,
  note: "",
};

// ============================================================
// 메인 컴포넌트
// ============================================================

export function AudienceCountCard({
  groupId,
  projectId,
}: {
  groupId: string;
  projectId: string;
}) {
  const { records, loading, addRecord, updateRecord, deleteRecord, stats } =
    useAudienceCount(groupId, projectId);

  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] =
    useState<AudienceCountRecord | null>(null);
  const { pending: saving, execute } = useAsyncAction();
  const [form, setForm] = useState(EMPTY_FORM);

  // ── 폼 리셋 ──
  function resetForm(record?: AudienceCountRecord) {
    if (record) {
      setForm({
        sessionNumber: record.sessionNumber,
        sessionLabel: record.sessionLabel ?? "",
        date: record.date,
        totalSeats: record.totalSeats,
        actualCount: record.actualCount,
        vipCount: record.vipCount,
        paid: record.byType.paid,
        invited: record.byType.invited,
        free: record.byType.free,
        staff: record.byType.staff,
        note: record.note ?? "",
      });
    } else {
      const nextSession =
        records.length > 0
          ? Math.max(...records.map((r) => r.sessionNumber)) + 1
          : 1;
      setForm({ ...EMPTY_FORM, sessionNumber: nextSession });
    }
  }

  // ── 추가 버튼 ──
  function handleOpenAdd() {
    resetForm();
    setShowAdd(true);
  }

  // ── 수정 버튼 ──
  function handleOpenEdit(record: AudienceCountRecord) {
    resetForm(record);
    setEditTarget(record);
  }

  // ── 저장 (추가/수정 공용) ──
  async function handleSave() {
    await execute(async () => {
      const payload = {
        sessionNumber: form.sessionNumber,
        sessionLabel: form.sessionLabel || undefined,
        date: form.date,
        totalSeats: Number(form.totalSeats),
        actualCount: Number(form.actualCount),
        vipCount: Number(form.vipCount),
        byType: {
          paid: Number(form.paid),
          invited: Number(form.invited),
          free: Number(form.free),
          staff: Number(form.staff),
        },
        note: form.note || undefined,
      };

      let ok: boolean;
      if (editTarget) {
        ok = await updateRecord(editTarget.id, payload);
      } else {
        ok = await addRecord(payload);
      }

      if (ok) {
        setShowAdd(false);
        setEditTarget(null);
      }
    });
  }

  // ── 삭제 ──
  async function handleDelete(id: string) {
    await deleteRecord(id);
  }

  // ── 폼 필드 변경 ──
  function setField<K extends keyof typeof EMPTY_FORM>(
    key: K,
    value: (typeof EMPTY_FORM)[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const isOpen = showAdd || editTarget !== null;

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-gray-400">
          불러오는 중...
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-500" />
              관객 카운트
            </CardTitle>
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={handleOpenAdd}
            >
              <Plus className="h-3 w-3 mr-1" />
              회차 추가
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 요약 통계 */}
          {records.length > 0 && (
            <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-0.5">총 관객</div>
                <div className="text-sm font-bold tabular-nums">
                  {stats.totalActual.toLocaleString()}
                </div>
                <div className="text-[10px] text-gray-400">
                  / {stats.totalSeats.toLocaleString()}석
                </div>
              </div>
              <div className="text-center border-x border-gray-200">
                <div className="text-xs text-gray-500 mb-0.5 flex items-center justify-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  평균 점유율
                </div>
                <div className="text-sm font-bold tabular-nums">
                  {stats.avgOccupancy}%
                </div>
                <div className="text-[10px] text-gray-400">
                  전체 {stats.overallOccupancy}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-0.5 flex items-center justify-center gap-1">
                  <Star className="h-3 w-3 text-yellow-500" />
                  VIP
                </div>
                <div className="text-sm font-bold tabular-nums">
                  {stats.totalVip.toLocaleString()}
                </div>
                <div className="text-[10px] text-gray-400">
                  {stats.sessionCount}회차
                </div>
              </div>
            </div>
          )}

          {/* 유형별 합계 */}
          {records.length > 0 && stats.totalActual > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <BarChart2 className="h-3 w-3" />
                전체 관객 유형 분포
              </div>
              <TypePieChart
                byType={stats.totalByType}
                total={stats.totalActual}
              />
            </div>
          )}

          {/* 회차별 기록 목록 */}
          {records.length > 0 ? (
            <div className="space-y-2">
              {records.map((record) => (
                <RecordRow
                  key={record.id}
                  record={record}
                  onEdit={handleOpenEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-sm text-gray-400">
              <Users className="h-8 w-8 mx-auto mb-2 text-gray-200" />
              <p>아직 기록된 관객 데이터가 없습니다</p>
              <p className="text-xs mt-1">회차 추가 버튼으로 시작하세요</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 추가 / 수정 다이얼로그 */}
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            setShowAdd(false);
            setEditTarget(null);
          }
        }}
      >
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              {editTarget ? "관객 수 수정" : "관객 수 추가"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {/* 회차 / 라벨 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">회차 번호</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.sessionNumber}
                  onChange={(e) =>
                    setField("sessionNumber", Number(e.target.value))
                  }
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">회차 라벨 (선택)</Label>
                <Input
                  placeholder="예: 오후 2시 공연"
                  value={form.sessionLabel}
                  onChange={(e) => setField("sessionLabel", e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>

            {/* 날짜 */}
            <div className="space-y-1">
              <Label className="text-xs">공연 날짜 *</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setField("date", e.target.value)}
                className="h-8 text-sm"
              />
            </div>

            {/* 좌석 수 / 관객 수 / VIP */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">총 좌석 수 *</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.totalSeats || ""}
                  onChange={(e) =>
                    setField("totalSeats", Number(e.target.value))
                  }
                  placeholder="0"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">실제 관객 수 *</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.actualCount || ""}
                  onChange={(e) =>
                    setField("actualCount", Number(e.target.value))
                  }
                  placeholder="0"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">VIP 수</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.vipCount || ""}
                  onChange={(e) =>
                    setField("vipCount", Number(e.target.value))
                  }
                  placeholder="0"
                  className="h-8 text-sm"
                />
              </div>
            </div>

            {/* 점유율 미리보기 */}
            {form.totalSeats > 0 && (
              <div className="px-3 py-2 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">점유율 미리보기</div>
                <OccupancyBar
                  rate={calcOccupancyRate(
                    Number(form.totalSeats),
                    Number(form.actualCount)
                  )}
                  size="sm"
                />
              </div>
            )}

            {/* 유형별 관객 수 */}
            <div className="space-y-2">
              <Label className="text-xs text-gray-600">관객 유형별 수</Label>
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    { key: "paid", label: "유료" },
                    { key: "invited", label: "초대" },
                    { key: "free", label: "무료" },
                    { key: "staff", label: "관계자" },
                  ] as const
                ).map(({ key, label }) => (
                  <div key={key} className="space-y-1">
                    <Label className="text-[11px] text-gray-500">
                      <span
                        className={`inline-block px-1.5 py-0 rounded text-[10px] border ${TYPE_CONFIG[key].color} mr-1`}
                      >
                        {label}
                      </span>
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      value={form[key] || ""}
                      onChange={(e) =>
                        setField(key, Number(e.target.value))
                      }
                      placeholder="0"
                      className="h-8 text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 메모 */}
            <div className="space-y-1">
              <Label className="text-xs">메모 (선택)</Label>
              <Textarea
                value={form.note}
                onChange={(e) => setField("note", e.target.value)}
                placeholder="특이사항, 날씨, 현장 상황 등"
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
              onClick={() => {
                setShowAdd(false);
                setEditTarget(null);
              }}
              disabled={saving}
            >
              취소
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={handleSave}
              disabled={saving || !form.date || form.totalSeats <= 0}
            >
              {saving ? "저장 중..." : editTarget ? "수정" : "추가"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
