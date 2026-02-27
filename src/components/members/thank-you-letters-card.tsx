"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ChevronDown,
  ChevronUp,
  Heart,
  Mail,
  Send,
  Award,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  useThankYouLetters,
  THANK_YOU_CATEGORY_LABEL,
  THANK_YOU_CATEGORY_EMOJI,
  SELECTABLE_EMOJIS,
} from "@/hooks/use-thank-you-letters";
import type { ThankYouCategory } from "@/types";

const ALL_CATEGORIES: ThankYouCategory[] = [
  "teamwork",
  "teaching",
  "encouragement",
  "effort",
  "general",
];

const TOP_MEDALS = ["🥇", "🥈", "🥉"];

// 카테고리별 배지 색상
const CATEGORY_BADGE_CLASS: Record<ThankYouCategory, string> = {
  teamwork: "bg-blue-100 text-blue-700 border-blue-200",
  teaching: "bg-purple-100 text-purple-700 border-purple-200",
  encouragement: "bg-green-100 text-green-700 border-green-200",
  effort: "bg-orange-100 text-orange-700 border-orange-200",
  general: "bg-pink-100 text-pink-700 border-pink-200",
};

interface ThankYouLettersCardProps {
  groupId: string;
  memberNames: string[];       // 그룹 내 멤버 이름 목록
  currentUserId?: string;      // 현재 로그인 사용자 ID
  currentUserName?: string;    // 현재 로그인 사용자 이름
}

