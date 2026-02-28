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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Pencil,
  Shirt,
  Ruler,
  User,
  CheckCircle2,
  Clock,
  Scissors,
  CircleDot,
} from "lucide-react";
import { toast } from "sonner";
import { useCostumeFitting } from "@/hooks/use-costume-fitting";
import type {
  CostumeFittingEntry,
  CostumeFittingMeasurement,
  CostumeFittingStatus,
} from "@/types";

// ============================================================
// 상수 & 레이블
// ============================================================

const STATUS_LABELS: Record<CostumeFittingStatus, string> = {
  pending: "대기",
  fitted: "핏팅완료",
  altered: "수선중",
  completed: "완료",
};

const STATUS_BADGE_COLORS: Record<CostumeFittingStatus, string> = {
  pending: "bg-blue-50 text-blue-600 border-blue-200",
  fitted: "bg-green-50 text-green-600 border-green-200",
  altered: "bg-yellow-50 text-yellow-600 border-yellow-200",
  completed: "bg-gray-100 text-gray-600 border-gray-200",
};

const STATUS_CARD_COLORS: Record<CostumeFittingStatus, string> = {
  pending: "border-l-blue-400",
  fitted: "border-l-green-400",
  altered: "border-l-yellow-400",
  completed: "border-l-gray-300",
};

const STATUS_ICON: Record<CostumeFittingStatus, React.ReactNode> = {
  pending: <CircleDot className="h-3 w-3 text-blue-500" />,
  fitted: <CheckCircle2 className="h-3 w-3 text-green-500" />,
  altered: <Scissors className="h-3 w-3 text-yellow-500" />,
  completed: <CheckCircle2 className="h-3 w-3 text-gray-400" />,
};

const ALL_STATUSES: CostumeFittingStatus[] = [
  "pending",
  "fitted",
  "altered",
  "completed",
];

// ============================================================
// 핏팅 추가/수정 다이얼로그
// ============================================================

interface FittingDialogProps {
  open: boolean;
  mode: "add" | "edit";
  initial?: Partial<Omit<CostumeFittingEntry, "id" | "createdAt">>;
  memberNames?: string[];
  onClose: () => void;
  onSubmit: (
    data: Omit<CostumeFittingEntry, "id" | "createdAt" | "status">
  ) => void;
}

