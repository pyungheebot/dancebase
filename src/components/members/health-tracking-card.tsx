"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  HeartPulse,
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { useHealthTracking } from "@/hooks/use-health-tracking";
import type { BodyPart, InjurySeverity, InjuryStatus, InjuryRecord } from "@/types";

// ============================================
// 레이블 상수
// ============================================

const BODY_PART_LABELS: Record<BodyPart, string> = {
  neck: "목",
  shoulder: "어깨",
  back: "등",
  waist: "허리",
  hip: "고관절",
  knee: "무릎",
  ankle: "발목",
  wrist: "손목",
  elbow: "팔꿈치",
  other: "기타",
};

const BODY_PART_ICON: Record<BodyPart, string> = {
  neck: "🦴",
  shoulder: "💪",
  back: "🔙",
  waist: "🩹",
  hip: "🦵",
  knee: "🦵",
  ankle: "🦶",
  wrist: "✋",
  elbow: "💪",
  other: "🩺",
};

const SEVERITY_LABELS: Record<InjurySeverity, string> = {
  mild: "경미",
  moderate: "중간",
  severe: "심각",
};

const SEVERITY_COLORS: Record<InjurySeverity, string> = {
  mild: "bg-yellow-100 text-yellow-700 border-yellow-200",
  moderate: "bg-orange-100 text-orange-700 border-orange-200",
  severe: "bg-red-100 text-red-700 border-red-200",
};

const STATUS_LABELS: Record<InjuryStatus, string> = {
  active: "부상중",
  recovering: "회복중",
  healed: "완치",
};

const STATUS_COLORS: Record<InjuryStatus, string> = {
  active: "bg-red-100 text-red-700 border-red-200",
  recovering: "bg-yellow-100 text-yellow-700 border-yellow-200",
  healed: "bg-green-100 text-green-700 border-green-200",
};

const STATUS_ICON: Record<InjuryStatus, React.ReactNode> = {
  active: <AlertCircle className="h-3 w-3" />,
  recovering: <Clock className="h-3 w-3" />,
  healed: <CheckCircle2 className="h-3 w-3" />,
};

// ============================================
// 날짜 포맷 유틸
// ============================================

function formatDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ============================================
// 부상 추가 다이얼로그
// ============================================

type AddInjuryDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    bodyPart: BodyPart;
    severity: InjurySeverity;
    description: string;
    occurredAt: string;
    note: string;
  }) => void;
};

