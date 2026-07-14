//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/data/content-kinds.ts                                                                ////
//// Language: TS                                                                                                ////
//// DB-first admin content kind read and mutation helpers                                                        ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import "server-only";

import { query } from "@/lib/data/pg";

export type ContentKindPublicRoutePrefix =
	| "map"
	| "tool"
	| "app"
	| "event"
	| "custom"
	| "external"
	| "info"
	| "video";

export type ContentKindRendererCode =
	| "page"
	| "map"
	| "tool"
	| "app"
	| "event"
	| "custom"
	| "external_link"
	| "youtube"
	| "stream"
	| "calendar";

type ContentKindAdminDbRow = {
	content_kind_code: string;
	label: string;
	description: string | null;
	public_route_prefix: ContentKindPublicRoutePrefix | null;
	renderer_code: ContentKindRendererCode;
	is_enabled: boolean;
	created_dt: string | Date;
	updated_dt: string | Date;
};

type ContentKindLookupDbRow = {
	content_kind_code: string;
	label: string;
	description: string | null;
	public_route_prefix: ContentKindPublicRoutePrefix | null;
	renderer_code: ContentKindRendererCode;
	is_enabled: boolean;
};

type ContentKindMutationDbRow = {
	content_kind_code: string;
};

export type ContentKindAdminItem = {
	id: string;
	contentKindCode: string;
	label: string;
	description: string | null;
	publicRoutePrefix: ContentKindPublicRoutePrefix | null;
	rendererCode: ContentKindRendererCode;
	enabled: boolean;
	createdAt: string;
	updatedAt: string;
};

export type ContentKindOption = {
	code: string;
	label: string;
	description: string | null;
	publicRoutePrefix: ContentKindPublicRoutePrefix | null;
	rendererCode: ContentKindRendererCode;
	enabled: boolean;
};

function toIsoString(value: string | Date): string {
	return value instanceof Date
		? value.toISOString()
		: new Date(value).toISOString();
}

function mapContentKindRow(row: ContentKindAdminDbRow): ContentKindAdminItem {
	return {
		id: row.content_kind_code,
		contentKindCode: row.content_kind_code,
		label: row.label,
		description: row.description,
		publicRoutePrefix: row.public_route_prefix,
		rendererCode: row.renderer_code,
		enabled: row.is_enabled,
		createdAt: toIsoString(row.created_dt),
		updatedAt: toIsoString(row.updated_dt),
	};
}

function mapContentKindOption(row: ContentKindLookupDbRow): ContentKindOption {
	return {
		code: row.content_kind_code,
		label: row.label,
		description: row.description,
		publicRoutePrefix: row.public_route_prefix,
		rendererCode: row.renderer_code,
		enabled: row.is_enabled,
	};
}

export async function listContentKindsAdmin(): Promise<ContentKindAdminItem[]> {
	const result = await query<ContentKindAdminDbRow>(
		`
			SELECT content_kind_code,
				   label,
				   description,
				   public_route_prefix,
				   renderer_code,
				   is_enabled,
				   created_dt,
				   updated_dt
			FROM web_view.web_content_kind_admin
			ORDER BY content_kind_code ASC
		`,
	);

	return result.rows.map(mapContentKindRow);
}

export async function findContentKindAdminByCode(
	contentKindCode: string,
): Promise<ContentKindAdminItem | null> {
	const result = await query<ContentKindAdminDbRow>(
		`
			SELECT content_kind_code,
				   label,
				   description,
				   public_route_prefix,
				   renderer_code,
				   is_enabled,
				   created_dt,
				   updated_dt
			FROM web_view.web_content_kind_admin
			WHERE content_kind_code = $1
			LIMIT 1
		`,
		[contentKindCode],
	);

	const row = result.rows[0];
	return row ? mapContentKindRow(row) : null;
}

export async function listEnabledContentKindOptions(): Promise<
	ContentKindOption[]
> {
	const result = await query<ContentKindLookupDbRow>(
		`
			SELECT content_kind_code,
				   label,
				   description,
				   public_route_prefix,
				   renderer_code,
				   is_enabled
			FROM web_view.web_content_kind_lookup
			ORDER BY content_kind_code ASC
		`,
	);

	return result.rows.map(mapContentKindOption);
}

export async function listContentKindOptionsForContent(args?: {
	currentContentKindCode?: string | null;
}): Promise<ContentKindOption[]> {
	const currentContentKindCode = (args?.currentContentKindCode ?? "")
		.trim()
		.toLowerCase();

	const result = await query<ContentKindLookupDbRow>(
		`
			SELECT content_kind_code,
				   label,
				   description,
				   public_route_prefix,
				   renderer_code,
				   is_enabled
			FROM web_view.web_content_kind_admin
			WHERE is_enabled = true
			   OR ($1 <> '' AND content_kind_code = $1)
			ORDER BY content_kind_code ASC
		`,
		[currentContentKindCode],
	);

	return result.rows.map(mapContentKindOption);
}

export async function createContentKindAdmin(args: {
	actorDiscordId: string;
	contentKindCode: string;
	label: string;
	description: string | null;
	publicRoutePrefix: ContentKindPublicRoutePrefix | null;
	rendererCode: ContentKindRendererCode;
	enabled: boolean;
}): Promise<string | null> {
	const result = await query<ContentKindMutationDbRow>(
		`
			SELECT content_kind_code
			FROM web_api.web_content_kind_create($1, $2, $3, $4, $5, $6, $7)
		`,
		[
			args.actorDiscordId,
			args.contentKindCode,
			args.label,
			args.description,
			args.publicRoutePrefix,
			args.rendererCode,
			args.enabled,
		],
	);

	return result.rows[0]?.content_kind_code ?? null;
}

export async function updateContentKindAdmin(args: {
	actorDiscordId: string;
	contentKindCode: string;
	label: string;
	description: string | null;
	publicRoutePrefix: ContentKindPublicRoutePrefix | null;
	rendererCode: ContentKindRendererCode;
	enabled: boolean;
}): Promise<void> {
	await query<ContentKindMutationDbRow>(
		`
			SELECT content_kind_code
			FROM web_api.web_content_kind_update($1, $2, $3, $4, $5, $6, $7)
		`,
		[
			args.actorDiscordId,
			args.contentKindCode,
			args.label,
			args.description,
			args.publicRoutePrefix,
			args.rendererCode,
			args.enabled,
		],
	);
}

export async function deleteContentKindAdmin(args: {
	actorDiscordId: string;
	contentKindCode: string;
}): Promise<void> {
	await query<ContentKindMutationDbRow>(
		`
			SELECT content_kind_code
			FROM web_api.web_content_kind_delete($1, $2)
		`,
		[args.actorDiscordId, args.contentKindCode],
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
