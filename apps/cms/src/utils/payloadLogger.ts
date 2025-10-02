// FILE: apps/cms/src/utils/payloadLogger.ts
// Language: TypeScript

import pino, { type Logger, type LoggerOptions } from "pino";

/** ===== env helpers ===== */
function env(k: string, def = ""): string {
  const v = process.env[k];
  return typeof v === "string" ? v : def;
}

type LogLevel = "debug" | "info" | "warn" | "error";
const ENABLED = env("PAYLOAD_LOG_ENABLE", "1") !== "0";
const FORCE_ERROR = env("PAYLOAD_FORCE_ERROR", "0") === "1";
const LEVEL = ((): LogLevel => {
  const v = env("PAYLOAD_LOG_LEVEL", "error").toLowerCase();
  return (["debug", "info", "warn", "error"] as const).includes(v as LogLevel) ? (v as LogLevel) : "error";
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

/** Pick collection from the first arg (Payload calls logger like logger.info({ collection: 'x', ... }, msg)) */
function pickCollection(meta: unknown): string | null {
  if (!meta || typeof meta !== "object") return null;
  const obj = meta as Record<string, unknown>;
  if (typeof obj.collection === "string") return obj.collection;
  const data = obj.data && typeof obj.data === "object" ? (obj.data as Record<string, unknown>) : null;
  if (data && typeof data.collection === "string") return data.collection;
  return null;
}

/** Should we emit this line at all? */
function shouldLog(meta: unknown): boolean {
  if (!ENABLED) return false; // payload logs are noisy; opt-in by default
  const coll = pickCollection(meta);
  if (!coll) return LOG_OTHER;
  if (ONLY_COLLECTIONS.length > 0 && !ONLY_COLLECTIONS.includes(coll)) return false;
  if (EXCLUDE_COLLECTIONS.length > 0 && EXCLUDE_COLLECTIONS.includes(coll)) return false;
  return true;
}

/** Pino options
 *  - use hooks.logMethod to:
 *    • drop lines we don’t want
 *    • add a readable prefix so “msg” isn’t blank
 */
const options: LoggerOptions = {
  level: LEVEL,
  base: undefined, // don’t auto-add pid/hostname
  messageKey: "msg",
  hooks: {
    logMethod(inputArgs, method) {
      try {
        // Expect shape: (obj, msg?, ...rest)
        const [first, maybeMsg, ...rest] = inputArgs;

        // Always allow fatal/error even if filtering is disabled and FORCE_ERROR is set
        // (We can’t see the exact level here; keep it simple and rely on pino level for severity)
        if (!shouldLog(first)) return;

        let msg = typeof maybeMsg === "string" ? maybeMsg : "";
        // Add a simple prefix if caller didn’t provide a message
        if (!msg || msg.trim().length === 0) {
          msg = "[PAYLOAD]"; // keep the line readable instead of just an object
          // keep input as (first, msg, ...rest)
          method.apply(this, [first ?? {}, msg, ...rest]);
          return;
        }
        // If a message exists, just pass through (no double-prefixing)
        method.apply(this, [first ?? {}, msg, ...rest]);
      } catch {
        // On any parsing issue, just pass through untouched
        method.apply(this, inputArgs);
      }
    },
  },
};

export const payloadEnvLogger: Logger = pino(options);
export default payloadEnvLogger;
