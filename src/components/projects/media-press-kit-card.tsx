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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Newspaper,
  Plus,
  Trash2,
  Pencil,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  Phone,
  Mail,
  Paperclip,
  Send,
  User,
  Globe,
} from "lucide-react";
import {
  useMediaPressKit,
  type AddMediaPressKitInput,
  type AddOutletInput,
} from "@/hooks/use-media-press-kit";
import type {
  MediaPressKitEntry,
  MediaPressKitOutlet,
  MediaPressKitStatus,
  MediaPressKitOutletType,
} from "@/types";

// ============================================================
// 상수
// ============================================================

const STATUS_CONFIG: Record<
  MediaPressKitStatus,
  { label: string; color: string }
> = {
  draft: {
    label: "작성중",
    color: "bg-gray-100 text-gray-600 border-gray-200",
  },
  review: {
    label: "검토중",
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  published: {
    label: "배포완료",
    color: "bg-green-100 text-green-700 border-green-200",
  },
};

const OUTLET_TYPE_CONFIG: Record<
  MediaPressKitOutletType,
  { label: string; color: string }
> = {
  newspaper: { label: "신문", color: "bg-blue-100 text-blue-700 border-blue-200" },
  magazine: { label: "잡지", color: "bg-purple-100 text-purple-700 border-purple-200" },
  online: { label: "온라인", color: "bg-cyan-100 text-cyan-700 border-cyan-200" },
  broadcast: { label: "방송", color: "bg-orange-100 text-orange-700 border-orange-200" },
  sns: { label: "SNS", color: "bg-pink-100 text-pink-700 border-pink-200" },
  other: { label: "기타", color: "bg-gray-100 text-gray-600 border-gray-200" },
};

const STATUS_ORDER: MediaPressKitStatus[] = ["draft", "review", "published"];

// ============================================================
// 빈 폼 초기값
// ============================================================

const EMPTY_ENTRY_FORM: AddMediaPressKitInput & { attachmentInput: string } = {
  title: "",
  writtenAt: new Date().toISOString().split("T")[0],
  content: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  attachmentUrls: [],
  attachmentInput: "",
};

const EMPTY_OUTLET_FORM: AddOutletInput = {
  name: "",
  type: "online",
  contactName: "",
  contactEmail: "",
  published: false,
  note: "",
};

// ============================================================
// 서브 컴포넌트: 매체 태그
// ============================================================

function OutletTag({
  outlet,
  onToggle,
  onDelete,
}: {
  outlet: MediaPressKitOutlet;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const typeConf = OUTLET_TYPE_CONFIG[outlet.type];
  return (
    <div className="flex items-center gap-1 rounded-md border bg-white px-2 py-1">
      <button
        onClick={onToggle}
        className="shrink-0"
        title={outlet.published ? "게재 취소" : "게재 완료 표시"}
      >
        {outlet.published ? (
          <CheckCircle2 className="h-3 w-3 text-green-500" />
        ) : (
          <Circle className="h-3 w-3 text-gray-300" />
        )}
      </button>
      <span className={`text-[10px] px-1 py-0 rounded border ${typeConf.color}`}>
        {typeConf.label}
      </span>
      <span className="text-xs text-gray-700 truncate max-w-[80px]">
        {outlet.name}
      </span>
      <button
        onClick={onDelete}
        className="ml-0.5 text-gray-300 hover:text-red-400 transition-colors"
      >
        <Trash2 className="h-2.5 w-2.5" />
      </button>
    </div>
  );
}

// ============================================================
// 서브 컴포넌트: 보도자료 카드 행
// ============================================================

function EntryRow({
  entry,
  onEdit,
  onDelete,
  onStatusChange,
  onAddOutlet,
  onToggleOutlet,
  onDeleteOutlet,
}: {
  entry: MediaPressKitEntry;
  onEdit: (e: MediaPressKitEntry) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: MediaPressKitStatus) => void;
  onAddOutlet: (entryId: string) => void;
  onToggleOutlet: (entryId: string, outletId: string) => void;
  onDeleteOutlet: (entryId: string, outletId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const statusConf = STATUS_CONFIG[entry.status];
  const publishedCount = entry.outlets.filter((o) => o.published).length;

  return (
    <div className="rounded-lg border border-gray-100 bg-white overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-start gap-2 p-3">
        <button
          className="mt-0.5 shrink-0"
          onClick={() => setExpanded((v) => !v)}
          aria-label="상세 보기 토글"
        >
          {expanded ? (
            <ChevronUp className="h-3.5 w-3.5 text-gray-400" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge className={`text-[10px] px-1.5 py-0 ${statusConf.color}`}>
              {statusConf.label}
            </Badge>
            <span className="text-xs font-medium text-gray-800 truncate">
              {entry.title}
            </span>
            <span className="text-[10px] text-gray-400 shrink-0">
              {entry.writtenAt}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-1">
            <span className="flex items-center gap-1 text-[11px] text-gray-500">
              <User className="h-3 w-3" />
              {entry.contactName}
            </span>
            {entry.outlets.length > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-gray-500">
                <Send className="h-3 w-3" />
                {publishedCount}/{entry.outlets.length} 게재
              </span>
            )}
            {entry.attachmentUrls.length > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-gray-500">
                <Paperclip className="h-3 w-3" />
                {entry.attachmentUrls.length}개
              </span>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0">
              <MoreVertical className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="text-xs">
            <DropdownMenuItem onClick={() => onEdit(entry)} className="text-xs">
              <Pencil className="h-3 w-3 mr-2" />
              수정
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {STATUS_ORDER.filter((s) => s !== entry.status).map((s) => (
              <DropdownMenuItem
                key={s}
                className="text-xs"
                onClick={() => onStatusChange(entry.id, s)}
              >
                <span
                  className={`inline-block w-2 h-2 rounded-full mr-2 ${
                    s === "draft"
                      ? "bg-gray-400"
                      : s === "review"
                      ? "bg-yellow-500"
                      : "bg-green-500"
                  }`}
                />
                {STATUS_CONFIG[s].label}으로 변경
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 text-xs"
              onClick={() => onDelete(entry.id)}
            >
              <Trash2 className="h-3 w-3 mr-2" />
              삭제
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 상세 펼침 */}
      {expanded && (
        <div className="border-t border-gray-50 px-3 pb-3 pt-2 space-y-3">
          {/* 내용 */}
          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 uppercase tracking-wide">
              보도 내용
            </span>
            <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 rounded p-2">
              {entry.content}
            </p>
          </div>

          {/* 담당자 연락처 */}
          <div className="flex flex-wrap gap-3">
            {entry.contactEmail && (
              <span className="flex items-center gap-1 text-[11px] text-gray-600">
                <Mail className="h-3 w-3 text-gray-400" />
                {entry.contactEmail}
              </span>
            )}
            {entry.contactPhone && (
              <span className="flex items-center gap-1 text-[11px] text-gray-600">
                <Phone className="h-3 w-3 text-gray-400" />
                {entry.contactPhone}
              </span>
            )}
          </div>

          {/* 첨부파일 */}
          {entry.attachmentUrls.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] text-gray-400 uppercase tracking-wide">
                첨부파일
              </span>
              <div className="flex flex-col gap-1">
                {entry.attachmentUrls.map((url, idx) => (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[11px] text-blue-600 hover:underline truncate"
                  >
                    <Globe className="h-3 w-3 shrink-0" />
                    {url}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* 배포 매체 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-400 uppercase tracking-wide">
                배포 매체 ({entry.outlets.length})
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-[11px] px-2"
                onClick={() => onAddOutlet(entry.id)}
              >
                <Plus className="h-2.5 w-2.5 mr-1" />
                매체 추가
              </Button>
            </div>
            {entry.outlets.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {entry.outlets.map((outlet) => (
                  <OutletTag
                    key={outlet.id}
                    outlet={outlet}
                    onToggle={() => onToggleOutlet(entry.id, outlet.id)}
                    onDelete={() => onDeleteOutlet(entry.id, outlet.id)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-gray-400">
                아직 배포 매체가 없습니다
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export function MediaPressKitCard({
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
    changeStatus,
    addOutlet,
    toggleOutletPublished,
    deleteOutlet,
    stats,
  } = useMediaPressKit(groupId, projectId);

  // 보도자료 추가/수정 다이얼로그
  const [showEntryDialog, setShowEntryDialog] = useState(false);
  const [editTarget, setEditTarget] = useState<MediaPressKitEntry | null>(null);
  const [entryForm, setEntryForm] = useState<
    AddMediaPressKitInput & { attachmentInput: string }
  >(EMPTY_ENTRY_FORM);
  const [savingEntry, setSavingEntry] = useState(false);

  // 매체 추가 다이얼로그
  const [outletEntryId, setOutletEntryId] = useState<string | null>(null);
  const [outletForm, setOutletForm] = useState<AddOutletInput>(EMPTY_OUTLET_FORM);
  const [savingOutlet, setSavingOutlet] = useState(false);

  // ── 보도자료 폼 열기 ──
  function handleOpenAdd() {
    setEditTarget(null);
    setEntryForm(EMPTY_ENTRY_FORM);
    setShowEntryDialog(true);
  }

  function handleOpenEdit(entry: MediaPressKitEntry) {
    setEditTarget(entry);
    setEntryForm({
      title: entry.title,
      writtenAt: entry.writtenAt,
      content: entry.content,
      contactName: entry.contactName,
      contactEmail: entry.contactEmail ?? "",
      contactPhone: entry.contactPhone ?? "",
      attachmentUrls: entry.attachmentUrls,
      attachmentInput: "",
    });
    setShowEntryDialog(true);
  }

  // ── 첨부 URL 추가 ──
  function handleAddAttachment() {
    const url = entryForm.attachmentInput.trim();
    if (!url) return;
    setEntryForm((prev) => ({
      ...prev,
      attachmentUrls: [...(prev.attachmentUrls ?? []), url],
      attachmentInput: "",
    }));
  }

  function handleRemoveAttachment(idx: number) {
    setEntryForm((prev) => ({
      ...prev,
      attachmentUrls: (prev.attachmentUrls ?? []).filter((_, i) => i !== idx),
    }));
  }

  // ── 보도자료 저장 ──
  async function handleSaveEntry() {
    setSavingEntry(true);
    const payload: AddMediaPressKitInput = {
      title: entryForm.title,
      writtenAt: entryForm.writtenAt,
      content: entryForm.content,
      contactName: entryForm.contactName,
      contactEmail: entryForm.contactEmail || undefined,
      contactPhone: entryForm.contactPhone || undefined,
      attachmentUrls: entryForm.attachmentUrls,
    };

    let ok: boolean;
    if (editTarget) {
      ok = await updateEntry(editTarget.id, payload);
    } else {
      ok = await addEntry(payload);
    }

    if (ok) {
      setShowEntryDialog(false);
      setEditTarget(null);
    }
    setSavingEntry(false);
  }

  // ── 매체 추가 ──
  function handleOpenAddOutlet(entryId: string) {
    setOutletEntryId(entryId);
    setOutletForm(EMPTY_OUTLET_FORM);
  }

  async function handleSaveOutlet() {
    if (!outletEntryId) return;
    setSavingOutlet(true);
    const ok = await addOutlet(outletEntryId, outletForm);
    if (ok) setOutletEntryId(null);
    setSavingOutlet(false);
  }

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
              <Newspaper className="h-4 w-4 text-indigo-500" />
              미디어 보도 자료
            </CardTitle>
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={handleOpenAdd}
            >
              <Plus className="h-3 w-3 mr-1" />
              보도자료 추가
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 요약 통계 */}
          {entries.length > 0 && (
            <div className="grid grid-cols-4 gap-2 p-3 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-0.5">전체</div>
                <div className="text-sm font-bold tabular-nums">{stats.total}</div>
              </div>
              <div className="text-center border-l border-gray-200">
                <div className="text-xs text-gray-500 mb-0.5">작성중</div>
                <div className="text-sm font-bold tabular-nums text-gray-600">
                  {stats.draft}
                </div>
              </div>
              <div className="text-center border-l border-gray-200">
                <div className="text-xs text-gray-500 mb-0.5">검토중</div>
                <div className="text-sm font-bold tabular-nums text-yellow-600">
                  {stats.review}
                </div>
              </div>
              <div className="text-center border-l border-gray-200">
                <div className="text-xs text-gray-500 mb-0.5">배포완료</div>
                <div className="text-sm font-bold tabular-nums text-green-600">
                  {stats.published}
                </div>
              </div>
            </div>
          )}

          {/* 매체 게재 현황 */}
          {stats.totalOutlets > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 rounded-lg">
              <Send className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
              <span className="text-xs text-indigo-700">
                총 {stats.totalOutlets}개 매체 중{" "}
                <span className="font-semibold">{stats.publishedOutlets}개</span>{" "}
                게재 완료
              </span>
            </div>
          )}

          {/* 보도자료 목록 */}
          {entries.length > 0 ? (
            <div className="space-y-2">
              {entries.map((entry) => (
                <EntryRow
                  key={entry.id}
                  entry={entry}
                  onEdit={handleOpenEdit}
                  onDelete={deleteEntry}
                  onStatusChange={changeStatus}
                  onAddOutlet={handleOpenAddOutlet}
                  onToggleOutlet={toggleOutletPublished}
                  onDeleteOutlet={deleteOutlet}
                />
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-sm text-gray-400">
              <Newspaper className="h-8 w-8 mx-auto mb-2 text-gray-200" />
              <p>등록된 보도자료가 없습니다</p>
              <p className="text-xs mt-1">보도자료 추가 버튼으로 시작하세요</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 보도자료 추가/수정 다이얼로그 */}
      <Dialog
        open={showEntryDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowEntryDialog(false);
            setEditTarget(null);
          }
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              {editTarget ? "보도자료 수정" : "보도자료 추가"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {/* 제목 */}
            <div className="space-y-1">
              <Label className="text-xs">제목 *</Label>
              <Input
                value={entryForm.title}
                onChange={(e) =>
                  setEntryForm((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="보도자료 제목"
                className="h-8 text-sm"
              />
            </div>

            {/* 작성일 */}
            <div className="space-y-1">
              <Label className="text-xs">작성일 *</Label>
              <Input
                type="date"
                value={entryForm.writtenAt}
                onChange={(e) =>
                  setEntryForm((prev) => ({ ...prev, writtenAt: e.target.value }))
                }
                className="h-8 text-sm"
              />
            </div>

            {/* 내용 */}
            <div className="space-y-1">
              <Label className="text-xs">내용 *</Label>
              <Textarea
                value={entryForm.content}
                onChange={(e) =>
                  setEntryForm((prev) => ({ ...prev, content: e.target.value }))
                }
                placeholder="보도자료 내용을 입력하세요"
                rows={5}
                className="text-sm resize-none"
              />
            </div>

            {/* 홍보 담당자 */}
            <div className="space-y-1">
              <Label className="text-xs">홍보 담당자 *</Label>
              <Input
                value={entryForm.contactName}
                onChange={(e) =>
                  setEntryForm((prev) => ({
                    ...prev,
                    contactName: e.target.value,
                  }))
                }
                placeholder="담당자 이름"
                className="h-8 text-sm"
              />
            </div>

            {/* 이메일 / 전화 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">이메일 (선택)</Label>
                <Input
                  type="email"
                  value={entryForm.contactEmail}
                  onChange={(e) =>
                    setEntryForm((prev) => ({
                      ...prev,
                      contactEmail: e.target.value,
                    }))
                  }
                  placeholder="example@email.com"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">연락처 (선택)</Label>
                <Input
                  type="tel"
                  value={entryForm.contactPhone}
                  onChange={(e) =>
                    setEntryForm((prev) => ({
                      ...prev,
                      contactPhone: e.target.value,
                    }))
                  }
                  placeholder="010-0000-0000"
                  className="h-8 text-sm"
                />
              </div>
            </div>

            {/* 첨부파일 URL */}
            <div className="space-y-1">
              <Label className="text-xs">첨부파일 URL (선택)</Label>
              <div className="flex gap-2">
                <Input
                  value={entryForm.attachmentInput}
                  onChange={(e) =>
                    setEntryForm((prev) => ({
                      ...prev,
                      attachmentInput: e.target.value,
                    }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddAttachment();
                    }
                  }}
                  placeholder="https://..."
                  className="h-8 text-sm flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={handleAddAttachment}
                >
                  추가
                </Button>
              </div>
              {(entryForm.attachmentUrls ?? []).length > 0 && (
                <div className="space-y-1 mt-1">
                  {(entryForm.attachmentUrls ?? []).map((url, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 bg-gray-50 rounded px-2 py-1"
                    >
                      <Globe className="h-3 w-3 text-gray-400 shrink-0" />
                      <span className="text-[11px] text-gray-600 truncate flex-1">
                        {url}
                      </span>
                      <button
                        onClick={() => handleRemoveAttachment(idx)}
                        className="text-gray-300 hover:text-red-400"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                setShowEntryDialog(false);
                setEditTarget(null);
              }}
              disabled={savingEntry}
            >
              취소
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={handleSaveEntry}
              disabled={
                savingEntry ||
                !entryForm.title.trim() ||
                !entryForm.writtenAt ||
                !entryForm.content.trim() ||
                !entryForm.contactName.trim()
              }
            >
              {savingEntry ? "저장 중..." : editTarget ? "수정" : "추가"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 매체 추가 다이얼로그 */}
      <Dialog
        open={outletEntryId !== null}
        onOpenChange={(open) => {
          if (!open) setOutletEntryId(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              배포 매체 추가
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {/* 매체명 */}
            <div className="space-y-1">
              <Label className="text-xs">매체명 *</Label>
              <Input
                value={outletForm.name}
                onChange={(e) =>
                  setOutletForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="매체 이름"
                className="h-8 text-sm"
              />
            </div>

            {/* 유형 */}
            <div className="space-y-1">
              <Label className="text-xs">유형</Label>
              <Select
                value={outletForm.type}
                onValueChange={(v) =>
                  setOutletForm((prev) => ({
                    ...prev,
                    type: v as MediaPressKitOutletType,
                  }))
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.entries(OUTLET_TYPE_CONFIG) as [
                      MediaPressKitOutletType,
                      { label: string; color: string },
                    ][]
                  ).map(([key, conf]) => (
                    <SelectItem key={key} value={key} className="text-xs">
                      {conf.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 담당자 / 이메일 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">담당자 (선택)</Label>
                <Input
                  value={outletForm.contactName ?? ""}
                  onChange={(e) =>
                    setOutletForm((prev) => ({
                      ...prev,
                      contactName: e.target.value,
                    }))
                  }
                  placeholder="기자 이름"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">이메일 (선택)</Label>
                <Input
                  type="email"
                  value={outletForm.contactEmail ?? ""}
                  onChange={(e) =>
                    setOutletForm((prev) => ({
                      ...prev,
                      contactEmail: e.target.value,
                    }))
                  }
                  placeholder="press@media.com"
                  className="h-8 text-sm"
                />
              </div>
            </div>

            {/* 메모 */}
            <div className="space-y-1">
              <Label className="text-xs">메모 (선택)</Label>
              <Input
                value={outletForm.note ?? ""}
                onChange={(e) =>
                  setOutletForm((prev) => ({ ...prev, note: e.target.value }))
                }
                placeholder="배포 관련 메모"
                className="h-8 text-sm"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setOutletEntryId(null)}
              disabled={savingOutlet}
            >
              취소
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={handleSaveOutlet}
              disabled={savingOutlet || !outletForm.name.trim()}
            >
              {savingOutlet ? "저장 중..." : "추가"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
