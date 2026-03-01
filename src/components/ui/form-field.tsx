import { Label } from "@/components/ui/label";

type FormFieldProps = {
  label: string;
  required?: boolean;
  error?: string | null;
  hint?: string;
  children: React.ReactNode;
};

export function FormField({ label, required, error, hint, children }: FormFieldProps) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive" role="alert">{error}</p>
      ) : hint ? (
        <p className="text-[10px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
