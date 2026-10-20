import { mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import type { Ticket } from "./types";

export type Store = {
  seq: number;
  tickets: Ticket[];
};

function storePath(): string {
  return process.env.STORE_PATH || path.join(process.cwd(), "data", "store.json");
}

function emptyStore(): Store {
  return { seq: 1, tickets: [] };
}

export function readStore(): Store {
  try {
    const raw = readFileSync(storePath(), "utf8");
    const parsed = JSON.parse(raw) as Store;
    if (!parsed || !Array.isArray(parsed.tickets) || typeof parsed.seq !== "number") {
      return emptyStore();
    }
    return parsed;
  } catch {
    return emptyStore();
  }
}

function writeStore(store: Store) {
  const file = storePath();
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(store, null, 2));
}

let chain: Promise<unknown> = Promise.resolve();

export function updateStore<T>(fn: (store: Store) => T): Promise<T> {
  const run = chain.then(() => {
    const store = readStore();
    const result = fn(store);
    writeStore(store);
    return result;
  });
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}
