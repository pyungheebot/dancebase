"use client";

import { useState, useMemo } from "react";
import {
  FileText,
  Plus,
  Trash2,
  Pencil,
  Eye,
  Copy,
  ChevronDown,
  ChevronUp,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  useAnnouncementTemplate,
  extractVariableKeys,
  interpolateTemplate,
  type AddAnnouncementTemplateInput,
  type UpdateAnnouncementTemplateInput,
} from "@/hooks/use-announcement-template";
import type {
  AnnouncementTemplateCategory,
  AnnouncementTemplateEntry,
  AnnouncementTemplateVariable,
} from "@/types";

// ============================================================
// 상수
// ============================================================

const CATEGORY_OPTIONS: {
  value: AnnouncementTemplateCategory;
  label: string;
  color: string;
}[] = [
  { value: "practice", label: "연습", color: "bg-orange-100 text-orange-700" },
  {
    value: "performance",
    label: "공연",
    color: "bg-purple-100 text-purple-700",
  },
  { value: "meeting", label: "회의", color: "bg-blue-100 text-blue-700" },
  {
    value: "gathering",
    label: "모임",
    color: "bg-pink-100 text-pink-700",
  },
  { value: "etc", label: "기타", color: "bg-gray-100 text-gray-600" },
];

function getCategoryBadge(category: AnnouncementTemplateCategory) {
  return (
    CATEGORY_OPTIONS.find((o) => o.value === category) ?? CATEGORY_OPTIONS[4]
  );
}

// ============================================================
// 빈 폼 상태
// ============================================================

const EMPTY_FORM: AddAnnouncementTemplateInput = {
  name: "",
  category: "practice",
  titleTemplate: "",
  bodyTemplate: "",
  variables: [],
};

// ============================================================
// 서브 컴포넌트: 변수 입력 폼
// ============================================================

