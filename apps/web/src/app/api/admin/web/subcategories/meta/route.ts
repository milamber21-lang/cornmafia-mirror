//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/admin/web/subcategories/meta/route.ts                                              ////
//// Language: TS                                                                                                  ////
//// Admin meta route for subcategory form options and inherited category inputs                                   ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { NextResponse } from "next/server";

import { listCategoriesAdmin } from "@/lib/data/categories";
import { listDiscordRoleOptions } from "@/lib/data/discord-roles";
import { listEnabledIconOptions } from "@/lib/data/icons";
import { listTemplateOptions } from "@/lib/data/templates";
import { listEnabledThemeColorOptions } from "@/lib/data/theme-colors";
import { jsonError, requireAdminResponse } from "@/lib/server/admin-route";

export const dynamic = "force-dynamic";

type SubcategoryCategoryOption = {
	id: string;
	title: string;
	slug: string;
	readPolicy: "public" | "rank_at_least" | "rank_equal";
	readMinRank: number | null;
	writePolicy: "rank_at_least" | "rank_equal";
	writeMinRank: number;
	navHidden: boolean;
	allowedTemplates: string[];
};

export async function GET(): Promise<Response> {
	const guardResponse = await requireAdminResponse();
	if (guardResponse) {
		return guardResponse;
	}

	try {
		const [roles, templates, icons, colors, categoryRows] = await Promise.all([
			listDiscordRoleOptions(),
			listTemplateOptions(),
			listEnabledIconOptions(),
			listEnabledThemeColorOptions(),
			listCategoriesAdmin(),
		]);

		const categories: SubcategoryCategoryOption[] = categoryRows.map(
			(category) => ({
				id: category.id,
				title: category.title,
				slug: category.slug,
				readPolicy: category.readPolicy,
				readMinRank: category.readMinRank,
				writePolicy: category.writePolicy,
				writeMinRank: category.writeMinRank,
				navHidden: category.navHidden,
				allowedTemplates: category.allowedTemplates,
			}),
		);

		return NextResponse.json({
			roles,
			templates: templates.filter((row) => row.enabled),
			icons,
			colors,
			categories,
		});
	} catch (error: unknown) {
		const message =
			error instanceof Error
				? error.message
				: "Failed to load subcategory metadata.";
		return jsonError("SERVER_ERROR", message, 500);
	}
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
