"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  FileCheck,
  PenLine,
  Shield,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Camera,
  Activity,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useWaiverManagement } from "@/hooks/use-waiver-management";
import type { WaiverType, WaiverTemplate, WaiverSignature } from "@/types";

// ─── 상수 ────────────────────────────────────────────────────────
const WAIVER_TYPE_META: Record<
  WaiverType,
  { label: string; color: string; icon: React.ReactNode }
> = {
  safety: {
    label: "안전 규칙",
    color: "bg-red-100 text-red-700",
    icon: <Shield className="h-3 w-3" />,
  },
  activity: {
    label: "활동 동의",
    color: "bg-blue-100 text-blue-700",
    icon: <Activity className="h-3 w-3" />,
  },
  photo: {
    label: "촬영 동의",
    color: "bg-pink-100 text-pink-700",
    icon: <Camera className="h-3 w-3" />,
  },
  liability: {
    label: "면책 동의",
    color: "bg-orange-100 text-orange-700",
    icon: <AlertCircle className="h-3 w-3" />,
  },
  custom: {
    label: "커스텀",
    color: "bg-purple-100 text-purple-700",
    icon: <FileText className="h-3 w-3" />,
  },
};

const WAIVER_TYPE_OPTIONS: WaiverType[] = [
  "safety",
  "activity",
  "photo",
  "liability",
  "custom",
];

// ─── 날짜 포맷 헬퍼 ──────────────────────────────────────────────
function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

// ─── 탭 타입 ─────────────────────────────────────────────────────
type Tab = "list" | "status" | "new";

