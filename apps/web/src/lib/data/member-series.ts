//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/data/member-series.ts                                                               ////
//// Language: TS                                                                                               ////
//// DB-first member series list, dependency, and mutation helpers for the /me workspace.                       ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import "server-only";

import { query } from "@/lib/data/pg";

type JsonPayloadRow = {
	payload: unknown;
};

type IdRow = {
	series_id: string | number;
};

export type MemberSeriesItem = {
	id: string;
	title: string;
	slug: string;
	description: string;
	categoryId: string;
	categoryTitle: string;
	categorySlug: string;
	subcategoryId: string;
	subcategoryTitle: string;
	subcategorySlug: string;
	createdAt: string;
	updatedAt: string;
};

export type MemberSeriesDeleteBlocker = {
	contentId: string;
	title: string;
	statusCode: string;
	categoryTitle: string;
	subcategoryTitle: string;
	publicHref: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(record: Record<string, unknown>, key: string): string {
	const value = record[key];
	return typeof value === "string" ? value : "";
}

function readDateString(record: Record<string, unknown>, key: string): string {
	const value = record[key];
	if (value instanceof Date) {
		return value.toISOString();
	}
	if (typeof value === "string") {
		return value;
	}
	return "";
}

function mapSeries(value: unknown): MemberSeriesItem | null {
	if (!isRecord(value)) {
		return null;
	}

	const id = readString(value, "id");
	const title = readString(value, "title");
	const slug = readString(value, "slug");
	const categoryId = readString(value, "categoryId");
	const subcategoryId = readString(value, "subcategoryId");

	if (!id || !title || !categoryId || !subcategoryId) {
		return null;
	}

	return {
		id,
		title,
		slug,
		description: readString(value, "description"),
		categoryId,
		categoryTitle: readString(value, "categoryTitle"),
		categorySlug: readString(value, "categorySlug"),
		subcategoryId,
		subcategoryTitle: readString(value, "subcategoryTitle"),
		subcategorySlug: readString(value, "subcategorySlug"),
		createdAt: readDateString(value, "createdAt"),
		updatedAt: readDateString(value, "updatedAt"),
	};
}

function mapDeleteBlocker(value: unknown): MemberSeriesDeleteBlocker | null {
	if (!isRecord(value)) {
		return null;
	}

	const contentId = readString(value, "contentId");
	const title = readString(value, "title");

	if (!contentId || !title) {
		return null;
	}

	return {
		contentId,
		title,
		statusCode: readString(value, "statusCode"),
		categoryTitle: readString(value, "categoryTitle"),
		subcategoryTitle: readString(value, "subcategoryTitle"),
		publicHref: readString(value, "publicHref"),
	};
}

export async function listMemberSeries(
	actorDiscordId: string,
): Promise<MemberSeriesItem[]> {
	const result = await query<JsonPayloadRow>(
		`SELECT web_api.web_member_series_list($1) AS payload`,
		[actorDiscordId],
	);
	const payload = result.rows[0]?.payload;
	if (!Array.isArray(payload)) {
		return [];
	}

	return payload.flatMap((value) => {
		const mapped = mapSeries(value);
		return mapped ? [mapped] : [];
	});
}

export async function listMemberSeriesDeleteBlockers(args: {
	actorDiscordId: string;
	seriesId: string;
}): Promise<MemberSeriesDeleteBlocker[]> {
	const result = await query<JsonPayloadRow>(
		`SELECT web_api.web_member_series_delete_dependencies($1, $2::bigint) AS payload`,
		[args.actorDiscordId, args.seriesId],
	);
	const payload = result.rows[0]?.payload;
	if (!Array.isArray(payload)) {
		return [];
	}

	return payload.flatMap((value) => {
		const mapped = mapDeleteBlocker(value);
		return mapped ? [mapped] : [];
	});
}

export async function createMemberSeries(args: {
	actorDiscordId: string;
	title: string;
	description: string;
	categoryId: string;
	subcategoryId: string;
}): Promise<string | null> {
	const result = await query<IdRow>(
		`SELECT * FROM web_api.web_member_series_create($1, $2, $3, $4::bigint, $5::bigint)`,
		[
			args.actorDiscordId,
			args.title,
			args.description,
			args.categoryId,
			args.subcategoryId,
		],
	);
	const value = result.rows[0]?.series_id;
	return typeof value === "string" || typeof value === "number" ? String(value) : null;
}

export async function updateMemberSeries(args: {
	actorDiscordId: string;
	seriesId: string;
	title: string;
	description: string;
}): Promise<void> {
	await query(
		`SELECT * FROM web_api.web_member_series_update($1, $2::bigint, $3, $4)`,
		[args.actorDiscordId, args.seriesId, args.title, args.description],
	);
}

export async function deleteMemberSeries(args: {
	actorDiscordId: string;
	seriesId: string;
}): Promise<void> {
	await query(
		`SELECT * FROM web_api.web_member_series_delete($1, $2::bigint)`,
		[args.actorDiscordId, args.seriesId],
	);
}
