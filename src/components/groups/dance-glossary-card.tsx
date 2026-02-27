"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Plus,
  Search,
  Trash2,
  Pencil,
  X,
  Check,
  BarChart2,
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
  useDanceGlossary,
  getInitial,
  type AddTermParams,
} from "@/hooks/use-dance-glossary";
import type { GlossaryCategory, GlossaryTerm } from "@/types";

// ─── 카테고리 메타 ────────────────────────────────────────────
const CATEGORY_META: Record<
  GlossaryCategory,
  { label: string; color: string }
> = {
  basic:       { label: "기초",        color: "bg-blue-100 text-blue-700" },
  hiphop:      { label: "힙합",        color: "bg-purple-100 text-purple-700" },
  popping:     { label: "팝핑",        color: "bg-orange-100 text-orange-700" },
  locking:     { label: "락킹",        color: "bg-yellow-100 text-yellow-700" },
  breaking:    { label: "브레이킹",    color: "bg-red-100 text-red-700" },
  waacking:    { label: "왁킹",        color: "bg-pink-100 text-pink-700" },
  contemporary:{ label: "컨템포러리",  color: "bg-teal-100 text-teal-700" },
  general:     { label: "일반",        color: "bg-gray-100 text-gray-700" },
};

const CATEGORY_OPTIONS: GlossaryCategory[] = [
  "basic", "hiphop", "popping", "locking", "breaking",
  "waacking", "contemporary", "general",
];

// ─── 난이도 메타 ─────────────────────────────────────────────
const DIFFICULTY_META: Record<
  GlossaryTerm["difficulty"],
  { label: string; color: string }
> = {
  beginner:     { label: "초급", color: "bg-green-100 text-green-700" },
  intermediate: { label: "중급", color: "bg-yellow-100 text-yellow-700" },
  advanced:     { label: "고급", color: "bg-red-100 text-red-700" },
};

const DIFFICULTY_OPTIONS: GlossaryTerm["difficulty"][] = [
  "beginner", "intermediate", "advanced",
];

// ─── 단일 용어 아이템 ─────────────────────────────────────────
function TermItem({
  term,
  onDelete,
  onEdit,
}: {
  term: GlossaryTerm;
  onDelete: () => void;
  onEdit: (id: string, patch: Partial<GlossaryTerm>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editTerm, setEditTerm] = useState(term.term);
  const [editDef, setEditDef] = useState(term.definition);
  const [editCategory, setEditCategory] = useState<GlossaryCategory>(term.category);
  const [editDifficulty, setEditDifficulty] = useState<GlossaryTerm["difficulty"]>(term.difficulty);
  const [editExample, setEditExample] = useState(term.example);

  const catMeta = CATEGORY_META[term.category];
  const diffMeta = DIFFICULTY_META[term.difficulty];

  const handleSave = () => {
    if (!editTerm.trim()) {
      toast.error("용어명을 입력해주세요.");
      return;
    }
    if (!editDef.trim()) {
      toast.error("정의를 입력해주세요.");
      return;
    }
    onEdit(term.id, {
      term: editTerm,
      definition: editDef,
      category: editCategory,
      difficulty: editDifficulty,
      example: editExample,
    });
    toast.success("용어가 수정되었습니다.");
    setEditing(false);
  };

  const handleCancelEdit = () => {
    setEditTerm(term.term);
    setEditDef(term.definition);
    setEditCategory(term.category);
    setEditDifficulty(term.difficulty);
    setEditExample(term.example);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
        <input
          type="text"
          value={editTerm}
          onChange={(e) => setEditTerm(e.target.value.slice(0, 60))}
          className="mb-2 w-full rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-300"
          placeholder="용어명"
        />
        <Textarea
          value={editDef}
          onChange={(e) => setEditDef(e.target.value.slice(0, 500))}
          className="mb-1 min-h-[60px] resize-none text-xs"
          placeholder="정의 (최대 500자)"
        />
        <p className="mb-2 text-right text-[10px] text-gray-400">
          {editDef.length}/500
        </p>
        <div className="mb-2 flex gap-2">
          <select
            value={editCategory}
            onChange={(e) => setEditCategory(e.target.value as GlossaryCategory)}
            className="flex-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-300"
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_META[c].label}
              </option>
            ))}
          </select>
          <select
            value={editDifficulty}
            onChange={(e) =>
              setEditDifficulty(e.target.value as GlossaryTerm["difficulty"])
            }
            className="flex-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-300"
          >
            {DIFFICULTY_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {DIFFICULTY_META[d].label}
              </option>
            ))}
          </select>
        </div>
        <input
          type="text"
          value={editExample}
          onChange={(e) => setEditExample(e.target.value.slice(0, 200))}
          className="mb-3 w-full rounded-md border border-gray-200 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-300"
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
          <span className="text-sm font-semibold text-gray-900">{term.term}</span>
          <Badge
            className={`text-[10px] px-1.5 py-0 ${catMeta.color} hover:${catMeta.color}`}
          >
            {catMeta.label}
          </Badge>
          <Badge
            className={`text-[10px] px-1.5 py-0 ${diffMeta.color} hover:${diffMeta.color}`}
          >
            {diffMeta.label}
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
        {term.definition}
      </p>

      {/* 예시 */}
      {term.example && (
        <p className="mt-1 text-[11px] italic text-gray-400">
          예) {term.example}
        </p>
      )}

      {/* 등록자 */}
      <p className="mt-1.5 text-[10px] text-gray-400">
        등록: {term.addedBy}
      </p>
    </div>
  );
}

