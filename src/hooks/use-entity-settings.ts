"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import type { EntitySettingRow } from "@/types";

type UseEntitySettingsParams = {
  entityType: "group" | "project";
  entityId: string;
  key: string;
};

export function useEntitySettings<T extends Record<string, unknown>>(
  params: UseEntitySettingsParams,
  defaultValue: T
) {
  const { entityType, entityId, key } = params;

  const { data, isLoading, mutate } = useSWR(
    entityId ? swrKeys.entitySettings(entityType, entityId, key) : null,
    async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("entity_settings")
        .select("*")
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .eq("key", key)
        .maybeSingle();

      if (error) {
        console.error("entity_settings 조회 오류:", error);
        return null;
      }

      return data as EntitySettingRow | null;
    }
  );

  const value: T = (data?.value as T) ?? defaultValue;

  const save = async (newValue: T): Promise<{ error: Error | null }> => {
    // Optimistic: 즉시 UI 업데이트
    await mutate(
      (prev) => prev
        ? { ...prev, value: newValue as unknown as Record<string, unknown>, updated_at: new Date().toISOString() }
        : ({ id: "", entity_type: entityType, entity_id: entityId, key, value: newValue as unknown as Record<string, unknown>, updated_at: new Date().toISOString() } satisfies EntitySettingRow),
      false
    );

    const supabase = createClient();
    const { error } = await supabase.from("entity_settings").upsert(
      {
        entity_type: entityType,
        entity_id: entityId,
        key,
        value: newValue as unknown as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "entity_type,entity_id,key" }
    );

    if (error) {
      // 롤백
      mutate();
      toast.error(TOAST.SETTINGS.SAVE_ERROR);
      return { error: new Error(error.message) };
    }

    return { error: null };
  };

  return {
    value,
    loading: isLoading,
    save,
    refetch: () => mutate(),
  };
}
