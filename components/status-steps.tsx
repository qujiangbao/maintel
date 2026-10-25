import { Check } from "lucide-react";
import type { TicketStatus } from "@/lib/types";

const ORDER: TicketStatus[] = [
  "submitted",
  "triaged",
  "confirmed",
  "dispatched",
  "accepted",
  "processing",
  "completed",
];

const STAGES = [
  { label: "提交", upTo: "triaged" },
  { label: "分诊确认", upTo: "confirmed" },
  { label: "派发", upTo: "dispatched" },
  { label: "维修", upTo: "processing" },
  { label: "完成", upTo: "completed" },
] as const;

function stageIndex(status: TicketStatus): number {
  const order = ORDER.indexOf(status);
  if (order <= ORDER.indexOf("triaged")) return 0;
  if (order <= ORDER.indexOf("confirmed")) return 1;
  if (order <= ORDER.indexOf("dispatched")) return 2;
  if (order <= ORDER.indexOf("processing")) return 3;
  return 4;
}

export function StatusSteps({ status }: { status: TicketStatus }) {
  const current = stageIndex(status);
  const done = status === "completed";
  return (
    <ol className="flex items-center gap-1 sm:gap-2">
      {STAGES.map((stage, index) => {
        const reached = done ? true : index < current;
        const active = !done && index === current;
        return (
          <li key={stage.label} className="flex min-w-0 items-center gap-1 sm:gap-2">
            {index > 0 ? (
              <span className={`h-px w-4 sm:w-7 ${index <= current || done ? "bg-primary/60" : "bg-foreground/15"}`} />
            ) : null}
            <span className="flex min-w-0 items-center gap-1.5">
              <span
                className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
                  reached
                    ? "bg-primary text-primary-foreground"
                    : active
                      ? "bg-primary/15 text-primary ring-2 ring-primary/40"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {reached ? <Check className="size-3" strokeWidth={3} /> : index + 1}
              </span>
              <span
                className={`truncate text-xs ${
                  active || reached ? "font-medium text-foreground" : "text-muted-foreground"
                }`}
              >
                {stage.label}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
