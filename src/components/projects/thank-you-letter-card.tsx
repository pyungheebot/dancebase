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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mail,
  Plus,
  Trash2,
  Pencil,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  Phone,
  User,
  Heart,
  Send,
  RotateCcw,
} from "lucide-react";
import {
  useThankYouLetter,
  type AddThankYouLetterInput,
} from "@/hooks/use-thank-you-letter";
import type {
  ThankYouLetterEntry,
  ThankYouLetterSponsorType,
  ThankYouLetterStatus,
} from "@/types";

// ============================================================
// 상수
// ============================================================

const STATUS_CONFIG: Record<
  ThankYouLetterStatus,
  { label: string; color: string }
> = {
  draft: {
    label: "작성중",
    color: "bg-gray-100 text-gray-600 border-gray-200",
  },
  sent: {
    label: "발송완료",
    color: "bg-green-100 text-green-700 border-green-200",
  },
};

const SPONSOR_TYPE_CONFIG: Record<
  ThankYouLetterSponsorType,
  { label: string; color: string }
> = {
  money: {
    label: "금전",
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  goods: {
    label: "물품",
    color: "bg-orange-100 text-orange-700 border-orange-200",
  },
  venue: {
    label: "장소",
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
  service: {
    label: "서비스",
    color: "bg-purple-100 text-purple-700 border-purple-200",
  },
};

// ============================================================
// 빈 폼 초기값
// ============================================================

const EMPTY_FORM: AddThankYouLetterInput = {
  sponsorName: "",
  sponsorType: "money",
  sponsorDetail: "",
  letterContent: "",
  managerName: "",
  sponsorContact: "",
  sponsorEmail: "",
  note: "",
};

// ============================================================
// 서브 컴포넌트: 날짜 입력 다이얼로그
// ============================================================

function SentDateDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (date: string) => void;
}) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            발송 날짜 선택
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label className="text-xs">발송 날짜</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onOpenChange(false)}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={() => {
              onConfirm(date);
              onOpenChange(false);
            }}
            disabled={!date}
          >
            확인
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 서브 컴포넌트: 편지 행
// ============================================================

