"use client";

import { useState, useEffect, startTransition } from "react";
import { useAsyncAction } from "@/hooks/use-async-action";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import { toast } from "sonner";
import { invalidateSubgroups } from "@/lib/swr/invalidate";
import { validateField, VALIDATION } from "@/lib/validation-rules";

interface SubgroupEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subgroup: {
    id: string;
    name: string;
    description: string | null;
  };
  parentGroupId: string;
  onUpdated?: () => void;
}

export function SubgroupEditDialog({
  open,
  onOpenChange,
  subgroup,
  parentGroupId,
  onUpdated,
}: SubgroupEditDialogProps) {
  const [name, setName] = useState(subgroup.name);
  const [description, setDescription] = useState(subgroup.description ?? "");
  const [nameError, setNameError] = useState<string | null>(null);
  const { pending, execute } = useAsyncAction();

  useEffect(() => {
    if (open) {
      startTransition(() => {
        setName(subgroup.name);
        setDescription(subgroup.description ?? "");
        setNameError(null);
      });
    }
  }, [open, subgroup]);

  // 이름 blur 시 검증
  const handleNameBlur = () => {
    setNameError(validateField(name, VALIDATION.name));
  };

  // 이름 변경 시 실시간 에러 초기화
  const handleNameChange = (value: string) => {
    setName(value);
    if (nameError) {
      setNameError(validateField(value, VALIDATION.name));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 제출 전 최종 검증
    const err = validateField(name, VALIDATION.name);
    if (err) {
      setNameError(err);
      return;
    }

    await execute(async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from("groups")
        .update({
          name: name.trim(),
          description: description.trim() || null,
        })
        .eq("id", subgroup.id);

      if (error) {
        toast.error("하위그룹 수정에 실패했습니다");
        return;
      }
      toast.success("하위그룹이 수정되었습니다");
      invalidateSubgroups(parentGroupId);
      onOpenChange(false);
      onUpdated?.();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">하위그룹 수정</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 이름 필드 */}
          <FormField
            label="이름"
            htmlFor="edit-subgroup-name"
            required
            error={nameError}
          >
            <Input
              id="edit-subgroup-name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              onBlur={handleNameBlur}
              placeholder="하위그룹 이름"
              className="h-8 text-sm"
              maxLength={50}
              aria-invalid={!!nameError}
              aria-describedby={nameError ? "edit-subgroup-name-help" : undefined}
              aria-required="true"
            />
          </FormField>

          {/* 설명 필드 */}
          <FormField
            label="설명"
            htmlFor="edit-subgroup-description"
            description="500자 이내로 입력해주세요"
          >
            <Textarea
              id="edit-subgroup-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="하위그룹 설명 (선택)"
              className="text-sm resize-none"
              rows={3}
              maxLength={500}
              showCharCount
              aria-label="하위그룹 설명"
            />
          </FormField>

          <Button
            type="submit"
            className="w-full"
            disabled={pending || !name.trim()}
          >
            {pending ? "저장 중..." : "저장"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
