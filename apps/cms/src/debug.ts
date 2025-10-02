// FILE: apps/cms/src/debug.ts
// Language: TypeScript
import pino, { type Logger as PinoLogger, type LoggerOptions } from "pino";

/** ===== env helpers ===== */
function env(k: string, def = ""): string {
  const v = process.env[k];
  return typeof v === "string" ? v : def;
}

const ENABLED = env("PAYLOAD_LOG_ENABLE", "1") !== "0";
const FORCE_ERROR = env("PAYLOAD_FORCE_ERROR", "0") === "1";
type LogLevel = "debug" | "info" | "warn" | "error";
const LEVEL: LogLevel = (() => {
  const v = env("PAYLOAD_LOG_LEVEL", "error").toLowerCase();
  return (["debug", "info", "warn", "error"] as const).includes(v as LogLevel)
    ? (v as LogLevel)
    : "error";
})();
const ONLY_COLLECTIONS = env("DEBUG_COLLECTIONS", "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const EXCLUDE_COLLECTIONS = env("DEBUG_COLLECTIONS_EXCLUDE", "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const LOG_OTHER = env("PAYLOAD_LOG_OTHER", "1") !== "0";

/** ===== level ordering ===== */
const levelOrder: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const minLevel = levelOrder[LEVEL];

/** ===== input normalization ===== */
type AnyObj = Record<string, unknown>;

function isError(x: unknown): x is Error {
  return !!x && typeof x === "object" && "message" in (x as Record<string, unknown>);
}
function toErrorObj(err: Error): AnyObj {
  const base: Record<string, unknown> = {
    name: err.name,
    message: err.message,
    stack: err.stack ?? "",
  };
  const extra: Record<string, unknown> = {};
  const raw = err as unknown as Record<string, unknown>;
  for (const k of Object.getOwnPropertyNames(err)) {
    if (!(k in base)) extra[k] = raw[k];
  }
  return { err: { ...base, ...extra } };
}

function normalize(args: unknown[]): { obj: AnyObj; msg: string; rest: unknown[] } {
  if (args.length === 0) return { obj: {}, msg: "", rest: [] };
  const first = args[0];

  if (typeof first === "object" && first !== null) {
    const maybeMsg = typeof args[1] === "string" ? (args[1] as string) : "";
    const rest = typeof args[1] === "string" ? args.slice(2) : args.slice(1);
    if (isError(first)) return { obj: toErrorObj(first), msg: maybeMsg, rest };
    return { obj: first as AnyObj, msg: maybeMsg, rest };
  }
  if (typeof first === "string") return { obj: {}, msg: first, rest: args.slice(1) };
  return { obj: {}, msg: String(first), rest: args.slice(1) };
}

/** ===== collection filtering ===== */
function pickCollection(meta: AnyObj): string | null {
  if (typeof meta.collection === "string") return meta.collection;
  const data =
    meta.data && typeof meta.data === "object" ? (meta.data as Record<string, unknown>) : null;
  if (data && typeof data.collection === "string") return data.collection;
  return null;
}

function shouldLog(level: LogLevel, meta: AnyObj): boolean {
  if (!ENABLED && !(FORCE_ERROR && level === "error")) return false; // keep error if forced
  if (levelOrder[level] < minLevel) return false;

  const coll = pickCollection(meta);
  if (!coll) return LOG_OTHER;

  if (ONLY_COLLECTIONS.length > 0 && !ONLY_COLLECTIONS.includes(coll)) return false;
  if (EXCLUDE_COLLECTIONS.length > 0 && EXCLUDE_COLLECTIONS.includes(coll)) return false;

  return true;
}

/** ===== base pino ===== */
const baseOptions: LoggerOptions = {
  level: LEVEL,
  msgPrefix: "",
};
const base: PinoLogger = pino(baseOptions);

/** ===== wrapped API (object first, then message) ===== */
type LevelFn = (...args: unknown[]) => void;

function wrap(method: LogLevel, tag: "DEBUG" | "INFO" | "WARN" | "ERROR"): LevelFn {
  // pino signature: logger[level](obj, msg?, ...args)
  const pinoFn = base[method] as unknown as (
    obj: AnyObj,
    msg?: string,
    ...args: unknown[]
  ) => void;

  return (...args: unknown[]) => {
    const { obj, msg, rest } = normalize(args);
    if (!shouldLog(method, obj)) return;
    const prefixed = msg && msg.length > 0 ? `[PAYLOAD:${tag}] ${msg}` : `[PAYLOAD:${tag}]`;
    pinoFn(obj, prefixed, ...rest);
  };
}

export const logger = {
  debug: wrap("debug", "DEBUG"),
  info: wrap("info", "INFO"),
  warn: wrap("warn", "WARN"),
  error: wrap("error", "ERROR"),
};

export default logger;
