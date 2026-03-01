"use client";

import { useState } from "react";
import {
  Trophy,
  ChevronDown,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Star,
  MapPin,
  Users,
  Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import {
  usePerformanceRecords,
  type PerformanceRecordInput,
} from "@/hooks/use-performance-records";
import type { PerformanceRecord, PerformanceEventType } from "@/types";
import { formatYearMonthDay } from "@/lib/date-utils";

const EVENT_TYPE_LABELS: Record<PerformanceEventType, string> = {
  performance: "공연",
  competition: "대회",
  showcase: "쇼케이스",
  workshop: "워크숍",
};

const EVENT_TYPE_COLORS: Record<PerformanceEventType, string> = {
  performance: "bg-purple-100 text-purple-700 border-purple-200",
  competition: "bg-orange-100 text-orange-700 border-orange-200",
  showcase: "bg-pink-100 text-pink-700 border-pink-200",
  workshop: "bg-cyan-100 text-cyan-700 border-cyan-200",
};

const DEFAULT_FORM: PerformanceRecordInput = {
  event_name: "",
  event_date: "",
  event_type: "performance",
  result: "",
  ranking: "",
  audience_count: null,
  venue: "",
  notes: "",
  project_id: null,
};

interface PerformanceRecordSectionProps {
  groupId: string;
  canEdit: boolean;
}

export function PerformanceRecordSection({
  groupId,
  canEdit,
}: PerformanceRecordSectionProps) {
  const {
    records,
    loading,
    totalCount,
    awardCount,
    thisYearCount,
    addRecord,
    updateRecord,
    deleteRecord,
  } = usePerformanceRecords(groupId);

  const [isOpen, setIsOpen] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addForm, setAddForm] = useState<PerformanceRecordInput>(DEFAULT_FORM);
  const [addSubmitting, setAddSubmitting] = useState(false);

  const [editingRecord, setEditingRecord] = useState<PerformanceRecord | null>(null);
  const [editForm, setEditForm] = useState<PerformanceRecordInput>(DEFAULT_FORM);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAddOpen = () => {
    setAddForm(DEFAULT_FORM);
    setShowAddDialog(true);
  };

  const handleAddSubmit = async () => {
    if (!addForm.event_name.trim() || !addForm.event_date) return;

    setAddSubmitting(true);
    const ok = await addRecord(addForm);
    setAddSubmitting(false);

    if (ok) {
      setAddForm(DEFAULT_FORM);
      setShowAddDialog(false);
    }
  };

  const handleEditOpen = (record: PerformanceRecord) => {
    setEditingRecord(record);
    setEditForm({
      event_name: record.event_name,
      event_date: record.event_date,
      event_type: record.event_type,
      result: record.result ?? "",
      ranking: record.ranking ?? "",
      audience_count: record.audience_count,
      venue: record.venue ?? "",
      notes: record.notes ?? "",
      project_id: record.project_id,
    });
  };

  const handleEditSubmit = async () => {
    if (!editingRecord || !editForm.event_name.trim() || !editForm.event_date) return;

    setEditSubmitting(true);
    const ok = await updateRecord(editingRecord.id, editForm);
    setEditSubmitting(false);

    if (ok) {
      setEditingRecord(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await deleteRecord(id);
    setDeletingId(null);
  };

  return (
    <div className="rounded border bg-card px-3 py-2.5">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          className="flex items-center gap-1 hover:opacity-70 transition-opacity"
          onClick={() => setIsOpen((v) => !v)}
        >
          <Trophy className="h-3 w-3 text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground font-medium">
            공연/대회 성과
          </span>
          <ChevronDown
            className={`h-3 w-3 text-muted-foreground transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>
        {canEdit && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[10px] px-1.5 py-0 gap-0.5"
            onClick={handleAddOpen}
          >
            <Plus className="h-3 w-3" />
            성과 추가
          </Button>
        )}
      </div>

      {isOpen && (
        <>
          {/* 통계 요약 바 */}
          {!loading && (
            <div className="flex items-center gap-3 mb-2 px-1 py-1 rounded bg-muted/40 text-[10px] text-muted-foreground">
              <span>총 <strong className="text-foreground">{totalCount}</strong>회 공연</span>
              <span className="text-border">|</span>
              <span>수상 <strong className="text-foreground">{awardCount}</strong>회</span>
              <span className="text-border">|</span>
              <span>올해 <strong className="text-foreground">{thisYearCount}</strong>회</span>
            </div>
          )}

          {/* 목록 */}
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : records.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              등록된 성과 기록이 없습니다
            </p>
          ) : (
            <div className="space-y-1.5">
              {records.map((record) => {
                const isDeleting = deletingId === record.id;

                return (
                  <div
                    key={record.id}
                    className="rounded border bg-background px-2.5 py-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        {/* 이벤트명 + 타입 뱃지 */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-medium leading-tight">
                            {record.event_name}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-1.5 py-0 ${EVENT_TYPE_COLORS[record.event_type]}`}
                          >
                            {EVENT_TYPE_LABELS[record.event_type]}
                          </Badge>
                          {record.result && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-600 font-medium">
                              <Trophy className="h-2.5 w-2.5" />
                              {record.result}
                            </span>
                          )}
                        </div>

                        {/* 날짜 + 메타 정보 */}
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-[10px] text-muted-foreground">
                            {formatYearMonthDay(record.event_date)}
                          </span>
                          {record.ranking && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                              <Hash className="h-2.5 w-2.5" />
                              {record.ranking}
                            </span>
                          )}
                          {record.audience_count !== null && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                              <Users className="h-2.5 w-2.5" />
                              {record.audience_count.toLocaleString()}명
                            </span>
                          )}
                          {record.venue && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                              <MapPin className="h-2.5 w-2.5" />
                              {record.venue}
                            </span>
                          )}
                        </div>

                        {/* 메모 */}
                        {record.notes && (
                          <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                            {record.notes}
                          </p>
                        )}
                      </div>

                      {/* 수정/삭제 버튼 */}
                      {canEdit && (
                        <div className="flex items-center gap-0.5 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 text-muted-foreground hover:text-blue-500"
                            onClick={() => handleEditOpen(record)}
                            disabled={isDeleting}
                            title="수정"
                          >
                            <Pencil className="h-2.5 w-2.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(record.id)}
                            disabled={isDeleting}
                            title="삭제"
                          >
                            {isDeleting ? (
                              <Loader2 className="h-2.5 w-2.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-2.5 w-2.5" />
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* 성과 추가 Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-1.5">
              <Star className="h-4 w-4 text-amber-500" />
              성과 기록 추가
            </DialogTitle>
          </DialogHeader>
          <PerformanceRecordForm
            form={addForm}
            onChange={setAddForm}
            onSubmit={handleAddSubmit}
            onCancel={() => setShowAddDialog(false)}
            submitting={addSubmitting}
            submitLabel="추가"
          />
        </DialogContent>
      </Dialog>

      {/* 성과 수정 Dialog */}
      <Dialog
        open={editingRecord !== null}
        onOpenChange={(open) => {
          if (!open) setEditingRecord(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-1.5">
              <Pencil className="h-4 w-4" />
              성과 기록 수정
            </DialogTitle>
          </DialogHeader>
          <PerformanceRecordForm
            form={editForm}
            onChange={setEditForm}
            onSubmit={handleEditSubmit}
            onCancel={() => setEditingRecord(null)}
            submitting={editSubmitting}
            submitLabel="저장"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --------------------------------
// 폼 서브 컴포넌트
// --------------------------------
interface PerformanceRecordFormProps {
  form: PerformanceRecordInput;
  onChange: (form: PerformanceRecordInput) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitting: boolean;
  submitLabel: string;
}

function PerformanceRecordForm({
  form,
  onChange,
  onSubmit,
  onCancel,
  submitting,
  submitLabel,
}: PerformanceRecordFormProps) {
  const set = (patch: Partial<PerformanceRecordInput>) =>
    onChange({ ...form, ...patch });

  const isValid = form.event_name.trim() !== "" && form.event_date !== "";

  return (
    <div className="space-y-3 pt-1">
      {/* 이벤트명 */}
      <div>
        <Label htmlFor="pr-event-name" className="text-[10px] text-muted-foreground mb-1 block">
          이벤트명 <span className="text-destructive">*</span>
        </Label>
        <Input
          id="pr-event-name"
          value={form.event_name}
          onChange={(e) => set({ event_name: e.target.value })}
          placeholder="예: 2026 서울댄스페스티벌"
          className="h-7 text-xs"
        />
      </div>

      {/* 날짜 + 이벤트 타입 */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="pr-event-date" className="text-[10px] text-muted-foreground mb-1 block">
            날짜 <span className="text-destructive">*</span>
          </Label>
          <Input
            id="pr-event-date"
            type="date"
            value={form.event_date}
            onChange={(e) => set({ event_date: e.target.value })}
            className="h-7 text-xs"
          />
        </div>
        <div>
          <Label htmlFor="pr-event-type" className="text-[10px] text-muted-foreground mb-1 block">
            이벤트 타입
          </Label>
          <Select
            value={form.event_type}
            onValueChange={(v) => set({ event_type: v as PerformanceEventType })}
          >
            <SelectTrigger id="pr-event-type" className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="performance" className="text-xs">공연</SelectItem>
              <SelectItem value="competition" className="text-xs">대회</SelectItem>
              <SelectItem value="showcase" className="text-xs">쇼케이스</SelectItem>
              <SelectItem value="workshop" className="text-xs">워크숍</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 수상 결과 + 순위 */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="pr-result" className="text-[10px] text-muted-foreground mb-1 block">
            수상 결과
          </Label>
          <Input
            id="pr-result"
            value={form.result ?? ""}
            onChange={(e) => set({ result: e.target.value })}
            placeholder="예: 대상, 금상"
            className="h-7 text-xs"
          />
        </div>
        <div>
          <Label htmlFor="pr-ranking" className="text-[10px] text-muted-foreground mb-1 block">
            순위
          </Label>
          <Input
            id="pr-ranking"
            value={form.ranking ?? ""}
            onChange={(e) => set({ ranking: e.target.value })}
            placeholder="예: 1위, 3/20"
            className="h-7 text-xs"
          />
        </div>
      </div>

      {/* 관객 수 + 장소 */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="pr-audience" className="text-[10px] text-muted-foreground mb-1 block">
            관객 수
          </Label>
          <Input
            id="pr-audience"
            type="number"
            min={0}
            value={form.audience_count ?? ""}
            onChange={(e) =>
              set({
                audience_count: e.target.value === "" ? null : Number(e.target.value),
              })
            }
            placeholder="예: 500"
            className="h-7 text-xs"
          />
        </div>
        <div>
          <Label htmlFor="pr-venue" className="text-[10px] text-muted-foreground mb-1 block">
            장소
          </Label>
          <Input
            id="pr-venue"
            value={form.venue ?? ""}
            onChange={(e) => set({ venue: e.target.value })}
            placeholder="예: 홍대 라이브홀"
            className="h-7 text-xs"
          />
        </div>
      </div>

      {/* 메모 */}
      <div>
        <Label htmlFor="pr-notes" className="text-[10px] text-muted-foreground mb-1 block">
          메모
        </Label>
        <Textarea
          id="pr-notes"
          value={form.notes ?? ""}
          onChange={(e) => set({ notes: e.target.value })}
          placeholder="후기, 참고 사항 등"
          className="text-xs min-h-[64px] resize-none"
        />
      </div>

      {/* 버튼 */}
      <div className="flex items-center gap-1.5 pt-1">
        <Button
          size="sm"
          className="h-7 text-xs"
          onClick={onSubmit}
          disabled={submitting || !isValid}
        >
          {submitting && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
          {submitLabel}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={onCancel}
          disabled={submitting}
        >
          취소
        </Button>
      </div>
    </div>
  );
}
