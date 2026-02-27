"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { duplicateProject, type DuplicateOptions } from "@/lib/project-duplicate";
import { invalidateProject } from "@/lib/swr/invalidate";
import type { Project } from "@/types";

interface ProjectDuplicateDialogProps {
  groupId: string;
  projects: Project[];
  onDuplicated: () => void;
}

const DEFAULT_OPTIONS: DuplicateOptions = {
  boardCategories: true,
  financeCategories: true,
  scheduleTemplates: true,
};

export function ProjectDuplicateDialog({
  groupId,
  projects,
  onDuplicated,
}: ProjectDuplicateDialogProps) {
  const [open, setOpen] = useState(false);
  const [sourceProjectId, setSourceProjectId] = useState<string>("");
  const [newName, setNewName] = useState("");
  const [options, setOptions] = useState<DuplicateOptions>(DEFAULT_OPTIONS);
  const [submitting, setSubmitting] = useState(false);

  const toggleOption = (key: keyof DuplicateOptions) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      // 닫힐 때 폼 초기화
      setSourceProjectId("");
      setNewName("");
      setOptions(DEFAULT_OPTIONS);
    }
  };

  const handleSourceSelect = (projectId: string) => {
    setSourceProjectId(projectId);
    // 선택한 프로젝트 이름을 기본값으로 채움
    const selected = projects.find((p) => p.id === projectId);
    if (selected) {
      setNewName(`${selected.name} 복제본`);
    }
  };

  const handleSubmit = async () => {
    if (!sourceProjectId) {
      toast.error("복제할 원본 프로젝트를 선택해주세요.");
      return;
    }
    if (!newName.trim()) {
      toast.error("새 프로젝트 이름을 입력해주세요.");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error("로그인이 필요합니다.");
      setSubmitting(false);
      return;
    }

    const { newProjectId, error } = await duplicateProject(
      supabase,
      sourceProjectId,
      newName,
      user.id,
      options
    );

    setSubmitting(false);

    if (error || !newProjectId) {
      toast.error(error ?? "프로젝트 복제에 실패했습니다.");
      return;
    }

    toast.success(`"${newName}" 프로젝트가 복제되었습니다.`);
    invalidateProject(newProjectId, groupId);
    onDuplicated();
    setOpen(false);
  };

  const isValid = !!sourceProjectId && newName.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs">
          <Copy className="h-3 w-3 mr-1" />
          프로젝트 복제
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>프로젝트 복제</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* 원본 프로젝트 선택 */}
          <div>
            <Label className="text-xs">원본 프로젝트</Label>
            <Select value={sourceProjectId} onValueChange={handleSourceSelect}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="복제할 프로젝트 선택" />
              </SelectTrigger>
              <SelectContent>
                {projects.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-muted-foreground">
                    복제 가능한 프로젝트가 없습니다.
                  </div>
                ) : (
                  projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* 새 프로젝트 이름 */}
          <div>
            <Label className="text-xs">새 프로젝트 이름</Label>
            <Input
              className="mt-1"
              placeholder="새 프로젝트 이름 입력"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>

          {/* 복제 항목 선택 */}
          <div>
            <Label className="text-xs mb-2 block">복제할 항목</Label>
            <div className="space-y-2 rounded-md border p-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={options.boardCategories}
                  onCheckedChange={() => toggleOption("boardCategories")}
                />
                <span className="text-sm">게시판 카테고리</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={options.financeCategories}
                  onCheckedChange={() => toggleOption("financeCategories")}
                />
                <span className="text-sm">회비 카테고리</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={options.scheduleTemplates}
                  onCheckedChange={() => toggleOption("scheduleTemplates")}
                />
                <span className="text-sm">일정 템플릿</span>
              </label>
            </div>
          </div>

          {/* 안내 문구 */}
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            프로젝트 기본 정보(이름, 설명, 유형, 공개 설정)와 선택한 항목이 복사됩니다.
            복제된 프로젝트의 상태는 "신규"로 설정됩니다.
          </p>

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={submitting || !isValid}
          >
            {submitting ? "복제 중..." : "복제 생성"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
