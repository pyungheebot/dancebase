"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Pencil,
  Sparkles,
  Clock,
  User,
  Package,
  CheckSquare,
  BarChart2,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useMakeupHair } from "@/hooks/use-makeup-hair";
import type {
  MakeupHairMakeupType,
  MakeupHairStyle,
  MakeupHairPlan,
  MakeupHairTimelineEntry,
  MakeupHairArtist,
} from "@/types";

import { PlanDialog, TimelineDialog, ArtistDialog } from "./makeup-hair-dialogs";
import { DonutChart } from "./makeup-hair-chart";

// ============================================================
// 상수
// ============================================================

const MAKEUP_TYPE_COLORS: Record<MakeupHairMakeupType, string> = {
  "내추럴": "bg-green-100 text-green-700 border-green-200",
  "스테이지": "bg-purple-100 text-purple-700 border-purple-200",
  "특수분장": "bg-orange-100 text-orange-700 border-orange-200",
};

const HAIR_STYLE_COLORS: Record<MakeupHairStyle, string> = {
  "업스타일": "bg-pink-100 text-pink-700 border-pink-200",
  "다운스타일": "bg-blue-100 text-blue-700 border-blue-200",
  "반묶음": "bg-cyan-100 text-cyan-700 border-cyan-200",
  "특수": "bg-amber-100 text-amber-700 border-amber-200",
};

const DONUT_COLORS = ["#a855f7", "#22c55e", "#f97316"];

// ============================================================
// 메인 컴포넌트
// ============================================================

interface MakeupHairCardProps {
  projectId: string;
}

