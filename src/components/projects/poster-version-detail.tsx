"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Trash2,
  Star,
  CheckCircle,
  BarChart3,
  Award,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import type { PosterVersion, PosterVersionStatus } from "@/types";
import { STATUS_LABELS, STATUS_NEXT, statusBadgeClass, avgRating } from "./poster-types";
import { StarRating } from "./poster-star-rating";

// ============================================================
// 버전 상세 패널
// ============================================================

interface VersionDetailProps {
  version: PosterVersion;
  posterId: string;
  memberNames: string[];
  onVote: (
    posterId: string,
    versionId: string,
    memberName: string,
    rating: number,
    comment?: string
  ) => boolean;
  onStatusChange: (
    posterId: string,
    versionId: string,
    status: PosterVersionStatus
  ) => boolean;
  onSelectFinal: (posterId: string, versionId: string) => boolean;
  onDelete: (posterId: string, versionId: string) => boolean;
}

export function VersionDetail({
  version,
  posterId,
  memberNames,
  onVote,
  onStatusChange,
  onSelectFinal,
  onDelete,
}: VersionDetailProps) {
  const [selectedMember, setSelectedMember] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const avg = avgRating(version.votes);
  const nextStatuses = STATUS_NEXT[version.status] ?? [];

  const memberSelectId = `vote-member-${version.id}`;
  const commentId = `vote-comment-${version.id}`;

  function handleVote() {
    if (!selectedMember) {
      toast.error(TOAST.POSTER.VOTER_REQUIRED);
      return;
    }
    if (rating === 0) {
      toast.error(TOAST.POSTER.RATING_REQUIRED);
      return;
    }
    const ok = onVote(
      posterId,
      version.id,
      selectedMember,
      rating,
      comment || undefined
    );
    if (ok) {
      toast.success(TOAST.POSTER.VOTE_REGISTERED);
      setSelectedMember("");
      setRating(0);
      setComment("");
    } else {
      toast.error(TOAST.POSTER.VOTE_ERROR);
    }
  }

  function handleStatusChange(status: PosterVersionStatus) {
    const ok = onStatusChange(posterId, version.id, status);
    if (ok) {
      toast.success(`상태가 "${STATUS_LABELS[status]}"로 변경되었습니다.`);
    } else {
      toast.error(TOAST.STATUS_ERROR);
    }
  }

  function handleSelectFinal() {
    const ok = onSelectFinal(posterId, version.id);
    if (ok) {
      toast.success(TOAST.POSTER.FINALIZED);
    } else {
      toast.error(TOAST.POSTER.FINALIZE_ERROR);
    }
  }

  function handleDelete() {
    const ok = onDelete(posterId, version.id);
    if (ok) {
      toast.success(TOAST.POSTER.VERSION_DELETED);
    } else {
      toast.error(TOAST.POSTER.VERSION_DELETE_ERROR);
    }
  }

  return (
    <div
      className="border rounded-lg p-3 space-y-3 bg-card"
      role="region"
      aria-label={`버전 ${version.versionNumber}: ${version.title} 상세`}
    >
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-gray-800">
              v{version.versionNumber}. {version.title}
            </span>
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 ${statusBadgeClass(version.status)}`}
            >
              {STATUS_LABELS[version.status]}
            </Badge>
            {version.status === "final" && (
              <Award
                className="h-3.5 w-3.5 text-purple-500"
                aria-label="최종 확정"
              />
            )}
          </div>
          <p className="text-[10px] text-gray-500 mt-0.5">
            디자이너: {version.designer}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {avg !== null && (
            <div className="flex items-center gap-0.5">
              <StarRating
                value={Math.round(avg)}
                readonly
                size="xs"
                label="평균 별점"
              />
              <span className="text-[10px] text-gray-500">
                {avg.toFixed(1)}
              </span>
            </div>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={handleDelete}
            aria-label={`${version.title} 버전 삭제`}
          >
            <Trash2 className="h-3 w-3" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* 설명 */}
      <p className="text-xs text-gray-600">{version.description}</p>

      {/* 치수 */}
      {version.dimensions && (
        <div className="text-[10px] text-gray-500">
          치수: <span className="text-gray-700">{version.dimensions}</span>
        </div>
      )}

      {/* 색상 팔레트 */}
      {version.colorScheme && version.colorScheme.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] text-gray-500 font-medium">색상 팔레트</p>
          <div className="flex flex-wrap gap-1" role="list" aria-label="색상 팔레트">
            {version.colorScheme.map((c) => (
              <span
                key={c}
                role="listitem"
                className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 투표 결과 */}
      {version.votes.length > 0 && (
        <div className="space-y-1.5">
          <p
            className="text-[10px] text-gray-500 font-medium flex items-center gap-1"
            id={`vote-results-label-${version.id}`}
          >
            <BarChart3 className="h-3 w-3" aria-hidden="true" />
            투표 결과 ({version.votes.length}명)
          </p>
          <div
            className="space-y-1"
            role="list"
            aria-labelledby={`vote-results-label-${version.id}`}
          >
            {version.votes.map((v) => (
              <div
                key={v.memberName}
                role="listitem"
                className="flex items-start gap-2 text-[10px]"
              >
                <span className="text-gray-600 w-16 shrink-0 truncate">
                  {v.memberName}
                </span>
                <StarRating
                  value={v.rating}
                  readonly
                  size="xs"
                  label={`${v.memberName}의 별점`}
                />
                <span className="text-gray-400">{v.rating}점</span>
                {v.comment && (
                  <span className="text-gray-500 flex-1 truncate">
                    — {v.comment}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 투표 UI */}
      {version.status !== "final" && (
        <div
          className="border-t pt-2 space-y-2"
          role="region"
          aria-label="투표하기"
        >
          <p className="text-[10px] text-gray-500 font-medium" aria-hidden="true">
            투표하기
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Label htmlFor={memberSelectId} className="sr-only">
                투표할 멤버 선택
              </Label>
              <Select value={selectedMember} onValueChange={setSelectedMember}>
                <SelectTrigger
                  id={memberSelectId}
                  className="h-7 text-xs"
                  aria-label="투표할 멤버 선택"
                >
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
            <StarRating
              value={rating}
              onChange={setRating}
              size="sm"
              label="평가 별점"
            />
          </div>
          <div>
            <Label htmlFor={commentId} className="sr-only">
              코멘트 (선택사항)
            </Label>
            <Input
              id={commentId}
              className="h-7 text-xs"
              placeholder="코멘트 (선택사항)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
          <Button
            size="sm"
            className="h-7 text-xs w-full"
            onClick={handleVote}
            disabled={!selectedMember || rating === 0}
            aria-label="투표 등록"
          >
            <Star className="h-3 w-3 mr-1" aria-hidden="true" />
            투표 등록
          </Button>
        </div>
      )}

      {/* 상태 워크플로우 */}
      {version.status !== "final" && nextStatuses.length > 0 && (
        <div
          className="flex flex-wrap gap-1 border-t pt-2"
          role="group"
          aria-label="상태 변경"
        >
          {nextStatuses.map((s) => (
            <Button
              key={s}
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => handleStatusChange(s)}
              aria-label={`상태를 ${STATUS_LABELS[s]}로 변경`}
            >
              <CheckCircle className="h-3 w-3 mr-1" aria-hidden="true" />
              {STATUS_LABELS[s]}으로 변경
            </Button>
          ))}
          {version.status === "approved" && (
            <Button
              size="sm"
              className="h-7 text-xs bg-purple-600 hover:bg-purple-700"
              onClick={handleSelectFinal}
              aria-label="이 버전을 최종 선정"
            >
              <Award className="h-3 w-3 mr-1" aria-hidden="true" />
              최종 선정
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
