//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/ui/RiseopediaFilterBar.tsx                                           ////
//// Language: TSX                                                                                              ////
//// URL-backed wiki browser controls with stable cascading selections and debounced draft search.               ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

"use client";

import type { FormEvent, JSX } from "react";
import * as React from "react";
import { useRouter } from "next/navigation";

import { DropdownMenuSingle, Input } from "@/components/ui";
import {
	mafiosopediaReleaseFiltersForView,
	mafiosopediaReleaseSearchParam,
	mafiosopediaReleaseViewFromFilters,
	type MafiosopediaReleaseFilterCode,
	type MafiosopediaReleaseViewCode,
} from "@/lib/data/mafiosopedia-release";
import { formatRiseopediaNumber } from "@/lib/helpers/riseopedia-number-format";

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
	releaseFilters?: MafiosopediaReleaseFilterCode[];
	showReleaseFilter?: boolean;
	showSectionFilter?: boolean;
	showClassFilter?: boolean;
	showCategoryFilter?: boolean;
	showSubcategoryFilter?: boolean;
	searchPlaceholder?: string;
	wikiName?: string;
};

const ALL_VALUE = "__all";
const DEFAULT_PAGE_SIZE = 24;
const SEARCH_DEBOUNCE_MS = 450;
const RELEASE_VIEW_OPTIONS = [
	{ value: "all", label: "All" },
	{ value: "public", label: "Public" },
	{ value: "patch", label: "Patch Rules" },
	{ value: "evidence", label: "Evidence Rules" },
	{ value: "manual", label: "Manual" },
];

