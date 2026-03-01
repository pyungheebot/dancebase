"use client";

import { useState, useRef, useCallback } from "react";
import { useAsyncAction } from "@/hooks/use-async-action";
import { toast } from "sonner";
import {
  BookText,
  ChevronDown,
  ChevronUp,
  Plus,
  Search,
  Trash2,
  Pencil,
  X,
  Check,
  BarChart2,
  Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  useDanceGlossary,
  getInitial,
  type AddTermParams,
  type UpdateTermParams,
} from "@/hooks/use-dance-glossary";
import type { DanceGlossaryEntry, GlossaryCategoryNew } from "@/types";

// ─── 카테고리 메타 ────────────────────────────────────────────
const CATEGORY_META: Record<
  GlossaryCategoryNew,
  { label: string; color: string }
> = {
  basic:     { label: "기초",   color: "bg-blue-100 text-blue-700" },
  technique: { label: "기술",   color: "bg-purple-100 text-purple-700" },
  formation: { label: "대형",   color: "bg-green-100 text-green-700" },
  rhythm:    { label: "리듬",   color: "bg-orange-100 text-orange-700" },
  style:     { label: "스타일", color: "bg-pink-100 text-pink-700" },
  stage:     { label: "무대",   color: "bg-cyan-100 text-cyan-700" },
  other:     { label: "기타",   color: "bg-gray-100 text-gray-700" },
};

const CATEGORY_OPTIONS: GlossaryCategoryNew[] = [
  "basic",
  "technique",
  "formation",
  "rhythm",
  "style",
  "stage",
  "other",
];

