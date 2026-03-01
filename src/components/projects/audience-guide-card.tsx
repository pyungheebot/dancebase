/**
 * 관객 안내 매뉴얼 카드 (컨테이너)
 *
 * 편집 탭과 미리보기 탭으로 구성되며, 각 서브컴포넌트를 조합한다.
 *
 * 서브컴포넌트 구성:
 *  - audience-guide-types.ts  : 공유 타입/상수/SectionTypeBadge
 *  - faq-edit-item.tsx        : FAQPreviewItem, FAQEditItem
 *  - section-edit-card.tsx    : SectionEditCard
 *  - section-preview-card.tsx : SectionPreviewCard
 *  - audience-guide-dialog.tsx: AudienceGuideDialog (섹션 추가)
 */

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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  BookOpen,
  Plus,
  Pencil,
  Eye,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useAudienceGuide } from "@/hooks/use-audience-guide";
import { SectionEditCard } from "./section-edit-card";
import { SectionPreviewCard } from "./section-preview-card";
import { AudienceGuideDialog } from "./audience-guide-dialog";
import type { AudienceGuideSectionType } from "@/types";

// ============================================================
// Props
// ============================================================

interface AudienceGuideCardProps {
  groupId: string;
  projectId: string;
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export function AudienceGuideCard({
  groupId,
  projectId,
}: AudienceGuideCardProps) {
  const {
    entry,
    sections,
    visibleSections,
    updateManualInfo,
    addSection,
    updateSection,
    removeSection,
    moveSectionUp,
    moveSectionDown,
    toggleSectionVisibility,
    addFAQ,
    updateFAQ,
    removeFAQ,
    moveFAQUp,
    moveFAQDown,
  } = useAudienceGuide(groupId, projectId);

  // ── 섹션 추가 다이얼로그 상태 ──
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newSectionType, setNewSectionType] =
    useState<AudienceGuideSectionType>("general");
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [newSectionContent, setNewSectionContent] = useState("");

  // ── 매뉴얼 기본 정보 편집 상태 ──
  const [editingInfo, setEditingInfo] = useState(false);
  const [infoDraft, setInfoDraft] = useState({
    title: entry.title,
    description: entry.description,
  });

  /** 섹션 추가 확인 */
  function handleAddSection() {
    if (!newSectionTitle.trim()) {
      toast.error(TOAST.AUDIENCE_GUIDE.SECTION_TITLE_REQUIRED);
      return;
    }
    addSection(newSectionType, newSectionTitle, newSectionContent);
    // 폼 초기화
    setNewSectionTitle("");
    setNewSectionContent("");
    setNewSectionType("general");
    setAddDialogOpen(false);
    toast.success(TOAST.AUDIENCE_GUIDE.SECTION_ADDED);
  }

  /** 섹션 추가 취소 - 폼 초기화 */
  function handleCancelAddSection() {
    setNewSectionTitle("");
    setNewSectionContent("");
    setNewSectionType("general");
    setAddDialogOpen(false);
  }

  /** 매뉴얼 기본 정보 저장 */
  function handleSaveInfo() {
    if (!infoDraft.title.trim()) {
      toast.error(TOAST.AUDIENCE_GUIDE.MANUAL_TITLE_REQUIRED);
      return;
    }
    updateManualInfo({
      title: infoDraft.title.trim(),
      description: infoDraft.description.trim(),
    });
    setEditingInfo(false);
    toast.success(TOAST.AUDIENCE_GUIDE.MANUAL_INFO_SAVED);
  }