function formatNumber(value: number): string {
	return formatRiseopediaNumber(value);
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

function releaseValue(
	filters: readonly MafiosopediaReleaseFilterCode[],
): string {
	return mafiosopediaReleaseSearchParam(filters);
}

function normalizeSearch(value: string): string {
	return value.trim();
}

function usePropBackedState<T>(
	propValue: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
	const [value, setValue] = React.useState(propValue);
	const previousPropRef = React.useRef(propValue);

	React.useEffect(() => {
		setValue((currentValue) => {
			const previousPropValue = previousPropRef.current;
			previousPropRef.current = propValue;

			return Object.is(currentValue, previousPropValue) ? propValue : currentValue;
		});
	}, [propValue]);

	return [value, setValue];
}

function buildHref(args: {
	action: string;
	search: string;
	sectionSelection: string;
	entityClassSelection: string;
	categorySelection: string;
	subcategorySelection: string;
	releaseFilters: MafiosopediaReleaseFilterCode[];
	includeReleaseFilter: boolean;
	includeSectionFilter: boolean;
	includeClassFilter: boolean;
	includeCategoryFilter: boolean;
	includeSubcategoryFilter: boolean;
	pageSize: number;
}): string {
	const params = new URLSearchParams();
	const search = normalizeSearch(args.search);
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
	const release = releaseValue(args.releaseFilters);

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

	if (args.includeReleaseFilter) {
		params.set("release", release);
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
	releaseFilters = mafiosopediaReleaseFiltersForView("all"),
	showReleaseFilter = false,
	showSectionFilter = false,
	showClassFilter = false,
	showCategoryFilter = false,
	showSubcategoryFilter = false,
	searchPlaceholder = "Search entries...",
	wikiName = "Riseopedia",
}: RiseopediaFilterBarProps): JSX.Element {
	const router = useRouter();
	const [searchValue, setSearchValue] = usePropBackedState(search ?? "");
	const [sectionSelection, setSectionSelection] = usePropBackedState(
		nullableSelection(section),
	);
	const [entityClassSelection, setEntityClassSelection] = usePropBackedState(
		nullableSelection(entityClass),
	);
	const [categorySelection, setCategorySelection] = usePropBackedState(
		nullableSelection(category),
	);
	const [subcategorySelection, setSubcategorySelection] = usePropBackedState(
		nullableSelection(subcategory),
	);
	const [releaseSelection, setReleaseSelection] =
		usePropBackedState<MafiosopediaReleaseViewCode>(
			mafiosopediaReleaseViewFromFilters(releaseFilters),
		);
	const hydratedRef = React.useRef(false);
	const searchTimerRef = React.useRef<number | null>(null);
	const committedSearchRef = React.useRef(search ?? "");

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

	const currentHref = React.useCallback(
		(args?: {
			searchValue?: string;
			sectionSelection?: string;
			entityClassSelection?: string;
			categorySelection?: string;
			subcategorySelection?: string;
			releaseView?: MafiosopediaReleaseViewCode;
		}): string =>
			buildHref({
				action,
				search: args?.searchValue ?? searchValue,
				sectionSelection: args?.sectionSelection ?? sectionSelection,
				entityClassSelection: args?.entityClassSelection ?? entityClassSelection,
				categorySelection: args?.categorySelection ?? categorySelection,
				subcategorySelection: args?.subcategorySelection ?? subcategorySelection,
				releaseFilters: mafiosopediaReleaseFiltersForView(
					args?.releaseView ?? releaseSelection,
				),
				includeReleaseFilter: showReleaseFilter,
				includeSectionFilter: showSectionFilter,
				includeClassFilter: showClassFilter,
				includeCategoryFilter: showCategoryFilter,
				includeSubcategoryFilter: showSubcategoryFilter,
				pageSize,
			}),
		[
			action,
			categorySelection,
			entityClassSelection,
			pageSize,
			releaseSelection,
			searchValue,
			sectionSelection,
			showCategoryFilter,
			showClassFilter,
			showReleaseFilter,
			showSectionFilter,
			showSubcategoryFilter,
			subcategorySelection,
		],
	);
	const currentHrefRef = React.useRef(currentHref);

	React.useEffect(() => {
		currentHrefRef.current = currentHref;
	}, [currentHref]);

	const cancelSearchTimer = React.useCallback((): void => {
		if (searchTimerRef.current !== null) {
			window.clearTimeout(searchTimerRef.current);
			searchTimerRef.current = null;
		}
	}, []);

	React.useEffect(() => {
		committedSearchRef.current = search ?? "";

		if (
			normalizeSearch(searchValue) === normalizeSearch(committedSearchRef.current)
		) {
			cancelSearchTimer();
		}
	}, [cancelSearchTimer, search, searchValue]);

	React.useEffect(() => {
		if (!hydratedRef.current) {
			hydratedRef.current = true;
			return undefined;
		}

		cancelSearchTimer();

		if (
			normalizeSearch(searchValue) === normalizeSearch(committedSearchRef.current)
		) {
			return undefined;
		}

		searchTimerRef.current = window.setTimeout(() => {
			searchTimerRef.current = null;
			router.replace(currentHrefRef.current({ searchValue }), {
				scroll: false,
			});
		}, SEARCH_DEBOUNCE_MS);

		return cancelSearchTimer;
	}, [cancelSearchTimer, router, searchValue]);

	React.useEffect(() => cancelSearchTimer, [cancelSearchTimer]);

	function submitFilters(event: FormEvent<HTMLFormElement>): void {
		event.preventDefault();
		cancelSearchTimer();
		router.replace(currentHref(), { scroll: false });
	}

	function replaceWith(args: Parameters<typeof currentHref>[0]): void {
		cancelSearchTimer();
		router.replace(currentHref(args), { scroll: false });
	}

	function changeSection(value: string): void {
		setSectionSelection(value);
		setEntityClassSelection(ALL_VALUE);
		setCategorySelection(ALL_VALUE);
		setSubcategorySelection(ALL_VALUE);
		replaceWith({
			sectionSelection: value,
			entityClassSelection: ALL_VALUE,
			categorySelection: ALL_VALUE,
			subcategorySelection: ALL_VALUE,
		});
	}

	function changeClass(value: string): void {
		setEntityClassSelection(value);
		setCategorySelection(ALL_VALUE);
		setSubcategorySelection(ALL_VALUE);
		replaceWith({
			entityClassSelection: value,
			categorySelection: ALL_VALUE,
			subcategorySelection: ALL_VALUE,
		});
	}

	function changeCategory(value: string): void {
		setCategorySelection(value);
		setSubcategorySelection(ALL_VALUE);
		replaceWith({
			categorySelection: value,
			subcategorySelection: ALL_VALUE,
		});
	}

	function changeSubcategory(value: string): void {
		setSubcategorySelection(value);
		replaceWith({ subcategorySelection: value });
	}

	function changeReleaseView(value: string): void {
		const next = RELEASE_VIEW_OPTIONS.some((option) => option.value === value)
			? (value as MafiosopediaReleaseViewCode)
			: "all";
		setReleaseSelection(next);
		replaceWith({ releaseView: next });
	}

	return (
		<form
			className={
				showReleaseFilter
					? "public-collection-controls riseopedia-filter-bar riseopedia-filter-bar--with-release"
					: "public-collection-controls riseopedia-filter-bar riseopedia-filter-bar--without-release"
			}
			onSubmit={submitFilters}
		>
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

			{showReleaseFilter ? (
				<div className="riseopedia-filter-bar__control riseopedia-filter-bar__control--release">
					<DropdownMenuSingle
						className="public-collection-control"
						options={RELEASE_VIEW_OPTIONS}
						value={releaseSelection}
						onChange={changeReleaseView}
						ariaLabel={`Filter ${wikiName} by release visibility`}
					/>
				</div>
			) : null}

			<div className="riseopedia-filter-bar__search">
				<label
					className="public-collection-sr-label"
					htmlFor="riseopedia-browser-search"
				>
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

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
