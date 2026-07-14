//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/admin/web/series/page.tsx                                                              ////
//// Language: TSX                                                                                                 ////
//// Admin series page with page-preloaded policy and taxonomy metadata                                            ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX } from "react";
import Link from "next/link";

import SeriesTable from "@/components/admin/web/SeriesTable";
import { ButtonLink } from "@/components/ui/basic-elements/Button";
import { requireAdminOrEditor } from "@/lib/auth/authz";
import { listCategoriesAdmin } from "@/lib/data/categories";
import { listDiscordRoleOptions } from "@/lib/data/discord-roles";
import { listEnabledIconOptions } from "@/lib/data/icons";
import { listSubcategoriesAdmin } from "@/lib/data/subcategories";
import { listEnabledThemeColorOptions } from "@/lib/data/theme-colors";

export default async function SeriesAdminPage(): Promise<JSX.Element> {
	const guard = await requireAdminOrEditor();

	if (!guard.allowed) {
		if (guard.reason === "not-authenticated") {
			return (
				<div className="admin-guard-shell">
					<h1 className="admin-guard-title">Series</h1>
					<p className="admin-guard-message">
						You need to sign in to access the admin area.
					</p>
					<Link href="/login" className="admin-guard-link">
						Go to login
					</Link>
				</div>
			);
		}

		return (
			<div className="admin-guard-shell">
				<h1 className="admin-guard-title">Series</h1>
				<p className="admin-guard-message">Admin or editor access is required.</p>
				<ButtonLink href="/admin" variant="secondary">
					Go back
				</ButtonLink>
			</div>
		);
	}

	let meta = {
		roles: [] as Awaited<ReturnType<typeof listDiscordRoleOptions>>,
		categories: [] as Array<{
			id: string;
			title: string;
			slug: string;
			readPolicy: "public" | "rank_at_least" | "rank_equal";
			readMinRank: number | null;
			writePolicy: "rank_at_least" | "rank_equal";
			writeMinRank: number | null;
		}>,
		subcategories: [] as Array<{
			id: string;
			title: string;
			categoryId: string;
			readEffectivePolicy: "public" | "rank_at_least" | "rank_equal";
			readEffectiveMinRank: number | null;
			writeEffectivePolicy: "rank_at_least" | "rank_equal";
			writeEffectiveMinRank: number | null;
		}>,
		icons: [] as Awaited<ReturnType<typeof listEnabledIconOptions>>,
		colors: [] as Array<{
			id: string;
			key: string;
			label: string;
			preview: string;
		}>,
		error: null as string | null,
	};

	try {
		const [roles, categoryRows, subcategoryRows, icons, colors] =
			await Promise.all([
				listDiscordRoleOptions(),
				listCategoriesAdmin(),
				listSubcategoriesAdmin(),
				listEnabledIconOptions(),
				listEnabledThemeColorOptions(),
			]);

		meta = {
			roles,
			categories: categoryRows.map((category) => ({
				id: category.id,
				title: category.title,
				slug: category.slug,
				readPolicy: category.readPolicy,
				readMinRank: category.readMinRank,
				writePolicy: category.writePolicy,
				writeMinRank: category.writeMinRank,
			})),
			subcategories: subcategoryRows.map((subcategory) => ({
				id: subcategory.id,
				title: subcategory.title,
				categoryId: subcategory.category.id,
				readEffectivePolicy: subcategory.readEffectivePolicy,
				readEffectiveMinRank: subcategory.readEffectiveMinRank,
				writeEffectivePolicy: subcategory.writeEffectivePolicy,
				writeEffectiveMinRank: subcategory.writeEffectiveMinRank,
			})),
			icons: icons.map((icon) => ({
				id: icon.id,
				key: icon.key,
				label: icon.label,
				source: icon.source,
				lucideName: icon.lucideName,
				iconMedia: icon.iconMedia
					? {
							id: icon.iconMedia.id,
							url: icon.iconMedia.url,
							filename: icon.iconMedia.filename,
							mimeType: icon.iconMedia.mimeType,
							storageRelPath: icon.iconMedia.storageRelPath,
						}
					: null,
			})),
			colors: colors.map((color) => ({
				id: color.id,
				key: color.key,
				label: color.label,
				preview: color.preview,
			})),
			error: null,
		};
	} catch (error: unknown) {
		meta = {
			...meta,
			error:
				error instanceof Error ? error.message : "Failed to load series metadata.",
		};
	}

	return (
		<section className="card">
			<div className="admin-page-card-header">
				<h1 className="admin-page-card-title">Series</h1>

				<div className="admin-page-card-actions">
					<ButtonLink href="/admin" variant="secondary">
						Go back
					</ButtonLink>
				</div>
			</div>

			<SeriesTable meta={meta} />
		</section>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
