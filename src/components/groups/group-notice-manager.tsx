"use client";

import { useState } from "react";
import {
  Megaphone,
  AlertTriangle,
  Info,
  Bell,
  Plus,
  Trash2,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useGroupNotices } from "@/hooks/use-group-notices";
import { formatYearMonthDay } from "@/lib/date-utils";
import { type GroupNotice, type NoticePriority } from "@/types";
import { toast } from "sonner";

type GroupNoticeManagerProps = {
  groupId: string;
  userId: string;
};

const PRIORITY_LABELS: Record<NoticePriority, string> = {
  urgent: "긴급",
  important: "중요",
  normal: "일반",
};

const PRIORITY_BADGE_CLASSES: Record<NoticePriority, string> = {
  urgent: "bg-red-100 text-red-700 border-red-200",
  important: "bg-orange-100 text-orange-700 border-orange-200",
  normal: "bg-blue-100 text-blue-700 border-blue-200",
};

const PRIORITY_ICONS: Record<NoticePriority, React.ComponentType<{ className?: string }>> = {
  urgent: AlertTriangle,
  important: Bell,
  normal: Info,
};

type NoticeFormState = {
  title: string;
  content: string;
  priority: NoticePriority;
  expiresAt: string;
};

const DEFAULT_FORM: NoticeFormState = {
  title: "",
  content: "",
  priority: "normal",
  expiresAt: "",
};

function NoticeForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  initial: NoticeFormState;
  onSubmit: (form: NoticeFormState) => void;
  onCancel: () => void;
  submitLabel: string;
}) {
  const [form, setForm] = useState<NoticeFormState>(initial);

  const handleSubmit = () => {
    if (!form.title.trim()) {
      toast.error("제목을 입력해주세요");
      return;
    }
    if (!form.content.trim()) {
      toast.error("내용을 입력해주세요");
      return;
    }
    onSubmit(form);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">제목</Label>
        <Input
          value={form.title}
          onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
          placeholder="공지 제목을 입력하세요"
          className="h-8 text-xs"
          maxLength={50}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">내용</Label>
        <Textarea
          value={form.content}
          onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
          placeholder="공지 내용을 입력하세요"
          className="text-xs min-h-[80px] resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label className="text-xs">우선순위</Label>
          <Select
            value={form.priority}
            onValueChange={(v) =>
              setForm((prev) => ({ ...prev, priority: v as NoticePriority }))
            }
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="urgent" className="text-xs">
                긴급
              </SelectItem>
              <SelectItem value="important" className="text-xs">
                중요
              </SelectItem>
              <SelectItem value="normal" className="text-xs">
                일반
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">만료일 (선택)</Label>
          <Input
            type="date"
            value={form.expiresAt}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, expiresAt: e.target.value }))
            }
            className="h-8 text-xs"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <Button
          size="sm"
          className="h-7 text-xs flex-1"
          onClick={handleSubmit}
          disabled={!form.title.trim() || !form.content.trim()}
        >
          {submitLabel}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={onCancel}
        >
          취소
        </Button>
      </div>
    </div>
  );
}

function NoticeItem({
  notice,
  onEdit,
  onDelete,
}: {
  notice: GroupNotice;
  onEdit: (notice: GroupNotice) => void;
  onDelete: (id: string) => void;
}) {
  const PriorityIcon = PRIORITY_ICONS[notice.priority];
  const isExpired =
    notice.expiresAt ? new Date(notice.expiresAt) < new Date() : false;

  return (
    <div
      className={`rounded-lg border p-2.5 space-y-1 ${
        isExpired ? "opacity-50 bg-muted/30" : "bg-background"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <PriorityIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <p className="text-xs font-medium truncate">{notice.title}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 ${PRIORITY_BADGE_CLASSES[notice.priority]}`}
          >
            {PRIORITY_LABELS[notice.priority]}
          </Badge>
          {isExpired && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 bg-gray-100 text-gray-500 border-gray-200"
            >
              만료됨
            </Badge>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={() => onEdit(notice)}
            aria-label="공지 수정"
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(notice.id)}
            aria-label="공지 삭제"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed pl-5">
        {notice.content}
      </p>
      {notice.expiresAt && (
        <p className="text-[10px] text-muted-foreground pl-5">
          만료: {formatYearMonthDay(notice.expiresAt)}
        </p>
      )}
    </div>
  );
}

export function GroupNoticeManager({ groupId, userId }: GroupNoticeManagerProps) {
  const { notices, addNotice, updateNotice, deleteNotice } = useGroupNotices(
    groupId,
    userId
  );
  const [open, setOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingNotice, setEditingNotice] = useState<GroupNotice | null>(null);

  const handleAdd = (form: NoticeFormState) => {
    addNotice(
      form.title,
      form.content,
      form.priority,
      form.expiresAt
        ? new Date(form.expiresAt + "T23:59:59").toISOString()
        : null
    );
    toast.success("공지가 등록되었습니다");
    setShowAddForm(false);
  };

  const handleUpdate = (form: NoticeFormState) => {
    if (!editingNotice) return;
    updateNotice(
      editingNotice.id,
      form.title,
      form.content,
      form.priority,
      form.expiresAt
        ? new Date(form.expiresAt + "T23:59:59").toISOString()
        : null
    );
    toast.success("공지가 수정되었습니다");
    setEditingNotice(null);
  };

  const handleDelete = (id: string) => {
    deleteNotice(id);
    toast.success("공지가 삭제되었습니다");
  };

  const handleEdit = (notice: GroupNotice) => {
    setShowAddForm(false);
    setEditingNotice(notice);
  };

  const getEditFormInitial = (notice: GroupNotice): NoticeFormState => ({
    title: notice.title,
    content: notice.content,
    priority: notice.priority,
    expiresAt: notice.expiresAt
      ? new Date(notice.expiresAt).toISOString().slice(0, 10)
      : "",
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
          <Megaphone className="h-3 w-3" />
          공지 관리
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-1.5">
            <Megaphone className="h-4 w-4" />
            그룹 공지 관리
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* 공지 목록 */}
          {notices.length > 0 ? (
            <div className="space-y-2">
              {notices.map((notice) =>
                editingNotice?.id === notice.id ? (
                  <div key={notice.id} className="rounded-lg border p-3 bg-muted/30">
                    <p className="text-xs font-medium mb-2">공지 수정</p>
                    <NoticeForm
                      initial={getEditFormInitial(notice)}
                      onSubmit={handleUpdate}
                      onCancel={() => setEditingNotice(null)}
                      submitLabel="수정 완료"
                    />
                  </div>
                ) : (
                  <NoticeItem
                    key={notice.id}
                    notice={notice}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                )
              )}
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-muted-foreground">
              등록된 공지가 없습니다
            </div>
          )}

          {/* 새 공지 추가 */}
          {showAddForm ? (
            <div className="rounded-lg border p-3 bg-muted/30">
              <p className="text-xs font-medium mb-2">새 공지 추가</p>
              <NoticeForm
                initial={DEFAULT_FORM}
                onSubmit={handleAdd}
                onCancel={() => setShowAddForm(false)}
                submitLabel="등록"
              />
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs w-full gap-1"
              onClick={() => {
                setEditingNotice(null);
                setShowAddForm(true);
              }}
            >
              <Plus className="h-3 w-3" />
              새 공지 추가
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