// ─── 추가 폼 ─────────────────────────────────────────────────
function AddTermForm({
  onAdd,
}: {
  onAdd: (params: AddTermParams) => boolean;
}) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [definition, setDefinition] = useState("");
  const [category, setCategory] = useState<GlossaryCategory>("general");
  const [difficulty, setDifficulty] =
    useState<GlossaryTerm["difficulty"]>("beginner");
  const [example, setExample] = useState("");
  const [addedBy, setAddedBy] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!term.trim()) {
      toast.error("용어명을 입력해주세요.");
      return;
    }
    if (!definition.trim()) {
      toast.error("정의를 입력해주세요.");
      return;
    }
    setSubmitting(true);
    const ok = onAdd({ term, definition, category, difficulty, example, addedBy });
    setSubmitting(false);
    if (ok) {
      toast.success("용어가 등록되었습니다.");
      setTerm("");
      setDefinition("");
      setCategory("general");
      setDifficulty("beginner");
      setExample("");
      setAddedBy("");
      setOpen(false);
    } else {
      toast.error("용어 등록에 실패했습니다.");
    }
  };

  if (!open) {
    return (
      <Button
        size="sm"
        variant="outline"
        className="h-7 w-full text-xs"
        onClick={() => setOpen(true)}
      >
        <Plus className="mr-1 h-3 w-3" />
        용어 추가
      </Button>
    );
  }

  return (
    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3">
      <p className="mb-2 text-xs font-medium text-gray-600">새 용어 등록</p>

      {/* 용어명 */}
      <input
        type="text"
        value={term}
        onChange={(e) => setTerm(e.target.value.slice(0, 60))}
        placeholder="용어명 (예: 팝핑, Groove)"
        className="mb-2 w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"
      />

      {/* 정의 */}
      <Textarea
        value={definition}
        onChange={(e) => setDefinition(e.target.value.slice(0, 500))}
        placeholder="용어 정의 (최대 500자)"
        className="mb-1 min-h-[80px] resize-none text-xs"
      />
      <p className="mb-2 text-right text-[10px] text-gray-400">
        {definition.length}/500
      </p>

      {/* 카테고리 + 난이도 */}
      <div className="mb-2 flex gap-2">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as GlossaryCategory)}
          className="flex-1 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-300"
        >
          {CATEGORY_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_META[c].label}
            </option>
          ))}
        </select>
        <select
          value={difficulty}
          onChange={(e) =>
            setDifficulty(e.target.value as GlossaryTerm["difficulty"])
          }
          className="flex-1 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-300"
        >
          {DIFFICULTY_OPTIONS.map((d) => (
            <option key={d} value={d}>
              {DIFFICULTY_META[d].label}
            </option>
          ))}
        </select>
      </div>

      {/* 예시 */}
      <input
        type="text"
        value={example}
        onChange={(e) => setExample(e.target.value.slice(0, 200))}
        placeholder="사용 예시 (선택)"
        className="mb-2 w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"
      />

      {/* 등록자 */}
      <input
        type="text"
        value={addedBy}
        onChange={(e) => setAddedBy(e.target.value.slice(0, 30))}
        placeholder="등록자 이름 (선택)"
        className="mb-3 w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"
      />

      <div className="flex gap-1.5">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 flex-1 text-xs"
          onClick={() => setOpen(false)}
        >
          취소
        </Button>
        <Button
          size="sm"
          className="h-7 flex-1 text-xs"
          onClick={handleSubmit}
          disabled={submitting}
        >
          <Plus className="mr-1 h-3 w-3" />
          등록
        </Button>
      </div>
    </div>
  );
}

