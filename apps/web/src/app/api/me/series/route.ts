//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/me/series/route.ts                                                              ////
//// Language: TS                                                                                               ////
//// Member API route for owned/manageable series list, dependencies, and mutations.                            ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { NextRequest, NextResponse } from "next/server";

import { listMemberAuthorableCollections } from "@/lib/data/member-authoring";
import {
	createMemberSeries,
	deleteMemberSeries,
	listMemberSeries,
	listMemberSeriesDeleteBlockers,
	updateMemberSeries,
} from "@/lib/data/member-series";
import { getCurrentActorDiscordId } from "@/lib/server/current-actor";

export const dynamic = "force-dynamic";

type MutationBody = {
	op?: unknown;
	id?: unknown;
	data?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string {
	return typeof value === "string" ? value.trim() : "";
}

async function readBody(request: NextRequest): Promise<MutationBody | null> {
	try {
		return (await request.json()) as MutationBody;
	} catch {
		return null;
	}
}

async function readSeriesPayload(actorDiscordId: string): Promise<Response> {
	const [rows, collections] = await Promise.all([
		listMemberSeries(actorDiscordId),
		listMemberAuthorableCollections(actorDiscordId),
	]);
	return NextResponse.json({ rows, collections });
}

export async function GET(): Promise<Response> {
	const actorDiscordId = await getCurrentActorDiscordId();
	if (!actorDiscordId) {
		return NextResponse.json({ message: "Sign in required." }, { status: 401 });
	}

	try {
		return await readSeriesPayload(actorDiscordId);
	} catch (error: unknown) {
		const message =
			error instanceof Error ? error.message : "Failed to load member series.";
		return NextResponse.json({ message }, { status: 500 });
	}
}

export async function POST(request: NextRequest): Promise<Response> {
	const actorDiscordId = await getCurrentActorDiscordId();
	if (!actorDiscordId) {
		return NextResponse.json({ message: "Sign in required." }, { status: 401 });
	}

	const body = await readBody(request);
	if (!body) {
		return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
	}

	const op = readString(body.op);
	const data = isRecord(body.data) ? body.data : {};

	try {
		if (op === "create") {
			const title = readString(data.title);
			const description = readString(data.description);
			const categoryId = readString(data.categoryId);
			const subcategoryId = readString(data.subcategoryId);

			if (!title) {
				return NextResponse.json(
					{ message: "Series title is required." },
					{ status: 400 },
				);
			}
			if (!categoryId || !subcategoryId) {
				return NextResponse.json(
					{ message: "Collection is required." },
					{ status: 400 },
				);
			}

			await createMemberSeries({
				actorDiscordId,
				title,
				description,
				categoryId,
				subcategoryId,
			});
			return await readSeriesPayload(actorDiscordId);
		}

		if (op === "update") {
			const id = readString(body.id);
			const title = readString(data.title);
			const description = readString(data.description);

			if (!id) {
				return NextResponse.json(
					{ message: "Series id is required." },
					{ status: 400 },
				);
			}
			if (!title) {
				return NextResponse.json(
					{ message: "Series title is required." },
					{ status: 400 },
				);
			}

			await updateMemberSeries({
				actorDiscordId,
				seriesId: id,
				title,
				description,
			});
			return await readSeriesPayload(actorDiscordId);
		}

		if (op === "delete") {
			const id = readString(body.id);
			if (!id) {
				return NextResponse.json(
					{ message: "Series id is required." },
					{ status: 400 },
				);
			}

			const blockers = await listMemberSeriesDeleteBlockers({
				actorDiscordId,
				seriesId: id,
			});
			if (blockers.length > 0) {
				return NextResponse.json(
					{
						message: "This series is used by content and cannot be deleted.",
						blockers,
					},
					{ status: 409 },
				);
			}

			await deleteMemberSeries({ actorDiscordId, seriesId: id });
			return await readSeriesPayload(actorDiscordId);
		}

		return NextResponse.json(
			{ message: 'Operation must be "create", "update", or "delete".' },
			{ status: 400 },
		);
	} catch (error: unknown) {
		const message =
			error instanceof Error ? error.message : "Failed to save member series.";
		return NextResponse.json({ message }, { status: 400 });
	}
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
