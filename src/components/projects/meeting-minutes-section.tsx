"use client";

import { useState } from "react";
import { useAsyncAction } from "@/hooks/use-async-action";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { useMeetingMinutes } from "@/hooks/use-meeting-minutes";
import { invalidateMeetingMinutes } from "@/lib/swr/invalidate";
import {
  notifyActionItemAssigned,
  getNotifiedActionItemIds,
  markActionItemNotified,
} from "@/lib/notifications";
import type { EntityContext } from "@/types/entity-context";
import type { MeetingMinute } from "@/types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Trash2,
  FileText,
  CheckSquare,
  Loader2,
  Users,
  Bell,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { formatYearMonthDay } from "@/lib/date-utils";

/** action_item 알림 발송 이력 localStorage 복합 ID 생성 */
function buildActionItemNotifId(minuteId: string, itemIdx: number): string {
  return `${minuteId}:${itemIdx}`;
}

type ActionItem = { title: string; owner: string | null; done: boolean };

interface MeetingMinutesSectionProps {
  ctx: EntityContext;
}

// 날짜 포맷

// 멤버 이름 가져오기
function getMemberName(userId: string, ctx: EntityContext): string {
  const member = ctx.members.find((m) => m.userId === userId);
  if (!member) return "알 수 없음";
  return ctx.nicknameMap[userId] || member.profile.name || "알 수 없음";
}

// 멤버 아바타 첫 글자
function getMemberInitial(userId: string, ctx: EntityContext): string {
  const name = getMemberName(userId, ctx);
  return name.charAt(0).toUpperCase();
}

// ============================================
// 회의록 작성 다이얼로그
// ============================================

interface WriteDialogProps {
  ctx: EntityContext;
  onSuccess: () => void;
}

