"use client";

import { useEffect, useState } from "react";
import { Shell } from "@/components/shell";
import { api } from "@/lib/client";
import type { TagDef, UrgencyDef } from "@/lib/taxonomy";

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
      <h1 className="font-display text-3xl">划分依据</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
        五类设备标签、紧急程度和建议维修岗位写在系统里。分诊时把同一份依据放进模型提示词，页面不能改这些规则，也不能填写密钥。
      </p>
      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
      {!tags && !error ? <p className="mt-4 text-sm text-muted-foreground">正在读取划分依据…</p> : null}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {tags?.map((tag) => (
          <article key={tag.id} className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
            <p className="text-xs text-muted-foreground">{tag.id}</p>
            <h2 className="font-display mt-1 text-2xl">{tag.name}</h2>
            <p className="mt-2 text-sm">建议维修岗位：{tag.position}</p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{tag.criteria}</p>
          </article>
        ))}
      </div>
      <h2 className="font-display mt-8 text-2xl">紧急程度</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {urgencies?.map((item) => (
          <article key={item.id} className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
            <h3 className="font-medium">
              {item.name}
              <span className="ml-2 font-normal text-muted-foreground">{item.id}</span>
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.criteria}</p>
          </article>
        ))}
      </div>
    </Shell>
  );
}
