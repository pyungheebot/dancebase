"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Phone,
  Plus,
  Trash2,
  Pencil,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  User,
  Mail,
  Heart,
  AlertCircle,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { useEmergencyContact, type AddEmergencyContactInput } from "@/hooks/use-emergency-contact";
import type {
  EmergencyContactEntry,
  EmergencyContactRelation,
  EmergencyContactBloodType,
} from "@/types";

// ============================================
// 상수
// ============================================

const RELATION_LABELS: Record<EmergencyContactRelation, string> = {
  parent: "부모",
  spouse: "배우자",
  sibling: "형제자매",
  friend: "친구",
  guardian: "보호자",
  other: "기타",
};

const RELATION_COLORS: Record<EmergencyContactRelation, string> = {
  parent: "bg-blue-100 text-blue-700 border-blue-200",
  spouse: "bg-pink-100 text-pink-700 border-pink-200",
  sibling: "bg-green-100 text-green-700 border-green-200",
  friend: "bg-orange-100 text-orange-700 border-orange-200",
  guardian: "bg-violet-100 text-violet-700 border-violet-200",
  other: "bg-gray-100 text-gray-700 border-gray-200",
};

const BLOOD_TYPE_OPTIONS: EmergencyContactBloodType[] = [
  "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "unknown",
];

const BLOOD_TYPE_LABELS: Record<EmergencyContactBloodType, string> = {
  "A+": "A+", "A-": "A-", "B+": "B+", "B-": "B-",
  "AB+": "AB+", "AB-": "AB-", "O+": "O+", "O-": "O-",
  unknown: "모름",
};

// ============================================
// 빈 폼 상태
// ============================================

type FormState = {
  memberName: string;
  memberPhone: string;
  contactName: string;
  relation: EmergencyContactRelation;
  phone: string;
  email: string;
  notes: string;
  bloodType: EmergencyContactBloodType;
  allergies: string;
  medicalNotes: string;
  insuranceInfo: string;
};

const EMPTY_FORM: FormState = {
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
};

// ============================================
// 서브 컴포넌트: 의료 정보 섹션
// ============================================

