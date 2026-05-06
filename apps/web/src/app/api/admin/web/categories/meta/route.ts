//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/admin/web/categories/meta/route.ts                                                 ////
//// Language: TS                                                                                                  ////
//// Admin meta route for category form options and policy role inputs                                             ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { NextResponse } from "next/server";

import { listDiscordRoleOptions } from "@/lib/data/discord-roles";
import { listEnabledIconOptions } from "@/lib/data/icons";
import { listTemplateOptions } from "@/lib/data/templates";
import { listEnabledThemeColorOptions } from "@/lib/data/theme-colors";
import { jsonError, requireAdminResponse } from "@/lib/server/admin-route";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
	const guardResponse = await requireAdminResponse();
	if (guardResponse) {
		return guardResponse;
	}

	try {
		const [roles, templates, icons, colors] = await Promise.all([
			listDiscordRoleOptions(),
			listTemplateOptions(),
			listEnabledIconOptions(),
			listEnabledThemeColorOptions(),
		]);

		return NextResponse.json({
			roles,
			templates: templates.filter((row) => row.enabled),
			icons,
			colors,
		});
	} catch (error: unknown) {
		const message =
			error instanceof Error ? error.message : "Failed to load category metadata.";
		return jsonError("SERVER_ERROR", message, 500);
	}
}
