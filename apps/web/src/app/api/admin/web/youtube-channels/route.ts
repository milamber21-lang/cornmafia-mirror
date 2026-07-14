//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/admin/web/youtube-channels/route.ts                                              ////
//// Language: TS                                                                                               ////
//// DB-first admin YouTube channel allowlist API                                                               ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { NextRequest, NextResponse } from "next/server";

import {
	createYoutubeChannelAdmin,
	deleteYoutubeChannelAdmin,
	findYoutubeChannelAdminById,
	listYoutubeChannelsAdmin,
	updateYoutubeChannelAdmin,
} from "@/lib/data/youtube-channels";
import {
	classifyAdminMutationError,
	jsonError,
	normalizeNonEmptyString,
	normalizeNullableString,
	parsePositiveInt,
	parseRequiredBoolean,
	requireActorDiscordId,
	requireAdminResponse,
	type ApiErrorCode,
} from "@/lib/server/admin-route";

export const dynamic = "force-dynamic";

type CreateBody = {
	channelExternalId?: unknown;
	channelHandle?: unknown;
	channelTitle?: unknown;
	channelUrl?: unknown;
	comment?: unknown;
	enabled?: unknown;
};

type UpdateBody = {
	channelHandle?: unknown;
	channelTitle?: unknown;
	channelUrl?: unknown;
	comment?: unknown;
	enabled?: unknown;
};

type MutationParseResult =
	| {
			ok: true;
			channelExternalId: string | null;
			channelHandle: string | null;
			channelTitle: string;
			channelUrl: string | null;
			comment: string | null;
			enabled: boolean;
	  }
	| { ok: false; message: string };

const CHANNEL_ID_PATTERN = /^UC[A-Za-z0-9_-]{22}$/;
const CHANNEL_HANDLE_PATTERN = /^@[A-Za-z0-9._-]{3,64}$/;

function asObject(value: unknown): Record<string, unknown> | null {
	return value && typeof value === "object" && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: null;
}

function classifyYoutubeChannelError(error: unknown): {
	code: ApiErrorCode;
	status: number;
	message: string;
} {
	return classifyAdminMutationError(
		error,
		"Failed to process YouTube channel request.",
	);
}

function normalizeYoutubeHandle(value: unknown): string | null {
	const normalized = normalizeNullableString(value);
	if (!normalized) {
		return null;
	}

	return normalized.startsWith("@") ? normalized : `@${normalized}`;
}

function normalizeChannelUrl(value: unknown): string | null {
	const normalized = normalizeNullableString(value);
	if (!normalized) {
		return null;
	}

	try {
		const url = new URL(normalized);
		return url.protocol === "https:" ? url.toString() : null;
	} catch {
		return null;
	}
}

function parseMutationData(
	data: CreateBody | UpdateBody,
	options: {
		requireExternalId: boolean;
	},
): MutationParseResult {
	const channelExternalId = options.requireExternalId
		? normalizeNonEmptyString((data as CreateBody).channelExternalId)
		: null;
	const channelHandle = normalizeYoutubeHandle(data.channelHandle);
	const channelTitle = normalizeNonEmptyString(data.channelTitle);
	const channelUrlRaw = normalizeNullableString(data.channelUrl);
	const channelUrl = normalizeChannelUrl(data.channelUrl);
	const comment = normalizeNullableString(data.comment);
	const enabled = parseRequiredBoolean(data.enabled);

	if (options.requireExternalId && !channelExternalId) {
		return { ok: false, message: "Channel ID is required." };
	}

	if (channelExternalId && !CHANNEL_ID_PATTERN.test(channelExternalId)) {
		return {
			ok: false,
			message: "Channel ID must be a stable YouTube UC... channel ID.",
		};
	}

	if (channelHandle && !CHANNEL_HANDLE_PATTERN.test(channelHandle)) {
		return {
			ok: false,
			message:
				"Handle must use @ plus 3-64 letters, numbers, dots, dashes, or underscores.",
		};
	}

	if (!channelTitle) {
		return { ok: false, message: "Title is required." };
	}

	if (channelUrlRaw && !channelUrl) {
		return { ok: false, message: "Channel URL must be a valid https URL." };
	}

	if (enabled === null) {
		return { ok: false, message: "Enabled flag is required." };
	}

	return {
		ok: true,
		channelExternalId,
		channelHandle,
		channelTitle,
		channelUrl,
		comment,
		enabled,
	};
}

