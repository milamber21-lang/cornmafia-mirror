//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/me/media-picker/route.ts                                                         ////
//// Language: TS                                                                                                ////
//// Member-only media picker API for RichText editor image selection without admin/shared media exposure.        ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import { NextRequest, NextResponse } from "next/server";

import { listMemberMedia } from "@/lib/data/member-media";
import { getCurrentActorDiscordId } from "@/lib/server/current-actor";

export const dynamic = "force-dynamic";

type PickerMediaRow = {
	id: string;
	alt: string;
	filename: string;
	url: string;
	categoryId: string;
	subcategoryId: string;
	ownerUsername: string;
	shared: false;
	mimeType: string;
	sizeBytes: number;
	width: number | null;
	height: number | null;
	updatedAt: string;
};

function parsePositiveInt(value: string | null, fallback: number): number {
	if (!value) {
		return fallback;
	}

	const parsed = Number(value);
	return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function includesSearchText(row: PickerMediaRow, search: string): boolean {
	if (!search) {
		return true;
	}

	const haystack = [row.alt, row.filename, row.categoryId, row.subcategoryId]
		.join(" ")
		.toLowerCase();
	return haystack.includes(search.toLowerCase());
}

export async function GET(request: NextRequest): Promise<Response> {
	const actorDiscordId = await getCurrentActorDiscordId();
	if (!actorDiscordId) {
		return NextResponse.json({ message: "Sign in required." }, { status: 401 });
	}

	const searchParams = request.nextUrl.searchParams;
	const page = parsePositiveInt(searchParams.get("page"), 1);
	const pageSize = Math.min(100, parsePositiveInt(searchParams.get("pageSize"), 20));
	const search = (searchParams.get("search") ?? "").trim();
	const categoryId = (searchParams.get("categoryId") ?? "").trim();
	const subcategoryId = (searchParams.get("subcategoryId") ?? "").trim();
	const kind = (searchParams.get("kind") ?? "").trim().toLowerCase();

	try {
		const mediaRows = await listMemberMedia(actorDiscordId);
		const mappedRows: PickerMediaRow[] = mediaRows.map((row) => ({
			id: row.id,
			alt: row.alt,
			filename: row.originalFilename,
			url: row.url,
			categoryId: row.categoryId,
			subcategoryId: row.subcategoryId,
			ownerUsername: "",
			shared: false,
			mimeType: row.mimeType,
			sizeBytes: row.sizeBytes,
			width: row.width,
			height: row.height,
			updatedAt: row.updatedAt,
		}));

		const filteredRows = mappedRows.filter((row) => {
			if (kind === "image" && !row.mimeType.startsWith("image/")) {
				return false;
			}

			if (categoryId && row.categoryId !== categoryId) {
				return false;
			}

			if (subcategoryId && row.subcategoryId !== subcategoryId) {
				return false;
			}

			return includesSearchText(row, search);
		});

		const totalDocs = filteredRows.length;
		const totalPages = Math.max(1, Math.ceil(totalDocs / pageSize));
		const resolvedPage = Math.min(page, totalPages);
		const start = (resolvedPage - 1) * pageSize;
		const rows = filteredRows.slice(start, start + pageSize);

		return NextResponse.json({
			rows,
			page: resolvedPage,
			pageSize,
			totalDocs,
			totalPages,
			sourceOptions: [],
		});
	} catch (error: unknown) {
		const message =
			error instanceof Error ? error.message : "Failed to load member media picker.";
		return NextResponse.json({ message }, { status: 500 });
	}
}
