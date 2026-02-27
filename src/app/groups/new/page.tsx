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
  type GroupFormFieldErrors,
} from "@/components/groups/group-form-fields";
import {
  validateRequired,
  validateMinLength,
  validateMaxLength,
  validatePositiveNumber,
} from "@/lib/validation";

export default function NewGroupPage() {
  const [form, setForm] = useState<GroupFormValues>(DEFAULT_GROUP_FORM_VALUES);
  const [fieldErrors, setFieldErrors] = useState<GroupFormFieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleChange = <K extends keyof GroupFormValues>(key: K, value: GroupFormValues[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    // 값이 바뀌면 해당 필드의 에러를 즉시 재검증
    if (key === "name") {
      setFieldErrors((prev) => ({
        ...prev,
        name: validateNameField(value as string) ?? undefined,
      }));
    }
    if (key === "maxMembers") {
      setFieldErrors((prev) => ({
        ...prev,
        maxMembers: validateMaxMembersField(value as string) ?? undefined,
      }));
    }
  };

  const validateNameField = (value: string): string | null => {
    return (
      validateRequired(value, "그룹 이름") ??
      validateMinLength(value, 2, "그룹 이름") ??
      validateMaxLength(value, 50, "그룹 이름")
    );
  };

  const validateMaxMembersField = (value: string): string | null => {
    if (!value.trim()) return null; // 비어있으면 무제한으로 허용
    const err = validatePositiveNumber(value);
    if (err) return "최대 인원은 1명 이상의 정수여야 합니다";
    return null;
  };

  const handleBlur = (field: keyof GroupFormFieldErrors) => {
    if (field === "name") {
      setFieldErrors((prev) => ({
        ...prev,
        name: validateNameField(form.name) ?? undefined,
      }));
    }
    if (field === "maxMembers") {
      setFieldErrors((prev) => ({
        ...prev,
        maxMembers: validateMaxMembersField(form.maxMembers) ?? undefined,
      }));
    }
  };

  const validateAll = (): boolean => {
    const nameError = validateNameField(form.name);
    const maxMembersError = validateMaxMembersField(form.maxMembers);
    setFieldErrors({
      name: nameError ?? undefined,
      maxMembers: maxMembersError ?? undefined,
    });
    return !nameError && !maxMembersError;
  };

  const isFormValid =
    !validateNameField(form.name) &&
    !validateMaxMembersField(form.maxMembers);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll()) return;

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
        setError(`그룹 생성 실패: ${rpcError.message} (${rpcError.code})`);
        return;
      }

      if (!groupId) {
        setError("그룹 ID를 받지 못했습니다");
        return;
      }

      router.push(`/groups/${groupId}`);
    } catch (err) {
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
          <GroupFormFields
            values={form}
            onChange={handleChange}
            errors={fieldErrors}
            onBlur={handleBlur}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading || !isFormValid}>
            {loading ? "생성 중..." : "그룹 만들기"}
          </Button>
        </form>
      </div>
    </AppLayout>
  );
}
