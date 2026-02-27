"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { useEntitySettings } from "@/hooks/use-entity-settings";
import {
  GROUP_RULES_SETTING_KEY,
  DEFAULT_GROUP_RULES_DATA,
  type GroupRulesData,
} from "@/types";

export function useGroupRules(groupId: string) {
  const { value, loading, save, refetch } =
    useEntitySettings<GroupRulesData>(
      { entityType: "group", entityId: groupId, key: GROUP_RULES_SETTING_KEY },
      DEFAULT_GROUP_RULES_DATA
    );

  const saveRules = useCallback(
    async (title: string, content: string, isVisible: boolean) => {
      const newData: GroupRulesData = {
        title: title.trim(),
        content: content.trim(),
        isVisible,
        updatedAt: new Date().toISOString(),
      };

      const { error } = await save(newData);

      if (error) {
        toast.error("규칙 저장에 실패했습니다");
        return false;
      }

      toast.success("규칙이 저장되었습니다");
      return true;
    },
    [save]
  );

  return {
    rules: value,
    loading,
    saveRules,
    refetch,
  };
}
