"use client";

import { useState } from "react";
import {
  MessageSquareHeart,
  ChevronDown,
  ChevronUp,
  Plus,
  Heart,
  Trash2,
  Trophy,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useImpressionWall } from "@/hooks/use-impression-wall";
import type { ImpressionMood, ImpressionPost } from "@/types";

// ─── 기분 메타 ────────────────────────────────────────────────

const MOOD_META: Record<
  ImpressionMood,
  { emoji: string; label: string; bg: string; border: string; text: string }
> = {
  happy: {
    emoji: "😊",
    label: "행복",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    text: "text-yellow-700",
  },
  proud: {
    emoji: "😤",
    label: "뿌듯",
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-700",
  },
  tired: {
    emoji: "😓",
    label: "힘듦",
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
  },
  excited: {
    emoji: "🤩",
    label: "신남",
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-700",
  },
  grateful: {
    emoji: "🙏",
    label: "감사",
    bg: "bg-pink-50",
    border: "border-pink-200",
    text: "text-pink-700",
  },
  reflective: {
    emoji: "🤔",
    label: "성찰",
    bg: "bg-purple-50",
    border: "border-purple-200",
    text: "text-purple-700",
  },
};

const ALL_MOODS = Object.keys(MOOD_META) as ImpressionMood[];

// ─── 날짜 포맷 헬퍼 ──────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hour = String(d.getHours()).padStart(2, "0");
  const minute = String(d.getMinutes()).padStart(2, "0");
  return `${month}/${day} ${hour}:${minute}`;
}

// ─── 소감 작성 다이얼로그 ─────────────────────────────────────

interface WriteDialogProps {
  hook: ReturnType<typeof useImpressionWall>;
}

function WriteDialog({ hook }: WriteDialogProps) {
  const [open, setOpen] = useState(false);
  const [authorName, setAuthorName] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [mood, setMood] = useState<ImpressionMood>("happy");
  const [content, setContent] = useState("");

  const handleSubmit = () => {
    if (!authorName.trim()) {
      toast.error("이름을 입력해주세요.");
      return;
    }
    if (!eventTitle.trim()) {
      toast.error("공연/연습명을 입력해주세요.");
      return;
    }
    if (!content.trim()) {
      toast.error("소감 내용을 입력해주세요.");
      return;
    }
    const ok = hook.addPost(authorName, eventTitle, mood, content);
    if (ok) {
      toast.success("소감이 등록되었습니다.");
      setAuthorName("");
      setEventTitle("");
      setMood("happy");
      setContent("");
      setOpen(false);
    } else {
      toast.error("소감 등록에 실패했습니다.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="h-7 bg-pink-500 text-xs hover:bg-pink-600"
        >
          <Plus className="mr-1 h-3 w-3" />
          소감 남기기
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <MessageSquareHeart className="h-4 w-4 text-pink-500" />
            소감 남기기
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-1">
          {/* 이름 */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-gray-500">
              이름
            </label>
            <Input
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value.slice(0, 20))}
              placeholder="본인 이름을 입력하세요"
              className="h-7 text-xs"
            />
          </div>

          {/* 공연/연습명 */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-gray-500">
              공연 / 연습명
            </label>
            <Input
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value.slice(0, 40))}
              placeholder="예: 2024 정기공연, 수요 연습"
              className="h-7 text-xs"
              list="event-datalist"
            />
            {hook.uniqueEvents.length > 0 && (
              <datalist id="event-datalist">
                {hook.uniqueEvents.map((ev) => (
                  <option key={ev} value={ev} />
                ))}
              </datalist>
            )}
          </div>

          {/* 기분 선택 */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-gray-500">
              지금 기분
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_MOODS.map((m) => {
                const meta = MOOD_META[m];
                const selected = mood === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMood(m)}
                    className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                      selected
                        ? `${meta.bg} ${meta.border} ${meta.text} font-semibold`
                        : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    <span>{meta.emoji}</span>
                    <span>{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 소감 내용 */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-gray-500">
              소감
            </label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, 300))}
              placeholder="오늘의 소감을 자유롭게 남겨보세요 (최대 300자)"
              className="min-h-[80px] resize-none text-xs"
            />
            <p className="text-right text-[10px] text-gray-400">
              {content.length}/300
            </p>
          </div>

          <Button
            className="h-8 w-full bg-pink-500 text-xs hover:bg-pink-600"
            onClick={handleSubmit}
            disabled={!authorName.trim() || !eventTitle.trim() || !content.trim()}
          >
            등록하기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── 포스트잇 카드 ────────────────────────────────────────────

interface PostCardProps {
  post: ImpressionPost;
  onLike: (id: string) => void;
  onDelete: (id: string) => void;
}

function PostCard({ post, onLike, onDelete }: PostCardProps) {
  const meta = MOOD_META[post.mood];

  return (
    <div
      className={`relative flex flex-col gap-2 rounded-lg border p-3 ${meta.bg} ${meta.border}`}
    >
      {/* 기분 이모지 + 작성자 + 날짜 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-base leading-none">{meta.emoji}</span>
          <div>
            <p className="text-xs font-semibold text-gray-800">
              {post.authorName}
            </p>
            <p className="text-[10px] text-gray-400">
              {formatDate(post.createdAt)}
            </p>
          </div>
        </div>

        {/* 삭제 버튼 */}
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 shrink-0 p-0 text-gray-300 hover:text-red-400"
          onClick={() => onDelete(post.id)}
          title="소감 삭제"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* 이벤트명 배지 */}
      <Badge
        className={`w-fit text-[10px] px-1.5 py-0 ${meta.bg} ${meta.border} ${meta.text} hover:${meta.bg}`}
      >
        {post.eventTitle}
      </Badge>

      {/* 소감 내용 */}
      <p className="text-xs leading-relaxed text-gray-700 whitespace-pre-wrap">
        {post.content}
      </p>

      {/* 좋아요 */}
      <div className="flex items-center justify-end gap-1">
        <button
          type="button"
          onClick={() => onLike(post.id)}
          className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] text-gray-400 transition-colors hover:bg-white/60 hover:text-pink-500"
          title="좋아요"
        >
          <Heart className="h-3 w-3" />
          <span>{post.likes}</span>
        </button>
      </div>
    </div>
  );
}

