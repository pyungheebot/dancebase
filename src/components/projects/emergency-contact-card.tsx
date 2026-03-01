"use client";

import { useState, useMemo } from "react";
import { useAsyncAction } from "@/hooks/use-async-action";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Pencil,
  Phone,
  Mail,
  Search,
  AlertTriangle,
  Users,
  Shield,
  BarChart2,
} from "lucide-react";
import { toast } from "sonner";
import { useShowEmergencyContact } from "@/hooks/use-show-emergency-contact";
import type {
  EmergencyContact,
  EmergencyContactRole,
  EmergencyContactPriority,
} from "@/types";

// ============================================================
// 상수
// ============================================================

const ROLES: EmergencyContactRole[] = [
  "총감독",
  "무대감독",
  "음향감독",
  "조명감독",
  "의료진",
  "보안",
  "기타",
];

const ROLE_COLORS: Record<EmergencyContactRole, string> = {
  총감독: "bg-purple-100 text-purple-700 border-purple-200",
  무대감독: "bg-blue-100 text-blue-700 border-blue-200",
  음향감독: "bg-cyan-100 text-cyan-700 border-cyan-200",
  조명감독: "bg-yellow-100 text-yellow-700 border-yellow-200",
  의료진: "bg-red-100 text-red-700 border-red-200",
  보안: "bg-orange-100 text-orange-700 border-orange-200",
  기타: "bg-gray-100 text-gray-600 border-gray-200",
};

const PRIORITY_COLORS: Record<EmergencyContactPriority, string> = {
  1: "bg-red-500 text-white",
  2: "bg-orange-400 text-white",
  3: "bg-yellow-400 text-gray-800",
};

const PRIORITY_LABELS: Record<EmergencyContactPriority, string> = {
  1: "1순위",
  2: "2순위",
  3: "3순위",
};

// ============================================================
// 빈 폼 상태
// ============================================================

type FormState = {
  name: string;
  role: EmergencyContactRole;
  phone: string;
  email: string;
  note: string;
  priority: EmergencyContactPriority;
};

const DEFAULT_FORM: FormState = {
  name: "",
  role: "기타",
  phone: "",
  email: "",
  note: "",
  priority: 3,
};

// ============================================================
// 서브 컴포넌트: 연락처 카드 행
// ============================================================

