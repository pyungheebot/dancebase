"use client";

import { useState } from "react";
import { useChoreographyNotes } from "@/hooks/use-choreography-notes";
import type { ChoreographyNote, ChoreographySection } from "@/types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  ChevronDown,
  ChevronRight,
  Music2,
  Plus,
  Trash2,
  Clock,
  Users,
  AlignLeft,
} from "lucide-react";
import { toast } from "sonner";

// ============================================
// 시간 파싱/비교 유틸
// ============================================

function parseTime(t: string): number {
  const parts = t.split(":").map(Number);
  if (parts.length === 2) {
    const [m, s] = parts;
    return (m ?? 0) * 60 + (s ?? 0);
  }
  return 0;
}

function sortSections(sections: ChoreographySection[]): ChoreographySection[] {
  return [...sections].sort(
    (a, b) => parseTime(a.startTime) - parseTime(b.startTime)
  );
}

// ============================================
// 섹션 추가 인라인 폼
// ============================================

interface SectionFormValues {
  startTime: string;
  endTime: string;
  title: string;
  description: string;
  formation: string;
}

const EMPTY_SECTION_FORM: SectionFormValues = {
  startTime: "",
  endTime: "",
  title: "",
  description: "",
  formation: "",
};

interface AddSectionFormProps {
  noteId: string;
  onAdd: (
    noteId: string,
    section: Omit<ChoreographySection, "id" | "createdAt">
  ) => boolean;
  sectionCount: number;
}

function AddSectionForm({ noteId, onAdd, sectionCount }: AddSectionFormProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<SectionFormValues>(EMPTY_SECTION_FORM);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(
    field: keyof SectionFormValues,
    value: string
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit() {
    if (!form.title.trim()) {
      toast.error("구간 제목을 입력하세요.");
      return;
    }
    if (!form.startTime.trim() || !form.endTime.trim()) {
      toast.error("시작/종료 시간을 입력하세요.");
      return;
    }
    setSubmitting(true);
    const ok = onAdd(noteId, {
      startTime: form.startTime.trim(),
      endTime: form.endTime.trim(),
      title: form.title.trim(),
      description: form.description.trim(),
      formation: form.formation.trim(),
    });
    setSubmitting(false);
    if (ok) {
      toast.success("구간이 추가되었습니다.");
      setForm(EMPTY_SECTION_FORM);
      setOpen(false);
    } else {
      toast.error("구간은 노트당 최대 20개까지 추가할 수 있습니다.");
    }
  }

  if (sectionCount >= 20) return null;

  if (!open) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-7 text-xs text-muted-foreground w-full justify-start gap-1 mt-1"
        onClick={() => setOpen(true)}
      >
        <Plus className="h-3 w-3" />
        구간 추가
      </Button>
    );
  }

  return (
    <div className="mt-2 border rounded-md p-3 space-y-2 bg-muted/30">
      <p className="text-xs font-medium text-muted-foreground">새 구간 추가</p>

      {/* 시간 구간 */}
      <div className="flex gap-2 items-center">
        <div className="flex-1">
          <Label className="text-[10px] text-muted-foreground mb-0.5 block">
            시작
          </Label>
          <Input
            value={form.startTime}
            onChange={(e) => handleChange("startTime", e.target.value)}
            placeholder="0:00"
            className="h-7 text-xs"
          />
        </div>
        <span className="text-xs text-muted-foreground mt-4">~</span>
        <div className="flex-1">
          <Label className="text-[10px] text-muted-foreground mb-0.5 block">
            종료
          </Label>
          <Input
            value={form.endTime}
            onChange={(e) => handleChange("endTime", e.target.value)}
            placeholder="0:30"
            className="h-7 text-xs"
          />
        </div>
      </div>

      {/* 제목 */}
      <div>
        <Label className="text-[10px] text-muted-foreground mb-0.5 block">
          구간 제목
        </Label>
        <Input
          value={form.title}
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder="예: 인트로, 버스1, 후렴"
          className="h-7 text-xs"
        />
      </div>

      {/* 동작 설명 */}
      <div>
        <Label className="text-[10px] text-muted-foreground mb-0.5 block">
          동작 설명
        </Label>
        <Textarea
          value={form.description}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="동작 설명을 입력하세요"
          className="text-xs resize-none min-h-[56px]"
        />
      </div>

      {/* 대형 */}
      <div>
        <Label className="text-[10px] text-muted-foreground mb-0.5 block">
          대형
        </Label>
        <Input
          value={form.formation}
          onChange={(e) => handleChange("formation", e.target.value)}
          placeholder="예: 2열 나란히, 삼각형"
          className="h-7 text-xs"
        />
      </div>

      <div className="flex gap-1.5 pt-1">
        <Button
          size="sm"
          className="h-7 text-xs flex-1"
          onClick={handleSubmit}
          disabled={submitting}
        >
          <Plus className="h-3 w-3 mr-1" />
          추가
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={() => {
            setOpen(false);
            setForm(EMPTY_SECTION_FORM);
          }}
        >
          취소
        </Button>
      </div>
    </div>
  );
}

// ============================================
// 섹션 행
// ============================================

interface SectionRowProps {
  section: ChoreographySection;
  onDelete: () => void;
}

