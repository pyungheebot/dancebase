"use client";

import { useState, useEffect } from "react";
import { BookOpen, ChevronDown, ChevronUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGroupRules } from "@/hooks/use-group-rules";

type GroupRulesBannerProps = {
  groupId: string;
};

const SESSION_KEY_PREFIX = "group-rules-hidden-";

export function GroupRulesBanner({ groupId }: GroupRulesBannerProps) {
  const { rules, loading } = useGroupRules(groupId);
  const [expanded, setExpanded] = useState(false);
  const [hidden, setHidden] = useState(false);

  const sessionKey = `${SESSION_KEY_PREFIX}${groupId}`;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isHidden = sessionStorage.getItem(sessionKey) === "true";
      setHidden(isHidden);
    }
  }, [sessionKey]);

  const handleClose = () => {
    sessionStorage.setItem(sessionKey, "true");
    setHidden(true);
  };

  if (loading) return null;
  if (!rules || !rules.title || !rules.isVisible) return null;
  if (hidden) return null;

  return (
    <div className="mb-3 rounded-lg border bg-muted/50 border-l-4 border-l-primary">
      <div className="flex items-center justify-between px-3 py-2">
        <button
          type="button"
          className="flex items-center gap-1.5 flex-1 min-w-0 text-left"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
        >
          <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="text-xs font-semibold truncate">{rules.title}</span>
          {expanded ? (
            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-auto" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-auto" />
          )}
        </button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 ml-1 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={handleClose}
          aria-label="배너 닫기"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      {expanded && rules.content && (
        <div className="px-3 pb-3">
          <div className="border-t pt-2">
            <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {rules.content}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
