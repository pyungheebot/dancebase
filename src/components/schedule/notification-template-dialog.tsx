"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Bell, FileText, Send, Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useNotificationTemplates,
  replaceVariables,
} from "@/hooks/use-notification-templates";
import type { NotificationTemplate, Schedule } from "@/types";
import { NOTIFICATION_TEMPLATE_VARIABLE_LABELS } from "@/types";

// ============================================
// 타입
// ============================================

type NotificationTemplateDialogProps = {
  groupId: string;
  upcomingSchedules: Schedule[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// ============================================
// 변수 안내 뱃지
// ============================================

const VARIABLES = Object.entries(NOTIFICATION_TEMPLATE_VARIABLE_LABELS) as [
  keyof typeof NOTIFICATION_TEMPLATE_VARIABLE_LABELS,
  string
][];

function VariableGuide({ onInsert }: { onInsert: (variable: string) => void }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-medium text-muted-foreground">사용 가능한 변수</p>
      <div className="flex flex-wrap gap-1">
        {VARIABLES.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => onInsert(`{${key}}`)}
            className="inline-flex items-center rounded border border-dashed border-muted-foreground/40 px-1.5 py-0.5 text-[10px] text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            {`{${key}}`}
            <span className="ml-1 text-[9px] opacity-60">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================
// 템플릿 편집 폼
// ============================================

type TemplateFormProps = {
  initialTitle?: string;
  initialBody?: string;
  onSave: (title: string, body: string) => void;
  onCancel: () => void;
};

function TemplateForm({ initialTitle = "", initialBody = "", onSave, onCancel }: TemplateFormProps) {
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [bodyRef, setBodyRef] = useState<HTMLTextAreaElement | null>(null);

  function handleInsertVariable(variable: string) {
    if (!bodyRef) {
      setBody((prev) => prev + variable);
      return;
    }
    const start = bodyRef.selectionStart ?? body.length;
    const end = bodyRef.selectionEnd ?? body.length;
    const newBody = body.slice(0, start) + variable + body.slice(end);
    setBody(newBody);
    // 커서 위치 복원
    setTimeout(() => {
      bodyRef.focus();
      bodyRef.setSelectionRange(start + variable.length, start + variable.length);
    }, 0);
  }

  function handleSubmit() {
    if (!title.trim()) {
      toast.error("템플릿 제목을 입력해주세요");
      return;
    }
    if (!body.trim()) {
      toast.error("템플릿 본문을 입력해주세요");
      return;
    }
    onSave(title.trim(), body.trim());
  }

  return (
    <div className="space-y-3 rounded-md border p-3 bg-muted/20">
      <div className="space-y-1">
        <label className="text-[11px] font-medium">제목</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="템플릿 제목"
          className="h-7 text-xs"
        />
      </div>
      <div className="space-y-1">
        <label className="text-[11px] font-medium">본문</label>
        <Textarea
          ref={(el) => setBodyRef(el)}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="알림 본문을 입력하세요. 변수는 {scheduleTitle} 형태로 사용합니다."
          className="text-xs min-h-[72px] resize-none"
          rows={3}
        />
      </div>
      <VariableGuide onInsert={handleInsertVariable} />
      <div className="flex justify-end gap-1.5">
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1"
          onClick={onCancel}
        >
          <X className="h-3 w-3" />
          취소
        </Button>
        <Button
          size="sm"
          className="h-7 text-xs gap-1"
          onClick={handleSubmit}
        >
          <Check className="h-3 w-3" />
          저장
        </Button>
      </div>
    </div>
  );
}

// ============================================
// 템플릿 행
// ============================================

type TemplateRowProps = {
  template: NotificationTemplate;
  onEdit: (template: NotificationTemplate) => void;
  onDelete: (id: string) => void;
};

function TemplateRow({ template, onEdit, onDelete }: TemplateRowProps) {
  return (
    <div className="rounded-md border px-3 py-2 space-y-1 group hover:bg-muted/30 transition-colors">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium truncate flex-1">{template.title}</p>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => onEdit(template)}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
            onClick={() => onDelete(template.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
        {template.body}
      </p>
    </div>
  );
}

// ============================================
// 메인 다이얼로그
// ============================================

export function NotificationTemplateDialog({
  groupId,
  upcomingSchedules,
  open,
  onOpenChange,
}: NotificationTemplateDialogProps) {
  const {
    members,
    membersLoading,
    sending,
    getTemplates,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    sendNotification,
  } = useNotificationTemplates(groupId);

  // 탭 상태
  const [activeTab, setActiveTab] = useState<"manage" | "send">("manage");

  // 템플릿 목록 (로컬 상태로 동기화)
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);

  // 편집 상태
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // 발송 탭 상태
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(true);

  // Dialog가 열릴 때마다 템플릿 재로드
  useEffect(() => {
    if (open) {
      const loaded = getTemplates();
      setTemplates(loaded);
      setEditingId(null);
      setShowAddForm(false);
      // 발송 탭 초기화
      if (loaded.length > 0) setSelectedTemplateId(loaded[0].id);
      if (upcomingSchedules.length > 0) setSelectedScheduleId(upcomingSchedules[0].id);
      setSelectAll(true);
      setSelectedMemberIds(new Set());
    }
  }, [open, getTemplates, upcomingSchedules]);

  // 전체 선택 연동
  useEffect(() => {
    if (selectAll) {
      setSelectedMemberIds(new Set(members.map((m) => m.userId)));
    }
  }, [selectAll, members]);

  // ---- 템플릿 관리 핸들러 ----

  function handleAddSave(title: string, body: string) {
    const newTpl = addTemplate(title, body);
    setTemplates((prev) => [...prev, newTpl]);
    setShowAddForm(false);
    toast.success("템플릿이 추가되었습니다");
  }

  function handleEditSave(title: string, body: string) {
    if (!editingId) return;
    updateTemplate(editingId, { title, body });
    setTemplates((prev) =>
      prev.map((t) =>
        t.id === editingId
          ? { ...t, title, body, updatedAt: new Date().toISOString() }
          : t
      )
    );
    setEditingId(null);
    toast.success("템플릿이 수정되었습니다");
  }

  function handleDelete(id: string) {
    deleteTemplate(id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    toast.success("템플릿이 삭제되었습니다");
  }

  // ---- 발송 핸들러 ----

  const selectedSchedule = upcomingSchedules.find((s) => s.id === selectedScheduleId) ?? null;
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) ?? null;

  const previewMessage =
    selectedTemplate && selectedSchedule
      ? replaceVariables(selectedTemplate.body, selectedSchedule)
      : "";

  function toggleMember(userId: string, checked: boolean) {
    setSelectedMemberIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(userId);
      } else {
        next.delete(userId);
        setSelectAll(false);
      }
      return next;
    });
  }

  function handleSelectAllChange(checked: boolean) {
    setSelectAll(checked);
    if (!checked) {
      setSelectedMemberIds(new Set());
    }
  }

  async function handleSend() {
    if (!selectedTemplateId) {
      toast.error("템플릿을 선택해주세요");
      return;
    }
    if (!selectedScheduleId || !selectedSchedule) {
      toast.error("일정을 선택해주세요");
      return;
    }
    if (selectedMemberIds.size === 0) {
      toast.error("발송 대상 멤버를 선택해주세요");
      return;
    }

    const result = await sendNotification(
      selectedTemplateId,
      selectedSchedule,
      [...selectedMemberIds]
    );

    if (result.success) {
      toast.success(`${result.count}명에게 알림을 발송했습니다`);
      onOpenChange(false);
    } else {
      toast.error(result.error ?? "알림 발송에 실패했습니다");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-1.5">
            <Bell className="h-3.5 w-3.5" />
            일정 알림 템플릿
          </DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "manage" | "send")}
          className="flex-1 flex flex-col min-h-0"
        >
          <TabsList className="grid w-full grid-cols-2 h-8">
            <TabsTrigger value="manage" className="text-xs flex items-center gap-1">
              <FileText className="h-3 w-3" />
              템플릿 관리
            </TabsTrigger>
            <TabsTrigger value="send" className="text-xs flex items-center gap-1">
              <Send className="h-3 w-3" />
              알림 발송
            </TabsTrigger>
          </TabsList>

          {/* ─────────────────────────────────────────
              탭 1: 템플릿 관리
          ───────────────────────────────────────── */}
          <TabsContent
            value="manage"
            className="flex-1 overflow-y-auto mt-3 space-y-2 pr-0.5"
          >
            {/* 추가 버튼 */}
            {!showAddForm && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1 w-full"
                onClick={() => {
                  setShowAddForm(true);
                  setEditingId(null);
                }}
              >
                <Plus className="h-3 w-3" />
                새 템플릿 추가
              </Button>
            )}

            {/* 추가 폼 */}
            {showAddForm && (
              <TemplateForm
                onSave={handleAddSave}
                onCancel={() => setShowAddForm(false)}
              />
            )}

            {/* 템플릿 목록 */}
            {templates.length === 0 && !showAddForm ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <FileText className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-xs">템플릿이 없습니다</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {templates.map((template) =>
                  editingId === template.id ? (
                    <TemplateForm
                      key={template.id}
                      initialTitle={template.title}
                      initialBody={template.body}
                      onSave={handleEditSave}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <TemplateRow
                      key={template.id}
                      template={template}
                      onEdit={(t) => {
                        setEditingId(t.id);
                        setShowAddForm(false);
                      }}
                      onDelete={handleDelete}
                    />
                  )
                )}
              </div>
            )}
          </TabsContent>

          {/* ─────────────────────────────────────────
              탭 2: 알림 발송
          ───────────────────────────────────────── */}
          <TabsContent
            value="send"
            className="flex-1 overflow-y-auto mt-3 space-y-3 pr-0.5"
          >
            {/* 템플릿 선택 */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium">템플릿 선택</label>
              {templates.length === 0 ? (
                <p className="text-[11px] text-muted-foreground">
                  먼저 템플릿을 추가해주세요.
                </p>
              ) : (
                <Select
                  value={selectedTemplateId}
                  onValueChange={setSelectedTemplateId}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="템플릿을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={t.id} className="text-xs">
                        {t.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* 일정 선택 */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium">일정 선택</label>
              {upcomingSchedules.length === 0 ? (
                <p className="text-[11px] text-muted-foreground">
                  예정된 일정이 없습니다.
                </p>
              ) : (
                <Select
                  value={selectedScheduleId}
                  onValueChange={setSelectedScheduleId}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="일정을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {upcomingSchedules.map((s) => (
                      <SelectItem key={s.id} value={s.id} className="text-xs">
                        <span className="font-medium">{s.title}</span>
                        <span className="ml-1.5 text-muted-foreground">
                          {format(new Date(s.starts_at), "M/d HH:mm", { locale: ko })}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* 미리보기 */}
            {previewMessage && (
              <div className="rounded-md bg-muted px-3 py-2 space-y-1">
                <p className="text-[10px] font-medium text-muted-foreground">
                  메시지 미리보기
                </p>
                <p className="text-xs leading-relaxed">{previewMessage}</p>
                {selectedSchedule && (
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {selectedSchedule.location && (
                      <Badge className="text-[9px] px-1.5 py-0 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50">
                        {selectedSchedule.location}
                      </Badge>
                    )}
                    <Badge className="text-[9px] px-1.5 py-0 bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100">
                      {format(new Date(selectedSchedule.starts_at), "HH:mm", { locale: ko })}
                    </Badge>
                  </div>
                )}
              </div>
            )}

            {/* 발송 대상 멤버 선택 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium">발송 대상</label>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {selectedMemberIds.size}명 선택
                </Badge>
              </div>

              {membersLoading ? (
                <div className="space-y-1.5">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-7 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              ) : members.length === 0 ? (
                <p className="text-[11px] text-muted-foreground">멤버가 없습니다.</p>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-0.5">
                  {/* 전체 선택 */}
                  <div className="flex items-center gap-2 rounded-md border px-2.5 py-1.5 bg-muted/30">
                    <Checkbox
                      id="select-all-members"
                      checked={selectAll}
                      onCheckedChange={(v) => handleSelectAllChange(v === true)}
                    />
                    <label
                      htmlFor="select-all-members"
                      className="text-xs font-medium cursor-pointer flex-1"
                    >
                      전체 선택
                    </label>
                    <span className="text-[10px] text-muted-foreground">
                      {members.length}명
                    </span>
                  </div>

                  {/* 개별 멤버 */}
                  {members.map((member) => (
                    <div
                      key={member.userId}
                      className="flex items-center gap-2 rounded-md border px-2.5 py-1.5"
                    >
                      <Checkbox
                        id={`member-${member.userId}`}
                        checked={selectedMemberIds.has(member.userId)}
                        onCheckedChange={(v) =>
                          toggleMember(member.userId, v === true)
                        }
                      />
                      <label
                        htmlFor={`member-${member.userId}`}
                        className="text-xs cursor-pointer flex-1"
                      >
                        {member.name}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 발송 버튼 */}
            <DialogFooter className="pt-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => onOpenChange(false)}
              >
                취소
              </Button>
              <Button
                size="sm"
                className="h-7 text-xs gap-1"
                disabled={
                  sending ||
                  !selectedTemplateId ||
                  !selectedScheduleId ||
                  selectedMemberIds.size === 0
                }
                onClick={handleSend}
              >
                <Send className="h-3 w-3" />
                {sending
                  ? "발송 중..."
                  : `${selectedMemberIds.size}명에게 발송`}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
