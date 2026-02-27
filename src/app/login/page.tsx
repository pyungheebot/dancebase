import { AuthForm } from "@/components/auth/auth-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-sidebar">
      <div className="w-full max-w-sm mx-auto p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Groop</h1>
          <p className="text-sm text-muted-foreground mt-1">댄서를 위한 그룹 관리</p>
        </div>
        <AuthForm />
      </div>
    </div>
  );
}
