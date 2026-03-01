"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Handshake,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  DollarSign,
  MapPin,
  Monitor,
  Wrench,
  MoreHorizontal,
  RefreshCw,
  Phone,
  User,
  CalendarDays,
  CheckCircle2,
  Clock,
  MessageSquare,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useEventSponsorship } from "@/hooks/use-event-sponsorship";
import type { SponsorEntry, SponsorType, SponsorStatus } from "@/types";

// ─── 상수 ────────────────────────────────────────────────────

const SPONSOR_TYPE_LABELS: Record<SponsorType, string> = {
  financial: "재정",
  venue: "장소",
  equipment: "장비",
  media: "미디어",
  other: "기타",
};

const SPONSOR_TYPE_COLORS: Record<SponsorType, string> = {
  financial: "bg-green-100 text-green-700",
  venue: "bg-blue-100 text-blue-700",
  equipment: "bg-orange-100 text-orange-700",
  media: "bg-purple-100 text-purple-700",
  other: "bg-gray-100 text-gray-600",
};

const SPONSOR_STATUS_LABELS: Record<SponsorStatus, string> = {
  prospect: "발굴",
  negotiating: "협의 중",
  confirmed: "확정",
  completed: "완료",
};

const SPONSOR_STATUS_COLORS: Record<SponsorStatus, string> = {
  prospect: "bg-blue-100 text-blue-700",
  negotiating: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-emerald-100 text-emerald-700",
  completed: "bg-gray-100 text-gray-600",
};

type TabFilter = "all" | SponsorStatus;

function TypeIcon({ type }: { type: SponsorType }) {
  const cls = "h-3 w-3";
  switch (type) {
    case "financial": return <DollarSign className={cls} />;
    case "venue":     return <MapPin className={cls} />;
    case "equipment": return <Wrench className={cls} />;
    case "media":     return <Monitor className={cls} />;
    default:          return <MoreHorizontal className={cls} />;
  }
}

function formatAmount(amount: number): string {
  if (amount <= 0) return "-";
  if (amount >= 10000) {
    const man = Math.floor(amount / 10000);
    const rem = amount % 10000;
    return rem > 0 ? `${man}만 ${rem.toLocaleString()}원` : `${man}만원`;
  }
  return `${amount.toLocaleString()}원`;
}

// ─── 스폰서 추가 폼 ───────────────────────────────────────────

interface AddSponsorFormProps {
  onAdd: ReturnType<typeof useEventSponsorship>["addSponsor"];
  onClose: () => void;
}

