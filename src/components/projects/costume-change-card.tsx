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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Shirt,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Clock,
  MapPin,
  Users,
  UserCheck,
  Trash2,
  Plus,
  Pencil,
  ChevronsUp,
  ChevronsDown,
  AlertCircle,
  Zap,
} from "lucide-react";
import { useCostumeChange, type AddCostumeChangeInput } from "@/hooks/use-costume-change";
import { useDeleteConfirm } from "@/hooks/use-delete-confirm";
import type { CostumeChangeEntry, CostumeChangeLocation } from "@/types";

// ============================================================
// 상수 & 레이블
// ============================================================

const LOCATION_META: Record<
  CostumeChangeLocation,
  { label: string; badgeClass: string }
> = {
  stage_left: {
    label: "무대 좌측",
    badgeClass: "bg-blue-100 text-blue-700 border-blue-200",
  },
  stage_right: {
    label: "무대 우측",
    badgeClass: "bg-purple-100 text-purple-700 border-purple-200",
  },
  backstage: {
    label: "백스테이지",
    badgeClass: "bg-gray-100 text-gray-700 border-gray-200",
  },
  dressing_room: {
    label: "분장실",
    badgeClass: "bg-pink-100 text-pink-700 border-pink-200",
  },
  other: {
    label: "기타",
    badgeClass: "bg-orange-100 text-orange-700 border-orange-200",
  },
};

function formatSeconds(sec: number): string {
  if (sec < 60) return `${sec}초`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s > 0 ? `${m}분 ${s}초` : `${m}분`;
}

// ============================================================
// 기본 폼 값
// ============================================================

const EMPTY_FORM: AddCostumeChangeInput = {
  songNumber: 1,
  songName: "",
  memberNames: [],
  costumeFrom: "",
  costumeTo: "",
  changeTimeSeconds: 30,
  needsHelper: false,
  helperName: "",
  location: "backstage",
  locationDetail: "",
  notes: "",
};

// ============================================================
// 항목 행 컴포넌트
// ============================================================

