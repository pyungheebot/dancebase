"use client";

import { useState, useCallback } from "react";
import {
  Users,
  Plus,
  Star,
  Trash2,
  Pencil,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ChevronDown,
  ChevronUp,
  Search,
  X,
  Check,
  Music,
  ExternalLink,
  BookUser,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { cn } from "@/lib/utils";
import {
  useDanceNetworking,
  ROLE_LABEL,
  ROLE_COLOR,
  ROLE_OPTIONS,
  SNS_PLATFORM_OPTIONS,
  SNS_PLATFORM_LABEL,
} from "@/hooks/use-dance-networking";
import type {
  DanceNetworkingEntry,
  DanceNetworkingRole,
  DanceNetworkingSns,
} from "@/types";
import { formatYearMonthDay } from "@/lib/date-utils";

// ============================================
// 날짜 포맷
// ============================================

function getTodayStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// ============================================
// SNS 입력 행
// ============================================

function SnsRow({
  item,
  onChange,
  onRemove,
}: {
  item: DanceNetworkingSns;
  onChange: (updated: DanceNetworkingSns) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex gap-1 items-center">
      <Select
        value={item.platform}
        onValueChange={(v) =>
          onChange({ ...item, platform: v as DanceNetworkingSns["platform"] })
        }
      >
        <SelectTrigger className="h-7 text-xs w-28 shrink-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SNS_PLATFORM_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value} className="text-xs">
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        className="h-7 text-xs flex-1"
        placeholder="@아이디 또는 URL"
        value={item.handle}
        onChange={(e) => onChange({ ...item, handle: e.target.value })}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 text-gray-400 hover:text-red-500"
        onClick={onRemove}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}

// ============================================
// 장르 태그 입력
// ============================================

function GenreInput({
  genres,
  onChange,
}: {
  genres: string[];
  onChange: (genres: string[]) => void;
}) {
  const [inputVal, setInputVal] = useState("");

  function addGenre() {
    const trimmed = inputVal.trim();
    if (!trimmed) return;
    if (genres.includes(trimmed)) {
      toast.error(TOAST.MEMBERS.NETWORKING_GENRE_DUPLICATE);
      return;
    }
    onChange([...genres, trimmed]);
    setInputVal("");
  }

  function removeGenre(genre: string) {
    onChange(genres.filter((g) => g !== genre));
  }

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        <Input
          className="h-7 text-xs flex-1"
          placeholder="장르 입력 후 Enter (예: 팝핀, 힙합)"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addGenre();
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={addGenre}
        >
          추가
        </Button>
      </div>
      {genres.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {genres.map((g) => (
            <Badge
              key={g}
              variant="secondary"
              className="text-[10px] px-1.5 py-0 gap-0.5 cursor-pointer hover:bg-red-100 hover:text-red-600"
              onClick={() => removeGenre(g)}
            >
              {g}
              <X className="h-2.5 w-2.5 ml-0.5" />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// 연락처 폼 (추가/수정 공통)
// ============================================

type FormState = {
  name: string;
  affiliation: string;
  genres: string[];
  phone: string;
  email: string;
  snsAccounts: DanceNetworkingSns[];
  metAt: string;
  metDate: string;
  role: DanceNetworkingRole;
  notes: string;
};

function makeEmptyForm(): FormState {
  return {
    name: "",
    affiliation: "",
    genres: [],
    phone: "",
    email: "",
    snsAccounts: [],
    metAt: "",
    metDate: getTodayStr(),
    role: "dancer",
    notes: "",
  };
}

function entryToForm(entry: DanceNetworkingEntry): FormState {
  return {
    name: entry.name,
    affiliation: entry.affiliation ?? "",
    genres: [...entry.genres],
    phone: entry.phone ?? "",
    email: entry.email ?? "",
    snsAccounts: entry.snsAccounts.map((s) => ({ ...s })),
    metAt: entry.metAt ?? "",
    metDate: entry.metDate ?? getTodayStr(),
    role: entry.role,
    notes: entry.notes ?? "",
  };
}

function ContactForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  initial: FormState;
  onSubmit: (form: FormState) => void;
  onCancel: () => void;
  submitLabel: string;
}) {
  const [form, setForm] = useState<FormState>(initial);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSnsChange(idx: number, updated: DanceNetworkingSns) {
    const next = [...form.snsAccounts];
    next[idx] = updated;
    set("snsAccounts", next);
  }

  function handleSnsRemove(idx: number) {
    set(
      "snsAccounts",
      form.snsAccounts.filter((_, i) => i !== idx)
    );
  }

  function handleAddSns() {
    set("snsAccounts", [
      ...form.snsAccounts,
      { platform: "instagram", handle: "" },
    ]);
  }

  function handleSubmit() {
    if (!form.name.trim()) {
      toast.error(TOAST.MEMBERS.NETWORKING_NAME_REQUIRED);
      return;
    }
    onSubmit(form);
  }

  return (
    <div className="space-y-3 pt-2">
      {/* 이름 + 역할 */}
      <div className="flex gap-2">
        <div className="flex-1 space-y-1">
          <p className="text-[10px] font-medium text-gray-500">이름 *</p>
          <Input
            className="h-7 text-xs"
            placeholder="홍길동"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </div>
        <div className="w-32 space-y-1">
          <p className="text-[10px] font-medium text-gray-500">관계</p>
          <Select
            value={form.role}
            onValueChange={(v) => set("role", v as DanceNetworkingRole)}
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLE_OPTIONS.map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                  className="text-xs"
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 소속 */}
      <div className="space-y-1">
        <p className="text-[10px] font-medium text-gray-500">소속 (팀/스튜디오)</p>
        <Input
          className="h-7 text-xs"
          placeholder="소속 팀 또는 스튜디오"
          value={form.affiliation}
          onChange={(e) => set("affiliation", e.target.value)}
        />
      </div>

      {/* 전문 장르 */}
      <div className="space-y-1">
        <p className="text-[10px] font-medium text-gray-500">전문 장르</p>
        <GenreInput genres={form.genres} onChange={(g) => set("genres", g)} />
      </div>

      {/* 연락처 */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <p className="text-[10px] font-medium text-gray-500">전화번호</p>
          <Input
            className="h-7 text-xs"
            placeholder="010-0000-0000"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-medium text-gray-500">이메일</p>
          <Input
            className="h-7 text-xs"
            placeholder="example@email.com"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
          />
        </div>
      </div>

      {/* SNS */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-medium text-gray-500">SNS 계정</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 text-[10px] text-blue-600 hover:text-blue-700 px-1.5"
            onClick={handleAddSns}
          >
            <Plus className="h-3 w-3 mr-0.5" />
            추가
          </Button>
        </div>
        <div className="space-y-1">
          {form.snsAccounts.map((sns, idx) => (
            <SnsRow
              key={idx}
              item={sns}
              onChange={(updated) => handleSnsChange(idx, updated)}
              onRemove={() => handleSnsRemove(idx)}
            />
          ))}
          {form.snsAccounts.length === 0 && (
            <p className="text-[10px] text-gray-400 italic">SNS 계정이 없습니다.</p>
          )}
        </div>
      </div>

      {/* 만남 정보 */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <p className="text-[10px] font-medium text-gray-500">만남 장소</p>
          <Input
            className="h-7 text-xs"
            placeholder="공연장, 스튜디오 등"
            value={form.metAt}
            onChange={(e) => set("metAt", e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-medium text-gray-500">만난 날짜</p>
          <Input
            type="date"
            className="h-7 text-xs"
            value={form.metDate}
            onChange={(e) => set("metDate", e.target.value)}
          />
        </div>
      </div>

      {/* 메모 */}
      <div className="space-y-1">
        <p className="text-[10px] font-medium text-gray-500">메모</p>
        <Textarea
          className="text-xs min-h-[56px] resize-none"
          placeholder="특이사항, 협업 경험, 인상 등..."
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
        />
      </div>

      {/* 버튼 */}
      <div className="flex gap-2 pt-1">
        <Button
          size="sm"
          className="h-7 text-xs flex-1"
          onClick={handleSubmit}
        >
          <Check className="h-3 w-3 mr-1" />
          {submitLabel}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={onCancel}
        >
          취소
        </Button>
      </div>
    </div>
  );
}

// ============================================
// 연락처 카드 (단일 항목)
// ============================================

function EntryCard({
  entry,
  onEdit,
  onDelete,
  onToggleFavorite,
}: {
  entry: DanceNetworkingEntry;
  onEdit: (entry: DanceNetworkingEntry) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <div className="border rounded-md bg-card overflow-hidden">
        {/* 헤더 행 */}
        <div className="flex items-center gap-2 px-3 py-2">
          {/* 즐겨찾기 버튼 */}
          <button
            type="button"
            className={cn(
              "shrink-0 transition-colors",
              entry.isFavorite
                ? "text-yellow-400 hover:text-yellow-500"
                : "text-gray-300 hover:text-yellow-400"
            )}
            onClick={() => onToggleFavorite(entry.id)}
            aria-label={entry.isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
          >
            <Star className="h-3.5 w-3.5 fill-current" />
          </button>

          {/* 이름 + 역할 배지 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-medium text-gray-900 truncate">
                {entry.name}
              </span>
              <Badge
                className={cn(
                  "text-[10px] px-1.5 py-0 border-0",
                  ROLE_COLOR[entry.role]
                )}
              >
                {ROLE_LABEL[entry.role]}
              </Badge>
            </div>
            {entry.affiliation && (
              <p className="text-[10px] text-gray-500 truncate mt-0.5">
                {entry.affiliation}
              </p>
            )}
          </div>

          {/* 장르 태그 (최대 2개) */}
          {entry.genres.length > 0 && (
            <div className="hidden sm:flex gap-1 shrink-0">
              {entry.genres.slice(0, 2).map((g) => (
                <Badge
                  key={g}
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 text-gray-600"
                >
                  {g}
                </Badge>
              ))}
              {entry.genres.length > 2 && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 text-gray-400"
                >
                  +{entry.genres.length - 2}
                </Badge>
              )}
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="flex items-center gap-0.5 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-gray-400 hover:text-blue-600"
              onClick={() => onEdit(entry)}
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
              onClick={() => onDelete(entry.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-gray-400"
              >
                {expanded ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>

        {/* 펼침 상세 */}
        <CollapsibleContent>
          <div className="px-3 pb-3 pt-1 border-t border-gray-100 space-y-2">
            {/* 장르 */}
            {entry.genres.length > 0 && (
              <div className="flex items-start gap-1.5">
                <Music className="h-3 w-3 text-gray-400 mt-0.5 shrink-0" />
                <div className="flex flex-wrap gap-1">
                  {entry.genres.map((g) => (
                    <Badge
                      key={g}
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0"
                    >
                      {g}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* 연락처 */}
            {entry.phone && (
              <div className="flex items-center gap-1.5">
                <Phone className="h-3 w-3 text-gray-400 shrink-0" />
                <span className="text-xs text-gray-700">{entry.phone}</span>
              </div>
            )}
            {entry.email && (
              <div className="flex items-center gap-1.5">
                <Mail className="h-3 w-3 text-gray-400 shrink-0" />
                <span className="text-xs text-gray-700">{entry.email}</span>
              </div>
            )}

            {/* SNS */}
            {entry.snsAccounts.length > 0 && (
              <div className="space-y-1">
                {entry.snsAccounts.map((sns, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <ExternalLink className="h-3 w-3 text-gray-400 shrink-0" />
                    <span className="text-[10px] text-gray-500">
                      {SNS_PLATFORM_LABEL[sns.platform]}
                    </span>
                    <span className="text-xs text-blue-600">{sns.handle}</span>
                  </div>
                ))}
              </div>
            )}

            {/* 만남 정보 */}
            {(entry.metAt || entry.metDate) && (
              <div className="flex flex-wrap gap-3">
                {entry.metAt && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3 w-3 text-gray-400 shrink-0" />
                    <span className="text-xs text-gray-700">{entry.metAt}</span>
                  </div>
                )}
                {entry.metDate && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3 text-gray-400 shrink-0" />
                    <span className="text-xs text-gray-700">
                      {formatYearMonthDay(entry.metDate)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* 메모 */}
            {entry.notes && (
              <p className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-1.5 leading-relaxed">
                {entry.notes}
              </p>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// ============================================
// 메인 컴포넌트
// ============================================

export function DanceNetworkingCard({ memberId }: { memberId: string }) {
  const { entries, loading, addEntry, updateEntry, toggleFavorite, deleteEntry, stats } =
    useDanceNetworking(memberId);

  const [isOpen, setIsOpen] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<DanceNetworkingEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<DanceNetworkingRole | "all">("all");
  const [filterFavorite, setFilterFavorite] = useState(false);

  // 필터링
  const filtered = entries.filter((e) => {
    if (filterFavorite && !e.isFavorite) return false;
    if (filterRole !== "all" && e.role !== filterRole) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const inName = e.name.toLowerCase().includes(q);
      const inAffil = e.affiliation?.toLowerCase().includes(q) ?? false;
      const inGenres = e.genres.some((g) => g.toLowerCase().includes(q));
      const inNotes = e.notes?.toLowerCase().includes(q) ?? false;
      if (!inName && !inAffil && !inGenres && !inNotes) return false;
    }
    return true;
  });

  const handleAdd = useCallback(
    (form: FormState) => {
      addEntry({
        name: form.name,
        affiliation: form.affiliation || undefined,
        genres: form.genres,
        phone: form.phone || undefined,
        email: form.email || undefined,
        snsAccounts: form.snsAccounts,
        metAt: form.metAt || undefined,
        metDate: form.metDate || undefined,
        role: form.role,
        notes: form.notes || undefined,
      });
      toast.success(`${form.name}님의 연락처를 추가했습니다.`);
      setShowForm(false);
    },
    [addEntry]
  );

  const handleEdit = useCallback(
    (form: FormState) => {
      if (!editTarget) return;
      updateEntry(editTarget.id, {
        name: form.name,
        affiliation: form.affiliation || undefined,
        genres: form.genres,
        phone: form.phone || undefined,
        email: form.email || undefined,
        snsAccounts: form.snsAccounts,
        metAt: form.metAt || undefined,
        metDate: form.metDate || undefined,
        role: form.role,
        notes: form.notes || undefined,
      });
      toast.success(TOAST.MEMBERS.NETWORKING_CONTACT_UPDATED);
      setEditTarget(null);
    },
    [editTarget, updateEntry]
  );

  const handleDelete = useCallback(
    (id: string) => {
      const entry = entries.find((e) => e.id === id);
      if (!entry) return;
      deleteEntry(id);
      toast.success(`${entry.name}님의 연락처를 삭제했습니다.`);
    },
    [entries, deleteEntry]
  );

  const handleToggleFavorite = useCallback(
    (id: string) => {
      const entry = entries.find((e) => e.id === id);
      if (!entry) return;
      toggleFavorite(id);
      toast.success(
        entry.isFavorite ? "즐겨찾기를 해제했습니다." : "즐겨찾기에 추가했습니다."
      );
    },
    [entries, toggleFavorite]
  );

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
          <div className="flex items-center gap-2">
            <BookUser className="h-4 w-4 text-indigo-500" />
            <span className="text-sm font-semibold text-gray-800">
              댄스 네트워킹 연락처
            </span>
            <Badge className="text-[10px] px-1.5 py-0 bg-indigo-100 text-indigo-700 border-0">
              {stats.total}명
            </Badge>
            {stats.favorites > 0 && (
              <Badge className="text-[10px] px-1.5 py-0 bg-yellow-100 text-yellow-700 border-0">
                <Star className="h-2.5 w-2.5 mr-0.5 fill-current" />
                {stats.favorites}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {!showForm && !editTarget && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => setShowForm(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                추가
              </Button>
            )}
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                {isOpen ? (
                  <ChevronUp className="h-3.5 w-3.5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>

        <CollapsibleContent>
          <div className="p-4 space-y-3">
            {/* 추가 폼 */}
            {showForm && (
              <div className="border rounded-lg p-3 bg-blue-50/40 space-y-1">
                <p className="text-xs font-semibold text-blue-700">새 연락처 추가</p>
                <ContactForm
                  initial={makeEmptyForm()}
                  onSubmit={handleAdd}
                  onCancel={() => setShowForm(false)}
                  submitLabel="추가"
                />
              </div>
            )}

            {/* 수정 폼 */}
            {editTarget && (
              <div className="border rounded-lg p-3 bg-orange-50/40 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-orange-700">
                    연락처 수정: {editTarget.name}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-gray-400"
                    onClick={() => setEditTarget(null)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <ContactForm
                  initial={entryToForm(editTarget)}
                  onSubmit={handleEdit}
                  onCancel={() => setEditTarget(null)}
                  submitLabel="저장"
                />
              </div>
            )}

            {/* 검색 + 필터 */}
            {entries.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <div className="relative flex-1 min-w-[160px]">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                  <Input
                    className="h-7 text-xs pl-6"
                    placeholder="이름, 소속, 장르로 검색"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => setSearchQuery("")}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <Select
                  value={filterRole}
                  onValueChange={(v) =>
                    setFilterRole(v as DanceNetworkingRole | "all")
                  }
                >
                  <SelectTrigger className="h-7 text-xs w-28">
                    <SelectValue placeholder="전체" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">
                      전체 역할
                    </SelectItem>
                    {ROLE_OPTIONS.map((opt) => (
                      <SelectItem
                        key={opt.value}
                        value={opt.value}
                        className="text-xs"
                      >
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant={filterFavorite ? "default" : "outline"}
                  className={cn(
                    "h-7 text-xs",
                    filterFavorite && "bg-yellow-400 hover:bg-yellow-500 text-white border-yellow-400"
                  )}
                  onClick={() => setFilterFavorite((prev) => !prev)}
                >
                  <Star className="h-3 w-3 mr-1 fill-current" />
                  즐겨찾기
                </Button>
              </div>
            )}

            {/* 통계 요약 */}
            {entries.length > 0 && Object.keys(stats.roleCount).length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {(Object.entries(stats.roleCount) as [DanceNetworkingRole, number][])
                  .sort((a, b) => b[1] - a[1])
                  .map(([role, count]) => (
                    <Badge
                      key={role}
                      className={cn(
                        "text-[10px] px-1.5 py-0 border-0 cursor-pointer",
                        filterRole === role
                          ? "ring-1 ring-offset-1 ring-current"
                          : "",
                        ROLE_COLOR[role]
                      )}
                      onClick={() =>
                        setFilterRole((prev) => (prev === role ? "all" : role))
                      }
                    >
                      {ROLE_LABEL[role]} {count}
                    </Badge>
                  ))}
              </div>
            )}

            {/* 목록 */}
            {loading ? (
              <div className="flex justify-center py-6">
                <span className="text-xs text-gray-400">불러오는 중...</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400 gap-2">
                <Users className="h-8 w-8 opacity-30" />
                {entries.length === 0 ? (
                  <>
                    <p className="text-xs">아직 등록된 연락처가 없습니다.</p>
                    <p className="text-[10px] text-gray-300">
                      댄스 씬에서 만난 사람들을 추가해보세요!
                    </p>
                  </>
                ) : (
                  <p className="text-xs">검색 결과가 없습니다.</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((entry) => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    onEdit={(e) => {
                      setShowForm(false);
                      setEditTarget(e);
                    }}
                    onDelete={handleDelete}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </div>
            )}

            {/* 결과 카운트 */}
            {filtered.length > 0 && entries.length !== filtered.length && (
              <p className="text-[10px] text-gray-400 text-center">
                전체 {entries.length}명 중 {filtered.length}명 표시
              </p>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
