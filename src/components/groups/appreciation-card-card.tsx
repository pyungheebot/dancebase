"use client";

import { useState } from "react";
import {
  Star,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Send,
  Heart,
  Lock,
  Globe,
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
import { useAppreciationCard } from "@/hooks/use-appreciation-card";
import type { AppreciationCardCategory, AppreciationCardEntry } from "@/types";

// ============================================
// 상수
// ============================================

const CATEGORY_META: Record<
  AppreciationCardCategory,
  { label: string; color: string; bgColor: string; cardBg: string }
> = {
  leadership: {
    label: "리더십",
    color: "bg-indigo-100 text-indigo-700 hover:bg-indigo-100",
    bgColor: "text-indigo-700",
    cardBg: "bg-indigo-50 border-indigo-200",
  },
  effort: {
    label: "노력",
    color: "bg-orange-100 text-orange-700 hover:bg-orange-100",
    bgColor: "text-orange-700",
    cardBg: "bg-orange-50 border-orange-200",
  },
  growth: {
    label: "성장",
    color: "bg-green-100 text-green-700 hover:bg-green-100",
    bgColor: "text-green-700",
    cardBg: "bg-green-50 border-green-200",
  },
  help: {
    label: "도움",
    color: "bg-blue-100 text-blue-700 hover:bg-blue-100",
    bgColor: "text-blue-700",
    cardBg: "bg-blue-50 border-blue-200",
  },
  fun: {
    label: "재미",
    color: "bg-pink-100 text-pink-700 hover:bg-pink-100",
    bgColor: "text-pink-700",
    cardBg: "bg-pink-50 border-pink-200",
  },
  other: {
    label: "기타",
    color: "bg-gray-100 text-gray-600 hover:bg-gray-100",
    bgColor: "text-gray-600",
    cardBg: "bg-gray-50 border-gray-200",
  },
};

const EMOJI_OPTIONS = ["🌟", "💪", "🙏", "👏", "🎉", "❤️", "🔥", "🌱"];

type FilterType = "all" | "received" | "sent";

// ============================================
// 감사 카드 아이템
// ============================================

function AppreciationCardItem({
  entry,
  currentMemberName,
  onLike,
  onDelete,
}: {
  entry: AppreciationCardEntry;
  currentMemberName?: string;
  onLike: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const meta = CATEGORY_META[entry.category];
  const isLiked = currentMemberName
    ? entry.likes.includes(currentMemberName)
    : false;
  const isOwner = currentMemberName === entry.fromMember;

  return (
    <div
      className={cn(
        "relative rounded-lg border-2 p-3 shadow-sm",
        meta.cardBg
      )}
    >
      {/* 헤더: 발신자 → 수신자 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
          <span className="font-semibold">{entry.fromMember}</span>
          <span className="text-gray-400">→</span>
          <span className="font-semibold">{entry.toMember}</span>
        </div>
        <div className="flex items-center gap-1">
          <Badge className={cn("text-[10px] px-1.5 py-0", meta.color)}>
            {meta.label}
          </Badge>
          {!entry.isPublic && (
            <Lock className="h-3 w-3 text-gray-400 flex-shrink-0" />
          )}
          {isOwner && (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 text-gray-400 hover:text-red-500"
              onClick={() => onDelete(entry.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* 메시지 내용 */}
      <div className="flex items-start gap-2 mb-2">
        {entry.emoji && (
          <span className="text-lg leading-tight flex-shrink-0">
            {entry.emoji}
          </span>
        )}
        <p className="text-xs text-gray-700 leading-relaxed flex-1">
          {entry.message}
        </p>
      </div>

      {/* 푸터: 날짜, 좋아요 */}
      <div className="flex items-center justify-between mt-1">
        <span className="text-[10px] text-gray-400">
          {new Date(entry.createdAt).toLocaleDateString("ko-KR", {
            month: "short",
            day: "numeric",
          })}
        </span>
        <button
          onClick={() => onLike(entry.id)}
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
          <span>{entry.likes.length}</span>
        </button>
      </div>
    </div>
  );
}

// ============================================
// 감사 카드 보내기 다이얼로그
// ============================================

function SendCardDialog({
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
    category: AppreciationCardCategory,
    message: string,
    emoji?: string,
    isPublic?: boolean
  ) => void;
}) {
  const [toMember, setToMember] = useState("");
  const [category, setCategory] = useState<AppreciationCardCategory | "">("");
  const [message, setMessage] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState<string>("");
  const [isPublic, setIsPublic] = useState(true);

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
      category as AppreciationCardCategory,
      message.trim(),
      selectedEmoji || undefined,
      isPublic
    );
    handleClose();
  }

  function handleClose() {
    setToMember("");
    setCategory("");
    setMessage("");
    setSelectedEmoji("");
    setIsPublic(true);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-400" />
            감사 카드 보내기
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
              onValueChange={(v) => setCategory(v as AppreciationCardCategory)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="카테고리 선택..." />
              </SelectTrigger>
              <SelectContent>
                {(
                  Object.entries(CATEGORY_META) as [
                    AppreciationCardCategory,
                    (typeof CATEGORY_META)[AppreciationCardCategory],
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
            <label className="text-xs font-medium text-gray-600">
              이모지 (선택)
            </label>
            <div className="flex gap-1.5 flex-wrap">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() =>
                    setSelectedEmoji(selectedEmoji === emoji ? "" : emoji)
                  }
                  className={cn(
                    "text-lg w-8 h-8 rounded-md border transition-colors",
                    selectedEmoji === emoji
                      ? "border-yellow-400 bg-yellow-50"
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
              placeholder="칭찬하고 싶은 점을 자유롭게 적어보세요..."
              className="text-xs min-h-[80px] resize-none"
              maxLength={200}
            />
            <p className="text-[10px] text-gray-400 text-right">
              {message.length}/200
            </p>
          </div>

          {/* 공개 여부 */}
          <div className="flex items-center justify-between rounded-md border border-gray-100 bg-gray-50 px-3 py-2">
            <div className="flex items-center gap-2">
              {isPublic ? (
                <Globe className="h-3.5 w-3.5 text-blue-500" />
              ) : (
                <Lock className="h-3.5 w-3.5 text-gray-400" />
              )}
              <span className="text-xs text-gray-600">
                {isPublic ? "전체 공개" : "비공개 (본인만 확인)"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsPublic((prev) => !prev)}
              className={cn(
                "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                isPublic ? "bg-blue-500" : "bg-gray-300"
              )}
            >
              <span
                className={cn(
                  "inline-block h-3.5 w-3.5 rounded-full bg-card shadow transition-transform",
                  isPublic ? "translate-x-4" : "translate-x-0.5"
                )}
              />
            </button>
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

export function AppreciationCardCard({
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
    loading,
    totalEntries,
    topReceiver,
    topSender,
    categoryDistribution,
    sendCard,
    deleteCard,
    toggleLike,
    getVisibleEntries,
    getEntriesTo,
    getEntriesFrom,
  } = useAppreciationCard(groupId);

  // 필터 적용
  const filteredEntries = (() => {
    if (filter === "received" && currentMemberName) {
      return getEntriesTo(currentMemberName);
    }
    if (filter === "sent" && currentMemberName) {
      return getEntriesFrom(currentMemberName);
    }
    return getVisibleEntries(currentMemberName);
  })();

  function handleSend(
    toMember: string,
    category: AppreciationCardCategory,
    message: string,
    emoji?: string,
    isPublic?: boolean
  ) {
    const from = currentMemberName ?? "익명";
    sendCard(from, toMember, category, message, emoji, isPublic ?? true);
    toast.success(`${toMember}님께 감사 카드를 보냈습니다.`);
  }

  function handleDelete(id: string) {
    deleteCard(id);
    toast.success("감사 카드가 삭제되었습니다.");
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
    Object.entries(categoryDistribution) as [AppreciationCardCategory, number][]
  ).sort((a, b) => b[1] - a[1])[0];

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="rounded-xl border border-gray-200 bg-card shadow-sm overflow-hidden">
          {/* 헤더 */}
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                <span className="text-sm font-semibold text-gray-800">
                  멤버 감사 카드
                </span>
                {totalEntries > 0 && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-yellow-50 text-yellow-600 hover:bg-yellow-50">
                    {totalEntries}
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
                  카드 보내기
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
            {totalEntries > 0 && (
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

            {/* 카테고리 분포 바 */}
            {totalEntries > 0 && (
              <div className="px-4 pt-3 pb-1">
                <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden">
                  {(
                    Object.entries(categoryDistribution) as [
                      AppreciationCardCategory,
                      number,
                    ][]
                  )
                    .filter(([, count]) => count > 0)
                    .map(([key, count]) => {
                      const meta = CATEGORY_META[key];
                      const width = Math.round((count / totalEntries) * 100);
                      return (
                        <div
                          key={key}
                          title={`${meta.label}: ${count}개`}
                          style={{ width: `${width}%` }}
                          className={cn(
                            "h-full rounded-sm",
                            key === "leadership" && "bg-indigo-400",
                            key === "effort" && "bg-orange-400",
                            key === "growth" && "bg-green-400",
                            key === "help" && "bg-blue-400",
                            key === "fun" && "bg-pink-400",
                            key === "other" && "bg-gray-400"
                          )}
                        />
                      );
                    })}
                </div>
                <div className="flex gap-2 mt-1.5 flex-wrap">
                  {(
                    Object.entries(categoryDistribution) as [
                      AppreciationCardCategory,
                      number,
                    ][]
                  )
                    .filter(([, count]) => count > 0)
                    .map(([key, count]) => {
                      const meta = CATEGORY_META[key];
                      return (
                        <span
                          key={key}
                          className="text-[9px] text-gray-500 flex items-center gap-0.5"
                        >
                          <span className={meta.bgColor}>{meta.label}</span>
                          <span>{count}</span>
                        </span>
                      );
                    })}
                </div>
              </div>
            )}

            {/* 필터 탭 */}
            {currentMemberName && (
              <div className="flex gap-1 px-4 pt-2 pb-1">
                {(
                  [
                    { key: "all", label: "전체" },
                    { key: "received", label: "받은 카드" },
                    { key: "sent", label: "보낸 카드" },
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

            {/* 카드 피드 */}
            <div className="p-4 space-y-3">
              {loading ? (
                <p className="text-xs text-gray-400 text-center py-4">
                  불러오는 중...
                </p>
              ) : filteredEntries.length === 0 ? (
                <div className="text-center py-6">
                  <Star className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">
                    {filter === "received"
                      ? "받은 감사 카드가 없습니다."
                      : filter === "sent"
                        ? "보낸 감사 카드가 없습니다."
                        : "아직 감사 카드가 없습니다."}
                  </p>
                  <p className="text-[10px] text-gray-300 mt-1">
                    팀원에게 감사한 마음을 카드로 전해보세요!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredEntries.map((entry) => (
                    <AppreciationCardItem
                      key={entry.id}
                      entry={entry}
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

      <SendCardDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        memberNames={memberNames}
        currentMemberName={currentMemberName}
        onSend={handleSend}
      />
    </>
  );
}
