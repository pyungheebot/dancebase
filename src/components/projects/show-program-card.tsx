"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Pencil,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  User,
  Users,
  Star,
  Heart,
  Mic,
  Building2,
  CalendarDays,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useShowProgram } from "@/hooks/use-show-program";
import type {
  ShowProgramPiece,
  ShowProgramCredit,
  ShowProgramCreditRole,
  ShowProgramSponsor,
} from "@/types";

// ============================================================
// 상수 & 레이블
// ============================================================

const CREDIT_ROLE_LABELS: Record<ShowProgramCreditRole, string> = {
  director: "연출",
  choreographer: "안무",
  music: "음악/음향",
  lighting: "조명",
  costume: "의상",
  makeup: "메이크업",
  stage: "무대 감독",
  photography: "사진/영상",
  design: "디자인",
  sponsor: "후원",
  other: "기타",
};

const CREDIT_ROLE_OPTIONS: ShowProgramCreditRole[] = [
  "director",
  "choreographer",
  "music",
  "lighting",
  "costume",
  "makeup",
  "stage",
  "photography",
  "design",
  "sponsor",
  "other",
];

const CREDIT_ROLE_COLORS: Record<ShowProgramCreditRole, string> = {
  director: "bg-purple-100 text-purple-700 border-purple-300",
  choreographer: "bg-pink-100 text-pink-700 border-pink-300",
  music: "bg-blue-100 text-blue-700 border-blue-300",
  lighting: "bg-yellow-100 text-yellow-700 border-yellow-300",
  costume: "bg-orange-100 text-orange-700 border-orange-300",
  makeup: "bg-rose-100 text-rose-700 border-rose-300",
  stage: "bg-gray-100 text-gray-700 border-gray-300",
  photography: "bg-cyan-100 text-cyan-700 border-cyan-300",
  design: "bg-indigo-100 text-indigo-700 border-indigo-300",
  sponsor: "bg-green-100 text-green-700 border-green-300",
  other: "bg-muted text-muted-foreground border-border",
};

// ============================================================
// 폼 타입
// ============================================================

type BasicInfoForm = {
  showTitle: string;
  showSubtitle: string;
  showDate: string;
  venue: string;
  greeting: string;
  closingMessage: string;
  specialThanks: string;
};

type PieceForm = {
  title: string;
  subtitle: string;
  choreographer: string;
  performers: string;
  duration: string;
  notes: string;
};

type CreditForm = {
  role: ShowProgramCreditRole;
  roleLabel: string;
  names: string;
};

type SponsorForm = {
  name: string;
  tier: string;
  description: string;
};

function emptyPieceForm(): PieceForm {
  return {
    title: "",
    subtitle: "",
    choreographer: "",
    performers: "",
    duration: "",
    notes: "",
  };
}

function emptyCreditForm(): CreditForm {
  return { role: "director", roleLabel: "", names: "" };
}

