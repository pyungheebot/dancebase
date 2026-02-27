"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, ChevronUp, Pencil, Save, X, User } from "lucide-react";
import { usePersonalityProfile } from "@/hooks/use-personality-profile";
import type { PersonalityDanceRole, PersonalityTrait } from "@/types";

// ============================================================
// 상수 정의
// ============================================================

const ROLE_LABELS: Record<PersonalityDanceRole, string> = {
  dancer: "댄서",
  choreographer: "안무가",
  director: "디렉터",
  support: "서포터",
  performer: "퍼포머",
};

const ROLE_COLORS: Record<PersonalityDanceRole, string> = {
  dancer: "bg-purple-100 text-purple-700 border-purple-200",
  choreographer: "bg-pink-100 text-pink-700 border-pink-200",
  director: "bg-blue-100 text-blue-700 border-blue-200",
  support: "bg-orange-100 text-orange-700 border-orange-200",
  performer: "bg-cyan-100 text-cyan-700 border-cyan-200",
};

const ALL_ROLES: PersonalityDanceRole[] = [
  "dancer",
  "choreographer",
  "director",
  "support",
  "performer",
];

const TRAIT_NAMES: PersonalityTrait["trait"][] = [
  "리더십",
  "창의성",
  "체력",
  "표현력",
  "협동심",
];

// ============================================================
// SVG 레이더 차트 (오각형)
// ============================================================

const RADAR_SIZE = 160;
const RADAR_CENTER = RADAR_SIZE / 2;
const RADAR_RADIUS = 60;

/** 오각형 꼭짓점 각도 계산 (위쪽 꼭짓점부터 시계 방향) */
function calcPentagonPoint(
  index: number,
  radius: number
): { x: number; y: number } {
  // -90도(위)에서 시작해 72도씩 회전
  const angle = ((index * 72 - 90) * Math.PI) / 180;
  return {
    x: RADAR_CENTER + radius * Math.cos(angle),
    y: RADAR_CENTER + radius * Math.sin(angle),
  };
}

/** 점수(1-5)를 반지름 비율로 변환 */
function scoreToRadius(score: number): number {
  return (score / 5) * RADAR_RADIUS;
}

function RadarChart({ traits }: { traits: PersonalityTrait[] }) {
  // 배경 오각형 레이어 (1~5 점수 표시)
  const bgLayers = [1, 2, 3, 4, 5].map((level) => {
    const points = Array.from({ length: 5 }, (_, i) => {
      const p = calcPentagonPoint(i, (level / 5) * RADAR_RADIUS);
      return `${p.x},${p.y}`;
    }).join(" ");
    return { level, points };
  });

  // 데이터 폴리곤
  const dataPoints = traits.map((t, i) => {
    const p = calcPentagonPoint(i, scoreToRadius(t.score));
    return `${p.x},${p.y}`;
  });

  // 축 끝점 (5번째 꼭짓점 = 최대 반지름)
  const axisPoints = Array.from({ length: 5 }, (_, i) =>
    calcPentagonPoint(i, RADAR_RADIUS)
  );

  // 라벨 위치 (축 끝보다 약간 밖)
  const labelPoints = Array.from({ length: 5 }, (_, i) =>
    calcPentagonPoint(i, RADAR_RADIUS + 18)
  );

  return (
    <svg
      width={RADAR_SIZE}
      height={RADAR_SIZE}
      viewBox={`0 0 ${RADAR_SIZE} ${RADAR_SIZE}`}
      className="mx-auto"
      aria-label="성격 특성 레이더 차트"
    >
      {/* 배경 오각형 */}
      {bgLayers.map(({ level, points }) => (
        <polygon
          key={level}
          points={points}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="1"
        />
      ))}

      {/* 축 선 */}
      {axisPoints.map((pt, i) => (
        <line
          key={i}
          x1={RADAR_CENTER}
          y1={RADAR_CENTER}
          x2={pt.x}
          y2={pt.y}
          stroke="#e2e8f0"
          strokeWidth="1"
        />
      ))}

      {/* 데이터 폴리곤 */}
      <polygon
        points={dataPoints.join(" ")}
        fill="rgba(139, 92, 246, 0.25)"
        stroke="rgb(139, 92, 246)"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* 데이터 점 */}
      {traits.map((t, i) => {
        const r = scoreToRadius(t.score);
        const p = calcPentagonPoint(i, r);
        return (
          <circle
            key={t.trait}
            cx={p.x}
            cy={p.y}
            r={3}
            fill="rgb(139, 92, 246)"
          />
        );
      })}

      {/* 라벨 */}
      {traits.map((t, i) => {
        const lp = labelPoints[i];
        return (
          <text
            key={t.trait}
            x={lp.x}
            y={lp.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="9"
            fill="#64748b"
            fontFamily="inherit"
          >
            {t.trait}
          </text>
        );
      })}
    </svg>
  );
}

