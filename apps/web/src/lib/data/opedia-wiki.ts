//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/data/opedia-wiki.ts                                                               ////
//// Language: TS                                                                                             ////
//// Dispatches public info wiki reads between Riseopedia and Mafiosopedia read-model families.                 ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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
		description: "Browse public game knowledge by section, class, and category. Search to jump directly into matching entries.",
		browserDescription: "Matching public Riseopedia entries across sections, classes, categories, and subcategories.",
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
		description: "Browse latest-known game knowledge by section, class, and category. Search to jump directly into matching entries.",
		browserDescription: "Matching Mafiosopedia entries across sections, classes, categories, and subcategories.",
		emptyPublicLabel: "Mafiosopedia",
		basePath: "/info/mafiosopedia",
		browsePath: "/info/mafiosopedia/browse",
		sectionsPath: "/info/mafiosopedia/sections",
		classesPath: "/info/mafiosopedia/classes",
		categoriesPath: "/info/mafiosopedia/categories",
		subcategoriesPath: "/info/mafiosopedia/subcategories",
	},
};

export function getOpediaWikiConfig(categorySlug: string): OpediaWikiConfig | null {
	return categorySlug === "riseopedia" || categorySlug === "mafiosopedia"
		? WIKI_CONFIGS[categorySlug]
		: null;
}

export function opediaHomeBreadcrumb(wiki: OpediaWikiConfig) {
	return { label: wiki.title, href: wiki.browsePath };
}

export async function getOpediaHubData(wiki: OpediaWikiConfig) {
	return wiki.code === "mafiosopedia" ? getMafiosopediaHubData() : getRiseopediaHubData();
}

export async function listOpediaSections(wiki: OpediaWikiConfig) {
	return wiki.code === "mafiosopedia" ? listMafiosopediaSections() : listRiseopediaSections();
}

export async function findOpediaSectionBySlug(wiki: OpediaWikiConfig, sectionSlug: string) {
	return wiki.code === "mafiosopedia"
		? findMafiosopediaSectionBySlug(sectionSlug)
		: findRiseopediaSectionBySlug(sectionSlug);
}

export async function listOpediaSectionDirectoryCards(wiki: OpediaWikiConfig) {
	return wiki.code === "mafiosopedia"
		? listMafiosopediaSectionDirectoryCards()
		: listRiseopediaSectionDirectoryCards();
}

export async function listOpediaClassDirectoryCards(
	wiki: OpediaWikiConfig,
	filters: Pick<RiseopediaClassificationDirectoryFilters, "section">,
) {
	return wiki.code === "mafiosopedia"
		? listMafiosopediaClassDirectoryCards(filters)
		: listRiseopediaClassDirectoryCards(filters);
}

export async function listOpediaCategoryDirectoryCards(
	wiki: OpediaWikiConfig,
	filters: Pick<RiseopediaClassificationDirectoryFilters, "section" | "entityClassCode">,
) {
	return wiki.code === "mafiosopedia"
		? listMafiosopediaCategoryDirectoryCards(filters)
		: listRiseopediaCategoryDirectoryCards(filters);
}

export async function listOpediaSubcategoryDirectoryCards(
	wiki: OpediaWikiConfig,
	filters: RiseopediaClassificationDirectoryFilters = {
		section: null,
		entityClassCode: null,
		categorySlug: null,
	},
) {
	return wiki.code === "mafiosopedia"
		? listMafiosopediaSubcategoryDirectoryCards(filters)
		: listRiseopediaSubcategoryDirectoryCards(filters);
}

export async function listOpediaClassFilterOptions(
	wiki: OpediaWikiConfig,
	filters: Pick<RiseopediaClassificationDirectoryFilters, "section">,
) {
	return wiki.code === "mafiosopedia"
		? listMafiosopediaClassFilterOptions(filters)
		: listRiseopediaClassFilterOptions(filters);
}

export async function listOpediaCategoryFilterOptions(
	wiki: OpediaWikiConfig,
	filters: Pick<RiseopediaClassificationDirectoryFilters, "section" | "entityClassCode">,
) {
	return wiki.code === "mafiosopedia"
		? listMafiosopediaCategoryFilterOptions(filters)
		: listRiseopediaCategoryFilterOptions(filters);
}

export async function listOpediaSubcategoryFilterOptions(
	wiki: OpediaWikiConfig,
	filters: RiseopediaClassificationDirectoryFilters,
) {
	return wiki.code === "mafiosopedia"
		? listMafiosopediaSubcategoryFilterOptions(filters)
		: listRiseopediaSubcategoryFilterOptions(filters);
}

export async function listOpediaEntities(
	wiki: OpediaWikiConfig,
	filters: RiseopediaEntityListFilters,
) {
	return wiki.code === "mafiosopedia"
		? listMafiosopediaEntities(filters)
		: listRiseopediaEntities(filters);
}

export async function listOpediaEntityClassFilterOptions(
	wiki: OpediaWikiConfig,
	filters: Pick<RiseopediaEntityFilterOptionFilters, "section">,
) {
	return wiki.code === "mafiosopedia"
		? listMafiosopediaEntityClassFilterOptions(filters)
		: listRiseopediaEntityClassFilterOptions(filters);
}

export async function listOpediaEntityCategoryFilterOptions(
	wiki: OpediaWikiConfig,
	filters: Pick<RiseopediaEntityFilterOptionFilters, "section" | "entityClassCode">,
) {
	return wiki.code === "mafiosopedia"
		? listMafiosopediaEntityCategoryFilterOptions(filters)
		: listRiseopediaEntityCategoryFilterOptions(filters);
}

export async function listOpediaEntitySubcategoryFilterOptions(
	wiki: OpediaWikiConfig,
	filters: Pick<RiseopediaEntityFilterOptionFilters, "section" | "entityClassCode" | "categorySlug">,
) {
	return wiki.code === "mafiosopedia"
		? listMafiosopediaEntitySubcategoryFilterOptions(filters)
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
