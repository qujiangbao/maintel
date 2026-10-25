import { Wrench } from "lucide-react";
import { cn } from "cn";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cn("brand-mark", className)}>
      <Wrench className="size-4.5" strokeWidth={2.2} />
    </span>
  );
}

export function BrandName({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <BrandMark />
      <span className="font-display text-lg leading-none tracking-tight">澄川学院机务台</span>
    </span>
  );
}