export function ThankYouLettersCard({
  groupId,
  memberNames,
  currentUserId,
  currentUserName,
}: ThankYouLettersCardProps) {
  const {
    publicLetters,
    sendLetter,
    deleteLetter,
    getReceivedLetters,
    getTopReceivers,
  } = useThankYouLetters(groupId);

  const [open, setOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"public" | "received" | "send">("public");
  const [filterCategory, setFilterCategory] = useState<ThankYouCategory | "all">("all");

  // 보내기 폼 상태
  const [fromName, setFromName] = useState(currentUserName ?? "");
  const [toName, setToName] = useState("");
  const [category, setCategory] = useState<ThankYouCategory>("general");
  const [selectedEmoji, setSelectedEmoji] = useState("💖");
  const [message, setMessage] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [sending, setSending] = useState(false);

  const topReceivers = getTopReceivers(3);
  const receivedLetters = currentUserId ? getReceivedLetters(currentUserId) : [];

  const filteredPublic =
    filterCategory === "all"
      ? publicLetters
      : publicLetters.filter((l) => l.category === filterCategory);

  function handleSend() {
    if (!fromName.trim()) {
      toast.error("보내는 사람 이름을 입력해주세요.");
      return;
    }
    if (!toName.trim()) {
      toast.error("받는 사람을 선택해주세요.");
      return;
    }
    if (!message.trim()) {
      toast.error("감사 메시지를 입력해주세요.");
      return;
    }
    if (fromName.trim() === toName.trim()) {
      toast.error("자신에게는 편지를 보낼 수 없어요.");
      return;
    }

    setSending(true);
    try {
      sendLetter({
        fromId: currentUserId ?? fromName.trim(),
        fromName: fromName.trim(),
        toId: toName.trim(),
        toName: toName.trim(),
        message: message.trim(),
        category,
        isPublic,
        emoji: selectedEmoji,
      });
      toast.success(`${toName}님께 감사 편지를 보냈어요!`);
      setToName("");
      setMessage("");
      setSelectedEmoji("💖");
      setCategory("general");
      setIsPublic(true);
      setActiveTab("public");
    } catch {
      toast.error("편지 전송 중 오류가 발생했습니다.");
    } finally {
      setSending(false);
    }
  }

  function handleDelete(id: string) {
    deleteLetter(id);
    toast.success("편지를 삭제했습니다.");
  }

  function formatDate(isoStr: string) {
    return new Date(isoStr).toLocaleDateString("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="w-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Heart className="h-4 w-4 text-pink-500 fill-pink-400" />
              <span>감사 편지</span>
              {publicLetters.length > 0 && (
                <Badge className="text-[10px] px-1.5 py-0 bg-pink-100 text-pink-700 border-pink-200">
                  {publicLetters.length}통
                </Badge>
              )}
            </CardTitle>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                {open ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* TOP 3 감사왕 */}
            {topReceivers.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold flex items-center gap-1">
                  <Award className="h-3.5 w-3.5 text-yellow-500" />
                  TOP 3 감사왕
                </p>
                <div className="flex gap-2">
                  {topReceivers.map((r, idx) => (
                    <div
                      key={r.id}
                      className="flex-1 flex flex-col items-center gap-0.5 rounded-xl border bg-gradient-to-b from-pink-50 to-white py-2.5 shadow-sm"
                    >
                      <span className="text-base">{TOP_MEDALS[idx]}</span>
                      <Avatar className="h-6 w-6 mt-0.5">
                        <AvatarFallback className="text-[9px] bg-pink-100 text-pink-700">
                          {r.name.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-[10px] font-medium truncate max-w-full px-1">
                        {r.name}
                      </span>
                      <Badge className="text-[9px] px-1 py-0 bg-pink-100 text-pink-700 border-pink-200">
                        {r.count}통
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* 탭 */}
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as typeof activeTab)}
            >
              <TabsList className="h-7 w-full">
                <TabsTrigger value="public" className="flex-1 h-6 text-[10px] px-2 gap-1">
                  <Mail className="h-3 w-3" />
                  전체 공개
                  {publicLetters.length > 0 && (
                    <span className="text-[9px] text-muted-foreground">
                      ({publicLetters.length})
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="received" className="flex-1 h-6 text-[10px] px-2 gap-1">
                  <Heart className="h-3 w-3" />
                  받은 편지
                  {receivedLetters.length > 0 && (
                    <span className="text-[9px] text-muted-foreground">
                      ({receivedLetters.length})
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="send" className="flex-1 h-6 text-[10px] px-2 gap-1">
                  <Send className="h-3 w-3" />
                  편지 보내기
                </TabsTrigger>
              </TabsList>

              {/* 전체 공개 편지 */}
              <TabsContent value="public" className="mt-3 space-y-2">
                {/* 카테고리 필터 */}
                <div className="flex gap-1 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setFilterCategory("all")}
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium border transition-colors ${
                      filterCategory === "all"
                        ? "bg-pink-500 text-white border-pink-500"
                        : "bg-white text-muted-foreground border-border hover:border-pink-300"
                    }`}
                  >
                    전체
                  </button>
                  {ALL_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFilterCategory(cat)}
                      className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium border transition-colors ${
                        filterCategory === cat
                          ? "bg-pink-500 text-white border-pink-500"
                          : "bg-white text-muted-foreground border-border hover:border-pink-300"
                      }`}
                    >
                      <span>{THANK_YOU_CATEGORY_EMOJI[cat]}</span>
                      <span>{THANK_YOU_CATEGORY_LABEL[cat]}</span>
                    </button>
                  ))}
                </div>

                {filteredPublic.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Heart className="h-8 w-8 mb-2 text-pink-200" />
                    <p className="text-xs">아직 공개 편지가 없어요.</p>
                    <p className="text-[10px]">동료에게 감사함을 전해보세요!</p>
                  </div>
                ) : (
                  <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {filteredPublic.map((letter) => (
                      <LetterCard
                        key={letter.id}
                        letter={letter}
                        canDelete={
                          currentUserId === letter.fromId ||
                          currentUserId === letter.toId
                        }
                        onDelete={() => handleDelete(letter.id)}
                        formatDate={formatDate}
                      />
                    ))}
                  </ul>
                )}
              </TabsContent>

              {/* 받은 편지 */}
              <TabsContent value="received" className="mt-3">
                {!currentUserId ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Mail className="h-8 w-8 mb-2 text-muted-foreground/30" />
                    <p className="text-xs">로그인 후 받은 편지를 확인하세요.</p>
                  </div>
                ) : receivedLetters.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Heart className="h-8 w-8 mb-2 text-pink-200" />
                    <p className="text-xs">아직 받은 편지가 없어요.</p>
                    <p className="text-[10px]">동료들이 곧 감사함을 전해줄 거예요!</p>
                  </div>
                ) : (
                  <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {receivedLetters.map((letter) => (
                      <LetterCard
                        key={letter.id}
                        letter={letter}
                        showPrivateBadge
                        canDelete={currentUserId === letter.toId}
                        onDelete={() => handleDelete(letter.id)}
                        formatDate={formatDate}
                      />
                    ))}
                  </ul>
                )}
              </TabsContent>

              {/* 편지 보내기 */}
              <TabsContent value="send" className="mt-3">
                <div className="rounded-xl border border-pink-200 bg-gradient-to-b from-pink-50 to-rose-50 p-3.5 space-y-3">
                  {/* 보내는 사람 / 받는 사람 */}
                  <div className="grid grid-cols-2 gap-2">
                    {currentUserName ? (
                      <div className="flex items-center gap-1.5 text-xs border rounded-lg px-2.5 py-1.5 bg-white/70">
                        <span className="font-medium text-foreground truncate">
                          {currentUserName}
                        </span>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          이(가) 보냄
                        </span>
                      </div>
                    ) : (
                      <Input
                        placeholder="보내는 사람"
                        value={fromName}
                        onChange={(e) => setFromName(e.target.value)}
                        className="h-8 text-xs bg-white/70"
                      />
                    )}

                    <Select value={toName} onValueChange={setToName}>
                      <SelectTrigger className="h-8 text-xs bg-white/70">
                        <SelectValue placeholder="받는 사람 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {memberNames
                          .filter((n) => n !== fromName)
                          .map((name) => (
                            <SelectItem key={name} value={name} className="text-xs">
                              {name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 카테고리 선택 */}
                  <div className="space-y-1">
                    <p className="text-[10px] font-medium text-pink-700">카테고리</p>
                    <div className="flex gap-1 flex-wrap">
                      {ALL_CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setCategory(cat)}
                          className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium border transition-colors ${
                            category === cat
                              ? "bg-pink-500 text-white border-pink-500"
                              : "bg-white text-muted-foreground border-border hover:border-pink-300"
                          }`}
                        >
                          <span>{THANK_YOU_CATEGORY_EMOJI[cat]}</span>
                          <span>{THANK_YOU_CATEGORY_LABEL[cat]}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 이모지 선택 */}
                  <div className="space-y-1">
                    <p className="text-[10px] font-medium text-pink-700">이모지 선택</p>
                    <div className="grid grid-cols-8 gap-1">
                      {SELECTABLE_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setSelectedEmoji(emoji)}
                          className={`flex items-center justify-center rounded-lg p-1 text-base transition-all border ${
                            selectedEmoji === emoji
                              ? "border-pink-400 bg-pink-100 scale-110 shadow-sm"
                              : "border-transparent bg-white/60 hover:bg-white hover:border-pink-200"
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 메시지 입력 */}
                  <div className="space-y-1">
                    <Textarea
                      placeholder="감사한 마음을 전해보세요. (최대 200자)"
                      value={message}
                      onChange={(e) => setMessage(e.target.value.slice(0, 200))}
                      className="text-xs min-h-[72px] resize-none bg-white/70 border-pink-200 focus-visible:ring-pink-300"
                    />
                    <p className="text-right text-[10px] text-muted-foreground">
                      {message.length}/200
                    </p>
                  </div>

                  {/* 공개/비공개 토글 */}
                  <button
                    type="button"
                    onClick={() => setIsPublic((v) => !v)}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-medium border transition-colors w-full ${
                      isPublic
                        ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                        : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    {isPublic ? (
                      <>
                        <Eye className="h-3 w-3" />
                        <span>그룹 내 공개 — 모든 멤버가 볼 수 있어요</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3 w-3" />
                        <span>비공개 — 받는 사람만 볼 수 있어요</span>
                      </>
                    )}
                  </button>

                  <Button
                    size="sm"
                    onClick={handleSend}
                    disabled={sending}
                    className="h-8 text-xs w-full bg-pink-500 hover:bg-pink-600 text-white"
                  >
                    <Send className="h-3 w-3 mr-1.5" />
                    감사 편지 보내기
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

// 편지 카드 컴포넌트
interface LetterCardProps {
  letter: {
    id: string;
    fromName: string;
    toName: string;
    message: string;
    category: ThankYouCategory;
    isPublic: boolean;
    emoji: string;
    createdAt: string;
  };
  showPrivateBadge?: boolean;
  canDelete?: boolean;
  onDelete?: () => void;
  formatDate: (isoStr: string) => string;
}

function LetterCard({
  letter,
  showPrivateBadge,
  canDelete,
  onDelete,
  formatDate,
}: LetterCardProps) {
  return (
    <li className="rounded-xl border border-pink-100 bg-gradient-to-br from-rose-50 via-pink-50 to-white px-3 py-2.5 group shadow-sm">
      {/* 헤더: 보낸 사람 → 받는 사람, 배지 */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground min-w-0">
          <span className="font-semibold text-foreground truncate">
            {letter.fromName}
          </span>
          <span className="shrink-0">→</span>
          <span className="font-semibold text-pink-600 truncate">
            {letter.toName}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Badge
            className={`text-[9px] px-1.5 py-0 ${CATEGORY_BADGE_CLASS[letter.category]}`}
          >
            {THANK_YOU_CATEGORY_EMOJI[letter.category]}{" "}
            {THANK_YOU_CATEGORY_LABEL[letter.category]}
          </Badge>
          {showPrivateBadge && !letter.isPublic && (
            <Badge className="text-[9px] px-1.5 py-0 bg-gray-100 text-gray-500 border-gray-200">
              <EyeOff className="h-2.5 w-2.5 mr-0.5" />
              비공개
            </Badge>
          )}
          {canDelete && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive ml-0.5"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* 이모지 + 메시지 (편지지 스타일) */}
      <div className="flex gap-2 items-start">
        <span className="text-xl shrink-0 mt-0.5">{letter.emoji}</span>
        <p className="text-xs text-foreground leading-relaxed italic flex-1">
          &ldquo;{letter.message}&rdquo;
        </p>
      </div>

      {/* 날짜 */}
      <p className="text-[9px] text-muted-foreground mt-1.5 text-right">
        {formatDate(letter.createdAt)}
      </p>
    </li>
  );
}
