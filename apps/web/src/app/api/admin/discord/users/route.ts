//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/admin/discord/users/route.ts                                                       ////
//// Language: TS                                                                                                  ////
//// DB-first admin Discord users API with shared admin route helpers and server-driven list responses            ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { NextRequest, NextResponse } from "next/server";

import {
	listDiscordUsersAdminPage,
	updateDiscordUserNotesAdmin,
	type DiscordAdminSortDir,
	type DiscordUserAdminSortBy,
} from "@/lib/data/admin-discord";
import {
	classifyAdminMutationError,
	jsonError,
	normalizeNullableString,
	parsePageParam,
	parsePageSizeParam,
	parsePositiveInt,
	requireActorDiscordId,
	requireAdminResponse,
} from "@/lib/server/admin-route";

export const dynamic = "force-dynamic";


const USER_SORT_BY_VALUES = new Set<DiscordUserAdminSortBy>([
	"discordId",
	"username",
	"globalName",
	"member",
	"roleSync",
	"notes",
]);

function normalizeUserSortBy(value: string | null): DiscordUserAdminSortBy {
	return value && USER_SORT_BY_VALUES.has(value as DiscordUserAdminSortBy)
		? (value as DiscordUserAdminSortBy)
		: "username";
}

function normalizeSortDir(value: string | null): DiscordAdminSortDir {
	return value === "desc" ? "desc" : "asc";
}

type UpdateBody = {
	op?: "update" | "create" | "delete" | "setIsMember";
	id?: string | number;
	data?: {
		notes?: string | null;
	};
};

export async function GET(req: NextRequest): Promise<Response> {
	const guardResponse = await requireAdminResponse();
	if (guardResponse) {
		return guardResponse;
	}

	const { searchParams } = new URL(req.url);
	const search = (searchParams.get("search") ?? "").trim();
	const page = parsePageParam(searchParams.get("page"));
	const pageSize = parsePageSizeParam(searchParams.get("pageSize"), {
		defaultPageSize: 20,
		maxPageSize: 1000,
	});
	const sortBy = normalizeUserSortBy(searchParams.get("sortBy"));
	const sortDir = normalizeSortDir(searchParams.get("sortDir"));

	try {
		const result = await listDiscordUsersAdminPage({
			search,
			page,
			pageSize,
			sortBy,
			sortDir,
		});

		return NextResponse.json(result, { status: 200 });
	} catch (error: unknown) {
		const classified = classifyAdminMutationError(error, "Failed to load users.");
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

	if (typeof body !== "object" || body === null) {
		return jsonError("VALIDATION_REQUIRED", "Invalid request body.", 400);
	}

	const payload = body as UpdateBody;
	const op = payload.op ?? "update";

	if (op !== "update") {
		return jsonError(
			"VALIDATION_REQUIRED",
			"discord_users current truth is system-owned. Admin UI may update notes only in the DB-first flow.",
			400,
		);
	}

	const discordUserId = parsePositiveInt(payload.id);
	if (discordUserId === null) {
		return jsonError("VALIDATION_REQUIRED", "Missing id.", 400);
	}

	const notes = normalizeNullableString(payload.data?.notes);

	try {
		const doc = await updateDiscordUserNotesAdmin({
			actorDiscordId,
			discordUserId,
			notes,
		});

		return NextResponse.json({ ok: true, doc }, { status: 200 });
	} catch (error: unknown) {
		const classified = classifyAdminMutationError(error, "Operation failed.");
		return jsonError(classified.code, classified.message, classified.status);
	}
}