// ─── 관련 용어 태그 입력 컴포넌트 ────────────────────────────
function RelatedTermsInput({
  value,
  onChange,
}: {
  value: string[];
  onChange: (terms: string[]) => void;
}) {
  const [input, setInput] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && input.trim()) {
      e.preventDefault();
      const newTerm = input.trim();
      if (!value.includes(newTerm)) {
        onChange([...value, newTerm]);
      }
      setInput("");
    }
    if (e.key === "Backspace" && !input && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const removeTerm = (term: string) => {
    onChange(value.filter((t) => t !== term));
  };

  return (
    <div className="rounded-md border border-gray-200 bg-white px-2 py-1.5 focus-within:ring-1 focus-within:ring-gray-300">
      <div className="flex flex-wrap gap-1 mb-1">
        {value.map((t) => (
          <span
            key={t}
            className="flex items-center gap-0.5 rounded bg-violet-100 px-1.5 py-0.5 text-[11px] text-violet-700"
          >
            {t}
            <button
              type="button"
              onClick={() => removeTerm(t)}
              className="ml-0.5 hover:text-red-500"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={
          value.length === 0 ? "입력 후 Enter 또는 , 로 추가" : "용어 추가..."
        }
        className="w-full text-xs outline-none placeholder:text-gray-400"
      />
    </div>
  );
}

// ─── 단일 용어 아이템 ─────────────────────────────────────────
function TermItem({
  entry,
  allTerms,
  onDelete,
  onEdit,
  onJumpToTerm,
}: {
  entry: DanceGlossaryEntry;
  allTerms: DanceGlossaryEntry[];
  onDelete: () => void;
  onEdit: (id: string, patch: UpdateTermParams) => void;
  onJumpToTerm: (term: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editTerm, setEditTerm] = useState(entry.term);
  const [editDef, setEditDef] = useState(entry.definition);
  const [editCategory, setEditCategory] = useState<GlossaryCategoryNew>(
    entry.category
  );
  const [editRelated, setEditRelated] = useState<string[]>(
    entry.relatedTerms ?? []
  );
  const [editExample, setEditExample] = useState(entry.example ?? "");

  const catMeta = CATEGORY_META[entry.category];

  const handleSave = () => {
    if (!editTerm.trim()) {
      toast.error("용어명을 입력해주세요.");
      return;
    }
    if (!editDef.trim()) {
      toast.error("정의를 입력해주세요.");
      return;
    }
    onEdit(entry.id, {
      term: editTerm,
      definition: editDef,
      category: editCategory,
      relatedTerms: editRelated,
      example: editExample || undefined,
    });
    toast.success("용어가 수정되었습니다.");
    setEditing(false);
  };

  const handleCancelEdit = () => {
    setEditTerm(entry.term);
    setEditDef(entry.definition);
    setEditCategory(entry.category);
    setEditRelated(entry.relatedTerms ?? []);
    setEditExample(entry.example ?? "");
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 space-y-2">
        <input
          type="text"
          value={editTerm}
          onChange={(e) => setEditTerm(e.target.value.slice(0, 60))}
          className="w-full rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-300"
          placeholder="용어명"
        />
        <div>
          <Textarea
            value={editDef}
            onChange={(e) => setEditDef(e.target.value.slice(0, 500))}
            className="min-h-[60px] resize-none text-xs"
            placeholder="정의 (최대 500자)"
          />
          <p className="mt-0.5 text-right text-[10px] text-gray-400">
            {editDef.length}/500
          </p>
        </div>
        <select
          value={editCategory}
          onChange={(e) =>
            setEditCategory(e.target.value as GlossaryCategoryNew)
          }
          className="w-full rounded-md border border-gray-200 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-300"
        >
          {CATEGORY_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_META[c].label}
            </option>
          ))}
        </select>
        <div>
          <p className="mb-1 text-[10px] text-gray-500">관련 용어</p>
          <RelatedTermsInput value={editRelated} onChange={setEditRelated} />
        </div>
        <input
          type="text"
          value={editExample}
          onChange={(e) => setEditExample(e.target.value.slice(0, 200))}
          className="w-full rounded-md border border-gray-200 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-300"
          placeholder="사용 예시 (선택)"
        />
        <div className="flex justify-end gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={handleCancelEdit}
          >
            <X className="mr-1 h-3 w-3" />
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSave}>
            <Check className="mr-1 h-3 w-3" />
            저장
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-100 bg-white p-3 shadow-sm">
      {/* 헤더: 용어명 + 배지 + 버튼 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-semibold text-gray-900">
            {entry.term}
          </span>
          <Badge
            className={`text-[10px] px-1.5 py-0 ${catMeta.color} hover:${catMeta.color}`}
          >
            {catMeta.label}
          </Badge>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-gray-400 hover:text-blue-500"
            onClick={() => setEditing(true)}
            title="수정"
          >
            <Pencil className="h-3 w-3" />
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

      {/* 정의 */}
      <p className="mt-1.5 text-xs leading-relaxed text-gray-700">
        {entry.definition}
      </p>

      {/* 관련 용어 링크 */}
      {entry.relatedTerms && entry.relatedTerms.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1">
          <Link2 className="h-3 w-3 text-gray-400" />
          {entry.relatedTerms.map((related) => {
            const exists = allTerms.some(
              (t) => t.term.toLowerCase() === related.toLowerCase()
            );
            return (
              <button
                key={related}
                type="button"
                onClick={() => exists && onJumpToTerm(related)}
                className={`text-[11px] rounded px-1.5 py-0.5 transition-colors ${
                  exists
                    ? "text-violet-600 bg-violet-50 hover:bg-violet-100 cursor-pointer"
                    : "text-gray-400 bg-gray-50 cursor-default"
                }`}
                title={exists ? `'${related}' 용어로 이동` : "등록되지 않은 용어"}
              >
                {related}
              </button>
            );
          })}
        </div>
      )}

      {/* 예시 */}
      {entry.example && (
        <p className="mt-1.5 text-[11px] italic text-gray-400">
          예) {entry.example}
        </p>
      )}

      {/* 등록자 */}
      <p className="mt-1.5 text-[10px] text-gray-400">등록: {entry.addedBy}</p>
    </div>
  );
}

