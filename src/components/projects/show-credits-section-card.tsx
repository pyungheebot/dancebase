"use client";

import { memo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  ChevronDown,
  ChevronUp,
  Trash2,
  Pencil,
  ArrowUp,
  ArrowDown,
  UserPlus,
} from "lucide-react";
import type { CreditSection } from "@/types";
import { SECTION_TYPE_COLORS, SECTION_TYPE_OPTIONS } from "./show-credits-types";
import { SectionTypeIcon } from "./show-credits-section-icon";
import { PersonDialog } from "./show-credits-dialogs";

interface SectionCardProps {
  section: CreditSection;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  onAddPerson: (name: string, role: string) => void;
  onEditPerson: (personId: string, name: string, role: string) => void;
  onDeletePerson: (personId: string) => void;
  onEditTitle: (title: string) => void;
}

export const SectionCard = memo(function SectionCard({
  section,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onDelete,
  onAddPerson,
  onEditPerson,
  onDeletePerson,
  onEditTitle,
}: SectionCardProps) {
  const [open, setOpen] = useState(true);
  const [addPersonOpen, setAddPersonOpen] = useState(false);
  const [editPerson, setEditPerson] = useState<{
    id: string;
    name: string;
    role: string;
  } | null>(null);
  const [deletePersonId, setDeletePersonId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(section.title);

  const typeLabel =
    SECTION_TYPE_OPTIONS.find((o) => o.value === section.type)?.label ??
    section.type;

  function handleTitleSave() {
    if (titleInput.trim()) {
      onEditTitle(titleInput.trim());
    } else {
      setTitleInput(section.title);
    }
    setEditingTitle(false);
  }

  return (
    <>
      <div
        className="border rounded-lg bg-card overflow-hidden"
        role="article"
        aria-label={`${section.title} 섹션`}
      >
        <Collapsible open={open} onOpenChange={setOpen}>
          <div className="flex items-center gap-2 px-3 py-2 bg-muted/30">
            {/* 순서 이동 */}
            <div
              className="flex flex-col gap-0.5"
              role="group"
              aria-label={`${section.title} 순서 변경`}
            >
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-muted"
                disabled={isFirst}
                onClick={onMoveUp}
                aria-label={`${section.title} 섹션 위로 이동`}
              >
                <ArrowUp className="h-2.5 w-2.5" aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-muted"
                disabled={isLast}
                onClick={onMoveDown}
                aria-label={`${section.title} 섹션 아래로 이동`}
              >
                <ArrowDown className="h-2.5 w-2.5" aria-hidden="true" />
              </Button>
            </div>

            {/* 유형 배지 */}
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 border ${SECTION_TYPE_COLORS[section.type]}`}
              aria-label={`섹션 유형: ${typeLabel}`}
            >
              <SectionTypeIcon
                type={section.type}
                className="h-2.5 w-2.5 mr-0.5"
              />
              {typeLabel}
            </Badge>

            {/* 제목 */}
            {editingTitle ? (
              <Input
                className="h-6 text-xs flex-1"
                value={titleInput}
                autoFocus
                aria-label="섹션 제목 편집"
                onChange={(e) => setTitleInput(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleTitleSave();
                  if (e.key === "Escape") {
                    setTitleInput(section.title);
                    setEditingTitle(false);
                  }
                }}
              />
            ) : (
              <button
                className="text-xs font-medium flex-1 text-left hover:text-primary truncate"
                onClick={() => setEditingTitle(true)}
                aria-label={`섹션 제목 편집: ${section.title}`}
              >
                {section.title}
              </button>
            )}

            {/* 인원 수 */}
            <span
              className="text-[10px] text-muted-foreground shrink-0"
              aria-label={`인원 ${section.people.length}명`}
            >
              <span aria-hidden="true">{section.people.length}명</span>
            </span>

            {/* 삭제 */}
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={onDelete}
              aria-label={`${section.title} 섹션 삭제`}
            >
              <Trash2 className="h-3 w-3" aria-hidden="true" />
            </Button>

            {/* 열기/닫기 */}
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 text-muted-foreground"
                aria-label={open ? `${section.title} 섹션 접기` : `${section.title} 섹션 펼치기`}
                aria-expanded={open}
              >
                {open ? (
                  <ChevronUp className="h-3 w-3" aria-hidden="true" />
                ) : (
                  <ChevronDown className="h-3 w-3" aria-hidden="true" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent>
            <div
              className="px-3 py-2 space-y-1"
              aria-live="polite"
              aria-label={`${section.title} 인원 목록`}
            >
              {section.people.length === 0 ? (
                <p className="text-[10px] text-muted-foreground text-center py-2">
                  인원을 추가해주세요
                </p>
              ) : (
                <ul role="list" className="space-y-1">
                  {section.people.map((person) => (
                    <li
                      key={person.id}
                      className="flex items-center gap-2 group"
                      role="listitem"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-medium">
                          {person.name}
                        </span>
                        {person.role && (
                          <span className="text-[10px] text-muted-foreground ml-1.5">
                            {person.role}
                          </span>
                        )}
                      </div>
                      <div
                        className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        role="group"
                        aria-label={`${person.name} 관리`}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 text-muted-foreground hover:text-primary"
                          onClick={() =>
                            setEditPerson({
                              id: person.id,
                              name: person.name,
                              role: person.role,
                            })
                          }
                          aria-label={`${person.name} 수정`}
                        >
                          <Pencil className="h-2.5 w-2.5" aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeletePersonId(person.id)}
                          aria-label={`${person.name} 삭제`}
                        >
                          <Trash2 className="h-2.5 w-2.5" aria-hidden="true" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[10px] text-muted-foreground hover:text-primary w-full mt-1"
                onClick={() => setAddPersonOpen(true)}
                aria-label={`${section.title} 섹션에 인원 추가`}
              >
                <UserPlus className="h-3 w-3 mr-1" aria-hidden="true" />
                인원 추가
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* 인원 추가 Dialog */}
      <PersonDialog
        open={addPersonOpen}
        onClose={() => setAddPersonOpen(false)}
        onSave={onAddPerson}
        mode="add"
      />

      {/* 인원 수정 Dialog */}
      <PersonDialog
        open={editPerson !== null}
        onClose={() => setEditPerson(null)}
        initial={editPerson ?? undefined}
        onSave={(name, role) => {
          if (editPerson) onEditPerson(editPerson.id, name, role);
        }}
        mode="edit"
      />

      {/* 인원 삭제 확인 */}
      <ConfirmDialog
        open={deletePersonId !== null}
        onOpenChange={(v) => !v && setDeletePersonId(null)}
        title="인원 삭제"
        description="이 인원을 삭제하시겠습니까?"
        onConfirm={() => {
          if (deletePersonId) onDeletePerson(deletePersonId);
          setDeletePersonId(null);
        }}
        destructive
      />
    </>
  );
});
