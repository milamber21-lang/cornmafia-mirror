//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/data/external-link-hosts.ts                                                          ////
//// Language: TS                                                                                               ////
//// DB-first admin external link host, path-rule, and validation helpers                                        ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import "server-only";

import { query } from "@/lib/data/pg";

export type ExternalLinkHostMatchModeCode = "exact_host";
export type ExternalLinkPathMatchModeCode =
	| "any_path"
	| "exact_path"
	| "path_prefix";
export type ExternalLinkHostSurfaceScopeCode = "admin" | "public" | "all";
export type ExternalLinkValidationSurfaceScopeCode = "admin" | "public";

type ExternalLinkHostAdminDbRow = {
	external_link_host_id: number | string;
	host_pattern: string;
	host_match_mode_code: ExternalLinkHostMatchModeCode;
	path_pattern: string;
	path_match_mode_code: ExternalLinkPathMatchModeCode;
	allowed_surface_scope_code: ExternalLinkHostSurfaceScopeCode;
	comment: string | null;
	valid_from_dt: string | Date | null;
	valid_to_dt: string | Date | null;
	is_enabled: boolean;
	created_dt: string | Date;
	updated_dt: string | Date;
};

type ExternalLinkHostMutationDbRow = {
	external_link_host_id: number | string;
};

type ExternalLinkValidationDbRow = {
	is_allowed: boolean | null;
	normalized_url: string | null;
	url_scheme: string | null;
	url_host: string | null;
	url_path: string | null;
	error_message: string | null;
};

export type ExternalLinkHostAdminItem = {
	id: string;
	externalLinkHostId: string;
	hostPattern: string;
	hostMatchModeCode: ExternalLinkHostMatchModeCode;
	pathPattern: string;
	pathMatchModeCode: ExternalLinkPathMatchModeCode;
	allowedSurfaceScopeCode: ExternalLinkHostSurfaceScopeCode;
	comment: string | null;
	validFrom: string | null;
	validTo: string | null;
	enabled: boolean;
	createdAt: string;
	updatedAt: string;
};

export type ExternalLinkValidationResult = {
	isAllowed: boolean;
	normalizedUrl: string | null;
	urlScheme: string | null;
	urlHost: string | null;
	urlPath: string | null;
	errorMessage: string | null;
};

