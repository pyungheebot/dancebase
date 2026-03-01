"use client";

import { useState } from "react";
import {
  Heart,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Send,
  Smile,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useThankYouBoard } from "@/hooks/use-thank-you-board";
import type { ThankYouCategory, ThankYouMessage } from "@/types";

// ============================================
// 상수
// ============================================

const CATEGORY_META: Record<
  ThankYouCategory,
  { label: string; color: string; bgColor: string; cardBg: string }
> = {
  help: {
    label: "도움",
    color: "bg-blue-100 text-blue-700 hover:bg-blue-100",
    bgColor: "text-blue-700",
    cardBg: "bg-blue-50 border-blue-200",
  },
  motivation: {
    label: "동기부여",
    color: "bg-orange-100 text-orange-700 hover:bg-orange-100",
    bgColor: "text-orange-700",
    cardBg: "bg-orange-50 border-orange-200",
  },
  teaching: {
    label: "가르침",
    color: "bg-purple-100 text-purple-700 hover:bg-purple-100",
    bgColor: "text-purple-700",
    cardBg: "bg-purple-50 border-purple-200",
  },
  teamwork: {
    label: "팀워크",
    color: "bg-green-100 text-green-700 hover:bg-green-100",
    bgColor: "text-green-700",
    cardBg: "bg-green-50 border-green-200",
  },
  creativity: {
    label: "창의성",
    color: "bg-pink-100 text-pink-700 hover:bg-pink-100",
    bgColor: "text-pink-700",
    cardBg: "bg-pink-50 border-pink-200",
  },
  encouragement: {
    label: "응원",
    color: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
    bgColor: "text-yellow-700",
    cardBg: "bg-yellow-50 border-yellow-200",
  },
  effort: {
    label: "노력",
    color: "bg-teal-100 text-teal-700 hover:bg-teal-100",
    bgColor: "text-teal-700",
    cardBg: "bg-teal-50 border-teal-200",
  },
  general: {
    label: "일반",
    color: "bg-gray-100 text-gray-600 hover:bg-gray-100",
    bgColor: "text-gray-600",
    cardBg: "bg-gray-50 border-gray-200",
  },
};

const EMOJI_OPTIONS = ["💪", "🙏", "❤️", "🌟", "👏", "🎉"];

type FilterType = "all" | "received" | "sent";

// ============================================
// 메시지 카드 (포스트잇 스타일)
// ============================================

