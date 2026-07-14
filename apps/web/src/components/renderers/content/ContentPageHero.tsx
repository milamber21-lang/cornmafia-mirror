//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/renderers/content/ContentPageHero.tsx                                          ////
//// Language: TSX                                                                                                ////
//// Composes the optional template Hero with system-derived breadcrumbs and ratio-preserving editorial media.    ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX } from "react";

import {
	BrowsePageBreadcrumbs,
	PageHero,
	type BrowsePageHeaderBreadcrumbItem,
} from "@/components/ui";

import ContentFieldGroup from "./ContentFieldGroup";
import { getDisplayableFields, hasRenderableFields } from "./field-utils";
import RenderDebugFrame from "./RenderDebugFrame";
import type { ContentRenderField, ContentRenderModel } from "./types";

type ContentPageHeroProps = {
	model: ContentRenderModel;
	debug?: boolean;
};

function isHeroMediaField(field: ContentRenderField): boolean {
	return field.fieldTypeCode === "media_id";
}

function isRetiredHeroOverlineField(field: ContentRenderField): boolean {
	return field.fieldListCode.trim().toLowerCase() === "hero_overline";
}

function resolveSummary(summary: string | null): string | null {
	if (typeof summary !== "string") {
		return null;
	}

	const trimmed = summary.trim();
	return trimmed.length > 0 ? trimmed : null;
}

function resolveContentBreadcrumbs(
	model: ContentRenderModel,
): BrowsePageHeaderBreadcrumbItem[] {
	const breadcrumbs: BrowsePageHeaderBreadcrumbItem[] = [];
	const categoryTitle = model.doc.categoryTitle?.trim() ?? "";
	const categorySlug = model.doc.categorySlug?.trim() ?? "";
	const subcategoryTitle = model.doc.subcategoryTitle?.trim() ?? "";
	const subcategorySlug = model.doc.subcategorySlug?.trim() ?? "";
	const linkPublicTaxonomy = model.surfaceScope === "public";

	if (categoryTitle) {
		breadcrumbs.push({
			label: categoryTitle,
			href:
				linkPublicTaxonomy && categorySlug ? `/${categorySlug}` : undefined,
		});
	}

	if (subcategoryTitle) {
		breadcrumbs.push({
			label: subcategoryTitle,
			href:
				linkPublicTaxonomy && categorySlug && subcategorySlug
					? `/${categorySlug}/${subcategorySlug}`
					: undefined,
		});
	}

	breadcrumbs.push({ label: model.doc.title });
	return breadcrumbs;
}

export default function ContentPageHero({
	model,
	debug = false,
}: ContentPageHeroProps): JSX.Element | null {
	const heroFields = model.fieldsByDestination.hero;
	if (heroFields.length === 0) {
		return null;
	}

	const mediaFields = getDisplayableFields(heroFields.filter(isHeroMediaField));
	const bodyFields = heroFields.filter(
		(field) =>
			!isHeroMediaField(field) && !isRetiredHeroOverlineField(field),
	);
	const hasBodyFields = hasRenderableFields(bodyFields, model);
	const summary = resolveSummary(model.doc.summary);
	const breadcrumbs = resolveContentBreadcrumbs(model);
	const media =
		mediaFields.length > 0 ? (
			<ContentFieldGroup
				fields={mediaFields}
				model={model}
				className="content-field-group content-field-group--single public-content-hero__media-fields"
				showLabels={false}
				debug={debug}
				debugLabel="Destination / Hero media"
				debugDescription="Resolved Hero media fields"
				debugVariant="dest-hero"
			/>
		) : undefined;

	return (
		<RenderDebugFrame
			enabled={debug}
			label="Destination / Hero"
			description={`${heroFields.length} configured Hero field(s)`}
			variant="dest-hero"
		>
			<PageHero
				className="public-content-hero"
				breadcrumbs={
					<BrowsePageBreadcrumbs
						breadcrumbs={breadcrumbs}
						ariaLabel="Content breadcrumb"
						className="public-content-hero__breadcrumb-list"
					/>
				}
				title={model.doc.title}
				summary={summary ?? undefined}
				media={media}
			>
				{hasBodyFields ? (
					<ContentFieldGroup
						fields={bodyFields}
						model={model}
						className="content-field-group public-content-hero__fields"
						debug={debug}
						debugLabel="Destination / Hero details"
						debugDescription="Renderable non-media Hero fields"
						debugVariant="dest-hero"
					/>
				) : null}
			</PageHero>
		</RenderDebugFrame>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
