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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ChevronDown, ChevronUp, Plus, Film, Eye } from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useShowCredits } from "@/hooks/use-show-credits";
import type { CreditSectionType } from "@/types";

import { AddSectionDialog } from "./show-credits-dialogs";
import { CreditsPreview } from "./show-credits-preview";
import { CreditsStats } from "./show-credits-stats";
import { SectionCard } from "./show-credits-section-card";

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

  const sectionListId = "credits-section-list";

  function handleAddSection(type: CreditSectionType, customTitle?: string) {
    addSection(type, customTitle);
    toast.success(TOAST.SHOW_CREDITS.SECTION_ADDED);
  }

  function handleDeleteSection(sectionId: string) {
    const ok = deleteSection(sectionId);
    if (ok) {
      toast.success(TOAST.SHOW_CREDITS.SECTION_DELETED);
    } else {
      toast.error(TOAST.SHOW_CREDITS.SECTION_DELETE_ERROR);
    }
    setDeleteSectionId(null);
  }

  function handleAddPerson(sectionId: string, name: string, role: string) {
    const result = addPerson(sectionId, name, role);
    if (result) {
      toast.success(`${name}님이 추가되었습니다`);
    } else {
      toast.error(TOAST.SHOW_CREDITS.MEMBER_ADD_ERROR);
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
      toast.success(TOAST.UPDATE_SUCCESS);
    } else {
      toast.error(TOAST.UPDATE_ERROR);
    }
  }

  function handleDeletePerson(sectionId: string, personId: string) {
    const ok = deletePerson(sectionId, personId);
    if (!ok) {
      toast.error(TOAST.DELETE_ERROR);
    }
  }

  function handleMoveUp(sectionId: string) {
    const ok = moveSectionUp(sectionId);
    if (!ok) toast.error(TOAST.SHOW_CREDITS.MOVE_ERROR);
  }

  function handleMoveDown(sectionId: string) {
    const ok = moveSectionDown(sectionId);
    if (!ok) toast.error(TOAST.SHOW_CREDITS.MOVE_ERROR);
  }

  function handleEditTitle(sectionId: string, title: string) {
    const ok = updateSectionTitle(sectionId, title);
    if (!ok) toast.error(TOAST.SHOW_CREDITS.TITLE_UPDATE_ERROR);
  }

  return (
    <>
      <Card className="w-full">
        <Collapsible open={cardOpen} onOpenChange={setCardOpen}>
          <CardHeader className="pb-2 pt-3 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Film className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <CardTitle className="text-sm font-semibold" id="credits-card-title">
                  공연 엔딩 크레딧
                </CardTitle>
                {stats.totalPeople > 0 && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0"
                    aria-label={`전체 인원 ${stats.totalPeople}명`}
                  >
                    <span aria-hidden="true">총 {stats.totalPeople}명</span>
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-1" role="toolbar" aria-label="크레딧 관리">
                {/* 프리뷰 */}
                {sections.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => setPreviewOpen(true)}
                    aria-label="크레딧 프리뷰 열기"
                  >
                    <Eye className="h-3 w-3" aria-hidden="true" />
                    프리뷰
                  </Button>
                )}

                {/* 섹션 추가 */}
                <Button
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => setAddSectionOpen(true)}
                  aria-label="크레딧 섹션 추가"
                >
                  <Plus className="h-3 w-3" aria-hidden="true" />
                  섹션 추가
                </Button>

                {/* 열기/닫기 */}
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground"
                    aria-label={cardOpen ? "크레딧 카드 접기" : "크레딧 카드 펼치기"}
                    aria-expanded={cardOpen}
                    aria-controls={sectionListId}
                  >
                    {cardOpen ? (
                      <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>
            </div>
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="px-4 pb-4 pt-0" id={sectionListId}>
              {loading ? (
                <div
                  className="flex items-center justify-center py-6"
                  aria-live="polite"
                  aria-busy="true"
                >
                  <span className="text-xs text-muted-foreground">
                    불러오는 중...
                  </span>
                </div>
              ) : sections.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center py-8 gap-2 text-center"
                  aria-live="polite"
                >
                  <Film className="h-8 w-8 text-muted-foreground/30" aria-hidden="true" />
                  <p className="text-xs text-muted-foreground">
                    크레딧 섹션이 없습니다
                  </p>
                  <p className="text-[10px] text-muted-foreground/70">
                    섹션 추가 버튼으로 출연진, 안무, 음악 등을 등록하세요
                  </p>
                </div>
              ) : (
                <div className="space-y-2" aria-live="polite">
                  {/* 섹션별 통계 요약 */}
                  <CreditsStats
                    sectionStats={stats.sectionStats}
                    totalPeople={stats.totalPeople}
                  />

                  {/* 섹션 목록 */}
                  <div
                    className="space-y-2"
                    role="list"
                    aria-label="크레딧 섹션 목록"
                  >
                    {sections.map((section, idx) => (
                      <div key={section.id} role="listitem">
                        <SectionCard
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
                      </div>
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
      <ConfirmDialog
        open={deleteSectionId !== null}
        onOpenChange={(v) => !v && setDeleteSectionId(null)}
        title="섹션 삭제"
        description="이 섹션과 포함된 모든 인원을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        onConfirm={() => {
          if (deleteSectionId) handleDeleteSection(deleteSectionId);
        }}
        destructive
      />

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
