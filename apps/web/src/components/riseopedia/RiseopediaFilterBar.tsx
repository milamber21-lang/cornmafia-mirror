//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/RiseopediaFilterBar.tsx                                           ////
//// Language: TSX                                                                                              ////
//// Dynamic URL-backed Riseopedia browser controls using existing UI inputs, dropdowns, and links.              ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

"use client";

import type { FormEvent, JSX } from "react";
import * as React from "react";
import { useRouter } from "next/navigation";

import { ButtonLink, DropdownMenuSingle, Input } from "@/components/ui";

export type RiseopediaFilterOption = {
	value: string;
	label: string;
	count?: number;
};

export type RiseopediaFilterBarProps = {
	action: string;
	search: string | null;
	section: string | null;
	sectionOptions: RiseopediaFilterOption[];
	pageSize: number;
	assetClass?: string | null;
	assetClassOptions?: RiseopediaFilterOption[];
};

const ALL_VALUE = "__all";
const DEFAULT_PAGE_SIZE = 24;
const SEARCH_DEBOUNCE_MS = 325;

function formatNumber(value: number): string {
	return new Intl.NumberFormat("en-US").format(value);
}

function optionLabel(option: RiseopediaFilterOption): string {
	if (typeof option.count !== "number") {
		return option.label;
	}

	return `${option.label} (${formatNumber(option.count)})`;
}

function withAllOption(
	label: string,
	options: RiseopediaFilterOption[],
): { value: string; label: string }[] {
	return [
		{ value: ALL_VALUE, label },
		...options.map((option) => ({
			value: option.value,
			label: optionLabel(option),
		})),
	];
}

function nullableSelection(value: string | null | undefined): string {
	return value && value.trim().length > 0 ? value : ALL_VALUE;
}

function selectedValue(value: string): string | null {
	return value === ALL_VALUE ? null : value;
}

function buildHref(args: {
	action: string;
	search: string;
	sectionSelection: string;
	assetClassSelection: string | null;
	pageSize: number;
}): string {
	const params = new URLSearchParams();
	const search = args.search.trim();
	const section = selectedValue(args.sectionSelection);
	const assetClass = args.assetClassSelection
		? selectedValue(args.assetClassSelection)
		: null;

	if (search) {
		params.set("q", search);
	}

	if (section) {
		params.set("section", section);
	}

	if (assetClass) {
		params.set("class", assetClass);
	}

	if (args.pageSize !== DEFAULT_PAGE_SIZE) {
		params.set("pageSize", String(args.pageSize));
	}

	const query = params.toString();
	return query ? `${args.action}?${query}` : args.action;
}

export default function RiseopediaFilterBar({
	action,
	search,
	section,
	sectionOptions,
	pageSize,
	assetClass,
	assetClassOptions,
}: RiseopediaFilterBarProps): JSX.Element {
	const router = useRouter();
	const hasAssetClassFilter = Array.isArray(assetClassOptions);
	const [searchValue, setSearchValue] = React.useState(search ?? "");
	const [sectionSelection, setSectionSelection] = React.useState(
		nullableSelection(section),
	);
	const [assetClassSelection, setAssetClassSelection] = React.useState(
		nullableSelection(assetClass),
	);
	const hydratedRef = React.useRef(false);

	React.useEffect(() => {
		setSearchValue(search ?? "");
		setSectionSelection(nullableSelection(section));
		setAssetClassSelection(nullableSelection(assetClass));
	}, [assetClass, search, section]);

	const sectionDropdownOptions = React.useMemo(
		() => withAllOption("All sections", sectionOptions),
		[sectionOptions],
	);
	const assetClassDropdownOptions = React.useMemo(
		() => withAllOption("All classes", assetClassOptions ?? []),
		[assetClassOptions],
	);

	React.useEffect(() => {
		if (!hydratedRef.current) {
			hydratedRef.current = true;
			return undefined;
		}

		const timer = window.setTimeout(() => {
			router.replace(
				buildHref({
					action,
					search: searchValue,
					sectionSelection,
					assetClassSelection: hasAssetClassFilter ? assetClassSelection : null,
					pageSize,
				}),
				{ scroll: false },
			);
		}, SEARCH_DEBOUNCE_MS);

		return () => window.clearTimeout(timer);
	}, [
		action,
		assetClassSelection,
		hasAssetClassFilter,
		pageSize,
		router,
		searchValue,
		sectionSelection,
	]);

	function submitFilters(event: FormEvent<HTMLFormElement>): void {
		event.preventDefault();
		router.replace(
			buildHref({
				action,
				search: searchValue,
				sectionSelection,
				assetClassSelection: hasAssetClassFilter ? assetClassSelection : null,
				pageSize,
			}),
			{ scroll: false },
		);
	}

	return (
		<form
			className={
				hasAssetClassFilter
					? "public-collection-controls riseopedia-filter-bar riseopedia-filter-bar--assets"
					: "public-collection-controls riseopedia-filter-bar riseopedia-filter-bar--recipes"
			}
			onSubmit={submitFilters}
		>
			<div className="riseopedia-filter-bar__control">
				<DropdownMenuSingle
					className="public-collection-control"
					options={sectionDropdownOptions}
					value={sectionSelection}
					onChange={setSectionSelection}
					ariaLabel="Filter Riseopedia by section"
				/>
			</div>

			{hasAssetClassFilter ? (
				<div className="riseopedia-filter-bar__control">
					<DropdownMenuSingle
						className="public-collection-control"
						options={assetClassDropdownOptions}
						value={assetClassSelection}
						onChange={setAssetClassSelection}
						ariaLabel="Filter Riseopedia assets by class"
					/>
				</div>
			) : null}

			<label className="public-collection-sr-label" htmlFor="riseopedia-browser-search">
				Search
			</label>
			<Input
				id="riseopedia-browser-search"
				type="search"
				value={searchValue}
				onChange={(event) => setSearchValue(event.currentTarget.value)}
				placeholder="Search by name or key..."
			/>

			<div className="riseopedia-filter-bar__actions">
				<ButtonLink href={action} variant="neutral">
					Reset
				</ButtonLink>
			</div>
		</form>
	);
}
