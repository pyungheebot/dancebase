"use client";

import { useState } from "react";
import {
  HelpCircle,
  ChevronDown,
  Plus,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useGroupFaq } from "@/hooks/use-group-faq";
import type { GroupFaq } from "@/types";

interface GroupFaqSectionProps {
  groupId: string;
  canEdit: boolean;
}

type FaqForm = {
  question: string;
  answer: string;
};

const DEFAULT_FORM: FaqForm = {
  question: "",
  answer: "",
};

export function GroupFaqSection({ groupId, canEdit }: GroupFaqSectionProps) {
  const { faqs, loading, addFaq, updateFaq, deleteFaq, moveFaq } =
    useGroupFaq(groupId);

  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<FaqForm>(DEFAULT_FORM);
  const [addSubmitting, setAddSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FaqForm>(DEFAULT_FORM);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);

  const toggleOpen = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleAddSubmit = async () => {
    if (!addForm.question.trim() || !addForm.answer.trim()) return;

    setAddSubmitting(true);
    const ok = await addFaq({
      question: addForm.question.trim(),
      answer: addForm.answer.trim(),
      category: "기타",
      authorName: "",
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

  const handleEditStart = (faq: GroupFaq) => {
    setEditingId(faq.id);
    setEditForm({ question: faq.question, answer: faq.answer });
    // 편집 시 해당 항목 펼치기
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
      category: "기타",
      authorName: "",
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

  const handleMove = async (id: string, direction: "up" | "down") => {
    setMovingId(id);
    await moveFaq(id, direction);
    setMovingId(null);
  };

  return (
    <div className="rounded border bg-card px-3 py-2.5">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1">
          <HelpCircle className="h-3 w-3 text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground font-medium">
            자주 묻는 질문
          </span>
        </div>
        {canEdit && !showAddForm && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[10px] px-1.5 py-0 gap-0.5"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="h-3 w-3" />
            FAQ 추가
          </Button>
        )}
      </div>

      {/* FAQ 추가 폼 */}
      {showAddForm && canEdit && (
        <div className="mb-3 rounded border bg-muted/30 p-2.5 space-y-2">
          <div>
            <Label
              htmlFor="faq-question"
              className="text-[10px] text-muted-foreground mb-1 block"
            >
              질문
            </Label>
            <Input
              id="faq-question"
              value={addForm.question}
              onChange={(e) =>
                setAddForm((prev) => ({ ...prev, question: e.target.value }))
              }
              placeholder="질문을 입력하세요"
              className="h-7 text-xs"
            />
          </div>
          <div>
            <Label
              htmlFor="faq-answer"
              className="text-[10px] text-muted-foreground mb-1 block"
            >
              답변
            </Label>
            <Textarea
              id="faq-answer"
              value={addForm.answer}
              onChange={(e) =>
                setAddForm((prev) => ({ ...prev, answer: e.target.value }))
              }
              placeholder="답변을 입력하세요"
              className="text-xs min-h-[72px] resize-none"
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
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : faqs.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">
          등록된 FAQ가 없습니다
        </p>
      ) : (
        <div className="space-y-1">
          {faqs.map((faq: GroupFaq, index: number) => {
            const isOpen = openIds.has(faq.id);
            const isEditing = editingId === faq.id;
            const isDeleting = deletingId === faq.id;
            const isMoving = movingId === faq.id;

            return (
              <div
                key={faq.id}
                className="rounded border bg-background overflow-hidden"
              >
                {/* 질문 헤더 */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="flex-1 flex items-center justify-between px-2.5 py-2 text-left hover:bg-muted/40 transition-colors"
                    onClick={() => !isEditing && toggleOpen(faq.id)}
                  >
                    <span className="text-xs font-medium leading-tight pr-2">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`h-3 w-3 text-muted-foreground shrink-0 transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* 편집 버튼 */}
                  {canEdit && (
                    <div className="flex items-center gap-0.5 pr-1.5 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
                        onClick={() => handleMove(faq.id, "up")}
                        disabled={index === 0 || isMoving || isDeleting}
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
                          index === faqs.length - 1 || isMoving || isDeleting
                        }
                        title="아래로"
                      >
                        <ArrowDown className="h-2.5 w-2.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 text-muted-foreground hover:text-blue-500"
                        onClick={() => handleEditStart(faq)}
                        disabled={isDeleting || isMoving || isEditing}
                        title="편집"
                      >
                        <Pencil className="h-2.5 w-2.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(faq.id)}
                        disabled={isDeleting || isMoving}
                        title="삭제"
                      >
                        {isDeleting ? (
                          <Loader2 className="h-2.5 w-2.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-2.5 w-2.5" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                {/* 답변 / 편집 폼 */}
                {isOpen && (
                  <div className="border-t bg-muted/20 px-2.5 py-2">
                    {isEditing ? (
                      <div className="space-y-2">
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
                            className="text-xs min-h-[72px] resize-none"
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
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                        {faq.answer}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
