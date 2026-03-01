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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  Pencil,
  Eye,
  EyeOff,
  Heart,
  Star,
  Building2,
  CalendarDays,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useShowProgram } from "@/hooks/use-show-program";
import { useAsyncAction } from "@/hooks/use-async-action";
import type {
  ShowProgramPiece,
  ShowProgramCredit,
  ShowProgramSponsor,
} from "@/types";
import { ProgramPreview } from "./show-program-preview";
import { PieceRow, CreditRow, SponsorRow } from "./show-program-rows";
import {
  BasicInfoDialog,
  PieceDialog,
  CreditDialog,
  SponsorDialog,
  type BasicInfoForm,
  type PieceForm,
  type CreditForm,
  type SponsorForm,
  emptyPieceForm,
  emptyCreditForm,
  emptySponsorForm,
} from "./show-program-dialogs";

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

  // useAsyncAction으로 저장 상태 관리
  const { pending: infoSaving, execute: executeInfo } = useAsyncAction();
  const { pending: pieceSaving, execute: executePiece } = useAsyncAction();
  const { pending: creditSaving, execute: executeCredit } = useAsyncAction();
  const { pending: sponsorSaving, execute: executeSponsor } = useAsyncAction();

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

  // 프로그램 순서 다이얼로그
  const [pieceDialogOpen, setPieceDialogOpen] = useState(false);
  const [editPieceTarget, setEditPieceTarget] =
    useState<ShowProgramPiece | null>(null);
  const [pieceForm, setPieceForm] = useState<PieceForm>(emptyPieceForm());

  // 크레딧 다이얼로그
  const [creditDialogOpen, setCreditDialogOpen] = useState(false);
  const [editCreditTarget, setEditCreditTarget] =
    useState<ShowProgramCredit | null>(null);
  const [creditForm, setCreditForm] = useState<CreditForm>(emptyCreditForm());

  // 스폰서 다이얼로그
  const [sponsorDialogOpen, setSponsorDialogOpen] = useState(false);
  const [editSponsorTarget, setEditSponsorTarget] =
    useState<ShowProgramSponsor | null>(null);
  const [sponsorForm, setSponsorForm] = useState<SponsorForm>(
    emptySponsorForm()
  );

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

  const handleInfoSave = () =>
    executeInfo(async () => {
      if (!infoForm.showTitle.trim()) {
        toast.error(TOAST.SHOW_PROGRAM.SHOW_TITLE_REQUIRED);
        return;
      }
      await updateBasicInfo({
        showTitle: infoForm.showTitle.trim(),
        showSubtitle: infoForm.showSubtitle.trim() || undefined,
        showDate: infoForm.showDate || undefined,
        venue: infoForm.venue.trim() || undefined,
        greeting: infoForm.greeting.trim() || undefined,
        closingMessage: infoForm.closingMessage.trim() || undefined,
        specialThanks: infoForm.specialThanks.trim() || undefined,
      });
      toast.success(TOAST.SHOW_PROGRAM.INFO_SAVED);
      setInfoDialogOpen(false);
    }).catch(() => toast.error(TOAST.SAVE_ERROR));

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

  const handlePieceSave = () =>
    executePiece(async () => {
      if (!pieceForm.title.trim()) {
        toast.error(TOAST.SHOW_PROGRAM.PIECE_REQUIRED);
        return;
      }
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
        toast.success(TOAST.SHOW_PROGRAM.PROGRAM_UPDATED);
      } else {
        await addPiece(payload);
        toast.success(TOAST.SHOW_PROGRAM.PROGRAM_ADDED);
      }
      setPieceDialogOpen(false);
    }).catch(() => toast.error(TOAST.SAVE_ERROR));

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
      toast.error(TOAST.ORDER_ERROR);
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

  const handleCreditSave = () =>
    executeCredit(async () => {
      const names = creditForm.names
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (names.length === 0) {
        toast.error(TOAST.SHOW_PROGRAM.CREDIT_MANAGER_REQUIRED);
        return;
      }
      const payload = {
        role: creditForm.role,
        roleLabel: creditForm.roleLabel.trim() || undefined,
        names,
      };
      if (editCreditTarget) {
        await updateCredit(editCreditTarget.id, payload);
        toast.success(TOAST.SHOW_PROGRAM.CREDIT_UPDATED);
      } else {
        await addCredit(payload);
        toast.success(TOAST.SHOW_PROGRAM.CREDIT_ADDED);
      }
      setCreditDialogOpen(false);
    }).catch(() => toast.error(TOAST.SAVE_ERROR));

  async function handleDeleteCredit(credit: ShowProgramCredit) {
    try {
      await deleteCredit(credit.id);
      const label =
        credit.role === "other"
          ? (credit.roleLabel ?? "기타")
          : credit.role;
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

  const handleSponsorSave = () =>
    executeSponsor(async () => {
      if (!sponsorForm.name.trim()) {
        toast.error(TOAST.SHOW_PROGRAM.SPONSOR_NAME_REQUIRED);
        return;
      }
      const payload = {
        name: sponsorForm.name.trim(),
        tier: sponsorForm.tier.trim() || undefined,
        description: sponsorForm.description.trim() || undefined,
      };
      if (editSponsorTarget) {
        await updateSponsor(editSponsorTarget.id, payload);
        toast.success(TOAST.SHOW_PROGRAM.SPONSOR_UPDATED);
      } else {
        await addSponsor(payload);
        toast.success(TOAST.SHOW_PROGRAM.SPONSOR_ADDED);
      }
      setSponsorDialogOpen(false);
    }).catch(() => toast.error(TOAST.SAVE_ERROR));

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