function VariableInputForm({
  variables,
  values,
  onChange,
}: {
  variables: AnnouncementTemplateVariable[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  if (variables.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">변수 입력</p>
      <div className="grid grid-cols-1 gap-2">
        {variables.map((v) => (
          <div key={v.key} className="flex items-center gap-2">
            <Label className="text-xs w-20 shrink-0 text-right">
              {v.label}
            </Label>
            <Input
              className="h-7 text-xs"
              placeholder={v.defaultValue ?? v.label}
              value={values[v.key] ?? v.defaultValue ?? ""}
              onChange={(e) => onChange(v.key, e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 서브 컴포넌트: 템플릿 미리보기 다이얼로그
// ============================================================

function PreviewDialog({
  entry,
  onUse,
}: {
  entry: AnnouncementTemplateEntry;
  onUse: (title: string, body: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [varValues, setVarValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    entry.variables.forEach((v) => {
      init[v.key] = v.defaultValue ?? "";
    });
    return init;
  });
  const [copied, setCopied] = useState(false);

  const previewTitle = useMemo(
    () => interpolateTemplate(entry.titleTemplate, varValues),
    [entry.titleTemplate, varValues]
  );
  const previewBody = useMemo(
    () => interpolateTemplate(entry.bodyTemplate, varValues),
    [entry.bodyTemplate, varValues]
  );

  function handleVarChange(key: string, value: string) {
    setVarValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleCopy() {
    const text = `${previewTitle}\n\n${previewBody}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard 실패 시 무시
    }
  }

  function handleUse() {
    onUse(previewTitle, previewBody);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs px-2"
          title="미리보기"
        >
          <Eye className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-2">
            <Eye className="h-4 w-4" />
            템플릿 미리보기
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 변수 입력 */}
          <VariableInputForm
            variables={entry.variables}
            values={varValues}
            onChange={handleVarChange}
          />

          {/* 미리보기 결과 */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              미리보기 결과
            </p>
            <div className="rounded-md border bg-muted/30 p-3 space-y-2">
              <p className="text-sm font-semibold">{previewTitle || "(제목 없음)"}</p>
              <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                {previewBody || "(본문 없음)"}
              </p>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 mr-1" />
                  복사됨
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3 mr-1" />
                  복사
                </>
              )}
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={handleUse}>
              <FileText className="h-3 w-3 mr-1" />
              사용하기
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 서브 컴포넌트: 템플릿 폼 (추가/수정 공용)
// ============================================================

function TemplateForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  initial: AddAnnouncementTemplateInput;
  onSubmit: (data: AddAnnouncementTemplateInput) => Promise<boolean>;
  onCancel: () => void;
  submitLabel: string;
}) {
  const [form, setForm] = useState<AddAnnouncementTemplateInput>(initial);
  const [loading, setLoading] = useState(false);

  // 제목+본문 템플릿에서 자동으로 변수 키 추출
  const autoKeys = useMemo(() => {
    const titleKeys = extractVariableKeys(form.titleTemplate);
    const bodyKeys = extractVariableKeys(form.bodyTemplate);
    return Array.from(new Set([...titleKeys, ...bodyKeys]));
  }, [form.titleTemplate, form.bodyTemplate]);

  // autoKeys 기반으로 variables 목록 동기화 (기존 label/defaultValue 유지)
  const syncedVariables = useMemo<AnnouncementTemplateVariable[]>(() => {
    const existingMap = new Map(
      (form.variables ?? []).map((v) => [v.key, v])
    );
    return autoKeys.map(
      (k) => existingMap.get(k) ?? { key: k, label: k, defaultValue: "" }
    );
  }, [autoKeys, form.variables]);

  function handleChange(
    field: keyof AddAnnouncementTemplateInput,
    value: string | AnnouncementTemplateCategory
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleVariableLabelChange(key: string, label: string) {
    setForm((prev) => ({
      ...prev,
      variables: syncedVariables.map((v) =>
        v.key === key ? { ...v, label } : v
      ),
    }));
  }

  function handleVariableDefaultChange(key: string, defaultValue: string) {
    setForm((prev) => ({
      ...prev,
      variables: syncedVariables.map((v) =>
        v.key === key ? { ...v, defaultValue } : v
      ),
    }));
  }

  async function handleSubmit() {
    setLoading(true);
    const ok = await onSubmit({ ...form, variables: syncedVariables });
    setLoading(false);
    if (ok) onCancel();
  }

  return (
    <div className="space-y-3">
      {/* 템플릿 이름 */}
      <div className="space-y-1">
        <Label className="text-xs">템플릿 이름 *</Label>
        <Input
          className="h-7 text-xs"
          placeholder="예) 정기연습 공지"
          value={form.name}
          onChange={(e) => handleChange("name", e.target.value)}
        />
      </div>

      {/* 카테고리 */}
      <div className="space-y-1">
        <Label className="text-xs">카테고리 *</Label>
        <Select
          value={form.category}
          onValueChange={(v) =>
            handleChange("category", v as AnnouncementTemplateCategory)
          }
        >
          <SelectTrigger className="h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORY_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value} className="text-xs">
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 제목 템플릿 */}
      <div className="space-y-1">
        <Label className="text-xs">
          제목 템플릿 *
          <span className="ml-1 text-muted-foreground font-normal">
            (변수: {"{{날짜}}"})
          </span>
        </Label>
        <Input
          className="h-7 text-xs"
          placeholder="예) {{날짜}} 정기연습 공지"
          value={form.titleTemplate}
          onChange={(e) => handleChange("titleTemplate", e.target.value)}
        />
      </div>

      {/* 본문 템플릿 */}
      <div className="space-y-1">
        <Label className="text-xs">본문 템플릿 *</Label>
        <Textarea
          className="text-xs min-h-[80px] resize-none"
          placeholder={"예) 안녕하세요!\n\n{{날짜}} {{장소}}에서 정기연습이 있습니다.\n\n많은 참여 부탁드립니다."}
          value={form.bodyTemplate}
          onChange={(e) => handleChange("bodyTemplate", e.target.value)}
        />
      </div>

      {/* 추출된 변수 목록 */}
      {syncedVariables.length > 0 && (
        <div className="space-y-2 rounded-md border p-2 bg-muted/20">
          <p className="text-xs font-medium text-muted-foreground">
            감지된 변수 ({syncedVariables.length}개) — 레이블/기본값 설정
          </p>
          {syncedVariables.map((v) => (
            <div
              key={v.key}
              className="grid grid-cols-3 gap-2 items-center"
            >
              <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                {`{{${v.key}}}`}
              </span>
              <Input
                className="h-6 text-[10px]"
                placeholder="레이블"
                value={v.label}
                onChange={(e) =>
                  handleVariableLabelChange(v.key, e.target.value)
                }
              />
              <Input
                className="h-6 text-[10px]"
                placeholder="기본값"
                value={v.defaultValue ?? ""}
                onChange={(e) =>
                  handleVariableDefaultChange(v.key, e.target.value)
                }
              />
            </div>
          ))}
        </div>
      )}

      {/* 액션 버튼 */}
      <div className="flex justify-end gap-2 pt-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={onCancel}
          disabled={loading}
        >
          취소
        </Button>
        <Button
          size="sm"
          className="h-7 text-xs"
          onClick={handleSubmit}
          disabled={loading}
        >
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// 서브 컴포넌트: 단일 템플릿 행
// ============================================================

function TemplateRow({
  entry,
  onDelete,
  onUpdate,
  onUse,
}: {
  entry: AnnouncementTemplateEntry;
  onDelete: (id: string) => Promise<boolean>;
  onUpdate: (id: string, changes: UpdateAnnouncementTemplateInput) => Promise<boolean>;
  onUse: (title: string, body: string) => void;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const categoryBadge = getCategoryBadge(entry.category);

  const editInitial: AddAnnouncementTemplateInput = {
    name: entry.name,
    category: entry.category,
    titleTemplate: entry.titleTemplate,
    bodyTemplate: entry.bodyTemplate,
    variables: entry.variables,
  };

  async function handleUpdate(data: AddAnnouncementTemplateInput): Promise<boolean> {
    return onUpdate(entry.id, data);
  }

  return (
    <div className="rounded-md border bg-card">
      {/* 헤더 행 */}
      <div className="flex items-center gap-2 px-3 py-2">
        <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-xs font-medium truncate block">{entry.name}</span>
        </div>
        <Badge
          className={`text-[10px] px-1.5 py-0 shrink-0 ${categoryBadge.color} border-0`}
        >
          {categoryBadge.label}
        </Badge>
        <span className="text-[10px] text-muted-foreground shrink-0">
          {entry.useCount}회
        </span>

        {/* 액션 버튼 */}
        <div className="flex items-center gap-0.5 shrink-0">
          <PreviewDialog entry={entry} onUse={onUse} />

          {/* 수정 다이얼로그 */}
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs px-2"
                title="수정"
              >
                <Pencil className="h-3 w-3" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-sm">템플릿 수정</DialogTitle>
              </DialogHeader>
              <TemplateForm
                initial={editInitial}
                onSubmit={handleUpdate}
                onCancel={() => setEditOpen(false)}
                submitLabel="수정 완료"
              />
            </DialogContent>
          </Dialog>

          {/* 삭제 버튼 */}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs px-2 text-destructive hover:text-destructive"
            title="삭제"
            onClick={() => onDelete(entry.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>

          {/* 상세 펼치기 */}
          <Collapsible open={detailOpen} onOpenChange={setDetailOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs px-2"
                title="상세 보기"
              >
                {detailOpen ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        </div>
      </div>

      {/* 상세 펼침 영역 */}
      <Collapsible open={detailOpen} onOpenChange={setDetailOpen}>
        <CollapsibleContent>
          <div className="px-3 pb-3 border-t pt-2 space-y-2">
            <div>
              <p className="text-[10px] text-muted-foreground mb-0.5">제목 템플릿</p>
              <p className="text-xs font-mono bg-muted px-2 py-1 rounded">
                {entry.titleTemplate}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground mb-0.5">본문 템플릿</p>
              <p className="text-xs font-mono bg-muted px-2 py-1 rounded whitespace-pre-wrap">
                {entry.bodyTemplate}
              </p>
            </div>
            {entry.variables.length > 0 && (
              <div>
                <p className="text-[10px] text-muted-foreground mb-0.5">
                  변수 목록 ({entry.variables.length}개)
                </p>
                <div className="flex flex-wrap gap-1">
                  {entry.variables.map((v) => (
                    <Badge
                      key={v.key}
                      variant="outline"
                      className="text-[10px] px-1.5 py-0"
                    >
                      {`{{${v.key}}}`}
                      {v.defaultValue ? ` = ${v.defaultValue}` : ""}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

// ============================================================
// 메인 컴포넌트
// ============================================================

interface AnnouncementTemplateCardProps {
  groupId: string;
  /** 미리보기에서 "사용하기" 클릭 시 호출되는 콜백 */
  onUseTemplate?: (title: string, body: string) => void;
}

export function AnnouncementTemplateCard({
  groupId,
  onUseTemplate,
}: AnnouncementTemplateCardProps) {
  const {
    entries,
    loading,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    incrementUseCount,
    filterByCategory,
    stats,
  } = useAnnouncementTemplate(groupId);

  const [addOpen, setAddOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<
    AnnouncementTemplateCategory | "all"
  >("all");
  const [isOpen, setIsOpen] = useState(true);

  const filteredEntries = useMemo(
    () => filterByCategory(categoryFilter),
    [filterByCategory, categoryFilter]
  );

  function handleUse(title: string, body: string) {
    // 사용 횟수 증가는 별도로 처리 (어느 템플릿인지 알기 위해 PreviewDialog에서 호출)
    onUseTemplate?.(title, body);
  }

  async function handleAddTemplate(
    data: AddAnnouncementTemplateInput
  ): Promise<boolean> {
    return addTemplate(data);
  }

  function handleUseFromEntry(entryId: string) {
    return (title: string, body: string) => {
      incrementUseCount(entryId);
      handleUse(title, body);
    };
  }

  return (
    <Card className="w-full">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-2 hover:opacity-70 transition-opacity">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  공지사항 템플릿
                </CardTitle>
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0"
                >
                  {stats.total}
                </Badge>
                {isOpen ? (
                  <ChevronUp className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                )}
              </button>
            </CollapsibleTrigger>

            {/* 추가 버튼 */}
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-7 text-xs">
                  <Plus className="h-3 w-3 mr-1" />
                  템플릿 추가
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-sm">새 템플릿 추가</DialogTitle>
                </DialogHeader>
                <TemplateForm
                  initial={{ ...EMPTY_FORM }}
                  onSubmit={handleAddTemplate}
                  onCancel={() => setAddOpen(false)}
                  submitLabel="추가"
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-3">
            {/* 카테고리 필터 */}
            <div className="flex flex-wrap gap-1">
              <Button
                variant={categoryFilter === "all" ? "default" : "outline"}
                size="sm"
                className="h-6 text-[10px] px-2"
                onClick={() => setCategoryFilter("all")}
              >
                전체 {stats.total}
              </Button>
              {CATEGORY_OPTIONS.map((o) => {
                const count = stats.byCategory[o.value];
                if (count === 0) return null;
                return (
                  <Button
                    key={o.value}
                    variant={
                      categoryFilter === o.value ? "default" : "outline"
                    }
                    size="sm"
                    className="h-6 text-[10px] px-2"
                    onClick={() => setCategoryFilter(o.value)}
                  >
                    {o.label} {count}
                  </Button>
                );
              })}
            </div>

            {/* 통계 요약 */}
            {stats.total > 0 && (
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground border rounded-md px-2.5 py-1.5 bg-muted/20">
                <span>총 {stats.total}개</span>
                <span>누적 사용 {stats.totalUseCount}회</span>
                {stats.mostUsed && (
                  <span>
                    인기: {stats.mostUsed.name} ({stats.mostUsed.useCount}회)
                  </span>
                )}
              </div>
            )}

            {/* 템플릿 목록 */}
            {loading ? (
              <div className="text-xs text-muted-foreground text-center py-4">
                불러오는 중...
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-6 border rounded-md border-dashed">
                {categoryFilter === "all"
                  ? "등록된 공지사항 템플릿이 없습니다."
                  : `'${getCategoryBadge(categoryFilter as AnnouncementTemplateCategory).label}' 카테고리 템플릿이 없습니다.`}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredEntries.map((entry) => (
                  <TemplateRow
                    key={entry.id}
                    entry={entry}
                    onDelete={deleteTemplate}
                    onUpdate={updateTemplate}
                    onUse={handleUseFromEntry(entry.id)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
