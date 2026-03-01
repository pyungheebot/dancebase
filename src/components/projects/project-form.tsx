"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { SubmitButton } from "@/components/shared/submit-button";
import { toast } from "sonner";
import { useAsyncAction } from "@/hooks/use-async-action";
import { useAuth } from "@/hooks/use-auth";
import {
  ProjectFormFields,
  DEFAULT_PROJECT_FORM_VALUES,
  type ProjectFormValues,
} from "@/components/projects/project-form-fields";

interface ProjectFormProps {
  groupId: string;
  onCreated: () => void;
}

export function ProjectForm({ groupId, onCreated }: ProjectFormProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ProjectFormValues>(DEFAULT_PROJECT_FORM_VALUES);
  const { pending: submitting, execute } = useAsyncAction();
  const { user } = useAuth();
  const supabase = createClient();

  const handleChange = <K extends keyof ProjectFormValues>(key: K, value: ProjectFormValues[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    await execute(async () => {
      if (!user) return;

      const { error } = await supabase.rpc("create_project", {
        p_group_id: groupId,
        p_name: form.name.trim(),
        p_description: form.description.trim() || null,
        p_type: form.type,
        p_enabled_features: form.features,
        p_visibility: form.visibility,
        p_start_date: form.start_date || null,
        p_end_date: form.end_date || null,
      });

      if (error) {
        toast.error(`프로젝트 생성 실패: ${error.message}`);
        return;
      }

      setForm(DEFAULT_PROJECT_FORM_VALUES);
      setOpen(false);
      onCreated();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 text-xs">
          <Plus className="h-3 w-3 mr-1" />
          새 프로젝트
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>새 프로젝트 만들기</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <ProjectFormFields values={form} onChange={handleChange} />
          <SubmitButton
            className="w-full"
            onClick={handleSubmit}
            loading={submitting}
            loadingText="생성 중..."
            disabled={!form.name.trim()}
          >
            생성
          </SubmitButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
