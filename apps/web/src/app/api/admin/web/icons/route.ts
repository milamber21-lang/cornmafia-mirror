//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/admin/web/icons/route.ts                                                           ////
//// Language: TS                                                                                                  ////
//// Admin API route for web icon list and mutation operations                                                     ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { NextRequest, NextResponse } from "next/server";

import {
	createIconAdmin,
	deleteIconAdmin,
	updateIconAdmin,
} from "@/lib/data/admin-web-actions";
import {
	findIconAdminById,
	listIconsAdmin,
	type IconAdminItem,
} from "@/lib/data/icons";
import type { IconSourceCode } from "@/lib/helpers/icons";
import {
	classifyAdminMutationError,
	jsonError,
	normalizeNonEmptyString,
	parsePositiveInt,
	requireActorDiscordId,
	requireAdminResponse,
} from "@/lib/server/admin-route";

export const dynamic = "force-dynamic";

type MutationBody = {
	op?: "create" | "update" | "toggle" | "delete";
	id?: string | number;
	data?: {
		key?: unknown;
		label?: unknown;
		enabled?: unknown;
		source?: unknown;
		lucideName?: unknown;
		iconMedia?: unknown;
		mediaId?: unknown;
	};
};

function normalizeSource(value: unknown): IconSourceCode {
	return value === "media" ? "media" : "lucide";
}

function classifyIconError(error: unknown) {
	const classified = classifyAdminMutationError(
		error,
		"Failed to process icon request.",
	);
	if (classified.code === "VALIDATION_REQUIRED") {
		const normalized = classified.message.toLowerCase();
		if (normalized.includes("only svg media is allowed")) {
			return { ...classified, message: classified.message };
		}
	}
	return classified;
}

function toResponseDoc(icon: IconAdminItem) {
	return {
		id: icon.id,
		key: icon.key ?? "",
		label: icon.label ?? "",
		enabled: icon.enabled ?? false,
		source: icon.source,
		lucideName: icon.lucideName,
		iconMedia: icon.iconMedia,
		createdAt: icon.createdAt,
		updatedAt: icon.updatedAt,
	};
}

export async function GET(): Promise<Response> {
	const guardResponse = await requireAdminResponse();
	if (guardResponse) {
		return guardResponse;
	}

	try {
		const rows = await listIconsAdmin();
		return NextResponse.json({ rows: rows.map(toResponseDoc) });
	} catch (error: unknown) {
		const classified = classifyIconError(error);
		return jsonError(classified.code, classified.message, classified.status);
	}
}

export async function POST(request: NextRequest): Promise<Response> {
	const actorDiscordIdOrResponse = await requireActorDiscordId();
	if (actorDiscordIdOrResponse instanceof NextResponse) {
		return actorDiscordIdOrResponse;
	}

	const actorDiscordId = actorDiscordIdOrResponse;

	let payload: MutationBody;
	try {
		payload = (await request.json()) as MutationBody;
	} catch {
		return jsonError("VALIDATION_REQUIRED", "Invalid JSON body.", 400);
	}

	const op = payload.op;
	if (!op) {
		return jsonError("VALIDATION_REQUIRED", "Missing op.", 400);
	}

	try {
		if (op === "delete") {
			const iconId = parsePositiveInt(payload.id);
			if (!iconId) {
				return jsonError("VALIDATION_REQUIRED", "Missing id.", 400);
			}

			await deleteIconAdmin(actorDiscordId, iconId);
			return NextResponse.json({ ok: true });
		}

		if (op === "toggle") {
			const iconId = parsePositiveInt(payload.id);
			if (!iconId) {
				return jsonError("VALIDATION_REQUIRED", "Missing id.", 400);
			}

			const current = await findIconAdminById(iconId);
			if (!current) {
				return jsonError("NOT_FOUND", "Icon not found.", 404);
			}

			await updateIconAdmin({
				actorDiscordId,
				iconId,
				label: current.label ?? current.key ?? "Icon",
				source: current.source,
				lucideName:
					current.source === "lucide"
						? (current.lucideName ?? current.key ?? null)
						: null,
				mediaId:
					current.source === "media"
						? parsePositiveInt(current.iconMedia?.id)
						: null,
				enabled: !(current.enabled ?? false),
			});

			const updated = await findIconAdminById(iconId);
			return NextResponse.json({
				ok: true,
				doc: updated ? toResponseDoc(updated) : null,
			});
		}

		const body = payload.data ?? {};
		const source = normalizeSource(body.source);
		const label = normalizeNonEmptyString(body.label);
		const key = normalizeNonEmptyString(body.key);
		const enabled =
			typeof body.enabled === "boolean" ? body.enabled : Boolean(body.enabled);
		const mediaId = parsePositiveInt(body.iconMedia ?? body.mediaId);
		const lucideName = normalizeNonEmptyString(body.lucideName);

		if (!label) {
			return jsonError("VALIDATION_REQUIRED", "Label is required.", 400);
		}

		if (source === "media" && !mediaId) {
			return jsonError(
				"VALIDATION_REQUIRED",
				"Please select an SVG media file.",
				400,
			);
		}

		if (source === "lucide" && !(lucideName ?? key)) {
			return jsonError(
				"VALIDATION_REQUIRED",
				"Lucide name is required when source is lucide.",
				400,
			);
		}

		if (op === "create") {
			if (!key) {
				return jsonError("VALIDATION_REQUIRED", "Key is required.", 400);
			}

			await createIconAdmin({
				actorDiscordId,
				key,
				label,
				source,
				lucideName: source === "lucide" ? (lucideName ?? key) : null,
				mediaId: source === "media" ? mediaId : null,
				enabled,
			});

			const rows = await listIconsAdmin();
			const created = rows.find((row) => row.key === key) ?? null;
			return NextResponse.json({
				ok: true,
				doc: created ? toResponseDoc(created) : null,
			});
		}

		if (op === "update") {
			const iconId = parsePositiveInt(payload.id);
			if (!iconId) {
				return jsonError("VALIDATION_REQUIRED", "Missing id.", 400);
			}

			await updateIconAdmin({
				actorDiscordId,
				iconId,
				label,
				source,
				lucideName: source === "lucide" ? (lucideName ?? null) : null,
				mediaId: source === "media" ? mediaId : null,
				enabled,
			});

			const updated = await findIconAdminById(iconId);
			return NextResponse.json({
				ok: true,
				doc: updated ? toResponseDoc(updated) : null,
			});
		}

		return jsonError("VALIDATION_REQUIRED", `Unsupported op: ${String(op)}`, 400);
	} catch (error: unknown) {
		const classified = classifyIconError(error);
		return jsonError(classified.code, classified.message, classified.status);
	}
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
