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

import { DropdownMenuSingle, Input } from "@/components/ui";

export type RiseopediaFilterOption = {
	value: string;
	label: string;
	count?: number;
};

export type RiseopediaFilterBarProps = {
	action: string;
	search: string | null;
	pageSize?: number;
	section?: string | null;
	sectionOptions?: RiseopediaFilterOption[];
	entityClass?: string | null;
	entityClassOptions?: RiseopediaFilterOption[];
	category?: string | null;
	categoryOptions?: RiseopediaFilterOption[];
	subcategory?: string | null;
	subcategoryOptions?: RiseopediaFilterOption[];
	showSectionFilter?: boolean;
	showClassFilter?: boolean;
	showCategoryFilter?: boolean;
	showSubcategoryFilter?: boolean;
	searchPlaceholder?: string;
	wikiName?: string;
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
	entityClassSelection: string;
	categorySelection: string;
	subcategorySelection: string;
	includeSectionFilter: boolean;
	includeClassFilter: boolean;
	includeCategoryFilter: boolean;
	includeSubcategoryFilter: boolean;
	pageSize: number;
}): string {
	const params = new URLSearchParams();
	const search = args.search.trim();
	const section = args.includeSectionFilter
		? selectedValue(args.sectionSelection)
		: null;
	const entityClass = args.includeClassFilter
		? selectedValue(args.entityClassSelection)
		: null;
	const category = args.includeCategoryFilter
		? selectedValue(args.categorySelection)
		: null;
	const subcategory = args.includeSubcategoryFilter
		? selectedValue(args.subcategorySelection)
		: null;

	if (search) {
		params.set("q", search);
	}

	if (section) {
		params.set("section", section);
	}

	if (entityClass) {
		params.set("class", entityClass);
	}

	if (category) {
		params.set("category", category);
	}

	if (subcategory) {
		params.set("subcategory", subcategory);
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
	pageSize = DEFAULT_PAGE_SIZE,
	section = null,
	sectionOptions = [],
	entityClass = null,
	entityClassOptions = [],
	category = null,
	categoryOptions = [],
	subcategory = null,
	subcategoryOptions = [],
	showSectionFilter = false,
	showClassFilter = false,
	showCategoryFilter = false,
	showSubcategoryFilter = false,
	searchPlaceholder = "Search entries...",
	wikiName = "Riseopedia",
}: RiseopediaFilterBarProps): JSX.Element {
	const router = useRouter();
	const [searchValue, setSearchValue] = React.useState(search ?? "");
	const [sectionSelection, setSectionSelection] = React.useState(nullableSelection(section));
	const [entityClassSelection, setEntityClassSelection] = React.useState(nullableSelection(entityClass));
	const [categorySelection, setCategorySelection] = React.useState(nullableSelection(category));
	const [subcategorySelection, setSubcategorySelection] = React.useState(nullableSelection(subcategory));
	const hydratedRef = React.useRef(false);

	React.useEffect(() => {
		setSearchValue(search ?? "");
		setSectionSelection(nullableSelection(section));
		setEntityClassSelection(nullableSelection(entityClass));
		setCategorySelection(nullableSelection(category));
		setSubcategorySelection(nullableSelection(subcategory));
	}, [category, entityClass, search, section, subcategory]);

	const sectionDropdownOptions = React.useMemo(
		() => withAllOption("All sections", sectionOptions),
		[sectionOptions],
	);
	const classDropdownOptions = React.useMemo(
		() => withAllOption("All classes", entityClassOptions),
		[entityClassOptions],
	);
	const categoryDropdownOptions = React.useMemo(
		() => withAllOption("All categories", categoryOptions),
		[categoryOptions],
	);
	const subcategoryDropdownOptions = React.useMemo(
		() => withAllOption("All subcategories", subcategoryOptions),
		[subcategoryOptions],
	);

	const currentHref = React.useCallback((args?: {
		searchValue?: string;
		sectionSelection?: string;
		entityClassSelection?: string;
		categorySelection?: string;
		subcategorySelection?: string;
	}): string => buildHref({
		action,
		search: args?.searchValue ?? searchValue,
		sectionSelection: args?.sectionSelection ?? sectionSelection,
		entityClassSelection: args?.entityClassSelection ?? entityClassSelection,
		categorySelection: args?.categorySelection ?? categorySelection,
		subcategorySelection: args?.subcategorySelection ?? subcategorySelection,
		includeSectionFilter: showSectionFilter,
		includeClassFilter: showClassFilter,
		includeCategoryFilter: showCategoryFilter,
		includeSubcategoryFilter: showSubcategoryFilter,
		pageSize,
	}), [
		action,
		categorySelection,
		entityClassSelection,
		pageSize,
		searchValue,
		sectionSelection,
		showCategoryFilter,
		showClassFilter,
		showSectionFilter,
		showSubcategoryFilter,
		subcategorySelection,
	]);

	React.useEffect(() => {
		if (!hydratedRef.current) {
			hydratedRef.current = true;
			return undefined;
		}

		const timer = window.setTimeout(() => {
			router.replace(currentHref({ searchValue }), { scroll: false });
		}, SEARCH_DEBOUNCE_MS);

		return () => window.clearTimeout(timer);
	}, [currentHref, router, searchValue]);

	function submitFilters(event: FormEvent<HTMLFormElement>): void {
		event.preventDefault();
		router.replace(currentHref(), { scroll: false });
	}

	function changeSection(value: string): void {
		setSectionSelection(value);
		setEntityClassSelection(ALL_VALUE);
		setCategorySelection(ALL_VALUE);
		setSubcategorySelection(ALL_VALUE);
		router.replace(currentHref({
			sectionSelection: value,
			entityClassSelection: ALL_VALUE,
			categorySelection: ALL_VALUE,
			subcategorySelection: ALL_VALUE,
		}), { scroll: false });
	}

	function changeClass(value: string): void {
		setEntityClassSelection(value);
		setCategorySelection(ALL_VALUE);
		setSubcategorySelection(ALL_VALUE);
		router.replace(currentHref({
			entityClassSelection: value,
			categorySelection: ALL_VALUE,
			subcategorySelection: ALL_VALUE,
		}), { scroll: false });
	}

	function changeCategory(value: string): void {
		setCategorySelection(value);
		setSubcategorySelection(ALL_VALUE);
		router.replace(currentHref({
			categorySelection: value,
			subcategorySelection: ALL_VALUE,
		}), { scroll: false });
	}

	function changeSubcategory(value: string): void {
		setSubcategorySelection(value);
		router.replace(currentHref({ subcategorySelection: value }), { scroll: false });
	}

	return (
		<form className="public-collection-controls riseopedia-filter-bar" onSubmit={submitFilters}>
			{showSectionFilter ? (
				<div className="riseopedia-filter-bar__control">
					<DropdownMenuSingle
						className="public-collection-control"
						options={sectionDropdownOptions}
						value={sectionSelection}
						onChange={changeSection}
						ariaLabel={`Filter ${wikiName} by section`}
					/>
				</div>
			) : null}

			{showClassFilter ? (
				<div className="riseopedia-filter-bar__control">
					<DropdownMenuSingle
						className="public-collection-control"
						options={classDropdownOptions}
						value={entityClassSelection}
						onChange={changeClass}
						ariaLabel={`Filter ${wikiName} by class`}
					/>
				</div>
			) : null}

			{showCategoryFilter ? (
				<div className="riseopedia-filter-bar__control">
					<DropdownMenuSingle
						className="public-collection-control"
						options={categoryDropdownOptions}
						value={categorySelection}
						onChange={changeCategory}
						ariaLabel={`Filter ${wikiName} by category`}
					/>
				</div>
			) : null}

			{showSubcategoryFilter ? (
				<div className="riseopedia-filter-bar__control">
					<DropdownMenuSingle
						className="public-collection-control"
						options={subcategoryDropdownOptions}
						value={subcategorySelection}
						onChange={changeSubcategory}
						ariaLabel={`Filter ${wikiName} by subcategory`}
					/>
				</div>
			) : null}

			<div className="riseopedia-filter-bar__search">
				<label className="public-collection-sr-label" htmlFor="riseopedia-browser-search">
					Search
				</label>
				<Input
					id="riseopedia-browser-search"
					type="search"
					value={searchValue}
					onChange={(event) => setSearchValue(event.currentTarget.value)}
					placeholder={searchPlaceholder}
				/>
			</div>
		</form>
	);
}