function AddInjuryDialog({ open, onClose, onSubmit }: AddInjuryDialogProps) {
  const [bodyPart, setBodyPart] = useState<BodyPart>("knee");
  const [severity, setSeverity] = useState<InjurySeverity>("mild");
  const [description, setDescription] = useState("");
  const [occurredAt, setOccurredAt] = useState(todayString());
  const [note, setNote] = useState("");

  function handleSubmit() {
    if (!description.trim()) {
      toast.error("부상 설명을 입력해주세요.");
      return;
    }
    if (!occurredAt) {
      toast.error("발생일을 입력해주세요.");
      return;
    }
    onSubmit({ bodyPart, severity, description: description.trim(), occurredAt, note: note.trim() });
    // 초기화
    setBodyPart("knee");
    setSeverity("mild");
    setDescription("");
    setOccurredAt(todayString());
    setNote("");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <HeartPulse className="h-4 w-4 text-red-500" />
            부상 기록 추가
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* 신체 부위 */}
          <div className="space-y-1">
            <Label className="text-xs">신체 부위</Label>
            <Select value={bodyPart} onValueChange={(v) => setBodyPart(v as BodyPart)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(BODY_PART_LABELS) as BodyPart[]).map((part) => (
                  <SelectItem key={part} value={part} className="text-xs">
                    {BODY_PART_ICON[part]} {BODY_PART_LABELS[part]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 심각도 */}
          <div className="space-y-1">
            <Label className="text-xs">심각도</Label>
            <Select value={severity} onValueChange={(v) => setSeverity(v as InjurySeverity)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mild" className="text-xs">경미 - 활동 가능</SelectItem>
                <SelectItem value="moderate" className="text-xs">중간 - 주의 필요</SelectItem>
                <SelectItem value="severe" className="text-xs">심각 - 활동 제한</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 설명 */}
          <div className="space-y-1">
            <Label className="text-xs">부상 설명</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="예: 점프 착지 시 발목 접질림"
              className="h-8 text-xs"
            />
          </div>

          {/* 발생일 */}
          <div className="space-y-1">
            <Label className="text-xs">발생일</Label>
            <Input
              type="date"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* 메모 */}
          <div className="space-y-1">
            <Label className="text-xs">메모 (선택)</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="병원 방문, 치료 방법 등 추가 메모"
              className="text-xs resize-none"
              rows={2}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="outline" size="sm" className="h-7 text-xs flex-1" onClick={onClose}>
              취소
            </Button>
            <Button size="sm" className="h-7 text-xs flex-1" onClick={handleSubmit}>
              기록하기
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 노트 편집 다이얼로그
// ============================================

type EditNoteDialogProps = {
  record: InjuryRecord | null;
  onClose: () => void;
  onSave: (id: string, note: string) => void;
};

function EditNoteDialog({ record, onClose, onSave }: EditNoteDialogProps) {
  const [note, setNote] = useState(record?.note ?? "");

  // record 변경 시 note 동기화
  if (record && note !== record.note && note === "") {
    setNote(record.note);
  }

  return (
    <Dialog open={!!record} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">메모 편집</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="치료 방법, 병원 기록 등 메모를 입력하세요."
            className="text-xs resize-none"
            rows={3}
          />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-7 text-xs flex-1" onClick={onClose}>
              취소
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs flex-1"
              onClick={() => {
                if (record) {
                  onSave(record.id, note);
                  onClose();
                }
              }}
            >
              저장
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 부상 이력 아이템
// ============================================

type InjuryItemProps = {
  record: InjuryRecord;
  onStatusChange: (id: string, status: InjuryStatus) => void;
  onEditNote: (record: InjuryRecord) => void;
  onDelete: (id: string) => void;
};

function InjuryItem({ record, onStatusChange, onEditNote, onDelete }: InjuryItemProps) {
  return (
    <div className="border rounded-lg p-3 space-y-2 bg-white">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm">{BODY_PART_ICON[record.bodyPart]}</span>
          <span className="text-xs font-medium text-gray-800">
            {BODY_PART_LABELS[record.bodyPart]}
          </span>
          <Badge className={`text-[10px] px-1.5 py-0 border ${SEVERITY_COLORS[record.severity]}`}>
            {SEVERITY_LABELS[record.severity]}
          </Badge>
          <Badge className={`text-[10px] px-1.5 py-0 border flex items-center gap-0.5 ${STATUS_COLORS[record.status]}`}>
            {STATUS_ICON[record.status]}
            {STATUS_LABELS[record.status]}
          </Badge>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => onEditNote(record)}
          >
            <Pencil className="h-3 w-3 text-gray-400" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => onDelete(record.id)}
          >
            <Trash2 className="h-3 w-3 text-gray-400" />
          </Button>
        </div>
      </div>

      {/* 설명 */}
      <p className="text-xs text-gray-600">{record.description}</p>

      {/* 메모 */}
      {record.note && (
        <p className="text-[10px] text-gray-400 bg-gray-50 rounded px-2 py-1 leading-relaxed">
          {record.note}
        </p>
      )}

      {/* 날짜 및 상태 변경 */}
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] text-gray-400 space-x-2">
          <span>발생: {formatDate(record.occurredAt)}</span>
          {record.healedAt && <span>완치: {formatDate(record.healedAt)}</span>}
        </div>
        {record.status !== "healed" && (
          <Select
            value={record.status}
            onValueChange={(v) => onStatusChange(record.id, v as InjuryStatus)}
          >
            <SelectTrigger className="h-6 text-[10px] w-24 px-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active" className="text-xs">부상중</SelectItem>
              <SelectItem value="recovering" className="text-xs">회복중</SelectItem>
              <SelectItem value="healed" className="text-xs">완치</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}

// ============================================
// 메인 카드
// ============================================

type HealthTrackingCardProps = {
  groupId: string;
  userId: string;
};

export function HealthTrackingCard({ groupId, userId }: HealthTrackingCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingRecord, setEditingRecord] = useState<InjuryRecord | null>(null);
  const [filterStatus, setFilterStatus] = useState<InjuryStatus | "all">("all");

  const {
    records,
    loading,
    activeCount,
    recoveringCount,
    healedCount,
    activeInjuries,
    addInjury,
    updateStatus,
    updateNote,
    deleteInjury,
  } = useHealthTracking(groupId, userId);

  function handleAdd(data: {
    bodyPart: BodyPart;
    severity: InjurySeverity;
    description: string;
    occurredAt: string;
    note: string;
  }) {
    addInjury(data);
    toast.success("부상이 기록되었습니다.");
  }

  function handleStatusChange(id: string, status: InjuryStatus) {
    updateStatus(id, status);
    const label = STATUS_LABELS[status];
    toast.success(`상태가 '${label}'으로 변경되었습니다.`);
  }

  function handleDelete(id: string) {
    deleteInjury(id);
    toast.success("기록이 삭제되었습니다.");
  }

  function handleSaveNote(id: string, note: string) {
    updateNote(id, note);
    toast.success("메모가 저장되었습니다.");
  }

  // 필터 적용
  const filteredRecords =
    filterStatus === "all" ? records : records.filter((r) => r.status === filterStatus);

  // 활성 부상 부위 요약 (중복 제거)
  const activeBodyParts = [...new Set(activeInjuries.map((r) => r.bodyPart))];

  return (
    <>
      <AddInjuryDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSubmit={handleAdd}
      />
      <EditNoteDialog
        record={editingRecord}
        onClose={() => setEditingRecord(null)}
        onSave={handleSaveNote}
      />

      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card>
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <HeartPulse className="h-4 w-4 text-red-500" />
                부상 / 건강 추적
                {activeCount > 0 && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-red-100 text-red-700 border border-red-200">
                    활성 {activeCount}
                  </Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAddDialog(true);
                  }}
                >
                  <Plus className="h-3 w-3" />
                  기록
                </Button>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                    {isOpen ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>
            </div>

            {/* 활성 부상 요약 (항상 표시) */}
            {!loading && (
              <div className="mt-2">
                {activeCount === 0 && recoveringCount === 0 ? (
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    현재 부상 없음
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {activeBodyParts.map((part) => {
                      const partInjuries = activeInjuries.filter((r) => r.bodyPart === part);
                      const maxSeverity = partInjuries.reduce<InjurySeverity>((acc, r) => {
                        const order: InjurySeverity[] = ["mild", "moderate", "severe"];
                        return order.indexOf(r.severity) > order.indexOf(acc) ? r.severity : acc;
                      }, "mild");
                      return (
                        <span
                          key={part}
                          className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full border ${SEVERITY_COLORS[maxSeverity]}`}
                        >
                          {BODY_PART_ICON[part]}
                          {BODY_PART_LABELS[part]}
                        </span>
                      );
                    })}
                    {recoveringCount > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full border bg-yellow-100 text-yellow-700 border-yellow-200">
                        <Clock className="h-2.5 w-2.5" />
                        회복중 {recoveringCount}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="pt-0 px-4 pb-4 space-y-3">
              {/* 통계 */}
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center bg-red-50 rounded-lg p-2">
                  <p className="text-base font-bold text-red-600">{activeCount}</p>
                  <p className="text-[10px] text-red-500">부상중</p>
                </div>
                <div className="text-center bg-yellow-50 rounded-lg p-2">
                  <p className="text-base font-bold text-yellow-600">{recoveringCount}</p>
                  <p className="text-[10px] text-yellow-500">회복중</p>
                </div>
                <div className="text-center bg-green-50 rounded-lg p-2">
                  <p className="text-base font-bold text-green-600">{healedCount}</p>
                  <p className="text-[10px] text-green-500">완치</p>
                </div>
              </div>

              {/* 필터 */}
              {records.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <Activity className="h-3 w-3 text-gray-400 shrink-0" />
                  <div className="flex gap-1 flex-wrap">
                    {(["all", "active", "recovering", "healed"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setFilterStatus(s)}
                        className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                          filterStatus === s
                            ? "bg-gray-800 text-white border-gray-800"
                            : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                        }`}
                      >
                        {s === "all" ? "전체" : STATUS_LABELS[s]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 이력 목록 */}
              {loading ? (
                <p className="text-xs text-gray-400 text-center py-4">불러오는 중...</p>
              ) : filteredRecords.length === 0 ? (
                <div className="text-center py-6 space-y-1">
                  <HeartPulse className="h-6 w-6 text-gray-300 mx-auto" />
                  <p className="text-xs text-gray-400">기록된 부상이 없습니다.</p>
                  <p className="text-[10px] text-gray-300">
                    상단 &apos;기록&apos; 버튼으로 추가할 수 있습니다.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredRecords.map((record) => (
                    <InjuryItem
                      key={record.id}
                      record={record}
                      onStatusChange={handleStatusChange}
                      onEditNote={(r) => {
                        setEditingRecord(r);
                      }}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </>
  );
}
