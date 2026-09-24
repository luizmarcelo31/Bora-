import type { LucideIcon } from "lucide-react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  icon: Icon,
  action,
  className,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <Empty className={cn("border-dashed border-border/60 bg-transparent py-16", className)}>
      <EmptyHeader>
        {Icon ? (
          <EmptyMedia 
            variant="icon" 
            className="mb-6 size-14 rounded-2xl bg-muted/30 text-muted-foreground ring-1 ring-border/50 shadow-sm [&_svg:not([class*='size-'])]:size-7"
          >
            <Icon />
          </EmptyMedia>
        ) : null}
        <EmptyTitle className="text-base font-semibold text-foreground">{title}</EmptyTitle>
        {description ? (
          <EmptyDescription className="mt-2 max-w-[320px] text-[13px]">{description}</EmptyDescription>
        ) : null}
        {action && <div className="mt-6">{action}</div>}
      </EmptyHeader>
    </Empty>
  );
}
