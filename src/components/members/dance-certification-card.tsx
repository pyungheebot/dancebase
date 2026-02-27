"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Award,
  Medal,
  Shield,
  Star,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Users,
  Tag,
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  useDanceCertification,
  CERT_LEVEL_LABELS,
  CERT_LEVEL_ORDER,
  CERT_LEVEL_COLORS,
} from "@/hooks/use-dance-certification";
import { DanceCertLevel } from "@/types";

// 추천 장르 목록
const SUGGESTED_GENRES = [
  "힙합",
  "팝핀",
  "왁킹",
  "하우스",
  "락킹",
  "크럼프",
  "브레이킹",
  "보깅",
  "재즈",
  "케이팝",
];

interface DanceCertificationCardProps {
  groupId: string;
  currentUserName?: string; // 인증자 이름 (로그인 유저)
}

export function DanceCertificationCard({
  groupId,
  currentUserName = "리더",
}: DanceCertificationCardProps) {
  const {
    certifications,
    loading,
    issueCertification,
    deleteCertification,
    levelStats,
    genres,
  } = useDanceCertification(groupId);

  // 카드 열림 상태
  const [open, setOpen] = useState(false);
  // 폼 열림 상태
  const [formOpen, setFormOpen] = useState(false);
  // 그룹핑 모드 (member | genre)
  const [groupBy, setGroupBy] = useState<"member" | "genre">("member");
  // 발급 중 상태
  const [submitting, setSubmitting] = useState(false);

  // 폼 상태
  const [memberName, setMemberName] = useState("");
  const [memberId, setMemberId] = useState("");
  const [genre, setGenre] = useState("");
  const [customGenre, setCustomGenre] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<DanceCertLevel | "">("");
  const [note, setNote] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const totalCount = certifications.length;
  const maxLevelCount = Math.max(...Object.values(levelStats), 1);

  // 폼 초기화
  function resetForm() {
    setMemberName("");
    setMemberId("");
    setGenre("");
    setCustomGenre("");
    setSelectedLevel("");
    setNote("");
    setExpiresAt("");
  }

  // 인증 발급 제출
  async function handleSubmit() {
    const finalGenre = genre === "__custom__" ? customGenre.trim() : genre;
    if (!memberName.trim()) {
      toast.error("멤버명을 입력하세요.");
      return;
    }
    if (!finalGenre) {
      toast.error("장르를 선택하거나 직접 입력하세요.");
      return;
    }
    if (!selectedLevel) {
      toast.error("레벨을 선택하세요.");
      return;
    }

    setSubmitting(true);
    try {
      await issueCertification({
        memberId: memberId.trim() || `member-${memberName.trim()}`,
        memberName: memberName.trim(),
        genre: finalGenre,
        level: selectedLevel,
        certifiedBy: currentUserName,
        note: note.trim(),
        expiresAt: expiresAt || undefined,
      });
      toast.success(`${memberName.trim()}님의 ${finalGenre} ${CERT_LEVEL_LABELS[selectedLevel]} 인증이 발급되었습니다.`);
      resetForm();
      setFormOpen(false);
    } catch {
      toast.error("인증 발급 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  // 인증 삭제
  async function handleDelete(certId: string, memberName: string, genre: string) {
    try {
      await deleteCertification(certId);
      toast.success(`${memberName}님의 ${genre} 인증이 삭제되었습니다.`);
    } catch {
      toast.error("인증 삭제 중 오류가 발생했습니다.");
    }
  }

  // 멤버별 그룹핑
  const byMember = certifications.reduce<
    Record<string, { name: string; certs: typeof certifications }>
  >((acc, cert) => {
    if (!acc[cert.memberId]) {
      acc[cert.memberId] = { name: cert.memberName, certs: [] };
    }
    acc[cert.memberId].certs.push(cert);
    return acc;
  }, {});

  // 장르별 그룹핑
  const byGenre = certifications.reduce<
    Record<string, typeof certifications>
  >((acc, cert) => {
    if (!acc[cert.genre]) acc[cert.genre] = [];
    acc[cert.genre].push(cert);
    return acc;
  }, {});

  // 날짜 포매터
  function formatDate(iso: string) {
    return iso.slice(0, 10).replace(/-/g, ".");
  }

  // 유효기간 만료 여부
  function isExpired(expiresAt?: string) {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  }

  return (
    <Card className="w-full">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader className="pb-2">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer select-none">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-yellow-500" />
                <CardTitle className="text-sm font-semibold">
                  댄스 레벨 인증
                </CardTitle>
                <Badge className="text-[10px] px-1.5 py-0 bg-yellow-100 text-yellow-700 border-yellow-300">
                  {totalCount}건
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
                    setFormOpen((prev) => !prev);
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  인증 발급
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
            {/* 인증 발급 폼 */}
            {formOpen && (
              <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  신규 인증 발급
                </p>

                {/* 멤버명 */}
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">멤버명</label>
                  <Input
                    placeholder="멤버 이름"
                    value={memberName}
                    onChange={(e) => {
                      setMemberName(e.target.value);
                      setMemberId(`member-${e.target.value.trim()}`);
                    }}
                    className="h-8 text-xs"
                  />
                </div>

                {/* 장르 선택 */}
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">장르</label>
                  <div className="flex flex-wrap gap-1">
                    {SUGGESTED_GENRES.map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => {
                          setGenre(g);
                          setCustomGenre("");
                        }}
                        className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                          genre === g
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-muted-foreground border-border hover:bg-accent"
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setGenre("__custom__")}
                      className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                        genre === "__custom__"
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-muted-foreground border-border hover:bg-accent"
                      }`}
                    >
                      직접 입력
                    </button>
                  </div>
                  {genre === "__custom__" && (
                    <Input
                      placeholder="장르 직접 입력"
                      value={customGenre}
                      onChange={(e) => setCustomGenre(e.target.value)}
                      className="h-8 text-xs mt-1"
                    />
                  )}
                </div>

                {/* 레벨 선택 버튼 */}
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">레벨</label>
                  <div className="flex flex-wrap gap-1.5">
                    {CERT_LEVEL_ORDER.map((lv) => (
                      <button
                        key={lv}
                        type="button"
                        onClick={() => setSelectedLevel(lv)}
                        className={`text-[11px] px-2.5 py-1 rounded-md border font-medium transition-colors ${
                          selectedLevel === lv
                            ? `${CERT_LEVEL_COLORS[lv].badge} border-current`
                            : "bg-background text-muted-foreground border-border hover:bg-accent"
                        }`}
                      >
                        {lv === "master" && (
                          <Star className="inline h-3 w-3 mr-0.5 mb-0.5" />
                        )}
                        {lv === "advanced" && (
                          <Shield className="inline h-3 w-3 mr-0.5 mb-0.5" />
                        )}
                        {lv === "intermediate" && (
                          <Medal className="inline h-3 w-3 mr-0.5 mb-0.5" />
                        )}
                        {CERT_LEVEL_LABELS[lv]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 메모 */}
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">메모 (선택)</label>
                  <Input
                    placeholder="인증 관련 메모"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>

                {/* 유효기간 */}
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">유효기간 (선택)</label>
                  <Input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>

                {/* 버튼 */}
                <div className="flex gap-2 justify-end pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => {
                      resetForm();
                      setFormOpen(false);
                    }}
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
                    <Award className="h-3 w-3 mr-1" />
                    {submitting ? "발급 중..." : "인증 발급"}
                  </Button>
                </div>
              </div>
            )}

            {/* 레벨별 분포 차트 */}
            {totalCount > 0 && (
              <div className="space-y-1.5">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                  레벨 분포
                </p>
                <div className="space-y-1.5">
                  {CERT_LEVEL_ORDER.map((lv) => {
                    const count = levelStats[lv];
                    const pct = Math.round((count / maxLevelCount) * 100);
                    return (
                      <div key={lv} className="flex items-center gap-2">
                        <span
                          className={`text-[10px] w-12 shrink-0 font-medium ${CERT_LEVEL_COLORS[lv].text}`}
                        >
                          {CERT_LEVEL_LABELS[lv]}
                        </span>
                        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${CERT_LEVEL_COLORS[lv].bar}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[10px] w-4 text-right text-muted-foreground shrink-0">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 그룹핑 토글 */}
            {totalCount > 0 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setGroupBy("member")}
                  className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                    groupBy === "member"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:bg-accent"
                  }`}
                >
                  <Users className="h-3 w-3" />
                  멤버별
                </button>
                <button
                  type="button"
                  onClick={() => setGroupBy("genre")}
                  className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                    groupBy === "genre"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:bg-accent"
                  }`}
                >
                  <Tag className="h-3 w-3" />
                  장르별
                </button>
              </div>
            )}

            {/* 인증 현황 리스트 */}
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-md" />
                ))}
              </div>
            ) : totalCount === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Award className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">발급된 인증이 없습니다.</p>
                <p className="text-[11px] mt-0.5">위 버튼으로 첫 인증을 발급하세요.</p>
              </div>
            ) : groupBy === "member" ? (
              // 멤버별 그룹
              <div className="space-y-3">
                {Object.entries(byMember).map(([mid, { name, certs }]) => (
                  <div key={mid} className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs font-semibold">{name}</span>
                      <Badge className="text-[9px] px-1 py-0 bg-muted text-muted-foreground">
                        {certs.length}건
                      </Badge>
                    </div>
                    <div className="ml-4 space-y-1">
                      {certs.map((cert) => (
                        <CertRow
                          key={cert.id}
                          cert={cert}
                          onDelete={() =>
                            handleDelete(cert.id, cert.memberName, cert.genre)
                          }
                          isExpired={isExpired(cert.expiresAt)}
                          formatDate={formatDate}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // 장르별 그룹
              <div className="space-y-3">
                {Object.entries(byGenre).map(([g, certs]) => (
                  <div key={g} className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Tag className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs font-semibold">{g}</span>
                      <Badge className="text-[9px] px-1 py-0 bg-muted text-muted-foreground">
                        {certs.length}명
                      </Badge>
                    </div>
                    <div className="ml-4 space-y-1">
                      {certs.map((cert) => (
                        <CertRow
                          key={cert.id}
                          cert={cert}
                          showMember
                          onDelete={() =>
                            handleDelete(cert.id, cert.memberName, cert.genre)
                          }
                          isExpired={isExpired(cert.expiresAt)}
                          formatDate={formatDate}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 사용 중인 장르 태그 */}
            {genres.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1 border-t">
                {genres.map((g) => (
                  <Badge
                    key={g}
                    variant="outline"
                    className="text-[10px] px-1.5 py-0"
                  >
                    {g}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// 인증 행 서브컴포넌트
interface CertRowProps {
  cert: {
    id: string;
    memberName: string;
    genre: string;
    level: DanceCertLevel;
    certifiedBy: string;
    certifiedAt: string;
    note: string;
    expiresAt?: string;
  };
  showMember?: boolean;
  onDelete: () => void;
  isExpired: boolean;
  formatDate: (iso: string) => string;
}

function CertRow({
  cert,
  showMember = false,
  onDelete,
  isExpired,
  formatDate,
}: CertRowProps) {
  const colors = CERT_LEVEL_COLORS[cert.level];

  return (
    <div
      className={`flex items-center justify-between rounded-md px-2.5 py-1.5 border ${
        isExpired ? "opacity-50 bg-muted/30" : "bg-background"
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        {/* 레벨 배지 */}
        <Badge
          className={`text-[10px] px-1.5 py-0 shrink-0 border ${colors.badge}`}
        >
          {cert.level === "master" && (
            <Star className="inline h-2.5 w-2.5 mr-0.5" />
          )}
          {cert.level === "advanced" && (
            <Shield className="inline h-2.5 w-2.5 mr-0.5" />
          )}
          {cert.level === "intermediate" && (
            <Medal className="inline h-2.5 w-2.5 mr-0.5" />
          )}
          {CERT_LEVEL_LABELS[cert.level]}
        </Badge>

        {/* 장르 또는 멤버 */}
        <span className="text-xs truncate">
          {showMember ? cert.memberName : cert.genre}
        </span>

        {/* 메모 */}
        {cert.note && (
          <span className="text-[10px] text-muted-foreground truncate hidden sm:block">
            {cert.note}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0 ml-2">
        {/* 인증일 / 유효기간 */}
        <div className="text-right hidden sm:block">
          <p className="text-[10px] text-muted-foreground">
            {formatDate(cert.certifiedAt)}
          </p>
          {cert.expiresAt && (
            <p
              className={`text-[9px] ${
                isExpired ? "text-red-500" : "text-muted-foreground"
              }`}
            >
              {isExpired ? "만료" : `~${cert.expiresAt}`}
            </p>
          )}
        </div>

        {/* 인증자 */}
        <span className="text-[10px] text-muted-foreground hidden md:block">
          by {cert.certifiedBy}
        </span>

        {/* 삭제 버튼 */}
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
