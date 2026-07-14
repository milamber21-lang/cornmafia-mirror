//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/admin/web/content/meta/route.ts                                                   ////
//// Language: TS                                                                                                 ////
//// Admin content metadata route for placement, template, media, series, and dynamic field options                ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { NextResponse } from "next/server";

import { listEnabledIconOptions } from "@/lib/data/icons";
import { listEnabledThemeColorOptions } from "@/lib/data/theme-colors";
import {
	listContentCategories,
	listContentMediaOptions,
	listContentSeriesOptions,
	listContentSubcategories,
	listContentTemplateFieldOptions,
	listContentTemplateFieldOptionsForContent,
	listContentTemplateFields,
	listContentTemplateFieldsForContent,
	listContentTemplatesForPlacement,
} from "@/lib/data/content";
import { listDiscordRoleOptions } from "@/lib/data/discord-roles";
import {
	classifyAdminMutationError,
	jsonError,
	parsePositiveInt,
	requireAdminOrEditorResponse,
} from "@/lib/server/admin-route";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<NextResponse> {
	const guardResponse = await requireAdminOrEditorResponse();
	if (guardResponse) {
		return guardResponse;
	}

	const { searchParams } = new URL(request.url);
	const contentId = parsePositiveInt(searchParams.get("contentId"));
	const categoryId = parsePositiveInt(searchParams.get("categoryId"));
	const subcategoryId = parsePositiveInt(searchParams.get("subcategoryId"));
	const templateId = parsePositiveInt(searchParams.get("templateId"));

	try {
		const [categories, subcategories, roles, icons, colors] = await Promise.all([
			listContentCategories(),
			listContentSubcategories(),
			listDiscordRoleOptions(),
			listEnabledIconOptions(),
			listEnabledThemeColorOptions(),
		]);

		const [templates, series, media, templateFields, fieldOptions] =
			await Promise.all([
				categoryId === null
					? Promise.resolve([])
					: listContentTemplatesForPlacement({
							categoryId,
							subcategoryId,
							surfaceScopeCode: "admin",
							currentTemplateId: contentId === null ? null : templateId,
						}),
				categoryId === null
					? Promise.resolve([])
					: listContentSeriesOptions({ categoryId, subcategoryId }),
				categoryId === null
					? Promise.resolve([])
					: listContentMediaOptions({ categoryId, subcategoryId }),
				templateId === null
					? Promise.resolve([])
					: contentId === null
						? listContentTemplateFields(templateId)
						: listContentTemplateFieldsForContent({ contentId, templateId }),
				templateId === null
					? Promise.resolve([])
					: contentId === null
						? listContentTemplateFieldOptions(templateId)
						: listContentTemplateFieldOptionsForContent({ contentId, templateId }),
			]);

		return NextResponse.json({
			categories,
			subcategories,
			roles,
			icons,
			colors,
			templates,
			series,
			media,
			templateFields,
			fieldOptions,
		});
	} catch (error: unknown) {
		const classified = classifyAdminMutationError(
			error,
			"Failed to load content metadata.",
		);
		return jsonError(classified.code, classified.message, classified.status);
	}
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
