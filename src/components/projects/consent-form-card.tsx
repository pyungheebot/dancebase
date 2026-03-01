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
import { Progress } from "@/components/ui/progress";
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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Pencil,
  FileSignature,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useConsentForm } from "@/hooks/use-consent-form";
import { useDeleteConfirm } from "@/hooks/use-delete-confirm";
import type { ConsentFormItem, ConsentFormType, ConsentFormStatus } from "@/types";

// ============================================================
// 상수 & 레이블
// ============================================================

const FORM_TYPE_LABELS: Record<ConsentFormType, string> = {
  performance: "공연 출연",
  photo: "사진 촬영",
  video: "영상 촬영",
  medical: "의료 정보",
  liability: "면책 동의",
  other: "기타",
};

const FORM_TYPE_COLORS: Record<ConsentFormType, string> = {
  performance: "bg-purple-100 text-purple-700 border-purple-200",
  photo: "bg-pink-100 text-pink-700 border-pink-200",
  video: "bg-blue-100 text-blue-700 border-blue-200",
  medical: "bg-red-100 text-red-700 border-red-200",
  liability: "bg-orange-100 text-orange-700 border-orange-200",
  other: "bg-gray-100 text-gray-700 border-gray-200",
};

const STATUS_LABELS: Record<ConsentFormStatus, string> = {
  pending: "대기",
  signed: "서명",
  declined: "거부",
};

const STATUS_COLORS: Record<ConsentFormStatus, string> = {
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  signed: "bg-green-100 text-green-700 border-green-200",
  declined: "bg-red-100 text-red-700 border-red-200",
};

const FORM_TYPES: ConsentFormType[] = [
  "performance",
  "photo",
  "video",
  "medical",
  "liability",
  "other",
];

// ============================================================
// 항목 추가/수정 다이얼로그
// ============================================================

interface ItemFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (params: {
    memberName: string;
    formType: ConsentFormType;
    notes?: string;
  }) => void;
  editItem?: ConsentFormItem | null;
}