function FittingDialog({
  open,
  mode,
  initial,
  memberNames = [],
  onClose,
  onSubmit,
}: FittingDialogProps) {
  const [memberName, setMemberName] = useState(initial?.memberName ?? "");
  const [costumeName, setCostumeName] = useState(initial?.costumeName ?? "");
  const [fittingDate, setFittingDate] = useState(initial?.fittingDate ?? "");
  const [alterationNotes, setAlterationNotes] = useState(
    initial?.alterationNotes ?? ""
  );
  const [photoUrl, setPhotoUrl] = useState(initial?.photoUrl ?? "");

  // 치수
  const initMeasurements: CostumeFittingMeasurement = {
    height: null,
    chest: null,
    waist: null,
    hip: null,
    shoeSize: null,
    notes: null,
    ...initial?.measurements,
  };
  const [height, setHeight] = useState(initMeasurements.height ?? "");
  const [chest, setChest] = useState(initMeasurements.chest ?? "");
  const [waist, setWaist] = useState(initMeasurements.waist ?? "");
  const [hip, setHip] = useState(initMeasurements.hip ?? "");
  const [shoeSize, setShoeSize] = useState(initMeasurements.shoeSize ?? "");
  const [measurementNotes, setMeasurementNotes] = useState(
    initMeasurements.notes ?? ""
  );

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) onClose();
  };

  const handleSubmit = () => {
    if (!memberName.trim()) {
      toast.error("멤버 이름을 입력해주세요.");
      return;
    }
    if (!costumeName.trim()) {
      toast.error("의상 이름을 입력해주세요.");
      return;
    }
    onSubmit({
      memberName: memberName.trim(),
      costumeName: costumeName.trim(),
      measurements: {
        height: height.trim() || null,
        chest: chest.trim() || null,
        waist: waist.trim() || null,
        hip: hip.trim() || null,
        shoeSize: shoeSize.trim() || null,
        notes: measurementNotes.trim() || null,
      },
      fittingDate: fittingDate || null,
      alterationNotes: alterationNotes.trim() || null,
      photoUrl: photoUrl.trim() || null,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {mode === "add" ? "핏팅 기록 추가" : "핏팅 기록 수정"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 멤버 이름 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">멤버 이름</Label>
            {memberNames.length > 0 ? (
              <Select value={memberName} onValueChange={setMemberName}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="멤버를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {memberNames.map((name) => (
                    <SelectItem key={name} value={name} className="text-xs">
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                className="h-8 text-xs"
                placeholder="멤버 이름 입력"
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
              />
            )}
          </div>

          {/* 의상 이름 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">의상 이름</Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: 1막 메인 의상, 커튼콜 드레스"
              value={costumeName}
              onChange={(e) => setCostumeName(e.target.value)}
            />
          </div>

          {/* 치수 정보 */}
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <Ruler className="h-3 w-3 text-muted-foreground" />
              <Label className="text-xs font-medium">치수 정보</Label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">
                  키 (cm)
                </Label>
                <Input
                  className="h-8 text-xs"
                  placeholder="예: 165"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">
                  신발 사이즈 (mm)
                </Label>
                <Input
                  className="h-8 text-xs"
                  placeholder="예: 250"
                  value={shoeSize}
                  onChange={(e) => setShoeSize(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">
                  가슴둘레 (cm)
                </Label>
                <Input
                  className="h-8 text-xs"
                  placeholder="예: 84"
                  value={chest}
                  onChange={(e) => setChest(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">
                  허리둘레 (cm)
                </Label>
                <Input
                  className="h-8 text-xs"
                  placeholder="예: 68"
                  value={waist}
                  onChange={(e) => setWaist(e.target.value)}
                />
              </div>
              <div className="space-y-1 col-span-2">
                <Label className="text-[10px] text-muted-foreground">
                  엉덩이둘레 (cm)
                </Label>
                <Input
                  className="h-8 text-xs"
                  placeholder="예: 90"
                  value={hip}
                  onChange={(e) => setHip(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">
                치수 메모 (선택)
              </Label>
              <Input
                className="h-8 text-xs"
                placeholder="예: 어깨 넓음, 허리 수선 필요"
                value={measurementNotes}
                onChange={(e) => setMeasurementNotes(e.target.value)}
              />
            </div>
          </div>

          {/* 핏팅 날짜 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              핏팅 날짜 (선택)
            </Label>
            <Input
              className="h-8 text-xs"
              type="date"
              value={fittingDate}
              onChange={(e) => setFittingDate(e.target.value)}
            />
          </div>

          {/* 수선 메모 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              수선 메모 (선택)
            </Label>
            <Textarea
              className="text-xs min-h-[56px] resize-none"
              placeholder="수선이 필요한 부분을 상세히 입력하세요"
              value={alterationNotes}
              onChange={(e) => setAlterationNotes(e.target.value)}
            />
          </div>

          {/* 사진 URL */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              사진 URL (선택)
            </Label>
            <Input
              className="h-8 text-xs"
              placeholder="https://..."
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={onClose}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            {mode === "add" ? "추가" : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 개별 핏팅 카드
// ============================================================

interface EntryCardProps {
  entry: CostumeFittingEntry;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: CostumeFittingStatus) => void;
}

function EntryCard({ entry, onEdit, onDelete, onStatusChange }: EntryCardProps) {
  const { measurements } = entry;

  const hasMeasurements =
    measurements.height ||
    measurements.chest ||
    measurements.waist ||
    measurements.hip ||
    measurements.shoeSize;

  return (
    <div
      className={`rounded-md border border-l-4 bg-white p-3 space-y-2 ${STATUS_CARD_COLORS[entry.status]}`}
    >
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          <span className="text-xs font-semibold truncate">
            {entry.memberName}
          </span>
          <span className="text-[10px] text-muted-foreground">|</span>
          <Shirt className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          <span className="text-xs text-muted-foreground truncate">
            {entry.costumeName}
          </span>
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={onEdit}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* 상태 및 날짜 */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          {STATUS_ICON[entry.status]}
          <Select
            value={entry.status}
            onValueChange={(v) => onStatusChange(v as CostumeFittingStatus)}
          >
            <SelectTrigger className="h-6 text-[10px] px-2 border-0 bg-transparent p-0 gap-0.5 w-auto focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ALL_STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="text-xs">
                  {STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 ${STATUS_BADGE_COLORS[entry.status]}`}
          >
            {STATUS_LABELS[entry.status]}
          </Badge>
        </div>
        {entry.fittingDate && (
          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            {entry.fittingDate}
          </span>
        )}
      </div>

      {/* 치수 정보 */}
      {hasMeasurements && (
        <div className="flex items-center gap-1.5 flex-wrap bg-muted/40 rounded px-2 py-1.5">
          <Ruler className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          {measurements.height && (
            <span className="text-[10px] text-muted-foreground">
              키 {measurements.height}cm
            </span>
          )}
          {measurements.chest && (
            <span className="text-[10px] text-muted-foreground">
              가슴 {measurements.chest}cm
            </span>
          )}
          {measurements.waist && (
            <span className="text-[10px] text-muted-foreground">
              허리 {measurements.waist}cm
            </span>
          )}
          {measurements.hip && (
            <span className="text-[10px] text-muted-foreground">
              힙 {measurements.hip}cm
            </span>
          )}
          {measurements.shoeSize && (
            <span className="text-[10px] text-muted-foreground">
              신발 {measurements.shoeSize}mm
            </span>
          )}
        </div>
      )}

      {/* 치수 메모 */}
      {measurements.notes && (
        <p className="text-[10px] text-muted-foreground bg-amber-50 border border-amber-100 rounded px-2 py-1">
          {measurements.notes}
        </p>
      )}

      {/* 수선 메모 */}
      {entry.alterationNotes && (
        <div className="flex items-start gap-1 bg-yellow-50 border border-yellow-100 rounded px-2 py-1">
          <Scissors className="h-3 w-3 text-yellow-500 flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-yellow-700">{entry.alterationNotes}</p>
        </div>
      )}

      {/* 사진 링크 */}
      {entry.photoUrl && (
        <a
          href={entry.photoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 text-[10px] text-blue-500 hover:underline"
        >
          사진 보기
        </a>
      )}
    </div>
  );
}

// ============================================================
// 진행률 바
// ============================================================

function ProgressBar({ value, total }: { value: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">
          완료 진행률
        </span>
        <span className="text-[10px] font-medium">
          {value}/{total} ({pct}%)
        </span>
      </div>
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-green-500 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ============================================================
// 메인 컴포넌트
// ============================================================

interface CostumeFittingCardProps {
  projectId: string;
  memberNames?: string[];
}

export function CostumeFittingCard({
  projectId,
  memberNames = [],
}: CostumeFittingCardProps) {
  const {
    fittingData,
    loading,
    addEntry,
    updateEntry,
    deleteEntry,
    updateStatus,
    totalEntries,
    completedCount,
    statusDistribution,
  } = useCostumeFitting(projectId);

  const [isOpen, setIsOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<
    CostumeFittingStatus | "all"
  >("all");

  // 다이얼로그 상태
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [editingEntry, setEditingEntry] = useState<CostumeFittingEntry | null>(
    null
  );

  // 필터 적용
  const filteredEntries =
    filterStatus === "all"
      ? fittingData.entries
      : fittingData.entries.filter((e) => e.status === filterStatus);

  // ── 핸들러 ─────────────────────────────────────────────────

  const handleAddOpen = () => {
    setEditingEntry(null);
    setDialogMode("add");
    setDialogOpen(true);
  };

  const handleEditOpen = (entry: CostumeFittingEntry) => {
    setEditingEntry(entry);
    setDialogMode("edit");
    setDialogOpen(true);
  };

  const handleSubmit = (
    data: Omit<CostumeFittingEntry, "id" | "createdAt" | "status">
  ) => {
    if (dialogMode === "add") {
      addEntry(data);
      toast.success("핏팅 기록이 추가되었습니다.");
    } else if (editingEntry) {
      updateEntry(editingEntry.id, data);
      toast.success("핏팅 기록이 수정되었습니다.");
    }
  };

  const handleDelete = (entryId: string) => {
    deleteEntry(entryId);
    toast.success("핏팅 기록이 삭제되었습니다.");
  };

  const handleStatusChange = (
    entryId: string,
    status: CostumeFittingStatus
  ) => {
    updateStatus(entryId, status);
    toast.success(`상태가 '${STATUS_LABELS[status]}'로 변경되었습니다.`);
  };

  // 필터 탭 목록
  const filterTabs: { value: CostumeFittingStatus | "all"; label: string }[] =
    [
      { value: "all", label: "전체" },
      { value: "pending", label: "대기" },
      { value: "fitted", label: "핏팅완료" },
      { value: "altered", label: "수선중" },
      { value: "completed", label: "완료" },
    ];

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card className="w-full">
          <CardHeader className="pb-2 pt-3 px-4">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2">
                  <Shirt className="h-4 w-4 text-purple-500" />
                  <CardTitle className="text-sm font-semibold">
                    공연 의상 핏팅 기록
                  </CardTitle>
                  {totalEntries > 0 && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 bg-purple-50 text-purple-600 border-purple-200"
                    >
                      {totalEntries}명
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {totalEntries > 0 && (
                    <span className="text-[10px] text-muted-foreground">
                      완료 {completedCount}/{totalEntries}
                    </span>
                  )}
                  {isOpen ? (
                    <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </div>
              </div>
            </CollapsibleTrigger>
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="px-4 pb-4 pt-0 space-y-3">
              {loading ? (
                <p className="text-xs text-muted-foreground py-2">
                  불러오는 중...
                </p>
              ) : (
                <>
                  {/* 진행률 바 */}
                  {totalEntries > 0 && (
                    <ProgressBar value={completedCount} total={totalEntries} />
                  )}

                  {/* 상태 요약 배지 */}
                  {totalEntries > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {ALL_STATUSES.map((s) =>
                        statusDistribution[s] > 0 ? (
                          <span
                            key={s}
                            className={`inline-flex items-center gap-0.5 text-[10px] border rounded-full px-1.5 py-0.5 ${STATUS_BADGE_COLORS[s]}`}
                          >
                            {STATUS_ICON[s]}
                            {STATUS_LABELS[s]} {statusDistribution[s]}
                          </span>
                        ) : null
                      )}
                    </div>
                  )}

                  {/* 필터 + 추가 버튼 */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 flex-wrap">
                      {filterTabs.map((tab) => (
                        <button
                          key={tab.value}
                          onClick={() => setFilterStatus(tab.value)}
                          className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                            filterStatus === tab.value
                              ? "bg-purple-100 border-purple-300 text-purple-700 font-medium"
                              : "bg-muted/50 border-border text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          {tab.label}
                          {tab.value !== "all" &&
                            statusDistribution[tab.value] > 0 && (
                              <span className="ml-1 font-bold">
                                {statusDistribution[tab.value]}
                              </span>
                            )}
                        </button>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs flex-shrink-0"
                      onClick={handleAddOpen}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      핏팅 추가
                    </Button>
                  </div>

                  {/* 목록 */}
                  {filteredEntries.length > 0 ? (
                    <div className="space-y-2">
                      {filteredEntries.map((entry) => (
                        <EntryCard
                          key={entry.id}
                          entry={entry}
                          onEdit={() => handleEditOpen(entry)}
                          onDelete={() => handleDelete(entry.id)}
                          onStatusChange={(status) =>
                            handleStatusChange(entry.id, status)
                          }
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 text-center space-y-1.5">
                      <Shirt className="h-8 w-8 text-muted-foreground mx-auto" />
                      <p className="text-xs text-muted-foreground">
                        {filterStatus === "all"
                          ? "핏팅 기록을 추가해 의상 사이즈를 관리하세요."
                          : `'${STATUS_LABELS[filterStatus as CostumeFittingStatus]}' 상태의 기록이 없습니다.`}
                      </p>
                      {filterStatus === "all" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs mt-1"
                          onClick={handleAddOpen}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          첫 핏팅 기록 추가
                        </Button>
                      )}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* 추가/수정 다이얼로그 */}
      <FittingDialog
        open={dialogOpen}
        mode={dialogMode}
        initial={
          editingEntry
            ? {
                memberName: editingEntry.memberName,
                costumeName: editingEntry.costumeName,
                measurements: editingEntry.measurements,
                fittingDate: editingEntry.fittingDate,
                alterationNotes: editingEntry.alterationNotes,
                photoUrl: editingEntry.photoUrl,
              }
            : undefined
        }
        memberNames={memberNames}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
      />
    </>
  );
}