function ContactRow({
  contact,
  onEdit,
  onDelete,
}: {
  contact: EmergencyContact;
  onEdit: (contact: EmergencyContact) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex items-start gap-2 p-2.5 rounded-lg border bg-white hover:bg-gray-50 transition-colors">
      {/* 긴급도 배지 */}
      <span
        className={`shrink-0 mt-0.5 text-[10px] font-bold px-1.5 py-0 rounded ${PRIORITY_COLORS[contact.priority]}`}
      >
        {PRIORITY_LABELS[contact.priority]}
      </span>

      {/* 이름 & 역할 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-medium text-gray-900 truncate">
            {contact.name}
          </span>
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 ${ROLE_COLORS[contact.role]}`}
          >
            {contact.role}
          </Badge>
        </div>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          <a
            href={`tel:${contact.phone}`}
            className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
          >
            <Phone className="h-3 w-3" />
            {contact.phone}
          </a>
          {contact.email && (
            <a
              href={`mailto:${contact.email}`}
              className="flex items-center gap-1 text-xs text-gray-500 hover:underline"
            >
              <Mail className="h-3 w-3" />
              {contact.email}
            </a>
          )}
        </div>
        {contact.note && (
          <p className="text-[11px] text-gray-400 mt-0.5 truncate">
            {contact.note}
          </p>
        )}
      </div>

      {/* 액션 버튼 */}
      <div className="flex items-center gap-1 shrink-0">
        <a href={`tel:${contact.phone}`}>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
            title="전화 걸기"
          >
            <Phone className="h-3 w-3" />
          </Button>
        </a>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
          onClick={() => onEdit(contact)}
          title="수정"
        >
          <Pencil className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
          onClick={() => onDelete(contact.id)}
          title="삭제"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// 서브 컴포넌트: 역할 그룹 섹션
// ============================================================

function RoleGroup({
  role,
  contacts,
  onEdit,
  onDelete,
}: {
  role: EmergencyContactRole;
  contacts: EmergencyContact[];
  onEdit: (contact: EmergencyContact) => void;
  onDelete: (id: string) => void;
}) {
  if (contacts.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <Badge
          variant="outline"
          className={`text-[10px] px-1.5 py-0 ${ROLE_COLORS[role]}`}
        >
          {role}
        </Badge>
        <span className="text-[10px] text-gray-400">{contacts.length}명</span>
      </div>
      <div className="space-y-1.5">
        {contacts
          .sort((a, b) => a.priority - b.priority)
          .map((c) => (
            <ContactRow
              key={c.id}
              contact={c}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
      </div>
    </div>
  );
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export function EmergencyContactCard({ projectId }: { projectId: string }) {
  const { data, loading, addContact, updateContact, deleteContact, stats } =
    useShowEmergencyContact(projectId);

  const [isOpen, setIsOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContact, setEditingContact] =
    useState<EmergencyContact | null>(null);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const { pending: saving, execute } = useAsyncAction();

  // ── 검색 필터 ─────────────────────────────────────────────

  const filteredContacts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return data.contacts;
    return data.contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.email.toLowerCase().includes(q)
    );
  }, [data.contacts, searchQuery]);

  // ── 역할별 그룹핑 ─────────────────────────────────────────

  const groupedByRole = useMemo(() => {
    return ROLES.map((role) => ({
      role,
      contacts: filteredContacts.filter((c) => c.role === role),
    })).filter((g) => g.contacts.length > 0);
  }, [filteredContacts]);

  // ── 다이얼로그 열기 ───────────────────────────────────────

  function openAdd() {
    setEditingContact(null);
    setForm(DEFAULT_FORM);
    setDialogOpen(true);
  }

  function openEdit(contact: EmergencyContact) {
    setEditingContact(contact);
    setForm({
      name: contact.name,
      role: contact.role,
      phone: contact.phone,
      email: contact.email,
      note: contact.note,
      priority: contact.priority,
    });
    setDialogOpen(true);
  }

  // ── 저장 ──────────────────────────────────────────────────

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error("이름을 입력해주세요");
      return;
    }
    if (!form.phone.trim()) {
      toast.error("전화번호를 입력해주세요");
      return;
    }

    await execute(async () => {
      if (editingContact) {
        const ok = updateContact(editingContact.id, {
          name: form.name.trim(),
          role: form.role,
          phone: form.phone.trim(),
          email: form.email.trim(),
          note: form.note.trim(),
          priority: form.priority,
        });
        if (ok) {
          toast.success("연락처가 수정되었습니다");
        } else {
          toast.error("연락처를 찾을 수 없습니다");
        }
      } else {
        addContact({
          name: form.name.trim(),
          role: form.role,
          phone: form.phone.trim(),
          email: form.email.trim(),
          note: form.note.trim(),
          priority: form.priority,
        });
        toast.success("연락처가 추가되었습니다");
      }
      setDialogOpen(false);
    });
  }

  // ── 삭제 ──────────────────────────────────────────────────

  function handleDelete(contactId: string) {
    const ok = deleteContact(contactId);
    if (ok) {
      toast.success("연락처가 삭제되었습니다");
    } else {
      toast.error("삭제에 실패했습니다");
    }
  }

  // ── 렌더링 ────────────────────────────────────────────────

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card className="shadow-sm">
          <CardHeader className="pb-2 pt-3 px-4">
            <div className="flex items-center justify-between">
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <Shield className="h-4 w-4 text-red-500" />
                  <CardTitle className="text-sm font-semibold text-gray-800">
                    비상 연락망
                  </CardTitle>
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 bg-red-50 text-red-600"
                  >
                    {stats.total}명
                  </Badge>
                  {isOpen ? (
                    <ChevronUp className="h-3.5 w-3.5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                  )}
                </button>
              </CollapsibleTrigger>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={openAdd}
              >
                <Plus className="h-3 w-3 mr-1" />
                연락처 추가
              </Button>
            </div>

            {/* 통계 요약 */}
            {isOpen && stats.total > 0 && (
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <div className="flex items-center gap-1 text-[11px] text-gray-500">
                  <BarChart2 className="h-3 w-3" />
                  <span>총 {stats.total}명</span>
                </div>
                {([1, 2, 3] as EmergencyContactPriority[]).map((p) =>
                  stats.byPriority[p] > 0 ? (
                    <span
                      key={p}
                      className={`text-[10px] font-medium px-1.5 py-0 rounded ${PRIORITY_COLORS[p]}`}
                    >
                      {PRIORITY_LABELS[p]} {stats.byPriority[p]}명
                    </span>
                  ) : null
                )}
              </div>
            )}
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="px-4 pb-4 pt-0 space-y-3">
              {/* 검색 */}
              {stats.total > 0 && (
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <Input
                    className="pl-8 h-8 text-xs"
                    placeholder="이름, 역할, 전화번호로 검색"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              )}

              {/* 로딩 */}
              {loading && (
                <div className="text-center py-4 text-xs text-gray-400">
                  불러오는 중...
                </div>
              )}

              {/* 빈 상태 */}
              {!loading && stats.total === 0 && (
                <div className="text-center py-8 space-y-2">
                  <AlertTriangle className="h-8 w-8 text-gray-300 mx-auto" />
                  <p className="text-sm text-gray-400">
                    비상 연락처가 없습니다
                  </p>
                  <p className="text-xs text-gray-300">
                    공연 진행 시 필요한 긴급 연락처를 등록하세요
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 h-7 text-xs"
                    onClick={openAdd}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    첫 연락처 추가
                  </Button>
                </div>
              )}

              {/* 검색 결과 없음 */}
              {!loading && stats.total > 0 && filteredContacts.length === 0 && (
                <div className="text-center py-4 text-xs text-gray-400">
                  검색 결과가 없습니다
                </div>
              )}

              {/* 역할별 그룹 목록 */}
              {!loading && filteredContacts.length > 0 && (
                <div className="space-y-3">
                  {groupedByRole.map(({ role, contacts }) => (
                    <RoleGroup
                      key={role}
                      role={role}
                      contacts={contacts}
                      onEdit={openEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}

              {/* 역할별 배분 통계 */}
              {!loading && stats.total > 0 && (
                <div className="border-t pt-3 mt-2">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Users className="h-3 w-3 text-gray-400" />
                    <span className="text-[11px] text-gray-400 font-medium">
                      역할별 배분
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {ROLES.map((role) =>
                      stats.byRole[role] > 0 ? (
                        <span
                          key={role}
                          className={`text-[10px] px-1.5 py-0.5 rounded border ${ROLE_COLORS[role]}`}
                        >
                          {role} {stats.byRole[role]}
                        </span>
                      ) : null
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* 추가/수정 다이얼로그 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">
              {editingContact ? "연락처 수정" : "비상 연락처 추가"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-1">
            {/* 이름 */}
            <div className="space-y-1">
              <Label className="text-xs">
                이름 <span className="text-red-500">*</span>
              </Label>
              <Input
                className="h-8 text-xs"
                placeholder="담당자 이름"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>

            {/* 역할 & 긴급도 */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">역할</Label>
                <Select
                  value={form.role}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      role: v as EmergencyContactRole,
                    }))
                  }
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r} className="text-xs">
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">긴급도</Label>
                <Select
                  value={String(form.priority)}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      priority: Number(v) as EmergencyContactPriority,
                    }))
                  }
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {([1, 2, 3] as EmergencyContactPriority[]).map((p) => (
                      <SelectItem key={p} value={String(p)} className="text-xs">
                        {PRIORITY_LABELS[p]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 전화번호 */}
            <div className="space-y-1">
              <Label className="text-xs">
                전화번호 <span className="text-red-500">*</span>
              </Label>
              <Input
                className="h-8 text-xs"
                placeholder="010-0000-0000"
                type="tel"
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
              />
            </div>

            {/* 이메일 */}
            <div className="space-y-1">
              <Label className="text-xs">이메일 (선택)</Label>
              <Input
                className="h-8 text-xs"
                placeholder="example@email.com"
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
              />
            </div>

            {/* 비고 */}
            <div className="space-y-1">
              <Label className="text-xs">비고 (선택)</Label>
              <Textarea
                className="text-xs resize-none"
                rows={2}
                placeholder="추가 메모 사항"
                value={form.note}
                onChange={(e) =>
                  setForm((f) => ({ ...f, note: e.target.value }))
                }
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => setDialogOpen(false)}
            >
              취소
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={handleSave}
              disabled={saving}
            >
              {editingContact ? "저장" : "추가"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