// ─── 동의서 목록 탭 ───────────────────────────────────────────────
function WaiverListTab({
  templates,
  signatures,
  onDelete,
  onSelectForSign,
  isExpired,
  getSignedCount,
}: {
  templates: WaiverTemplate[];
  signatures: WaiverSignature[];
  onDelete: (id: string) => void;
  onSelectForSign: (template: WaiverTemplate) => void;
  isExpired: (expiresAt?: string) => boolean;
  getSignedCount: (waiverId: string) => number;
}) {
  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-1.5 py-8 text-gray-400">
        <FileCheck className="h-8 w-8 opacity-30" />
        <p className="text-xs">등록된 동의서가 없습니다.</p>
        <p className="text-[10px]">새 동의서 탭에서 추가하세요.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {templates.map((tpl) => {
        const meta = WAIVER_TYPE_META[tpl.type];
        const signedCount = getSignedCount(tpl.id);
        const totalSigned = signatures.filter((s) => s.waiverId === tpl.id).length;

        return (
          <div
            key={tpl.id}
            className="rounded-lg border border-gray-200 bg-gray-50 p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                {/* 제목 + 배지 */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-semibold text-gray-800 leading-tight">
                    {tpl.title}
                  </span>
                  <Badge
                    className={`flex items-center gap-0.5 text-[10px] px-1.5 py-0 ${meta.color} hover:${meta.color}`}
                  >
                    {meta.icon}
                    {meta.label}
                  </Badge>
                  {tpl.required ? (
                    <Badge className="bg-red-100 text-[10px] px-1.5 py-0 text-red-600 hover:bg-red-100">
                      필수
                    </Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-[10px] px-1.5 py-0 text-gray-500 hover:bg-gray-100">
                      선택
                    </Badge>
                  )}
                </div>

                {/* 본문 미리보기 */}
                <p className="line-clamp-2 text-[11px] text-gray-500 leading-relaxed">
                  {tpl.content}
                </p>

                {/* 서명 현황 + 유효기간 */}
                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                  <span className="flex items-center gap-1 text-[10px] text-gray-500">
                    <PenLine className="h-3 w-3" />
                    서명: {signedCount}명 (전체 {totalSigned}건)
                  </span>
                  {tpl.expiresInDays && (
                    <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                      <Clock className="h-3 w-3" />
                      유효 {tpl.expiresInDays}일
                    </span>
                  )}
                  <span className="text-[10px] text-gray-400">
                    등록 {formatDate(tpl.createdAt)}
                  </span>
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => onSelectForSign(tpl)}
                >
                  <PenLine className="mr-1 h-3 w-3" />
                  서명
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-gray-400 hover:text-red-500"
                  onClick={() => onDelete(tpl.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── 서명 현황 탭 ─────────────────────────────────────────────────
function SignatureStatusTab({
  templates,
  signatures,
  isExpired,
  onUnsign,
}: {
  templates: WaiverTemplate[];
  signatures: WaiverSignature[];
  isExpired: (expiresAt?: string) => boolean;
  onUnsign: (signatureId: string) => void;
}) {
  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-1.5 py-8 text-gray-400">
        <PenLine className="h-8 w-8 opacity-30" />
        <p className="text-xs">등록된 동의서가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {templates.map((tpl) => {
        const meta = WAIVER_TYPE_META[tpl.type];
        const tplSigs = signatures.filter((s) => s.waiverId === tpl.id);
        const validSigs = tplSigs.filter((s) => !isExpired(s.expiresAt));
        const expiredSigs = tplSigs.filter((s) => isExpired(s.expiresAt));

        return (
          <div
            key={tpl.id}
            className="rounded-lg border border-gray-200 bg-white p-3"
          >
            {/* 동의서 헤더 */}
            <div className="mb-2 flex items-center gap-1.5">
              <Badge
                className={`flex items-center gap-0.5 text-[10px] px-1.5 py-0 ${meta.color} hover:${meta.color}`}
              >
                {meta.icon}
                {meta.label}
              </Badge>
              <span className="text-xs font-semibold text-gray-800">
                {tpl.title}
              </span>
              <span className="ml-auto text-[10px] text-gray-500">
                유효 서명 {validSigs.length}명
              </span>
            </div>

            {/* 서명 목록 */}
            {tplSigs.length === 0 ? (
              <p className="text-[11px] text-gray-400 py-1">
                아직 서명한 멤버가 없습니다.
              </p>
            ) : (
              <div className="flex flex-col gap-1">
                {tplSigs.map((sig) => {
                  const expired = isExpired(sig.expiresAt);
                  return (
                    <div
                      key={sig.id}
                      className="flex items-center justify-between rounded-md bg-gray-50 px-2.5 py-1.5"
                    >
                      <div className="flex items-center gap-1.5">
                        {expired ? (
                          <XCircle className="h-3 w-3 text-red-400" />
                        ) : (
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                        )}
                        <span className="text-xs text-gray-700">
                          {sig.memberName}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {formatDate(sig.signedAt)}
                        </span>
                        {expired && (
                          <Badge className="bg-red-100 text-[10px] px-1 py-0 text-red-600 hover:bg-red-100">
                            만료
                          </Badge>
                        )}
                        {sig.expiresAt && !expired && (
                          <span className="text-[10px] text-gray-400">
                            (~{sig.expiresAt})
                          </span>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-5 px-1.5 text-[10px] text-gray-400 hover:text-red-500"
                        onClick={() => onUnsign(sig.id)}
                      >
                        취소
                      </Button>
                    </div>
                  );
                })}
                {expiredSigs.length > 0 && (
                  <p className="mt-1 text-[10px] text-orange-500 flex items-center gap-0.5">
                    <AlertCircle className="h-3 w-3" />
                    만료된 서명 {expiredSigs.length}건 — 재서명이 필요합니다.
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── 새 동의서 폼 탭 ─────────────────────────────────────────────
function NewWaiverTab({
  onSubmit,
}: {
  onSubmit: (input: {
    title: string;
    type: WaiverType;
    content: string;
    required: boolean;
    expiresInDays?: number;
  }) => void;
}) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<WaiverType>("safety");
  const [content, setContent] = useState("");
  const [required, setRequired] = useState(true);
  const [expiresInDays, setExpiresInDays] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("동의서 제목을 입력해주세요.");
      return;
    }
    if (!content.trim()) {
      toast.error("동의서 본문을 입력해주세요.");
      return;
    }
    const days = expiresInDays ? parseInt(expiresInDays, 10) : undefined;
    if (expiresInDays && (isNaN(days!) || days! <= 0)) {
      toast.error("유효기간은 1 이상의 숫자를 입력해주세요.");
      return;
    }
    setSubmitting(true);
    onSubmit({
      title,
      type,
      content,
      required,
      expiresInDays: days,
    });
    setSubmitting(false);
    setTitle("");
    setType("safety");
    setContent("");
    setRequired(true);
    setExpiresInDays("");
  };

  return (
    <div className="flex flex-col gap-3">
      {/* 제목 */}
      <div>
        <label className="mb-1 block text-[11px] font-medium text-gray-600">
          제목 <span className="text-red-500">*</span>
        </label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, 80))}
          placeholder="예: 안전 수칙 동의서"
          className="h-8 text-xs"
        />
      </div>

      {/* 유형 선택 */}
      <div>
        <label className="mb-1 block text-[11px] font-medium text-gray-600">
          유형
        </label>
        <div className="flex flex-wrap gap-1.5">
          {WAIVER_TYPE_OPTIONS.map((t) => {
            const meta = WAIVER_TYPE_META[t];
            return (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                  type === t
                    ? `${meta.color} border-current font-semibold`
                    : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                }`}
              >
                {meta.icon}
                {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 본문 */}
      <div>
        <label className="mb-1 flex items-center justify-between text-[11px] font-medium text-gray-600">
          <span>
            본문 <span className="text-red-500">*</span>
          </span>
          <span className="text-[10px] text-gray-400">
            {content.length}/2000
          </span>
        </label>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, 2000))}
          placeholder="동의서 내용을 입력하세요 (최대 2000자)"
          className="min-h-[120px] resize-none text-xs"
        />
      </div>

      {/* 필수 여부 + 유효기간 */}
      <div className="flex items-center gap-3">
        <label className="flex cursor-pointer items-center gap-1.5">
          <input
            type="checkbox"
            checked={required}
            onChange={(e) => setRequired(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-gray-300 accent-red-500"
          />
          <span className="text-xs text-gray-700">필수 동의</span>
        </label>
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-gray-600">유효기간</label>
          <Input
            type="number"
            min={1}
            value={expiresInDays}
            onChange={(e) => setExpiresInDays(e.target.value)}
            placeholder="일 (선택)"
            className="h-7 w-20 text-xs"
          />
          {expiresInDays && <span className="text-xs text-gray-500">일</span>}
        </div>
      </div>

      <Button
        size="sm"
        className="h-8 w-full text-xs"
        onClick={handleSubmit}
        disabled={submitting}
      >
        <Plus className="mr-1 h-3 w-3" />
        동의서 등록
      </Button>
    </div>
  );
}

// ─── 서명 모달 ────────────────────────────────────────────────────
function SignModal({
  template,
  onClose,
  onSign,
}: {
  template: WaiverTemplate;
  onClose: () => void;
  onSign: (memberId: string, memberName: string) => void;
}) {
  const [memberName, setMemberName] = useState("");
  const [memberId, setMemberId] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const meta = WAIVER_TYPE_META[template.type];

  const handleSign = () => {
    if (!memberName.trim()) {
      toast.error("멤버 이름을 입력해주세요.");
      return;
    }
    if (!confirmed) {
      toast.error("내용을 확인하고 동의 체크박스를 선택해주세요.");
      return;
    }
    onSign(memberId.trim() || crypto.randomUUID(), memberName.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-xl">
        {/* 헤더 */}
        <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
          <FileCheck className="h-4 w-4 text-green-600" />
          <span className="text-sm font-semibold text-gray-800">
            동의서 서명
          </span>
          <Badge
            className={`ml-auto flex items-center gap-0.5 text-[10px] px-1.5 py-0 ${meta.color} hover:${meta.color}`}
          >
            {meta.icon}
            {meta.label}
          </Badge>
        </div>

        {/* 본문 */}
        <div className="max-h-[60vh] overflow-y-auto px-4 py-3">
          <h3 className="mb-2 text-sm font-semibold text-gray-800">
            {template.title}
          </h3>
          <div className="mb-4 rounded-lg bg-gray-50 p-3 text-xs leading-relaxed text-gray-700 whitespace-pre-wrap">
            {template.content}
          </div>

          {/* 멤버 정보 */}
          <div className="mb-3 flex flex-col gap-2">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-gray-600">
                이름 <span className="text-red-500">*</span>
              </label>
              <Input
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                placeholder="서명할 멤버 이름"
                className="h-8 text-xs"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-gray-600">
                멤버 ID (선택)
              </label>
              <Input
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                placeholder="비워두면 자동 생성"
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* 동의 체크 */}
          <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-green-500"
            />
            <span className="text-xs text-green-800 leading-relaxed">
              위 내용을 모두 읽고 이해했으며, 이에 동의합니다.
            </span>
          </label>
        </div>

        {/* 액션 */}
        <div className="flex gap-2 border-t border-gray-100 px-4 py-3">
          <Button
            size="sm"
            variant="outline"
            className="h-8 flex-1 text-xs"
            onClick={onClose}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-8 flex-1 text-xs bg-green-600 hover:bg-green-700"
            onClick={handleSign}
            disabled={!confirmed}
          >
            <CheckCircle2 className="mr-1 h-3 w-3" />
            동의합니다
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── 메인 카드 ────────────────────────────────────────────────────
interface WaiverManagementCardProps {
  groupId: string;
}

export function WaiverManagementCard({ groupId }: WaiverManagementCardProps) {
  const [open, setOpen] = useState(true);
  const [tab, setTab] = useState<Tab>("list");
  const [signingTemplate, setSigningTemplate] = useState<WaiverTemplate | null>(null);

  const {
    templates,
    signatures,
    totalTemplates,
    requiredCount,
    addTemplate,
    removeTemplate,
    sign,
    unsign,
    getSignaturesByWaiver,
    getSignedCount,
    isExpired,
    refetch,
  } = useWaiverManagement(groupId);

  // ─── 핸들러 ──────────────────────────────────────────────────────
  const handleDelete = (id: string) => {
    const ok = removeTemplate(id);
    if (ok) toast.success("동의서가 삭제되었습니다.");
    else toast.error("동의서 삭제에 실패했습니다.");
  };

  const handleAddTemplate = (input: {
    title: string;
    type: WaiverType;
    content: string;
    required: boolean;
    expiresInDays?: number;
  }) => {
    const ok = addTemplate(input);
    if (ok) {
      toast.success("동의서가 등록되었습니다.");
      setTab("list");
    } else {
      toast.error("동의서 등록에 실패했습니다.");
    }
  };

  const handleSign = (memberId: string, memberName: string) => {
    if (!signingTemplate) return;
    const ok = sign({
      waiverId: signingTemplate.id,
      memberId,
      memberName,
    });
    if (ok) {
      toast.success(`${memberName}님의 서명이 완료되었습니다.`);
      setSigningTemplate(null);
    } else {
      toast.error("이미 유효한 서명이 존재하거나 처리 중 오류가 발생했습니다.");
    }
  };

  const handleUnsign = (signatureId: string) => {
    const ok = unsign(signatureId);
    if (ok) toast.success("서명이 취소되었습니다.");
    else toast.error("서명 취소에 실패했습니다.");
  };

  // ─── 통계 ────────────────────────────────────────────────────────
  const expiredCount = signatures.filter((s) => isExpired(s.expiresAt)).length;

  return (
    <>
      <Collapsible open={open} onOpenChange={setOpen}>
        {/* 헤더 */}
        <div className="flex items-center justify-between rounded-t-lg border border-b-0 border-gray-200 bg-white px-4 py-2.5">
          <div className="flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-teal-600" />
            <span className="text-sm font-semibold text-gray-800">
              디지털 동의서
            </span>
            {totalTemplates > 0 && (
              <Badge className="bg-teal-100 text-[10px] px-1.5 py-0 text-teal-700 hover:bg-teal-100">
                {totalTemplates}개
              </Badge>
            )}
            {requiredCount > 0 && (
              <Badge className="bg-red-100 text-[10px] px-1.5 py-0 text-red-600 hover:bg-red-100">
                필수 {requiredCount}
              </Badge>
            )}
            {expiredCount > 0 && (
              <Badge className="bg-orange-100 text-[10px] px-1.5 py-0 text-orange-600 hover:bg-orange-100 flex items-center gap-0.5">
                <AlertCircle className="h-2.5 w-2.5" />
                만료 {expiredCount}
              </Badge>
            )}
          </div>
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

        {/* 본문 */}
        <CollapsibleContent>
          <Card className="rounded-t-none border-t-0 shadow-none">
            <CardHeader className="px-4 pt-3 pb-0">
              {/* 탭 */}
              <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
                {(
                  [
                    { key: "list" as Tab, label: "동의서 목록" },
                    { key: "status" as Tab, label: "서명 현황" },
                    { key: "new" as Tab, label: "새 동의서" },
                  ] as const
                ).map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTab(key)}
                    className={`flex-1 rounded-md py-1 text-[11px] font-medium transition-colors ${
                      tab === key
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </CardHeader>

            <CardContent className="px-4 pb-4 pt-3">
              {tab === "list" && (
                <WaiverListTab
                  templates={templates}
                  signatures={signatures}
                  onDelete={handleDelete}
                  onSelectForSign={setSigningTemplate}
                  isExpired={isExpired}
                  getSignedCount={getSignedCount}
                />
              )}
              {tab === "status" && (
                <SignatureStatusTab
                  templates={templates}
                  signatures={signatures}
                  isExpired={isExpired}
                  onUnsign={handleUnsign}
                />
              )}
              {tab === "new" && (
                <NewWaiverTab onSubmit={handleAddTemplate} />
              )}
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* 서명 모달 */}
      {signingTemplate && (
        <SignModal
          template={signingTemplate}
          onClose={() => setSigningTemplate(null)}
          onSign={handleSign}
        />
      )}
    </>
  );
}