function MedicalInfoSection({ entry }: { entry: EmergencyContactEntry }) {
  const [open, setOpen] = useState(false);
  const hasMedical = entry.bloodType !== "unknown" || entry.allergies || entry.medicalNotes;
  if (!hasMedical) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-[10px] px-1.5 text-muted-foreground gap-0.5 mt-1"
        >
          <Heart className="h-3 w-3" />
          의료 정보
          {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-1.5 rounded-md bg-muted/40 p-2 space-y-1 text-xs">
          {entry.bloodType !== "unknown" && (
            <div className="flex items-center gap-1.5">
              <Heart className="h-3 w-3 text-red-400 shrink-0" />
              <span className="text-muted-foreground">혈액형:</span>
              <span className="font-medium">{BLOOD_TYPE_LABELS[entry.bloodType]}</span>
            </div>
          )}
          {entry.allergies && (
            <div className="flex items-start gap-1.5">
              <AlertCircle className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
              <span className="text-muted-foreground shrink-0">알레르기:</span>
              <span className="font-medium break-all">{entry.allergies}</span>
            </div>
          )}
          {entry.medicalNotes && (
            <div className="flex items-start gap-1.5">
              <FileText className="h-3 w-3 text-blue-400 shrink-0 mt-0.5" />
              <span className="text-muted-foreground shrink-0">메모:</span>
              <span className="font-medium break-all">{entry.medicalNotes}</span>
            </div>
          )}
          {entry.insuranceInfo && (
            <div className="flex items-start gap-1.5">
              <FileText className="h-3 w-3 text-green-400 shrink-0 mt-0.5" />
              <span className="text-muted-foreground shrink-0">보험:</span>
              <span className="font-medium break-all">{entry.insuranceInfo}</span>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ============================================
// 서브 컴포넌트: 연락처 추가/수정 다이얼로그
// ============================================

type ContactDialogProps = {
  open: boolean;
  onClose: () => void;
  memberNames: string[];
  initial?: EmergencyContactEntry | null;
  onSubmit: (form: FormState) => void;
};

function ContactDialog({
  open,
  onClose,
  memberNames,
  initial,
  onSubmit,
}: ContactDialogProps) {
  const [form, setForm] = useState<FormState>(() =>
    initial
      ? {
          memberName: initial.memberName,
          memberPhone: initial.memberPhone ?? "",
          contactName: initial.contactName,
          relation: initial.relation,
          phone: initial.phone,
          email: initial.email ?? "",
          notes: initial.notes ?? "",
          bloodType: initial.bloodType,
          allergies: initial.allergies ?? "",
          medicalNotes: initial.medicalNotes ?? "",
          insuranceInfo: initial.insuranceInfo ?? "",
        }
      : EMPTY_FORM
  );

  const isEdit = !!initial;

  function handleChange(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.memberName) {
      toast.error("멤버를 선택해주세요.");
      return;
    }
    if (!form.contactName.trim()) {
      toast.error("연락처 이름을 입력해주세요.");
      return;
    }
    if (!form.phone.trim()) {
      toast.error("전화번호를 입력해주세요.");
      return;
    }
    onSubmit(form);
    setForm(EMPTY_FORM);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm">
            {isEdit ? "긴급 연락처 수정" : "긴급 연락처 추가"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 mt-2">
          {/* 멤버 선택 */}
          <div className="space-y-1">
            <Label className="text-xs">멤버 *</Label>
            <Select
              value={form.memberName}
              onValueChange={(v) => handleChange("memberName", v)}
              disabled={isEdit}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="멤버 선택" />
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

          {/* 본인 연락처 */}
          <div className="space-y-1">
            <Label className="text-xs">본인 연락처</Label>
            <Input
              value={form.memberPhone}
              onChange={(e) => handleChange("memberPhone", e.target.value)}
              placeholder="010-0000-0000"
              className="h-8 text-xs"
            />
          </div>

          {/* 연락처 이름 */}
          <div className="space-y-1">
            <Label className="text-xs">긴급 연락처 이름 *</Label>
            <Input
              value={form.contactName}
              onChange={(e) => handleChange("contactName", e.target.value)}
              placeholder="예: 홍길동 아버지"
              className="h-8 text-xs"
            />
          </div>

          {/* 관계 */}
          <div className="space-y-1">
            <Label className="text-xs">관계 *</Label>
            <Select
              value={form.relation}
              onValueChange={(v) => handleChange("relation", v as EmergencyContactRelation)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(RELATION_LABELS) as EmergencyContactRelation[]).map((rel) => (
                  <SelectItem key={rel} value={rel} className="text-xs">
                    {RELATION_LABELS[rel]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 전화번호 */}
          <div className="space-y-1">
            <Label className="text-xs">전화번호 *</Label>
            <Input
              value={form.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="010-0000-0000"
              className="h-8 text-xs"
            />
          </div>

          {/* 이메일 */}
          <div className="space-y-1">
            <Label className="text-xs">이메일</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="선택 입력"
              className="h-8 text-xs"
            />
          </div>

          {/* 메모 */}
          <div className="space-y-1">
            <Label className="text-xs">메모</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="추가 메모"
              className="text-xs min-h-[60px] resize-none"
            />
          </div>

          <div className="border-t pt-3">
            <p className="text-[10px] text-muted-foreground mb-2 font-medium">의료 정보 (선택)</p>

            {/* 혈액형 */}
            <div className="space-y-1 mb-2">
              <Label className="text-xs">혈액형</Label>
              <Select
                value={form.bloodType}
                onValueChange={(v) =>
                  handleChange("bloodType", v as EmergencyContactBloodType)
                }
              >
                <SelectTrigger className="h-8 text-xs">
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

            {/* 알레르기 */}
            <div className="space-y-1 mb-2">
              <Label className="text-xs">알레르기</Label>
              <Input
                value={form.allergies}
                onChange={(e) => handleChange("allergies", e.target.value)}
                placeholder="예: 땅콩, 복숭아"
                className="h-8 text-xs"
              />
            </div>

            {/* 의료 메모 */}
            <div className="space-y-1 mb-2">
              <Label className="text-xs">의료 메모</Label>
              <Textarea
                value={form.medicalNotes}
                onChange={(e) => handleChange("medicalNotes", e.target.value)}
                placeholder="지병, 복용 약물 등"
                className="text-xs min-h-[60px] resize-none"
              />
            </div>

            {/* 보험 정보 */}
            <div className="space-y-1">
              <Label className="text-xs">보험 정보</Label>
              <Input
                value={form.insuranceInfo}
                onChange={(e) => handleChange("insuranceInfo", e.target.value)}
                placeholder="보험사, 증권번호 등"
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={onClose}
            >
              취소
            </Button>
            <Button type="submit" size="sm" className="h-7 text-xs">
              {isEdit ? "수정" : "추가"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 메인 컴포넌트
// ============================================

type EmergencyContactCardProps = {
  groupId: string;
  memberNames: string[];
};

export function EmergencyContactCard({ groupId, memberNames }: EmergencyContactCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<EmergencyContactEntry | null>(null);
  const [expandedMembers, setExpandedMembers] = useState<Set<string>>(new Set());

  const {
    entries,
    addContact,
    updateContact,
    deleteContact,
  } = useEmergencyContact(groupId);

  // 멤버별 연락처 조회
  function getByMember(memberName: string): EmergencyContactEntry[] {
    return entries.filter((e) => e.memberName === memberName);
  }

  // 통계 파생
  const membersWithContacts = Array.from(
    new Set(entries.map((e) => e.memberName))
  ).filter((name) => memberNames.includes(name));

  const membersWithoutContacts = memberNames.filter(
    (name) => !entries.some((e) => e.memberName === name)
  );

  const totalContacts = entries.length;

  function toggleMember(name: string) {
    setExpandedMembers((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  async function handleAdd(form: FormState) {
    const input: AddEmergencyContactInput = {
      memberName: form.memberName,
      memberPhone: form.memberPhone || undefined,
      contactName: form.contactName,
      relation: form.relation,
      phone: form.phone,
      email: form.email || undefined,
      notes: form.notes || undefined,
      bloodType: form.bloodType,
      allergies: form.allergies || undefined,
      medicalNotes: form.medicalNotes || undefined,
      insuranceInfo: form.insuranceInfo || undefined,
    };
    await addContact(input);
  }

  async function handleUpdate(form: FormState) {
    if (!editTarget) return;
    await updateContact(editTarget.id, {
      memberPhone: form.memberPhone || undefined,
      contactName: form.contactName,
      relation: form.relation,
      phone: form.phone,
      email: form.email || undefined,
      notes: form.notes || undefined,
      bloodType: form.bloodType,
      allergies: form.allergies || undefined,
      medicalNotes: form.medicalNotes || undefined,
      insuranceInfo: form.insuranceInfo || undefined,
    });
    setEditTarget(null);
  }

  async function handleDelete(id: string) {
    await deleteContact(id);
  }

  function openEdit(entry: EmergencyContactEntry) {
    setEditTarget(entry);
    setDialogOpen(true);
  }

  function handleDialogClose() {
    setDialogOpen(false);
    setEditTarget(null);
  }

  return (
    <>
      <Card>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CardHeader className="pb-2">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer select-none">
                <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  긴급 연락처
                  <Badge className="text-[10px] px-1.5 py-0 ml-1">
                    {totalContacts}개
                  </Badge>
                </CardTitle>
                <div className="flex items-center gap-2">
                  {membersWithoutContacts.length > 0 && (
                    <div className="flex items-center gap-1 text-[10px] text-amber-600">
                      <AlertTriangle className="h-3 w-3" />
                      미등록 {membersWithoutContacts.length}명
                    </div>
                  )}
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            </CollapsibleTrigger>
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="pt-0 space-y-3">
              {/* 통계 요약 */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground bg-muted/40 rounded-md px-3 py-2">
                <span>
                  등록 <span className="font-semibold text-foreground">{membersWithContacts.length}</span>명
                </span>
                <span className="text-border">|</span>
                <span>
                  미등록 <span className="font-semibold text-amber-600">{membersWithoutContacts.length}</span>명
                </span>
                <span className="text-border">|</span>
                <span>
                  연락처 총 <span className="font-semibold text-foreground">{totalContacts}</span>개
                </span>
              </div>

              {/* 미등록 멤버 경고 */}
              {membersWithoutContacts.length > 0 && (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
                  <div className="flex items-center gap-1.5 mb-1">
                    <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                    <span className="text-[10px] font-medium text-amber-700">긴급 연락처 미등록 멤버</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {membersWithoutContacts.map((name) => (
                      <Badge
                        key={name}
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 border-amber-300 text-amber-700 bg-amber-50"
                      >
                        {name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* 멤버별 연락처 목록 */}
              {memberNames.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  멤버가 없습니다.
                </p>
              ) : (
                <div className="space-y-2">
                  {memberNames.map((memberName) => {
                    const memberEntries = getByMember(memberName);
                    const expanded = expandedMembers.has(memberName);

                    return (
                      <div
                        key={memberName}
                        className="rounded-md border bg-card"
                      >
                        {/* 멤버 헤더 */}
                        <div
                          className="flex items-center justify-between px-3 py-2 cursor-pointer"
                          onClick={() => toggleMember(memberName)}
                        >
                          <div className="flex items-center gap-1.5">
                            <User className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs font-medium">{memberName}</span>
                            {memberEntries.length > 0 ? (
                              <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 border-green-200">
                                {memberEntries.length}개
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 py-0 text-muted-foreground"
                              >
                                없음
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {expanded ? (
                              <ChevronUp className="h-3 w-3 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-3 w-3 text-muted-foreground" />
                            )}
                          </div>
                        </div>

                        {/* 연락처 상세 */}
                        {expanded && (
                          <div className="border-t px-3 py-2 space-y-2">
                            {memberEntries.length === 0 ? (
                              <p className="text-[10px] text-muted-foreground py-1">
                                등록된 연락처가 없습니다.
                              </p>
                            ) : (
                              memberEntries.map((entry) => (
                                <div
                                  key={entry.id}
                                  className="rounded-md bg-muted/30 px-2.5 py-2 space-y-1"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="space-y-0.5 min-w-0">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-xs font-medium">{entry.contactName}</span>
                                        <Badge
                                          variant="outline"
                                          className={`text-[10px] px-1.5 py-0 ${RELATION_COLORS[entry.relation]}`}
                                        >
                                          {RELATION_LABELS[entry.relation]}
                                        </Badge>
                                      </div>
                                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                        <Phone className="h-3 w-3" />
                                        <span>{entry.phone}</span>
                                      </div>
                                      {entry.email && (
                                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                          <Mail className="h-3 w-3" />
                                          <span className="truncate">{entry.email}</span>
                                        </div>
                                      )}
                                      {entry.notes && (
                                        <p className="text-[10px] text-muted-foreground italic">
                                          {entry.notes}
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0"
                                        onClick={() => openEdit(entry)}
                                      >
                                        <Pencil className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                        onClick={() => handleDelete(entry.id)}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                  <MedicalInfoSection entry={entry} />
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 추가 버튼 */}
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs w-full gap-1"
                onClick={() => {
                  setEditTarget(null);
                  setDialogOpen(true);
                }}
              >
                <Plus className="h-3 w-3" />
                긴급 연락처 추가
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* 다이얼로그 */}
      <ContactDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        memberNames={memberNames}
        initial={editTarget}
        onSubmit={editTarget ? handleUpdate : handleAdd}
      />
    </>
  );
}