function WriteDialog({ ctx, onSuccess }: WriteDialogProps) {
  const [open, setOpen] = useState(false);
  const { pending: saving, execute } = useAsyncAction();
  const { user } = useAuth();

  // 폼 상태
  const [title, setTitle] = useState("");
  const [meetingDate, setMeetingDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [content, setContent] = useState("");
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);
  const [decisions, setDecisions] = useState<string[]>([""]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([
    { title: "", owner: null, done: false },
  ]);

  const canWrite = ctx.permissions.canEdit || ctx.permissions.canManageMembers;

  function resetForm() {
    setTitle("");
    setMeetingDate(new Date().toISOString().slice(0, 10));
    setContent("");
    setSelectedAttendees([]);
    setDecisions([""]);
    setActionItems([{ title: "", owner: null, done: false }]);
  }

  function handleOpenChange(v: boolean) {
    setOpen(v);
    if (!v) resetForm();
  }

  // 참석자 토글
  function toggleAttendee(userId: string) {
    setSelectedAttendees((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  }

  // 결정사항 핸들러
  function addDecision() {
    setDecisions((prev) => [...prev, ""]);
  }

  function updateDecision(idx: number, value: string) {
    setDecisions((prev) => prev.map((d, i) => (i === idx ? value : d)));
  }

  function removeDecision(idx: number) {
    setDecisions((prev) => prev.filter((_, i) => i !== idx));
  }

  // 액션 아이템 핸들러
  function addActionItem() {
    setActionItems((prev) => [...prev, { title: "", owner: null, done: false }]);
  }

  function updateActionItem(
    idx: number,
    field: keyof ActionItem,
    value: string | boolean | null
  ) {
    setActionItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  }

  function removeActionItem(idx: number) {
    setActionItems((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit() {
    if (!title.trim()) {
      toast.error("제목을 입력해주세요");
      return;
    }
    if (!meetingDate) {
      toast.error("날짜를 선택해주세요");
      return;
    }

    await execute(async () => {
      const supabase = createClient();
      if (!user) {
        toast.error("로그인이 필요합니다");
        return;
      }

      const filteredDecisions = decisions.filter((d) => d.trim() !== "");
      const filteredActionItems = actionItems.filter((a) => a.title.trim() !== "");

      const { data: insertedData, error } = await supabase
        .from("meeting_minutes")
        .insert({
          group_id: ctx.groupId,
          project_id: ctx.projectId ?? null,
          title: title.trim(),
          content: content.trim() || null,
          attendees: selectedAttendees,
          decisions: filteredDecisions,
          action_items: filteredActionItems,
          meeting_date: meetingDate,
          created_by: user.id,
        })
        .select("id")
        .single();

      if (error) {
        toast.error("회의록 저장에 실패했습니다");
        return;
      }

      // owner가 지정된 action_item에 알림 발송 (본인 제외, 중복 방지)
      const minuteId = insertedData?.id ?? "";
      const minuteTitle = title.trim();
      const notifiedSet = getNotifiedActionItemIds();
      let notifiedCount = 0;

      for (let idx = 0; idx < filteredActionItems.length; idx++) {
        const item = filteredActionItems[idx];
        if (!item.owner) continue;

        const compositeId = buildActionItemNotifId(minuteId, idx);
        if (notifiedSet.has(compositeId)) continue;
        if (item.owner === user.id) continue;

        await notifyActionItemAssigned({
          groupId: ctx.groupId,
          projectId: ctx.projectId,
          minuteId,
          minuteTitle,
          actionItemTitle: item.title,
          assigneeUserId: item.owner,
          assignerUserId: user.id,
        });

        markActionItemNotified(compositeId);
        notifiedCount++;
      }

      if (notifiedCount > 0) {
        toast.success(`회의록이 저장되었습니다 (알림 ${notifiedCount}건 발송)`);
      } else {
        toast.success("회의록이 저장되었습니다");
      }

      invalidateMeetingMinutes(ctx.groupId, ctx.projectId);
      setOpen(false);
      resetForm();
      onSuccess();
    });
  }

  if (!canWrite) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 text-xs">
          <Plus className="h-3 w-3 mr-1" />
          회의록 작성
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm">회의록 작성</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 제목 */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">제목 *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="회의록 제목"
              className="h-8 text-xs"
            />
          </div>

          {/* 날짜 */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">회의 날짜 *</Label>
            <Input
              type="date"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* 내용 */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">회의 내용</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="회의 내용을 입력하세요"
              className="text-xs min-h-[80px] resize-none"
            />
          </div>

          {/* 참석자 */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium flex items-center gap-1">
              <Users className="h-3 w-3" />
              참석자
            </Label>
            <div className="border rounded-md p-2 max-h-32 overflow-y-auto space-y-1">
              {ctx.members.map((member) => {
                const name =
                  ctx.nicknameMap[member.userId] ||
                  member.profile.name ||
                  "알 수 없음";
                const checked = selectedAttendees.includes(member.userId);
                return (
                  <div
                    key={member.userId}
                    className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5"
                    onClick={() => toggleAttendee(member.userId)}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggleAttendee(member.userId)}
                      className="h-3.5 w-3.5"
                    />
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-[9px]">
                        {name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs">{name}</span>
                    {member.role === "leader" && (
                      <Badge className="text-[10px] px-1.5 py-0 ml-auto">
                        리더
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
            {selectedAttendees.length > 0 && (
              <p className="text-[10px] text-muted-foreground">
                {selectedAttendees.length}명 선택됨
              </p>
            )}
          </div>

          {/* 결정사항 */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">결정사항</Label>
            <div className="space-y-1.5">
              {decisions.map((decision, idx) => (
                <div key={idx} className="flex gap-1.5">
                  <Input
                    value={decision}
                    onChange={(e) => updateDecision(idx, e.target.value)}
                    placeholder={`결정사항 ${idx + 1}`}
                    className="h-7 text-xs flex-1"
                  />
                  {decisions.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => removeDecision(idx)}
                    >
                      <Trash2 className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs w-full"
                onClick={addDecision}
              >
                <Plus className="h-3 w-3 mr-1" />
                결정사항 추가
              </Button>
            </div>
          </div>

          {/* 액션 아이템 */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">액션 아이템</Label>
            <div className="space-y-2">
              {actionItems.map((item, idx) => (
                <div key={idx} className="flex gap-1.5 items-start">
                  <div className="flex-1 space-y-1">
                    <Input
                      value={item.title}
                      onChange={(e) =>
                        updateActionItem(idx, "title", e.target.value)
                      }
                      placeholder={`액션 아이템 ${idx + 1}`}
                      className="h-7 text-xs"
                    />
                    <Select
                      value={item.owner ?? "__none__"}
                      onValueChange={(v) =>
                        updateActionItem(
                          idx,
                          "owner",
                          v === "__none__" ? null : v
                        )
                      }
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue placeholder="담당자 선택 (선택)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__" className="text-xs">
                          담당자 없음
                        </SelectItem>
                        {ctx.members.map((member) => {
                          const name =
                            ctx.nicknameMap[member.userId] ||
                            member.profile.name ||
                            "알 수 없음";
                          return (
                            <SelectItem
                              key={member.userId}
                              value={member.userId}
                              className="text-xs"
                            >
                              {name}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  {actionItems.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 mt-0.5"
                      onClick={() => removeActionItem(idx)}
                    >
                      <Trash2 className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs w-full"
                onClick={addActionItem}
              >
                <Plus className="h-3 w-3 mr-1" />
                액션 아이템 추가
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setOpen(false)}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : null}
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 회의록 카드 (아코디언 아이템)
// ============================================

interface MinuteCardProps {
  minute: MeetingMinute;
  ctx: EntityContext;
  onActionItemToggle: (minuteId: string, itemIdx: number, done: boolean) => void;
  onDelete: (minuteId: string) => void;
  canDelete: boolean;
}

function MinuteCard({
  minute,
  ctx,
  onActionItemToggle,
  onDelete,
  canDelete,
}: MinuteCardProps) {
  const doneCount = minute.action_items.filter((a) => a.done).length;

  return (
    <AccordionItem value={minute.id} className="border rounded-md mb-2 last:mb-0">
      <AccordionTrigger className="px-3 py-2 hover:no-underline hover:bg-muted/30 rounded-t-md [&[data-state=open]]:rounded-b-none">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs font-medium truncate">{minute.title}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {formatYearMonthDay(minute.meeting_date)}
              {minute.attendees.length > 0 && (
                <span className="ml-2">
                  참석 {minute.attendees.length}명
                </span>
              )}
              {minute.action_items.length > 0 && (
                <span className="ml-2">
                  액션 {doneCount}/{minute.action_items.length}
                </span>
              )}
            </p>
          </div>
          {/* 참석자 아바타 */}
          {minute.attendees.length > 0 && (
            <div className="flex -space-x-1 shrink-0">
              {minute.attendees.slice(0, 4).map((uid) => (
                <Avatar key={uid} className="h-5 w-5 border border-background">
                  <AvatarFallback className="text-[8px]">
                    {getMemberInitial(uid, ctx)}
                  </AvatarFallback>
                </Avatar>
              ))}
              {minute.attendees.length > 4 && (
                <div className="h-5 w-5 rounded-full bg-muted border border-background flex items-center justify-center">
                  <span className="text-[8px] text-muted-foreground">
                    +{minute.attendees.length - 4}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </AccordionTrigger>

      <AccordionContent className="px-3 pb-3">
        <div className="space-y-3 pt-1">
          {/* 회의 내용 */}
          {minute.content && (
            <div>
              <p className="text-[10px] font-medium text-muted-foreground mb-1">
                회의 내용
              </p>
              <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed bg-muted/30 rounded px-2 py-1.5">
                {minute.content}
              </p>
            </div>
          )}

          {/* 참석자 목록 */}
          {minute.attendees.length > 0 && (
            <div>
              <p className="text-[10px] font-medium text-muted-foreground mb-1">
                참석자
              </p>
              <div className="flex flex-wrap gap-1">
                {minute.attendees.map((uid) => (
                  <div
                    key={uid}
                    className="flex items-center gap-1 bg-muted/50 rounded-full px-1.5 py-0.5"
                  >
                    <Avatar className="h-4 w-4">
                      <AvatarFallback className="text-[8px]">
                        {getMemberInitial(uid, ctx)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-[10px]">
                      {getMemberName(uid, ctx)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 결정사항 */}
          {minute.decisions.length > 0 && (
            <div>
              <p className="text-[10px] font-medium text-muted-foreground mb-1">
                결정사항
              </p>
              <ul className="space-y-0.5">
                {minute.decisions.map((decision, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-1.5 text-xs"
                  >
                    <span className="text-muted-foreground mt-0.5 shrink-0">•</span>
                    <span>{decision}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 액션 아이템 */}
          {minute.action_items.length > 0 && (
            <div>
              <p className="text-[10px] font-medium text-muted-foreground mb-1">
                액션 아이템
              </p>
              <div className="space-y-1">
                {minute.action_items.map((item, idx) => {
                  const compositeId = buildActionItemNotifId(minute.id, idx);
                  const isNotified = getNotifiedActionItemIds().has(compositeId);
                  return (
                    <div
                      key={idx}
                      className="flex items-start gap-2 group"
                    >
                      <Checkbox
                        checked={item.done}
                        onCheckedChange={(checked) =>
                          onActionItemToggle(minute.id, idx, checked as boolean)
                        }
                        className="h-3.5 w-3.5 mt-0.5 shrink-0"
                      />
                      <div className="flex-1 min-w-0 flex flex-wrap items-center gap-1">
                        <span
                          className={`text-xs ${
                            item.done
                              ? "line-through text-muted-foreground"
                              : "text-foreground"
                          }`}
                        >
                          {item.title}
                        </span>
                        {item.owner && (
                          <span className="text-[10px] text-muted-foreground">
                            @ {getMemberName(item.owner, ctx)}
                          </span>
                        )}
                        {isNotified && item.owner && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-green-600 bg-green-50 rounded px-1 py-0">
                            <Bell className="h-2.5 w-2.5" />
                            알림 발송됨
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 삭제 버튼 */}
          {canDelete && (
            <div className="flex justify-end pt-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[10px] text-destructive hover:text-destructive px-2"
                onClick={() => onDelete(minute.id)}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                삭제
              </Button>
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

// ============================================
// 메인 섹션 컴포넌트
// ============================================

export function MeetingMinutesSection({ ctx }: MeetingMinutesSectionProps) {
  const { minutes, loading, refetch } = useMeetingMinutes(
    ctx.groupId,
    ctx.projectId
  );

  const canManage =
    ctx.permissions.canEdit || ctx.permissions.canManageMembers;

  // 액션 아이템 완료 토글
  async function handleActionItemToggle(
    minuteId: string,
    itemIdx: number,
    done: boolean
  ) {
    const minute = minutes.find((m) => m.id === minuteId);
    if (!minute) return;

    const updatedItems = minute.action_items.map((item, idx) =>
      idx === itemIdx ? { ...item, done } : item
    );

    const supabase = createClient();
    const { error } = await supabase
      .from("meeting_minutes")
      .update({ action_items: updatedItems, updated_at: new Date().toISOString() })
      .eq("id", minuteId);

    if (error) {
      toast.error("업데이트에 실패했습니다");
      return;
    }

    invalidateMeetingMinutes(ctx.groupId, ctx.projectId);
    refetch();
  }

  // 삭제
  async function handleDelete(minuteId: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("meeting_minutes")
      .delete()
      .eq("id", minuteId);

    if (error) {
      toast.error(TOAST.DELETE_ERROR);
      return;
    }

    toast.success("회의록이 삭제되었습니다");
    invalidateMeetingMinutes(ctx.groupId, ctx.projectId);
    refetch();
  }

  return (
    <Card className="mt-4">
      <CardHeader className="px-3 py-2.5 flex flex-row items-center justify-between border-b">
        <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
          회의록
          {minutes.length > 0 && (
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0 ml-1"
            >
              {minutes.length}
            </Badge>
          )}
        </CardTitle>
        <WriteDialog ctx={ctx} onSuccess={refetch} />
      </CardHeader>

      <CardContent className="px-3 py-3">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : minutes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <CheckSquare className="h-8 w-8 mb-2 opacity-30" />
            <p className="text-xs">회의록이 없습니다</p>
            {canManage && (
              <p className="text-[10px] mt-0.5">
                &ldquo;회의록 작성&rdquo; 버튼으로 첫 회의록을 추가하세요
              </p>
            )}
          </div>
        ) : (
          <Accordion type="multiple" className="space-y-0">
            {minutes.map((minute) => (
              <MinuteCard
                key={minute.id}
                minute={minute}
                ctx={ctx}
                onActionItemToggle={handleActionItemToggle}
                onDelete={handleDelete}
                canDelete={canManage}
              />
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}