// ─── 추가 다이얼로그 ──────────────────────────────────────────
function AddTermDialog({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (params: AddTermParams) => boolean;
}) {
  const [term, setTerm] = useState("");
  const [definition, setDefinition] = useState("");
  const [category, setCategory] = useState<GlossaryCategoryNew>("basic");
  const [relatedTerms, setRelatedTerms] = useState<string[]>([]);
  const [example, setExample] = useState("");
  const [addedBy, setAddedBy] = useState("");
  const { pending: submitting, execute } = useAsyncAction();

  const reset = () => {
    setTerm("");
    setDefinition("");
    setCategory("basic");
    setRelatedTerms([]);
    setExample("");
    setAddedBy("");
  };

  const handleSubmit = async () => {
    if (!term.trim()) {
      toast.error("용어명을 입력해주세요.");
      return;
    }
    if (!definition.trim()) {
      toast.error("정의를 입력해주세요.");
      return;
    }
    await execute(async () => {
      const ok = onAdd({ term, definition, category, relatedTerms, example, addedBy });
      if (ok) {
        toast.success("용어가 등록되었습니다.");
        reset();
        onClose();
      } else {
        toast.error("용어 등록에 실패했습니다.");
      }
    });
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">새 용어 등록</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* 용어명 */}
          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-600">
              용어명 <span className="text-red-400">*</span>
            </label>
            <Input
              value={term}
              onChange={(e) => setTerm(e.target.value.slice(0, 60))}
              placeholder="예: 팝핑, Groove, 웨이브"
              className="h-8 text-xs"
            />
          </div>

          {/* 정의 */}
          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-600">
              정의 <span className="text-red-400">*</span>
            </label>
            <Textarea
              value={definition}
              onChange={(e) => setDefinition(e.target.value.slice(0, 500))}
              placeholder="용어에 대한 설명 (최대 500자)"
              className="min-h-[80px] resize-none text-xs"
            />
            <p className="mt-0.5 text-right text-[10px] text-gray-400">
              {definition.length}/500
            </p>
          </div>

          {/* 카테고리 */}
          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-600">
              카테고리
            </label>
            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as GlossaryCategoryNew)
              }
              className="w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-300"
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_META[c].label}
                </option>
              ))}
            </select>
          </div>

          {/* 관련 용어 */}
          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-600">
              관련 용어
            </label>
            <RelatedTermsInput value={relatedTerms} onChange={setRelatedTerms} />
          </div>

          {/* 예시 */}
          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-600">
              사용 예시 (선택)
            </label>
            <Input
              value={example}
              onChange={(e) => setExample(e.target.value.slice(0, 200))}
              placeholder="예: 팝핑은 힙합 댄스의 기초 기술입니다."
              className="h-8 text-xs"
            />
          </div>

          {/* 등록자 */}
          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-600">
              등록자 (선택)
            </label>
            <Input
              value={addedBy}
              onChange={(e) => setAddedBy(e.target.value.slice(0, 30))}
              placeholder="이름을 입력하세요"
              className="h-8 text-xs"
            />
          </div>
        </div>

        <DialogFooter className="gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={handleClose}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSubmit}
            disabled={submitting}
          >
            <Plus className="mr-1 h-3 w-3" />
            등록
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── 알파벳/가나다 인덱스 바 ─────────────────────────────────
function AlphaIndexBar({
  indexKeys,
  onJump,
}: {
  indexKeys: string[];
  onJump: (key: string) => void;
}) {
  if (indexKeys.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {indexKeys.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => onJump(key)}
          className="min-w-[24px] rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[11px] font-medium text-gray-600 hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200 transition-colors"
        >
          {key}
        </button>
      ))}
    </div>
  );
}

