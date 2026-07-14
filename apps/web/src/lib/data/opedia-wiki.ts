//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/data/opedia-wiki.ts                                                               ////
//// Language: TS                                                                                             ////
//// Dispatches public info wiki reads between Riseopedia and Mafiosopedia read-model families.                 ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import "server-only";

import {
	listMafiosopediaCategoryDirectoryCards,
	listMafiosopediaCategoryFilterOptions,
	listMafiosopediaClassDirectoryCards,
	listMafiosopediaClassFilterOptions,
	listMafiosopediaSectionDirectoryCards,
	listMafiosopediaSubcategoryDirectoryCards,
	listMafiosopediaSubcategoryFilterOptions,
} from "@/lib/data/mafiosopedia-classification";
import {
	listMafiosopediaEntities,
	listMafiosopediaEntityCategoryFilterOptions,
	listMafiosopediaEntityClassFilterOptions,
	listMafiosopediaEntitySubcategoryFilterOptions,
} from "@/lib/data/mafiosopedia-entities";
import { findMafiosopediaEntityDetailByEntitySlug } from "@/lib/data/mafiosopedia-entity-detail";
import { getMafiosopediaHubData } from "@/lib/data/mafiosopedia-hub";
import {
	mafiosopediaReleaseFiltersForView,
	mafiosopediaReleaseViewFromFilters,
	type MafiosopediaReleaseFilterCode,
} from "@/lib/data/mafiosopedia-release";
import {
	findMafiosopediaSectionBySlug,
	listMafiosopediaSections,
} from "@/lib/data/mafiosopedia-sections";
import {
	listRiseopediaCategoryDirectoryCards,
	listRiseopediaCategoryFilterOptions,
	listRiseopediaClassDirectoryCards,
	listRiseopediaClassFilterOptions,
	listRiseopediaSectionDirectoryCards,
	listRiseopediaSubcategoryDirectoryCards,
	listRiseopediaSubcategoryFilterOptions,
	type RiseopediaClassificationDirectoryFilters,
} from "@/lib/data/riseopedia-classification";
import {
	listRiseopediaEntities,
	listRiseopediaEntityCategoryFilterOptions,
	listRiseopediaEntityClassFilterOptions,
	listRiseopediaEntitySubcategoryFilterOptions,
	type RiseopediaEntityFilterOptionFilters,
	type RiseopediaEntityListFilters,
} from "@/lib/data/riseopedia-entities";
import { findRiseopediaEntityDetailByEntitySlug } from "@/lib/data/riseopedia-entity-detail";
import { getRiseopediaHubData } from "@/lib/data/riseopedia-hub";
import {
	findRiseopediaSectionBySlug,
	listRiseopediaSections,
} from "@/lib/data/riseopedia-sections";

export type OpediaWikiCode = "riseopedia" | "mafiosopedia";
export type OpediaReleaseFilters = MafiosopediaReleaseFilterCode[];

export type OpediaWikiConfig = {
	code: OpediaWikiCode;
	title: string;
	description: string;
	browserDescription: string;
	emptyPublicLabel: string;
	basePath: string;
	browsePath: string;
	sectionsPath: string;
	classesPath: string;
	categoriesPath: string;
	subcategoriesPath: string;
};

const WIKI_CONFIGS: Record<OpediaWikiCode, OpediaWikiConfig> = {
	riseopedia: {
		code: "riseopedia",
		title: "Riseopedia",
		description:
			"Browse public game knowledge by section, class, and category. Search to jump directly into matching entries.",
		browserDescription:
			"Matching public Riseopedia entries across sections, classes, categories, and subcategories.",
		emptyPublicLabel: "public Riseopedia",
		basePath: "/info/riseopedia",
		browsePath: "/info/riseopedia/browse",
		sectionsPath: "/info/riseopedia/sections",
		classesPath: "/info/riseopedia/classes",
		categoriesPath: "/info/riseopedia/categories",
		subcategoriesPath: "/info/riseopedia/subcategories",
	},
	mafiosopedia: {
		code: "mafiosopedia",
		title: "Mafiosopedia",
		description:
			"Browse latest-known game knowledge by section, class, and category. Search to jump directly into matching entries.",
		browserDescription:
			"Matching Mafiosopedia entries across sections, classes, categories, and subcategories.",
		emptyPublicLabel: "Mafiosopedia",
		basePath: "/info/mafiosopedia",
		browsePath: "/info/mafiosopedia/browse",
		sectionsPath: "/info/mafiosopedia/sections",
		classesPath: "/info/mafiosopedia/classes",
		categoriesPath: "/info/mafiosopedia/categories",
		subcategoriesPath: "/info/mafiosopedia/subcategories",
	},
};