function MessageCard({
  message,
  currentMemberName,
  onLike,
  onDelete,
}: {
  message: ThankYouMessage;
  currentMemberName?: string;
  onLike: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const meta = CATEGORY_META[message.category];
  const isLiked = currentMemberName
    ? message.likes.includes(currentMemberName)
    : false;
  const isOwner = currentMemberName === message.fromMember;

  return (
    <div
      className={cn(
        "relative rounded-lg border-2 p-3 shadow-sm",
        meta.cardBg
      )}
    >
      {/* 헤더: 보낸이 → 받는이 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
          <span className="font-semibold">{message.fromMember}</span>
          <span className="text-gray-400">→</span>
          <span className="font-semibold">{message.toMember}</span>
        </div>
        <div className="flex items-center gap-1">
          <Badge className={cn("text-[10px] px-1.5 py-0", meta.color)}>
            {meta.label}
          </Badge>
          {isOwner && (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 text-gray-400 hover:text-red-500"
              onClick={() => onDelete(message.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* 메시지 내용 */}
      <div className="flex items-start gap-2 mb-2">
        {message.emoji && (
          <span className="text-lg leading-tight flex-shrink-0">
            {message.emoji}
          </span>
        )}
        <p className="text-xs text-gray-700 leading-relaxed flex-1">
          {message.message}
        </p>
      </div>

      {/* 푸터: 날짜, 좋아요 */}
      <div className="flex items-center justify-between mt-1">
        <span className="text-[10px] text-gray-400">
          {new Date(message.createdAt).toLocaleDateString("ko-KR", {
            month: "short",
            day: "numeric",
          })}
        </span>
        <button
          onClick={() => onLike(message.id)}
          className={cn(
            "flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full transition-colors",
            isLiked
              ? "bg-red-100 text-red-500"
              : "bg-card/60 text-gray-400 hover:text-red-400"
          )}
        >
          <Heart
            className={cn("h-3 w-3", isLiked ? "fill-current" : "")}
          />
          <span>{message.likes.length}</span>
        </button>
      </div>
    </div>
  );
}

// ============================================
// 메시지 보내기 다이얼로그
// ============================================

function SendMessageDialog({
  open,
  onOpenChange,
  memberNames,
  currentMemberName,
  onSend,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  memberNames: string[];
  currentMemberName?: string;
  onSend: (
    toMember: string,
    category: ThankYouCategory,
    message: string,
    emoji?: string,
    isPublic?: boolean
  ) => void;
}) {
  const [toMember, setToMember] = useState("");
  const [category, setCategory] = useState<ThankYouCategory | "">("");
  const [message, setMessage] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState<string>("");

  const receiverOptions = memberNames.filter(
    (n) => n !== currentMemberName
  );

  function handleSend() {
    if (!toMember) {
      toast.error("받는 멤버를 선택해주세요.");
      return;
    }
    if (!category) {
      toast.error("카테고리를 선택해주세요.");
      return;
    }
    if (!message.trim()) {
      toast.error("메시지를 입력해주세요.");
      return;
    }
    onSend(
      toMember,
      category as ThankYouCategory,
      message.trim(),
      selectedEmoji || undefined,
      true
    );
    setToMember("");
    setCategory("");
    setMessage("");
    setSelectedEmoji("");
    onOpenChange(false);
  }

  function handleClose() {
    setToMember("");
    setCategory("");
    setMessage("");
    setSelectedEmoji("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <Heart className="h-4 w-4 text-red-400" />
            감사 메시지 보내기
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* 받는 멤버 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">
              받는 멤버
            </label>
            <Select value={toMember} onValueChange={setToMember}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="멤버 선택..." />
              </SelectTrigger>
              <SelectContent>
                {receiverOptions.map((name) => (
                  <SelectItem key={name} value={name} className="text-xs">
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 카테고리 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">
              카테고리
            </label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as ThankYouCategory)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="카테고리 선택..." />
              </SelectTrigger>
              <SelectContent>
                {(
                  Object.entries(CATEGORY_META) as [
                    ThankYouCategory,
                    (typeof CATEGORY_META)[ThankYouCategory],
                  ][]
                ).map(([key, meta]) => (
                  <SelectItem key={key} value={key} className="text-xs">
                    {meta.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 이모지 선택 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
              <Smile className="h-3 w-3" />
              이모지 (선택)
            </label>
            <div className="flex gap-1.5 flex-wrap">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() =>
                    setSelectedEmoji(selectedEmoji === emoji ? "" : emoji)
                  }
                  className={cn(
                    "text-lg w-8 h-8 rounded-md border transition-colors",
                    selectedEmoji === emoji
                      ? "border-blue-400 bg-blue-50"
                      : "border-gray-200 bg-background hover:border-gray-300"
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* 메시지 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">
              메시지
            </label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="감사한 마음을 전해보세요..."
              className="text-xs min-h-[80px] resize-none"
              maxLength={200}
            />
            <p className="text-[10px] text-gray-400 text-right">
              {message.length}/200
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={handleClose}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSend}
          >
            <Send className="h-3 w-3 mr-1" />
            보내기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 메인 카드 컴포넌트
// ============================================

export function ThankYouBoardCard({
  groupId,
  memberNames,
  currentMemberName,
}: {
  groupId: string;
  memberNames: string[];
  currentMemberName?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  const {
    messages,
    loading,
    sendMessage,
    deleteMessage,
    toggleLike,
    getMessagesTo,
    getMessagesFrom,
    totalMessages,
    topReceiver,
    topSender,
    categoryDistribution,
  } = useThankYouBoard(groupId);

  // 필터 적용
  const filteredMessages = (() => {
    if (filter === "received" && currentMemberName) {
      return getMessagesTo(currentMemberName);
    }
    if (filter === "sent" && currentMemberName) {
      return getMessagesFrom(currentMemberName);
    }
    return messages;
  })();

  function handleSend(
    toMember: string,
    category: ThankYouCategory,
    message: string,
    emoji?: string,
    isPublic?: boolean
  ) {
    const from = currentMemberName ?? "익명";
    sendMessage(from, toMember, category, message, emoji, isPublic ?? true);
    toast.success(`${toMember}님께 감사 메시지를 보냈습니다.`);
  }

  function handleDelete(id: string) {
    deleteMessage(id);
    toast.success("메시지가 삭제되었습니다.");
  }

  function handleLike(id: string) {
    if (!currentMemberName) {
      toast.error("좋아요를 누르려면 멤버 이름이 필요합니다.");
      return;
    }
    toggleLike(id, currentMemberName);
  }

  // 카테고리 분포 상위 항목
  const topCategory = (
    Object.entries(categoryDistribution) as [ThankYouCategory, number][]
  ).sort((a, b) => b[1] - a[1])[0];

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="rounded-xl border border-gray-200 bg-card shadow-sm overflow-hidden">
          {/* 헤더 */}
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-red-400 fill-red-400" />
                <span className="text-sm font-semibold text-gray-800">
                  감사 메시지 보드
                </span>
                {totalMessages > 0 && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-red-50 text-red-500 hover:bg-red-50">
                    {totalMessages}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDialogOpen(true);
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  메시지 보내기
                </Button>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </div>
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <Separator />

            {/* 통계 요약 */}
            {totalMessages > 0 && (
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center gap-3 text-[10px] text-gray-500 flex-wrap">
                  {topReceiver && (
                    <span>
                      최다 수신:{" "}
                      <span className="font-medium text-gray-700">
                        {topReceiver}
                      </span>
                    </span>
                  )}
                  {topSender && (
                    <span>
                      최다 발신:{" "}
                      <span className="font-medium text-gray-700">
                        {topSender}
                      </span>
                    </span>
                  )}
                  {topCategory && topCategory[1] > 0 && (
                    <span>
                      인기 카테고리:{" "}
                      <span className="font-medium text-gray-700">
                        {CATEGORY_META[topCategory[0]].label}
                      </span>
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* 필터 탭 */}
            {currentMemberName && (
              <div className="flex gap-1 px-4 pt-3 pb-1">
                {(
                  [
                    { key: "all", label: "전체" },
                    { key: "received", label: "받은 메시지" },
                    { key: "sent", label: "보낸 메시지" },
                  ] as { key: FilterType; label: string }[]
                ).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={cn(
                      "text-[10px] px-2.5 py-1 rounded-full border transition-colors",
                      filter === key
                        ? "bg-gray-800 text-white border-gray-800"
                        : "bg-background text-gray-500 border-gray-200 hover:border-gray-300"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {/* 메시지 피드 */}
            <div className="p-4 space-y-3">
              {loading ? (
                <p className="text-xs text-gray-400 text-center py-4">
                  불러오는 중...
                </p>
              ) : filteredMessages.length === 0 ? (
                <div className="text-center py-6">
                  <Heart className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">
                    {filter === "received"
                      ? "받은 감사 메시지가 없습니다."
                      : filter === "sent"
                        ? "보낸 감사 메시지가 없습니다."
                        : "아직 감사 메시지가 없습니다."}
                  </p>
                  <p className="text-[10px] text-gray-300 mt-1">
                    팀원에게 감사한 마음을 전해보세요!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredMessages.map((msg) => (
                    <MessageCard
                      key={msg.id}
                      message={msg}
                      currentMemberName={currentMemberName}
                      onLike={handleLike}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      <SendMessageDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        memberNames={memberNames}
        currentMemberName={currentMemberName}
        onSend={handleSend}
      />
    </>
  );
}
