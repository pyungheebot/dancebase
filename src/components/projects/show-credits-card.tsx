"use client";

import { useState, useRef, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Pencil,
  Users,
  Film,
  Eye,
  ArrowUp,
  ArrowDown,
  Star,
  Music,
  Lightbulb,
  Shirt,
  Layout,
  Megaphone,
  Heart,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import {
  useShowCredits,
  CREDIT_SECTION_DEFAULT_TITLES,
} from "@/hooks/use-show-credits";
import type { CreditSection, CreditSectionType } from "@/types";

// ============================================================
// 상수
// ============================================================

const SECTION_TYPE_OPTIONS: { value: CreditSectionType; label: string }[] = [
  { value: "cast", label: "출연진" },
  { value: "choreography", label: "안무" },
  { value: "music", label: "음악" },
  { value: "lighting", label: "조명" },
  { value: "costume", label: "의상" },
  { value: "stage", label: "무대" },
  { value: "planning", label: "기획" },
  { value: "special_thanks", label: "특별 감사" },
];

const SECTION_TYPE_COLORS: Record<CreditSectionType, string> = {
  cast: "bg-purple-100 text-purple-700 border-purple-200",
  choreography: "bg-pink-100 text-pink-700 border-pink-200",
  music: "bg-blue-100 text-blue-700 border-blue-200",
  lighting: "bg-yellow-100 text-yellow-700 border-yellow-200",
  costume: "bg-orange-100 text-orange-700 border-orange-200",
  stage: "bg-green-100 text-green-700 border-green-200",
  planning: "bg-indigo-100 text-indigo-700 border-indigo-200",
  special_thanks: "bg-red-100 text-red-700 border-red-200",
};

function SectionTypeIcon({
  type,
  className,
}: {
  type: CreditSectionType;
  className?: string;
}) {
  const props = { className: className ?? "h-3 w-3" };
  switch (type) {
    case "cast":
      return <Users {...props} />;
    case "choreography":
      return <Star {...props} />;
    case "music":
      return <Music {...props} />;
    case "lighting":
      return <Lightbulb {...props} />;
    case "costume":
      return <Shirt {...props} />;
    case "stage":
      return <Layout {...props} />;
    case "planning":
      return <Megaphone {...props} />;
    case "special_thanks":
      return <Heart {...props} />;
  }
}

// ============================================================
// 섹션 추가 Dialog
// ============================================================

interface AddSectionDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (type: CreditSectionType, customTitle?: string) => void;
}

function AddSectionDialog({ open, onClose, onAdd }: AddSectionDialogProps) {
  const [type, setType] = useState<CreditSectionType>("cast");
  const [customTitle, setCustomTitle] = useState("");

  function handleSubmit() {
    onAdd(type, customTitle || undefined);
    setType("cast");
    setCustomTitle("");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            크레딧 섹션 추가
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">섹션 유형</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as CreditSectionType)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SECTION_TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value} className="text-xs">
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">
              섹션 제목{" "}
              <span className="text-muted-foreground">
                (비워두면 기본값 사용)
              </span>
            </Label>
            <Input
              className="h-8 text-xs"
              placeholder={CREDIT_SECTION_DEFAULT_TITLES[type]}
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={onClose}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            추가
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 인원 추가/수정 Dialog
// ============================================================

interface PersonDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string, role: string) => void;
  initial?: { name: string; role: string };
  mode: "add" | "edit";
}