export function MakeupHairCard({ projectId }: MakeupHairCardProps) {
  const {
    data,
    loading,
    addPlan,
    updatePlan,
    deletePlan,
    addTimelineEntry,
    updateTimelineEntry,
    deleteTimelineEntry,
    addChecklistItem,
    toggleChecklistItem,
    deleteChecklistItem,
    addArtist,
    updateArtist,
    deleteArtist,
    stats,
  } = useMakeupHair(projectId);

  const [isOpen, setIsOpen] = useState(false);

  type TabType = "plans" | "timeline" | "checklist" | "artists" | "stats";
  const [activeTab, setActiveTab] = useState<TabType>("plans");

  // 플랜 다이얼로그
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [planDialogMode, setPlanDialogMode] = useState<"add" | "edit">("add");
  const [editingPlan, setEditingPlan] = useState<MakeupHairPlan | null>(null);

  // 타임라인 다이얼로그
  const [timelineDialogOpen, setTimelineDialogOpen] = useState(false);
  const [timelineDialogMode, setTimelineDialogMode] = useState<"add" | "edit">("add");
  const [editingTimeline, setEditingTimeline] = useState<MakeupHairTimelineEntry | null>(null);

  // 아티스트 다이얼로그
  const [artistDialogOpen, setArtistDialogOpen] = useState(false);
  const [artistDialogMode, setArtistDialogMode] = useState<"add" | "edit">("add");
  const [editingArtist, setEditingArtist] = useState<MakeupHairArtist | null>(null);

  // 체크리스트 입력
  const [checklistInput, setChecklistInput] = useState("");

  // ── 플랜 핸들러 ────────────────────────────────────────────
  const handleAddPlanOpen = () => {
    setEditingPlan(null);
    setPlanDialogMode("add");
    setPlanDialogOpen(true);
  };

  const handleEditPlanOpen = (plan: MakeupHairPlan) => {
    setEditingPlan(plan);
    setPlanDialogMode("edit");
    setPlanDialogOpen(true);
  };

  const handlePlanSubmit = (planData: Omit<MakeupHairPlan, "id" | "createdAt">) => {
    if (planDialogMode === "add") {
      addPlan(planData);
      toast.success(TOAST.MAKEUP_HAIR.PLAN_ADDED);
    } else if (editingPlan) {
      updatePlan(editingPlan.id, planData);
      toast.success(TOAST.MAKEUP_HAIR.PLAN_UPDATED);
    }
  };

  const handleDeletePlan = (planId: string) => {
    deletePlan(planId);
    toast.success(TOAST.MAKEUP_HAIR.PLAN_DELETED);
  };

  // ── 타임라인 핸들러 ────────────────────────────────────────
  const handleAddTimelineOpen = () => {
    setEditingTimeline(null);
    setTimelineDialogMode("add");
    setTimelineDialogOpen(true);
  };

  const handleEditTimelineOpen = (entry: MakeupHairTimelineEntry) => {
    setEditingTimeline(entry);
    setTimelineDialogMode("edit");
    setTimelineDialogOpen(true);
  };

  const handleTimelineSubmit = (entryData: Omit<MakeupHairTimelineEntry, "id">) => {
    if (timelineDialogMode === "add") {
      addTimelineEntry(entryData);
      toast.success(TOAST.MAKEUP_HAIR.TIMELINE_ADDED);
    } else if (editingTimeline) {
      updateTimelineEntry(editingTimeline.id, entryData);
      toast.success(TOAST.MAKEUP_HAIR.TIMELINE_UPDATED);
    }
  };

  const handleDeleteTimeline = (entryId: string) => {
    deleteTimelineEntry(entryId);
    toast.success(TOAST.MAKEUP_HAIR.TIMELINE_DELETED);
  };

  // ── 체크리스트 핸들러 ──────────────────────────────────────
  const handleAddChecklist = () => {
    const trimmed = checklistInput.trim();
    if (!trimmed) {
      toast.error(TOAST.MAKEUP_HAIR.CHECKLIST_ITEM_NAME_REQUIRED);
      return;
    }
    addChecklistItem(trimmed);
    setChecklistInput("");
    toast.success(TOAST.MAKEUP_HAIR.CHECKLIST_ITEM_ADDED);
  };

  // ── 아티스트 핸들러 ────────────────────────────────────────
  const handleAddArtistOpen = () => {
    setEditingArtist(null);
    setArtistDialogMode("add");
    setArtistDialogOpen(true);
  };

  const handleEditArtistOpen = (artist: MakeupHairArtist) => {
    setEditingArtist(artist);
    setArtistDialogMode("edit");
    setArtistDialogOpen(true);
  };

  const handleArtistSubmit = (artistData: Omit<MakeupHairArtist, "id">) => {
    if (artistDialogMode === "add") {
      addArtist(artistData);
      toast.success(TOAST.MAKEUP_HAIR.ARTIST_ADDED);
    } else if (editingArtist) {
      updateArtist(editingArtist.id, artistData);
      toast.success(TOAST.MAKEUP_HAIR.ARTIST_UPDATED);
    }
  };

  const handleDeleteArtist = (artistId: string) => {
    deleteArtist(artistId);
    toast.success(TOAST.MAKEUP_HAIR.ARTIST_DELETED);
  };

  // ── 통계 도넛 데이터 ──────────────────────────────────────
  const donutData = [
    { label: "스테이지", value: stats.makeupTypeCounts["스테이지"], color: DONUT_COLORS[0] },
    { label: "내추럴", value: stats.makeupTypeCounts["내추럴"], color: DONUT_COLORS[1] },
    { label: "특수분장", value: stats.makeupTypeCounts["특수분장"], color: DONUT_COLORS[2] },
  ];

  const checklistPct =
    stats.checklistTotal > 0
      ? Math.round((stats.checklistDone / stats.checklistTotal) * 100)
      : 0;

  const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = useMemo(() => [
    { key: "plans" as TabType, label: "플랜", icon: <Sparkles className="h-3 w-3" /> },
    { key: "timeline" as TabType, label: "타임라인", icon: <Clock className="h-3 w-3" /> },
    { key: "checklist" as TabType, label: "준비물", icon: <CheckSquare className="h-3 w-3" /> },
    { key: "artists" as TabType, label: "아티스트", icon: <User className="h-3 w-3" /> },
    { key: "stats" as TabType, label: "통계", icon: <BarChart2 className="h-3 w-3" /> },
  ], []);

  const sortedTimeline = [...data.timeline].sort((a, b) =>
    a.startTime.localeCompare(b.startTime)
  );

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card className="w-full">
          <CardHeader className="pb-2 pt-3 px-4">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-pink-500" />
                  <CardTitle className="text-sm font-semibold">
                    분장 / 헤어 관리
                  </CardTitle>
                  {stats.totalPlans > 0 && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 bg-pink-50 text-pink-600 border-pink-200"
                    >
                      {stats.totalPlans}개 플랜
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {stats.checklistTotal > 0 && (
                    <span className="text-[10px] text-muted-foreground">
                      준비물 {stats.checklistDone}/{stats.checklistTotal}
                    </span>
                  )}
                  {isOpen ? (
                    <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </div>
              </div>
            </CollapsibleTrigger>
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="px-4 pb-4 pt-0 space-y-3">
              {loading ? (
                <p className="text-xs text-muted-foreground py-2">불러오는 중...</p>
              ) : (
                <>
                  {/* 탭 네비게이션 */}
                  <div className="flex items-center gap-1 flex-wrap border-b pb-2">
                    {tabs.map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded transition-colors ${
                          activeTab === tab.key
                            ? "bg-pink-100 text-pink-700 font-medium"
                            : "text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {tab.icon}
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* 플랜 탭 */}
                  {activeTab === "plans" && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                          분장/헤어 플랜 목록
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={handleAddPlanOpen}
                        >
                          <Plus className="h-3 w-3 mr-0.5" />
                          플랜 추가
                        </Button>
                      </div>

                      {data.plans.length === 0 ? (
                        <div className="py-6 text-center space-y-1.5">
                          <Sparkles className="h-6 w-6 text-muted-foreground mx-auto" />
                          <p className="text-xs text-muted-foreground">
                            플랜을 추가하여 분장/헤어 스타일을 관리하세요.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {data.plans.map((plan) => (
                            <div
                              key={plan.id}
                              className="flex items-start gap-2 p-2.5 rounded-md border bg-muted/20 group"
                            >
                              <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-xs font-medium">
                                    {plan.memberName}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] px-1.5 py-0"
                                  >
                                    Scene {plan.scene}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className={`text-[10px] px-1.5 py-0 ${MAKEUP_TYPE_COLORS[plan.makeupType]}`}
                                  >
                                    {plan.makeupType}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className={`text-[10px] px-1.5 py-0 ${HAIR_STYLE_COLORS[plan.hairStyle]}`}
                                  >
                                    {plan.hairStyle}
                                  </Badge>
                                  {plan.colorTone && (
                                    <span className="text-[10px] text-muted-foreground">
                                      {plan.colorTone}
                                    </span>
                                  )}
                                </div>
                                {plan.memo && (
                                  <p className="text-[10px] text-muted-foreground">
                                    {plan.memo}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => handleEditPlanOpen(plan)}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                  onClick={() => handleDeletePlan(plan.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 타임라인 탭 */}
                  {activeTab === "timeline" && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                          분장 타임라인
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={handleAddTimelineOpen}
                        >
                          <Plus className="h-3 w-3 mr-0.5" />
                          항목 추가
                        </Button>
                      </div>

                      {sortedTimeline.length === 0 ? (
                        <div className="py-6 text-center space-y-1.5">
                          <Clock className="h-6 w-6 text-muted-foreground mx-auto" />
                          <p className="text-xs text-muted-foreground">
                            분장 타임라인을 추가하세요.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {sortedTimeline.map((entry) => (
                            <div
                              key={entry.id}
                              className="flex items-center gap-2 p-2 rounded-md border bg-muted/20 group"
                            >
                              <div className="flex-shrink-0 text-center min-w-[48px]">
                                <span className="text-xs font-mono font-medium text-pink-600">
                                  {entry.startTime}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-xs font-medium">
                                  {entry.memberName}
                                </span>
                                <span className="text-[10px] text-muted-foreground ml-1.5">
                                  {entry.durationMinutes}분 소요
                                </span>
                              </div>
                              <div className="flex-shrink-0 w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-pink-400"
                                  style={{
                                    width: `${Math.min(100, (entry.durationMinutes / 120) * 100)}%`,
                                  }}
                                />
                              </div>
                              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => handleEditTimelineOpen(entry)}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteTimeline(entry.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 체크리스트 탭 */}
                  {activeTab === "checklist" && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                          준비물 체크리스트
                        </span>
                        {stats.checklistTotal > 0 && (
                          <span className="text-[10px] text-muted-foreground">
                            {stats.checklistDone}/{stats.checklistTotal} 완료
                          </span>
                        )}
                      </div>

                      {stats.checklistTotal > 0 && (
                        <div className="space-y-1">
                          <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-green-500 transition-all duration-300"
                              style={{ width: `${checklistPct}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-muted-foreground text-right">
                            {checklistPct}% 준비 완료
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5">
                        <Input
                          className="h-8 text-xs flex-1"
                          placeholder="준비물 입력 후 추가 (예: 파운데이션, 헤어핀)"
                          value={checklistInput}
                          onChange={(e) => setChecklistInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddChecklist();
                          }}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs px-2 flex-shrink-0"
                          onClick={handleAddChecklist}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      {data.checklist.length === 0 ? (
                        <div className="py-4 text-center space-y-1">
                          <Package className="h-6 w-6 text-muted-foreground mx-auto" />
                          <p className="text-xs text-muted-foreground">
                            준비물을 등록하세요.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {data.checklist.map((cItem) => (
                            <div
                              key={cItem.id}
                              className="flex items-center gap-2 py-1.5 group"
                            >
                              <Checkbox
                                checked={cItem.checked}
                                onCheckedChange={() => toggleChecklistItem(cItem.id)}
                                className="h-4 w-4 flex-shrink-0"
                              />
                              <span
                                className={`text-xs flex-1 ${
                                  cItem.checked
                                    ? "line-through text-muted-foreground"
                                    : ""
                                }`}
                              >
                                {cItem.item}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0 text-destructive opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                onClick={() => deleteChecklistItem(cItem.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 아티스트 탭 */}
                  {activeTab === "artists" && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                          담당 아티스트
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={handleAddArtistOpen}
                        >
                          <Plus className="h-3 w-3 mr-0.5" />
                          아티스트 추가
                        </Button>
                      </div>

                      {data.artists.length === 0 ? (
                        <div className="py-6 text-center space-y-1.5">
                          <User className="h-6 w-6 text-muted-foreground mx-auto" />
                          <p className="text-xs text-muted-foreground">
                            담당 아티스트를 등록하세요.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {data.artists.map((artist) => (
                            <div
                              key={artist.id}
                              className="flex items-start gap-2 p-2.5 rounded-md border bg-muted/20 group"
                            >
                              <div className="flex-1 min-w-0 space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-medium">{artist.name}</span>
                                  {artist.specialty && (
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] px-1.5 py-0 bg-indigo-50 text-indigo-700 border-indigo-200"
                                    >
                                      {artist.specialty}
                                    </Badge>
                                  )}
                                </div>
                                {artist.contact && (
                                  <p className="text-[10px] text-muted-foreground">
                                    {artist.contact}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => handleEditArtistOpen(artist)}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteArtist(artist.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 통계 탭 */}
                  {activeTab === "stats" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          분장 유형별 통계
                        </span>
                        {stats.totalPlans === 0 ? (
                          <p className="text-xs text-muted-foreground py-2">
                            플랜을 추가하면 통계가 표시됩니다.
                          </p>
                        ) : (
                          <div className="flex items-center gap-4">
                            <DonutChart data={donutData} total={stats.totalPlans} />
                            <div className="flex-1 space-y-1.5">
                              {donutData.map((d, i) => (
                                <div key={d.label} className="flex items-center gap-2">
                                  <span
                                    className="inline-block w-2.5 h-2.5 rounded-sm flex-shrink-0"
                                    style={{ backgroundColor: DONUT_COLORS[i] }}
                                  />
                                  <span className="text-xs text-muted-foreground flex-1">
                                    {d.label}
                                  </span>
                                  <span className="text-xs font-medium">{d.value}명</span>
                                  <span className="text-[10px] text-muted-foreground w-8 text-right">
                                    {stats.totalPlans > 0
                                      ? Math.round((d.value / stats.totalPlans) * 100)
                                      : 0}
                                    %
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          준비물 완료율
                        </span>
                        {stats.checklistTotal === 0 ? (
                          <p className="text-xs text-muted-foreground">
                            체크리스트 아이템을 추가하세요.
                          </p>
                        ) : (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">
                                {stats.checklistDone}개 완료 / {stats.checklistTotal}개 전체
                              </span>
                              <span className="font-medium text-green-600">
                                {checklistPct}%
                              </span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full bg-green-500 transition-all duration-300"
                                style={{ width: `${checklistPct}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 p-2.5 rounded-md border bg-muted/20">
                        <User className="h-4 w-4 text-indigo-500 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs font-medium">담당 아티스트</p>
                          <p className="text-[10px] text-muted-foreground">
                            총 {data.artists.length}명 등록됨
                          </p>
                        </div>
                        <span className="text-lg font-semibold text-indigo-600">
                          {data.artists.length}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 p-2.5 rounded-md border bg-muted/20">
                        <Clock className="h-4 w-4 text-pink-500 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs font-medium">분장 타임라인</p>
                          <p className="text-[10px] text-muted-foreground">
                            총 {data.timeline.length}개 일정
                          </p>
                        </div>
                        <span className="text-lg font-semibold text-pink-600">
                          {data.timeline.length}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <PlanDialog
        open={planDialogOpen}
        mode={planDialogMode}
        initial={
          editingPlan
            ? {
                memberName: editingPlan.memberName,
                scene: editingPlan.scene,
                makeupType: editingPlan.makeupType,
                hairStyle: editingPlan.hairStyle,
                colorTone: editingPlan.colorTone,
                memo: editingPlan.memo,
              }
            : undefined
        }
        onClose={() => setPlanDialogOpen(false)}
        onSubmit={handlePlanSubmit}
      />

      <TimelineDialog
        open={timelineDialogOpen}
        mode={timelineDialogMode}
        initial={
          editingTimeline
            ? {
                memberName: editingTimeline.memberName,
                startTime: editingTimeline.startTime,
                durationMinutes: editingTimeline.durationMinutes,
              }
            : undefined
        }
        onClose={() => setTimelineDialogOpen(false)}
        onSubmit={handleTimelineSubmit}
      />

      <ArtistDialog
        open={artistDialogOpen}
        mode={artistDialogMode}
        initial={
          editingArtist
            ? {
                name: editingArtist.name,
                contact: editingArtist.contact,
                specialty: editingArtist.specialty,
              }
            : undefined
        }
        onClose={() => setArtistDialogOpen(false)}
        onSubmit={handleArtistSubmit}
      />
    </>
  );
}
