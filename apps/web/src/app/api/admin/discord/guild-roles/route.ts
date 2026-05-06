//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/admin/discord/guild-roles/route.ts                                                 ////
//// Language: TS                                                                                                  ////
//// Admin API route for live Discord guild role lookup options                                                    ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { NextResponse } from "next/server";

import { colorIntToHex, getGuildRoles } from "@/lib/discord/guild";
import { jsonError, requireAdminResponse } from "@/lib/server/admin-route";
import { getOptionalEnv } from "@/lib/server/env";

export const dynamic = "force-dynamic";

type OutRole = {
	id: string;
	name: string;
	colorHex?: string;
};

export async function GET(): Promise<Response> {
	const guardResponse = await requireAdminResponse();
	if (guardResponse) {
		return guardResponse;
	}

	const guildId = getOptionalEnv("DISCORD_GUILD_ID");
	const botToken = getOptionalEnv("DISCORD_BOT_TOKEN");

	if (!guildId || !botToken) {
		return jsonError(
			"SERVER_ERROR",
			"Discord env not configured (DISCORD_GUILD_ID / DISCORD_BOT_TOKEN).",
			500,
		);
	}

	try {
		const roles = await getGuildRoles(guildId);
		const rows = roles
			.map((role): OutRole | null => {
				const id = typeof role.id === "string" ? role.id.trim() : "";
				const name = typeof role.name === "string" ? role.name.trim() : "";

				if (!id || !name) {
					return null;
				}

				const colorHex = colorIntToHex(role.color) ?? undefined;
				return colorHex ? { id, name, colorHex } : { id, name };
			})
			.filter((value): value is OutRole => value !== null)
			.sort((left, right) =>
				left.name.localeCompare(right.name, undefined, { sensitivity: "base" }),
			);

		return NextResponse.json({ rows });
	} catch (error: unknown) {
		const message =
			error instanceof Error ? error.message : "Failed to fetch guild roles.";
		return jsonError("SERVER_ERROR", message, 500);
	}
}
