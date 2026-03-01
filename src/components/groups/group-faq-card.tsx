"use client";

import { useState, useMemo } from "react";
import {
  HelpCircle,
  ChevronDown,
  Plus,
  Pencil,
  Trash2,
  Pin,
  PinOff,
  Search,
  Loader2,
  ArrowUp,
  ArrowDown,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useGroupFaq } from "@/hooks/use-group-faq";
import {
  GROUP_FAQ_CATEGORIES,
  type GroupFaq,
  type GroupFaqCategory,
} from "@/types";
import { formatYearMonthDay } from "@/lib/date-utils";

// 카테고리 배지 색상
const CATEGORY_COLOR: Record<GroupFaqCategory, string> = {
  가입: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  연습: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  공연: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  회비: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  기타: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

type FaqForm = {
  question: string;
  answer: string;
  category: GroupFaqCategory;
  authorName: string;
};

const DEFAULT_FORM: FaqForm = {
  question: "",
  answer: "",
  category: "기타",
  authorName: "",
};

export function GroupFaqCard({ groupId }: { groupId: string }) {
  const {
    faqs,
    loading,
    addFaq,
    updateFaq,
    deleteFaq,
    togglePin,
    moveFaq,
    categoryStats,
  } = useGroupFaq(groupId);

  // 필터/검색 상태
  const [filterCategory, setFilterCategory] = useState<GroupFaqCategory | "전체">("전체");
  const [searchQuery, setSearchQuery] = useState("");

  // 아코디언 열림 상태
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  // 추가 폼 상태
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<FaqForm>(DEFAULT_FORM);
  const [addSubmitting, setAddSubmitting] = useState(false);

  // 수정 상태
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FaqForm>(DEFAULT_FORM);
  const [editSubmitting, setEditSubmitting] = useState(false);

  // 삭제/순서/고정 로딩 상태
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [pinningId, setPinningId] = useState<string | null>(null);

  // 필터 + 검색 적용된 목록
  const filteredFaqs = useMemo(() => {
    let list = faqs;
    if (filterCategory !== "전체") {
      list = list.filter((f) => f.category === filterCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (f) =>
          f.question.toLowerCase().includes(q) ||
          f.answer.toLowerCase().includes(q)
      );
    }
    return list;
  }, [faqs, filterCategory, searchQuery]);

  // 비고정 항목만 (순서 이동용)
  const unpinnedFaqs = useMemo(() => faqs.filter((f) => !f.pinned), [faqs]);

  const toggleOpen = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // 추가 핸들러
  const handleAddSubmit = async () => {
    if (!addForm.question.trim() || !addForm.answer.trim()) return;
    setAddSubmitting(true);
    const ok = await addFaq({
      question: addForm.question.trim(),
      answer: addForm.answer.trim(),
      category: addForm.category,
      authorName: addForm.authorName.trim(),
    });
    setAddSubmitting(false);
    if (ok) {
      setAddForm(DEFAULT_FORM);
      setShowAddForm(false);
    }
  };

  const handleAddCancel = () => {
    setAddForm(DEFAULT_FORM);
    setShowAddForm(false);
  };

  // 수정 핸들러
  const handleEditStart = (faq: GroupFaq) => {
    setEditingId(faq.id);
    setEditForm({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      authorName: faq.authorName,
    });
    setOpenIds((prev) => {
      const next = new Set(prev);
      next.add(faq.id);
      return next;
    });
  };

  const handleEditSubmit = async (id: string) => {
    if (!editForm.question.trim() || !editForm.answer.trim()) return;
    setEditSubmitting(true);
    const ok = await updateFaq(id, {
      question: editForm.question.trim(),
      answer: editForm.answer.trim(),
      category: editForm.category,
      authorName: editForm.authorName.trim(),
    });
    setEditSubmitting(false);
    if (ok) {
      setEditingId(null);
      setEditForm(DEFAULT_FORM);
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditForm(DEFAULT_FORM);
  };

  // 삭제 핸들러
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await deleteFaq(id);
    setDeletingId(null);
    setOpenIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  // 순서 이동 핸들러
  const handleMove = async (id: string, direction: "up" | "down") => {
    setMovingId(id);
    await moveFaq(id, direction);
    setMovingId(null);
  };

  // 고정 토글 핸들러
  const handleTogglePin = async (id: string) => {
    setPinningId(id);
    await togglePin(id);
    setPinningId(null);
  };

  const totalCount = faqs.length;
  const activeCategoryStats = categoryStats.filter((s) => s.count > 0);

  return (
    <div className="rounded-lg border bg-card px-3 py-3 space-y-3">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <HelpCircle className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">자주 묻는 질문</span>
          {totalCount > 0 && (
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0 h-4"
            >
              {totalCount}
            </Badge>
          )}
        </div>
        {!showAddForm && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs px-2 gap-1"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="h-3 w-3" />
            FAQ 추가
          </Button>
        )}
      </div>

      {/* 카테고리별 통계 */}
      {activeCategoryStats.length > 0 && (
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            className={`text-[10px] px-1.5 py-0.5 rounded-full border transition-colors ${
              filterCategory === "전체"
                ? "bg-foreground text-background border-foreground"
                : "border-border text-muted-foreground hover:border-foreground/40"
            }`}
            onClick={() => setFilterCategory("전체")}
          >
            전체 {totalCount}
          </button>
          {activeCategoryStats.map(({ category, count }) => (
            <button
              key={category}
              type="button"
              className={`text-[10px] px-1.5 py-0.5 rounded-full border transition-colors ${
                filterCategory === category
                  ? "bg-foreground text-background border-foreground"
                  : "border-border text-muted-foreground hover:border-foreground/40"
              }`}
              onClick={() =>
                setFilterCategory(
                  filterCategory === category ? "전체" : category
                )
              }
            >
              {category} {count}
            </button>
          ))}
        </div>
      )}

      {/* 검색 */}
      {totalCount > 0 && (
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="질문 또는 답변 검색..."
            className="h-7 text-xs pl-6 pr-6"
          />
          {searchQuery && (
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      )}

      {/* FAQ 추가 폼 */}
      {showAddForm && (
        <div className="rounded border bg-muted/30 p-3 space-y-2.5">
          <p className="text-[11px] font-medium text-muted-foreground">새 FAQ 추가</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px] text-muted-foreground mb-1 block">
                카테고리
              </Label>
              <Select
                value={addForm.category}
                onValueChange={(v) =>
                  setAddForm((prev) => ({
                    ...prev,
                    category: v as GroupFaqCategory,
                  }))
                }
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GROUP_FAQ_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-xs">
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground mb-1 block">
                작성자명
              </Label>
              <Input
                value={addForm.authorName}
                onChange={(e) =>
                  setAddForm((prev) => ({
                    ...prev,
                    authorName: e.target.value,
                  }))
                }
                placeholder="이름 (선택)"
                className="h-7 text-xs"
              />
            </div>
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">
              질문
            </Label>
            <Input
              value={addForm.question}
              onChange={(e) =>
                setAddForm((prev) => ({ ...prev, question: e.target.value }))
              }
              placeholder="질문을 입력하세요"
              className="h-7 text-xs"
            />
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">
              답변
            </Label>
            <Textarea
              value={addForm.answer}
              onChange={(e) =>
                setAddForm((prev) => ({ ...prev, answer: e.target.value }))
              }
              placeholder="답변을 입력하세요"
              className="text-xs min-h-[80px] resize-none"
            />
          </div>
          <div className="flex items-center gap-1.5 pt-0.5">
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={handleAddSubmit}
              disabled={
                addSubmitting ||
                !addForm.question.trim() ||
                !addForm.answer.trim()
              }
            >
              {addSubmitting && (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              )}
              추가
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={handleAddCancel}
              disabled={addSubmitting}
            >
              취소
            </Button>
          </div>
        </div>
      )}

      {/* FAQ 목록 */}
      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : filteredFaqs.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">
          {searchQuery || filterCategory !== "전체"
            ? "검색 결과가 없습니다"
            : "등록된 FAQ가 없습니다"}
        </p>
      ) : (
        <div className="space-y-1">
          {filteredFaqs.map((faq: GroupFaq) => {
            const isOpen = openIds.has(faq.id);
            const isEditing = editingId === faq.id;
            const isDeleting = deletingId === faq.id;
            const isMoving = movingId === faq.id;
            const isPinning = pinningId === faq.id;
            const unpinnedIndex = unpinnedFaqs.findIndex((f) => f.id === faq.id);

            return (
              <Collapsible
                key={faq.id}
                open={isOpen}
                onOpenChange={() => !isEditing && toggleOpen(faq.id)}
              >
                <div
                  className={`rounded border bg-background overflow-hidden ${
                    faq.pinned
                      ? "border-amber-300 dark:border-amber-700"
                      : ""
                  }`}
                >
                  {/* 질문 헤더 */}
                  <div className="flex items-center gap-1">
                    <CollapsibleTrigger asChild>
                      <button
                        type="button"
                        className="flex-1 flex items-center gap-2 px-2.5 py-2 text-left hover:bg-muted/40 transition-colors min-w-0"
                        disabled={isEditing}
                      >
                        {faq.pinned && (
                          <Pin className="h-2.5 w-2.5 text-amber-500 shrink-0" />
                        )}
                        <span
                          className={`text-xs font-medium leading-tight flex-1 min-w-0 truncate ${
                            CATEGORY_COLOR[faq.category]
                              ? ""
                              : ""
                          }`}
                        >
                          {faq.question}
                        </span>
                        <span
                          className={`text-[9px] px-1 py-0.5 rounded shrink-0 ${CATEGORY_COLOR[faq.category]}`}
                        >
                          {faq.category}
                        </span>
                        <ChevronDown
                          className={`h-3 w-3 text-muted-foreground shrink-0 transition-transform ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    </CollapsibleTrigger>

                    {/* 액션 버튼 */}
                    <div className="flex items-center gap-0.5 pr-1.5 shrink-0">
                      {/* 고정 토글 */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-5 w-5 p-0 ${
                          faq.pinned
                            ? "text-amber-500 hover:text-amber-600"
                            : "text-muted-foreground hover:text-amber-500"
                        }`}
                        onClick={() => handleTogglePin(faq.id)}
                        disabled={isPinning || isDeleting}
                        title={faq.pinned ? "고정 해제" : "고정"}
                      >
                        {isPinning ? (
                          <Loader2 className="h-2.5 w-2.5 animate-spin" />
                        ) : faq.pinned ? (
                          <PinOff className="h-2.5 w-2.5" />
                        ) : (
                          <Pin className="h-2.5 w-2.5" />
                        )}
                      </Button>

                      {/* 순서 이동 (비고정 항목만) */}
                      {!faq.pinned && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
                            onClick={() => handleMove(faq.id, "up")}
                            disabled={
                              unpinnedIndex === 0 || isMoving || isDeleting
                            }
                            title="위로"
                          >
                            {isMoving ? (
                              <Loader2 className="h-2.5 w-2.5 animate-spin" />
                            ) : (
                              <ArrowUp className="h-2.5 w-2.5" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
                            onClick={() => handleMove(faq.id, "down")}
                            disabled={
                              unpinnedIndex === unpinnedFaqs.length - 1 ||
                              isMoving ||
                              isDeleting
                            }
                            title="아래로"
                          >
                            <ArrowDown className="h-2.5 w-2.5" />
                          </Button>
                        </>
                      )}

                      {/* 수정 */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 text-muted-foreground hover:text-blue-500"
                        onClick={() => handleEditStart(faq)}
                        disabled={isDeleting || isMoving || isEditing || isPinning}
                        title="편집"
                      >
                        <Pencil className="h-2.5 w-2.5" />
                      </Button>

                      {/* 삭제 */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(faq.id)}
                        disabled={isDeleting || isMoving || isPinning}
                        title="삭제"
                      >
                        {isDeleting ? (
                          <Loader2 className="h-2.5 w-2.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-2.5 w-2.5" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* 답변 / 수정 폼 */}
                  <CollapsibleContent>
                    <div className="border-t bg-muted/20 px-2.5 py-2">
                      {isEditing ? (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-[10px] text-muted-foreground mb-1 block">
                                카테고리
                              </Label>
                              <Select
                                value={editForm.category}
                                onValueChange={(v) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    category: v as GroupFaqCategory,
                                  }))
                                }
                              >
                                <SelectTrigger className="h-7 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {GROUP_FAQ_CATEGORIES.map((cat) => (
                                    <SelectItem
                                      key={cat}
                                      value={cat}
                                      className="text-xs"
                                    >
                                      {cat}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-[10px] text-muted-foreground mb-1 block">
                                작성자명
                              </Label>
                              <Input
                                value={editForm.authorName}
                                onChange={(e) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    authorName: e.target.value,
                                  }))
                                }
                                placeholder="이름 (선택)"
                                className="h-7 text-xs"
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="text-[10px] text-muted-foreground mb-1 block">
                              질문
                            </Label>
                            <Input
                              value={editForm.question}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  question: e.target.value,
                                }))
                              }
                              placeholder="질문을 입력하세요"
                              className="h-7 text-xs"
                            />
                          </div>
                          <div>
                            <Label className="text-[10px] text-muted-foreground mb-1 block">
                              답변
                            </Label>
                            <Textarea
                              value={editForm.answer}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  answer: e.target.value,
                                }))
                              }
                              placeholder="답변을 입력하세요"
                              className="text-xs min-h-[80px] resize-none"
                            />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Button
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => handleEditSubmit(faq.id)}
                              disabled={
                                editSubmitting ||
                                !editForm.question.trim() ||
                                !editForm.answer.trim()
                              }
                            >
                              {editSubmitting && (
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              )}
                              저장
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={handleEditCancel}
                              disabled={editSubmitting}
                            >
                              취소
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                            {faq.answer}
                          </p>
                          {(faq.authorName || faq.createdAt) && (
                            <div className="flex items-center gap-1.5 pt-1 border-t border-border/50">
                              {faq.authorName && (
                                <span className="text-[10px] text-muted-foreground">
                                  {faq.authorName}
                                </span>
                              )}
                              {faq.authorName && faq.createdAt && (
                                <span className="text-[10px] text-muted-foreground">
                                  ·
                                </span>
                              )}
                              {faq.createdAt && (
                                <span className="text-[10px] text-muted-foreground">
                                  {formatYearMonthDay(faq.createdAt)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </div>
      )}
    </div>
  );
}
