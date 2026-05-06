//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/admin/web/content/page.tsx                                                            ////
//// Language: TSX                                                                                                ////
//// Admin page for the DB-first content family                                                                    ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { JSX } from "react";
import Link from "next/link";

import ContentTable from "@/components/admin/web/ContentTable";
import { ButtonLink } from "@/components/ui";
import { requireAdminOrEditor } from "@/lib/auth/authz";
import {
	listContentAdminPage,
	listContentCategories,
	listContentSubcategories,
	type ContentAdminSortBy,
	type ContentAdminSortDir,
} from "@/lib/data/content";

export const dynamic = "force-dynamic";

type ContentAdminPageProps = {
	searchParams: Promise<{
		search?: string;
		page?: string;
		pageSize?: string;
		categoryId?: string;
		subcategoryId?: string;
		sortBy?: string;
		sortDir?: string;
	}>;
};

const CONTENT_SORT_KEYS: readonly ContentAdminSortBy[] = [
	"title",
	"slug",
	"kind",
	"category",
	"subcategory",
	"template",
] as const;

function parsePositiveInt(value: string | undefined, fallback: number): number {
	if (!value || !/^\d+$/.test(value.trim())) {
		return fallback;
	}

	const parsed = Number(value.trim());
	return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseSortBy(value: string | undefined): ContentAdminSortBy {
	return CONTENT_SORT_KEYS.find((sortKey) => sortKey === value) ?? "title";
}

function parseSortDir(value: string | undefined): ContentAdminSortDir {
	return value === "desc" ? "desc" : "asc";
}

function parseNullablePositiveInt(value: string | undefined): number | null {
	if (!value || !/^\d+$/.test(value.trim())) {
		return null;
	}

	const parsed = Number(value.trim());
	return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export default async function ContentAdminPage({
	searchParams,
}: ContentAdminPageProps): Promise<JSX.Element> {
	const guard = await requireAdminOrEditor();

	if (!guard.allowed) {
		if (guard.reason === "not-authenticated") {
			return (
				<div className="admin-guard-shell">
					<h1 className="admin-guard-title">Content</h1>
					<p className="admin-guard-message">You need to sign in to access the admin area.</p>
					<Link href="/login" className="admin-guard-link">
						Go to login
					</Link>
				</div>
			);
		}

		return (
			<div className="admin-guard-shell">
				<h1 className="admin-guard-title">Content</h1>
				<p className="admin-guard-message">Admin or editor access is required.</p>
				<ButtonLink href="/admin" variant="neutral">
					Go back
				</ButtonLink>
			</div>
		);
	}

	const resolvedSearchParams = await searchParams;
	const search = (resolvedSearchParams.search ?? "").trim();
	const page = parsePositiveInt(resolvedSearchParams.page, 1);
	const pageSize = Math.min(
		Math.max(parsePositiveInt(resolvedSearchParams.pageSize, 20), 1),
		100,
	);
	const categoryId = parseNullablePositiveInt(resolvedSearchParams.categoryId);
	const subcategoryId = parseNullablePositiveInt(
		resolvedSearchParams.subcategoryId,
	);
	const sortBy = parseSortBy(resolvedSearchParams.sortBy);
	const sortDir = parseSortDir(resolvedSearchParams.sortDir);
	const [initialPage, categories, subcategories] = await Promise.all([
		listContentAdminPage({
			search,
			page,
			pageSize,
			categoryId,
			subcategoryId,
			sortBy,
			sortDir,
		}),
		listContentCategories(),
		listContentSubcategories(),
	]);

	return (
		<section className="card">
			<div className="admin-page-card-header">
				<h1 className="admin-page-card-title">Content</h1>

				<div className="admin-page-card-actions">
					<ButtonLink href="/admin" variant="neutral">
						Go back
					</ButtonLink>
				</div>
			</div>

			<ContentTable
				initialPage={initialPage}
				categories={categories}
				subcategories={subcategories}
			/>
		</section>
	);
}