export async function GET(): Promise<Response> {
	const guardResponse = await requireAdminResponse();
	if (guardResponse) {
		return guardResponse;
	}

	try {
		const rows = await listYoutubeChannelsAdmin();
		return NextResponse.json({ rows }, { status: 200 });
	} catch (error: unknown) {
		const classified = classifyYoutubeChannelError(error);
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

	const payload = asObject(body);
	if (!payload) {
		return jsonError("VALIDATION_REQUIRED", "Invalid request body.", 400);
	}

	const op = typeof payload.op === "string" ? payload.op : null;
	if (!op) {
		return jsonError("VALIDATION_REQUIRED", "Missing op.", 400);
	}

	try {
		if (op === "create") {
			const data = asObject(payload.data) as CreateBody | null;
			if (!data) {
				return jsonError("VALIDATION_REQUIRED", "Missing data.", 400);
			}

			const parsed = parseMutationData(data, { requireExternalId: true });
			if (!parsed.ok) {
				return jsonError("VALIDATION_REQUIRED", parsed.message, 400);
			}

			if (!parsed.channelExternalId) {
				return jsonError("VALIDATION_REQUIRED", "Channel ID is required.", 400);
			}

			const createdId = await createYoutubeChannelAdmin({
				actorDiscordId,
				channelExternalId: parsed.channelExternalId,
				channelHandle: parsed.channelHandle,
				channelTitle: parsed.channelTitle,
				channelUrl: parsed.channelUrl,
				comment: parsed.comment,
				enabled: parsed.enabled,
			});

			const doc = createdId ? await findYoutubeChannelAdminById(createdId) : null;
			return NextResponse.json({ ok: true, doc }, { status: 200 });
		}

		if (op === "update") {
			const youtubeChannelId = parsePositiveInt(payload.id);
			if (youtubeChannelId === null) {
				return jsonError("VALIDATION_REQUIRED", "Missing id.", 400);
			}

			const data = asObject(payload.data) as UpdateBody | null;
			if (!data) {
				return jsonError("VALIDATION_REQUIRED", "Missing data.", 400);
			}

			const parsed = parseMutationData(data, { requireExternalId: false });
			if (!parsed.ok) {
				return jsonError("VALIDATION_REQUIRED", parsed.message, 400);
			}

			await updateYoutubeChannelAdmin({
				actorDiscordId,
				youtubeChannelId,
				channelHandle: parsed.channelHandle,
				channelTitle: parsed.channelTitle,
				channelUrl: parsed.channelUrl,
				comment: parsed.comment,
				enabled: parsed.enabled,
			});

			const doc = await findYoutubeChannelAdminById(youtubeChannelId);
			return NextResponse.json({ ok: true, doc }, { status: 200 });
		}

		if (op === "toggle") {
			const youtubeChannelId = parsePositiveInt(payload.id);
			if (youtubeChannelId === null) {
				return jsonError("VALIDATION_REQUIRED", "Missing id.", 400);
			}

			const existing = await findYoutubeChannelAdminById(youtubeChannelId);
			if (!existing) {
				return jsonError(
					"NOT_FOUND",
					`YouTube channel row ${String(youtubeChannelId)} was not found.`,
					404,
				);
			}

			await updateYoutubeChannelAdmin({
				actorDiscordId,
				youtubeChannelId,
				channelHandle: existing.channelHandle,
				channelTitle: existing.channelTitle,
				channelUrl: existing.channelUrl,
				comment: existing.comment,
				enabled: !existing.enabled,
			});

			const doc = await findYoutubeChannelAdminById(youtubeChannelId);
			return NextResponse.json({ ok: true, doc }, { status: 200 });
		}

		if (op === "delete") {
			const youtubeChannelId = parsePositiveInt(payload.id);
			if (youtubeChannelId === null) {
				return jsonError("VALIDATION_REQUIRED", "Missing id.", 400);
			}

			await deleteYoutubeChannelAdmin({ actorDiscordId, youtubeChannelId });
			return NextResponse.json({ ok: true }, { status: 200 });
		}

		return jsonError("VALIDATION_REQUIRED", `Unsupported op: ${op}`, 400);
	} catch (error: unknown) {
		const classified = classifyYoutubeChannelError(error);
		return jsonError(classified.code, classified.message, classified.status);
	}
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