function EntryRow({
  entry,
  index,
  total,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  entry: CostumeChangeEntry;
  index: number;
  total: number;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const [open, setOpen] = useState(false);
  const locationMeta = LOCATION_META[entry.location];
  const isFast = entry.changeTimeSeconds <= 30;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-lg border bg-card">
        {/* 요약 행 */}
        <CollapsibleTrigger asChild>
          <div className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors">
            {/* 곡 번호 */}
            <span className="shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center">
              {entry.songNumber}
            </span>

            {/* 곡 이름 + 의상 요약 */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-800 truncate">
                {entry.songName}
              </p>
              <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-0.5">
                <span className="truncate max-w-[80px]">{entry.costumeFrom}</span>
                <ArrowRight className="h-2.5 w-2.5 shrink-0 text-gray-400" />
                <span className="truncate max-w-[80px]">{entry.costumeTo}</span>
              </div>
            </div>

            {/* 배지들 */}
            <div className="flex items-center gap-1 shrink-0">
              {/* 변경 시간 */}
              <Badge
                variant="outline"
                className={`text-[10px] px-1.5 py-0 flex items-center gap-0.5 ${
                  isFast
                    ? "bg-red-50 text-red-600 border-red-200"
                    : "bg-gray-50 text-gray-600 border-gray-200"
                }`}
              >
                {isFast && <Zap className="h-2.5 w-2.5" />}
                <Clock className="h-2.5 w-2.5" />
                {formatSeconds(entry.changeTimeSeconds)}
              </Badge>

              {/* 위치 */}
              <Badge
                variant="outline"
                className={`text-[10px] px-1.5 py-0 ${locationMeta.badgeClass}`}
              >
                {locationMeta.label}
              </Badge>

              {/* 도우미 필요 */}
              {entry.needsHelper && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 bg-yellow-50 text-yellow-700 border-yellow-200 flex items-center gap-0.5"
                >
                  <UserCheck className="h-2.5 w-2.5" />
                  도우미
                </Badge>
              )}
            </div>

            {/* 펼치기 아이콘 */}
            {open ? (
              <ChevronUp className="h-3 w-3 text-gray-400 shrink-0" />
            ) : (
              <ChevronDown className="h-3 w-3 text-gray-400 shrink-0" />
            )}
          </div>
        </CollapsibleTrigger>

        {/* 상세 내용 */}
        <CollapsibleContent>
          <div className="px-3 pb-3 pt-1 border-t space-y-2">
            {/* 멤버 */}
            <div className="flex items-start gap-2">
              <Users className="h-3 w-3 text-gray-400 mt-0.5 shrink-0" />
              <div className="flex flex-wrap gap-1">
                {entry.memberNames.length > 0 ? (
                  entry.memberNames.map((name) => (
                    <Badge
                      key={name}
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 bg-indigo-50 text-indigo-700 border-indigo-200"
                    >
                      {name}
                    </Badge>
                  ))
                ) : (
                  <span className="text-[10px] text-gray-400">멤버 미지정</span>
                )}
              </div>
            </div>

            {/* 위치 상세 */}
            {entry.locationDetail && (
              <div className="flex items-start gap-2">
                <MapPin className="h-3 w-3 text-gray-400 mt-0.5 shrink-0" />
                <span className="text-xs text-gray-600">{entry.locationDetail}</span>
              </div>
            )}

            {/* 도우미 */}
            {entry.needsHelper && (
              <div className="flex items-center gap-2">
                <UserCheck className="h-3 w-3 text-yellow-500 shrink-0" />
                <span className="text-xs text-gray-600">
                  도우미: {entry.helperName || "미지정"}
                </span>
              </div>
            )}

            {/* 주의사항 */}
            {entry.notes && (
              <div className="flex items-start gap-2">
                <AlertCircle className="h-3 w-3 text-orange-400 mt-0.5 shrink-0" />
                <p className="text-xs text-gray-600 whitespace-pre-wrap">
                  {entry.notes}
                </p>
              </div>
            )}

            {/* 액션 버튼 */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={onMoveUp}
                  disabled={index === 0}
                  title="위로"
                >
                  <ChevronsUp className="h-3 w-3 text-gray-400" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={onMoveDown}
                  disabled={index === total - 1}
                  title="아래로"
                >
                  <ChevronsDown className="h-3 w-3 text-gray-400" />
                </Button>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={onEdit}
                  title="수정"
                >
                  <Pencil className="h-3 w-3 text-gray-400" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={onDelete}
                  title="삭제"
                >
                  <Trash2 className="h-3 w-3 text-gray-400 hover:text-red-400" />
                </Button>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// ============================================================
// 추가/수정 폼 다이얼로그
// ============================================================

function EntryFormDialog({
  open,
  initial,
  onClose,
  onSubmit,
}: {
  open: boolean;
  initial?: CostumeChangeEntry | null;
  onClose: () => void;
  onSubmit: (values: AddCostumeChangeInput) => void;
}) {
  const [form, setForm] = useState<AddCostumeChangeInput>(() =>
    initial
      ? {
          songNumber: initial.songNumber,
          songName: initial.songName,
          memberNames: initial.memberNames,
          costumeFrom: initial.costumeFrom,
          costumeTo: initial.costumeTo,
          changeTimeSeconds: initial.changeTimeSeconds,
          needsHelper: initial.needsHelper,
          helperName: initial.helperName ?? "",
          location: initial.location,
          locationDetail: initial.locationDetail ?? "",
          notes: initial.notes ?? "",
        }
      : EMPTY_FORM
  );

  const [memberInput, setMemberInput] = useState(
    initial ? initial.memberNames.join(", ") : ""
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.songName.trim()) {
      return;
    }
    if (!form.costumeFrom.trim() || !form.costumeTo.trim()) {
      return;
    }
    const members = memberInput
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean);
    onSubmit({ ...form, memberNames: members });
    setForm(EMPTY_FORM);
    setMemberInput("");
  }

  function set<K extends keyof AddCostumeChangeInput>(
    key: K,
    value: AddCostumeChangeInput[K]
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm">
            {initial ? "의상 변경 수정" : "의상 변경 추가"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
          {/* 곡 번호 + 곡 이름 */}
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">곡 번호</Label>
              <Input
                type="number"
                min={1}
                value={form.songNumber}
                onChange={(e) =>
                  set("songNumber", parseInt(e.target.value) || 1)
                }
                className="h-8 text-xs"
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">곡 이름 *</Label>
              <Input
                value={form.songName}
                onChange={(e) => set("songName", e.target.value)}
                placeholder="예: ANTIFRAGILE"
                className="h-8 text-xs"
                required
              />
            </div>
          </div>

          {/* 변경 전/후 의상 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">변경 전 의상 *</Label>
              <Input
                value={form.costumeFrom}
                onChange={(e) => set("costumeFrom", e.target.value)}
                placeholder="예: 흰색 드레스"
                className="h-8 text-xs"
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">변경 후 의상 *</Label>
              <Input
                value={form.costumeTo}
                onChange={(e) => set("costumeTo", e.target.value)}
                placeholder="예: 검정 수트"
                className="h-8 text-xs"
                required
              />
            </div>
          </div>

          {/* 변경 대상 멤버 */}
          <div className="space-y-1">
            <Label className="text-xs">변경 멤버 (쉼표 구분)</Label>
            <Input
              value={memberInput}
              onChange={(e) => setMemberInput(e.target.value)}
              placeholder="예: 김민지, 이지수, 박소연"
              className="h-8 text-xs"
            />
            <p className="text-[10px] text-gray-400">
              여러 명은 쉼표(,)로 구분하세요
            </p>
          </div>

          {/* 변경 시간 */}
          <div className="space-y-1">
            <Label className="text-xs">변경 시간 (초)</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                value={form.changeTimeSeconds}
                onChange={(e) =>
                  set("changeTimeSeconds", parseInt(e.target.value) || 1)
                }
                className="h-8 text-xs"
              />
              <span className="text-xs text-gray-500 shrink-0">
                {formatSeconds(form.changeTimeSeconds)}
              </span>
            </div>
            {form.changeTimeSeconds <= 30 && (
              <p className="text-[10px] text-red-500 flex items-center gap-0.5">
                <Zap className="h-2.5 w-2.5" />
                퀵체인지 (30초 이하)
              </p>
            )}
          </div>

          {/* 변경 위치 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">변경 위치</Label>
              <Select
                value={form.location}
                onValueChange={(v) => set("location", v as CostumeChangeLocation)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.keys(LOCATION_META) as CostumeChangeLocation[]
                  ).map((loc) => (
                    <SelectItem key={loc} value={loc} className="text-xs">
                      {LOCATION_META[loc].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">위치 상세</Label>
              <Input
                value={form.locationDetail}
                onChange={(e) => set("locationDetail", e.target.value)}
                placeholder="예: 3번 날개 옆"
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* 도우미 필요 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="needs-helper"
                checked={form.needsHelper}
                onCheckedChange={(checked) =>
                  set("needsHelper", Boolean(checked))
                }
              />
              <Label htmlFor="needs-helper" className="text-xs cursor-pointer">
                도우미 필요
              </Label>
            </div>
            {form.needsHelper && (
              <Input
                value={form.helperName}
                onChange={(e) => set("helperName", e.target.value)}
                placeholder="도우미 이름 (선택)"
                className="h-8 text-xs"
              />
            )}
          </div>

          {/* 주의사항 */}
          <div className="space-y-1">
            <Label className="text-xs">주의사항</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="변경 시 주의사항을 입력하세요..."
              className="text-xs min-h-[60px] resize-none"
            />
          </div>

          <DialogFooter className="gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={onClose}
            >
              취소
            </Button>
            <Button type="submit" size="sm" className="h-7 text-xs">
              {initial ? "수정" : "추가"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 삭제 확인 다이얼로그
// ============================================================

function DeleteConfirmDialog({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-sm">항목 삭제</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-gray-600">
          이 의상 변경 항목을 삭제하시겠습니까?
        </p>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={onClose}
          >
            취소
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="h-7 text-xs"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            삭제
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 메인 카드 컴포넌트
// ============================================================

export function CostumeChangeCard({
  groupId,
  projectId,
}: {
  groupId: string;
  projectId: string;
}) {
  const {
    entries,
    loading,
    addEntry,
    updateEntry,
    deleteEntry,
    moveEntry,
    filterByMember,
    stats,
  } = useCostumeChange(groupId, projectId);

  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<CostumeChangeEntry | null>(null);
  const deleteConfirm = useDeleteConfirm<string>();
  const [memberFilter, setMemberFilter] = useState("");

  const displayEntries = memberFilter.trim()
    ? filterByMember(memberFilter)
    : entries;

  async function handleAdd(values: AddCostumeChangeInput) {
    const ok = await addEntry(values);
    if (ok) setShowForm(false);
  }

  async function handleUpdate(values: AddCostumeChangeInput) {
    if (!editTarget) return;
    const ok = await updateEntry(editTarget.id, values);
    if (ok) setEditTarget(null);
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4 text-xs text-gray-400">
          로딩 중...
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shirt className="h-4 w-4 text-pink-500" />
              <CardTitle className="text-sm font-semibold">
                의상 변경 시트
              </CardTitle>
            </div>
            {/* 통계 배지 */}
            <div className="flex items-center gap-1">
              {stats.fastChanges > 0 && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 bg-red-50 text-red-600 border-red-200 flex items-center gap-0.5"
                >
                  <Zap className="h-2.5 w-2.5" />
                  퀵체인지 {stats.fastChanges}
                </Badge>
              )}
              {stats.needsHelper > 0 && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 bg-yellow-50 text-yellow-700 border-yellow-200"
                >
                  도우미 필요 {stats.needsHelper}
                </Badge>
              )}
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 text-gray-500"
              >
                전체 {stats.total}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* 평균 변경 시간 요약 */}
          {stats.total > 0 && (
            <div className="rounded-md bg-pink-50 border border-pink-100 px-3 py-2 flex items-center gap-3">
              <Clock className="h-3.5 w-3.5 text-pink-500 shrink-0" />
              <div className="flex items-center gap-3 text-xs text-pink-700">
                <span>
                  평균 변경 시간: <strong>{formatSeconds(stats.avgSeconds)}</strong>
                </span>
                <span className="text-pink-400">|</span>
                <span>
                  퀵체인지: <strong>{stats.fastChanges}건</strong>
                </span>
                <span className="text-pink-400">|</span>
                <span>
                  도우미 필요: <strong>{stats.needsHelper}건</strong>
                </span>
              </div>
            </div>
          )}

          {/* 멤버 필터 */}
          {entries.length > 0 && (
            <div className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              <Input
                value={memberFilter}
                onChange={(e) => setMemberFilter(e.target.value)}
                placeholder="멤버명으로 필터..."
                className="h-7 text-xs"
              />
              {memberFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={() => setMemberFilter("")}
                >
                  초기화
                </Button>
              )}
            </div>
          )}

          {/* 항목 목록 */}
          {displayEntries.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">
              {memberFilter.trim()
                ? `'${memberFilter}' 멤버의 의상 변경 항목이 없습니다.`
                : "의상 변경 항목이 없습니다."}
            </p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {displayEntries.map((entry, index) => (
                <EntryRow
                  key={entry.id}
                  entry={entry}
                  index={index}
                  total={displayEntries.length}
                  onEdit={() => setEditTarget(entry)}
                  onDelete={() => deleteConfirm.request(entry.id)}
                  onMoveUp={() => moveEntry(entry.id, "up")}
                  onMoveDown={() => moveEntry(entry.id, "down")}
                />
              ))}
            </div>
          )}

          {/* 추가 버튼 */}
          <div className="border-t pt-3">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs w-full"
              onClick={() => setShowForm(true)}
            >
              <Plus className="h-3 w-3 mr-1" />
              의상 변경 추가
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 추가 다이얼로그 */}
      <EntryFormDialog
        open={showForm}
        initial={null}
        onClose={() => setShowForm(false)}
        onSubmit={handleAdd}
      />

      {/* 수정 다이얼로그 */}
      <EntryFormDialog
        open={editTarget !== null}
        initial={editTarget}
        onClose={() => setEditTarget(null)}
        onSubmit={handleUpdate}
      />

      {/* 삭제 확인 다이얼로그 */}
      <DeleteConfirmDialog
        open={deleteConfirm.open}
        onClose={deleteConfirm.cancel}
        onConfirm={() => {
          const id = deleteConfirm.confirm();
          if (id) deleteEntry(id);
        }}
      />
    </>
  );
}
