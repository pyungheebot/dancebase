"use client";

import { useState } from "react";
import { useDeleteConfirm } from "@/hooks/use-delete-confirm";
import {
  UserCheck,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Star,
  BookOpen,
  Phone,
  Mail,
  Wallet,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import {
  useGuestInstructor,
  calcAverageRating,
  type AddGuestInstructorInput,
  type AddGuestLessonInput,
} from "@/hooks/use-guest-instructor";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { GuestInstructorEntry } from "@/types";
import { formatYearMonthDay } from "@/lib/date-utils";

// ─── 상수 ────────────────────────────────────────────────────

const GENRE_OPTIONS = [
  "팝핀",
  "비보잉",
  "힙합",
  "재즈",
  "하우스",
  "왁킹",
  "크럼프",
  "락킹",
  "댄스홀",
  "케이팝",
  "기타",
] as const;

// ─── 유틸 ────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return amount.toLocaleString("ko-KR") + "원";
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── 별점 컴포넌트 ────────────────────────────────────────────

interface StarRatingProps {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
}

function StarRating({ value, onChange, readonly = false }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(n)}
          onMouseEnter={() => !readonly && setHovered(n)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={`p-0 leading-none ${readonly ? "cursor-default" : "cursor-pointer"}`}
          aria-label={`${n}점`}
        >
          <Star
            className={`h-3.5 w-3.5 transition-colors ${
              n <= display
                ? "fill-yellow-400 text-yellow-400"
                : "fill-transparent text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// ─── 강사 추가 폼 ─────────────────────────────────────────────

interface AddInstructorFormProps {
  onAdd: (input: AddGuestInstructorInput) => Promise<boolean>;
  onClose: () => void;
}

function AddInstructorForm({ onAdd, onClose }: AddInstructorFormProps) {
  const [name, setName] = useState("");
  const [genre, setGenre] = useState<string>(GENRE_OPTIONS[0]);
  const [career, setCareer] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [note, setNote] = useState("");

  const handleSubmit = async () => {
    const ok = await onAdd({
      name,
      genre,
      career,
      phone,
      email,
      hourlyRate: hourlyRate ? Number(hourlyRate) : undefined,
      note,
    });
    if (ok) onClose();
  };

  return (
    <div className="rounded-lg border border-dashed border-purple-200 bg-purple-50 p-3 space-y-2">
      <p className="text-xs font-medium text-purple-700">새 강사 등록</p>

      {/* 이름 */}
      <Input
        value={name}
        onChange={(e) => setName(e.target.value.slice(0, 30))}
        placeholder="강사 이름"
        className="h-8 text-xs"
      />

      {/* 장르 + 시간당 비용 */}
      <div className="flex gap-2">
        <select
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          className="flex-1 rounded-md border border-gray-200 bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gray-300"
        >
          {GENRE_OPTIONS.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-gray-500 whitespace-nowrap">
            시간당:
          </span>
          <Input
            type="number"
            min={0}
            value={hourlyRate}
            onChange={(e) => setHourlyRate(e.target.value)}
            placeholder="0"
            className="h-8 w-24 text-xs"
          />
          <span className="text-[10px] text-gray-500">원</span>
        </div>
      </div>

      {/* 연락처 + 이메일 */}
      <div className="flex gap-2">
        <Input
          value={phone}
          onChange={(e) => setPhone(e.target.value.slice(0, 20))}
          placeholder="연락처 (선택)"
          className="h-8 flex-1 text-xs"
        />
        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value.slice(0, 50))}
          placeholder="이메일 (선택)"
          className="h-8 flex-1 text-xs"
        />
      </div>

      {/* 경력 */}
      <Input
        value={career}
        onChange={(e) => setCareer(e.target.value.slice(0, 100))}
        placeholder="경력 소개 (선택, 최대 100자)"
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
        <Button
          size="sm"
          className="h-7 flex-1 text-xs"
          onClick={handleSubmit}
        >
          <Plus className="mr-1 h-3 w-3" />
          등록
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs"
          onClick={onClose}
        >
          취소
        </Button>
      </div>
    </div>
  );
}

// ─── 수업 이력 추가 폼 ────────────────────────────────────────

interface AddLessonFormProps {
  instructorId: string;
  onAdd: (instructorId: string, input: AddGuestLessonInput) => Promise<boolean>;
  onClose: () => void;
}

function AddLessonForm({ instructorId, onAdd, onClose }: AddLessonFormProps) {
  const [date, setDate] = useState(todayStr());
  const [topic, setTopic] = useState("");
  const [rating, setRating] = useState(4);
  const [note, setNote] = useState("");

  const handleSubmit = async () => {
    const ok = await onAdd(instructorId, { date, topic, rating, note });
    if (ok) onClose();
  };

  return (
    <div className="rounded-lg border border-dashed border-blue-200 bg-blue-50 p-3 space-y-2">
      <p className="text-xs font-medium text-blue-700">수업 이력 추가</p>

      {/* 날짜 + 평점 */}
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-md border border-gray-200 bg-background px-2 py-1 text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-300"
          title="수업 날짜"
        />
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-gray-500">평점:</span>
          <StarRating value={rating} onChange={setRating} />
        </div>
      </div>

      {/* 수업 주제 */}
      <Input
        value={topic}
        onChange={(e) => setTopic(e.target.value.slice(0, 50))}
        placeholder="수업 주제 (예: 팝핀 기초 - 웨이브)"
        className="h-8 text-xs"
      />

      {/* 메모 */}
      <Input
        value={note}
        onChange={(e) => setNote(e.target.value.slice(0, 100))}
        placeholder="메모 (선택)"
        className="h-8 text-xs"
      />

      {/* 버튼 */}
      <div className="flex gap-2">
        <Button
          size="sm"
          className="h-7 flex-1 text-xs bg-blue-600 hover:bg-blue-700"
          onClick={handleSubmit}
        >
          <Plus className="mr-1 h-3 w-3" />
          추가
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs"
          onClick={onClose}
        >
          취소
        </Button>
      </div>
    </div>
  );
}

// ─── 강사 카드 ────────────────────────────────────────────────

interface InstructorCardProps {
  instructor: GuestInstructorEntry;
  onDelete: () => void;
  onAddLesson: (
    instructorId: string,
    input: AddGuestLessonInput
  ) => Promise<boolean>;
  onDeleteLesson: (instructorId: string, lessonId: string) => Promise<boolean>;
}

function InstructorCard({
  instructor,
  onDelete,
  onAddLesson,
  onDeleteLesson,
}: InstructorCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [lessonPage, setLessonPage] = useState(0);

  const avgRating = calcAverageRating(instructor.lessons);
  const totalCost = instructor.hourlyRate
    ? instructor.hourlyRate * instructor.lessons.length
    : 0;

  const PAGE_SIZE = 3;
  const sortedLessons = [...instructor.lessons].sort((a, b) =>
    b.date.localeCompare(a.date)
  );
  const totalPages = Math.ceil(sortedLessons.length / PAGE_SIZE);
  const visibleLessons = sortedLessons.slice(
    lessonPage * PAGE_SIZE,
    (lessonPage + 1) * PAGE_SIZE
  );

  const handleDeleteLesson = async (lessonId: string) => {
    await onDeleteLesson(instructor.id, lessonId);
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-card overflow-hidden">
      {/* 강사 헤더 */}
      <div className="flex items-start gap-2 px-3 py-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600">
          <UserCheck className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          {/* 이름 + 장르 배지 */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-semibold text-gray-800">
              {instructor.name}
            </span>
            <Badge className="bg-purple-100 text-[10px] px-1.5 py-0 text-purple-700 hover:bg-purple-100">
              {instructor.genre}
            </Badge>
            {instructor.lessons.length > 0 && (
              <Badge className="bg-yellow-100 text-[10px] px-1.5 py-0 text-yellow-700 hover:bg-yellow-100">
                <Star className="mr-0.5 h-2.5 w-2.5 fill-yellow-500 text-yellow-500" />
                {avgRating.toFixed(1)}
              </Badge>
            )}
          </div>

          {/* 경력 */}
          {instructor.career && (
            <p className="mt-0.5 text-[11px] text-gray-500 truncate">
              {instructor.career}
            </p>
          )}

          {/* 연락처 / 비용 */}
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-gray-400">
            {instructor.phone && (
              <span className="flex items-center gap-0.5">
                <Phone className="h-2.5 w-2.5" />
                {instructor.phone}
              </span>
            )}
            {instructor.email && (
              <span className="flex items-center gap-0.5">
                <Mail className="h-2.5 w-2.5" />
                {instructor.email}
              </span>
            )}
            {instructor.hourlyRate && (
              <span className="flex items-center gap-0.5">
                <Wallet className="h-2.5 w-2.5" />
                {formatCurrency(instructor.hourlyRate)}/시간
              </span>
            )}
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-gray-400 hover:text-blue-500"
            onClick={() => {
              setExpanded(!expanded);
              setShowLessonForm(false);
            }}
            title="수업 이력 보기"
          >
            <BookOpen className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-gray-300 hover:text-red-500"
            onClick={onDelete}
            title="강사 삭제"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* 수업 이력 패널 */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 px-3 py-2.5 space-y-2">
          {/* 이력 헤더 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-gray-600">
                수업 이력
              </span>
              <Badge className="bg-gray-200 text-[10px] px-1.5 py-0 text-gray-600 hover:bg-gray-200">
                {instructor.lessons.length}회
              </Badge>
              {totalCost > 0 && (
                <span className="text-[10px] text-gray-400">
                  총 {formatCurrency(totalCost)}
                </span>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-6 text-[10px] px-2 border-blue-200 text-blue-600 hover:bg-blue-50"
              onClick={() => setShowLessonForm(!showLessonForm)}
            >
              <Plus className="mr-0.5 h-2.5 w-2.5" />
              추가
            </Button>
          </div>

          {/* 수업 추가 폼 */}
          {showLessonForm && (
            <AddLessonForm
              instructorId={instructor.id}
              onAdd={onAddLesson}
              onClose={() => setShowLessonForm(false)}
            />
          )}

          {/* 수업 이력 목록 */}
          {instructor.lessons.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-1 py-4 text-gray-400">
              <BookOpen className="h-6 w-6 opacity-30" />
              <p className="text-[11px]">수업 이력이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {visibleLessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="flex items-start gap-2 rounded-md border border-gray-100 bg-card px-2.5 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-medium text-gray-700">
                        {lesson.topic}
                      </span>
                      <StarRating value={lesson.rating} readonly />
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[10px] text-gray-400">
                      <span>{formatYearMonthDay(lesson.date)}</span>
                      {lesson.note && (
                        <span className="truncate">{lesson.note}</span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 shrink-0 p-0 text-gray-300 hover:text-red-500"
                    onClick={() => handleDeleteLesson(lesson.id)}
                    title="삭제"
                  >
                    <Trash2 className="h-2.5 w-2.5" />
                  </Button>
                </div>
              ))}

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-gray-400"
                    disabled={lessonPage === 0}
                    onClick={() => setLessonPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-3 w-3" />
                  </Button>
                  <span className="text-[10px] text-gray-400">
                    {lessonPage + 1} / {totalPages}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-gray-400"
                    disabled={lessonPage >= totalPages - 1}
                    onClick={() => setLessonPage((p) => p + 1)}
                  >
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* 메모 */}
          {instructor.note && (
            <p className="rounded-md bg-yellow-50 px-2.5 py-1.5 text-[10px] text-yellow-700 border border-yellow-100">
              메모: {instructor.note}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── 통계 요약 바 ────────────────────────────────────────────

interface SummaryStatsProps {
  total: number;
  totalLessons: number;
  avgRating: number;
  totalCost: number;
}

function SummaryStats({
  total,
  totalLessons,
  avgRating,
  totalCost,
}: SummaryStatsProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {[
        {
          label: "강사 수",
          value: `${total}명`,
          color: "text-purple-700",
          bg: "bg-purple-50",
        },
        {
          label: "수업 횟수",
          value: `${totalLessons}회`,
          color: "text-blue-700",
          bg: "bg-blue-50",
        },
        {
          label: "평균 평점",
          value: avgRating > 0 ? `${avgRating.toFixed(1)}점` : "-",
          color: "text-yellow-700",
          bg: "bg-yellow-50",
        },
        {
          label: "총 비용",
          value: totalCost > 0 ? formatCurrency(totalCost) : "-",
          color: "text-emerald-700",
          bg: "bg-emerald-50",
        },
      ].map(({ label, value, color, bg }) => (
        <div key={label} className={`rounded-lg ${bg} px-3 py-2 text-center`}>
          <div className={`text-sm font-bold ${color}`}>{value}</div>
          <div className="text-[10px] text-gray-500 mt-0.5">{label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── 메인 카드 ────────────────────────────────────────────────

interface GuestInstructorCardProps {
  groupId: string;
}

export function GuestInstructorCard({ groupId }: GuestInstructorCardProps) {
  const [open, setOpen] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterGenre, setFilterGenre] = useState<string>("전체");
  const deleteConfirm = useDeleteConfirm<GuestInstructorEntry>();

  const {
    instructors,
    loading,
    refetch,
    addInstructor,
    deleteInstructor,
    addLesson,
    deleteLesson,
    genres,
    stats,
  } = useGuestInstructor(groupId);

  const filteredInstructors =
    filterGenre === "전체"
      ? instructors
      : instructors.filter((i) => i.genre === filterGenre);

  const requestDelete = (instructor: GuestInstructorEntry) => {
    if (instructor.lessons.length > 0) {
      deleteConfirm.request(instructor);
    } else {
      deleteInstructor(instructor.id);
    }
  };

  const handleDelete = async () => {
    const target = deleteConfirm.confirm();
    if (!target) return;
    await deleteInstructor(target.id);
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      {/* 헤더 */}
      <div className="flex items-center justify-between rounded-t-lg border border-b-0 border-gray-200 bg-card px-4 py-2.5">
        <div className="flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-purple-500" />
          <span className="text-sm font-semibold text-gray-800">
            외부 강사 관리
          </span>
          {stats.total > 0 && (
            <Badge className="bg-purple-100 text-[10px] px-1.5 py-0 text-purple-600 hover:bg-purple-100">
              {stats.total}명
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-gray-400"
            onClick={() => {
              refetch();
              toast.success(TOAST.GUEST_INSTRUCTOR.REFRESHED);
            }}
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
          <SummaryStats
            total={stats.total}
            totalLessons={stats.totalLessons}
            avgRating={stats.avgRating}
            totalCost={stats.totalCost}
          />

          <Separator />

          {/* 장르 필터 */}
          {genres.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {["전체", ...genres].map((g) => (
                <button
                  key={g}
                  onClick={() => setFilterGenre(g)}
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
                    filterGenre === g
                      ? "bg-purple-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          )}

          {/* 강사 추가 버튼 */}
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <Plus className="mr-1 h-3 w-3" />
            강사 등록
          </Button>

          {/* 강사 추가 폼 */}
          {showAddForm && (
            <AddInstructorForm
              onAdd={addInstructor}
              onClose={() => setShowAddForm(false)}
            />
          )}

          {/* 강사 목록 */}
          {loading ? (
            <div className="flex items-center justify-center py-8 text-gray-400">
              <span className="text-xs">불러오는 중...</span>
            </div>
          ) : filteredInstructors.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-1 py-8 text-gray-400">
              <UserCheck className="h-8 w-8 opacity-30" />
              <p className="text-xs">
                {filterGenre === "전체"
                  ? "등록된 외부 강사가 없습니다."
                  : `${filterGenre} 장르 강사가 없습니다.`}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredInstructors.map((instructor) => (
                <InstructorCard
                  key={instructor.id}
                  instructor={instructor}
                  onDelete={() => requestDelete(instructor)}
                  onAddLesson={addLesson}
                  onDeleteLesson={deleteLesson}
                />
              ))}
            </div>
          )}
        </div>
      </CollapsibleContent>
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={deleteConfirm.onOpenChange}
        title="강사 삭제"
        description={deleteConfirm.target ? `${deleteConfirm.target.name} 강사를 삭제하면 ${deleteConfirm.target.lessons.length}개의 수업 이력도 함께 삭제됩니다. 계속하시겠습니까?` : ""}
        onConfirm={handleDelete}
        destructive
      />
    </Collapsible>
  );
}
