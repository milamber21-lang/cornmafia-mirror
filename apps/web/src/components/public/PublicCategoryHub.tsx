//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/public/PublicCategoryHub.tsx                                                    ////
//// Language: TSX                                                                                                 ////
//// Public category landing surface using the shared browse header, controls, result cards, and recent content.  ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

"use client";

import type { JSX } from "react";
import * as React from "react";
import { FolderOpen, SearchX } from "lucide-react";

import PublicContentCard from "@/components/public/PublicContentCard";
import PublicTaxonomyIcon from "@/components/public/PublicTaxonomyIcon";
import {
	BrowseFilterPanel,
	BrowsePageHeader,
	BrowsePanelHeader,
	BrowseResultCard,
	BrowseResultsPanel,
	DropdownMenuSingle,
	Input,
	StatusPill,
	SurfaceState,
} from "@/components/ui";
import type {
	PublicCategoryResult,
	PublicCategorySubcategory,
} from "@/lib/data/public-content";
import {
	compareDisplayText,
	formatDisplayInteger,
} from "@/lib/helpers/display-format";

export type PublicCategorySortCode = "title" | "entries";

type PublicCategoryHubProps = {
	category: PublicCategoryResult;
};

const RECENT_CONTENT_LIMIT = 6;

const SORT_OPTIONS: Array<{
	value: PublicCategorySortCode;
	label: string;
}> = [
	{ value: "title", label: "Title A-Z" },
	{ value: "entries", label: "Most entries" },
];

function formatCount(value: number, singular: string, plural: string): string {
	return `${formatDisplayInteger(value)} ${value === 1 ? singular : plural}`;
}

function normalizeSearch(value: string): string {
	return value.trim().toLowerCase();
}

function compareCollections(
	left: PublicCategorySubcategory,
	right: PublicCategorySubcategory,
	sort: PublicCategorySortCode,
): number {
	if (sort === "entries" && left.contentCount !== right.contentCount) {
		return right.contentCount - left.contentCount;
	}

	return compareDisplayText(left.title, right.title);
}

function PublicCategoryCollectionCard({
	collection,
}: {
	collection: PublicCategorySubcategory;
}): JSX.Element {
	return (
		<BrowseResultCard
			href={collection.href}
			density="standard"
			className="public-category-collection-card"
			visual={
				<PublicTaxonomyIcon
					iconKey={collection.iconKey}
					iconColor={collection.iconColor}
					title={collection.title}
					size="lg"
					fallbackLucideName="FolderOpen"
				/>
			}
			eyebrow="Collection"
			title={collection.title}
			summary={formatCount(collection.contentCount, "entry", "entries")}
		/>
	);
}

export default function PublicCategoryHub({
	category,
}: PublicCategoryHubProps): JSX.Element {
	const [search, setSearch] = React.useState("");
	const [sort, setSort] = React.useState<PublicCategorySortCode>("title");
	const recentContent = category.content.slice(0, RECENT_CONTENT_LIMIT);
	const normalizedSearch = normalizeSearch(search);

	const visibleCollections = React.useMemo(
		() =>
			category.subcategories
				.filter((collection) =>
					normalizedSearch
						? collection.title.toLowerCase().includes(normalizedSearch)
						: true,
				)
				.sort((left, right) => compareCollections(left, right, sort)),
		[category.subcategories, normalizedSearch, sort],
	);

	return (
		<section className="public-directory-shell">
			<div className="public-directory-page">
				<BrowsePageHeader
					className="public-overview-header"
					breadcrumbs={[{ label: "Browse" }, { label: category.category.title }]}
					title={category.category.title}
					actions={
						<StatusPill tone="muted">
							{formatCount(
								visibleCollections.length,
								"matching collection",
								"matching collections",
							)}
						</StatusPill>
					}
				/>

				<BrowseFilterPanel
					className="public-category-filter-panel"
					aria-label={`${category.category.title} collection filters`}
				>
					<div className="public-category-controls">
						<div className="public-browse-filter-search">
							<label
								className="public-collection-sr-label"
								htmlFor="category-collection-search"
							>
								Search collections
							</label>
							<Input
								id="category-collection-search"
								type="search"
								value={search}
								onChange={(event) => setSearch(event.currentTarget.value)}
								placeholder={`Search ${category.category.title.toLowerCase()} collections...`}
							/>
						</div>
						<DropdownMenuSingle
							options={SORT_OPTIONS}
							value={sort}
							onChange={(value) => setSort(value === "entries" ? "entries" : "title")}
							ariaLabel="Sort category collections"
							className="public-collection-control"
						/>
					</div>
				</BrowseFilterPanel>

				<BrowseResultsPanel
					className="public-category-results-panel"
					aria-label={`${category.category.title} collections`}
				>
					{visibleCollections.length > 0 ? (
						<div className="public-directory-grid">
							{visibleCollections.map((collection) => (
								<PublicCategoryCollectionCard
									key={collection.id}
									collection={collection}
								/>
							))}
						</div>
					) : category.subcategories.length > 0 ? (
						<SurfaceState
							kind="empty"
							align="center"
							icon={<SearchX aria-hidden />}
							title="No collections match this search"
							description="Try another collection name or clear the search field."
						/>
					) : (
						<SurfaceState
							kind="empty"
							align="center"
							icon={<FolderOpen aria-hidden />}
							title="No visible collections"
							description="Collections will appear here when they are published and readable for your role."
						/>
					)}
				</BrowseResultsPanel>

				{recentContent.length > 0 ? (
					<BrowseResultsPanel
						className="public-category-latest-panel"
						aria-label={`Latest content from ${category.category.title}`}
					>
						<BrowsePanelHeader
							eyebrow="Recently published"
							title={`Latest from ${category.category.title}`}
							description="The newest entries currently available across this category."
						/>
						<div className="public-collection-grid">
							{recentContent.map((card) => (
								<PublicContentCard
									key={card.id}
									card={card}
									context={card.collection?.title ?? null}
								/>
							))}
						</div>
					</BrowseResultsPanel>
				) : null}
			</div>
		</section>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
