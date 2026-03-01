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
  MapPin,
  Car,
  Armchair,
  TriangleAlert,
  Heart,
  Siren,
  CircleHelp,
  AlignLeft,
  MessageCircleQuestion,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import {
  useAudienceGuide,
  SECTION_TYPE_LABELS,
  SECTION_TYPE_COLORS,
} from "@/hooks/use-audience-guide";
import type {
  AudienceGuideSectionType,
  AudienceGuideSection,
  AudienceGuideFAQ,
} from "@/types";

// ============================================================
// 상수
// ============================================================

const SECTION_TYPE_ICONS: Record<AudienceGuideSectionType, React.ReactNode> = {
  location: <MapPin className="h-3 w-3" />,
  parking: <Car className="h-3 w-3" />,
  seating: <Armchair className="h-3 w-3" />,
  caution: <TriangleAlert className="h-3 w-3" />,
  etiquette: <Heart className="h-3 w-3" />,
  emergency: <Siren className="h-3 w-3" />,
  faq: <CircleHelp className="h-3 w-3" />,
  general: <AlignLeft className="h-3 w-3" />,
};

const ALL_SECTION_TYPES: AudienceGuideSectionType[] = [
  "location",
  "parking",
  "seating",
  "caution",
  "etiquette",
  "emergency",
  "faq",
  "general",
];

// ============================================================
// 서브 컴포넌트: 섹션 배지
// ============================================================

function SectionTypeBadge({ type }: { type: AudienceGuideSectionType }) {
  return (
    <Badge
      variant="outline"
      className={`text-[10px] px-1.5 py-0 flex items-center gap-1 ${SECTION_TYPE_COLORS[type]}`}
    >
      {SECTION_TYPE_ICONS[type]}
      {SECTION_TYPE_LABELS[type]}
    </Badge>
  );
}

// ============================================================
// 서브 컴포넌트: FAQ 아이템 (미리보기)
// ============================================================