function toIsoString(value: string | Date): string {
	return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toNullableIsoString(value: string | Date | null): string | null {
	return value === null ? null : toIsoString(value);
}

function mapExternalLinkHostRow(
	row: ExternalLinkHostAdminDbRow,
): ExternalLinkHostAdminItem {
	return {
		id: String(row.external_link_host_id),
		externalLinkHostId: String(row.external_link_host_id),
		hostPattern: row.host_pattern,
		hostMatchModeCode: row.host_match_mode_code,
		pathPattern: row.path_pattern,
		pathMatchModeCode: row.path_match_mode_code,
		allowedSurfaceScopeCode: row.allowed_surface_scope_code,
		comment: row.comment,
		validFrom: toNullableIsoString(row.valid_from_dt),
		validTo: toNullableIsoString(row.valid_to_dt),
		enabled: row.is_enabled,
		createdAt: toIsoString(row.created_dt),
		updatedAt: toIsoString(row.updated_dt),
	};
}

function mapExternalLinkValidationRow(
	row: ExternalLinkValidationDbRow | undefined,
): ExternalLinkValidationResult {
	return {
		isAllowed: row?.is_allowed === true,
		normalizedUrl: row?.normalized_url ?? null,
		urlScheme: row?.url_scheme ?? null,
		urlHost: row?.url_host ?? null,
		urlPath: row?.url_path ?? null,
		errorMessage: row?.error_message ?? null,
	};
}

export async function listExternalLinkHostsAdmin(): Promise<
	ExternalLinkHostAdminItem[]
> {
	const result = await query<ExternalLinkHostAdminDbRow>(
		`
			SELECT external_link_host_id,
				   host_pattern,
				   host_match_mode_code,
				   path_pattern,
				   path_match_mode_code,
				   allowed_surface_scope_code,
				   comment,
				   valid_from_dt,
				   valid_to_dt,
				   is_enabled,
				   created_dt,
				   updated_dt
			FROM web_view.web_external_link_hosts_admin
			ORDER BY host_pattern ASC,
					 path_pattern ASC,
					 path_match_mode_code ASC,
					 allowed_surface_scope_code ASC,
					 external_link_host_id ASC
		`,
	);

	return result.rows.map(mapExternalLinkHostRow);
}

export async function findExternalLinkHostAdminById(
	externalLinkHostId: number,
): Promise<ExternalLinkHostAdminItem | null> {
	const result = await query<ExternalLinkHostAdminDbRow>(
		`
			SELECT external_link_host_id,
				   host_pattern,
				   host_match_mode_code,
				   path_pattern,
				   path_match_mode_code,
				   allowed_surface_scope_code,
				   comment,
				   valid_from_dt,
				   valid_to_dt,
				   is_enabled,
				   created_dt,
				   updated_dt
			FROM web_view.web_external_link_hosts_admin
			WHERE external_link_host_id = $1
			LIMIT 1
		`,
		[externalLinkHostId],
	);

	const row = result.rows[0];
	return row ? mapExternalLinkHostRow(row) : null;
}

export async function createExternalLinkHostAdmin(args: {
	actorDiscordId: string;
	hostPattern: string;
	hostMatchModeCode: ExternalLinkHostMatchModeCode;
	pathPattern: string;
	pathMatchModeCode: ExternalLinkPathMatchModeCode;
	allowedSurfaceScopeCode: ExternalLinkHostSurfaceScopeCode;
	comment: string | null;
	validFrom: string | null;
	validTo: string | null;
	enabled: boolean;
}): Promise<number | null> {
	const result = await query<ExternalLinkHostMutationDbRow>(
		`
			SELECT external_link_host_id
			FROM web_api.web_external_link_host_create($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		`,
		[
			args.actorDiscordId,
			args.hostPattern,
			args.hostMatchModeCode,
			args.pathPattern,
			args.pathMatchModeCode,
			args.allowedSurfaceScopeCode,
			args.comment,
			args.enabled,
			args.validFrom,
			args.validTo,
		],
	);

	const externalLinkHostId = result.rows[0]?.external_link_host_id;
	if (externalLinkHostId === undefined) {
		return null;
	}

	const parsedId = Number(externalLinkHostId);
	return Number.isFinite(parsedId) ? parsedId : null;
}

export async function updateExternalLinkHostAdmin(args: {
	actorDiscordId: string;
	externalLinkHostId: number;
	hostPattern: string;
	hostMatchModeCode: ExternalLinkHostMatchModeCode;
	pathPattern: string;
	pathMatchModeCode: ExternalLinkPathMatchModeCode;
	allowedSurfaceScopeCode: ExternalLinkHostSurfaceScopeCode;
	comment: string | null;
	validFrom: string | null;
	validTo: string | null;
	enabled: boolean;
}): Promise<void> {
	await query<ExternalLinkHostMutationDbRow>(
		`
			SELECT external_link_host_id
			FROM web_api.web_external_link_host_update($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		`,
		[
			args.actorDiscordId,
			args.externalLinkHostId,
			args.hostPattern,
			args.hostMatchModeCode,
			args.pathPattern,
			args.pathMatchModeCode,
			args.allowedSurfaceScopeCode,
			args.comment,
			args.enabled,
			args.validFrom,
			args.validTo,
		],
	);
}

export async function deleteExternalLinkHostAdmin(args: {
	actorDiscordId: string;
	externalLinkHostId: number;
}): Promise<void> {
	await query<ExternalLinkHostMutationDbRow>(
		`
			SELECT external_link_host_id
			FROM web_api.web_external_link_host_delete($1, $2)
		`,
		[args.actorDiscordId, args.externalLinkHostId],
	);
}

export async function validateExternalLinkUrl(args: {
	rawUrl: string;
	surfaceScopeCode: ExternalLinkValidationSurfaceScopeCode;
}): Promise<ExternalLinkValidationResult> {
	const result = await query<ExternalLinkValidationDbRow>(
		`
			SELECT is_allowed,
				   normalized_url,
				   url_scheme,
				   url_host,
				   url_path,
				   error_message
			FROM web_api.web_external_link_validate($1, $2)
		`,
		[args.rawUrl, args.surfaceScopeCode],
	);

	return mapExternalLinkValidationRow(result.rows[0]);
}