// ─── 통계 패널 ───────────────────────────────────────────────
function StatsPanel({
  totalTerms,
  categoryDistribution,
}: {
  totalTerms: number;
  categoryDistribution: Partial<Record<GlossaryCategoryNew, number>>;
}) {
  const entries = Object.entries(categoryDistribution).sort(
    ([, a], [, b]) => (b ?? 0) - (a ?? 0)
  );

  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
      <div className="mb-2 flex items-center gap-1.5">
        <BarChart2 className="h-3.5 w-3.5 text-gray-500" />
        <span className="text-xs font-medium text-gray-700">
          총 {totalTerms}개 용어
        </span>
      </div>
      {entries.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {entries.map(([cat, count]) => {
            const meta = CATEGORY_META[cat as GlossaryCategoryNew];
            if (!meta) return null;
            return (
              <span
                key={cat}
                className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${meta.color}`}
              >
                {meta.label} {count}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── 메인 카드 ────────────────────────────────────────────────
interface DanceGlossaryCardProps {
  groupId: string;
}

export function DanceGlossaryCard({ groupId }: DanceGlossaryCardProps) {
  const [open, setOpen] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    GlossaryCategoryNew | "all"
  >("all");
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const {
    entries,
    totalTerms,
    categoryDistribution,


    addTerm,
    updateTerm,
    deleteTerm,
    searchTerms,

  } = useDanceGlossary(groupId);

  // 필터링된 목록 계산
  const filteredEntries = useCallback((): DanceGlossaryEntry[] => {
    let result = searchQuery.trim()
      ? searchTerms(searchQuery)
      : entries;
    if (selectedCategory !== "all") {
      result = result.filter((e) => e.category === selectedCategory);
    }
    return result;
  }, [entries, searchQuery, searchTerms, selectedCategory]);

  const displayEntries = filteredEntries();

  // 필터된 용어로 인덱스 그룹 재계산
  const filteredIndexGroups = useCallback((): Map<
    string,
    DanceGlossaryEntry[]
  > => {
    const map = new Map<string, DanceGlossaryEntry[]>();
    for (const e of displayEntries) {
      const initial = getInitial(e.term);
      if (!map.has(initial)) map.set(initial, []);
      map.get(initial)!.push(e);
    }
    return map;
  }, [displayEntries]);

  const filteredIndexKeys = useCallback((): string[] => {
    return Array.from(filteredIndexGroups().keys()).sort((a, b) =>
      a.localeCompare(b, "ko", { sensitivity: "base" })
    );
  }, [filteredIndexGroups]);

  const displayIndexGroups = filteredIndexGroups();
  const displayIndexKeys = filteredIndexKeys();

  const handleDelete = (id: string) => {
    deleteTerm(id);
    toast.success("용어가 삭제되었습니다.");
  };

  const handleJump = (key: string) => {
    const el = sectionRefs.current[key];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // 관련 용어 클릭 시 해당 초성 섹션으로 스크롤
  const handleJumpToTerm = (termName: string) => {
    const initial = getInitial(termName);
    const el = sectionRefs.current[initial];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const activeFilterCount =
    (selectedCategory !== "all" ? 1 : 0) + (searchQuery.trim() ? 1 : 0);

  return (
    <>
      <Collapsible open={open} onOpenChange={setOpen}>
        {/* 헤더 */}
        <div className="flex items-center justify-between rounded-t-lg border border-b-0 border-gray-200 bg-white px-4 py-2.5">
          <div className="flex items-center gap-2">
            <BookText className="h-4 w-4 text-violet-500" />
            <span className="text-sm font-semibold text-gray-800">
              댄스 용어 사전
            </span>
            {totalTerms > 0 && (
              <Badge className="bg-violet-100 text-[10px] px-1.5 py-0 text-violet-600 hover:bg-violet-100">
                {totalTerms}
              </Badge>
            )}
            {activeFilterCount > 0 && (
              <Badge className="bg-orange-100 text-[10px] px-1.5 py-0 text-orange-600 hover:bg-orange-100">
                필터 {activeFilterCount}
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
            {/* 검색 바 */}
            <div className="relative mb-3">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="용어명 또는 정의 검색..."
                className="h-8 pl-8 text-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* 카테고리 칩 필터 */}
            <div className="mb-4 flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className={`rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors ${
                  selectedCategory === "all"
                    ? "border-violet-400 bg-violet-100 text-violet-700"
                    : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                }`}
              >
                전체
              </button>
              {CATEGORY_OPTIONS.map((cat) => {
                const meta = CATEGORY_META[cat];
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() =>
                      setSelectedCategory(isActive ? "all" : cat)
                    }
                    className={`rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors ${
                      isActive
                        ? `border-transparent ${meta.color}`
                        : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>

            {/* 알파벳/가나다 인덱스 바 */}
            {displayIndexKeys.length > 0 && (
              <div className="mb-3">
                <AlphaIndexBar
                  indexKeys={displayIndexKeys}
                  onJump={handleJump}
                />
              </div>
            )}

            {/* 용어 목록 */}
            {displayEntries.length > 0 ? (
              <div className="mb-4 space-y-4">
                {displayIndexKeys.map((key) => {
                  const groupEntries = displayIndexGroups.get(key) ?? [];
                  return (
                    <div
                      key={key}
                      ref={(el) => {
                        sectionRefs.current[key] = el;
                      }}
                    >
                      {/* 섹션 헤더 */}
                      <div className="mb-1.5 flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded bg-violet-100 text-[11px] font-bold text-violet-700">
                          {key}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {groupEntries.length}개
                        </span>
                      </div>
                      <div className="space-y-2">
                        {groupEntries.map((e) => (
                          <TermItem
                            key={e.id}
                            entry={e}
                            allTerms={entries}
                            onDelete={() => handleDelete(e.id)}
                            onEdit={updateTerm}
                            onJumpToTerm={handleJumpToTerm}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mb-4 flex flex-col items-center justify-center gap-1.5 py-8 text-gray-400">
                <BookText className="h-8 w-8 opacity-30" />
                {searchQuery || selectedCategory !== "all" ? (
                  <p className="text-xs">검색 결과가 없습니다.</p>
                ) : (
                  <p className="text-xs">아직 등록된 용어가 없습니다.</p>
                )}
              </div>
            )}

            <Separator className="mb-4" />

            {/* 통계 */}
            {totalTerms > 0 && (
              <div className="mb-4">
                <StatsPanel
                  totalTerms={totalTerms}
                  categoryDistribution={categoryDistribution}
                />
              </div>
            )}

            {/* 용어 추가 버튼 */}
            <Button
              size="sm"
              variant="outline"
              className="h-7 w-full text-xs"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="mr-1 h-3 w-3" />
              용어 추가
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* 추가 다이얼로그 */}
      <AddTermDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onAdd={addTerm}
      />
    </>
  );
}
