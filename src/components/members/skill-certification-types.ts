import type { SkillCertDefinition, SkillCertAward, SkillCertLevel } from "@/types";

// ============================================================
// Props 인터페이스
// ============================================================

export interface SkillCertificationCardProps {
  groupId: string;
  memberNames: string[];
}

export interface CertDefinitionRowProps {
  cert: SkillCertDefinition;
  holders: SkillCertAward[];
  onDelete: () => void;
  onRevoke: (awardId: string, memberName: string) => void;
}

export interface CreateCertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (params: {
    skillName: string;
    description: string;
    category: string;
    level: SkillCertLevel;
    requirements: string[];
  }) => void;
}

export interface AwardCertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  certs: SkillCertDefinition[];
  memberNames: string[];
  existingAwards: Array<{ certId: string; memberName: string }>;
  onSubmit: (params: {
    certId: string;
    memberName: string;
    certifiedBy: string;
    notes?: string;
  }) => void;
}

export interface SkillCertStatsProps {
  stats: {
    totalCerts: number;
    totalAwards: number;
    levelDistribution: Record<SkillCertLevel, number>;
    topCertHolder: { memberName: string; count: number } | null;
  };
}

export interface MemberCertListProps {
  memberName: string;
  certs: Array<{ award: SkillCertAward; cert: SkillCertDefinition }>;
  onRevoke: (awardId: string, memberName: string, skillName: string) => void;
}
