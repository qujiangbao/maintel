import type { ModelId, TagId, Urgency } from "./types";
import { TAGS, URGENCIES, taxonomyPrompt } from "./taxonomy";

export class MissingKeyError extends Error {
  envName: string;

  constructor(envName: string) {
    super(`服务器未配置 ${envName}`);
    this.name = "MissingKeyError";
    this.envName = envName;
  }
}

export type ModelRun = {
  ok: boolean;
  model: ModelId;
  modelName: string;
  error?: string;
  tag?: TagId;
  urgency?: Urgency;
  position?: string;
  reason?: string;
  raw: string;
  latencyMs: number;
  httpStatus?: number;
};

type CatalogItem = {
  id: ModelId;
  label: string;
  modelName: string;
  configured: boolean;
  envName: string;
};

export function modelCatalog(): CatalogItem[] {
  return [
    {
      id: "deepseek",
      label: "DeepSeek",
      modelName: process.env.DEEPSEEK_MODEL || "deepseek-flash",
      configured: Boolean(process.env.DEEPSEEK_API_KEY),
      envName: "DEEPSEEK_API_KEY",
    },
    {
      id: "zhipu",
      label: "智谱 GLM",
      modelName: process.env.ZHIPU_MODEL || "glm-4-flash-250414",
      configured: Boolean(process.env.ZHIPU_API_KEY),
      envName: "ZHIPU_API_KEY",
    },
  ];
}

export function assertModel(model: string): ModelId {
  if (model !== "deepseek" && model !== "zhipu") {
    throw new Error("只能选择 DeepSeek 或智谱");
  }
  return model;
}

const TAG_ALIAS: Record<string, TagId> = {
  host: "host",
  计算机主机: "host",
  主机: "host",
  display: "display",
  显示设备: "display",
  显示器: "display",
  network: "network",
  网络设备: "network",
  网络: "network",
  media: "media",
  投影与多媒体: "media",
  多媒体: "media",
  peripheral: "peripheral",
  外设: "peripheral",
};

const URGENCY_ALIAS: Record<string, Urgency> = {
  low: "low",
  medium: "medium",
  high: "high",
  critical: "critical",
  一般: "low",
  低: "low",
  较急: "medium",
  中: "medium",
  紧急: "high",
  高: "high",
  特急: "critical",
};

export function normalizeTriage(value: unknown): {
  tag: TagId;
  urgency: Urgency;
  position: string;
  reason: string;
} {
  if (!value || typeof value !== "object") {
    throw new Error("模型没有返回 JSON 对象");
  }
  const record = value as Record<string, unknown>;
  const tagRaw = String(record.tag ?? "").trim();
  const urgencyRaw = String(record.urgency ?? "").trim();
  const positionRaw = String(record.position ?? "").trim();
  const reason = String(record.reason ?? "").trim().slice(0, 200);
  const tag = TAG_ALIAS[tagRaw] ?? TAG_ALIAS[tagRaw.toLowerCase()];
  const urgency = URGENCY_ALIAS[urgencyRaw] ?? URGENCY_ALIAS[urgencyRaw.toLowerCase()];
  const position = TAGS.map((item) => item.position).find((item) => item === positionRaw);
  if (!tag) throw new Error(`无法解析标签字段：${tagRaw || "空"}`);
  if (!urgency) throw new Error(`无法解析紧急程度字段：${urgencyRaw || "空"}`);
  if (!position) throw new Error(`无法解析岗位字段：${positionRaw || "空"}`);
  if (!reason) throw new Error("无法解析说明字段");
  return { tag, urgency, position, reason };
}

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("模型没有返回 JSON");
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1));
      } catch {
        throw new Error("模型没有返回 JSON");
      }
    }
    throw new Error("模型没有返回 JSON");
  }
}

function endpoint(model: ModelId, modelName: string) {
  if (model === "deepseek") {
    return {
      url: "https://api.deepseek.com/chat/completions",
      key: process.env.DEEPSEEK_API_KEY,
      envName: "DEEPSEEK_API_KEY",
      body: {
        model: modelName,
        temperature: 0,
        max_tokens: 800,
        thinking: { type: "disabled" },
        response_format: { type: "json_object" },
      },
    };
  }
  return {
    url: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
    key: process.env.ZHIPU_API_KEY,
    envName: "ZHIPU_API_KEY",
    body: {
      model: modelName,
      temperature: 0,
      max_tokens: 800,
      do_sample: false,
      response_format: { type: "json_object" },
    },
  };
}

export async function runModel(
  model: ModelId,
  input: { room: string; device: string; description: string },
): Promise<ModelRun> {
  const catalog = modelCatalog().find((item) => item.id === model);
  if (!catalog) throw new Error("未知模型");
  const target = endpoint(model, catalog.modelName);
  if (!target.key) throw new MissingKeyError(target.envName);

  const messages = [
    { role: "system", content: taxonomyPrompt() },
    {
      role: "user",
      content: `机房：${input.room}\n设备：${input.device}\n故障描述：${input.description}`,
    },
  ];

  let lastError = "模型调用失败";
  let lastStatus: number | undefined;
  let lastRaw = "";
  const started = Date.now();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(target.url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${target.key}`,
        },
        body: JSON.stringify({ ...target.body, messages }),
        signal: AbortSignal.timeout(90_000),
      });
      const text = await response.text();
      lastRaw = text.slice(0, 4000);
      lastStatus = response.status;
      if (response.status === 429 || response.status >= 500) {
        lastError = `HTTP ${response.status}`;
        await delay(1000 * (attempt + 1));
        continue;
      }
      if (!response.ok) {
        return {
          ok: false,
          model,
          modelName: catalog.modelName,
          error: `HTTP ${response.status} ${compactError(text)}`,
          raw: lastRaw,
          latencyMs: Date.now() - started,
          httpStatus: response.status,
        };
      }
      let content = "";
      try {
        const parsed = JSON.parse(text) as {
          choices?: Array<{ message?: { content?: string | null } }>;
        };
        content = parsed.choices?.[0]?.message?.content ?? "";
      } catch {
        return {
          ok: false,
          model,
          modelName: catalog.modelName,
          error: "模型响应不是 JSON",
          raw: lastRaw,
          latencyMs: Date.now() - started,
          httpStatus: response.status,
        };
      }
      try {
        const normalized = normalizeTriage(extractJson(content));
        return {
          ok: true,
          model,
          modelName: catalog.modelName,
          ...normalized,
          raw: content.slice(0, 4000),
          latencyMs: Date.now() - started,
          httpStatus: response.status,
        };
      } catch (error) {
        return {
          ok: false,
          model,
          modelName: catalog.modelName,
          error: error instanceof Error ? error.message : "解析失败",
          raw: content.slice(0, 4000),
          latencyMs: Date.now() - started,
          httpStatus: response.status,
        };
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : "模型调用失败";
      await delay(1000 * (attempt + 1));
    }
  }

  return {
    ok: false,
    model,
    modelName: catalog.modelName,
    error: lastError,
    raw: lastRaw,
    latencyMs: Date.now() - started,
    httpStatus: lastStatus,
  };
}

function compactError(text: string): string {
  try {
    const parsed = JSON.parse(text) as { error?: { message?: string }; message?: string };
    return (parsed.error?.message || parsed.message || text).slice(0, 180);
  } catch {
    return text.slice(0, 180);
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function urgencyName(id: Urgency): string {
  return URGENCIES.find((item) => item.id === id)?.name ?? id;
}
