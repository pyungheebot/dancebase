"use client";

import React from "react";
import type { FormationPosition } from "@/types";
import { getInitials, getTextColor } from "./types";

// ============================================
// 무대 위 멤버 배지 컴포넌트
// ============================================

interface MemberBadgeProps {
  position: FormationPosition;
  isSelected: boolean;
  onSelect: () => void;
}

export const MemberBadge = React.memo(function MemberBadge({
  position,
  isSelected,
  onSelect,
}: MemberBadgeProps) {
  const initials = getInitials(position.memberName);
  const textColor = getTextColor(position.color);

  return (
    <button
      data-member-badge="true"
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          onSelect();
        }
      }}
      className="absolute -translate-x-1/2 -translate-y-1/2 transition-transform duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: `translate(-50%, -50%) scale(${isSelected ? 1.2 : 1})`,
        zIndex: isSelected ? 10 : 1,
      }}
      aria-label={`${position.memberName} - 위치 ${Math.round(position.x)}%, ${Math.round(position.y)}%`}
      aria-pressed={isSelected}
    >
      <div
        className="flex items-center justify-center rounded-full font-bold shadow-md transition-all duration-150"
        role="img"
        aria-hidden="true"
        style={{
          width: 34,
          height: 34,
          backgroundColor: position.color,
          color: textColor,
          fontSize: initials.length > 1 ? 10 : 13,
          outline: isSelected ? `2.5px solid white` : "none",
          boxShadow: isSelected
            ? `0 0 0 2px ${position.color}, 0 2px 8px rgba(0,0,0,0.3)`
            : "0 2px 4px rgba(0,0,0,0.25)",
        }}
      >
        {initials}
      </div>
    </button>
  );
});
