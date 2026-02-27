"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { useEntitySettings } from "@/hooks/use-entity-settings";
import {
  GROUP_LINKS_SETTING_KEY,
  DEFAULT_GROUP_LINKS_SETTING,
  type GroupLink,
  type GroupLinksSettingValue,
} from "@/types";

export function useGroupLinks(groupId: string) {
  const {
    value,
    loading,
    save,
    refetch,
  } = useEntitySettings<GroupLinksSettingValue>(
    { entityType: "group", entityId: groupId, key: GROUP_LINKS_SETTING_KEY },
    DEFAULT_GROUP_LINKS_SETTING
  );

  const links = value.links ?? [];

  const addLink = useCallback(
    async (link: Omit<GroupLink, "id" | "order">) => {
      const newLink: GroupLink = {
        id: crypto.randomUUID(),
        url: link.url,
        title: link.title,
        icon: link.icon,
        order: links.length,
      };

      const newLinks = [...links, newLink];
      const { error } = await save({ links: newLinks });

      if (error) {
        toast.error("링크 추가에 실패했습니다");
        return false;
      }

      toast.success("링크가 추가되었습니다");
      return true;
    },
    [links, save]
  );

  const updateLink = useCallback(
    async (id: string, updates: Partial<Omit<GroupLink, "id" | "order">>) => {
      const newLinks = links.map((link) =>
        link.id === id ? { ...link, ...updates } : link
      );
      const { error } = await save({ links: newLinks });

      if (error) {
        toast.error("링크 수정에 실패했습니다");
        return false;
      }

      toast.success("링크가 수정되었습니다");
      return true;
    },
    [links, save]
  );

  const deleteLink = useCallback(
    async (id: string) => {
      const newLinks = links
        .filter((link) => link.id !== id)
        .map((link, index) => ({ ...link, order: index }));
      const { error } = await save({ links: newLinks });

      if (error) {
        toast.error("링크 삭제에 실패했습니다");
        return false;
      }

      toast.success("링크가 삭제되었습니다");
      return true;
    },
    [links, save]
  );

  const moveLink = useCallback(
    async (id: string, direction: "up" | "down") => {
      const index = links.findIndex((link) => link.id === id);
      if (index === -1) return false;
      if (direction === "up" && index === 0) return false;
      if (direction === "down" && index === links.length - 1) return false;

      const newLinks = [...links];
      const swapIndex = direction === "up" ? index - 1 : index + 1;
      [newLinks[index], newLinks[swapIndex]] = [
        newLinks[swapIndex],
        newLinks[index],
      ];

      const reordered = newLinks.map((link, i) => ({ ...link, order: i }));
      const { error } = await save({ links: reordered });

      if (error) {
        toast.error("순서 변경에 실패했습니다");
        return false;
      }

      return true;
    },
    [links, save]
  );

  return {
    links,
    loading,
    addLink,
    updateLink,
    deleteLink,
    moveLink,
    refetch,
  };
}
