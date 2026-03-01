"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import type { FormationScene } from "@/types";

// ============================================
// 씬 탭 선택기
// ============================================

interface SceneTabsProps {
  scenes: FormationScene[];
  activeSceneId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export const SceneTabs = React.memo(function SceneTabs({
  scenes,
  activeSceneId,
  onSelect,
  onDelete,
}: SceneTabsProps) {
  if (scenes.length === 0) return null;

  return (
    <div
      role="tablist"
      aria-label="포메이션 구간 선택"
      className="flex flex-wrap gap-1"
    >
      {scenes.map((scene) => {
        const isActive = scene.id === activeSceneId;
        return (
          <div key={scene.id} className="flex items-center gap-0.5" role="presentation">
            <button
              role="tab"
              id={`scene-tab-${scene.id}`}
              aria-selected={isActive}
              aria-controls={`scene-panel-${scene.id}`}
              onClick={() => onSelect(scene.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(scene.id);
                }
              }}
              className={[
                "text-[11px] px-2.5 py-1 rounded-full border font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:bg-muted",
              ].join(" ")}
            >
              {scene.label}
              {scene.positions.length > 0 && (
                <span className="ml-1 opacity-70" aria-label={`멤버 ${scene.positions.length}명`}>
                  ·{scene.positions.length}
                </span>
              )}
            </button>
            {isActive && (
              <button
                onClick={() => onDelete(scene.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onDelete(scene.id);
                  }
                }}
                className="h-5 w-5 flex items-center justify-center rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`"${scene.label}" 구간 삭제`}
              >
                <Trash2 className="h-2.5 w-2.5" aria-hidden="true" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
});