function SectionRow({ section, onDelete }: SectionRowProps) {
  return (
    <div className="group border rounded-md p-2.5 space-y-1.5 bg-background hover:bg-muted/20 transition-colors">
      {/* 시간 + 제목 */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Badge className="text-[10px] px-1.5 py-0 shrink-0 bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100">
            <Clock className="h-2.5 w-2.5 mr-0.5" />
            {section.startTime} ~ {section.endTime}
          </Badge>
          <span className="text-xs font-medium truncate">{section.title}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          onClick={onDelete}
        >
          <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
        </Button>
      </div>

      {/* 동작 설명 */}
      {section.description && (
        <div className="flex items-start gap-1">
          <AlignLeft className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {section.description}
          </p>
        </div>
      )}

      {/* 대형 */}
      {section.formation && (
        <div className="flex items-center gap-1">
          <Users className="h-3 w-3 text-muted-foreground shrink-0" />
          <p className="text-[11px] text-muted-foreground truncate">
            {section.formation}
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================
// 노트 아이템
// ============================================

interface NoteItemProps {
  note: ChoreographyNote;
  onDelete: () => void;
  onAddSection: (
    noteId: string,
    section: Omit<ChoreographySection, "id" | "createdAt">
  ) => boolean;
  onDeleteSection: (noteId: string, sectionId: string) => void;
}

function NoteItem({
  note,
  onDelete,
  onAddSection,
  onDeleteSection,
}: NoteItemProps) {
  const [expanded, setExpanded] = useState(false);
  const sorted = sortSections(note.sections);

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <div className="border rounded-md overflow-hidden">
        {/* 헤더 */}
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-muted/30 transition-colors group">
            <div className="flex items-center gap-2 min-w-0">
              {expanded ? (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              )}
              <Music2 className="h-3.5 w-3.5 text-purple-500 shrink-0" />
              <span className="text-sm font-medium truncate">{note.title}</span>
              <Badge className="text-[10px] px-1.5 py-0 bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-100 shrink-0">
                {note.sections.length}구간
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
            </Button>
          </div>
        </CollapsibleTrigger>

        {/* 섹션 목록 */}
        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-1.5 border-t pt-2">
            {sorted.length === 0 ? (
              <p className="text-[11px] text-muted-foreground py-2 text-center">
                아직 등록된 구간이 없습니다.
              </p>
            ) : (
              sorted.map((section) => (
                <SectionRow
                  key={section.id}
                  section={section}
                  onDelete={() => onDeleteSection(note.id, section.id)}
                />
              ))
            )}

            <AddSectionForm
              noteId={note.id}
              onAdd={onAddSection}
              sectionCount={note.sections.length}
            />
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// ============================================
// 메인 카드
// ============================================

interface ChoreographyNotesCardProps {
  groupId: string;
  projectId: string;
}

export function ChoreographyNotesCard({
  groupId,
  projectId,
}: ChoreographyNotesCardProps) {
  const { notes, loading, canAddNote, addNote, deleteNote, addSection, deleteSection } =
    useChoreographyNotes(groupId, projectId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [cardExpanded, setCardExpanded] = useState(true);

  function handleAddNote() {
    if (!newTitle.trim()) {
      toast.error("곡명을 입력하세요.");
      return;
    }
    const ok = addNote(newTitle.trim());
    if (ok) {
      toast.success("안무 노트가 추가되었습니다.");
      setNewTitle("");
      setDialogOpen(false);
    } else {
      toast.error("안무 노트는 최대 5개까지 추가할 수 있습니다.");
    }
  }

  function handleDeleteNote(noteId: string, noteTitle: string) {
    deleteNote(noteId);
    toast.success(`"${noteTitle}" 노트가 삭제되었습니다.`);
  }

  return (
    <>
      <Collapsible open={cardExpanded} onOpenChange={setCardExpanded}>
        <div className="border rounded-lg overflow-hidden">
          {/* 카드 헤더 */}
          <div className="flex items-center justify-between px-4 py-3 bg-card border-b">
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-2 text-left min-w-0">
                {cardExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <Music2 className="h-4 w-4 text-purple-500 shrink-0" />
                <span className="text-sm font-semibold">안무 노트</span>
                {notes.length > 0 && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-100">
                    {notes.length}/5
                  </Badge>
                )}
              </button>
            </CollapsibleTrigger>
            {canAddNote && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs shrink-0"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                곡 추가
              </Button>
            )}
          </div>

          {/* 노트 목록 */}
          <CollapsibleContent>
            <div className="p-4 space-y-2">
              {loading ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  불러오는 중...
                </p>
              ) : notes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Music2 className="h-8 w-8 mb-2 opacity-20" />
                  <p className="text-xs">등록된 안무 노트가 없습니다.</p>
                  <p className="text-[10px] mt-0.5">
                    위 &apos;곡 추가&apos; 버튼으로 노트를 생성하세요.
                  </p>
                </div>
              ) : (
                notes.map((note) => (
                  <NoteItem
                    key={note.id}
                    note={note}
                    onDelete={() => handleDeleteNote(note.id, note.title)}
                    onAddSection={addSection}
                    onDeleteSection={deleteSection}
                  />
                ))
              )}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* 노트 추가 다이얼로그 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Music2 className="h-4 w-4 text-purple-500" />
              안무 노트 추가
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Label className="text-xs text-muted-foreground mb-1.5 block">
              곡명
            </Label>
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="예: Dynamite, 팝핑 메들리"
              className="text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddNote();
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={() => {
                setDialogOpen(false);
                setNewTitle("");
              }}
            >
              취소
            </Button>
            <Button
              size="sm"
              className="h-8 text-xs"
              onClick={handleAddNote}
              disabled={!newTitle.trim()}
            >
              추가
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
