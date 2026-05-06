//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/data/youtube-channels.ts                                                            ////
//// Language: TS                                                                                               ////
//// DB-first admin YouTube channel allowlist read and mutation helpers                                          ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import "server-only";

import { query } from "@/lib/data/pg";

type YoutubeChannelAdminDbRow = {
	youtube_channel_id: number | string;
	channel_external_id: string;
	channel_handle: string | null;
	channel_title: string;
	channel_url: string | null;
	comment: string | null;
	is_enabled: boolean;
	created_dt: string | Date;
	updated_dt: string | Date;
};

type YoutubeChannelMutationDbRow = {
	youtube_channel_id: number | string;
};

export type YoutubeChannelAdminItem = {
	id: string;
	youtubeChannelId: string;
	channelExternalId: string;
	channelHandle: string | null;
	channelTitle: string;
	channelUrl: string | null;
	comment: string | null;
	enabled: boolean;
	createdAt: string;
	updatedAt: string;
};

export type YoutubeChannelOption = {
	id: string;
	channelExternalId: string;
	channelHandle: string | null;
	channelTitle: string;
	channelUrl: string | null;
};

function toIsoString(value: string | Date): string {
	return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toPositiveInt(value: unknown): number | null {
	if (typeof value === "number" && Number.isInteger(value) && value > 0) {
		return value;
	}

	if (typeof value === "string" && /^\d+$/.test(value.trim())) {
		const parsed = Number(value.trim());
		return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
	}

	return null;
}

function mapYoutubeChannelRow(row: YoutubeChannelAdminDbRow): YoutubeChannelAdminItem {
	return {
		id: String(row.youtube_channel_id),
		youtubeChannelId: String(row.youtube_channel_id),
		channelExternalId: row.channel_external_id,
		channelHandle: row.channel_handle,
		channelTitle: row.channel_title,
		channelUrl: row.channel_url,
		comment: row.comment,
		enabled: row.is_enabled,
		createdAt: toIsoString(row.created_dt),
		updatedAt: toIsoString(row.updated_dt),
	};
}

export async function listYoutubeChannelsAdmin(): Promise<YoutubeChannelAdminItem[]> {
	const result = await query<YoutubeChannelAdminDbRow>(
		`
			SELECT youtube_channel_id,
				   channel_external_id,
				   channel_handle,
				   channel_title,
				   channel_url,
				   comment,
				   is_enabled,
				   created_dt,
				   updated_dt
			FROM web_view.web_youtube_channels_admin
			ORDER BY channel_title ASC,
					 channel_external_id ASC,
					 youtube_channel_id ASC
		`,
	);

	return result.rows.map(mapYoutubeChannelRow);
}

export async function findYoutubeChannelAdminById(
	youtubeChannelId: number,
): Promise<YoutubeChannelAdminItem | null> {
	const result = await query<YoutubeChannelAdminDbRow>(
		`
			SELECT youtube_channel_id,
				   channel_external_id,
				   channel_handle,
				   channel_title,
				   channel_url,
				   comment,
				   is_enabled,
				   created_dt,
				   updated_dt
			FROM web_view.web_youtube_channels_admin
			WHERE youtube_channel_id = $1
			LIMIT 1
		`,
		[youtubeChannelId],
	);

	const row = result.rows[0];
	return row ? mapYoutubeChannelRow(row) : null;
}

export async function listYoutubeChannelOptions(): Promise<YoutubeChannelOption[]> {
	const result = await query<YoutubeChannelAdminDbRow>(
		`
			SELECT youtube_channel_id,
				   channel_external_id,
				   channel_handle,
				   channel_title,
				   channel_url,
				   comment,
				   is_enabled,
				   created_dt,
				   updated_dt
			FROM web_view.web_youtube_channels_lookup
			ORDER BY channel_title ASC,
					 channel_external_id ASC,
					 youtube_channel_id ASC
		`,
	);

	return result.rows.map((row) => ({
		id: String(row.youtube_channel_id),
		channelExternalId: row.channel_external_id,
		channelHandle: row.channel_handle,
		channelTitle: row.channel_title,
		channelUrl: row.channel_url,
	}));
}

export async function createYoutubeChannelAdmin(args: {
	actorDiscordId: string;
	channelExternalId: string;
	channelHandle: string | null;
	channelTitle: string;
	channelUrl: string | null;
	comment: string | null;
	enabled: boolean;
}): Promise<number | null> {
	const result = await query<YoutubeChannelMutationDbRow>(
		`
			SELECT youtube_channel_id
			FROM web_api.web_youtube_channel_insert($1, $2, $3, $4, $5, $6, $7)
		`,
		[
			args.actorDiscordId,
			args.channelExternalId,
			args.channelHandle,
			args.channelTitle,
			args.channelUrl,
			args.comment,
			args.enabled,
		],
	);

	return toPositiveInt(result.rows[0]?.youtube_channel_id);
}

export async function updateYoutubeChannelAdmin(args: {
	actorDiscordId: string;
	youtubeChannelId: number;
	channelHandle: string | null;
	channelTitle: string;
	channelUrl: string | null;
	comment: string | null;
	enabled: boolean;
}): Promise<void> {
	await query<YoutubeChannelMutationDbRow>(
		`
			SELECT youtube_channel_id
			FROM web_api.web_youtube_channel_update($1, $2, $3, $4, $5, $6, $7)
		`,
		[
			args.actorDiscordId,
			args.youtubeChannelId,
			args.channelHandle,
			args.channelTitle,
			args.channelUrl,
			args.comment,
			args.enabled,
		],
	);
}

export async function deleteYoutubeChannelAdmin(args: {
	actorDiscordId: string;
	youtubeChannelId: number;
}): Promise<void> {
	await query<YoutubeChannelMutationDbRow>(
		`
			SELECT youtube_channel_id
			FROM web_api.web_youtube_channel_delete($1, $2)
		`,
		[args.actorDiscordId, args.youtubeChannelId],
	);
}
