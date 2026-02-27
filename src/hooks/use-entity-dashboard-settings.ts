"use client";

import { useState, useMemo, useCallback } from "react";
import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";

type CardWithDisabled = {
  id: string;
  visible: boolean;
  label: string;
  disabled: boolean;
  disabledReason?: string;
};

type UseEntityDashboardSettingsParams = {
  entityId: string;
  memberTable: "group_members" | "project_members";
  memberIdField: "group_id" | "project_id";
  cards: { id: string; label: string }[];
  defaultCards: { id: string; visible: boolean }[];
  filterFn?: (card: { id: string; visible: boolean }) => boolean;
  disabledFn?: (cardId: string) => { disabled: boolean; reason?: string };
};

export function useEntityDashboardSettings(params: UseEntityDashboardSettingsParams) {
  const {
    entityId,
    memberTable,
    memberIdField,
    cards,
    defaultCards,
    filterFn,
    disabledFn,
  } = params;

  const [saving, setSaving] = useState(false);

  const { data: settings, isLoading, mutate } = useSWR(
    swrKeys.dashboardSettings(entityId, memberTable),
    async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from(memberTable)
        .select("dashboard_settings")
        .eq(memberIdField, entityId)
        .eq("user_id", user.id)
        .single();

      if (data?.dashboard_settings) {
        return data.dashboard_settings as { id: string; visible: boolean }[];
      }

      return null;
    },
  );

  const mergedSettings = useMemo((): { id: string; visible: boolean }[] => {
    const base = settings ?? defaultCards;
    const existingIds = new Set(base.map((c) => c.id));
    const merged = [...base];

    for (const def of defaultCards) {
      if (!existingIds.has(def.id)) {
        merged.push(def);
      }
    }

    const validIds = new Set(cards.map((c) => c.id));
    return merged.filter((c) => validIds.has(c.id));
  }, [settings, defaultCards, cards]);

  const visibleCards = useMemo((): { id: string; visible: boolean }[] => {
    return mergedSettings.filter((card) => {
      if (!card.visible) return false;
      if (filterFn && !filterFn(card)) return false;
      return true;
    });
  }, [mergedSettings, filterFn]);

  const allCards = useMemo((): CardWithDisabled[] => {
    return mergedSettings.map((card) => {
      const meta = cards.find((c) => c.id === card.id);
      const disabledInfo = disabledFn ? disabledFn(card.id) : { disabled: false };
      return {
        ...card,
        label: meta?.label ?? card.id,
        disabled: disabledInfo.disabled,
        disabledReason: disabledInfo.reason,
      };
    });
  }, [mergedSettings, cards, disabledFn]);

  const saveSettings = useCallback(
    async (newSettings: { id: string; visible: boolean }[]) => {
      setSaving(true);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setSaving(false);
        return;
      }

      await supabase
        .from(memberTable)
        .update({ dashboard_settings: newSettings as unknown as Record<string, unknown> })
        .eq(memberIdField, entityId)
        .eq("user_id", user.id);

      await mutate(newSettings, false);
      setSaving(false);
    },
    [entityId, memberTable, memberIdField, mutate],
  );

  return { visibleCards, allCards, saveSettings, saving, loading: isLoading };
}
