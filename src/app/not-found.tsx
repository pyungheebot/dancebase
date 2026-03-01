import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-md">
        <FileQuestion className="h-12 w-12 text-muted-foreground mx-auto" />
        <h2 className="text-xl font-semibold">페이지를 찾을 수 없습니다</h2>
        <p className="text-muted-foreground">
          요청하신 페이지가 존재하지 않거나 이동되었습니다.
        </p>
        <Button asChild>
          <Link href="/dashboard">대시보드로 이동</Link>
        </Button>
      </div>
    </div>
  );
}
