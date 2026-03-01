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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  AlertTriangle,
  Bell,
  Zap,
  AlertCircle,
  MessageSquare,
  Pin,
  PinOff,
  Check,
  Trash2,
  Plus,
  Radio,
  UserCheck,
  Users,
  User,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useBackstageComm } from "@/hooks/use-backstage-comm";
import { useDeleteConfirm } from "@/hooks/use-delete-confirm";
import type {
  BackstageCommType,
  BackstageCommTargetScope,
  BackstageCommMessage,
} from "@/types";

// ============================================================
// 상수 & 레이블
// ============================================================

const TYPE_META: Record<
  BackstageCommType,
  {
    label: string;
    color: string;
    badgeClass: string;
    Icon: React.ComponentType<{ className?: string }>;
  }
> = {
  urgent: {
    label: "긴급",
    color: "red",
    badgeClass: "bg-red-100 text-red-700 border-red-200",
    Icon: AlertTriangle,
  },
  notice: {
    label: "공지",
    color: "blue",
    badgeClass: "bg-blue-100 text-blue-700 border-blue-200",
    Icon: Bell,
  },
  cue: {
    label: "큐",
    color: "green",
    badgeClass: "bg-green-100 text-green-700 border-green-200",
    Icon: Zap,
  },
  issue: {
    label: "문제보고",
    color: "orange",
    badgeClass: "bg-orange-100 text-orange-700 border-orange-200",
    Icon: AlertCircle,
  },
  general: {
    label: "일반",
    color: "gray",
    badgeClass: "bg-gray-100 text-gray-600 border-gray-200",
    Icon: MessageSquare,
  },
};

const TARGET_SCOPE_LABELS: Record<BackstageCommTargetScope, string> = {
  all: "전체",
  individual: "개인",
  team: "팀",
};

// ============================================================
// 헬퍼
// ============================================================

