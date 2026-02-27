"use client";

import { useState, useEffect } from "react";
import { BookOpen, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useGroupRules } from "@/hooks/use-group-rules";

type GroupRulesEditorProps = {
  groupId: string;
  canEdit: boolean;
};

export function GroupRulesEditor({ groupId, canEdit }: GroupRulesEditorProps) {
  const { rules, loading, saveRules } = useGroupRules(groupId);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && rules) {
      setTitle(rules.title ?? "");
      setContent(rules.content ?? "");
      setIsVisible(rules.isVisible ?? false);
    }
  }, [loading, rules]);

  const handleSave = async () => {
    setSaving(true);
    await saveRules(title, content, isVisible);
    setSaving(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5" />
          그룹 규칙/공지 배너
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-[11px] text-muted-foreground">
          그룹 메인 페이지 상단에 고정 표시되는 규칙 또는 공지사항을 설정합니다.
        </p>

        <div className="space-y-1.5">
          <Label className="text-xs">제목</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 그룹 규칙 안내"
            className="h-8 text-xs"
            disabled={!canEdit || loading}
            maxLength={50}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">내용</Label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={"줄바꿈이 그대로 표시됩니다.\n예: 1. 연습 참석 시 1시간 전에 공지해 주세요.\n2. 회비는 매월 5일까지 납부해 주세요."}
            className="text-xs min-h-[120px] resize-none"
            disabled={!canEdit || loading}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium">배너 공개</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              비공개 시 멤버에게 표시되지 않습니다
            </p>
          </div>
          <Switch
            checked={isVisible}
            onCheckedChange={setIsVisible}
            disabled={!canEdit || loading}
          />
        </div>

        {canEdit && (
          <Button
            size="sm"
            className="h-7 text-xs w-full"
            onClick={handleSave}
            disabled={saving || loading || !title.trim()}
          >
            {saving ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <Save className="h-3 w-3 mr-1" />
            )}
            저장
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