function emptySponsorForm(): SponsorForm {
  return { name: "", tier: "", description: "" };
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export function ShowProgramCard({
  groupId,
  projectId,
  memberNames = [],
}: {
  groupId: string;
  projectId: string;
  memberNames?: string[];
}) {
  const {
    entry,
    loading,
    stats,
    updateBasicInfo,
    addPiece,
    updatePiece,
    deletePiece,
    movePieceUp,
    movePieceDown,
    addCredit,
    updateCredit,
    deleteCredit,
    addSponsor,
    updateSponsor,
    deleteSponsor,
  } = useShowProgram(groupId, projectId);

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "pieces" | "credits" | "sponsors" | "info"
  >("pieces");
  const [previewMode, setPreviewMode] = useState(false);

  // 기본 정보 편집 다이얼로그
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [infoForm, setInfoForm] = useState<BasicInfoForm>({
    showTitle: "",
    showSubtitle: "",
    showDate: "",
    venue: "",
    greeting: "",
    closingMessage: "",
    specialThanks: "",
  });
  const [infoSaving, setInfoSaving] = useState(false);

  // 프로그램 순서 다이얼로그
  const [pieceDialogOpen, setPieceDialogOpen] = useState(false);
  const [editPieceTarget, setEditPieceTarget] =
    useState<ShowProgramPiece | null>(null);
  const [pieceForm, setPieceForm] = useState<PieceForm>(emptyPieceForm());
  const [pieceSaving, setPieceSaving] = useState(false);

  // 크레딧 다이얼로그
  const [creditDialogOpen, setCreditDialogOpen] = useState(false);
  const [editCreditTarget, setEditCreditTarget] =
    useState<ShowProgramCredit | null>(null);
  const [creditForm, setCreditForm] = useState<CreditForm>(emptyCreditForm());
  const [creditSaving, setCreditSaving] = useState(false);

  // 스폰서 다이얼로그
  const [sponsorDialogOpen, setSponsorDialogOpen] = useState(false);
  const [editSponsorTarget, setEditSponsorTarget] =
    useState<ShowProgramSponsor | null>(null);
  const [sponsorForm, setSponsorForm] = useState<SponsorForm>(
    emptySponsorForm()
  );
  const [sponsorSaving, setSponsorSaving] = useState(false);

  const sortedPieces = [...entry.pieces].sort((a, b) => a.order - b.order);

  // ── 기본 정보 다이얼로그 열기 ──
  function openInfoDialog() {
    setInfoForm({
      showTitle: entry.showTitle,
      showSubtitle: entry.showSubtitle ?? "",
      showDate: entry.showDate ?? "",
      venue: entry.venue ?? "",
      greeting: entry.greeting ?? "",
      closingMessage: entry.closingMessage ?? "",
      specialThanks: entry.specialThanks ?? "",
    });
    setInfoDialogOpen(true);
  }

  async function handleInfoSave() {
    if (!infoForm.showTitle.trim()) {
      toast.error("공연 제목을 입력해주세요.");
      return;
    }
    setInfoSaving(true);
    try {
      await updateBasicInfo({
        showTitle: infoForm.showTitle.trim(),
        showSubtitle: infoForm.showSubtitle.trim() || undefined,
        showDate: infoForm.showDate || undefined,
        venue: infoForm.venue.trim() || undefined,
        greeting: infoForm.greeting.trim() || undefined,
        closingMessage: infoForm.closingMessage.trim() || undefined,
        specialThanks: infoForm.specialThanks.trim() || undefined,
      });
      toast.success("공연 정보가 저장되었습니다.");
      setInfoDialogOpen(false);
    } catch {
      toast.error(TOAST.SAVE_ERROR);
    } finally {
      setInfoSaving(false);
    }
  }

  // ── 프로그램 순서 다이얼로그 열기 ──
  function openAddPiece() {
    setEditPieceTarget(null);
    setPieceForm(emptyPieceForm());
    setPieceDialogOpen(true);
  }

  function openEditPiece(piece: ShowProgramPiece) {
    setEditPieceTarget(piece);
    setPieceForm({
      title: piece.title,
      subtitle: piece.subtitle ?? "",
      choreographer: piece.choreographer ?? "",
      performers: piece.performers.join(", "),
      duration: piece.duration ?? "",
      notes: piece.notes ?? "",
    });
    setPieceDialogOpen(true);
  }

  async function handlePieceSave() {
    if (!pieceForm.title.trim()) {
      toast.error("작품/곡명을 입력해주세요.");
      return;
    }
    setPieceSaving(true);
    try {
      const performers = pieceForm.performers
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const payload = {
        title: pieceForm.title.trim(),
        subtitle: pieceForm.subtitle.trim() || undefined,
        choreographer: pieceForm.choreographer.trim() || undefined,
        performers,
        duration: pieceForm.duration.trim() || undefined,
        notes: pieceForm.notes.trim() || undefined,
      };
      if (editPieceTarget) {
        await updatePiece(editPieceTarget.id, payload);
        toast.success("프로그램 항목이 수정되었습니다.");
      } else {
        await addPiece(payload);
        toast.success("프로그램 항목이 추가되었습니다.");
      }
      setPieceDialogOpen(false);
    } catch {
      toast.error(TOAST.SAVE_ERROR);
    } finally {
      setPieceSaving(false);
    }
  }

  async function handleDeletePiece(piece: ShowProgramPiece) {
    try {
      await deletePiece(piece.id);
      toast.success(`'${piece.title}'이 삭제되었습니다.`);
    } catch {
      toast.error(TOAST.DELETE_ERROR);
    }
  }

  async function handleMovePiece(
    piece: ShowProgramPiece,
    dir: "up" | "down"
  ) {
    try {
      if (dir === "up") await movePieceUp(piece.id);
      else await movePieceDown(piece.id);
    } catch {
      toast.error("순서 변경에 실패했습니다.");
    }
  }

  // ── 크레딧 다이얼로그 열기 ──
  function openAddCredit() {
    setEditCreditTarget(null);
    setCreditForm(emptyCreditForm());
    setCreditDialogOpen(true);
  }

  function openEditCredit(credit: ShowProgramCredit) {
    setEditCreditTarget(credit);
    setCreditForm({
      role: credit.role,
      roleLabel: credit.roleLabel ?? "",
      names: credit.names.join(", "),
    });
    setCreditDialogOpen(true);
  }

  async function handleCreditSave() {
    const names = creditForm.names
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (names.length === 0) {
      toast.error("담당자 이름을 입력해주세요.");
      return;
    }
    setCreditSaving(true);
    try {
      const payload = {
        role: creditForm.role,
        roleLabel: creditForm.roleLabel.trim() || undefined,
        names,
      };
      if (editCreditTarget) {
        await updateCredit(editCreditTarget.id, payload);
        toast.success("크레딧이 수정되었습니다.");
      } else {
        await addCredit(payload);
        toast.success("크레딧이 추가되었습니다.");
      }
      setCreditDialogOpen(false);
    } catch {
      toast.error(TOAST.SAVE_ERROR);
    } finally {
      setCreditSaving(false);
    }
  }

  async function handleDeleteCredit(credit: ShowProgramCredit) {
    try {
      await deleteCredit(credit.id);
      const label =
        credit.role === "other"
          ? (credit.roleLabel ?? "기타")
          : CREDIT_ROLE_LABELS[credit.role];
      toast.success(`'${label}' 크레딧이 삭제되었습니다.`);
    } catch {
      toast.error(TOAST.DELETE_ERROR);
    }
  }

  // ── 스폰서 다이얼로그 열기 ──
  function openAddSponsor() {
    setEditSponsorTarget(null);
    setSponsorForm(emptySponsorForm());
    setSponsorDialogOpen(true);
  }

  function openEditSponsor(sponsor: ShowProgramSponsor) {
    setEditSponsorTarget(sponsor);
    setSponsorForm({
      name: sponsor.name,
      tier: sponsor.tier ?? "",
      description: sponsor.description ?? "",
    });
    setSponsorDialogOpen(true);
  }

  async function handleSponsorSave() {
    if (!sponsorForm.name.trim()) {
      toast.error("스폰서명을 입력해주세요.");
      return;
    }
    setSponsorSaving(true);
    try {
      const payload = {
        name: sponsorForm.name.trim(),
        tier: sponsorForm.tier.trim() || undefined,
        description: sponsorForm.description.trim() || undefined,
      };
      if (editSponsorTarget) {
        await updateSponsor(editSponsorTarget.id, payload);
        toast.success("스폰서가 수정되었습니다.");
      } else {
        await addSponsor(payload);
        toast.success("스폰서가 추가되었습니다.");
      }
      setSponsorDialogOpen(false);
    } catch {
      toast.error(TOAST.SAVE_ERROR);
    } finally {
      setSponsorSaving(false);
    }
  }

  async function handleDeleteSponsor(sponsor: ShowProgramSponsor) {
    try {
      await deleteSponsor(sponsor.id);
      toast.success(`'${sponsor.name}'이 삭제되었습니다.`);
    } catch {
      toast.error(TOAST.DELETE_ERROR);
    }
  }

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity">
                  <BookOpen className="h-4 w-4 text-violet-500" />
                  <CardTitle className="text-sm font-semibold">
                    공연 프로그램 편집
                  </CardTitle>
                  <Badge className="text-[10px] px-1.5 py-0 bg-violet-100 text-violet-800 border border-violet-300">
                    {stats.pieceCount}개 순서
                  </Badge>
                  {isOpen ? (
                    <ChevronUp className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  )}
                </button>
              </CollapsibleTrigger>

              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewMode((v) => !v);
                    if (!isOpen) setIsOpen(true);
                  }}
                >
                  {previewMode ? (
                    <EyeOff className="h-3 w-3 mr-1" />
                  ) : (
                    <Eye className="h-3 w-3 mr-1" />
                  )}
                  {previewMode ? "편집" : "미리보기"}
                </Button>
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    openInfoDialog();
                  }}
                >
                  <Pencil className="h-3 w-3 mr-1" />
                  공연 정보
                </Button>
              </div>
            </div>

            {/* 요약 */}
            {(entry.showTitle || stats.pieceCount > 0) && (
              <div className="mt-1.5 space-y-0.5">
                {entry.showTitle && (
                  <p className="text-xs font-medium text-violet-800">
                    {entry.showTitle}
                    {entry.showSubtitle && (
                      <span className="text-muted-foreground font-normal ml-1">
                        — {entry.showSubtitle}
                      </span>
                    )}
                  </p>
                )}
                <div className="flex gap-3 flex-wrap">
                  {entry.showDate && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <CalendarDays className="h-2.5 w-2.5" />
                      {entry.showDate}
                    </span>
                  )}
                  {entry.venue && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <Building2 className="h-2.5 w-2.5" />
                      {entry.venue}
                    </span>
                  )}
                  {stats.creditCount > 0 && (
                    <span className="text-[10px] text-muted-foreground">
                      크레딧{" "}
                      <span className="font-semibold text-foreground">
                        {stats.creditCount}
                      </span>
                      개
                    </span>
                  )}
                  {stats.sponsorCount > 0 && (
                    <span className="text-[10px] text-muted-foreground">
                      스폰서{" "}
                      <span className="font-semibold text-foreground">
                        {stats.sponsorCount}
                      </span>
                      개
                    </span>
                  )}
                </div>
              </div>
            )}
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="pt-0">
              {loading ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  불러오는 중...
                </p>
              ) : previewMode ? (
                // 미리보기 모드
                <ProgramPreview entry={entry} sortedPieces={sortedPieces} />
              ) : (
                // 편집 모드
                <Tabs
                  value={activeTab}
                  onValueChange={(v) =>
                    setActiveTab(
                      v as "pieces" | "credits" | "sponsors" | "info"
                    )
                  }
                >
                  <TabsList className="h-7 text-xs w-full">
                    <TabsTrigger value="pieces" className="flex-1 text-[11px]">
                      순서 ({stats.pieceCount})
                    </TabsTrigger>
                    <TabsTrigger value="credits" className="flex-1 text-[11px]">
                      크레딧 ({stats.creditCount})
                    </TabsTrigger>
                    <TabsTrigger value="sponsors" className="flex-1 text-[11px]">
                      스폰서 ({stats.sponsorCount})
                    </TabsTrigger>
                    <TabsTrigger value="info" className="flex-1 text-[11px]">
                      인사말
                    </TabsTrigger>
                  </TabsList>

                  {/* 순서 탭 */}
                  <TabsContent value="pieces" className="mt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        프로그램 순서 목록
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] px-2"
                        onClick={openAddPiece}
                      >
                        <Plus className="h-2.5 w-2.5 mr-0.5" />
                        추가
                      </Button>
                    </div>

                    {sortedPieces.length === 0 ? (
                      <p className="text-[10px] text-muted-foreground text-center py-4">
                        프로그램 순서를 추가해보세요.
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {sortedPieces.map((piece, idx) => (
                          <PieceRow
                            key={piece.id}
                            piece={piece}
                            isFirst={idx === 0}
                            isLast={idx === sortedPieces.length - 1}
                            onEdit={() => openEditPiece(piece)}
                            onDelete={() => handleDeletePiece(piece)}
                            onMoveUp={() => handleMovePiece(piece, "up")}
                            onMoveDown={() => handleMovePiece(piece, "down")}
                          />
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* 크레딧 탭 */}
                  <TabsContent value="credits" className="mt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        스태프 크레딧
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] px-2"
                        onClick={openAddCredit}
                      >
                        <Plus className="h-2.5 w-2.5 mr-0.5" />
                        추가
                      </Button>
                    </div>

                    {entry.credits.length === 0 ? (
                      <p className="text-[10px] text-muted-foreground text-center py-4">
                        크레딧을 추가해보세요.
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {entry.credits.map((credit) => (
                          <CreditRow
                            key={credit.id}
                            credit={credit}
                            onEdit={() => openEditCredit(credit)}
                            onDelete={() => handleDeleteCredit(credit)}
                          />
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* 스폰서 탭 */}
                  <TabsContent value="sponsors" className="mt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        스폰서 / 후원
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] px-2"
                        onClick={openAddSponsor}
                      >
                        <Plus className="h-2.5 w-2.5 mr-0.5" />
                        추가
                      </Button>
                    </div>

                    {entry.sponsors.length === 0 ? (
                      <p className="text-[10px] text-muted-foreground text-center py-4">
                        스폰서 정보를 추가해보세요.
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {entry.sponsors.map((sponsor) => (
                          <SponsorRow
                            key={sponsor.id}
                            sponsor={sponsor}
                            onEdit={() => openEditSponsor(sponsor)}
                            onDelete={() => handleDeleteSponsor(sponsor)}
                          />
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* 인사말 탭 */}
                  <TabsContent value="info" className="mt-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        인사말 및 특별 감사
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] px-2"
                        onClick={openInfoDialog}
                      >
                        <Pencil className="h-2.5 w-2.5 mr-0.5" />
                        편집
                      </Button>
                    </div>

                    {entry.greeting ? (
                      <div className="rounded-md border border-violet-200 bg-violet-50 p-3 space-y-1">
                        <p className="text-[10px] font-semibold text-violet-700 flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          인사말
                        </p>
                        <p className="text-xs text-violet-800 whitespace-pre-wrap">
                          {entry.greeting}
                        </p>
                      </div>
                    ) : (
                      <p className="text-[10px] text-muted-foreground text-center py-2">
                        인사말이 없습니다. 편집 버튼을 눌러 추가해보세요.
                      </p>
                    )}

                    {entry.closingMessage && (
                      <div className="rounded-md border border-indigo-200 bg-indigo-50 p-3 space-y-1">
                        <p className="text-[10px] font-semibold text-indigo-700">
                          마무리 인사
                        </p>
                        <p className="text-xs text-indigo-800 whitespace-pre-wrap">
                          {entry.closingMessage}
                        </p>
                      </div>
                    )}

                    {entry.specialThanks && (
                      <div className="rounded-md border border-amber-200 bg-amber-50 p-3 space-y-1">
                        <p className="text-[10px] font-semibold text-amber-700 flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          특별 감사
                        </p>
                        <p className="text-xs text-amber-800 whitespace-pre-wrap">
                          {entry.specialThanks}
                        </p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* 기본 정보 다이얼로그 */}
      <BasicInfoDialog
        open={infoDialogOpen}
        onOpenChange={setInfoDialogOpen}
        form={infoForm}
        setForm={setInfoForm}
        onSave={handleInfoSave}
        saving={infoSaving}
      />

      {/* 프로그램 순서 다이얼로그 */}
      <PieceDialog
        open={pieceDialogOpen}
        onOpenChange={setPieceDialogOpen}
        form={pieceForm}
        setForm={setPieceForm}
        onSave={handlePieceSave}
        saving={pieceSaving}
        isEdit={!!editPieceTarget}
        memberNames={memberNames}
      />

      {/* 크레딧 다이얼로그 */}
      <CreditDialog
        open={creditDialogOpen}
        onOpenChange={setCreditDialogOpen}
        form={creditForm}
        setForm={setCreditForm}
        onSave={handleCreditSave}
        saving={creditSaving}
        isEdit={!!editCreditTarget}
      />

      {/* 스폰서 다이얼로그 */}
      <SponsorDialog
        open={sponsorDialogOpen}
        onOpenChange={setSponsorDialogOpen}
        form={sponsorForm}
        setForm={setSponsorForm}
        onSave={handleSponsorSave}
        saving={sponsorSaving}
        isEdit={!!editSponsorTarget}
      />
    </>
  );
}

// ============================================================
// 미리보기 컴포넌트
// ============================================================

function ProgramPreview({
  entry,
  sortedPieces,
}: {
  entry: ReturnType<typeof useShowProgram>["entry"];
  sortedPieces: ShowProgramPiece[];
}) {
  return (
    <div className="space-y-4 py-2">
      {/* 공연 제목 */}
      <div className="text-center space-y-0.5 border-b pb-3">
        {entry.showTitle ? (
          <>
            <h2 className="text-base font-bold">{entry.showTitle}</h2>
            {entry.showSubtitle && (
              <p className="text-xs text-muted-foreground">
                {entry.showSubtitle}
              </p>
            )}
            <div className="flex justify-center gap-3 mt-1">
              {entry.showDate && (
                <span className="text-[10px] text-muted-foreground">
                  {entry.showDate}
                </span>
              )}
              {entry.venue && (
                <span className="text-[10px] text-muted-foreground">
                  {entry.venue}
                </span>
              )}
            </div>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">
            공연 정보가 없습니다. 편집 버튼을 눌러 입력해보세요.
          </p>
        )}
      </div>

      {/* 인사말 */}
      {entry.greeting && (
        <div className="space-y-1">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
            인사말
          </p>
          <p className="text-xs whitespace-pre-wrap leading-relaxed">
            {entry.greeting}
          </p>
        </div>
      )}

      {/* 프로그램 순서 */}
      {sortedPieces.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
            Program
          </p>
          <div className="space-y-2">
            {sortedPieces.map((piece) => (
              <div
                key={piece.id}
                className="flex gap-3 py-1.5 border-b border-dashed last:border-0"
              >
                <span className="text-[10px] font-bold text-violet-600 w-5 flex-shrink-0 pt-0.5">
                  {piece.order}.
                </span>
                <div className="flex-1 min-w-0 space-y-0.5">
                  <p className="text-xs font-semibold">
                    {piece.title}
                    {piece.subtitle && (
                      <span className="font-normal text-muted-foreground ml-1">
                        — {piece.subtitle}
                      </span>
                    )}
                  </p>
                  {piece.choreographer && (
                    <p className="text-[10px] text-muted-foreground">
                      안무: {piece.choreographer}
                    </p>
                  )}
                  {piece.performers.length > 0 && (
                    <p className="text-[10px] text-muted-foreground">
                      출연: {piece.performers.join(", ")}
                    </p>
                  )}
                  {piece.duration && (
                    <p className="text-[10px] text-muted-foreground">
                      {piece.duration}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 크레딧 */}
      {entry.credits.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
            Credits
          </p>
          <div className="space-y-1">
            {entry.credits.map((credit) => {
              const label =
                credit.role === "other"
                  ? (credit.roleLabel ?? "기타")
                  : CREDIT_ROLE_LABELS[credit.role];
              return (
                <div key={credit.id} className="flex gap-2 text-[10px]">
                  <span className="text-muted-foreground w-20 flex-shrink-0 text-right">
                    {label}
                  </span>
                  <span>{credit.names.join(", ")}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 스폰서 */}
      {entry.sponsors.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
            Sponsors
          </p>
          <div className="flex flex-wrap gap-2">
            {entry.sponsors.map((sponsor) => (
              <div
                key={sponsor.id}
                className="text-[10px] px-2 py-0.5 rounded-full border bg-green-50 border-green-200 text-green-800"
              >
                {sponsor.name}
                {sponsor.tier && (
                  <span className="text-green-600 ml-1">({sponsor.tier})</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 특별 감사 */}
      {entry.specialThanks && (
        <div className="space-y-1">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
            Special Thanks
          </p>
          <p className="text-xs whitespace-pre-wrap text-muted-foreground">
            {entry.specialThanks}
          </p>
        </div>
      )}

      {/* 마무리 인사 */}
      {entry.closingMessage && (
        <div className="border-t pt-3 text-center">
          <p className="text-xs italic text-muted-foreground">
            {entry.closingMessage}
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================
// 프로그램 순서 행 컴포넌트
// ============================================================

function PieceRow({
  piece,
  isFirst,
  isLast,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  piece: ShowProgramPiece;
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <div className="flex items-start gap-2 rounded-md border bg-card p-2 hover:bg-muted/20 transition-colors">
      {/* 순서 번호 */}
      <div className="flex items-center justify-center w-5 h-5 rounded-full bg-violet-100 border-2 border-violet-400 text-[9px] font-bold text-violet-700 flex-shrink-0 mt-0.5">
        {piece.order}
      </div>

      {/* 내용 */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <p className="text-xs font-medium">
          {piece.title}
          {piece.subtitle && (
            <span className="text-[10px] text-muted-foreground font-normal ml-1">
              — {piece.subtitle}
            </span>
          )}
        </p>

        <div className="flex items-center gap-2 flex-wrap">
          {piece.choreographer && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <Mic className="h-2.5 w-2.5" />
              {piece.choreographer}
            </span>
          )}
          {piece.performers.length > 0 && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              {piece.performers.length === 1 ? (
                <User className="h-2.5 w-2.5" />
              ) : (
                <Users className="h-2.5 w-2.5" />
              )}
              {piece.performers.join(", ")}
            </span>
          )}
          {piece.duration && (
            <span className="text-[10px] text-muted-foreground">
              {piece.duration}
            </span>
          )}
        </div>

        {piece.notes && (
          <p className="text-[10px] text-muted-foreground">{piece.notes}</p>
        )}
      </div>

      {/* 액션 */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <Button
          size="sm"
          variant="ghost"
          className="h-5 w-5 p-0"
          onClick={onMoveUp}
          disabled={isFirst}
        >
          <ArrowUp className="h-2.5 w-2.5" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-5 w-5 p-0"
          onClick={onMoveDown}
          disabled={isLast}
        >
          <ArrowDown className="h-2.5 w-2.5" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-5 w-5 p-0"
          onClick={onEdit}
        >
          <Pencil className="h-2.5 w-2.5" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-5 w-5 p-0 text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-2.5 w-2.5" />
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// 크레딧 행 컴포넌트
// ============================================================

function CreditRow({
  credit,
  onEdit,
  onDelete,
}: {
  credit: ShowProgramCredit;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const label =
    credit.role === "other"
      ? (credit.roleLabel ?? "기타")
      : CREDIT_ROLE_LABELS[credit.role];
  const colorClass = CREDIT_ROLE_COLORS[credit.role];

  return (
    <div className="flex items-center gap-2 rounded-md border bg-card p-2 hover:bg-muted/20 transition-colors">
      <Badge className={`text-[9px] px-1.5 py-0 border flex-shrink-0 ${colorClass}`}>
        {label}
      </Badge>
      <p className="flex-1 text-xs min-w-0 truncate">
        {credit.names.join(", ")}
      </p>
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <Button
          size="sm"
          variant="ghost"
          className="h-5 w-5 p-0"
          onClick={onEdit}
        >
          <Pencil className="h-2.5 w-2.5" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-5 w-5 p-0 text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-2.5 w-2.5" />
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// 스폰서 행 컴포넌트
// ============================================================

function SponsorRow({
  sponsor,
  onEdit,
  onDelete,
}: {
  sponsor: ShowProgramSponsor;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border bg-card p-2 hover:bg-muted/20 transition-colors">
      <Star className="h-3 w-3 text-green-500 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium">
          {sponsor.name}
          {sponsor.tier && (
            <Badge className="ml-1 text-[9px] px-1.5 py-0 bg-green-100 text-green-700 border border-green-300">
              {sponsor.tier}
            </Badge>
          )}
        </p>
        {sponsor.description && (
          <p className="text-[10px] text-muted-foreground truncate">
            {sponsor.description}
          </p>
        )}
      </div>
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <Button
          size="sm"
          variant="ghost"
          className="h-5 w-5 p-0"
          onClick={onEdit}
        >
          <Pencil className="h-2.5 w-2.5" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-5 w-5 p-0 text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-2.5 w-2.5" />
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// 기본 정보 편집 다이얼로그
// ============================================================

function BasicInfoDialog({
  open,
  onOpenChange,
  form,
  setForm,
  onSave,
  saving,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: BasicInfoForm;
  setForm: (f: BasicInfoForm) => void;
  onSave: () => void;
  saving: boolean;
}) {
  function set<K extends keyof BasicInfoForm>(key: K, value: BasicInfoForm[K]) {
    setForm({ ...form, [key]: value });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <BookOpen className="h-4 w-4 text-violet-500" />
            공연 기본 정보
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div className="space-y-1">
            <Label className="text-xs">
              공연 제목 <span className="text-destructive">*</span>
            </Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: 봄 정기 공연 2026"
              value={form.showTitle}
              onChange={(e) => set("showTitle", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">부제</Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: 우리들의 이야기"
              value={form.showSubtitle}
              onChange={(e) => set("showSubtitle", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">공연 날짜</Label>
              <Input
                className="h-8 text-xs"
                type="date"
                value={form.showDate}
                onChange={(e) => set("showDate", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">공연 장소</Label>
              <Input
                className="h-8 text-xs"
                placeholder="예: 강남아트센터"
                value={form.venue}
                onChange={(e) => set("venue", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">인사말</Label>
            <Textarea
              className="text-xs min-h-[72px] resize-none"
              placeholder="관객에게 전하는 인사말을 입력하세요."
              value={form.greeting}
              onChange={(e) => set("greeting", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">마무리 인사</Label>
            <Textarea
              className="text-xs min-h-[56px] resize-none"
              placeholder="공연을 마치며 전하는 말을 입력하세요."
              value={form.closingMessage}
              onChange={(e) => set("closingMessage", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">특별 감사</Label>
            <Textarea
              className="text-xs min-h-[56px] resize-none"
              placeholder="특별히 감사한 분들을 입력하세요."
              value={form.specialThanks}
              onChange={(e) => set("specialThanks", e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={onSave}
            disabled={saving}
          >
            {saving ? "저장 중..." : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 프로그램 순서 추가/편집 다이얼로그
// ============================================================

function PieceDialog({
  open,
  onOpenChange,
  form,
  setForm,
  onSave,
  saving,
  isEdit,
  memberNames,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: PieceForm;
  setForm: (f: PieceForm) => void;
  onSave: () => void;
  saving: boolean;
  isEdit: boolean;
  memberNames: string[];
}) {
  function set<K extends keyof PieceForm>(key: K, value: PieceForm[K]) {
    setForm({ ...form, [key]: value });
  }

  function toggleMember(name: string) {
    const current = form.performers
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const next = current.includes(name)
      ? current.filter((n) => n !== name)
      : [...current, name];
    set("performers", next.join(", "));
  }

  const selectedMembers = form.performers
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <BookOpen className="h-4 w-4 text-violet-500" />
            {isEdit ? "프로그램 항목 수정" : "프로그램 순서 추가"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div className="space-y-1">
            <Label className="text-xs">
              작품/곡명 <span className="text-destructive">*</span>
            </Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: Dynamite, 봄날"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">부제</Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: BTS Cover"
              value={form.subtitle}
              onChange={(e) => set("subtitle", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">안무가</Label>
              <Input
                className="h-8 text-xs"
                placeholder="예: 홍길동"
                value={form.choreographer}
                onChange={(e) => set("choreographer", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">소요 시간</Label>
              <Input
                className="h-8 text-xs"
                placeholder="예: 3분 30초"
                value={form.duration}
                onChange={(e) => set("duration", e.target.value)}
              />
            </div>
          </div>

          {/* 출연자 선택 */}
          {memberNames.length > 0 ? (
            <div className="space-y-1">
              <Label className="text-xs">출연자 (다중 선택)</Label>
              <div className="flex flex-wrap gap-1 p-2 rounded-md border bg-muted/30 min-h-[40px]">
                {memberNames.map((name) => {
                  const selected = selectedMembers.includes(name);
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => toggleMember(name)}
                      className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                        selected
                          ? "bg-violet-100 border-violet-400 text-violet-800 font-semibold"
                          : "bg-background border-border text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
              {selectedMembers.length > 0 && (
                <p className="text-[10px] text-muted-foreground">
                  선택됨: {selectedMembers.join(", ")}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              <Label className="text-xs">출연자</Label>
              <Input
                className="h-8 text-xs"
                placeholder="예: 홍길동, 김철수 (쉼표로 구분)"
                value={form.performers}
                onChange={(e) => set("performers", e.target.value)}
              />
            </div>
          )}

          <div className="space-y-1">
            <Label className="text-xs">메모</Label>
            <Textarea
              className="text-xs min-h-[48px] resize-none"
              placeholder="추가 메모 (예: 앙코르 전 인사 포함)"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={onSave}
            disabled={saving}
          >
            {saving ? "저장 중..." : isEdit ? "수정" : "추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 크레딧 추가/편집 다이얼로그
// ============================================================

function CreditDialog({
  open,
  onOpenChange,
  form,
  setForm,
  onSave,
  saving,
  isEdit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: CreditForm;
  setForm: (f: CreditForm) => void;
  onSave: () => void;
  saving: boolean;
  isEdit: boolean;
}) {
  function set<K extends keyof CreditForm>(key: K, value: CreditForm[K]) {
    setForm({ ...form, [key]: value });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-violet-500" />
            {isEdit ? "크레딧 수정" : "크레딧 추가"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div className="space-y-1">
            <Label className="text-xs">
              역할 <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.role}
              onValueChange={(v) => set("role", v as ShowProgramCreditRole)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="역할 선택" />
              </SelectTrigger>
              <SelectContent>
                {CREDIT_ROLE_OPTIONS.map((r) => (
                  <SelectItem key={r} value={r} className="text-xs">
                    {CREDIT_ROLE_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {form.role === "other" && (
            <div className="space-y-1">
              <Label className="text-xs">역할 이름</Label>
              <Input
                className="h-8 text-xs"
                placeholder="예: 진행, 통역"
                value={form.roleLabel}
                onChange={(e) => set("roleLabel", e.target.value)}
              />
            </div>
          )}

          <div className="space-y-1">
            <Label className="text-xs">
              담당자 <span className="text-destructive">*</span>
            </Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: 홍길동, 김철수 (쉼표로 구분)"
              value={form.names}
              onChange={(e) => set("names", e.target.value)}
            />
            <p className="text-[10px] text-muted-foreground">
              여러 명은 쉼표로 구분하세요.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={onSave}
            disabled={saving}
          >
            {saving ? "저장 중..." : isEdit ? "수정" : "추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 스폰서 추가/편집 다이얼로그
// ============================================================

function SponsorDialog({
  open,
  onOpenChange,
  form,
  setForm,
  onSave,
  saving,
  isEdit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: SponsorForm;
  setForm: (f: SponsorForm) => void;
  onSave: () => void;
  saving: boolean;
  isEdit: boolean;
}) {
  function set<K extends keyof SponsorForm>(key: K, value: SponsorForm[K]) {
    setForm({ ...form, [key]: value });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Star className="h-4 w-4 text-green-500" />
            {isEdit ? "스폰서 수정" : "스폰서 추가"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div className="space-y-1">
            <Label className="text-xs">
              스폰서명 <span className="text-destructive">*</span>
            </Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: ○○문화재단"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">등급</Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: 골드, 실버, 브론즈"
              value={form.tier}
              onChange={(e) => set("tier", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">설명</Label>
            <Textarea
              className="text-xs min-h-[48px] resize-none"
              placeholder="스폰서 관련 추가 정보"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={onSave}
            disabled={saving}
          >
            {saving ? "저장 중..." : isEdit ? "수정" : "추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