function LetterRow({
  entry,
  onEdit,
  onDelete,
  onMarkSent,
  onMarkDraft,
}: {
  entry: ThankYouLetterEntry;
  onEdit: (e: ThankYouLetterEntry) => void;
  onDelete: (id: string) => void;
  onMarkSent: (id: string) => void;
  onMarkDraft: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const statusConf = STATUS_CONFIG[entry.status];
  const typeConf = SPONSOR_TYPE_CONFIG[entry.sponsorType];

  return (
    <div className="rounded-lg border border-gray-100 bg-card overflow-hidden">
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
              {entry.status === "sent" ? (
                <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
              ) : (
                <Circle className="h-2.5 w-2.5 mr-0.5" />
              )}
              {statusConf.label}
            </Badge>
            <Badge className={`text-[10px] px-1.5 py-0 ${typeConf.color}`}>
              {typeConf.label}
            </Badge>
            <span className="text-xs font-medium text-gray-800 truncate">
              {entry.sponsorName}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="flex items-center gap-1 text-[11px] text-gray-500">
              <User className="h-3 w-3" />
              {entry.managerName}
            </span>
            {entry.sponsorDetail && (
              <span className="text-[11px] text-gray-400 truncate max-w-[120px]">
                {entry.sponsorDetail}
              </span>
            )}
            {entry.sentAt && (
              <span className="flex items-center gap-1 text-[11px] text-green-600">
                <Send className="h-3 w-3" />
                {entry.sentAt}
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
            <DropdownMenuItem
              onClick={() => onEdit(entry)}
              className="text-xs"
            >
              <Pencil className="h-3 w-3 mr-2" />
              수정
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {entry.status === "draft" ? (
              <DropdownMenuItem
                className="text-xs"
                onClick={() => onMarkSent(entry.id)}
              >
                <CheckCircle2 className="h-3 w-3 mr-2 text-green-500" />
                발송 완료 처리
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                className="text-xs"
                onClick={() => onMarkDraft(entry.id)}
              >
                <RotateCcw className="h-3 w-3 mr-2 text-gray-400" />
                작성중으로 되돌리기
              </DropdownMenuItem>
            )}
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
          {/* 편지 내용 */}
          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 uppercase tracking-wide">
              편지 내용
            </span>
            <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 rounded p-2">
              {entry.letterContent}
            </p>
          </div>

          {/* 후원사 연락처 */}
          <div className="flex flex-wrap gap-3">
            {entry.sponsorEmail && (
              <span className="flex items-center gap-1 text-[11px] text-gray-600">
                <Mail className="h-3 w-3 text-gray-400" />
                {entry.sponsorEmail}
              </span>
            )}
            {entry.sponsorContact && (
              <span className="flex items-center gap-1 text-[11px] text-gray-600">
                <Phone className="h-3 w-3 text-gray-400" />
                {entry.sponsorContact}
              </span>
            )}
          </div>

          {/* 비고 */}
          {entry.note && (
            <div className="space-y-1">
              <span className="text-[10px] text-gray-400 uppercase tracking-wide">
                비고
              </span>
              <p className="text-xs text-gray-600">{entry.note}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export function ThankYouLetterCard({
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
    markAsSent,
    markAsDraft,
    stats,
  } = useThankYouLetter(groupId, projectId);

  // 편지 추가/수정 다이얼로그
  const [showDialog, setShowDialog] = useState(false);
  const [editTarget, setEditTarget] = useState<ThankYouLetterEntry | null>(null);
  const [form, setForm] = useState<AddThankYouLetterInput>(EMPTY_FORM);
  const { pending: saving, execute } = useAsyncAction();

  // 발송 날짜 다이얼로그
  const [sentTargetId, setSentTargetId] = useState<string | null>(null);

  // ── 폼 열기 ──
  function handleOpenAdd() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setShowDialog(true);
  }

  function handleOpenEdit(entry: ThankYouLetterEntry) {
    setEditTarget(entry);
    setForm({
      sponsorName: entry.sponsorName,
      sponsorType: entry.sponsorType,
      sponsorDetail: entry.sponsorDetail ?? "",
      letterContent: entry.letterContent,
      managerName: entry.managerName,
      sponsorContact: entry.sponsorContact ?? "",
      sponsorEmail: entry.sponsorEmail ?? "",
      note: entry.note ?? "",
    });
    setShowDialog(true);
  }

  // ── 저장 ──
  async function handleSave() {
    await execute(async () => {
      const payload: AddThankYouLetterInput = {
        sponsorName: form.sponsorName,
        sponsorType: form.sponsorType,
        sponsorDetail: form.sponsorDetail || undefined,
        letterContent: form.letterContent,
        managerName: form.managerName,
        sponsorContact: form.sponsorContact || undefined,
        sponsorEmail: form.sponsorEmail || undefined,
        note: form.note || undefined,
      };

      let ok: boolean;
      if (editTarget) {
        ok = await updateEntry(editTarget.id, payload);
      } else {
        ok = await addEntry(payload);
      }

      if (ok) {
        setShowDialog(false);
        setEditTarget(null);
      }
    });
  }

  // ── 발송 완료 처리 ──
  function handleMarkSent(id: string) {
    setSentTargetId(id);
  }

  async function handleConfirmSent(date: string) {
    if (!sentTargetId) return;
    await markAsSent(sentTargetId, date);
    setSentTargetId(null);
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
              <Heart className="h-4 w-4 text-pink-500" />
              후원 감사편지
            </CardTitle>
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={handleOpenAdd}
            >
              <Plus className="h-3 w-3 mr-1" />
              편지 추가
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 요약 통계 */}
          {entries.length > 0 && (
            <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-0.5">전체</div>
                <div className="text-sm font-bold tabular-nums">
                  {stats.total}
                </div>
              </div>
              <div className="text-center border-l border-gray-200">
                <div className="text-xs text-gray-500 mb-0.5">작성중</div>
                <div className="text-sm font-bold tabular-nums text-gray-600">
                  {stats.draft}
                </div>
              </div>
              <div className="text-center border-l border-gray-200">
                <div className="text-xs text-gray-500 mb-0.5">발송완료</div>
                <div className="text-sm font-bold tabular-nums text-green-600">
                  {stats.sent}
                </div>
              </div>
            </div>
          )}

          {/* 발송 진행 현황 */}
          {entries.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-pink-50 rounded-lg">
              <Send className="h-3.5 w-3.5 text-pink-400 shrink-0" />
              <span className="text-xs text-pink-700">
                총 {stats.total}건 중{" "}
                <span className="font-semibold">{stats.sent}건</span> 발송 완료
              </span>
            </div>
          )}

          {/* 후원 유형 분포 */}
          {entries.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {(
                Object.entries(SPONSOR_TYPE_CONFIG) as [
                  ThankYouLetterSponsorType,
                  { label: string; color: string },
                ][]
              )
                .filter(([key]) => stats.byType[key] > 0)
                .map(([key, conf]) => (
                  <span
                    key={key}
                    className={`text-[10px] px-1.5 py-0.5 rounded border ${conf.color}`}
                  >
                    {conf.label} {stats.byType[key]}
                  </span>
                ))}
            </div>
          )}

          {/* 편지 목록 */}
          {entries.length > 0 ? (
            <div className="space-y-2">
              {entries.map((entry) => (
                <LetterRow
                  key={entry.id}
                  entry={entry}
                  onEdit={handleOpenEdit}
                  onDelete={deleteEntry}
                  onMarkSent={handleMarkSent}
                  onMarkDraft={markAsDraft}
                />
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-sm text-gray-400">
              <Heart className="h-8 w-8 mx-auto mb-2 text-gray-200" />
              <p>등록된 감사편지가 없습니다</p>
              <p className="text-xs mt-1">편지 추가 버튼으로 시작하세요</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 편지 추가/수정 다이얼로그 */}
      <Dialog
        open={showDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowDialog(false);
            setEditTarget(null);
          }
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              {editTarget ? "감사편지 수정" : "감사편지 추가"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {/* 후원사명 */}
            <div className="space-y-1">
              <Label className="text-xs">후원사명 *</Label>
              <Input
                value={form.sponsorName}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, sponsorName: e.target.value }))
                }
                placeholder="후원사 또는 후원자 이름"
                className="h-8 text-sm"
              />
            </div>

            {/* 후원 유형 */}
            <div className="space-y-1">
              <Label className="text-xs">후원 유형 *</Label>
              <Select
                value={form.sponsorType}
                onValueChange={(v) =>
                  setForm((prev) => ({
                    ...prev,
                    sponsorType: v as ThankYouLetterSponsorType,
                  }))
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.entries(SPONSOR_TYPE_CONFIG) as [
                      ThankYouLetterSponsorType,
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

            {/* 후원 내용 */}
            <div className="space-y-1">
              <Label className="text-xs">후원 내용 (선택)</Label>
              <Input
                value={form.sponsorDetail}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    sponsorDetail: e.target.value,
                  }))
                }
                placeholder="예: 100만원, 음향 장비, 공연장 대관 등"
                className="h-8 text-sm"
              />
            </div>

            {/* 편지 내용 */}
            <div className="space-y-1">
              <Label className="text-xs">감사편지 내용 *</Label>
              <Textarea
                value={form.letterContent}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    letterContent: e.target.value,
                  }))
                }
                placeholder="감사의 마음을 담은 편지 내용을 입력하세요"
                rows={6}
                className="text-sm resize-none"
              />
            </div>

            {/* 담당자 */}
            <div className="space-y-1">
              <Label className="text-xs">담당자 *</Label>
              <Input
                value={form.managerName}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    managerName: e.target.value,
                  }))
                }
                placeholder="편지 발송 담당자 이름"
                className="h-8 text-sm"
              />
            </div>

            {/* 이메일 / 연락처 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">후원사 이메일 (선택)</Label>
                <Input
                  type="email"
                  value={form.sponsorEmail}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      sponsorEmail: e.target.value,
                    }))
                  }
                  placeholder="example@email.com"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">후원사 연락처 (선택)</Label>
                <Input
                  type="tel"
                  value={form.sponsorContact}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      sponsorContact: e.target.value,
                    }))
                  }
                  placeholder="010-0000-0000"
                  className="h-8 text-sm"
                />
              </div>
            </div>

            {/* 비고 */}
            <div className="space-y-1">
              <Label className="text-xs">비고 (선택)</Label>
              <Input
                value={form.note}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, note: e.target.value }))
                }
                placeholder="추가 메모"
                className="h-8 text-sm"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                setShowDialog(false);
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
              disabled={
                saving ||
                !form.sponsorName.trim() ||
                !form.letterContent.trim() ||
                !form.managerName.trim()
              }
            >
              {saving ? "저장 중..." : editTarget ? "수정" : "추가"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 발송 날짜 선택 다이얼로그 */}
      <SentDateDialog
        open={sentTargetId !== null}
        onOpenChange={(open) => {
          if (!open) setSentTargetId(null);
        }}
        onConfirm={handleConfirmSent}
      />
    </>
  );
}
