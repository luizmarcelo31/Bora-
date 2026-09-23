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
    <Empty className={cn("border-border/50 bg-muted/20 py-12", className)}>
      <EmptyHeader>
        {Icon ? (
          <EmptyMedia 
            variant="icon" 
            className="mb-4 size-12 rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20 shadow-xs [&_svg:not([class*='size-'])]:size-6"
          >
            <Icon />
          </EmptyMedia>
        ) : null}
        <EmptyTitle className="text-base font-semibold text-foreground">{title}</EmptyTitle>
        {description ? (
          <EmptyDescription className="mt-1 max-w-[280px]">{description}</EmptyDescription>
        ) : null}
        {action && <div className="mt-4">{action}</div>}
      </EmptyHeader>
    </Empty>
  );
}