  /** 편집 탭으로 전환 시 draft 동기화 */
  function handleTabChange(tab: string) {
    if (tab === "edit") {
      setInfoDraft({ title: entry.title, description: entry.description });
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-indigo-500" aria-hidden />
              관객 안내 매뉴얼
            </span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              섹션 {sections.length}개
            </Badge>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          <Tabs defaultValue="edit" onValueChange={handleTabChange}>
            <TabsList className="h-7 text-xs">
              <TabsTrigger value="edit" className="text-xs px-3 h-6">
                편집
              </TabsTrigger>
              <TabsTrigger value="preview" className="text-xs px-3 h-6">
                미리보기
              </TabsTrigger>
            </TabsList>

            {/* ======================== 편집 탭 ======================== */}
            <TabsContent value="edit" className="mt-3 space-y-3">
              {/* 매뉴얼 기본 정보 */}
              <div className="rounded-lg border p-3 space-y-2">
                {editingInfo ? (
                  <>
                    <div>
                      <Label className="text-[10px] text-muted-foreground mb-1 block">
                        매뉴얼 제목
                      </Label>
                      <Input
                        value={infoDraft.title}
                        onChange={(e) =>
                          setInfoDraft((d) => ({
                            ...d,
                            title: e.target.value,
                          }))
                        }
                        className="h-7 text-xs"
                        placeholder="관객 안내 매뉴얼"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground mb-1 block">
                        설명
                      </Label>
                      <Textarea
                        value={infoDraft.description}
                        onChange={(e) =>
                          setInfoDraft((d) => ({
                            ...d,
                            description: e.target.value,
                          }))
                        }
                        rows={2}
                        placeholder="매뉴얼에 대한 간단한 설명..."
                        className="text-xs resize-none"
                      />
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        className="h-6 text-[10px] px-2"
                        onClick={handleSaveInfo}
                      >
                        <Check className="h-3 w-3 mr-1" aria-hidden />
                        저장
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-[10px] px-2"
                        onClick={() => setEditingInfo(false)}
                      >
                        <X className="h-3 w-3 mr-1" aria-hidden />
                        취소
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{entry.title}</p>
                      {entry.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {entry.description}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 shrink-0"
                      onClick={() => {
                        setInfoDraft({
                          title: entry.title,
                          description: entry.description,
                        });
                        setEditingInfo(true);
                      }}
                      aria-label="매뉴얼 정보 수정"
                    >
                      <Pencil className="h-3 w-3" aria-hidden />
                    </Button>
                  </div>
                )}
              </div>

              {/* 섹션 목록 */}
              {sections.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-muted-foreground border rounded-lg border-dashed">
                  <BookOpen className="h-6 w-6 mb-2 opacity-40" aria-hidden />
                  <p className="text-xs">섹션이 없습니다.</p>
                  <p className="text-[10px] mt-0.5">
                    아래 버튼을 눌러 섹션을 추가하세요.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sections.map((section, idx) => (
                    <SectionEditCard
                      key={section.id}
                      section={section}
                      isFirst={idx === 0}
                      isLast={idx === sections.length - 1}
                      onUpdate={updateSection}
                      onRemove={removeSection}
                      onMoveUp={moveSectionUp}
                      onMoveDown={moveSectionDown}
                      onToggleVisibility={toggleSectionVisibility}
                      onAddFAQ={addFAQ}
                      onUpdateFAQ={updateFAQ}
                      onRemoveFAQ={removeFAQ}
                      onMoveFAQUp={moveFAQUp}
                      onMoveFAQDown={moveFAQDown}
                    />
                  ))}
                </div>
              )}

              {/* 섹션 추가 버튼 */}
              <Button
                variant="outline"
                size="sm"
                className="w-full h-7 text-xs"
                onClick={() => setAddDialogOpen(true)}
              >
                <Plus className="h-3 w-3 mr-1" aria-hidden />
                섹션 추가
              </Button>
            </TabsContent>

            {/* ======================== 미리보기 탭 ======================== */}
            <TabsContent value="preview" className="mt-3 space-y-3">
              {/* 매뉴얼 헤더 */}
              <div className="rounded-lg border p-3 bg-indigo-50/50 dark:bg-indigo-950/20">
                <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                  {entry.title}
                </p>
                {entry.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {entry.description}
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground/60 mt-1.5">
                  총 {visibleSections.length}개 섹션
                </p>
              </div>

              {/* 공개된 섹션만 표시 */}
              {visibleSections.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-muted-foreground border rounded-lg border-dashed">
                  <Eye className="h-6 w-6 mb-2 opacity-40" aria-hidden />
                  <p className="text-xs">표시할 섹션이 없습니다.</p>
                  <p className="text-[10px] mt-0.5">
                    편집 탭에서 섹션을 추가하거나 공개로 설정하세요.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {visibleSections.map((section) => (
                    <SectionPreviewCard key={section.id} section={section} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 섹션 추가 다이얼로그 */}
      <AudienceGuideDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        sectionType={newSectionType}
        onSectionTypeChange={setNewSectionType}
        sectionTitle={newSectionTitle}
        onSectionTitleChange={setNewSectionTitle}
        sectionContent={newSectionContent}
        onSectionContentChange={setNewSectionContent}
        onConfirm={handleAddSection}
        onCancel={handleCancelAddSection}
      />
    </>
  );
}
