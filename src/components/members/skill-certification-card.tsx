"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Plus,
  Users,
  Award,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useSkillCertification,
  SKILL_CERT_LEVEL_ORDER,
  SKILL_CERT_LEVEL_COLORS,
  SKILL_CERT_LEVEL_LABELS,
} from "@/hooks/use-skill-certification";
import { SkillCertStats } from "./skill-certification-stats";
import { CertDefinitionRow, MemberCertItem } from "./skill-certification-cert-row";
import { CreateCertDialog, AwardCertDialog } from "./skill-certification-dialogs";
import type { SkillCertificationCardProps } from "./skill-certification-types";

// ============================================================
// 메인 카드
// ============================================================

export function SkillCertificationCard({
  groupId,
  memberNames,
}: SkillCertificationCardProps) {
  const {
    certs,
    awards,
    loading,
    createCert,
    deleteCert,
    awardCert,
    revokeCert,
    getMemberCerts,
    getCertHolders,
    stats,
  } = useSkillCertification(groupId);

  const [open, setOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [awardDialogOpen, setAwardDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string>("");

  // 레벨별 그룹핑
  const certsByLevel = SKILL_CERT_LEVEL_ORDER.reduce<
    Record<import("@/types").SkillCertLevel, import("@/types").SkillCertDefinition[]>
  >(
    (acc, level) => {
      acc[level] = certs.filter((c) => c.level === level);
      return acc;
    },
    {
      beginner: [],
      intermediate: [],
      advanced: [],
      expert: [],
      master: [],
    }
  );

  function handleDeleteCert(certId: string, skillName: string) {
    deleteCert(certId);
    toast.success(`"${skillName}" 인증이 삭제되었습니다.`);
  }

  function handleRevokeCert(awardId: string, memberName: string, skillName: string) {
    revokeCert(awardId);
    toast.success(`${memberName}님의 "${skillName}" 인증이 취소되었습니다.`);
  }

  return (
    <Card className="w-full">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader className="pb-2">
          <CollapsibleTrigger asChild>
            <div
              className="flex items-center justify-between cursor-pointer select-none"
              role="button"
              aria-expanded={open}
              aria-label={`기술 인증 섹션 ${open ? "접기" : "펼치기"}`}
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-500" aria-hidden="true" />
                <CardTitle className="text-sm font-semibold">기술 인증</CardTitle>
                <Badge
                  className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 border-blue-300"
                  aria-label={`인증 정의 ${stats.totalCerts}개`}
                >
                  {stats.totalCerts}개 정의
                </Badge>
                <Badge
                  className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 border-green-300"
                  aria-label={`인증 수여 ${stats.totalAwards}건`}
                >
                  {stats.totalAwards}건 수여
                </Badge>
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  aria-label="새 기술 인증 만들기"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!open) setOpen(true);
                    setCreateDialogOpen(true);
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
                  인증 만들기
                </Button>
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  aria-label="기술 인증 수여하기"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!open) setOpen(true);
                    setAwardDialogOpen(true);
                  }}
                >
                  <Award className="h-3 w-3 mr-1" aria-hidden="true" />
                  인증 수여
                </Button>
                {open ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                )}
              </div>
            </div>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* 통계 요약 */}
            <SkillCertStats stats={stats} />

            {/* 본문 */}
            {loading ? (
              <div
                className="space-y-2"
                role="status"
                aria-label="인증 목록 불러오는 중"
                aria-live="polite"
              >
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-md" />
                ))}
              </div>
            ) : certs.length === 0 ? (
              <div
                className="text-center py-8 text-muted-foreground"
                role="status"
                aria-live="polite"
              >
                <ShieldCheck
                  className="h-10 w-10 mx-auto mb-2 opacity-20"
                  aria-hidden="true"
                />
                <p className="text-xs">등록된 인증이 없습니다.</p>
                <p className="text-[11px] mt-0.5">
                  위 버튼으로 첫 기술 인증을 만들어보세요.
                </p>
              </div>
            ) : (
              <Tabs defaultValue="certs">
                <TabsList className="h-8">
                  <TabsTrigger value="certs" className="text-xs h-7 px-3">
                    인증 목록
                  </TabsTrigger>
                  <TabsTrigger value="members" className="text-xs h-7 px-3">
                    멤버 현황
                  </TabsTrigger>
                </TabsList>

                {/* 인증 목록 탭 */}
                <TabsContent value="certs" className="mt-3 space-y-4">
                  {SKILL_CERT_LEVEL_ORDER.map((level) => {
                    const levelCerts = certsByLevel[level];
                    if (levelCerts.length === 0) return null;
                    const colors = SKILL_CERT_LEVEL_COLORS[level];
                    return (
                      <section key={level} className="space-y-2" aria-label={`${SKILL_CERT_LEVEL_LABELS[level]} 레벨 인증`}>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={`text-[10px] px-1.5 py-0 border ${colors.badge}`}
                          >
                            {SKILL_CERT_LEVEL_LABELS[level]}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground">
                            {levelCerts.length}개 인증
                          </span>
                        </div>
                        <div className="space-y-2 ml-1" role="list" aria-label={`${SKILL_CERT_LEVEL_LABELS[level]} 인증 목록`}>
                          {levelCerts.map((cert) => {
                            const holders = getCertHolders(cert.id);
                            return (
                              <CertDefinitionRow
                                key={cert.id}
                                cert={cert}
                                holders={holders}
                                onDelete={() =>
                                  handleDeleteCert(cert.id, cert.skillName)
                                }
                                onRevoke={(awardId, memberName) =>
                                  handleRevokeCert(awardId, memberName, cert.skillName)
                                }
                              />
                            );
                          })}
                        </div>
                      </section>
                    );
                  })}
                </TabsContent>

                {/* 멤버 현황 탭 */}
                <TabsContent value="members" className="mt-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <Users
                      className="h-3.5 w-3.5 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <Select
                      value={selectedMember}
                      onValueChange={setSelectedMember}
                    >
                      <SelectTrigger
                        className="h-8 text-xs flex-1"
                        aria-label="멤버 선택"
                      >
                        <SelectValue placeholder="멤버를 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {memberNames.map((name) => (
                          <SelectItem key={name} value={name} className="text-xs">
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div aria-live="polite" aria-atomic="true">
                    {selectedMember ? (
                      <MemberCertSection
                        selectedMember={selectedMember}
                        memberCerts={getMemberCerts(selectedMember)}
                        onRevoke={handleRevokeCert}
                      />
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        <Users
                          className="h-8 w-8 mx-auto mb-2 opacity-20"
                          aria-hidden="true"
                        />
                        <p className="text-xs">멤버를 선택하면 보유 인증을 확인합니다.</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>

      {/* 인증 만들기 다이얼로그 */}
      <CreateCertDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={(params) => {
          const newCert = createCert(params);
          toast.success(`"${newCert.skillName}" 인증이 생성되었습니다.`);
          setCreateDialogOpen(false);
        }}
      />

      {/* 인증 수여 다이얼로그 */}
      <AwardCertDialog
        open={awardDialogOpen}
        onOpenChange={setAwardDialogOpen}
        certs={certs}
        memberNames={memberNames}
        existingAwards={awards}
        onSubmit={(params) => {
          const cert = certs.find((c) => c.id === params.certId);
          const newAward = awardCert(params);
          toast.success(
            `${newAward.memberName}님에게 "${cert?.skillName ?? ""}" 인증이 수여되었습니다.`
          );
          setAwardDialogOpen(false);
        }}
      />
    </Card>
  );
}

// ============================================================
// 멤버 인증 현황 섹션 (내부 컴포넌트)
// ============================================================

interface MemberCertSectionProps {
  selectedMember: string;
  memberCerts: Array<{
    award: import("@/types").SkillCertAward;
    cert: import("@/types").SkillCertDefinition;
  }>;
  onRevoke: (awardId: string, memberName: string, skillName: string) => void;
}

function MemberCertSection({
  selectedMember,
  memberCerts,
  onRevoke,
}: MemberCertSectionProps) {
  if (memberCerts.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <ShieldCheck
          className="h-8 w-8 mx-auto mb-2 opacity-20"
          aria-hidden="true"
        />
        <p className="text-xs">
          {selectedMember}님은 아직 보유한 인증이 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-[11px] text-muted-foreground" aria-live="polite">
        총 {memberCerts.length}개 인증 보유
      </p>
      <ul role="list" aria-label={`${selectedMember}님의 보유 인증`} className="space-y-2">
        {memberCerts.map(({ award, cert }) => (
          <MemberCertItem
            key={award.id}
            awardId={award.id}
            memberName={award.memberName}
            skillName={cert.skillName}
            category={cert.category}
            level={cert.level}
            certifiedBy={award.certifiedBy}
            certifiedAt={award.certifiedAt}
            notes={award.notes}
            onRevoke={onRevoke}
          />
        ))}
      </ul>
    </div>
  );
}