function AddSponsorForm({ onAdd, onClose }: AddSponsorFormProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<SponsorType>("financial");
  const [status, setStatus] = useState<SponsorStatus>("prospect");
  const [contactName, setContactName] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [supportAmount, setSupportAmount] = useState(0);
  const [supportDescription, setSupportDescription] = useState("");
  const [eventName, setEventName] = useState("");
  const [note, setNote] = useState("");

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("스폰서/협력사 이름을 입력해주세요.");
      return;
    }
    if (!eventName.trim()) {
      toast.error("연관 이벤트명을 입력해주세요.");
      return;
    }
    const ok = onAdd({
      name: name.trim(),
      type,
      status,
      contactName: contactName.trim(),
      contactInfo: contactInfo.trim(),
      supportAmount: Math.max(0, supportAmount),
      supportDescription: supportDescription.trim(),
      eventName: eventName.trim(),
      note: note.trim(),
    });
    if (ok) {
      toast.success("스폰서가 등록되었습니다.");
      onClose();
    } else {
      toast.error("스폰서 등록에 실패했습니다.");
    }
  };

  return (
    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 space-y-2">
      <p className="text-xs font-medium text-gray-600">새 스폰서/협력사 등록</p>

      {/* 이름 */}
      <Input
        value={name}
        onChange={(e) => setName(e.target.value.slice(0, 50))}
        placeholder="스폰서/협력사 이름 (예: ABC 기업)"
        className="h-8 text-xs"
      />

      {/* 이벤트명 */}
      <Input
        value={eventName}
        onChange={(e) => setEventName(e.target.value.slice(0, 50))}
        placeholder="연관 이벤트명 (예: 2026 봄 정기공연)"
        className="h-8 text-xs"
      />

      {/* 유형 + 상태 */}
      <div className="flex gap-2">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as SponsorType)}
          className="flex-1 rounded-md border border-gray-200 bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gray-300"
          title="스폰서 유형"
        >
          {(Object.keys(SPONSOR_TYPE_LABELS) as SponsorType[]).map((t) => (
            <option key={t} value={t}>{SPONSOR_TYPE_LABELS[t]}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as SponsorStatus)}
          className="flex-1 rounded-md border border-gray-200 bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gray-300"
          title="계약 상태"
        >
          {(Object.keys(SPONSOR_STATUS_LABELS) as SponsorStatus[]).map((s) => (
            <option key={s} value={s}>{SPONSOR_STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {/* 담당자 이름 + 연락처 */}
      <div className="flex gap-2">
        <Input
          value={contactName}
          onChange={(e) => setContactName(e.target.value.slice(0, 30))}
          placeholder="담당자 이름 (선택)"
          className="h-8 flex-1 text-xs"
        />
        <Input
          value={contactInfo}
          onChange={(e) => setContactInfo(e.target.value.slice(0, 50))}
          placeholder="연락처/이메일 (선택)"
          className="h-8 flex-1 text-xs"
        />
      </div>

      {/* 지원금액 */}
      <div className="flex items-center gap-2">
        <span className="shrink-0 text-[10px] text-gray-500">지원금액 (원):</span>
        <Input
          type="number"
          min={0}
          value={supportAmount || ""}
          onChange={(e) => setSupportAmount(Math.max(0, Number(e.target.value)))}
          placeholder="0 (금액 없으면 0)"
          className="h-8 flex-1 text-xs"
        />
      </div>

      {/* 지원 내용 */}
      <Input
        value={supportDescription}
        onChange={(e) => setSupportDescription(e.target.value.slice(0, 100))}
        placeholder="지원 내용 (예: 행사 장소 무상 제공)"
        className="h-8 text-xs"
      />

      {/* 메모 */}
      <Input
        value={note}
        onChange={(e) => setNote(e.target.value.slice(0, 100))}
        placeholder="메모 (선택, 최대 100자)"
        className="h-8 text-xs"
      />

      {/* 버튼 */}
      <div className="flex gap-2">
        <Button size="sm" className="h-7 flex-1 text-xs" onClick={handleSubmit}>
          <Plus className="mr-1 h-3 w-3" />
          등록
        </Button>
        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onClose}>
          취소
        </Button>
      </div>
    </div>
  );
}

// ─── 상태 변경 인라인 편집 ───────────────────────────────────

interface StatusSelectProps {
  sponsorId: string;
  current: SponsorStatus;
  onChangeStatus: ReturnType<typeof useEventSponsorship>["changeStatus"];
}

function StatusSelect({ sponsorId, current, onChangeStatus }: StatusSelectProps) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="flex items-center gap-0.5"
        title="상태 변경"
      >
        <Badge className={`text-[10px] px-1.5 py-0 ${SPONSOR_STATUS_COLORS[current]} hover:opacity-80 cursor-pointer`}>
          {SPONSOR_STATUS_LABELS[current]}
        </Badge>
        <Pencil className="h-2.5 w-2.5 text-gray-300" />
      </button>
    );
  }

  return (
    <select
      autoFocus
      value={current}
      onChange={(e) => {
        const ok = onChangeStatus(sponsorId, e.target.value as SponsorStatus);
        if (ok) toast.success("상태가 변경되었습니다.");
        else toast.error("상태 변경에 실패했습니다.");
        setEditing(false);
      }}
      onBlur={() => setEditing(false)}
      className="rounded border border-gray-300 px-1.5 py-0.5 text-[10px] focus:outline-none focus:ring-1 focus:ring-gray-300"
    >
      {(Object.keys(SPONSOR_STATUS_LABELS) as SponsorStatus[]).map((s) => (
        <option key={s} value={s}>{SPONSOR_STATUS_LABELS[s]}</option>
      ))}
    </select>
  );
}

// ─── 스폰서 행 ────────────────────────────────────────────────

interface SponsorRowProps {
  sponsor: SponsorEntry;
  onDelete: () => void;
  onChangeStatus: ReturnType<typeof useEventSponsorship>["changeStatus"];
}

