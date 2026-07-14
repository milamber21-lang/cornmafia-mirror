//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/auth/adapter.ts                                                                    ////
//// Language: TS                                                                                               ////
//// NextAuth adapter backed by web_api writes and web_view reads.                                              ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import "server-only";

import type { Adapter, AdapterAccount, AdapterUser } from "next-auth/adapters";

import { query } from "@/lib/data/pg";

type AuthUserRow = {
	auth_user_id: string | number;
	discord_id: string | null;
	name: string | null;
	image: string | null;
	is_disabled: boolean;
};

type AuthAccountLookupRow = {
	auth_account_id: string | number;
	auth_user_id: string | number;
	provider: string;
	provider_account_id: string;
	account_type: string;
	expires_dt: Date | string | null;
	token_type: string | null;
	scope: string | null;
	created_dt: Date | string;
	updated_dt: Date | string;
};

type AdapterCreateUserInput = Parameters<NonNullable<Adapter["createUser"]>>[0];
type AdapterGetUserInput = Parameters<NonNullable<Adapter["getUser"]>>[0];
type AdapterGetUserByEmailInput = Parameters<
	NonNullable<Adapter["getUserByEmail"]>
>[0];
type AdapterGetUserByAccountInput = Parameters<
	NonNullable<Adapter["getUserByAccount"]>
>[0];
type AdapterUpdateUserInput = Parameters<NonNullable<Adapter["updateUser"]>>[0];
type AdapterDeleteUserInput = Parameters<NonNullable<Adapter["deleteUser"]>>[0];
type AdapterLinkAccountInput = Parameters<
	NonNullable<Adapter["linkAccount"]>
>[0];
type AdapterUnlinkAccountInput = Parameters<
	NonNullable<Adapter["unlinkAccount"]>
>[0];

type AuthAccountType = AdapterAccount["type"];

function buildAdapterEmail(discordId: string | null): string {
	if (discordId && discordId.length > 0) {
		return `${discordId}@discord.local`;
	}

	return "unknown@discord.local";
}

function mapAuthUser(row: AuthUserRow): AdapterUser {
	return {
		id: String(row.auth_user_id),
		name: row.name,
		email: buildAdapterEmail(row.discord_id),
		emailVerified: null,
		image: row.image,
	};
}

function toEpochSeconds(value: Date | string | null): number | undefined {
	if (value === null) {
		return undefined;
	}

	if (value instanceof Date) {
		return Math.floor(value.getTime() / 1000);
	}

	const parsedValue = Date.parse(value);

	if (!Number.isFinite(parsedValue)) {
		return undefined;
	}

	return Math.floor(parsedValue / 1000);
}

function mapAuthAccount(row: AuthAccountLookupRow): AdapterAccount {
	return {
		userId: String(row.auth_user_id),
		type: row.account_type as AuthAccountType,
		provider: row.provider,
		providerAccountId: row.provider_account_id,
		expires_at: toEpochSeconds(row.expires_dt),
		token_type: row.token_type ?? undefined,
		scope: row.scope ?? undefined,
	};
}

function toTimestampFromSeconds(value: number | null | undefined): Date | null {
	if (typeof value !== "number" || !Number.isFinite(value)) {
		return null;
	}

	return new Date(value * 1000);
}

export function buildAuthAdapter(): Adapter {
	return {
		async createUser(user: AdapterCreateUserInput) {
			const result = await query<AuthUserRow>(
				`
					SELECT
						auth_user_id,
						discord_id,
						name,
						image,
						is_disabled
					FROM web_api.auth_user_create($1, $2)
				`,
				[user.name ?? null, user.image ?? null],
			);

			const row = result.rows[0];

			if (!row) {
				throw new Error("Failed to create auth user.");
			}

			return mapAuthUser(row);
		},

		async getUser(id: AdapterGetUserInput) {
			const result = await query<AuthUserRow>(
				`
					SELECT
						auth_user_id,
						discord_id,
						name,
						image,
						is_disabled
					FROM web_view.auth_users
					WHERE auth_user_id = $1::bigint
					LIMIT 1
				`,
				[id],
			);

			const row = result.rows[0] ?? null;

			if (!row || row.is_disabled) {
				return null;
			}

			return mapAuthUser(row);
		},

		async getUserByEmail(email: AdapterGetUserByEmailInput) {
			void email;
			return null;
		},

		async getUserByAccount(params: AdapterGetUserByAccountInput) {
			const result = await query<AuthUserRow>(
				`
					SELECT
						u.auth_user_id,
						u.discord_id,
						u.name,
						u.image,
						u.is_disabled
					FROM web_view.auth_accounts_lookup a
					INNER JOIN web_view.auth_users u
						ON u.auth_user_id = a.auth_user_id
					WHERE a.provider = $1
						AND a.provider_account_id = $2
					LIMIT 1
				`,
				[params.provider, params.providerAccountId],
			);

			const row = result.rows[0] ?? null;

			if (!row || row.is_disabled) {
				return null;
			}

			return mapAuthUser(row);
		},

		async updateUser(user: AdapterUpdateUserInput) {
			const result = await query<AuthUserRow>(
				`
					SELECT
						auth_user_id,
						discord_id,
						name,
						image,
						is_disabled
					FROM web_api.auth_user_update($1::bigint, $2, $3)
				`,
				[user.id, user.name ?? null, user.image ?? null],
			);

			const row = result.rows[0];

			if (!row) {
				throw new Error(`Auth user not found for update: ${user.id}`);
			}

			return mapAuthUser(row);
		},

		async deleteUser(userId: AdapterDeleteUserInput) {
			await query(
				`
					SELECT auth_user_id
					FROM web_api.auth_user_delete($1::bigint)
				`,
				[userId],
			);
		},

		async linkAccount(account: AdapterLinkAccountInput) {
			if (account.provider !== "discord") {
				throw new Error(
					`Unsupported provider for auth account link: ${account.provider}`,
				);
			}

			const result = await query<AuthAccountLookupRow>(
				`
					SELECT
						auth_account_id,
						auth_user_id,
						provider,
						provider_account_id,
						account_type,
						expires_dt,
						token_type,
						scope,
						created_dt,
						updated_dt
					FROM web_api.auth_account_link_discord(
						$1::bigint,
						$2,
						$3,
						$4,
						$5,
						$6,
						$7,
						$8,
						$9
					)
				`,
				[
					account.userId,
					account.providerAccountId,
					null,
					null,
					toTimestampFromSeconds(account.expires_at),
					account.token_type ?? null,
					account.scope ?? null,
					null,
					null,
				],
			);

			const row = result.rows[0];

			if (!row) {
				throw new Error("Failed to link auth account.");
			}

			return mapAuthAccount(row);
		},

		async unlinkAccount(params: AdapterUnlinkAccountInput) {
			if (params.provider !== "discord") {
				throw new Error(
					`Unsupported provider for auth account unlink: ${params.provider}`,
				);
			}

			const lookup = await query<AuthAccountLookupRow>(
				`
					SELECT
						auth_account_id,
						auth_user_id,
						provider,
						provider_account_id,
						account_type,
						expires_dt,
						token_type,
						scope,
						created_dt,
						updated_dt
					FROM web_view.auth_accounts_lookup
					WHERE provider = $1
						AND provider_account_id = $2
					LIMIT 1
				`,
				[params.provider, params.providerAccountId],
			);

			const row = lookup.rows[0];

			if (!row) {
				return;
			}

			await query(
				`
					SELECT web_api.auth_account_unlink_discord($1::bigint)
				`,
				[row.auth_user_id],
			);
		},
	};
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
