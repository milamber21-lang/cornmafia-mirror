//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/server/env.ts                                                                      ////
//// Language: TS                                                                                               ////
//// Central server-side environment validation for runtime secrets, URLs, and DB role boundaries.               ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import "server-only";

const OWNER_DATABASE_USERS = new Set(["cm", "postgres", "root", "admin", "owner"]);

const BLOCKED_EXACT_VALUES = new Set([
	"",
	"changeme",
	"change_me",
	"dummy",
	"dummy_client_id",
	"dummy_client_secret",
	"example",
	"placeholder",
	"replace_me",
	"secret",
	"secret_key",
	"secret_key=",
	"todo",
]);

const BLOCKED_VALUE_FRAGMENTS = [
	"__discord_",
	"__generate",
	"__secret",
	"generate_",
	"replace_",
	"secret_data",
	"secret_key",
] as const;

type RequiredEnvOptions = {
	minProductionLength?: number;
};

let runtimeEnvValidated = false;

function isProductionRuntime(): boolean {
	return process.env.NODE_ENV === "production";
}

function isNextBuildPhase(): boolean {
	return (
		process.env.NEXT_PHASE === "phase-production-build" ||
		process.env.npm_lifecycle_event === "build"
	);
}

function buildSafePlaceholder(name: string): string {
	return `build-time-${name.toLowerCase().replace(/_/g, "-")}`;
}

function normalizeEnvValue(value: string | undefined): string {
	return typeof value === "string" ? value.trim() : "";
}

function isPlaceholderValue(value: string): boolean {
	const normalized = value.trim().toLowerCase();

	if (BLOCKED_EXACT_VALUES.has(normalized)) {
		return true;
	}

	if (normalized.startsWith("__") && normalized.endsWith("__")) {
		return true;
	}

	return BLOCKED_VALUE_FRAGMENTS.some((fragment) =>
		normalized.includes(fragment),
	);
}

function assertUsableEnvValue(name: string, value: string): void {
	if (!value) {
		throw new Error(`Missing required env: ${name}`);
	}

	if (isPlaceholderValue(value)) {
		throw new Error(`Env ${name} still contains a placeholder value.`);
	}
}

function parseUrl(name: string, value: string): URL {
	try {
		return new URL(value);
	} catch {
		throw new Error(`Env ${name} must be a valid URL.`);
	}
}

function assertHttpUrl(name: string, value: string): void {
	const parsed = parseUrl(name, value);
	if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
		throw new Error(`Env ${name} must use http or https.`);
	}

	if (
		isProductionRuntime() &&
		name !== "WEB_INTERNAL_URL" &&
		parsed.protocol !== "https:"
	) {
		throw new Error(`Env ${name} must use https in production.`);
	}

	if (isProductionRuntime() && name !== "WEB_INTERNAL_URL") {
		const hostname = parsed.hostname.toLowerCase();
		if (hostname === "localhost" || hostname.includes("example")) {
			throw new Error(`Env ${name} must not use a placeholder host in production.`);
		}
	}
}

function assertAbsolutePath(name: string, value: string): void {
	if (!value.startsWith("/")) {
		throw new Error(`Env ${name} must be an absolute in-container path.`);
	}
}

function getFirstRequiredEnv(names: readonly string[]): string {
	for (const name of names) {
		const value = normalizeEnvValue(process.env[name]);
		if (value) {
			assertUsableEnvValue(name, value);
			return value;
		}
	}

	throw new Error(`Missing required env: ${names.join(" or ")}`);
}

export function getOptionalEnv(name: string): string | null {
	const value = normalizeEnvValue(process.env[name]);

	if (!value) {
		return null;
	}

	if (isPlaceholderValue(value)) {
		throw new Error(`Env ${name} still contains a placeholder value.`);
	}

	return value;
}

export function getRequiredEnv(
	name: string,
	options: RequiredEnvOptions = {},
): string {
	const value = normalizeEnvValue(process.env[name]);
	assertUsableEnvValue(name, value);

	if (
		isProductionRuntime() &&
		typeof options.minProductionLength === "number" &&
		value.length < options.minProductionLength
	) {
		throw new Error(
			`Env ${name} must be at least ${options.minProductionLength} characters in production.`,
		);
	}

	return value;
}