function SponsorRow({ sponsor, onDelete, onChangeStatus }: SponsorRowProps) {
  return (
    <div className="rounded-md border border-gray-100 bg-background px-3 py-2 space-y-1">
      {/* 상단: 이름 + 배지 + 삭제 */}
      <div className="flex items-start gap-2">
        <span className={`mt-0.5 shrink-0 ${SPONSOR_TYPE_COLORS[sponsor.type].split(" ")[1]}`}>
          <TypeIcon type={sponsor.type} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-medium text-gray-800 truncate">{sponsor.name}</span>
            <Badge className={`shrink-0 text-[10px] px-1.5 py-0 ${SPONSOR_TYPE_COLORS[sponsor.type]}`}>
              {SPONSOR_TYPE_LABELS[sponsor.type]}
            </Badge>
            <StatusSelect
              sponsorId={sponsor.id}
              current={sponsor.status}
              onChangeStatus={onChangeStatus}
            />
          </div>
          {/* 이벤트명 */}
          <div className="mt-0.5 flex items-center gap-1 text-[10px] text-gray-400">
            <CalendarDays className="h-2.5 w-2.5 shrink-0" />
            <span className="truncate">{sponsor.eventName}</span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 shrink-0 p-0 text-gray-300 hover:text-red-500"
          onClick={onDelete}
          title="삭제"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* 세부 정보 */}
      <div className="ml-5 space-y-0.5 text-[10px] text-gray-500">
        {sponsor.supportAmount > 0 && (
          <div className="flex items-center gap-1">
            <DollarSign className="h-2.5 w-2.5 shrink-0 text-green-500" />
            <span className="font-medium text-green-700">{formatAmount(sponsor.supportAmount)}</span>
          </div>
        )}
        {sponsor.supportDescription && (
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-2.5 w-2.5 shrink-0 text-blue-400" />
            <span className="truncate">{sponsor.supportDescription}</span>
          </div>
        )}
        {(sponsor.contactName || sponsor.contactInfo) && (
          <div className="flex items-center gap-1">
            {sponsor.contactName && (
              <>
                <User className="h-2.5 w-2.5 shrink-0" />
                <span>{sponsor.contactName}</span>
              </>
            )}
            {sponsor.contactInfo && (
              <>
                <Phone className="h-2.5 w-2.5 shrink-0" />
                <span className="truncate">{sponsor.contactInfo}</span>
              </>
            )}
          </div>
        )}
        {sponsor.note && (
          <div className="flex items-center gap-1">
            <MessageSquare className="h-2.5 w-2.5 shrink-0" />
            <span className="truncate text-gray-400">{sponsor.note}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 통계 요약 ────────────────────────────────────────────────

interface StatsSummaryProps {
  totalCount: number;
  confirmedAmount: number;
  typeDistribution: Record<SponsorType, number>;
  statusDistribution: Record<SponsorStatus, number>;
}

function StatsSummary({ totalCount, confirmedAmount, typeDistribution, statusDistribution }: StatsSummaryProps) {
  return (
    <div className="space-y-3">
      {/* 주요 수치 */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-gray-50 px-3 py-2 text-center">
          <div className="text-sm font-bold text-gray-700">{totalCount}</div>
          <div className="text-[10px] text-gray-500 mt-0.5">전체 스폰서</div>
        </div>
        <div className="rounded-lg bg-emerald-50 px-3 py-2 text-center">
          <div className="text-sm font-bold text-emerald-700">{formatAmount(confirmedAmount)}</div>
          <div className="text-[10px] text-gray-500 mt-0.5">확정 금액</div>
        </div>
      </div>

      {/* 상태별 분포 */}
      <div className="grid grid-cols-4 gap-1.5">
        {(Object.keys(SPONSOR_STATUS_LABELS) as SponsorStatus[]).map((s) => (
          <div key={s} className="rounded-md bg-gray-50 px-2 py-1.5 text-center">
            <div className={`text-xs font-bold ${
              s === "confirmed" ? "text-emerald-600" :
              s === "negotiating" ? "text-yellow-600" :
              s === "completed" ? "text-gray-500" : "text-blue-600"
            }`}>
              {statusDistribution[s]}
            </div>
            <div className="text-[9px] text-gray-400 mt-0.5">{SPONSOR_STATUS_LABELS[s]}</div>
          </div>
        ))}
      </div>

      {/* 유형별 분포 */}
      {totalCount > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(SPONSOR_TYPE_LABELS) as SponsorType[]).map((t) =>
            typeDistribution[t] > 0 ? (
              <Badge
                key={t}
                className={`text-[10px] px-1.5 py-0 ${SPONSOR_TYPE_COLORS[t]}`}
              >
                <TypeIcon type={t} />
                <span className="ml-1">{SPONSOR_TYPE_LABELS[t]} {typeDistribution[t]}</span>
              </Badge>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}

// ─── 메인 카드 ────────────────────────────────────────────────

interface EventSponsorshipCardProps {
  groupId: string;
}

export function EventSponsorshipCard({ groupId }: EventSponsorshipCardProps) {
  const [open, setOpen] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState<TabFilter>("all");

  const {
    sponsors,
    addSponsor,
    deleteSponsor,
    changeStatus,
    getByStatus,
    totalCount,
    confirmedAmount,
    typeDistribution,
    statusDistribution,
    refetch,
  } = useEventSponsorship(groupId);

  const confirmedCount = statusDistribution.confirmed + statusDistribution.completed;

  // 탭별 필터링
  const filteredSponsors: SponsorEntry[] =
    activeTab === "all" ? sponsors : getByStatus(activeTab);

  const handleDelete = (sponsor: SponsorEntry) => {
    const ok = deleteSponsor(sponsor.id);
    if (ok) {
      toast.success("스폰서가 삭제되었습니다.");
    } else {
      toast.error("스폰서 삭제에 실패했습니다.");
    }
  };

  const TAB_ITEMS: { value: TabFilter; label: string }[] = [
    { value: "all", label: `전체 (${totalCount})` },
    { value: "prospect", label: `발굴 (${statusDistribution.prospect})` },
    { value: "negotiating", label: `협의 (${statusDistribution.negotiating})` },
    { value: "confirmed", label: `확정 (${statusDistribution.confirmed})` },
    { value: "completed", label: `완료 (${statusDistribution.completed})` },
  ];

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      {/* 헤더 */}
      <div className="flex items-center justify-between rounded-t-lg border border-b-0 border-gray-200 bg-background px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Handshake className="h-4 w-4 text-indigo-500" />
          <span className="text-sm font-semibold text-gray-800">스폰서/협력사</span>
          {totalCount > 0 && (
            <Badge className="bg-indigo-100 text-[10px] px-1.5 py-0 text-indigo-600 hover:bg-indigo-100">
              {totalCount}개
            </Badge>
          )}
          {confirmedCount > 0 && (
            <Badge className="bg-emerald-100 text-[10px] px-1.5 py-0 text-emerald-600 hover:bg-emerald-100">
              <CheckCircle2 className="mr-0.5 h-2.5 w-2.5" />
              확정 {confirmedCount}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-gray-400"
            onClick={() => { refetch(); toast.success("새로고침했습니다."); }}
            title="새로고침"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              {open ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </Button>
          </CollapsibleTrigger>
        </div>
      </div>

      {/* 본문 */}
      <CollapsibleContent>
        <div className="rounded-b-lg border border-gray-200 bg-card p-4 space-y-4">
          {/* 통계 요약 */}
          <StatsSummary
            totalCount={totalCount}
            confirmedAmount={confirmedAmount}
            typeDistribution={typeDistribution}
            statusDistribution={statusDistribution}
          />

          <Separator />

          {/* 액션 버튼 */}
          <div className="flex items-center justify-between">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              <Plus className="mr-1 h-3 w-3" />
              스폰서 추가
            </Button>
            {confirmedAmount > 0 && (
              <div className="flex items-center gap-1 text-[10px] text-gray-500">
                <DollarSign className="h-3 w-3 text-emerald-500" />
                <span>확정 지원금: <span className="font-semibold text-emerald-600">{formatAmount(confirmedAmount)}</span></span>
              </div>
            )}
          </div>

          {/* 추가 폼 */}
          {showAddForm && (
            <AddSponsorForm
              onAdd={addSponsor}
              onClose={() => setShowAddForm(false)}
            />
          )}

          {/* 상태별 탭 */}
          <div className="flex gap-0.5 overflow-x-auto rounded-lg bg-gray-100 p-1">
            {TAB_ITEMS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`shrink-0 rounded-md px-2.5 py-1 text-[10px] font-medium transition-colors ${
                  activeTab === tab.value
                    ? "bg-background text-gray-800 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 스폰서 목록 */}
          {filteredSponsors.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-1 py-8 text-gray-400">
              <Clock className="h-8 w-8 opacity-30" />
              <p className="text-xs">
                {activeTab === "all"
                  ? "등록된 스폰서/협력사가 없습니다."
                  : `'${SPONSOR_STATUS_LABELS[activeTab as SponsorStatus]}' 상태의 스폰서가 없습니다.`}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredSponsors.map((sponsor) => (
                <SponsorRow
                  key={sponsor.id}
                  sponsor={sponsor}
                  onDelete={() => handleDelete(sponsor)}
                  onChangeStatus={changeStatus}
                />
              ))}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
