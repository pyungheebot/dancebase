"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/ui/user-avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Search } from "lucide-react";
import { useDialogForm } from "@/hooks/use-dialog-form";

interface SearchResult {
  id: string;
  name: string;
  avatar_url: string | null;
}

interface NewConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewConversationDialog({
  open,
  onOpenChange,
}: NewConversationDialogProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { values, setValue, handleOpenChange } = useDialogForm(
    { query: "" },
    { onClose: () => onOpenChange(false) }
  );
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    const supabase = createClient();

    const { data } = await supabase
      .from("profiles")
      .select("id, name, avatar_url")
      .neq("id", user?.id ?? "")
      .ilike("name", `%${q}%`)
      .limit(20);

    setResults((data as SearchResult[]) ?? []);
    setSearching(false);
  }, [user?.id]);

  // 디바운스 검색
  useEffect(() => {
    const timer = setTimeout(() => {
      search(values.query);
    }, 300);
    return () => clearTimeout(timer);
  }, [values.query, search]);

  // 다이얼로그 닫힐 때 results도 초기화
  useEffect(() => {
    if (!open) setResults([]);
  }, [open]);

  const handleSelect = (userId: string) => {
    handleOpenChange(false);
    router.push(`/messages/${userId}`);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>새 대화</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="이름으로 검색"
            value={values.query}
            onChange={(e) => setValue("query", e.target.value)}
            className="pl-9"
            autoFocus
          />
        </div>

        <ScrollArea className="max-h-64">
          {searching ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : results.length === 0 && values.query.trim() ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              검색 결과가 없습니다
            </p>
          ) : (
            <div className="space-y-0.5">
              {results.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => handleSelect(profile.id)}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <UserAvatar
                    name={profile.name || "U"}
                    avatarUrl={profile.avatar_url}
                    size="md"
                  />
                  <span className="text-sm font-medium">{profile.name}</span>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
