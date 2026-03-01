"use client";

import { useState } from "react";
import { useAsyncAction } from "@/hooks/use-async-action";
import { toast } from "sonner";
import {
  Pin,
  PinOff,
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
  StickyNote,
  CalendarClock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { useSharedMemo } from "@/hooks/use-shared-memo";
import type { SharedMemoColor } from "@/types";

// ─── 색상 설정 ────────────────────────────────────────────────
const COLOR_MAP: Record<
  SharedMemoColor,
  { bg: string; border: string; label: string; swatch: string }
> = {
  yellow: {
    bg: "bg-yellow-50",
    border: "border-yellow-300",
    label: "노랑",
    swatch: "bg-yellow-300",
  },
  blue: {
    bg: "bg-blue-50",
    border: "border-blue-300",
    label: "파랑",
    swatch: "bg-blue-300",
  },
  green: {
    bg: "bg-green-50",
    border: "border-green-300",
    label: "초록",
    swatch: "bg-green-300",
  },
  pink: {
    bg: "bg-pink-50",
    border: "border-pink-300",
    label: "분홍",
    swatch: "bg-pink-300",
  },
  purple: {
    bg: "bg-purple-50",
    border: "border-purple-300",
    label: "보라",
    swatch: "bg-purple-300",
  },
};

const COLOR_OPTIONS: SharedMemoColor[] = [
  "yellow",
  "blue",
  "green",
  "pink",
  "purple",
];

// ─── 날짜 포맷 헬퍼 ──────────────────────────────────────────
function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── 단일 메모 아이템 ─────────────────────────────────────────
function MemoItem({
  memo,
  onPin,
  onDelete,
}: {
  memo: ReturnType<typeof useSharedMemo>["memos"][number];
  onPin: () => void;
  onDelete: () => void;
}) {
  const { bg, border } = COLOR_MAP[memo.color];
  const isExpiringSoon =
    memo.expiresAt
      ? (() => {
          const diff =
            new Date(memo.expiresAt).getTime() - new Date(today()).getTime();
          return diff >= 0 && diff <= 2 * 24 * 60 * 60 * 1000;
        })()
      : false;

  return (
    <div
      className={`relative flex flex-col gap-1.5 rounded-lg border p-3 shadow-sm ${bg} ${border}`}
    >
      {/* 핀 배지 */}
      {memo.pinned && (
        <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-orange-400 shadow">
          <Pin className="h-2.5 w-2.5 text-white" />
        </span>
      )}

      {/* 내용 */}
      <p className="whitespace-pre-wrap break-words text-xs leading-relaxed text-gray-800">
        {memo.content}
      </p>

      {/* 만료일 */}
      {memo.expiresAt && (
        <span
          className={`flex items-center gap-0.5 text-[10px] ${
            isExpiringSoon ? "font-semibold text-red-500" : "text-gray-400"
          }`}
        >
          <CalendarClock className="h-3 w-3" />
          {memo.expiresAt} 만료
          {isExpiringSoon && " (임박)"}
        </span>
      )}

      {/* 하단: 작성자 + 날짜 + 버튼 */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-gray-400">
          {memo.author} · {formatDate(memo.createdAt)}
        </span>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-gray-400 hover:text-orange-500"
            onClick={onPin}
            title={memo.pinned ? "핀 해제" : "핀 고정"}
          >
            {memo.pinned ? (
              <PinOff className="h-3 w-3" />
            ) : (
              <Pin className="h-3 w-3" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
            onClick={onDelete}
            title="삭제"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── 추가 폼 ─────────────────────────────────────────────────
function AddMemoForm({
  onAdd,
  isFull,
}: {
  onAdd: ReturnType<typeof useSharedMemo>["addMemo"];
  isFull: boolean;
}) {
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("");
  const [color, setColor] = useState<SharedMemoColor>("yellow");
  const [expiresAt, setExpiresAt] = useState("");
  const { pending: submitting, execute } = useAsyncAction();

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error("내용을 입력해주세요.");
      return;
    }
    if (isFull) {
      toast.error("메모는 최대 30개까지 저장할 수 있습니다.");
      return;
    }
    await execute(async () => {
      const ok = onAdd({
        content: content.trim(),
        author: author.trim(),
        color,
        expiresAt: expiresAt || undefined,
      });
      if (ok) {
        toast.success("메모가 추가되었습니다.");
        setContent("");
        setAuthor("");
        setExpiresAt("");
        setColor("yellow");
      } else {
        toast.error("메모 추가에 실패했습니다.");
      }
    });
  };

  return (
    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3">
      <p className="mb-2 text-xs font-medium text-gray-600">새 메모 추가</p>

      {/* 내용 */}
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value.slice(0, 200))}
        placeholder="내용을 입력하세요 (최대 200자)"
        className="mb-2 min-h-[70px] resize-none text-xs"
        disabled={isFull}
      />
      <p className="mb-2 text-right text-[10px] text-gray-400">
        {content.length}/200
      </p>

      {/* 작성자 + 만료일 */}
      <div className="mb-2 flex gap-2">
        <input
          type="text"
          value={author}
          onChange={(e) => setAuthor(e.target.value.slice(0, 20))}
          placeholder="작성자 (선택)"
          className="flex-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"
          disabled={isFull}
        />
        <input
          type="date"
          value={expiresAt}
          min={today()}
          onChange={(e) => setExpiresAt(e.target.value)}
          className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-300"
          disabled={isFull}
          title="만료일 (선택)"
        />
      </div>

      {/* 색상 선택 */}
      <div className="mb-3 flex items-center gap-1.5">
        <span className="text-[10px] text-gray-500">색상:</span>
        {COLOR_OPTIONS.map((c) => (
          <button
            key={c}
            type="button"
            title={COLOR_MAP[c].label}
            onClick={() => setColor(c)}
            className={`h-5 w-5 rounded-full border-2 transition-transform ${
              COLOR_MAP[c].swatch
            } ${
              color === c
                ? "scale-125 border-gray-600"
                : "border-transparent hover:scale-110"
            }`}
            disabled={isFull}
          />
        ))}
      </div>

      <Button
        size="sm"
        className="h-7 w-full text-xs"
        onClick={handleSubmit}
        disabled={isFull || submitting}
      >
        <Plus className="mr-1 h-3 w-3" />
        {isFull ? "메모 한도 초과 (최대 30개)" : "메모 추가"}
      </Button>
    </div>
  );
}

// ─── 메인 카드 ────────────────────────────────────────────────
interface SharedMemoCardProps {
  groupId: string;
}

export function SharedMemoCard({ groupId }: SharedMemoCardProps) {
  const [open, setOpen] = useState(true);
  const { memos, addMemo, deleteMemo, togglePin, isFull } =
    useSharedMemo(groupId);

  const pinnedCount = memos.filter((m) => m.pinned).length;

  const handleDelete = (id: string) => {
    deleteMemo(id);
    toast.success("메모가 삭제되었습니다.");
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      {/* 헤더 */}
      <div className="flex items-center justify-between rounded-t-lg border border-b-0 border-gray-200 bg-white px-4 py-2.5">
        <div className="flex items-center gap-2">
          <StickyNote className="h-4 w-4 text-indigo-500" />
          <span className="text-sm font-semibold text-gray-800">
            공유 메모
          </span>
          {memos.length > 0 && (
            <Badge className="bg-indigo-100 text-[10px] px-1.5 py-0 text-indigo-600 hover:bg-indigo-100">
              {memos.length}
            </Badge>
          )}
          {pinnedCount > 0 && (
            <Badge className="bg-orange-100 text-[10px] px-1.5 py-0 text-orange-600 hover:bg-orange-100">
              <Pin className="mr-0.5 h-2.5 w-2.5" />
              {pinnedCount}
            </Badge>
          )}
        </div>
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

      {/* 본문 */}
      <CollapsibleContent>
        <div className="rounded-b-lg border border-gray-200 bg-white p-4">
          {/* 메모 그리드 */}
          {memos.length > 0 ? (
            <div className="mb-4 grid grid-cols-2 gap-2">
              {memos.map((memo) => (
                <MemoItem
                  key={memo.id}
                  memo={memo}
                  onPin={() => togglePin(memo.id)}
                  onDelete={() => handleDelete(memo.id)}
                />
              ))}
            </div>
          ) : (
            <div className="mb-4 flex flex-col items-center justify-center gap-1 py-6 text-gray-400">
              <StickyNote className="h-8 w-8 opacity-30" />
              <p className="text-xs">아직 공유된 메모가 없습니다.</p>
            </div>
          )}

          <Separator className="mb-4" />

          {/* 추가 폼 */}
          <AddMemoForm onAdd={addMemo} isFull={isFull} />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
