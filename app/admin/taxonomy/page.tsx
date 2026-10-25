"use client";

import { useEffect, useState } from "react";
import { BookMarked, Cpu, Gauge, Keyboard, Monitor, Network, Speaker } from "lucide-react";
import { Shell } from "@/components/shell";
import { api } from "@/lib/client";
import type { TagDef, UrgencyDef } from "@/lib/taxonomy";

const tagIcons = {
  host: Cpu,
  display: Monitor,
  network: Network,
  media: Speaker,
  peripheral: Keyboard,
} as const;

const urgencyDots: Record<string, string> = {
  low: "bg-stone-400",
  medium: "bg-amber-500",
  high: "bg-orange-500",
  critical: "bg-red-500",
};

export default function TaxonomyPage() {
  const [tags, setTags] = useState<TagDef[] | null>(null);
  const [urgencies, setUrgencies] = useState<UrgencyDef[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ tags: TagDef[]; urgencies: UrgencyDef[] }>("/api/taxonomy")
      .then((data) => {
        setTags(data.tags);
        setUrgencies(data.urgencies);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <Shell role="admin">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <BookMarked className="size-5" />
        </span>
        <div>
          <h1 className="font-display text-3xl tracking-tight">划分依据</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">写在系统里，分诊提示词与这里保持一致</p>
        </div>
      </div>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
        五类设备标签、紧急程度和建议维修岗位写在系统里。分诊时把同一份依据放进模型提示词，页面不能改这些规则，也不能填写密钥。
      </p>
      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
      {!tags && !error ? <p className="mt-4 text-sm text-muted-foreground">正在读取划分依据…</p> : null}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {tags?.map((tag) => {
          const Icon = tagIcons[tag.id as keyof typeof tagIcons] ?? Cpu;
          return (
            <article key={tag.id} className="panel panel-hover p-5">
              <div className="flex items-center justify-between">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <span className="font-mono text-xs text-muted-foreground">{tag.id}</span>
              </div>
              <h2 className="mt-3 font-display text-2xl tracking-tight">{tag.name}</h2>
              <p className="mt-1.5 inline-flex rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                建议维修岗位：{tag.position}
              </p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{tag.criteria}</p>
            </article>
          );
        })}
      </div>
      <h2 className="mt-8 flex items-center gap-2 font-display text-2xl tracking-tight">
        <Gauge className="size-5 text-muted-foreground" />
        紧急程度
      </h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {urgencies?.map((item) => (
          <article key={item.id} className="panel p-5">
            <h3 className="flex items-center gap-2 font-medium">
              <span className={`size-2 rounded-full ${urgencyDots[item.id] ?? "bg-stone-400"}`} />
              {item.name}
              <span className="font-mono text-xs font-normal text-muted-foreground">{item.id}</span>
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.criteria}</p>
          </article>
        ))}
      </div>
    </Shell>
  );
}
