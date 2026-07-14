//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/data/member-authoring.ts                                                            ////
//// Language: TS                                                                                               ////
//// DB-first member authoring lookup helpers for public/member workspace surfaces.                             ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import "server-only";

import { query } from "@/lib/data/pg";

type JsonPayloadRow = {
	payload: unknown;
};

export type MemberAuthorableCollection = {
	categoryId: string;
	categoryTitle: string;
	categorySlug: string;
	subcategoryId: string;
	subcategoryTitle: string;
	subcategorySlug: string;
	label: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(record: Record<string, unknown>, key: string): string {
	const value = record[key];
	return typeof value === "string" ? value : "";
}

function mapCollection(value: unknown): MemberAuthorableCollection | null {
	if (!isRecord(value)) {
		return null;
	}

	const categoryId = readString(value, "categoryId");
	const categoryTitle = readString(value, "categoryTitle");
	const categorySlug = readString(value, "categorySlug");
	const subcategoryId = readString(value, "subcategoryId");
	const subcategoryTitle = readString(value, "subcategoryTitle");
	const subcategorySlug = readString(value, "subcategorySlug");
	const label = readString(value, "label");

	if (!categoryId || !subcategoryId) {
		return null;
	}

	return {
		categoryId,
		categoryTitle,
		categorySlug,
		subcategoryId,
		subcategoryTitle,
		subcategorySlug,
		label: label || [categoryTitle, subcategoryTitle].filter(Boolean).join(" / "),
	};
}

export async function listMemberAuthorableCollections(
	actorDiscordId: string,
): Promise<MemberAuthorableCollection[]> {
	const result = await query<JsonPayloadRow>(
		`SELECT web_api.web_member_authorable_collections($1) AS payload`,
		[actorDiscordId],
	);
	const payload = result.rows[0]?.payload;
	if (!Array.isArray(payload)) {
		return [];
	}

	return payload.flatMap((value) => {
		const mapped = mapCollection(value);
		return mapped ? [mapped] : [];
	});
}

export function findMemberAuthorableCollection(args: {
	collections: MemberAuthorableCollection[];
	categoryId: string;
	subcategoryId: string;
}): MemberAuthorableCollection | null {
	return (
		args.collections.find(
			(collection) =>
				collection.categoryId === args.categoryId &&
				collection.subcategoryId === args.subcategoryId,
		) ?? null
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
