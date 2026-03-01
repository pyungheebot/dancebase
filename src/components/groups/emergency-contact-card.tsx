"use client";

import { useState } from "react";
import { useAsyncAction } from "@/hooks/use-async-action";
import {
  Phone,
  Plus,
  Pencil,
  Trash2,
  User,
  Heart,
  Shield,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Loader2,
  X,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  useEmergencyContact,
  type AddEmergencyContactInput,
} from "@/hooks/use-emergency-contact";
import { formatYearMonthDay } from "@/lib/date-utils";
import type {
  EmergencyContactEntry,
  EmergencyContactBloodType,
  EmergencyContactRelation,
} from "@/types";

// ============================================================
// 상수 및 레이블 맵
// ============================================================

const RELATION_LABELS: Record<EmergencyContactRelation, string> = {
  parent: "부모",
  spouse: "배우자",
  sibling: "형제/자매",
  friend: "친구",
  guardian: "보호자",
  other: "기타",
};

const RELATION_COLORS: Record<EmergencyContactRelation, string> = {
  parent: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  spouse: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  sibling: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  friend: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  guardian: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  other: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

const BLOOD_TYPE_OPTIONS: EmergencyContactBloodType[] = [
  "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "unknown",
];

const BLOOD_TYPE_LABELS: Record<EmergencyContactBloodType, string> = {
  "A+": "A+",
  "A-": "A-",
  "B+": "B+",
  "B-": "B-",
  "AB+": "AB+",
  "AB-": "AB-",
  "O+": "O+",
  "O-": "O-",
  unknown: "모름",
};

const BLOOD_TYPE_COLORS: Record<EmergencyContactBloodType, string> = {
  "A+": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  "A-": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  "B+": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "B-": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "AB+": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  "AB-": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  "O+": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  "O-": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  unknown: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

const DEFAULT_FORM: AddEmergencyContactInput = {
  memberName: "",
  memberPhone: "",
  contactName: "",
  relation: "parent",
  phone: "",
  email: "",
  notes: "",
  bloodType: "unknown",
  allergies: "",
  medicalNotes: "",
  insuranceInfo: "",
  extraContacts: [],
};

// ============================================================
// 연락처 폼 컴포넌트
// ============================================================

type ContactFormProps = {
  value: AddEmergencyContactInput;
  onChange: (v: AddEmergencyContactInput) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitting: boolean;
  submitLabel: string;
};

function ContactForm({
  value,
  onChange,
  onSubmit,
  onCancel,
  submitting,
  submitLabel,
}: ContactFormProps) {
  const set = <K extends keyof AddEmergencyContactInput>(
    key: K,
    val: AddEmergencyContactInput[K]
  ) => onChange({ ...value, [key]: val });

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
      {/* 멤버 정보 */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          멤버 정보
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">
              멤버 이름 <span className="text-red-400">*</span>
            </Label>
            <Input
              className="h-7 text-xs"
              placeholder="홍길동"
              value={value.memberName}
              onChange={(e) => set("memberName", e.target.value)}
            />
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">
              본인 연락처
            </Label>
            <Input
              className="h-7 text-xs"
              placeholder="010-0000-0000"
              value={value.memberPhone ?? ""}
              onChange={(e) => set("memberPhone", e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">
              혈액형
            </Label>
            <Select
              value={value.bloodType}
              onValueChange={(v) =>
                set("bloodType", v as EmergencyContactBloodType)
              }
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BLOOD_TYPE_OPTIONS.map((bt) => (
                  <SelectItem key={bt} value={bt} className="text-xs">
                    {BLOOD_TYPE_LABELS[bt]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* 대표 긴급 연락처 */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          대표 긴급 연락처 <span className="text-red-400">*</span>
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">
              이름
            </Label>
            <Input
              className="h-7 text-xs"
              placeholder="홍부모"
              value={value.contactName}
              onChange={(e) => set("contactName", e.target.value)}
            />
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">
              관계
            </Label>
            <Select
              value={value.relation}
              onValueChange={(v) =>
                set("relation", v as EmergencyContactRelation)
              }
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(
                  Object.keys(RELATION_LABELS) as EmergencyContactRelation[]
                ).map((rel) => (
                  <SelectItem key={rel} value={rel} className="text-xs">
                    {RELATION_LABELS[rel]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">
              전화번호 <span className="text-red-400">*</span>
            </Label>
            <Input
              className="h-7 text-xs"
              placeholder="010-0000-0000"
              value={value.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">
              이메일
            </Label>
            <Input
              className="h-7 text-xs"
              placeholder="example@email.com"
              value={value.email ?? ""}
              onChange={(e) => set("email", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* 의료 정보 */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          의료 정보
        </p>
        <div>
          <Label className="text-[10px] text-muted-foreground mb-1 block">
            알레르기/질환
          </Label>
          <Input
            className="h-7 text-xs"
            placeholder="땅콩 알레르기, 천식 등"
            value={value.allergies ?? ""}
            onChange={(e) => set("allergies", e.target.value)}
          />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground mb-1 block">
            의료 특이사항
          </Label>
          <Textarea
            className="text-xs min-h-[52px] resize-none"
            placeholder="복용 약물, 수술 이력 등"
            value={value.medicalNotes ?? ""}
            onChange={(e) => set("medicalNotes", e.target.value)}
          />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground mb-1 block">
            보험 정보
          </Label>
          <Input
            className="h-7 text-xs"
            placeholder="보험사, 증권번호 등"
            value={value.insuranceInfo ?? ""}
            onChange={(e) => set("insuranceInfo", e.target.value)}
          />
        </div>
      </div>

      {/* 메모 */}
      <div>
        <Label className="text-[10px] text-muted-foreground mb-1 block">
          메모
        </Label>
        <Textarea
          className="text-xs min-h-[40px] resize-none"
          placeholder="기타 참고사항"
          value={value.notes ?? ""}
          onChange={(e) => set("notes", e.target.value)}
        />
      </div>

      {/* 버튼 */}
      <div className="flex justify-end gap-2 pt-1">
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs"
          onClick={onCancel}
          disabled={submitting}
        >
          취소
        </Button>
        <Button
          size="sm"
          className="h-7 text-xs"
          onClick={onSubmit}
          disabled={submitting}
        >
          {submitting && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// 연락처 카드 아이템 컴포넌트
// ============================================================

type EntryCardProps = {
  entry: EmergencyContactEntry;
  onEdit: () => void;
  onDelete: () => void;
};

function EntryCard({ entry, onEdit, onDelete }: EntryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const hasMedical = !!(entry.allergies || entry.medicalNotes);

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* 헤더 */}
      <div className="flex items-start gap-2 p-3">
        {/* 멤버 아이콘 */}
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
          <User className="h-4 w-4 text-primary" />
        </div>

        {/* 멤버 정보 */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-semibold">{entry.memberName}</span>
            {entry.bloodType !== "unknown" && (
              <Badge
                className={`text-[10px] px-1.5 py-0 ${BLOOD_TYPE_COLORS[entry.bloodType]}`}
              >
                {BLOOD_TYPE_LABELS[entry.bloodType]}
              </Badge>
            )}
            {hasMedical && (
              <Badge className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                의료
              </Badge>
            )}
            {entry.insuranceInfo && (
              <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                <Shield className="h-2.5 w-2.5 mr-0.5" />
                보험
              </Badge>
            )}
          </div>
          {entry.memberPhone && (
            <p className="mt-0.5 text-[11px] text-muted-foreground flex items-center gap-1">
              <Phone className="h-2.5 w-2.5" />
              {entry.memberPhone}
            </p>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            onClick={onEdit}
          >
            <Pencil className="h-3 w-3" />
          </Button>
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

      {/* 대표 긴급 연락처 요약 */}
      <div className="border-t border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <Phone className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          <span className="text-xs font-medium">{entry.contactName}</span>
          <Badge
            className={`text-[10px] px-1.5 py-0 ${RELATION_COLORS[entry.relation]}`}
          >
            {RELATION_LABELS[entry.relation]}
          </Badge>
          <span className="text-xs text-muted-foreground ml-auto">
            {entry.phone}
          </span>
        </div>
      </div>

      {/* 확장 영역 */}
      {expanded && (
        <div className="border-t border-border px-3 py-2 space-y-2.5">
          {/* 이메일 */}
          {entry.email && (
            <div>
              <p className="text-[10px] text-muted-foreground font-medium mb-0.5">
                이메일
              </p>
              <p className="text-xs">{entry.email}</p>
            </div>
          )}

          {/* 의료 정보 */}
          {(entry.allergies || entry.medicalNotes) && (
            <div className="rounded-md bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 p-2">
              <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 mb-1 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                의료 정보
              </p>
              {entry.allergies && (
                <div className="mb-1">
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                    알레르기/질환
                  </p>
                  <p className="text-xs text-amber-800 dark:text-amber-200">
                    {entry.allergies}
                  </p>
                </div>
              )}
              {entry.medicalNotes && (
                <div>
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                    의료 특이사항
                  </p>
                  <p className="text-xs text-amber-800 dark:text-amber-200 whitespace-pre-wrap">
                    {entry.medicalNotes}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 보험 정보 */}
          {entry.insuranceInfo && (
            <div>
              <p className="text-[10px] text-muted-foreground font-medium mb-0.5 flex items-center gap-1">
                <Shield className="h-3 w-3" />
                보험 정보
              </p>
              <p className="text-xs">{entry.insuranceInfo}</p>
            </div>
          )}

          {/* 추가 긴급 연락처 */}
          {entry.extraContacts && entry.extraContacts.length > 0 && (
            <div>
              <p className="text-[10px] text-muted-foreground font-medium mb-1">
                추가 긴급 연락처
              </p>
              <div className="space-y-1">
                {entry.extraContacts.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-2 rounded border border-border bg-muted/30 px-2 py-1"
                  >
                    <span className="text-xs font-medium">{c.name}</span>
                    <Badge
                      className={`text-[10px] px-1.5 py-0 ${RELATION_COLORS[c.relation]}`}
                    >
                      {RELATION_LABELS[c.relation]}
                    </Badge>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {c.phone}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 메모 */}
          {entry.notes && (
            <div>
              <p className="text-[10px] text-muted-foreground font-medium mb-0.5">
                메모
              </p>
              <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                {entry.notes}
              </p>
            </div>
          )}

          {/* 등록일 */}
          <p className="text-[10px] text-muted-foreground/60">
            등록일: {formatYearMonthDay(entry.createdAt)}
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================
// 메인 컴포넌트
// ============================================================

type Props = {
  groupId: string;
};

export function EmergencyContactCard({ groupId }: Props) {
  const { entries, loading, addContact, updateContact, deleteContact, stats } =
    useEmergencyContact(groupId);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AddEmergencyContactInput>(DEFAULT_FORM);
  const { pending: submitting, execute } = useAsyncAction();
  const [filterBlood, setFilterBlood] = useState<EmergencyContactBloodType | "all">("all");
  const [filterMedical, setFilterMedical] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // ── 필터 적용 ──
  const filteredEntries = entries.filter((e) => {
    if (filterBlood !== "all" && e.bloodType !== filterBlood) return false;
    if (filterMedical && !e.allergies && !e.medicalNotes) return false;
    if (
      searchQuery.trim() &&
      !e.memberName.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !e.contactName.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  // ── 추가 처리 ──
  const handleAdd = async () => {
    await execute(async () => {
      const ok = await addContact(form);
      if (ok) {
        setForm(DEFAULT_FORM);
        setShowForm(false);
      }
    });
  };

  // ── 수정 처리 ──
  const handleStartEdit = (entry: EmergencyContactEntry) => {
    setEditingId(entry.id);
    setForm({
      memberName: entry.memberName,
      memberPhone: entry.memberPhone ?? "",
      contactName: entry.contactName,
      relation: entry.relation,
      phone: entry.phone,
      email: entry.email ?? "",
      notes: entry.notes ?? "",
      bloodType: entry.bloodType,
      allergies: entry.allergies ?? "",
      medicalNotes: entry.medicalNotes ?? "",
      insuranceInfo: entry.insuranceInfo ?? "",
      extraContacts: entry.extraContacts?.map((c) => ({
        name: c.name,
        relation: c.relation,
        phone: c.phone,
        note: c.note,
      })) ?? [],
    });
    setShowForm(false);
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    await execute(async () => {
      const ok = await updateContact(editingId, form);
      if (ok) {
        setEditingId(null);
        setForm(DEFAULT_FORM);
      }
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(DEFAULT_FORM);
  };

  // ── 삭제 처리 ──
  const handleDelete = async (id: string) => {
    await deleteContact(id);
  };

  const hasActiveFilter =
    filterBlood !== "all" || filterMedical || searchQuery.trim() !== "";

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-red-500" />
            <CardTitle className="text-sm font-semibold">긴급 연락망</CardTitle>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => {
              setShowForm((v) => !v);
              setEditingId(null);
              setForm(DEFAULT_FORM);
            }}
          >
            {showForm ? (
              <>
                <X className="h-3 w-3 mr-1" />
                취소
              </>
            ) : (
              <>
                <Plus className="h-3 w-3 mr-1" />
                추가
              </>
            )}
          </Button>
        </div>

        {/* 통계 배지 */}
        <div className="flex flex-wrap gap-1.5 mt-1">
          <Badge className="text-[10px] px-1.5 py-0 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            전체 {stats.total}명
          </Badge>
          {stats.withMedical > 0 && (
            <Badge className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
              <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
              의료 {stats.withMedical}명
            </Badge>
          )}
          {stats.withInsurance > 0 && (
            <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
              <Shield className="h-2.5 w-2.5 mr-0.5" />
              보험 {stats.withInsurance}명
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* 추가 폼 */}
        {showForm && (
          <ContactForm
            value={form}
            onChange={setForm}
            onSubmit={handleAdd}
            onCancel={() => {
              setShowForm(false);
              setForm(DEFAULT_FORM);
            }}
            submitting={submitting}
            submitLabel="추가"
          />
        )}

        {/* 검색 및 필터 */}
        {entries.length > 0 && (
          <div className="space-y-2">
            {/* 검색 */}
            <Input
              className="h-7 text-xs"
              placeholder="이름으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            {/* 필터 */}
            <div className="flex flex-wrap items-center gap-1.5">
              <Filter className="h-3 w-3 text-muted-foreground" />

              {/* 혈액형 필터 */}
              <Select
                value={filterBlood}
                onValueChange={(v) =>
                  setFilterBlood(v as EmergencyContactBloodType | "all")
                }
              >
                <SelectTrigger className="h-6 text-[10px] w-24 px-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">
                    혈액형 전체
                  </SelectItem>
                  {BLOOD_TYPE_OPTIONS.map((bt) => (
                    <SelectItem key={bt} value={bt} className="text-xs">
                      {BLOOD_TYPE_LABELS[bt]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* 의료 정보 필터 */}
              <Button
                size="sm"
                variant={filterMedical ? "default" : "outline"}
                className="h-6 text-[10px] px-2"
                onClick={() => setFilterMedical((v) => !v)}
              >
                <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                의료정보 있음
              </Button>

              {/* 필터 초기화 */}
              {hasActiveFilter && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 text-[10px] px-2 text-muted-foreground"
                  onClick={() => {
                    setFilterBlood("all");
                    setFilterMedical(false);
                    setSearchQuery("");
                  }}
                >
                  <X className="h-2.5 w-2.5 mr-0.5" />
                  초기화
                </Button>
              )}
            </div>
          </div>
        )}

        {/* 로딩 */}
        {loading && (
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span className="text-xs">불러오는 중...</span>
          </div>
        )}

        {/* 항목 목록 */}
        {!loading && filteredEntries.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Heart className="h-8 w-8 mb-2 opacity-20" />
            <p className="text-xs">
              {entries.length === 0
                ? "등록된 긴급 연락처가 없습니다"
                : "조건에 맞는 연락처가 없습니다"}
            </p>
            {entries.length === 0 && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs mt-2"
                onClick={() => setShowForm(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                첫 연락처 추가
              </Button>
            )}
          </div>
        )}

        {!loading && (
          <div className="space-y-2">
            {filteredEntries.map((entry) => (
              <div key={entry.id}>
                {editingId === entry.id ? (
                  <ContactForm
                    value={form}
                    onChange={setForm}
                    onSubmit={handleUpdate}
                    onCancel={handleCancelEdit}
                    submitting={submitting}
                    submitLabel="저장"
                  />
                ) : (
                  <EntryCard
                    entry={entry}
                    onEdit={() => handleStartEdit(entry)}
                    onDelete={() => handleDelete(entry.id)}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
