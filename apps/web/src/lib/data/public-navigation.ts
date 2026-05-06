//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/data/public-navigation.ts                                                           ////
//// Language: TS                                                                                                ////
//// DB-first public navigation loader that maps selected navigation panels into the menu model                  ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import "server-only";

import { query } from "@/lib/data/pg";
import type { IconMediaRef, IconShape } from "@/lib/helpers/icons";

export type PublicMenuIcon = Partial<IconShape> | null;

export type PublicMenuIconColor = {
	id: string;
	key: string | null;
	label: string | null;
	preview: string | null;
} | null;

export type PublicMenuLinkTarget = {
	isExternal: boolean;
	target: string | null;
	rel: string | null;
};

export type PublicMenuModel = Array<{
	id: string;
	title: string;
	iconKey: PublicMenuIcon;
	iconColor: PublicMenuIconColor;
	columns: Array<{
		id: string;
		title: string;
		seeAllHref: string;
		iconKey: PublicMenuIcon;
		iconColor: PublicMenuIconColor;
		pages: Array<{
			id: string;
			title: string;
			href: string;
			iconKey: PublicMenuIcon;
			iconColor: PublicMenuIconColor;
			isExternal: boolean;
			target: string | null;
			rel: string | null;
		}>;
	}>;
}>;

type PublicNavigationDbRow = {
	doc: unknown;
};

type PublicMenuPage = {
	id: string;
	title: string;
	href: string;
	iconKey: PublicMenuIcon;
	iconColor: PublicMenuIconColor;
	isExternal: boolean;
	target: string | null;
	rel: string | null;
};

type PublicMenuColumn = {
	id: string;
	title: string;
	seeAllHref: string;
	iconKey: PublicMenuIcon;
	iconColor: PublicMenuIconColor;
	pages: PublicMenuPage[];
};

type PublicMenuCategory = {
	id: string;
	title: string;
	iconKey: PublicMenuIcon;
	iconColor: PublicMenuIconColor;
	columns: PublicMenuColumn[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getString(value: Record<string, unknown>, key: string): string | null {
	const fieldValue = value[key];
	return typeof fieldValue === "string" && fieldValue.trim().length > 0
		? fieldValue
		: null;
}

function getBoolean(value: Record<string, unknown>, key: string): boolean {
	return value[key] === true;
}

function getArray(value: Record<string, unknown>, key: string): unknown[] {
	const fieldValue = value[key];
	return Array.isArray(fieldValue) ? fieldValue : [];
}

function normalizeIconMedia(value: unknown): IconMediaRef | null {
	if (!isRecord(value)) {
		return null;
	}

	const id = getString(value, "id");
	if (!id) {
		return null;
	}

	return {
		id,
		url: getString(value, "url"),
		filename: getString(value, "filename"),
		originalFilename: getString(value, "originalFilename"),
		mimeType: getString(value, "mimeType"),
		storageRelPath: getString(value, "storageRelPath"),
		thumbnailURL: getString(value, "thumbnailURL"),
	};
}

function mapIcon(value: unknown): PublicMenuIcon {
	if (!isRecord(value)) {
		return null;
	}

	const id = getString(value, "id");
	if (!id) {
		return null;
	}

	const sourceValue = getString(value, "source");
	const source = sourceValue === "media" ? "media" : "lucide";

	return {
		id,
		key: getString(value, "key"),
		label: getString(value, "label"),
		source,
		lucideName: getString(value, "lucideName"),
		iconMedia: normalizeIconMedia(value.iconMedia),
	};
}

function mapIconColor(value: unknown): PublicMenuIconColor {
	if (!isRecord(value)) {
		return null;
	}

	const id = getString(value, "id");
	if (!id) {
		return null;
	}

	return {
		id,
		key: getString(value, "key"),
		label: getString(value, "label"),
		preview: getString(value, "preview"),
	};
}

function mapPage(value: unknown): PublicMenuPage | null {
	if (!isRecord(value)) {
		return null;
	}

	const title = getString(value, "title");
	const href = getString(value, "href");
	if (!title || !href) {
		return null;
	}

	return {
		id: getString(value, "id") ?? href,
		title,
		href,
		iconKey: mapIcon(value.iconKey),
		iconColor: mapIconColor(value.iconColor),
		isExternal: getBoolean(value, "isExternal"),
		target: getString(value, "target"),
		rel: getString(value, "rel"),
	};
}

function mapColumn(value: unknown): PublicMenuColumn | null {
	if (!isRecord(value)) {
		return null;
	}

	const id = getString(value, "id");
	const title = getString(value, "title");
	const seeAllHref = getString(value, "seeAllHref");
	if (!id || !title || !seeAllHref) {
		return null;
	}

	return {
		id,
		title,
		seeAllHref,
		iconKey: mapIcon(value.iconKey),
		iconColor: mapIconColor(value.iconColor),
		pages: getArray(value, "pages")
			.map(mapPage)
			.filter((row): row is PublicMenuPage => row !== null),
	};
}

function mapCategory(value: unknown): PublicMenuCategory | null {
	if (!isRecord(value)) {
		return null;
	}

	const id = getString(value, "id");
	const title = getString(value, "title");
	if (!id || !title) {
		return null;
	}

	return {
		id,
		title,
		iconKey: mapIcon(value.iconKey),
		iconColor: mapIconColor(value.iconColor),
		columns: getArray(value, "columns")
			.map(mapColumn)
			.filter((row): row is PublicMenuColumn => row !== null),
	};
}

function mapPublicMenuModel(value: unknown): PublicMenuModel {
	if (!isRecord(value)) {
		return [];
	}

	return getArray(value, "items")
		.map(mapCategory)
		.filter((row): row is PublicMenuCategory => row !== null);
}

export async function getPublicNavigationMenuModel(args: {
	actorDiscordId: string | null;
	panelSlotCode?: string;
}): Promise<PublicMenuModel> {
	const result = await query<PublicNavigationDbRow>(
		`
			SELECT web_api.web_navigation_public_get($1, $2) AS doc
		`,
		[args.actorDiscordId, args.panelSlotCode ?? "header_main"],
	);

	return mapPublicMenuModel(result.rows[0]?.doc ?? null);
}