function ItemFormDialog({
  open,
  onClose,
  onSubmit,
  editItem,
}: ItemFormDialogProps) {
  const [memberName, setMemberName] = useState(editItem?.memberName ?? "");
  const [formType, setFormType] = useState<ConsentFormType>(
    editItem?.formType ?? "performance"
  );
  const [notes, setNotes] = useState(editItem?.notes ?? "");

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setMemberName(editItem?.memberName ?? "");
      setFormType(editItem?.formType ?? "performance");
      setNotes(editItem?.notes ?? "");
    } else {
      onClose();
    }
  };

  const handleSubmit = () => {
    if (!memberName.trim()) {
      toast.error(TOAST.CONSENT.MEMBER_NAME_REQUIRED);
      return;
    }
    onSubmit({
      memberName: memberName.trim(),
      formType,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {editItem ? "동의서 항목 수정" : "동의서 항목 추가"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {/* 멤버 이름 */}
          <div className="space-y-1">
            <Label className="text-xs">
              멤버 이름 <span className="text-red-500">*</span>
            </Label>
            <Input
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              placeholder="멤버 이름을 입력하세요"
              className="h-8 text-xs"
            />
          </div>

          {/* 동의서 유형 */}
          <div className="space-y-1">
            <Label className="text-xs">동의서 유형</Label>
            <Select
              value={formType}
              onValueChange={(v) => setFormType(v as ConsentFormType)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORM_TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">
                    {FORM_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 비고 */}
          <div className="space-y-1">
            <Label className="text-xs">비고</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="추가 메모 (선택)"
              className="text-xs min-h-[56px] resize-none"
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
            {editItem ? "수정" : "추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 일괄 생성 다이얼로그
// ============================================================

interface BulkCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (memberNames: string[], formType: ConsentFormType) => void;
}

function BulkCreateDialog({ open, onClose, onSubmit }: BulkCreateDialogProps) {
  const [formType, setFormType] = useState<ConsentFormType>("performance");
  const [membersText, setMembersText] = useState("");

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setFormType("performance");
      setMembersText("");
    } else {
      onClose();
    }
  };

  const handleSubmit = () => {
    const names = membersText
      .split("\n")
      .map((n) => n.trim())
      .filter((n) => n.length > 0);
    if (names.length === 0) {
      toast.error(TOAST.CONSENT.BATCH_MEMBER_FORMAT);
      return;
    }
    onSubmit(names, formType);
    onClose();
  };

  const previewCount = membersText
    .split("\n")
    .map((n) => n.trim())
    .filter((n) => n.length > 0).length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            동의서 일괄 생성
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {/* 동의서 유형 */}
          <div className="space-y-1">
            <Label className="text-xs">동의서 유형</Label>
            <Select
              value={formType}
              onValueChange={(v) => setFormType(v as ConsentFormType)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORM_TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">
                    {FORM_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 멤버 목록 */}
          <div className="space-y-1">
            <Label className="text-xs">
              멤버 목록{" "}
              <span className="text-gray-400">(한 줄에 한 명)</span>
            </Label>
            <Textarea
              value={membersText}
              onChange={(e) => setMembersText(e.target.value)}
              placeholder={"홍길동\n김철수\n이영희"}
              className="text-xs min-h-[100px] resize-none font-mono"
            />
            {previewCount > 0 && (
              <p className="text-[10px] text-gray-500">
                {previewCount}명 입력됨
              </p>
            )}
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
            {previewCount > 0 ? `${previewCount}명 생성` : "생성"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 항목 행 컴포넌트
// ============================================================

interface ItemRowProps {
  item: ConsentFormItem;
  onSign: (itemId: string) => void;
  onDecline: (itemId: string) => void;
  onEdit: (item: ConsentFormItem) => void;
  onDelete: (itemId: string) => void;
}

function ItemRow({ item, onSign, onDecline, onEdit, onDelete }: ItemRowProps) {
  const statusIcon = {
    pending: <Clock className="h-3.5 w-3.5 text-yellow-500" />,
    signed: <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />,
    declined: <XCircle className="h-3.5 w-3.5 text-red-500" />,
  }[item.status];

  return (
    <div
      className={`flex items-center gap-2 p-2 rounded-lg border text-xs transition-colors ${
        item.status === "signed"
          ? "bg-green-50 border-green-100"
          : item.status === "declined"
          ? "bg-red-50 border-red-100"
          : "bg-card border-gray-100"
      }`}
    >
      {/* 상태 아이콘 */}
      <div className="flex-shrink-0">{statusIcon}</div>

      {/* 멤버명 + 유형 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-medium truncate">{item.memberName}</span>
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 ${FORM_TYPE_COLORS[item.formType]}`}
          >
            {FORM_TYPE_LABELS[item.formType]}
          </Badge>
        </div>
        {(item.signedAt || item.notes) && (
          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-400 flex-wrap">
            {item.signedAt && (
              <span>
                서명:{" "}
                {new Date(item.signedAt).toLocaleString("ko-KR", {
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
            {item.notes && (
              <span className="italic truncate max-w-[160px]">{item.notes}</span>
            )}
          </div>
        )}
      </div>

      {/* 상태 배지 */}
      <Badge
        variant="outline"
        className={`text-[10px] px-1.5 py-0 flex-shrink-0 ${STATUS_COLORS[item.status]}`}
      >
        {STATUS_LABELS[item.status]}
      </Badge>

      {/* 서명/거부 버튼 (대기 상태에서만) */}
      {item.status === "pending" && (
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-1.5 text-[10px] text-green-600 hover:text-green-700 hover:bg-green-50"
            onClick={() => onSign(item.id)}
          >
            서명
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-1.5 text-[10px] text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={() => onDecline(item.id)}
          >
            거부
          </Button>
        </div>
      )}
      {item.status === "declined" && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-1.5 text-[10px] text-gray-500 hover:text-gray-700 flex-shrink-0"
          onClick={() => onSign(item.id)}
        >
          서명 처리
        </Button>
      )}

      {/* 편집/삭제 버튼 */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => onEdit(item)}
        >
          <Pencil className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-red-400 hover:text-red-600"
          onClick={() => onDelete(item.id)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// 메인 카드 컴포넌트
// ============================================================

interface ConsentFormCardProps {
  projectId: string;
}

export function ConsentFormCard({ projectId }: ConsentFormCardProps) {
  const {
    items,
    loading,
    addItem,
    updateItem,
    deleteItem,
    signItem,
    declineItem,
    bulkCreate,
    totalItems,
    signedCount,
    pendingCount,
    declinedCount,
    completionRate,
  } = useConsentForm(projectId);

  const [open, setOpen] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<ConsentFormItem | null>(null);
  const deleteConfirm = useDeleteConfirm<string>();
  const [filterStatus, setFilterStatus] = useState<ConsentFormStatus | "all">("all");

  const filteredItems = filterStatus === "all"
    ? items
    : items.filter((i) => i.status === filterStatus);

  // 추가 핸들러
  const handleAdd = (params: {
    memberName: string;
    formType: ConsentFormType;
    notes?: string;
  }) => {
    addItem(params);
    toast.success(TOAST.CONSENT.ITEM_ADDED);
  };

  // 수정 핸들러
  const handleEdit = (params: {
    memberName: string;
    formType: ConsentFormType;
    notes?: string;
  }) => {
    if (!editItem) return;
    const ok = updateItem(editItem.id, {
      memberName: params.memberName,
      formType: params.formType,
      notes: params.notes ?? null,
    });
    if (ok) {
      toast.success(TOAST.CONSENT.ITEM_UPDATED);
    } else {
      toast.error(TOAST.UPDATE_ERROR);
    }
    setEditItem(null);
  };

  // 서명 핸들러
  const handleSign = (itemId: string) => {
    const ok = signItem(itemId);
    if (ok) {
      toast.success(TOAST.CONSENT.SIGNED);
    } else {
      toast.error(TOAST.CONSENT.SIGN_ERROR);
    }
  };

  // 거부 핸들러
  const handleDecline = (itemId: string) => {
    const ok = declineItem(itemId);
    if (ok) {
      toast.success(TOAST.CONSENT.REJECTED);
    } else {
      toast.error(TOAST.CONSENT.REJECT_ERROR);
    }
  };

  // 삭제 핸들러
  const handleDelete = () => {
    const id = deleteConfirm.confirm();
    if (!id) return;
    const ok = deleteItem(id);
    if (ok) {
      toast.success(TOAST.ITEM_DELETED);
    } else {
      toast.error(TOAST.DELETE_ERROR);
    }
  };

  // 일괄 생성 핸들러
  const handleBulkCreate = (memberNames: string[], formType: ConsentFormType) => {
    const count = bulkCreate(memberNames, formType);
    if (count > 0) {
      toast.success(`${count}명의 동의서 항목이 생성되었습니다.`);
    } else {
      toast.error(TOAST.CONSENT.NO_ITEMS);
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <FileSignature className="h-4 w-4 text-indigo-500" />
            출연 동의서 관리
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="text-xs text-gray-400">불러오는 중...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="w-full">
        <Collapsible open={open} onOpenChange={setOpen}>
          <CardHeader className="pb-2 pt-3 px-4">
            <div className="flex items-center justify-between">
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-2 hover:opacity-70 transition-opacity">
                  <FileSignature className="h-4 w-4 text-indigo-500" />
                  <CardTitle className="text-sm font-semibold">
                    출연 동의서 관리
                  </CardTitle>
                  {open ? (
                    <ChevronUp className="h-3.5 w-3.5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                  )}
                </button>
              </CollapsibleTrigger>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setBulkDialogOpen(true)}
                >
                  <Users className="h-3 w-3 mr-1" />
                  일괄 생성
                </Button>
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setAddDialogOpen(true)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  추가
                </Button>
              </div>
            </div>

            {/* 진행률 */}
            {totalItems > 0 && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between text-[10px] text-gray-500">
                  <span>
                    서명 완료 {signedCount}/{totalItems}
                    {pendingCount > 0 && (
                      <span className="text-yellow-600 ml-1.5">
                        대기 {pendingCount}
                      </span>
                    )}
                    {declinedCount > 0 && (
                      <span className="text-red-500 ml-1.5">
                        거부 {declinedCount}
                      </span>
                    )}
                  </span>
                  <span className="font-semibold">{completionRate}%</span>
                </div>
                <Progress value={completionRate} className="h-1.5" />
              </div>
            )}
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="px-4 pb-3 space-y-3">
              {/* 필터 */}
              {totalItems > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(["all", "pending", "signed", "declined"] as const).map(
                    (s) => {
                      const label =
                        s === "all"
                          ? "전체"
                          : STATUS_LABELS[s as ConsentFormStatus];
                      const count =
                        s === "all"
                          ? totalItems
                          : s === "pending"
                          ? pendingCount
                          : s === "signed"
                          ? signedCount
                          : declinedCount;
                      return (
                        <button
                          key={s}
                          onClick={() => setFilterStatus(s)}
                          className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                            filterStatus === s
                              ? "bg-indigo-100 text-indigo-700 border-indigo-300 font-semibold"
                              : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                          }`}
                        >
                          {label} {count}
                        </button>
                      );
                    }
                  )}
                </div>
              )}

              {/* 빈 상태 */}
              {totalItems === 0 && (
                <div className="text-center py-8 text-xs text-gray-400 space-y-2">
                  <FileSignature className="h-8 w-8 mx-auto text-gray-200" />
                  <p>등록된 동의서 항목이 없습니다.</p>
                  <p className="text-[10px]">
                    일괄 생성으로 멤버별 동의서를 한 번에 만들 수 있습니다.
                  </p>
                </div>
              )}

              {/* 항목 목록 */}
              {filteredItems.length > 0 && (
                <div className="space-y-1.5">
                  {filteredItems.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      onSign={handleSign}
                      onDecline={handleDecline}
                      onEdit={(i) => setEditItem(i)}
                      onDelete={(id) => deleteConfirm.request(id)}
                    />
                  ))}
                </div>
              )}

              {/* 필터 결과 없음 */}
              {totalItems > 0 && filteredItems.length === 0 && (
                <div className="text-center py-4 text-xs text-gray-400">
                  해당 상태의 항목이 없습니다.
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* 항목 추가 다이얼로그 */}
      <ItemFormDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onSubmit={handleAdd}
      />

      {/* 항목 수정 다이얼로그 */}
      <ItemFormDialog
        open={editItem !== null}
        onClose={() => setEditItem(null)}
        onSubmit={handleEdit}
        editItem={editItem}
      />

      {/* 일괄 생성 다이얼로그 */}
      <BulkCreateDialog
        open={bulkDialogOpen}
        onClose={() => setBulkDialogOpen(false)}
        onSubmit={handleBulkCreate}
      />

      {/* 삭제 확인 다이얼로그 */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={deleteConfirm.onOpenChange}
        title="항목 삭제"
        description="이 동의서 항목을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        onConfirm={handleDelete}
        destructive
      />
    </>
  );
}