function FAQPreviewItem({ faq }: { faq: AudienceGuideFAQ }) {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="w-full flex items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-xs hover:bg-muted/50 transition-colors"
        >
          <span className="flex items-center gap-1.5 font-medium">
            <MessageCircleQuestion className="h-3 w-3 text-cyan-500 shrink-0" />
            {faq.question}
          </span>
          {open ? (
            <ChevronUp className="h-3 w-3 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
          )}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <p className="px-3 pb-2 text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
          {faq.answer}
        </p>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ============================================================
// 서브 컴포넌트: FAQ 편집 아이템
// ============================================================

function FAQEditItem({
  sectionId,
  faq,
  isFirst,
  isLast,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  sectionId: string;
  faq: AudienceGuideFAQ;
  isFirst: boolean;
  isLast: boolean;
  onUpdate: (
    sectionId: string,
    faqId: string,
    patch: Partial<Pick<AudienceGuideFAQ, "question" | "answer">>
  ) => void;
  onRemove: (sectionId: string, faqId: string) => void;
  onMoveUp: (sectionId: string, faqId: string) => void;
  onMoveDown: (sectionId: string, faqId: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [q, setQ] = useState(faq.question);
  const [a, setA] = useState(faq.answer);

  function handleSave() {
    if (!q.trim() || !a.trim()) {
      toast.error(TOAST.AUDIENCE_GUIDE.QA_REQUIRED);
      return;
    }
    onUpdate(sectionId, faq.id, { question: q.trim(), answer: a.trim() });
    setEditing(false);
    toast.success(TOAST.AUDIENCE_GUIDE.FAQ_UPDATED);
  }

  function handleCancel() {
    setQ(faq.question);
    setA(faq.answer);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="border rounded-md p-2 space-y-1.5 bg-muted/30">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="질문"
          className="h-7 text-xs"
        />
        <Textarea
          value={a}
          onChange={(e) => setA(e.target.value)}
          placeholder="답변"
          rows={2}
          className="text-xs resize-none"
        />
        <div className="flex gap-1">
          <Button
            size="sm"
            className="h-6 text-[10px] px-2"
            onClick={handleSave}
          >
            <Check className="h-3 w-3 mr-1" />
            저장
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 text-[10px] px-2"
            onClick={handleCancel}
          >
            <X className="h-3 w-3 mr-1" />
            취소
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-md px-2 py-1.5 flex items-start gap-1 group hover:bg-muted/20 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium line-clamp-1">{faq.question}</p>
        <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">
          {faq.answer}
        </p>
      </div>
      <div className="flex shrink-0 gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          disabled={isFirst}
          onClick={() => onMoveUp(sectionId, faq.id)}
          title="위로"
        >
          <ArrowUp className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          disabled={isLast}
          onClick={() => onMoveDown(sectionId, faq.id)}
          title="아래로"
        >
          <ArrowDown className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => setEditing(true)}
          title="수정"
        >
          <Pencil className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
          onClick={() => {
            onRemove(sectionId, faq.id);
            toast.success(TOAST.AUDIENCE_GUIDE.FAQ_DELETED);
          }}
          title="삭제"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// 서브 컴포넌트: 섹션 카드 (편집 모드)
// ============================================================

function SectionEditCard({
  section,
  isFirst,
  isLast,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  onToggleVisibility,
  onAddFAQ,
  onUpdateFAQ,
  onRemoveFAQ,
  onMoveFAQUp,
  onMoveFAQDown,
}: {
  section: AudienceGuideSection;
  isFirst: boolean;
  isLast: boolean;
  onUpdate: (
    id: string,
    patch: Partial<
      Pick<AudienceGuideSection, "type" | "title" | "content" | "isVisible">
    >
  ) => void;
  onRemove: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onAddFAQ: (sectionId: string, q: string, a: string) => void;
  onUpdateFAQ: (
    sectionId: string,
    faqId: string,
    patch: Partial<Pick<AudienceGuideFAQ, "question" | "answer">>
  ) => void;
  onRemoveFAQ: (sectionId: string, faqId: string) => void;
  onMoveFAQUp: (sectionId: string, faqId: string) => void;
  onMoveFAQDown: (sectionId: string, faqId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(section.title);
  const [contentDraft, setContentDraft] = useState(section.content);
  const [editingContent, setEditingContent] = useState(false);
  const [showFAQForm, setShowFAQForm] = useState(false);
  const [faqQ, setFaqQ] = useState("");
  const [faqA, setFaqA] = useState("");

  const sortedFaqs = [...section.faqs].sort((a, b) => a.order - b.order);

  function handleTitleSave() {
    if (!titleDraft.trim()) {
      toast.error(TOAST.AUDIENCE_GUIDE.SECTION_TITLE_REQUIRED);
      return;
    }
    onUpdate(section.id, { title: titleDraft.trim() });
    setEditingTitle(false);
    toast.success(TOAST.AUDIENCE_GUIDE.TITLE_UPDATED);
  }

  function handleContentSave() {
    onUpdate(section.id, { content: contentDraft });
    setEditingContent(false);
    toast.success(TOAST.AUDIENCE_GUIDE.CONTENT_SAVED);
  }

  function handleAddFAQ() {
    if (!faqQ.trim() || !faqA.trim()) {
      toast.error(TOAST.AUDIENCE_GUIDE.QA_REQUIRED);
      return;
    }
    onAddFAQ(section.id, faqQ, faqA);
    setFaqQ("");
    setFaqA("");
    setShowFAQForm(false);
    toast.success(TOAST.AUDIENCE_GUIDE.FAQ_ADDED);
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div
        className={`border rounded-lg ${
          section.isVisible ? "bg-card" : "bg-muted/30 opacity-70"
        }`}
      >
        {/* 섹션 헤더 */}
        <div className="flex items-center gap-1 px-3 py-2">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex-1 flex items-center gap-2 text-left"
            >
              {open ? (
                <ChevronUp className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              )}
              <SectionTypeBadge type={section.type} />
              <span className="text-sm font-medium truncate">
                {section.title}
              </span>
              {section.faqs.length > 0 && (
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0 shrink-0"
                >
                  FAQ {section.faqs.length}
                </Badge>
              )}
            </button>
          </CollapsibleTrigger>

          {/* 섹션 액션 버튼들 */}
          <div className="flex shrink-0 gap-0.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              disabled={isFirst}
              onClick={() => onMoveUp(section.id)}
              title="위로"
            >
              <ArrowUp className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              disabled={isLast}
              onClick={() => onMoveDown(section.id)}
              title="아래로"
            >
              <ArrowDown className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => onToggleVisibility(section.id)}
              title={section.isVisible ? "숨기기" : "표시"}
            >
              {section.isVisible ? (
                <Eye className="h-3 w-3" />
              ) : (
                <EyeOff className="h-3 w-3 text-muted-foreground" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
              onClick={() => {
                onRemove(section.id);
                toast.success(TOAST.AUDIENCE_GUIDE.SECTION_DELETED);
              }}
              title="삭제"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* 섹션 본문 */}
        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-3 border-t pt-3">
            {/* 제목 편집 */}
            <div>
              <Label className="text-[10px] text-muted-foreground mb-1 block">
                섹션 제목
              </Label>
              {editingTitle ? (
                <div className="flex gap-1">
                  <Input
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    className="h-7 text-xs flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleTitleSave();
                      if (e.key === "Escape") {
                        setTitleDraft(section.title);
                        setEditingTitle(false);
                      }
                    }}
                    autoFocus
                  />
                  <Button
                    size="sm"
                    className="h-7 text-xs px-2"
                    onClick={handleTitleSave}
                  >
                    저장
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs px-2"
                    onClick={() => {
                      setTitleDraft(section.title);
                      setEditingTitle(false);
                    }}
                  >
                    취소
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="text-sm flex-1">{section.title}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => setEditingTitle(true)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

            {/* 유형 변경 */}
            <div>
              <Label className="text-[10px] text-muted-foreground mb-1 block">
                섹션 유형
              </Label>
              <Select
                value={section.type}
                onValueChange={(val) =>
                  onUpdate(section.id, {
                    type: val as AudienceGuideSectionType,
                  })
                }
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_SECTION_TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="text-xs">
                      {SECTION_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 본문 내용 */}
            <div>
              <Label className="text-[10px] text-muted-foreground mb-1 block">
                내용
              </Label>
              {editingContent ? (
                <div className="space-y-1">
                  <Textarea
                    value={contentDraft}
                    onChange={(e) => setContentDraft(e.target.value)}
                    rows={4}
                    placeholder="관객 안내 내용을 입력하세요..."
                    className="text-xs resize-none"
                    autoFocus
                  />
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      className="h-6 text-[10px] px-2"
                      onClick={handleContentSave}
                    >
                      <Check className="h-3 w-3 mr-1" />
                      저장
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-[10px] px-2"
                      onClick={() => {
                        setContentDraft(section.content);
                        setEditingContent(false);
                      }}
                    >
                      <X className="h-3 w-3 mr-1" />
                      취소
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className="rounded-md border px-3 py-2 text-xs min-h-[48px] cursor-pointer hover:bg-muted/30 transition-colors group relative"
                  onClick={() => setEditingContent(true)}
                >
                  {section.content ? (
                    <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                      {section.content}
                    </p>
                  ) : (
                    <p className="text-muted-foreground/50 italic">
                      클릭하여 내용을 입력하세요...
                    </p>
                  )}
                  <Pencil className="h-3 w-3 absolute top-2 right-2 opacity-0 group-hover:opacity-60 transition-opacity" />
                </div>
              )}
            </div>

            {/* FAQ 목록 (type === faq 또는 FAQ가 있을 때 표시) */}
            {(section.type === "faq" || section.faqs.length > 0) && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="text-[10px] text-muted-foreground">
                    FAQ 목록
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] px-2"
                    onClick={() => setShowFAQForm((v) => !v)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    FAQ 추가
                  </Button>
                </div>

                {/* FAQ 추가 폼 */}
                {showFAQForm && (
                  <div className="border rounded-md p-2 space-y-1.5 mb-2 bg-muted/30">
                    <Input
                      value={faqQ}
                      onChange={(e) => setFaqQ(e.target.value)}
                      placeholder="질문을 입력하세요"
                      className="h-7 text-xs"
                    />
                    <Textarea
                      value={faqA}
                      onChange={(e) => setFaqA(e.target.value)}
                      placeholder="답변을 입력하세요"
                      rows={2}
                      className="text-xs resize-none"
                    />
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        className="h-6 text-[10px] px-2"
                        onClick={handleAddFAQ}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        추가
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-[10px] px-2"
                        onClick={() => {
                          setFaqQ("");
                          setFaqA("");
                          setShowFAQForm(false);
                        }}
                      >
                        <X className="h-3 w-3 mr-1" />
                        취소
                      </Button>
                    </div>
                  </div>
                )}

                {/* FAQ 목록 */}
                <div className="space-y-1">
                  {sortedFaqs.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground text-center py-2">
                      FAQ가 없습니다. 추가 버튼을 눌러 FAQ를 등록하세요.
                    </p>
                  ) : (
                    sortedFaqs.map((faq, idx) => (
                      <FAQEditItem
                        key={faq.id}
                        sectionId={section.id}
                        faq={faq}
                        isFirst={idx === 0}
                        isLast={idx === sortedFaqs.length - 1}
                        onUpdate={onUpdateFAQ}
                        onRemove={onRemoveFAQ}
                        onMoveUp={onMoveFAQUp}
                        onMoveDown={onMoveFAQDown}
                      />
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// ============================================================
// 서브 컴포넌트: 섹션 카드 (미리보기 모드)
// ============================================================

function SectionPreviewCard({
  section,
}: {
  section: AudienceGuideSection;
}) {
  const [open, setOpen] = useState(true);
  const sortedFaqs = [...section.faqs].sort((a, b) => a.order - b.order);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="border rounded-lg bg-card">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-muted/30 transition-colors rounded-lg"
          >
            {open ? (
              <ChevronUp className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            )}
            <SectionTypeBadge type={section.type} />
            <span className="text-sm font-medium flex-1 text-left">
              {section.title}
            </span>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-3 border-t pt-2 space-y-2">
            {section.content && (
              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {section.content}
              </p>
            )}
            {sortedFaqs.length > 0 && (
              <div className="space-y-0.5 mt-1">
                {sortedFaqs.map((faq) => (
                  <FAQPreviewItem key={faq.id} faq={faq} />
                ))}
              </div>
            )}
            {!section.content && sortedFaqs.length === 0 && (
              <p className="text-[10px] text-muted-foreground italic">
                내용이 없습니다.
              </p>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// ============================================================
// 메인 컴포넌트
// ============================================================

interface AudienceGuideCardProps {
  groupId: string;
  projectId: string;
}

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

  // 섹션 추가 다이얼로그 상태
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newSectionType, setNewSectionType] =
    useState<AudienceGuideSectionType>("general");
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [newSectionContent, setNewSectionContent] = useState("");

  // 매뉴얼 정보 편집 상태
  const [editingInfo, setEditingInfo] = useState(false);
  const [infoDraft, setInfoDraft] = useState({
    title: entry.title,
    description: entry.description,
  });

  function handleAddSection() {
    if (!newSectionTitle.trim()) {
      toast.error(TOAST.AUDIENCE_GUIDE.SECTION_TITLE_REQUIRED);
      return;
    }
    addSection(newSectionType, newSectionTitle, newSectionContent);
    setNewSectionTitle("");
    setNewSectionContent("");
    setNewSectionType("general");
    setAddDialogOpen(false);
    toast.success(TOAST.AUDIENCE_GUIDE.SECTION_ADDED);
  }

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

  // 편집 탭 열릴 때 draft 동기화
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
              <BookOpen className="h-4 w-4 text-indigo-500" />
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
                          setInfoDraft((d) => ({ ...d, title: e.target.value }))
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
                        <Check className="h-3 w-3 mr-1" />
                        저장
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-[10px] px-2"
                        onClick={() => setEditingInfo(false)}
                      >
                        <X className="h-3 w-3 mr-1" />
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
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>

              {/* 섹션 목록 */}
              {sections.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-muted-foreground border rounded-lg border-dashed">
                  <BookOpen className="h-6 w-6 mb-2 opacity-40" />
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
                <Plus className="h-3 w-3 mr-1" />
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
                  <Eye className="h-6 w-6 mb-2 opacity-40" />
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
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">섹션 추가</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs mb-1 block">섹션 유형</Label>
              <Select
                value={newSectionType}
                onValueChange={(val) =>
                  setNewSectionType(val as AudienceGuideSectionType)
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_SECTION_TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="text-xs">
                      <span className="flex items-center gap-1.5">
                        {SECTION_TYPE_ICONS[t]}
                        {SECTION_TYPE_LABELS[t]}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">섹션 제목</Label>
              <Input
                value={newSectionTitle}
                onChange={(e) => setNewSectionTitle(e.target.value)}
                placeholder="예: 오시는 길"
                className="h-8 text-xs"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddSection();
                }}
                autoFocus
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">
                내용{" "}
                <span className="text-muted-foreground">(선택)</span>
              </Label>
              <Textarea
                value={newSectionContent}
                onChange={(e) => setNewSectionContent(e.target.value)}
                placeholder="초기 내용을 입력하세요..."
                rows={3}
                className="text-xs resize-none"
              />
            </div>
          </div>
          <DialogFooter className="gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                setNewSectionTitle("");
                setNewSectionContent("");
                setNewSectionType("general");
                setAddDialogOpen(false);
              }}
            >
              취소
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={handleAddSection}
            >
              <Plus className="h-3 w-3 mr-1" />
              추가
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