export function getRequiredSecretEnv(
	name: string,
	minProductionLength = 32,
): string {
	return getRequiredEnv(name, { minProductionLength });
}

export function getRequiredBuildSafeEnv(
	name: string,
	options: RequiredEnvOptions = {},
): string {
	const value = normalizeEnvValue(process.env[name]);

	if (!value && isNextBuildPhase()) {
		return buildSafePlaceholder(name);
	}

	return getRequiredEnv(name, options);
}

export function getRequiredBuildSafeSecretEnv(
	name: string,
	minProductionLength = 32,
): string {
	return getRequiredBuildSafeEnv(name, { minProductionLength });
}

export function getRequiredHttpUrlEnv(name: string): string {
	const value = getRequiredEnv(name);
	assertHttpUrl(name, value);
	return value;
}

export function getRequiredAbsolutePathEnv(name: string): string {
	const value = getRequiredEnv(name);
	assertAbsolutePath(name, value);
	return value;
}

export function getOptionalAbsolutePathEnv(name: string): string | null {
	const value = getOptionalEnv(name);

	if (!value) {
		return null;
	}

	assertAbsolutePath(name, value);
	return value;
}

export function getRuntimeDatabaseUrl(): string {
	const value = getFirstRequiredEnv(["WEB_DATABASE_URL", "DATABASE_URL"]);
	const parsed = parseUrl("WEB_DATABASE_URL or DATABASE_URL", value);

	if (parsed.protocol !== "postgresql:" && parsed.protocol !== "postgres:") {
		throw new Error("WEB_DATABASE_URL or DATABASE_URL must use postgresql protocol.");
	}

	const runtimeUser = decodeURIComponent(parsed.username).trim().toLowerCase();
	if (!runtimeUser) {
		throw new Error("WEB_DATABASE_URL or DATABASE_URL must include a runtime database user.");
	}

	if (isProductionRuntime() && OWNER_DATABASE_USERS.has(runtimeUser)) {
		throw new Error(
			`WEB_DATABASE_URL must not use owner database user '${runtimeUser}' in production. Use cm_client.`,
		);
	}

	return value;
}

export function assertOwnerDatabaseUrlNotExposed(): void {
	if (isProductionRuntime() && getOptionalEnv("CM_OWNER_DATABASE_URL")) {
		throw new Error(
			"CM_OWNER_DATABASE_URL must not be exposed to the cm-web runtime container.",
		);
	}
}

export function assertWebRuntimeEnvReady(): void {
	if (runtimeEnvValidated) {
		return;
	}

	getRequiredEnv("NODE_ENV");
	getRequiredEnv("PORT");
	getRequiredHttpUrlEnv("WEB_INTERNAL_URL");
	getRequiredHttpUrlEnv("WEB_PUBLIC_URL");
	getRequiredHttpUrlEnv("NEXTAUTH_URL");
	getRequiredHttpUrlEnv("NEXT_PUBLIC_BASE_URL");
	getRequiredSecretEnv("NEXTAUTH_SECRET", 32);
	getRequiredSecretEnv("REVALIDATE_TOKEN", 32);
	getRequiredEnv("DISCORD_CLIENT_ID");
	getRequiredSecretEnv("DISCORD_CLIENT_SECRET", 16);
	getRequiredSecretEnv("DISCORD_BOT_TOKEN", 16);
	getRequiredEnv("DISCORD_GUILD_ID");
	getRuntimeDatabaseUrl();
	getRequiredAbsolutePathEnv("WEB_MEDIA_ROOT");
	getOptionalAbsolutePathEnv("WEB_CACHE_ROOT");
	getOptionalAbsolutePathEnv("CM_TILES_ROOT");
	getOptionalAbsolutePathEnv("CM_PUBLIC_ROOT");
	assertOwnerDatabaseUrlNotExposed();

	runtimeEnvValidated = true;
}
