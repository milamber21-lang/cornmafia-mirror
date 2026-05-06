//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/admin/discord/roles/route.ts                                                       ////
//// Language: TS                                                                                                  ////
//// DB-first admin Discord roles API with shared admin route helpers and server-driven list responses            ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { NextRequest, NextResponse } from "next/server";

import {
	createDiscordRoleAdmin,
	deleteDiscordRoleAdmin,
	findDiscordRoleAdminById,
	listDiscordRolesAdminPage,
	updateDiscordRoleAdmin,
	type DiscordAdminSortDir,
	type DiscordRoleAdminSortBy,
	type DiscordRoleSourceCode,
} from "@/lib/data/admin-discord";
import {
	classifyAdminMutationError,
	jsonError,
	normalizeNonEmptyString,
	parseBoolean,
	parseNonNegativeInt,
	parsePageParam,
	parsePageSizeParam,
	parsePositiveInt,
	requireActorDiscordId,
	requireAdminResponse,
} from "@/lib/server/admin-route";
import type { AdminRouteError } from "@/lib/server/admin-route";

export const dynamic = "force-dynamic";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 1000;


const ROLE_SORT_BY_VALUES = new Set<DiscordRoleAdminSortBy>([
	"name",
	"source",
	"roleId",
	"rank",
]);

function normalizeRoleSortBy(value: string | null): DiscordRoleAdminSortBy {
	return value && ROLE_SORT_BY_VALUES.has(value as DiscordRoleAdminSortBy)
		? (value as DiscordRoleAdminSortBy)
		: "name";
}

function normalizeSortDir(value: string | null): DiscordAdminSortDir {
	return value === "desc" ? "desc" : "asc";
}

type PostBody = {
	op?: "create" | "update" | "delete";
	id?: string | number;
	data?: {
		name?: unknown;
		source?: unknown;
		roleId?: unknown;
		rank?: unknown;
		colorHex?: unknown;
		isAccessRole?: unknown;
		fullEditorialAccess?: unknown;
		isAdmin?: unknown;
		isPublicDefault?: unknown;
		isAuthenticatedDefault?: unknown;
	};
};

function normalizeSource(value: unknown): DiscordRoleSourceCode {
	return value === "virtual" ? "virtual" : "discord";
}

function classifyDiscordRoleMutationError(error: unknown): AdminRouteError {
	const message =
		error instanceof Error
			? error.message
			: "Failed to process Discord roles request.";
	const normalized = message.toLowerCase();

	if (normalized.includes("discord_roles_virtual_name_uq")) {
		return {
			code: "VALIDATION_REQUIRED",
			message: "A virtual role with this name already exists.",
			status: 400,
		};
	}

	return classifyAdminMutationError(
		error,
		"Failed to process Discord roles request.",
	);
}

function cleanHexMaybe(value: unknown): string | null {
	if (typeof value !== "string") {
		return null;
	}

	const trimmedValue = value.trim();
	if (!trimmedValue) {
		return null;
	}

	const prefixed = trimmedValue.startsWith("#")
		? trimmedValue
		: `#${trimmedValue}`;
	return prefixed.toUpperCase();
}

function normalizeRoleId(value: unknown): string | null {
	return typeof value === "string" && value.trim().length > 0
		? value.trim()
		: null;
}

function parseRoleId(id: string | number | undefined): number | null {
	return parsePositiveInt(id);
}

export async function GET(req: NextRequest): Promise<Response> {
	const guardResponse = await requireAdminResponse();
	if (guardResponse) {
		return guardResponse;
	}

	const { searchParams } = new URL(req.url);
	const search = (searchParams.get("search") ?? "").trim();
	const page = parsePageParam(searchParams.get("page"));
	const pageSize = parsePageSizeParam(searchParams.get("pageSize"), {
		defaultPageSize: DEFAULT_PAGE_SIZE,
		maxPageSize: MAX_PAGE_SIZE,
	});
	const sortBy = normalizeRoleSortBy(searchParams.get("sortBy"));
	const sortDir = normalizeSortDir(searchParams.get("sortDir"));

	try {
		const result = await listDiscordRolesAdminPage({
			search,
			page,
			pageSize,
			sortBy,
			sortDir,
		});

		return NextResponse.json(result, { status: 200 });
	} catch (error: unknown) {
		const classified = classifyAdminMutationError(
			error,
			"Failed to fetch roles.",
		);
		return jsonError(classified.code, classified.message, classified.status);
	}
}

