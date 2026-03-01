"use client";

import { useState } from "react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {ChevronDown, ChevronUp, Send, Trophy, X} from "lucide-react";
import { useKudosBoard, KUDOS_CATEGORY_EMOJI, KUDOS_CATEGORY_LABEL } from "@/hooks/use-kudos-board";
import { KudosCategory } from "@/types";

const ALL_CATEGORIES: KudosCategory[] = [
  "teamwork",
  "effort",
  "creativity",
  "leadership",
  "improvement",
];

const TOP_MEDALS = ["🥇", "🥈", "🥉"];

interface KudosBoardCardProps {
  groupId: string;
  memberNames: string[];   // 그룹 내 멤버 이름 목록
  currentUserName?: string; // 현재 로그인 멤버 이름 (생략 시 직접 입력)
}

export function KudosBoardCard({
  groupId,
  memberNames,
  currentUserName,
}: KudosBoardCardProps) {
  const { kudos, sendKudos, deleteKudos, getTopReceivers } =
    useKudosBoard(groupId);

  const [open, setOpen] = useState(true);
  const [filterCategory, setFilterCategory] = useState<KudosCategory | "all">(
    "all"
  );

  // 보내기 폼 상태
  const [fromName, setFromName] = useState(currentUserName ?? "");
  const [toName, setToName] = useState("");
  const [category, setCategory] = useState<KudosCategory>("teamwork");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const topReceivers = getTopReceivers(3);

  const filteredKudos =
    filterCategory === "all"
      ? kudos
      : kudos.filter((k) => k.category === filterCategory);

  function handleSend() {
    if (!fromName.trim()) {
      toast.error(TOAST.MEMBERS.KUDOS_SENDER_REQUIRED);
      return;
    }
    if (!toName.trim()) {
      toast.error(TOAST.MEMBERS.KUDOS_RECEIVER_REQUIRED);
      return;
    }
    if (!message.trim()) {
      toast.error(TOAST.MEMBERS.KUDOS_MESSAGE_REQUIRED);
      return;
    }

    setSending(true);
    try {
      sendKudos({ fromName, toName, category, message });
      toast.success(`${toName}님께 칭찬을 보냈어요!`);
      setToName("");
      setMessage("");
    } catch {
      toast.error(TOAST.MEMBERS.KUDOS_SEND_ERROR);
    } finally {
      setSending(false);
    }
  }

  function handleDelete(id: string) {
    deleteKudos(id);
    toast.success(TOAST.MEMBERS.KUDOS_DELETED);
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="w-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <span>🏆</span>
              <span>멤버 칭찬 보드</span>
              {kudos.length > 0 && (
                <Badge className="text-[10px] px-1.5 py-0 bg-yellow-100 text-yellow-700 border-yellow-200">
                  {kudos.length}개
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
            {/* 칭찬 보내기 폼 */}
            <div className="rounded-lg border border-dashed border-yellow-300 bg-yellow-50 p-3 space-y-2.5">
              <p className="text-xs font-medium text-yellow-700">
                칭찬 메시지 보내기
              </p>

              <div className="grid grid-cols-2 gap-2">
                {/* 보내는 사람 */}
                {currentUserName ? (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground border rounded px-2 py-1.5 bg-card">
                    <span className="font-medium text-foreground">
                      {currentUserName}
                    </span>
                    <span className="text-[10px]">이(가) 보냄</span>
                  </div>
                ) : (
                  <Select value={fromName} onValueChange={setFromName}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="보내는 사람" />
                    </SelectTrigger>
                    <SelectContent>
                      {memberNames.map((name) => (
                        <SelectItem key={name} value={name} className="text-xs">
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* 받는 사람 */}
                <Select value={toName} onValueChange={setToName}>
                  <SelectTrigger className="h-8 text-xs">
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
              <div className="flex gap-1 flex-wrap">
                {ALL_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border transition-colors ${
                      category === cat
                        ? "bg-yellow-500 text-white border-yellow-500"
                        : "bg-background text-muted-foreground border-border hover:border-yellow-400"
                    }`}
                  >
                    <span>{KUDOS_CATEGORY_EMOJI[cat]}</span>
                    <span>{KUDOS_CATEGORY_LABEL[cat]}</span>
                  </button>
                ))}
              </div>

              {/* 메시지 입력 */}
              <div className="space-y-1">
                <Textarea
                  placeholder="칭찬 메시지를 입력하세요. (최대 100자)"
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, 100))}
                  className="text-xs min-h-[60px] resize-none"
                />
                <p className="text-right text-[10px] text-muted-foreground">
                  {message.length}/100
                </p>
              </div>

              <Button
                size="sm"
                className="h-7 text-xs w-full bg-yellow-500 hover:bg-yellow-600 text-white"
                onClick={handleSend}
                disabled={sending}
              >
                <Send className="h-3 w-3 mr-1" />
                칭찬 보내기
              </Button>
            </div>

            {/* TOP 3 수상자 */}
            {topReceivers.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold flex items-center gap-1">
                  <Trophy className="h-3 w-3 text-yellow-500" />
                  TOP 3 칭찬왕
                </p>
                <div className="flex gap-2">
                  {topReceivers.map((r, idx) => (
                    <div
                      key={r.name}
                      className="flex-1 flex flex-col items-center gap-0.5 rounded-lg border bg-muted/30 py-2"
                    >
                      <span className="text-base">{TOP_MEDALS[idx]}</span>
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[9px]">
                          {r.name.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-[10px] font-medium truncate max-w-full px-1">
                        {r.name}
                      </span>
                      <Badge className="text-[9px] px-1 py-0 bg-orange-100 text-orange-700 border-orange-200">
                        {r.count}개
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* 칭찬 목록 */}
            <div className="space-y-2">
              <p className="text-xs font-semibold">최근 칭찬 목록</p>

              {/* 카테고리 필터 탭 */}
              <Tabs
                value={filterCategory}
                onValueChange={(v) =>
                  setFilterCategory(v as KudosCategory | "all")
                }
              >
                <TabsList className="h-7 gap-0.5 flex-wrap">
                  <TabsTrigger value="all" className="h-6 text-[10px] px-2">
                    전체
                  </TabsTrigger>
                  {ALL_CATEGORIES.map((cat) => (
                    <TabsTrigger
                      key={cat}
                      value={cat}
                      className="h-6 text-[10px] px-2"
                    >
                      {KUDOS_CATEGORY_EMOJI[cat]}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {/* 목록 공통 렌더링 (탭 콘텐츠는 필터만 다름) */}
                <TabsContent value={filterCategory} className="mt-2">
                  {filteredKudos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                      <span className="text-2xl mb-1">💬</span>
                      <p className="text-xs">아직 칭찬이 없어요.</p>
                      <p className="text-[10px]">첫 칭찬을 보내보세요!</p>
                    </div>
                  ) : (
                    <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {filteredKudos.map((k) => (
                        <li
                          key={k.id}
                          className="flex items-start gap-2 rounded-lg border bg-muted/20 px-2.5 py-2 group"
                        >
                          <span className="text-base mt-0.5 shrink-0">
                            {KUDOS_CATEGORY_EMOJI[k.category]}
                          </span>
                          <div className="flex-1 min-w-0 space-y-0.5">
                            <p className="text-[10px] text-muted-foreground">
                              <span className="font-medium text-foreground">
                                {k.fromName}
                              </span>
                              <span className="mx-1">→</span>
                              <span className="font-medium text-foreground">
                                {k.toName}
                              </span>
                              <Badge className="ml-1.5 text-[9px] px-1 py-0 bg-gray-100 text-gray-600 border-gray-200">
                                {KUDOS_CATEGORY_LABEL[k.category]}
                              </Badge>
                            </p>
                            <p className="text-xs text-foreground leading-relaxed">
                              {k.message}
                            </p>
                            <p className="text-[9px] text-muted-foreground">
                              {new Date(k.createdAt).toLocaleDateString(
                                "ko-KR",
                                {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDelete(k.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5 text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
