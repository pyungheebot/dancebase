"use client";

import { useState, type ReactNode } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type CollapsibleCardProps = {
  title: string;
  icon?: ReactNode;
  defaultOpen?: boolean;
  headerExtra?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function CollapsibleCard({
  title,
  icon,
  defaultOpen = true,
  headerExtra,
  children,
  className,
}: CollapsibleCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card className={className}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                {icon}
                <CardTitle className="text-base">{title}</CardTitle>
                <ChevronDown
                  className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen && "rotate-180")}
                />
              </button>
            </CollapsibleTrigger>
            {headerExtra}
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-0">{children}</CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
