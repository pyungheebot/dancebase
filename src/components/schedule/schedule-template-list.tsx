"use client";

import { useState, useRef } from "react";
import { Plus, Trash2, LayoutTemplate, Clock, MapPin } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useScheduleTemplates } from "@/hooks/use-schedule-templates";
import { invalidateScheduleTemplates } from "@/lib/swr/invalidate";
import type { ScheduleTemplate } from "@/types";

type TemplateFieldValues = {
  name: string;
  title: string;
  description: string;
  location: string;
  duration_minutes: string;
};

const DEFAULT_TEMPLATE_FIELDS: TemplateFieldValues = {
  name: "",
  title: "",
  description: "",
  location: "",
  duration_minutes: "",
};

type ScheduleTemplateAddDialogProps = {
  entityType: "group" | "project";
  entityId: string;
  onSaved: () => void;
};

function ScheduleTemplateAddDialog({
  entityType,
  entityId,
  onSaved,
}: ScheduleTemplateAddDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fields, setFields] = useState<TemplateFieldValues>(DEFAULT_TEMPLATE_FIELDS);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const resetFields = () => setFields(DEFAULT_TEMPLATE_FIELDS);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fields.name.trim() || !fields.title.trim()) {
      toast.error("템플릿 이름과 일정 제목은 필수입니다.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("로그인이 필요합니다.");
        return;
      }

      const { error } = await supabase.from("schedule_templates").insert({
        entity_type: entityType,
        entity_id: entityId,
        name: fields.name.trim(),
        title: fields.title.trim(),
        description: fields.description.trim() || null,
        location: fields.location.trim() || null,
        duration_minutes: fields.duration_minutes
          ? parseInt(fields.duration_minutes, 10)
          : null,
        created_by: user.id,
      });

      if (error) throw error;

      toast.success("템플릿이 저장되었습니다.");
      invalidateScheduleTemplates(entityType, entityId);
      setOpen(false);
      resetFields();
      onSaved();
    } catch {
      toast.error("템플릿 저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetFields();
      }}
    >
      <DialogTrigger asChild>
        <Button ref={triggerRef} size="sm" className="h-7 text-xs">
          <Plus className="mr-1 h-3 w-3" />
          템플릿 추가
        </Button>
      </DialogTrigger>
      <DialogContent
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          nameInputRef.current?.focus();
        }}
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          triggerRef.current?.focus();
        }}
      >
        <DialogHeader>
          <DialogTitle>일정 템플릿 추가</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="tpl-name" className="text-xs">
              템플릿 이름 <span className="text-destructive">*</span>
            </Label>
            <Input
              ref={nameInputRef}
              id="tpl-name"
              placeholder="예: 정기 연습, 공연 준비"
              value={fields.name}
              onChange={(e) => setFields((p) => ({ ...p, name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="tpl-title" className="text-xs">
              일정 제목 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="tpl-title"
              placeholder="일정에 사용될 기본 제목"
              value={fields.title}
              onChange={(e) => setFields((p) => ({ ...p, title: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="tpl-description" className="text-xs">설명</Label>
            <Textarea
              id="tpl-description"
              placeholder="설명 (선택사항)"
              value={fields.description}
              onChange={(e) => setFields((p) => ({ ...p, description: e.target.value }))}
              rows={2}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="tpl-location" className="text-xs">장소 이름</Label>
            <Input
              id="tpl-location"
              placeholder="장소 이름 (선택사항)"
              value={fields.location}
              onChange={(e) => setFields((p) => ({ ...p, location: e.target.value }))}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="tpl-duration" className="text-xs">소요 시간 (분)</Label>
            <Input
              id="tpl-duration"
              type="number"
              min={1}
              max={1440}
              placeholder="예: 120"
              value={fields.duration_minutes}
              onChange={(e) => setFields((p) => ({ ...p, duration_minutes: e.target.value }))}
            />
          </div>

          <Button
            type="submit"
            className="w-full h-8 text-sm"
            disabled={loading || !fields.name.trim() || !fields.title.trim()}
          >
            {loading ? "저장 중..." : "템플릿 저장"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type TemplateCardProps = {
  template: ScheduleTemplate;
  onUse: (template: ScheduleTemplate) => void;
  canEdit: boolean;
  onDeleted: () => void;
};

function TemplateCard({ template, onUse, canEdit, onDeleted }: TemplateCardProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("schedule_templates")
        .delete()
        .eq("id", template.id);

      if (error) throw error;

      toast.success("템플릿이 삭제되었습니다.");
      invalidateScheduleTemplates(template.entity_type, template.entity_id);
      onDeleted();
    } catch {
      toast.error("템플릿 삭제에 실패했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  const durationLabel = template.duration_minutes
    ? template.duration_minutes >= 60
      ? `${Math.floor(template.duration_minutes / 60)}시간${template.duration_minutes % 60 > 0 ? ` ${template.duration_minutes % 60}분` : ""}`
      : `${template.duration_minutes}분`
    : null;

  return (
    <div className="rounded-md border p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground truncate">{template.name}</p>
          <p className="text-sm font-semibold truncate mt-0.5">{template.title}</p>
        </div>
        {canEdit && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 shrink-0 text-muted-foreground hover:text-destructive"
                disabled={deleting}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>템플릿 삭제</AlertDialogTitle>
                <AlertDialogDescription>
                  &quot;{template.name}&quot; 템플릿을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>삭제</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {template.location && (
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate max-w-[120px]">{template.location}</span>
          </span>
        )}
        {durationLabel && (
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3 shrink-0" />
            {durationLabel}
          </span>
        )}
      </div>

      {template.description && (
        <p className="text-[11px] text-muted-foreground line-clamp-2">{template.description}</p>
      )}

      <Button
        size="sm"
        variant="outline"
        className="w-full h-7 text-xs"
        onClick={() => onUse(template)}
      >
        이 템플릿으로 일정 생성
      </Button>
    </div>
  );
}

type ScheduleTemplateListProps = {
  entityType: "group" | "project";
  entityId: string;
  canEdit: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (template: ScheduleTemplate) => void;
};

export function ScheduleTemplateList({
  entityType,
  entityId,
  canEdit,
  open,
  onOpenChange,
  onSelectTemplate,
}: ScheduleTemplateListProps) {
  const { templates, loading, refetch } = useScheduleTemplates(entityType, entityId);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button size="sm" variant="outline" className="h-7 text-xs">
          <LayoutTemplate className="mr-1 h-3 w-3" />
          템플릿
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80 sm:max-w-sm overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-sm">일정 템플릿</SheetTitle>
        </SheetHeader>

        <div className="px-4 pb-4 space-y-3">
          {canEdit && (
            <ScheduleTemplateAddDialog
              entityType={entityType}
              entityId={entityId}
              onSaved={refetch}
            />
          )}

          {loading ? (
            <p className="text-xs text-muted-foreground text-center py-4">불러오는 중...</p>
          ) : templates.length === 0 ? (
            <div className="text-center py-8 space-y-1">
              <LayoutTemplate className="h-8 w-8 mx-auto text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">저장된 템플릿이 없습니다.</p>
              {canEdit && (
                <p className="text-[11px] text-muted-foreground">
                  자주 사용하는 일정 패턴을 템플릿으로 저장해보세요.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {templates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onUse={(tpl) => {
                    onSelectTemplate(tpl);
                    onOpenChange(false);
                  }}
                  canEdit={canEdit}
                  onDeleted={refetch}
                />
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