export async function POST(req: NextRequest): Promise<Response> {
	const actorDiscordIdOrResponse = await requireActorDiscordId();
	if (actorDiscordIdOrResponse instanceof NextResponse) {
		return actorDiscordIdOrResponse;
	}

	const actorDiscordId = actorDiscordIdOrResponse;

	let body: unknown;
	try {
		body = await req.json();
	} catch {
		return jsonError("VALIDATION_REQUIRED", "Invalid JSON body.", 400);
	}

	const payload = (body ?? null) as PostBody | null;
	const op = payload?.op;
	if (!op) {
		return jsonError("VALIDATION_REQUIRED", "Missing op.", 400);
	}

	try {
		if (op === "delete") {
			const id = parseRoleId(payload?.id);
			if (id === null) {
				return jsonError("VALIDATION_REQUIRED", "Missing id.", 400);
			}

			const doc = await deleteDiscordRoleAdmin(actorDiscordId, id);
			return NextResponse.json({ ok: true, doc });
		}

		const data = payload?.data ?? {};

		if (op === "create") {
			const name = normalizeNonEmptyString(data.name);
			const source = normalizeSource(data.source);
			const roleId = source === "discord" ? normalizeRoleId(data.roleId) : null;
			const rank = parseNonNegativeInt(data.rank) ?? 0;
			const colorHex = cleanHexMaybe(data.colorHex);
			const isAccessRole = parseBoolean(data.isAccessRole, false);

			if (!name) {
				return jsonError("VALIDATION_REQUIRED", "Name is required.", 400);
			}

			if (source === "discord" && roleId === null) {
				return jsonError(
					"VALIDATION_REQUIRED",
					"roleId is required for Discord source.",
					400,
				);
			}

			const doc = await createDiscordRoleAdmin({
				actorDiscordId,
				name,
				source,
				roleId,
				colorHex,
				rank,
				isAccessRole,
				fullEditorialAccess: parseBoolean(data.fullEditorialAccess, false),
				isAdmin: parseBoolean(data.isAdmin, false),
				isPublicDefault: parseBoolean(data.isPublicDefault, false),
				isAuthenticatedDefault: parseBoolean(
					data.isAuthenticatedDefault,
					false,
				),
			});

			return NextResponse.json({ ok: true, doc });
		}

		if (op === "update") {
			const id = parseRoleId(payload?.id);
			if (id === null) {
				return jsonError("VALIDATION_REQUIRED", "Missing id.", 400);
			}

			const existingRole = await findDiscordRoleAdminById(id);
			if (!existingRole) {
				return jsonError(
					"NOT_FOUND",
					`discord_roles row ${String(id)} was not found.`,
					404,
				);
			}

			const mergedRole = {
				name: normalizeNonEmptyString(data.name) ?? existingRole.name,
				source:
					data.source !== undefined
						? normalizeSource(data.source)
						: existingRole.source,
				roleId:
					data.roleId !== undefined
						? normalizeRoleId(data.roleId)
						: existingRole.roleId,
				colorHex:
					data.colorHex !== undefined
						? cleanHexMaybe(data.colorHex)
						: existingRole.colorHex,
				rank:
					data.rank !== undefined
						? (parseNonNegativeInt(data.rank) ?? existingRole.rank)
						: existingRole.rank,
				isAccessRole:
					data.isAccessRole !== undefined
						? parseBoolean(data.isAccessRole, existingRole.isAccessRole)
						: existingRole.isAccessRole,
				fullEditorialAccess:
					data.fullEditorialAccess !== undefined
						? parseBoolean(
								data.fullEditorialAccess,
								existingRole.fullEditorialAccess,
							)
						: existingRole.fullEditorialAccess,
				isAdmin:
					data.isAdmin !== undefined
						? parseBoolean(data.isAdmin, existingRole.isAdmin)
						: existingRole.isAdmin,
				isPublicDefault:
					data.isPublicDefault !== undefined
						? parseBoolean(data.isPublicDefault, existingRole.isPublicDefault)
						: existingRole.isPublicDefault,
				isAuthenticatedDefault:
					data.isAuthenticatedDefault !== undefined
						? parseBoolean(
								data.isAuthenticatedDefault,
								existingRole.isAuthenticatedDefault,
							)
						: existingRole.isAuthenticatedDefault,
			};

			if (!mergedRole.name) {
				return jsonError("VALIDATION_REQUIRED", "Name is required.", 400);
			}

			if (mergedRole.source === "discord" && mergedRole.roleId === null) {
				return jsonError(
					"VALIDATION_REQUIRED",
					"roleId is required for Discord source.",
					400,
				);
			}

			const doc = await updateDiscordRoleAdmin({
				actorDiscordId,
				rolePkId: id,
				name: mergedRole.name,
				source: mergedRole.source,
				roleId: mergedRole.roleId,
				colorHex: mergedRole.colorHex,
				rank: mergedRole.rank,
				isAccessRole: mergedRole.isAccessRole,
				fullEditorialAccess: mergedRole.fullEditorialAccess,
				isAdmin: mergedRole.isAdmin,
				isPublicDefault: mergedRole.isPublicDefault,
				isAuthenticatedDefault: mergedRole.isAuthenticatedDefault,
			});

			return NextResponse.json({ ok: true, doc });
		}

		return jsonError(
			"VALIDATION_REQUIRED",
			`Unsupported op: ${String(op)}.`,
			400,
		);
	} catch (error: unknown) {
		const classified = classifyDiscordRoleMutationError(error);
		return jsonError(classified.code, classified.message, classified.status);
	}
}
