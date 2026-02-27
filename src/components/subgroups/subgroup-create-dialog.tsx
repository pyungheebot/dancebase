"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { invalidateSubgroups } from "@/lib/swr/invalidate";
import {
  GroupFormFields,
  DEFAULT_GROUP_FORM_VALUES,
  type GroupFormValues,
} from "@/components/groups/group-form-fields";

interface SubgroupCreateDialogProps {
  parentGroupId: string;
  onCreated?: () => void;
}

export function SubgroupCreateDialog({ parentGroupId, onCreated }: SubgroupCreateDialogProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<GroupFormValues>(DEFAULT_GROUP_FORM_VALUES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleChange = <K extends keyof GroupFormValues>(key: K, value: GroupFormValues[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { data: groupId, error: rpcError } = await supabase.rpc(
        "create_group_with_leader",
        {
          group_name: form.name,
          group_description: form.description || null,
          group_type: form.groupType,
          parent_group_id: parentGroupId,
          p_visibility: form.visibility,
          p_join_policy: form.joinPolicy,
          p_dance_genre: form.danceGenre,
          p_max_members: form.maxMembers ? parseInt(form.maxMembers, 10) : null,
        }
      );

      if (rpcError) {
        setError(`하위그룹 생성 실패: ${rpcError.message}`);
        return;
      }

      if (!groupId) {
        setError("그룹 ID를 받지 못했습니다");
        return;
      }

      invalidateSubgroups(parentGroupId);
      setOpen(false);
      setForm(DEFAULT_GROUP_FORM_VALUES);
      onCreated?.();
      router.push(`/groups/${groupId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : JSON.stringify(err);
      setError(`오류: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 text-xs">
          <Plus className="h-3 w-3 mr-1" />
          하위그룹 만들기
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm">하위그룹 만들기</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <GroupFormFields values={form} onChange={handleChange} />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading || !form.name.trim()}>
            {loading ? "생성 중..." : "하위그룹 만들기"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
