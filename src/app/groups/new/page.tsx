"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import {
  GroupFormFields,
  DEFAULT_GROUP_FORM_VALUES,
  type GroupFormValues,
} from "@/components/groups/group-form-fields";

export default function NewGroupPage() {
  const [form, setForm] = useState<GroupFormValues>(DEFAULT_GROUP_FORM_VALUES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleChange = <K extends keyof GroupFormValues>(key: K, value: GroupFormValues[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("로그인이 필요합니다");
        return;
      }

      const { data: groupId, error: rpcError } = await supabase.rpc(
        "create_group_with_leader",
        {
          group_name: form.name,
          group_description: form.description || null,
          group_type: form.groupType,
          p_visibility: form.visibility,
          p_join_policy: form.joinPolicy,
          p_dance_genre: form.danceGenre,
          p_max_members: form.maxMembers ? parseInt(form.maxMembers, 10) : null,
        }
      );

      if (rpcError) {
        console.error("RPC 오류:", rpcError);
        setError(`그룹 생성 실패: ${rpcError.message} (${rpcError.code})`);
        return;
      }

      if (!groupId) {
        setError("그룹 ID를 받지 못했습니다");
        return;
      }

      router.push(`/groups/${groupId}`);
    } catch (err) {
      console.error("예외 발생:", err);
      const message = err instanceof Error ? err.message : JSON.stringify(err);
      setError(`오류: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-6 py-6">
        <h2 className="text-sm font-medium mb-3">새 그룹 만들기</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <GroupFormFields values={form} onChange={handleChange} />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading || !form.name.trim()}>
            {loading ? "생성 중..." : "그룹 만들기"}
          </Button>
        </form>
      </div>
    </AppLayout>
  );
}