function PersonDialog({
  open,
  onClose,
  onSave,
  initial,
  mode,
}: PersonDialogProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [role, setRole] = useState(initial?.role ?? "");

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setRole(initial?.role ?? "");
    }
  }, [open, initial]);

  function handleSubmit() {
    if (!name.trim()) {
      toast.error("이름을 입력해주세요");
      return;
    }
    onSave(name, role);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {mode === "add" ? "인원 추가" : "인원 수정"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">이름 *</Label>
            <Input
              className="h-8 text-xs"
              placeholder="홍길동"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">역할/직함</Label>
            <Input
              className="h-8 text-xs"
              placeholder="메인 댄서"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={onClose}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            {mode === "add" ? "추가" : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 크레딧 프리뷰 모달
// ============================================================

interface CreditsPreviewProps {
  open: boolean;
  onClose: () => void;
  sections: CreditSection[];
  projectTitle?: string;
}

function CreditsPreview({
  open,
  onClose,
  sections,
  projectTitle,
}: CreditsPreviewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number | null>(null);
  const [playing, setPlaying] = useState(false);

  // 재생/정지 토글
  function togglePlay() {
    setPlaying((p) => !p);
  }

  // 처음으로
  function reset() {
    setPlaying(false);
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }

  // 스크롤 애니메이션
  useEffect(() => {
    if (!playing) {
      if (animRef.current !== null) {
        cancelAnimationFrame(animRef.current);
        animRef.current = null;
      }
      return;
    }

    let lastTime: number | null = null;
    function step(timestamp: number) {
      if (lastTime === null) lastTime = timestamp;
      const delta = timestamp - lastTime;
      lastTime = timestamp;

      if (scrollRef.current) {
        scrollRef.current.scrollTop += (delta / 1000) * 40; // 40px/s
        const el = scrollRef.current;
        if (el.scrollTop + el.clientHeight >= el.scrollHeight) {
          setPlaying(false);
          return;
        }
      }
      animRef.current = requestAnimationFrame(step);
    }

    animRef.current = requestAnimationFrame(step);
    return () => {
      if (animRef.current !== null) {
        cancelAnimationFrame(animRef.current);
        animRef.current = null;
      }
    };
  }, [playing]);

  // 모달 닫힐 때 정리
  useEffect(() => {
    if (!open) {
      setPlaying(false);
      if (animRef.current !== null) {
        cancelAnimationFrame(animRef.current);
        animRef.current = null;
      }
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <div className="bg-black text-white flex flex-col" style={{ height: "560px" }}>
          {/* 헤더 */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
            <span className="text-xs text-white/60 font-medium tracking-wider uppercase">
              Ending Credits
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[10px] text-white/70 hover:text-white hover:bg-white/10 px-2"
                onClick={reset}
              >
                처음으로
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[10px] text-white hover:bg-white/10 px-2"
                onClick={togglePlay}
              >
                {playing ? "정지" : "재생"}
              </Button>
            </div>
          </div>

          {/* 스크롤 영역 */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto"
            style={{ scrollbarWidth: "none" }}
          >
            <div className="py-16 px-8 text-center space-y-10">
              {/* 공연 제목 */}
              {projectTitle && (
                <div className="mb-12">
                  <p className="text-white/40 text-[10px] tracking-[0.3em] uppercase mb-2">
                    Presented by
                  </p>
                  <h2 className="text-xl font-light tracking-wider text-white">
                    {projectTitle}
                  </h2>
                </div>
              )}

              {/* 섹션 */}
              {sections.map((section) => (
                <div key={section.id} className="space-y-3">
                  <p className="text-[10px] tracking-[0.3em] uppercase text-white/50 font-medium">
                    {section.title}
                  </p>
                  <div className="space-y-1.5">
                    {section.people.length === 0 ? (
                      <p className="text-white/30 text-xs italic">-</p>
                    ) : (
                      section.people.map((person) => (
                        <div key={person.id}>
                          <p className="text-white text-sm font-light">
                            {person.name}
                          </p>
                          {person.role && (
                            <p className="text-white/40 text-[10px]">
                              {person.role}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}

              {/* 엔딩 */}
              <div className="pt-8 pb-4">
                <p className="text-white/20 text-[10px] tracking-[0.2em] uppercase">
                  Thank You
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 섹션 카드
// ============================================================

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

function SectionCard({
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
      <div className="border rounded-lg bg-card overflow-hidden">
        <Collapsible open={open} onOpenChange={setOpen}>
          <div className="flex items-center gap-2 px-3 py-2 bg-muted/30">
            {/* 순서 이동 */}
            <div className="flex flex-col gap-0.5">
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-muted"
                disabled={isFirst}
                onClick={onMoveUp}
              >
                <ArrowUp className="h-2.5 w-2.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-muted"
                disabled={isLast}
                onClick={onMoveDown}
              >
                <ArrowDown className="h-2.5 w-2.5" />
              </Button>
            </div>

            {/* 배지 */}
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 border ${SECTION_TYPE_COLORS[section.type]}`}
            >
              <SectionTypeIcon type={section.type} className="h-2.5 w-2.5 mr-0.5" />
              {SECTION_TYPE_OPTIONS.find((o) => o.value === section.type)
                ?.label ?? section.type}
            </Badge>

            {/* 제목 */}
            {editingTitle ? (
              <Input
                className="h-6 text-xs flex-1"
                value={titleInput}
                autoFocus
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
              >
                {section.title}
              </button>
            )}

            {/* 인원 수 */}
            <span className="text-[10px] text-muted-foreground shrink-0">
              {section.people.length}명
            </span>

            {/* 삭제 */}
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={onDelete}
            >
              <Trash2 className="h-3 w-3" />
            </Button>

            {/* 열기/닫기 */}
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 text-muted-foreground"
              >
                {open ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent>
            <div className="px-3 py-2 space-y-1">
              {section.people.length === 0 ? (
                <p className="text-[10px] text-muted-foreground text-center py-2">
                  인원을 추가해주세요
                </p>
              ) : (
                section.people.map((person) => (
                  <div
                    key={person.id}
                    className="flex items-center gap-2 group"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium">{person.name}</span>
                      {person.role && (
                        <span className="text-[10px] text-muted-foreground ml-1.5">
                          {person.role}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
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
                      >
                        <Pencil className="h-2.5 w-2.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeletePersonId(person.id)}
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}

              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[10px] text-muted-foreground hover:text-primary w-full mt-1"
                onClick={() => setAddPersonOpen(true)}
              >
                <UserPlus className="h-3 w-3 mr-1" />
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
      <AlertDialog
        open={deletePersonId !== null}
        onOpenChange={(v) => !v && setDeletePersonId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm">인원 삭제</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              이 인원을 삭제하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-7 text-xs">취소</AlertDialogCancel>
            <AlertDialogAction
              className="h-7 text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deletePersonId) onDeletePerson(deletePersonId);
                setDeletePersonId(null);
              }}
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ============================================================
// 메인 카드
// ============================================================

interface ShowCreditsCardProps {
  groupId: string;
  projectId: string;
  projectTitle?: string;
}

export function ShowCreditsCard({
  groupId,
  projectId,
  projectTitle,
}: ShowCreditsCardProps) {
  const {
    sections,
    loading,
    addSection,
    updateSectionTitle,
    deleteSection,
    moveSectionUp,
    moveSectionDown,
    addPerson,
    updatePerson,
    deletePerson,
    stats,
  } = useShowCredits(groupId, projectId);

  const [addSectionOpen, setAddSectionOpen] = useState(false);
  const [deleteSectionId, setDeleteSectionId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [cardOpen, setCardOpen] = useState(true);

  function handleAddSection(type: CreditSectionType, customTitle?: string) {
    addSection(type, customTitle);
    toast.success("섹션이 추가되었습니다");
  }

  function handleDeleteSection(sectionId: string) {
    const ok = deleteSection(sectionId);
    if (ok) {
      toast.success("섹션이 삭제되었습니다");
    } else {
      toast.error("섹션 삭제에 실패했습니다");
    }
    setDeleteSectionId(null);
  }

  function handleAddPerson(sectionId: string, name: string, role: string) {
    const result = addPerson(sectionId, name, role);
    if (result) {
      toast.success(`${name}님이 추가되었습니다`);
    } else {
      toast.error("인원 추가에 실패했습니다");
    }
  }

  function handleEditPerson(
    sectionId: string,
    personId: string,
    name: string,
    role: string
  ) {
    const ok = updatePerson(sectionId, personId, name, role);
    if (ok) {
      toast.success("수정되었습니다");
    } else {
      toast.error("수정에 실패했습니다");
    }
  }

  function handleDeletePerson(sectionId: string, personId: string) {
    const ok = deletePerson(sectionId, personId);
    if (!ok) {
      toast.error("삭제에 실패했습니다");
    }
  }

  function handleMoveUp(sectionId: string) {
    const ok = moveSectionUp(sectionId);
    if (!ok) toast.error("이동할 수 없습니다");
  }

  function handleMoveDown(sectionId: string) {
    const ok = moveSectionDown(sectionId);
    if (!ok) toast.error("이동할 수 없습니다");
  }

  function handleEditTitle(sectionId: string, title: string) {
    const ok = updateSectionTitle(sectionId, title);
    if (!ok) toast.error("제목 수정에 실패했습니다");
  }

  return (
    <>
      <Card className="w-full">
        <Collapsible open={cardOpen} onOpenChange={setCardOpen}>
          <CardHeader className="pb-2 pt-3 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Film className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-semibold">
                  공연 엔딩 크레딧
                </CardTitle>
                {stats.totalPeople > 0 && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0"
                  >
                    총 {stats.totalPeople}명
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-1">
                {/* 프리뷰 */}
                {sections.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => setPreviewOpen(true)}
                  >
                    <Eye className="h-3 w-3" />
                    프리뷰
                  </Button>
                )}

                {/* 섹션 추가 */}
                <Button
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => setAddSectionOpen(true)}
                >
                  <Plus className="h-3 w-3" />
                  섹션 추가
                </Button>

                {/* 열기/닫기 */}
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground"
                  >
                    {cardOpen ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>
            </div>
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="px-4 pb-4 pt-0">
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <span className="text-xs text-muted-foreground">
                    불러오는 중...
                  </span>
                </div>
              ) : sections.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
                  <Film className="h-8 w-8 text-muted-foreground/30" />
                  <p className="text-xs text-muted-foreground">
                    크레딧 섹션이 없습니다
                  </p>
                  <p className="text-[10px] text-muted-foreground/70">
                    섹션 추가 버튼으로 출연진, 안무, 음악 등을 등록하세요
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* 섹션별 통계 요약 */}
                  {stats.sectionStats.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {stats.sectionStats.map((s) => (
                        <Badge
                          key={s.id}
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0 gap-0.5"
                        >
                          {s.title}
                          <span className="text-muted-foreground ml-0.5">
                            {s.count}
                          </span>
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* 섹션 목록 */}
                  <div className="space-y-2">
                    {sections.map((section, idx) => (
                      <SectionCard
                        key={section.id}
                        section={section}
                        isFirst={idx === 0}
                        isLast={idx === sections.length - 1}
                        onMoveUp={() => handleMoveUp(section.id)}
                        onMoveDown={() => handleMoveDown(section.id)}
                        onDelete={() => setDeleteSectionId(section.id)}
                        onAddPerson={(name, role) =>
                          handleAddPerson(section.id, name, role)
                        }
                        onEditPerson={(personId, name, role) =>
                          handleEditPerson(section.id, personId, name, role)
                        }
                        onDeletePerson={(personId) =>
                          handleDeletePerson(section.id, personId)
                        }
                        onEditTitle={(title) =>
                          handleEditTitle(section.id, title)
                        }
                      />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* 섹션 추가 Dialog */}
      <AddSectionDialog
        open={addSectionOpen}
        onClose={() => setAddSectionOpen(false)}
        onAdd={handleAddSection}
      />

      {/* 섹션 삭제 확인 */}
      <AlertDialog
        open={deleteSectionId !== null}
        onOpenChange={(v) => !v && setDeleteSectionId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm">섹션 삭제</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              이 섹션과 포함된 모든 인원을 삭제하시겠습니까? 이 작업은
              되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-7 text-xs">취소</AlertDialogCancel>
            <AlertDialogAction
              className="h-7 text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteSectionId) handleDeleteSection(deleteSectionId);
              }}
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 크레딧 프리뷰 */}
      <CreditsPreview
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        sections={sections}
        projectTitle={projectTitle}
      />
    </>
  );
}
