"use client";

import { useState } from "react";
import { UserPlus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import type { FormationScene } from "@/types";
import { MEMBER_COLORS, getInitials, getTextColor } from "./types";

// ============================================
// 멤버 목록 패널 (씬별)
// ============================================

interface MemberListPanelProps {
  scene: FormationScene;
  selectedMemberId: string | null;
  onSelectMember: (id: string | null) => void;
  onAddMember: (name: string, color: string) => void;
  onRemoveMember: (memberId: string) => void;
}

export function MemberListPanel({
  scene,
  selectedMemberId,
  onSelectMember,
  onAddMember,
}: MemberListPanelProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [memberName, setMemberName] = useState("");
  const [memberColor, setMemberColor] = useState<string>(MEMBER_COLORS[0]!);

  function handleAdd() {
    if (!memberName.trim()) {
      toast.error(TOAST.FORMATION_EDITOR.MEMBER_REQUIRED);
      return;
    }
    onAddMember(memberName.trim(), memberColor);
    setMemberName("");
    setMemberColor(MEMBER_COLORS[0]!);
    setAddOpen(false);
  }

  return (
    <div className="space-y-1.5">
      {/* 멤버 목록 */}
      <div
        role="list"
        aria-label={`${scene.label} 구간 멤버 목록`}
        className="flex flex-wrap gap-1.5"
      >
        {scene.positions.map((pos) => {
          const isSelected = selectedMemberId === pos.memberId;
          return (
            <div key={pos.memberId} role="listitem">
              <button
                onClick={() => onSelectMember(isSelected ? null : pos.memberId)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectMember(isSelected ? null : pos.memberId);
                  }
                }}
                aria-pressed={isSelected}
                aria-label={`${pos.memberName}${isSelected ? " - 선택됨" : ""}`}
                className={[
                  "flex items-center gap-1 pl-1 pr-2 py-0.5 rounded-full text-[11px] font-medium transition-colors border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isSelected
                    ? "bg-muted"
                    : "border-transparent hover:bg-muted",
                ].join(" ")}
                style={isSelected ? { borderColor: pos.color } : {}}
              >
                <div
                  className="h-4 w-4 rounded-full shrink-0 flex items-center justify-center text-[8px] font-bold"
                  aria-hidden="true"
                  style={{
                    backgroundColor: pos.color,
                    color: getTextColor(pos.color),
                  }}
                >
                  {getInitials(pos.memberName).slice(0, 1)}
                </div>
                <span className="truncate max-w-[80px]">{pos.memberName}</span>
              </button>
            </div>
          );
        })}

        {/* 멤버 추가 버튼 */}
        {!addOpen && (
          <button
            onClick={() => setAddOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setAddOpen(true);
              }
            }}
            aria-label="멤버 추가"
            aria-expanded={addOpen}
            className="flex items-center gap-1 pl-1.5 pr-2 py-0.5 rounded-full border border-dashed text-[11px] text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <UserPlus className="h-3 w-3" aria-hidden="true" />
            추가
          </button>
        )}
      </div>

      {/* 멤버 추가 인라인 폼 */}
      {addOpen && (
        <div
          className="border rounded-md p-2.5 space-y-2 bg-muted/30"
          role="region"
          aria-label="멤버 추가 폼"
        >
          <p className="text-[10px] font-medium text-muted-foreground" aria-hidden="true">
            멤버 추가
          </p>
          <div className="flex gap-1.5">
            <Label htmlFor="member-name-input" className="sr-only">
              멤버 이름
            </Label>
            <Input
              id="member-name-input"
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              placeholder="이름 입력"
              className="h-7 text-xs flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
                if (e.key === "Escape") setAddOpen(false);
              }}
              autoFocus
              aria-describedby="member-name-hint"
            />
          </div>
          <p id="member-name-hint" className="sr-only">
            Enter로 추가, Escape로 취소
          </p>

          <fieldset>
            <legend className="text-[10px] text-muted-foreground mb-1 block">
              색상 선택
            </legend>
            <div
              role="radiogroup"
              aria-label="멤버 색상 선택"
              className="flex flex-wrap gap-1.5"
            >
              {MEMBER_COLORS.map((color) => (
                <button
                  key={color}
                  role="radio"
                  aria-checked={memberColor === color}
                  aria-label={`색상 ${color}`}
                  onClick={() => setMemberColor(color)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setMemberColor(color);
                    }
                  }}
                  className="h-5 w-5 rounded-full border-2 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                  style={{
                    backgroundColor: color,
                    borderColor: memberColor === color ? "white" : "transparent",
                    boxShadow: memberColor === color ? `0 0 0 2px ${color}` : "none",
                  }}
                />
              ))}
            </div>
          </fieldset>

          <div className="flex gap-1.5">
            <Button
              size="sm"
              className="h-7 text-xs flex-1"
              onClick={handleAdd}
              disabled={!memberName.trim()}
              aria-disabled={!memberName.trim()}
            >
              <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
              무대에 배치
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                setAddOpen(false);
                setMemberName("");
              }}
            >
              취소
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