// ─── 알파벳 인덱스 바 ────────────────────────────────────────
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
          className="min-w-[24px] rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[11px] font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
        >
          {key}
        </button>
      ))}
    </div>
  );
}

// ─── 통계 패널 ───────────────────────────────────────────────
function StatsPanel({
  totalCount,
  categoryCount,
}: {
  totalCount: number;
  categoryCount: Record<string, number>;
}) {
  const entries = Object.entries(categoryCount).sort(([, a], [, b]) => b - a);

  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
      <div className="mb-2 flex items-center gap-1.5">
        <BarChart2 className="h-3.5 w-3.5 text-gray-500" />
        <span className="text-xs font-medium text-gray-700">
          총 {totalCount}개 용어
        </span>
      </div>
      {entries.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {entries.map(([cat, count]) => {
            const meta = CATEGORY_META[cat as GlossaryCategory];
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
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const {
    filteredTerms,
    totalCount,
    categoryCount,
    indexGroups,
    indexKeys,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedDifficulty,
    setSelectedDifficulty,
    addTerm,
    updateTerm,
    deleteTerm,
  } = useDanceGlossary(groupId);

  const handleDelete = (id: string) => {
    deleteTerm(id);
    toast.success("용어가 삭제되었습니다.");
  };

  const handleJump = (key: string) => {
    const el = sectionRefs.current[key];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const activeFilterCount =
    (selectedCategory !== "all" ? 1 : 0) +
    (selectedDifficulty !== "all" ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      {/* 헤더 */}
      <div className="flex items-center justify-between rounded-t-lg border border-b-0 border-gray-200 bg-white px-4 py-2.5">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-violet-500" />
          <span className="text-sm font-semibold text-gray-800">
            댄스 용어 사전
          </span>
          {totalCount > 0 && (
            <Badge className="bg-violet-100 text-[10px] px-1.5 py-0 text-violet-600 hover:bg-violet-100">
              {totalCount}
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

          {/* 카테고리 필터 */}
          <div className="mb-2 flex flex-wrap gap-1">
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

          {/* 난이도 필터 */}
          <div className="mb-4 flex gap-1">
            <button
              type="button"
              onClick={() => setSelectedDifficulty("all")}
              className={`rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors ${
                selectedDifficulty === "all"
                  ? "border-gray-400 bg-gray-200 text-gray-700"
                  : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
              }`}
            >
              전체 난이도
            </button>
            {DIFFICULTY_OPTIONS.map((diff) => {
              const meta = DIFFICULTY_META[diff];
              const isActive = selectedDifficulty === diff;
              return (
                <button
                  key={diff}
                  type="button"
                  onClick={() =>
                    setSelectedDifficulty(isActive ? "all" : diff)
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

          {/* 알파벳 인덱스 */}
          {indexKeys.length > 0 && (
            <div className="mb-3">
              <AlphaIndexBar indexKeys={indexKeys} onJump={handleJump} />
            </div>
          )}

          {/* 용어 목록 (초성 그룹) */}
          {filteredTerms.length > 0 ? (
            <div className="mb-4 space-y-4">
              {indexKeys.map((key) => {
                const groupTerms = indexGroups.get(key) ?? [];
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
                        {groupTerms.length}개
                      </span>
                    </div>
                    <div className="space-y-2">
                      {groupTerms.map((t) => (
                        <TermItem
                          key={t.id}
                          term={t}
                          onDelete={() => handleDelete(t.id)}
                          onEdit={updateTerm}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mb-4 flex flex-col items-center justify-center gap-1.5 py-8 text-gray-400">
              <BookOpen className="h-8 w-8 opacity-30" />
              {searchQuery || selectedCategory !== "all" || selectedDifficulty !== "all" ? (
                <p className="text-xs">검색 결과가 없습니다.</p>
              ) : (
                <p className="text-xs">아직 등록된 용어가 없습니다.</p>
              )}
            </div>
          )}

          <Separator className="mb-4" />

          {/* 통계 */}
          {totalCount > 0 && (
            <div className="mb-4">
              <StatsPanel totalCount={totalCount} categoryCount={categoryCount} />
            </div>
          )}

          {/* 용어 추가 폼 */}
          <AddTermForm onAdd={addTerm} />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
