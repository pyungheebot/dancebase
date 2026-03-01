"use client";

import { Label } from "@/components/ui/label";
import { PrivacyToggle } from "@/components/profile/profile-basic-info-section";
import type { PrivacyLevel } from "@/types";

interface ProfilePrivacySectionProps {
  teamPrivacy: Record<string, PrivacyLevel>;
  onTeamPrivacyChange: (teamId: string, value: PrivacyLevel) => void;
  myTeams: { id: string; name: string }[];
}

export function ProfilePrivacySection({
  teamPrivacy,
  onTeamPrivacyChange,
  myTeams,
}: ProfilePrivacySectionProps) {
  return (
    <div className="space-y-2">
      <Label>소속 팀</Label>
      {myTeams.length > 0 ? (
        <div className="space-y-2">
          {myTeams.map((team) => (
            <div
              key={team.id}
              className="flex items-center justify-between gap-2 rounded-lg border p-2.5"
            >
              <span className="text-sm font-medium">{team.name}</span>
              <PrivacyToggle
                value={teamPrivacy[team.id] ?? "public"}
                onChange={(v) => onTeamPrivacyChange(team.id, v)}
              />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          &apos;팀&apos; 유형 그룹에 가입하면 여기에 표시됩니다
        </p>
      )}
    </div>
  );
}
