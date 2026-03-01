"use client";

import type { EntityContext } from "@/types/entity-context";
import type { Group, Project } from "@/types";
import { GroupSettingsContent } from "@/components/settings/group-settings-content";
import { ProjectSettingsContent } from "@/components/settings/project-settings-content";

type SettingsContentProps = {
  ctx: EntityContext;
  group?: Group | null;
  project?: Project | null;
};

export function SettingsContent({ ctx, group, project }: SettingsContentProps) {
  const isGroup = !ctx.projectId;

  if (isGroup) {
    if (!group) return null;
    return <GroupSettingsContent ctx={ctx} group={group} />;
  }

  if (!project) return null;
  return <ProjectSettingsContent ctx={ctx} project={project} />;
}