function effectiveReleaseFilters(
	wiki: OpediaWikiConfig,
	filters: readonly MafiosopediaReleaseFilterCode[] | undefined,
): MafiosopediaReleaseFilterCode[] {
	return wiki.code === "mafiosopedia"
		? mafiosopediaReleaseFiltersForView(
				mafiosopediaReleaseViewFromFilters(filters),
			)
		: ["public"];
}

export function getOpediaWikiConfig(
	categorySlug: string,
): OpediaWikiConfig | null {
	return categorySlug === "riseopedia" || categorySlug === "mafiosopedia"
		? WIKI_CONFIGS[categorySlug]
		: null;
}

export function opediaHomeBreadcrumb(wiki: OpediaWikiConfig) {
	return { label: wiki.title, href: wiki.browsePath };
}

export async function getOpediaHubData(
	wiki: OpediaWikiConfig,
	releaseFilters: readonly MafiosopediaReleaseFilterCode[] = mafiosopediaReleaseFiltersForView(
		"all",
	),
) {
	return wiki.code === "mafiosopedia"
		? getMafiosopediaHubData(effectiveReleaseFilters(wiki, releaseFilters))
		: getRiseopediaHubData();
}

export async function listOpediaSections(wiki: OpediaWikiConfig) {
	return wiki.code === "mafiosopedia"
		? listMafiosopediaSections()
		: listRiseopediaSections();
}

export async function findOpediaSectionBySlug(
	wiki: OpediaWikiConfig,
	sectionSlug: string,
) {
	return wiki.code === "mafiosopedia"
		? findMafiosopediaSectionBySlug(sectionSlug)
		: findRiseopediaSectionBySlug(sectionSlug);
}

export async function listOpediaSectionDirectoryCards(
	wiki: OpediaWikiConfig,
	releaseFilters: readonly MafiosopediaReleaseFilterCode[] = mafiosopediaReleaseFiltersForView(
		"all",
	),
) {
	return wiki.code === "mafiosopedia"
		? listMafiosopediaSectionDirectoryCards(
				effectiveReleaseFilters(wiki, releaseFilters),
			)
		: listRiseopediaSectionDirectoryCards();
}

export async function listOpediaClassDirectoryCards(
	wiki: OpediaWikiConfig,
	filters: Pick<RiseopediaClassificationDirectoryFilters, "section"> & {
		releaseFilters?: MafiosopediaReleaseFilterCode[];
	},
) {
	const releaseFilters = effectiveReleaseFilters(wiki, filters.releaseFilters);
	return wiki.code === "mafiosopedia"
		? listMafiosopediaClassDirectoryCards({
				section: filters.section,
				releaseFilters,
			})
		: listRiseopediaClassDirectoryCards(filters);
}

export async function listOpediaCategoryDirectoryCards(
	wiki: OpediaWikiConfig,
	filters: Pick<
		RiseopediaClassificationDirectoryFilters,
		"section" | "entityClassCode"
	> & { releaseFilters?: MafiosopediaReleaseFilterCode[] },
) {
	const releaseFilters = effectiveReleaseFilters(wiki, filters.releaseFilters);
	return wiki.code === "mafiosopedia"
		? listMafiosopediaCategoryDirectoryCards({
				section: filters.section,
				entityClassCode: filters.entityClassCode,
				releaseFilters,
			})
		: listRiseopediaCategoryDirectoryCards(filters);
}

export async function listOpediaSubcategoryDirectoryCards(
	wiki: OpediaWikiConfig,
	filters: RiseopediaClassificationDirectoryFilters & {
		releaseFilters?: MafiosopediaReleaseFilterCode[];
	} = {
		section: null,
		entityClassCode: null,
		categorySlug: null,
	},
) {
	const releaseFilters = effectiveReleaseFilters(wiki, filters.releaseFilters);
	return wiki.code === "mafiosopedia"
		? listMafiosopediaSubcategoryDirectoryCards({ ...filters, releaseFilters })
		: listRiseopediaSubcategoryDirectoryCards(filters);
}