function formatTime(iso: string): string {
  const d = new Date(iso);
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  const ss = d.getSeconds().toString().padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

// ============================================================
// 메시지 행 컴포넌트
// ============================================================

function MessageRow({
  msg,
  onTogglePin,
  onToggleRead,
  onDelete,
  onReadBy,
}: {
  msg: BackstageCommMessage;
  onTogglePin: () => void;
  onToggleRead: () => void;
  onDelete: () => void;
  onReadBy: (name: string) => void;
}) {
  const meta = TYPE_META[msg.type];
  const IconComp = meta.Icon;
  const isUrgent = msg.type === "urgent";

  const [readByInput, setReadByInput] = useState("");
  const [showReadBy, setShowReadBy] = useState(false);

  function handleAddReadBy() {
    const name = readByInput.trim();
    if (!name) return;
    onReadBy(name);
    setReadByInput("");
    toast.success(`'${name}' 확인 처리됨`);
  }

  return (
    <div
      className={`rounded-lg border p-3 space-y-2 transition-colors ${
        isUrgent
          ? "bg-red-50 border-red-200"
          : msg.isPinned
          ? "bg-yellow-50 border-yellow-200"
          : "bg-card border-gray-100"
      }`}
    >
      {/* 상단 행 */}
      <div className="flex items-start gap-2">
        <span className={`mt-0.5 ${isUrgent ? "text-red-500" : "text-gray-400"}`}>
          <IconComp className="h-3.5 w-3.5" />
        </span>

        <div className="flex-1 min-w-0">
          {/* 배지 + 발신자 + 타임스탬프 */}
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 ${meta.badgeClass}`}
            >
              {meta.label}
            </Badge>
            <span className="text-xs font-medium text-gray-700">
              {msg.senderName}
            </span>
            <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
              <Clock className="h-2.5 w-2.5" />
              {formatTime(msg.createdAt)}
            </span>
            {/* 수신 대상 */}
            <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
              {msg.target.scope === "all" ? (
                <Users className="h-2.5 w-2.5" />
              ) : msg.target.scope === "individual" ? (
                <User className="h-2.5 w-2.5" />
              ) : (
                <Users className="h-2.5 w-2.5" />
              )}
              {msg.target.scope === "all"
                ? "전체"
                : msg.target.label ?? TARGET_SCOPE_LABELS[msg.target.scope]}
            </span>
            {msg.isPinned && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 bg-yellow-50 text-yellow-700 border-yellow-200"
              >
                핀
              </Badge>
            )}
            {msg.isRead && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 bg-green-50 text-green-700 border-green-200"
              >
                확인됨
              </Badge>
            )}
          </div>

          {/* 본문 */}
          <p className="text-sm text-gray-800 whitespace-pre-wrap leading-snug">
            {msg.content}
          </p>

          {/* 확인자 목록 */}
          {msg.readBy.length > 0 && (
            <p className="text-[10px] text-gray-400 mt-1">
              확인: {msg.readBy.join(", ")}
            </p>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="flex flex-col gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={onTogglePin}
            title={msg.isPinned ? "핀 해제" : "핀 고정"}
          >
            {msg.isPinned ? (
              <PinOff className="h-3 w-3 text-yellow-500" />
            ) : (
              <Pin className="h-3 w-3 text-gray-400" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={onToggleRead}
            title={msg.isRead ? "미확인으로 변경" : "확인 처리"}
          >
            <Check
              className={`h-3 w-3 ${msg.isRead ? "text-green-500" : "text-gray-300"}`}
            />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setShowReadBy((v) => !v)}
            title="확인자 추가"
          >
            <UserCheck className="h-3 w-3 text-gray-400" />
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

      {/* 확인자 추가 인풋 */}
      {showReadBy && (
        <div className="flex gap-2 mt-1">
          <Input
            value={readByInput}
            onChange={(e) => setReadByInput(e.target.value)}
            placeholder="확인자 이름"
            className="h-7 text-xs"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddReadBy();
              }
            }}
          />
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleAddReadBy}
          >
            추가
          </Button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// 메시지 작성 폼
// ============================================================

const DEFAULT_FORM = {
  type: "general" as BackstageCommType,
  content: "",
  senderName: "",
  targetScope: "all" as BackstageCommTargetScope,
  targetLabel: "",
};

function MessageForm({
  onSubmit,
}: {
  onSubmit: (values: typeof DEFAULT_FORM) => void;
}) {
  const [form, setForm] = useState(DEFAULT_FORM);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.content.trim()) {
      toast.error(TOAST.BACKSTAGE_COMM.MESSAGE_REQUIRED);
      return;
    }
    if (!form.senderName.trim()) {
      toast.error(TOAST.BACKSTAGE_COMM.SENDER_REQUIRED);
      return;
    }
    if (form.targetScope !== "all" && !form.targetLabel.trim()) {
      toast.error(TOAST.BACKSTAGE_COMM.RECIPIENT_REQUIRED);
      return;
    }
    onSubmit(form);
    setForm(DEFAULT_FORM);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pt-2">
      {/* 메시지 유형 + 발신자 */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">유형</Label>
          <Select
            value={form.type}
            onValueChange={(v) =>
              setForm((f) => ({ ...f, type: v as BackstageCommType }))
            }
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(TYPE_META) as BackstageCommType[]).map((t) => (
                <SelectItem key={t} value={t} className="text-xs">
                  {TYPE_META[t].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">발신자</Label>
          <Input
            value={form.senderName}
            onChange={(e) =>
              setForm((f) => ({ ...f, senderName: e.target.value }))
            }
            placeholder="이름"
            className="h-8 text-xs"
          />
        </div>
      </div>

      {/* 수신 대상 */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">수신 대상</Label>
          <Select
            value={form.targetScope}
            onValueChange={(v) =>
              setForm((f) => ({
                ...f,
                targetScope: v as BackstageCommTargetScope,
                targetLabel: v === "all" ? "" : f.targetLabel,
              }))
            }
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                전체
              </SelectItem>
              <SelectItem value="individual" className="text-xs">
                개인
              </SelectItem>
              <SelectItem value="team" className="text-xs">
                팀
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        {form.targetScope !== "all" && (
          <div className="space-y-1">
            <Label className="text-xs">
              {form.targetScope === "individual" ? "개인명" : "팀명"}
            </Label>
            <Input
              value={form.targetLabel}
              onChange={(e) =>
                setForm((f) => ({ ...f, targetLabel: e.target.value }))
              }
              placeholder={
                form.targetScope === "individual" ? "예: 홍길동" : "예: 안무팀"
              }
              className="h-8 text-xs"
            />
          </div>
        )}
      </div>

      {/* 내용 */}
      <div className="space-y-1">
        <Label className="text-xs">내용</Label>
        <Textarea
          value={form.content}
          onChange={(e) =>
            setForm((f) => ({ ...f, content: e.target.value }))
          }
          placeholder="메시지 내용을 입력하세요..."
          className="text-xs min-h-[72px] resize-none"
        />
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          size="sm"
          className={`h-7 text-xs ${
            form.type === "urgent"
              ? "bg-red-500 hover:bg-red-600 text-white"
              : ""
          }`}
        >
          <Plus className="h-3 w-3 mr-1" />
          전송
        </Button>
      </div>
    </form>
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
          <DialogTitle className="text-sm">메시지 삭제</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-gray-600">이 메시지를 삭제하시겠습니까?</p>
        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onClose}>
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

export function BackstageCommCard({
  groupId,
  projectId,
}: {
  groupId: string;
  projectId: string;
}) {
  const {
    messages,
    urgentMessages,
    pinnedMessages,
    stats,
    loading,
    addMessage,
    deleteMessage,
    togglePin,
    toggleRead,
    addReadBy,
  } = useBackstageComm(groupId, projectId);

  const deleteConfirm = useDeleteConfirm<string>();
  const [activeTab, setActiveTab] = useState("all");

  function handleAddMessage(form: {
    type: BackstageCommType;
    content: string;
    senderName: string;
    targetScope: BackstageCommTargetScope;
    targetLabel: string;
  }) {
    addMessage({
      type: form.type,
      content: form.content.trim(),
      senderName: form.senderName.trim(),
      target: {
        scope: form.targetScope,
        label:
          form.targetScope !== "all" && form.targetLabel.trim()
            ? form.targetLabel.trim()
            : undefined,
      },
    });
    toast.success(TOAST.BACKSTAGE_COMM.MESSAGE_SENT);
  }

  function handleDelete(id: string) {
    deleteMessage(id);
    toast.success(TOAST.BACKSTAGE_COMM.MESSAGE_DELETED);
  }

  const displayMessages: BackstageCommMessage[] =
    activeTab === "urgent"
      ? urgentMessages
      : activeTab === "pinned"
      ? pinnedMessages
      : messages;

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
              <Radio className="h-4 w-4 text-purple-500" />
              <CardTitle className="text-sm font-semibold">
                백스테이지 커뮤니케이션
              </CardTitle>
            </div>
            {/* 통계 배지 */}
            <div className="flex items-center gap-1">
              {stats.urgent > 0 && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 bg-red-100 text-red-700 border-red-200"
                >
                  긴급 {stats.urgent}
                </Badge>
              )}
              {stats.unread > 0 && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 border-blue-200"
                >
                  미확인 {stats.unread}
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
          {/* 긴급 메시지 배너 */}
          {urgentMessages.length > 0 && (
            <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2">
              <p className="text-[10px] font-semibold text-red-600 mb-1 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                긴급 메시지 {urgentMessages.length}건
              </p>
              {urgentMessages.slice(0, 2).map((m) => (
                <p key={m.id} className="text-xs text-red-700 truncate">
                  [{m.senderName}] {m.content}
                </p>
              ))}
              {urgentMessages.length > 2 && (
                <p className="text-[10px] text-red-400 mt-0.5">
                  외 {urgentMessages.length - 2}건 더 있음
                </p>
              )}
            </div>
          )}

          {/* 탭 */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="h-7 text-xs">
              <TabsTrigger value="all" className="text-xs px-2 h-6">
                전체
              </TabsTrigger>
              <TabsTrigger value="urgent" className="text-xs px-2 h-6">
                긴급
              </TabsTrigger>
              <TabsTrigger value="pinned" className="text-xs px-2 h-6">
                핀 고정
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-2 space-y-2">
              {displayMessages.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">
                  {activeTab === "urgent"
                    ? "긴급 메시지가 없습니다."
                    : activeTab === "pinned"
                    ? "핀 고정된 메시지가 없습니다."
                    : "메시지가 없습니다."}
                </p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {displayMessages.map((msg) => (
                    <MessageRow
                      key={msg.id}
                      msg={msg}
                      onTogglePin={() => togglePin(msg.id)}
                      onToggleRead={() => toggleRead(msg.id)}
                      onDelete={() => deleteConfirm.request(msg.id)}
                      onReadBy={(name) => addReadBy(msg.id, name)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* 메시지 작성 폼 */}
          <div className="border-t pt-3">
            <p className="text-xs font-medium text-gray-700 mb-2">
              메시지 전송
            </p>
            <MessageForm onSubmit={handleAddMessage} />
          </div>
        </CardContent>
      </Card>

      {/* 삭제 확인 다이얼로그 */}
      <DeleteConfirmDialog
        open={deleteConfirm.open}
        onClose={deleteConfirm.cancel}
        onConfirm={() => {
          const id = deleteConfirm.confirm();
          if (id) handleDelete(id);
        }}
      />
    </>
  );
}
