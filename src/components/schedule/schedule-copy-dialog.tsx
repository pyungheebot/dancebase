"use client";

import { useState, useEffect } from "react";
import { format, addDays } from "date-fns";
import { ko } from "date-fns/locale";
import { Copy, Clock, MapPin, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { invalidateSchedules } from "@/lib/swr/invalidate";
import type { Schedule } from "@/types";

type SourceProject = {
  id: string;
  name: string;
};

type ScheduleCopyDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  currentProjectId: string;
  onCopied: () => void;
};

export function ScheduleCopyDialog({
  open,
  onOpenChange,
  groupId,
  currentProjectId,
  onCopied,
}: ScheduleCopyDialogProps) {
  const [projects, setProjects] = useState<SourceProject[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [sourceSchedules, setSourceSchedules] = useState<Schedule[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [offsetDays, setOffsetDays] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  // 다이얼로그가 열릴 때 같은 그룹의 프로젝트 목록 조회
  useEffect(() => {
    if (!open) return;

    const fetchProjects = async () => {
      setProjectsLoading(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("projects")
          .select("id, name")
          .eq("group_id", groupId)
          .neq("id", currentProjectId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setProjects(data ?? []);
      } catch {
        toast.error("프로젝트 목록을 불러오지 못했습니다");
      } finally {
        setProjectsLoading(false);
      }
    };

    fetchProjects();
  }, [open, groupId, currentProjectId]);

  // 원본 프로젝트 선택 시 해당 프로젝트의 일정 조회
  useEffect(() => {
    if (!selectedProjectId) {
      setSourceSchedules([]);
      setSelectedIds(new Set());
      return;
    }

    const fetchSchedules = async () => {
      setSchedulesLoading(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("schedules")
          .select("*")
          .eq("group_id", groupId)
          .eq("project_id", selectedProjectId)
          .order("starts_at", { ascending: true });

        if (error) throw error;
        setSourceSchedules(data ?? []);
        setSelectedIds(new Set());
      } catch {
        toast.error("일정을 불러오지 못했습니다");
      } finally {
        setSchedulesLoading(false);
      }
    };

    fetchSchedules();
  }, [selectedProjectId, groupId]);

  const allSelected =
    sourceSchedules.length > 0 &&
    selectedIds.size === sourceSchedules.length;
  const someSelected =
    selectedIds.size > 0 && selectedIds.size < sourceSchedules.length;

  const toggleAll = () => {
    if (selectedIds.size === sourceSchedules.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sourceSchedules.map((s) => s.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCopy = async () => {
    if (!selectedProjectId) {
      toast.error("원본 프로젝트를 선택해주세요");
      return;
    }
    if (selectedIds.size === 0) {
      toast.error("복사할 일정을 하나 이상 선택해주세요");
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();

      const schedulesToCopy = sourceSchedules.filter((s) =>
        selectedIds.has(s.id)
      );

      const insertRows = schedulesToCopy.map((s) => ({
        group_id: groupId,
        project_id: currentProjectId,
        title: s.title,
        description: s.description,
        location: s.location,
        starts_at: addDays(new Date(s.starts_at), offsetDays).toISOString(),
        ends_at: addDays(new Date(s.ends_at), offsetDays).toISOString(),
        attendance_method: s.attendance_method,
        late_threshold: s.late_threshold,
        attendance_deadline: s.attendance_deadline
          ? addDays(new Date(s.attendance_deadline), offsetDays).toISOString()
          : null,
        require_checkout: s.require_checkout,
      }));

      const { error } = await supabase.from("schedules").insert(insertRows);

      if (error) throw error;

      invalidateSchedules(groupId, currentProjectId);

      toast.success(`${selectedIds.size}개 일정을 복사했습니다`);
      onCopied();
      handleClose();
    } catch {
      toast.error("일정 복사에 실패했습니다");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedProjectId("");
    setSourceSchedules([]);
    setSelectedIds(new Set());
    setOffsetDays(0);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-1.5">
            <Copy className="h-4 w-4" />
            일정 복사
          </DialogTitle>
          <DialogDescription className="text-xs">
            다른 프로젝트의 일정을 현재 프로젝트로 복사합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 원본 프로젝트 선택 */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">원본 프로젝트</Label>
            {projectsLoading ? (
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground py-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                불러오는 중...
              </div>
            ) : projects.length === 0 ? (
              <p className="text-[11px] text-muted-foreground py-1">
                같은 그룹의 다른 프로젝트가 없습니다
              </p>
            ) : (
              <Select
                value={selectedProjectId}
                onValueChange={setSelectedProjectId}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="프로젝트를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-xs">
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* 날짜 오프셋 */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">날짜 오프셋 (일)</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={offsetDays}
                onChange={(e) => setOffsetDays(Number(e.target.value))}
                className="h-8 text-xs w-24"
                placeholder="0"
              />
              <span className="text-[11px] text-muted-foreground">
                {offsetDays === 0
                  ? "원본 날짜 그대로 복사"
                  : offsetDays > 0
                  ? `원본보다 ${offsetDays}일 이후`
                  : `원본보다 ${Math.abs(offsetDays)}일 이전`}
              </span>
            </div>
          </div>

          {/* 일정 목록 */}
          {selectedProjectId && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">일정 선택</Label>
                {sourceSchedules.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Checkbox
                      id="copy-select-all"
                      checked={allSelected}
                      data-state={someSelected ? "indeterminate" : undefined}
                      onCheckedChange={toggleAll}
                      className="h-3.5 w-3.5"
                    />
                    <Label
                      htmlFor="copy-select-all"
                      className="text-[11px] text-muted-foreground cursor-pointer"
                    >
                      전체 선택 ({selectedIds.size}/{sourceSchedules.length})
                    </Label>
                  </div>
                )}
              </div>

              {schedulesLoading ? (
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground py-4 justify-center">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  일정 불러오는 중...
                </div>
              ) : sourceSchedules.length === 0 ? (
                <div className="text-[11px] text-muted-foreground py-4 text-center">
                  선택한 프로젝트에 일정이 없습니다
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto">
                  <div className="space-y-1 pr-1">
                    {sourceSchedules.map((schedule) => {
                      const isSelected = selectedIds.has(schedule.id);
                      const copiedDate =
                        offsetDays !== 0
                          ? addDays(new Date(schedule.starts_at), offsetDays)
                          : null;
                      return (
                        <div
                          key={schedule.id}
                          className={`flex items-start gap-2.5 rounded-md border px-2.5 py-2 cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-muted/60 border-primary/30"
                              : "hover:bg-muted/30"
                          }`}
                          onClick={() => toggleOne(schedule.id)}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleOne(schedule.id)}
                            className="h-3.5 w-3.5 mt-0.5 shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">
                              {schedule.title}
                            </p>
                            <div className="flex flex-col gap-0.5 mt-0.5">
                              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                                <Clock className="h-2.5 w-2.5 shrink-0" />
                                {format(
                                  new Date(schedule.starts_at),
                                  "M/d (EEE) HH:mm",
                                  { locale: ko }
                                )}
                                {copiedDate && (
                                  <span className="ml-1 text-blue-500">
                                    -{">"}
                                    {format(copiedDate, "M/d (EEE) HH:mm", {
                                      locale: ko,
                                    })}
                                  </span>
                                )}
                              </span>
                              {schedule.location && (
                                <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                                  <MapPin className="h-2.5 w-2.5 shrink-0" />
                                  <span className="truncate">
                                    {schedule.location}
                                  </span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={handleClose}
            disabled={submitting}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleCopy}
            disabled={
              submitting ||
              selectedIds.size === 0 ||
              !selectedProjectId
            }
          >
            {submitting ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                복사 중...
              </>
            ) : (
              <>
                <Copy className="h-3 w-3 mr-1" />
                {selectedIds.size > 0
                  ? `${selectedIds.size}개 일정 복사`
                  : "일정을 선택하세요"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