export async function listOpediaClassFilterOptions(
	wiki: OpediaWikiConfig,
	filters: Pick<RiseopediaClassificationDirectoryFilters, "section"> & {
		releaseFilters?: MafiosopediaReleaseFilterCode[];
	},
) {
	const releaseFilters = effectiveReleaseFilters(wiki, filters.releaseFilters);
	return wiki.code === "mafiosopedia"
		? listMafiosopediaClassFilterOptions({
				section: filters.section,
				releaseFilters,
			})
		: listRiseopediaClassFilterOptions(filters);
}

export async function listOpediaCategoryFilterOptions(
	wiki: OpediaWikiConfig,
	filters: Pick<
		RiseopediaClassificationDirectoryFilters,
		"section" | "entityClassCode"
	> & { releaseFilters?: MafiosopediaReleaseFilterCode[] },
) {
	const releaseFilters = effectiveReleaseFilters(wiki, filters.releaseFilters);
	return wiki.code === "mafiosopedia"
		? listMafiosopediaCategoryFilterOptions({
				section: filters.section,
				entityClassCode: filters.entityClassCode,
				releaseFilters,
			})
		: listRiseopediaCategoryFilterOptions(filters);
}

export async function listOpediaSubcategoryFilterOptions(
	wiki: OpediaWikiConfig,
	filters: RiseopediaClassificationDirectoryFilters & {
		releaseFilters?: MafiosopediaReleaseFilterCode[];
	},
) {
	const releaseFilters = effectiveReleaseFilters(wiki, filters.releaseFilters);
	return wiki.code === "mafiosopedia"
		? listMafiosopediaSubcategoryFilterOptions({ ...filters, releaseFilters })
		: listRiseopediaSubcategoryFilterOptions(filters);
}

export async function listOpediaEntities(
	wiki: OpediaWikiConfig,
	filters: RiseopediaEntityListFilters & {
		releaseFilters?: MafiosopediaReleaseFilterCode[];
	},
) {
	const releaseFilters = effectiveReleaseFilters(wiki, filters.releaseFilters);
	return wiki.code === "mafiosopedia"
		? listMafiosopediaEntities({ ...filters, releaseFilters })
		: listRiseopediaEntities(filters);
}

export async function listOpediaEntityClassFilterOptions(
	wiki: OpediaWikiConfig,
	filters: Pick<RiseopediaEntityFilterOptionFilters, "section"> & {
		releaseFilters?: MafiosopediaReleaseFilterCode[];
	},
) {
	const releaseFilters = effectiveReleaseFilters(wiki, filters.releaseFilters);
	return wiki.code === "mafiosopedia"
		? listMafiosopediaEntityClassFilterOptions({
				section: filters.section,
				releaseFilters,
			})
		: listRiseopediaEntityClassFilterOptions(filters);
}

export async function listOpediaEntityCategoryFilterOptions(
	wiki: OpediaWikiConfig,
	filters: Pick<
		RiseopediaEntityFilterOptionFilters,
		"section" | "entityClassCode"
	> & { releaseFilters?: MafiosopediaReleaseFilterCode[] },
) {
	const releaseFilters = effectiveReleaseFilters(wiki, filters.releaseFilters);
	return wiki.code === "mafiosopedia"
		? listMafiosopediaEntityCategoryFilterOptions({
				section: filters.section,
				entityClassCode: filters.entityClassCode,
				releaseFilters,
			})
		: listRiseopediaEntityCategoryFilterOptions(filters);
}

export async function listOpediaEntitySubcategoryFilterOptions(
	wiki: OpediaWikiConfig,
	filters: Pick<
		RiseopediaEntityFilterOptionFilters,
		"section" | "entityClassCode" | "categorySlug"
	> & { releaseFilters?: MafiosopediaReleaseFilterCode[] },
) {
	const releaseFilters = effectiveReleaseFilters(wiki, filters.releaseFilters);
	return wiki.code === "mafiosopedia"
		? listMafiosopediaEntitySubcategoryFilterOptions({
				section: filters.section,
				entityClassCode: filters.entityClassCode,
				categorySlug: filters.categorySlug,
				releaseFilters,
			})
		: listRiseopediaEntitySubcategoryFilterOptions(filters);
}

export async function findOpediaEntityDetailByEntitySlug(
	wiki: OpediaWikiConfig,
	entitySlug: string,
) {
	return wiki.code === "mafiosopedia"
		? findMafiosopediaEntityDetailByEntitySlug(entitySlug)
		: findRiseopediaEntityDetailByEntitySlug(entitySlug);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
