import { Suspense } from "react";

export default function TicketLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<p className="px-6 py-16 text-sm text-muted-foreground">正在读取工单…</p>}>
      {children}
    </Suspense>
  );
}