// ============================================================
// 별점 컴포넌트 (1-5)
// ============================================================

function StarRating({
  score,
  onChange,
}: {
  score: number;
  onChange: (score: number) => void;
}) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className="focus:outline-none"
          aria-label={`${s}점`}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill={s <= score ? "#f59e0b" : "none"}
            stroke={s <= score ? "#f59e0b" : "#d1d5db"}
            strokeWidth="1.5"
          >
            <path d="M8 1.5l1.545 3.13 3.455.5-2.5 2.435.59 3.435L8 9.25 4.91 11l.59-3.435L3 5.13l3.455-.5z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

// ============================================================
// 메인 컴포넌트
// ============================================================

interface PersonalityProfileCardProps {
  groupId: string;
  userId: string;
  displayName?: string;
}

export function PersonalityProfileCard({
  groupId,
  userId,
  displayName,
}: PersonalityProfileCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const {
    profile,
    isDirty,
    updateTraitScore,
    toggleRole,
    updateBio,
    saveProfile,
    resetProfile,
  } = usePersonalityProfile(groupId, userId);

  function handleSave() {
    saveProfile();
    setIsEditing(false);
    toast.success("프로필이 저장되었습니다.");
  }

  function handleCancel() {
    resetProfile();
    setIsEditing(false);
  }

  function handleEditToggle() {
    if (!isOpen) setIsOpen(true);
    setIsEditing(true);
  }

  const hasProfile =
    profile.preferredRoles.length > 0 ||
    profile.bio.trim().length > 0 ||
    profile.traits.some((t) => t.score !== 3);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      {/* 헤더 */}
      <div className="flex items-center justify-between rounded-lg border bg-card px-3 py-2">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex flex-1 items-center gap-2 text-left focus:outline-none"
          >
            <User className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium">
              {displayName ? `${displayName}의 ` : ""}성격/역할 프로필
            </span>
            {!hasProfile && (
              <span className="text-[10px] text-muted-foreground ml-1">
                (미등록)
              </span>
            )}
            {hasProfile && (
              <div className="flex gap-1 ml-1 flex-wrap">
                {profile.preferredRoles.slice(0, 2).map((r) => (
                  <span
                    key={r}
                    className={`text-[10px] px-1.5 py-0 rounded border ${ROLE_COLORS[r]}`}
                  >
                    {ROLE_LABELS[r]}
                  </span>
                ))}
                {profile.preferredRoles.length > 2 && (
                  <span className="text-[10px] text-muted-foreground">
                    +{profile.preferredRoles.length - 2}
                  </span>
                )}
              </div>
            )}
            {isOpen ? (
              <ChevronUp className="h-3 w-3 text-muted-foreground ml-auto" />
            ) : (
              <ChevronDown className="h-3 w-3 text-muted-foreground ml-auto" />
            )}
          </button>
        </CollapsibleTrigger>

        {/* 편집/저장/취소 버튼 */}
        <div className="flex items-center gap-1 ml-2 shrink-0">
          {isEditing ? (
            <>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs px-2"
                onClick={handleCancel}
              >
                <X className="h-3 w-3 mr-1" />
                취소
              </Button>
              <Button
                size="sm"
                className="h-7 text-xs px-2"
                onClick={handleSave}
                disabled={!isDirty}
              >
                <Save className="h-3 w-3 mr-1" />
                저장
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs px-2"
              onClick={handleEditToggle}
            >
              <Pencil className="h-3 w-3 mr-1" />
              편집
            </Button>
          )}
        </div>
      </div>

      {/* 콘텐츠 */}
      <CollapsibleContent className="mt-2">
        <div className="rounded-lg border bg-card p-4 space-y-5">
          {isEditing ? (
            // ── 편집 모드 ──────────────────────────────────────
            <>
              {/* 역할 선택 */}
              <div>
                <p className="text-xs font-semibold text-foreground mb-2">
                  역할 선호도{" "}
                  <span className="text-muted-foreground font-normal">
                    (최대 3개)
                  </span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {ALL_ROLES.map((role) => {
                    const checked = profile.preferredRoles.includes(role);
                    const disabled =
                      !checked && profile.preferredRoles.length >= 3;
                    return (
                      <label
                        key={role}
                        className={`flex items-center gap-1.5 cursor-pointer select-none ${
                          disabled ? "opacity-40 cursor-not-allowed" : ""
                        }`}
                      >
                        <Checkbox
                          checked={checked}
                          disabled={disabled}
                          onCheckedChange={() =>
                            !disabled && toggleRole(role)
                          }
                          className="h-3.5 w-3.5"
                        />
                        <span className="text-xs">{ROLE_LABELS[role]}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* 특성 별점 */}
              <div>
                <p className="text-xs font-semibold text-foreground mb-2">
                  성격 특성
                </p>
                <div className="space-y-2">
                  {profile.traits.map((t) => (
                    <div
                      key={t.trait}
                      className="flex items-center justify-between"
                    >
                      <span className="text-xs text-muted-foreground w-14">
                        {t.trait}
                      </span>
                      <StarRating
                        score={t.score}
                        onChange={(s) => updateTraitScore(t.trait, s)}
                      />
                      <span className="text-xs text-muted-foreground w-4 text-right">
                        {t.score}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 한줄 소개 */}
              <div>
                <p className="text-xs font-semibold text-foreground mb-1.5">
                  한줄 소개
                </p>
                <Textarea
                  value={profile.bio}
                  onChange={(e) => updateBio(e.target.value)}
                  placeholder="자신을 한줄로 소개해주세요. (최대 100자)"
                  className="text-xs min-h-[60px] resize-none"
                  maxLength={100}
                />
                <p className="text-[10px] text-muted-foreground text-right mt-0.5">
                  {profile.bio.length}/100
                </p>
              </div>
            </>
          ) : (
            // ── 보기 모드 ──────────────────────────────────────
            <>
              {/* 레이더 차트 */}
              <div className="flex flex-col items-center">
                <RadarChart traits={profile.traits} />
                {/* 점수 범례 */}
                <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2">
                  {profile.traits.map((t) => (
                    <div key={t.trait} className="flex items-center gap-1">
                      <span className="text-[10px] text-muted-foreground">
                        {t.trait}
                      </span>
                      <span className="text-[10px] font-semibold text-violet-600">
                        {t.score}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 역할 배지 */}
              {profile.preferredRoles.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-foreground mb-1.5">
                    선호 역할
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.preferredRoles.map((r) => (
                      <Badge
                        key={r}
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 ${ROLE_COLORS[r]}`}
                      >
                        {ROLE_LABELS[r]}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* 한줄 소개 */}
              {profile.bio.trim() && (
                <div>
                  <p className="text-xs font-semibold text-foreground mb-1">
                    한줄 소개
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {profile.bio}
                  </p>
                </div>
              )}

              {/* 프로필 없을 때 안내 */}
              {!hasProfile && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  편집 버튼을 눌러 프로필을 등록해보세요.
                </p>
              )}

              {/* 마지막 업데이트 */}
              {hasProfile && (
                <p className="text-[10px] text-muted-foreground text-right">
                  마지막 수정:{" "}
                  {new Date(profile.updatedAt).toLocaleDateString("ko-KR")}
                </p>
              )}
            </>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