// ─── 인기 소감 TOP 3 ──────────────────────────────────────────

interface Top3SectionProps {
  top3: ImpressionPost[];
  onLike: (id: string) => void;
  onDelete: (id: string) => void;
}

function Top3Section({ top3, onLike }: Top3SectionProps) {
  const [open, setOpen] = useState(false);

  if (top3.length === 0) return null;

  const rankColors = [
    "text-yellow-500",
    "text-gray-400",
    "text-amber-600",
  ];

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 w-full justify-between border-gray-200 text-xs text-gray-600 hover:bg-gray-50"
        >
          <span className="flex items-center gap-1">
            <Trophy className="h-3 w-3 text-yellow-500" />
            인기 소감 TOP 3
          </span>
          {open ? (
            <ChevronUp className="h-3.5 w-3.5 text-gray-400" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
          )}
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="mt-2 space-y-2">
          {top3.map((post, idx) => {
            const meta = MOOD_META[post.mood];
            return (
              <div
                key={post.id}
                className={`flex items-start gap-2 rounded-lg border p-2.5 ${meta.bg} ${meta.border}`}
              >
                {/* 순위 */}
                <span
                  className={`shrink-0 text-sm font-bold ${rankColors[idx] ?? "text-gray-400"}`}
                >
                  #{idx + 1}
                </span>

                {/* 내용 */}
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-1">
                    <span className="text-xs">{meta.emoji}</span>
                    <span className="text-xs font-semibold text-gray-800">
                      {post.authorName}
                    </span>
                    <Badge
                      className={`text-[10px] px-1 py-0 ${meta.bg} ${meta.border} ${meta.text} hover:${meta.bg}`}
                    >
                      {post.eventTitle}
                    </Badge>
                  </div>
                  <p className="text-[11px] leading-relaxed text-gray-700 line-clamp-2">
                    {post.content}
                  </p>
                </div>

                {/* 좋아요 */}
                <button
                  type="button"
                  onClick={() => onLike(post.id)}
                  className="flex shrink-0 items-center gap-0.5 text-[11px] text-pink-400 hover:text-pink-600"
                >
                  <Heart className="h-3 w-3" />
                  <span>{post.likes}</span>
                </button>
              </div>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ─── 메인 카드 ────────────────────────────────────────────────

interface ImpressionWallCardProps {
  groupId: string;
}

export function ImpressionWallCard({ groupId }: ImpressionWallCardProps) {
  const [open, setOpen] = useState(true);
  const [activeMood, setActiveMood] = useState<ImpressionMood | "all">("all");

  const hook = useImpressionWall(groupId);

  const handleLike = (id: string) => {
    const ok = hook.likePost(id);
    if (!ok) toast.error("좋아요 처리에 실패했습니다.");
  };

  const handleDelete = (id: string) => {
    const ok = hook.deletePost(id);
    if (ok) {
      toast.success("소감이 삭제되었습니다.");
    } else {
      toast.error(TOAST.DELETE_ERROR);
    }
  };

  const filteredPosts = hook.filterByMood(activeMood);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      {/* ── 헤더 ── */}
      <div className="flex items-center justify-between rounded-t-lg border border-b-0 border-gray-200 bg-white px-4 py-2.5">
        <div className="flex items-center gap-2">
          <MessageSquareHeart className="h-4 w-4 text-pink-500" />
          <span className="text-sm font-semibold text-gray-800">소감 벽</span>

          {/* 총 소감 수 배지 */}
          {hook.totalPosts > 0 && (
            <Badge className="bg-pink-100 text-[10px] px-1.5 py-0 text-pink-600 hover:bg-pink-100">
              {hook.totalPosts}개
            </Badge>
          )}

          {/* 인기 기분 배지 */}
          {hook.popularMood && (
            <Badge className="bg-gray-100 text-[10px] px-1.5 py-0 text-gray-500 hover:bg-gray-100">
              {MOOD_META[hook.popularMood].emoji} 많아요
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <WriteDialog hook={hook} />
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              {open ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </Button>
          </CollapsibleTrigger>
        </div>
      </div>

      {/* ── 본문 ── */}
      <CollapsibleContent>
        <div className="rounded-b-lg border border-gray-200 bg-white p-4 space-y-4">

          {/* 통계 요약 */}
          {hook.totalPosts > 0 && (
            <div className="flex flex-wrap gap-3 rounded-md bg-gray-50 px-3 py-2">
              <div className="flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-pink-400" />
                <span className="text-[11px] text-gray-500">
                  총{" "}
                  <span className="font-semibold text-gray-700">
                    {hook.totalPosts}
                  </span>
                  개의 소감
                </span>
              </div>
              {hook.mostActiveMember && (
                <div className="flex items-center gap-1">
                  <Trophy className="h-3 w-3 text-yellow-500" />
                  <span className="text-[11px] text-gray-500">
                    최다 작성:{" "}
                    <span className="font-semibold text-gray-700">
                      {hook.mostActiveMember}
                    </span>
                  </span>
                </div>
              )}
              {hook.popularMood && (
                <div className="flex items-center gap-1">
                  <span className="text-xs">
                    {MOOD_META[hook.popularMood].emoji}
                  </span>
                  <span className="text-[11px] text-gray-500">
                    인기 기분:{" "}
                    <span className="font-semibold text-gray-700">
                      {MOOD_META[hook.popularMood].label}
                    </span>
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 인기 소감 TOP 3 */}
          <Top3Section
            top3={hook.top3Posts}
            onLike={handleLike}
            onDelete={handleDelete}
          />

          {hook.totalPosts > 0 && <Separator />}

          {/* 기분 필터 탭 */}
          {hook.totalPosts > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setActiveMood("all")}
                className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                  activeMood === "all"
                    ? "border-gray-400 bg-gray-800 text-white"
                    : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                }`}
              >
                전체 {hook.totalPosts}
              </button>
              {ALL_MOODS.map((m) => {
                const meta = MOOD_META[m];
                const count = hook.posts.filter((p) => p.mood === m).length;
                if (count === 0) return null;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setActiveMood(m)}
                    className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                      activeMood === m
                        ? `${meta.bg} ${meta.border} ${meta.text} font-semibold`
                        : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    <span>{meta.emoji}</span>
                    <span>{count}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* 소감 목록 */}
          {filteredPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-gray-400">
              <MessageSquareHeart className="h-10 w-10 opacity-20" />
              <p className="text-xs">아직 소감이 없습니다.</p>
              <p className="text-[10px]">
                공연이나 연습 후 소감을 남겨보세요!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {filteredPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onLike={handleLike}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
