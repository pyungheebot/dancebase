"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Users,
  CheckSquare,
  Square,
  X,
  Award,
  Crown,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  SKILL_CERT_LEVEL_LABELS,
  SKILL_CERT_LEVEL_ORDER,
  SKILL_CERT_LEVEL_COLORS,
} from "@/hooks/use-skill-certification";
import type { SkillCertLevel, SkillCertDefinition } from "@/types";

// ============================================================
// Props
// ============================================================

interface SkillCertificationCardProps {
  groupId: string;
  memberNames: string[];
}

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
    Record<SkillCertLevel, SkillCertDefinition[]>
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
            <div className="flex items-center justify-between cursor-pointer select-none">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-500" />
                <CardTitle className="text-sm font-semibold">
                  기술 인증
                </CardTitle>
                <Badge className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 border-blue-300">
                  {stats.totalCerts}개 정의
                </Badge>
                <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 border-green-300">
                  {stats.totalAwards}건 수여
                </Badge>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!open) setOpen(true);
                    setCreateDialogOpen(true);
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  인증 만들기
                </Button>
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!open) setOpen(true);
                    setAwardDialogOpen(true);
                  }}
                >
                  <Award className="h-3 w-3 mr-1" />
                  인증 수여
                </Button>
                {open ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* 통계 요약 */}
            {(stats.totalAwards > 0 || stats.totalCerts > 0) && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SKILL_CERT_LEVEL_ORDER.map((level) => {
                  const count = stats.levelDistribution[level];
                  const colors = SKILL_CERT_LEVEL_COLORS[level];
                  return (
                    <div
                      key={level}
                      className="rounded-md border bg-muted/20 px-2.5 py-2 text-center"
                    >
                      <p className={`text-xs font-semibold ${colors.text}`}>
                        {SKILL_CERT_LEVEL_LABELS[level]}
                      </p>
                      <p className="text-lg font-bold">{count}</p>
                      <p className="text-[10px] text-muted-foreground">수여</p>
                    </div>
                  );
                })}
                {stats.topCertHolder && (
                  <div className="rounded-md border bg-yellow-50 px-2.5 py-2 text-center col-span-2 sm:col-span-1">
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <Crown className="h-3 w-3 text-yellow-600" />
                      <p className="text-xs font-semibold text-yellow-700">최다 보유</p>
                    </div>
                    <p className="text-sm font-bold truncate">{stats.topCertHolder.memberName}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {stats.topCertHolder.count}개
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 탭 */}
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-md" />
                ))}
              </div>
            ) : certs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShieldCheck className="h-10 w-10 mx-auto mb-2 opacity-20" />
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
                      <div key={level} className="space-y-2">
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
                        <div className="space-y-2 ml-1">
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
                                  handleRevokeCert(
                                    awardId,
                                    memberName,
                                    cert.skillName
                                  )
                                }
                              />
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </TabsContent>

                {/* 멤버 현황 탭 */}
                <TabsContent value="members" className="mt-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    <Select
                      value={selectedMember}
                      onValueChange={setSelectedMember}
                    >
                      <SelectTrigger className="h-8 text-xs flex-1">
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

                  {selectedMember ? (
                    (() => {
                      const memberCerts = getMemberCerts(selectedMember);
                      return memberCerts.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground">
                          <ShieldCheck className="h-8 w-8 mx-auto mb-2 opacity-20" />
                          <p className="text-xs">
                            {selectedMember}님은 아직 보유한 인증이 없습니다.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-[11px] text-muted-foreground">
                            총 {memberCerts.length}개 인증 보유
                          </p>
                          {memberCerts.map(({ award, cert }) => {
                            const colors = SKILL_CERT_LEVEL_COLORS[cert.level];
                            return (
                              <div
                                key={award.id}
                                className="flex items-start justify-between rounded-md border bg-background px-3 py-2 gap-2"
                              >
                                <div className="flex items-start gap-2 min-w-0">
                                  <Badge
                                    className={`text-[10px] px-1.5 py-0 border shrink-0 mt-0.5 ${colors.badge}`}
                                  >
                                    {SKILL_CERT_LEVEL_LABELS[cert.level]}
                                  </Badge>
                                  <div className="min-w-0">
                                    <p className="text-xs font-medium truncate">
                                      {cert.skillName}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
                                      {cert.category} · 인증자: {award.certifiedBy} ·{" "}
                                      {award.certifiedAt.slice(0, 10)}
                                    </p>
                                    {award.notes && (
                                      <p className="text-[10px] text-muted-foreground mt-0.5">
                                        {award.notes}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 shrink-0 text-muted-foreground hover:text-destructive"
                                  onClick={() =>
                                    handleRevokeCert(
                                      award.id,
                                      award.memberName,
                                      cert.skillName
                                    )
                                  }
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-20" />
                      <p className="text-xs">멤버를 선택하면 보유 인증을 확인합니다.</p>
                    </div>
                  )}
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
// 인증 정의 행 서브컴포넌트
// ============================================================

interface CertDefinitionRowProps {
  cert: SkillCertDefinition;
  holders: Array<{ id: string; memberName: string; certifiedAt: string }>;
  onDelete: () => void;
  onRevoke: (awardId: string, memberName: string) => void;
}

function CertDefinitionRow({
  cert,
  holders,
  onDelete,
  onRevoke,
}: CertDefinitionRowProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-md border bg-background overflow-hidden">
      <div
        className="flex items-start justify-between px-3 py-2 gap-2 cursor-pointer"
        onClick={() => setExpanded((p) => !p)}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs font-semibold">{cert.skillName}</p>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {cert.category}
            </Badge>
            <span className="text-[10px] text-muted-foreground">
              <Users className="inline h-3 w-3 mr-0.5" />
              {holders.length}명 보유
            </span>
          </div>
          {cert.description && (
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
              {cert.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
          {expanded ? (
            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="border-t px-3 py-2 space-y-3 bg-muted/20">
          {/* 요구사항 체크리스트 */}
          {cert.requirements.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                요구사항
              </p>
              {cert.requirements.map((req, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <CheckSquare className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
                  <span className="text-[11px]">{req}</span>
                </div>
              ))}
            </div>
          )}

          {/* 보유자 목록 */}
          {holders.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                인증 보유자 ({holders.length}명)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {holders.map((holder) => (
                  <div
                    key={holder.id}
                    className="flex items-center gap-1 rounded-full border bg-background px-2 py-0.5"
                  >
                    <span className="text-[11px]">{holder.memberName}</span>
                    <button
                      type="button"
                      onClick={() => onRevoke(holder.id, holder.memberName)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// 인증 만들기 다이얼로그
// ============================================================

interface CreateCertDialogProps {
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

function CreateCertDialog({
  open,
  onOpenChange,
  onSubmit,
}: CreateCertDialogProps) {
  const [skillName, setSkillName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState<SkillCertLevel | "">("");
  const [requirements, setRequirements] = useState<string[]>([""]);
  const [submitting, setSubmitting] = useState(false);

  function resetForm() {
    setSkillName("");
    setDescription("");
    setCategory("");
    setLevel("");
    setRequirements([""]);
  }

  function handleClose() {
    resetForm();
    onOpenChange(false);
  }

  function addRequirement() {
    setRequirements((prev) => [...prev, ""]);
  }

  function updateRequirement(index: number, value: string) {
    setRequirements((prev) => prev.map((r, i) => (i === index ? value : r)));
  }

  function removeRequirement(index: number) {
    setRequirements((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit() {
    if (!skillName.trim()) {
      toast.error("스킬명을 입력하세요.");
      return;
    }
    if (!category.trim()) {
      toast.error("카테고리를 입력하세요.");
      return;
    }
    if (!level) {
      toast.error("레벨을 선택하세요.");
      return;
    }
    setSubmitting(true);
    try {
      const filteredReqs = requirements.filter((r) => r.trim() !== "");
      onSubmit({
        skillName: skillName.trim(),
        description: description.trim(),
        category: category.trim(),
        level,
        requirements: filteredReqs,
      });
      resetForm();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-blue-500" />
            새 기술 인증 만들기
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* 스킬명 */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">
              스킬명 <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="예: 백플립, 웨이브, 프리즈"
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* 설명 */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">
              설명
            </label>
            <Textarea
              placeholder="기술에 대한 설명을 입력하세요."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-xs min-h-[64px] resize-none"
            />
          </div>

          {/* 카테고리 */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">
              카테고리 <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="예: 상체 기술, 하체 기술, 전신 동작"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* 레벨 */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">
              레벨 <span className="text-destructive">*</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {SKILL_CERT_LEVEL_ORDER.map((lv) => {
                const colors = SKILL_CERT_LEVEL_COLORS[lv];
                return (
                  <button
                    key={lv}
                    type="button"
                    onClick={() => setLevel(lv)}
                    className={`text-[11px] px-2.5 py-1 rounded-md border font-medium transition-colors ${
                      level === lv
                        ? `${colors.badge} border-current`
                        : "bg-background text-muted-foreground border-border hover:bg-accent"
                    }`}
                  >
                    {SKILL_CERT_LEVEL_LABELS[lv]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 요구사항 */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground font-medium">
              요구사항
            </label>
            <div className="space-y-1.5">
              {requirements.map((req, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <Square className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <Input
                    placeholder={`요구사항 ${i + 1}`}
                    value={req}
                    onChange={(e) => updateRequirement(i, e.target.value)}
                    className="h-7 text-xs flex-1"
                  />
                  {requirements.length > 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeRequirement(i)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs w-full"
              onClick={addRequirement}
            >
              <Plus className="h-3 w-3 mr-1" />
              요구사항 추가
            </Button>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={handleClose}
            disabled={submitting}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSubmit}
            disabled={submitting}
          >
            <ShieldCheck className="h-3 w-3 mr-1" />
            {submitting ? "생성 중..." : "인증 생성"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 인증 수여 다이얼로그
// ============================================================

interface AwardCertDialogProps {
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

function AwardCertDialog({
  open,
  onOpenChange,
  certs,
  memberNames,
  existingAwards,
  onSubmit,
}: AwardCertDialogProps) {
  const [certId, setCertId] = useState("");
  const [memberName, setMemberName] = useState("");
  const [certifiedBy, setCertifiedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function resetForm() {
    setCertId("");
    setMemberName("");
    setCertifiedBy("");
    setNotes("");
  }

  function handleClose() {
    resetForm();
    onOpenChange(false);
  }

  // 이미 수여된 조합인지 확인
  const alreadyAwarded =
    certId && memberName
      ? existingAwards.some(
          (a) => a.certId === certId && a.memberName === memberName
        )
      : false;

  function handleSubmit() {
    if (!certId) {
      toast.error("인증을 선택하세요.");
      return;
    }
    if (!memberName) {
      toast.error("멤버를 선택하세요.");
      return;
    }
    if (!certifiedBy.trim()) {
      toast.error("인증자를 입력하세요.");
      return;
    }
    if (alreadyAwarded) {
      toast.error("이미 해당 멤버에게 수여된 인증입니다.");
      return;
    }

    setSubmitting(true);
    try {
      onSubmit({
        certId,
        memberName,
        certifiedBy: certifiedBy.trim(),
        notes: notes.trim() || undefined,
      });
      resetForm();
    } finally {
      setSubmitting(false);
    }
  }

  const selectedCert = certs.find((c) => c.id === certId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <Award className="h-4 w-4 text-green-500" />
            기술 인증 수여
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* 인증 선택 */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">
              인증 선택 <span className="text-destructive">*</span>
            </label>
            <Select value={certId} onValueChange={setCertId}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="인증을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {SKILL_CERT_LEVEL_ORDER.map((level) => {
                  const levelCerts = certs.filter((c) => c.level === level);
                  if (levelCerts.length === 0) return null;
                  const colors = SKILL_CERT_LEVEL_COLORS[level];
                  return levelCerts.map((cert) => (
                    <SelectItem key={cert.id} value={cert.id} className="text-xs">
                      <span className={`font-medium ${colors.text}`}>
                        [{SKILL_CERT_LEVEL_LABELS[level]}]
                      </span>{" "}
                      {cert.skillName}
                    </SelectItem>
                  ));
                })}
              </SelectContent>
            </Select>
            {selectedCert && (
              <div className="rounded-md border bg-muted/20 px-2.5 py-1.5 space-y-0.5">
                <p className="text-[11px] text-muted-foreground">
                  {selectedCert.description}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  카테고리: {selectedCert.category}
                </p>
              </div>
            )}
          </div>

          {/* 멤버 선택 */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">
              멤버 <span className="text-destructive">*</span>
            </label>
            <Select value={memberName} onValueChange={setMemberName}>
              <SelectTrigger className="h-8 text-xs">
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
            {alreadyAwarded && (
              <p className="text-[11px] text-destructive">
                이미 해당 멤버에게 수여된 인증입니다.
              </p>
            )}
          </div>

          {/* 인증자 */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">
              인증자 <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="인증을 수여하는 사람 이름"
              value={certifiedBy}
              onChange={(e) => setCertifiedBy(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* 비고 */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">
              비고 (선택)
            </label>
            <Textarea
              placeholder="인증 관련 메모나 특이사항"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs min-h-[56px] resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={handleClose}
            disabled={submitting}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSubmit}
            disabled={submitting || !!alreadyAwarded}
          >
            <Award className="h-3 w-3 mr-1" />
            {submitting ? "수여 중..." : "인증 수여"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
