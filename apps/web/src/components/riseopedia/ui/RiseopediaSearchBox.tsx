//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/ui/RiseopediaSearchBox.tsx                                           ////
//// Language: TSX                                                                                              ////
//// Shared URL-backed Riseopedia search with stable draft text and a pause-before-search debounce.               ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

"use client";

import type { FormEvent, JSX } from "react";
import * as React from "react";
import { useRouter } from "next/navigation";

import { Input } from "@/components/ui";

export type RiseopediaSearchParam = {
	name: string;
	value: string | null;
};

export type RiseopediaSearchBoxProps = {
	basePath: string;
	search: string | null;
	placeholder: string;
	params?: RiseopediaSearchParam[];
	pageSize?: number;
};

const DEFAULT_PAGE_SIZE = 24;
const SEARCH_DEBOUNCE_MS = 450;
const EMPTY_PARAMS: RiseopediaSearchParam[] = [];

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

function buildSearchHref(args: {
	basePath: string;
	search: string;
	params: RiseopediaSearchParam[];
	pageSize: number | null;
}): string {
	const searchParams = new URLSearchParams();
	const search = normalizeSearch(args.search);

	if (search.length > 0) {
		searchParams.set("q", search);
	}

	for (const param of args.params) {
		if (param.value) {
			searchParams.set(param.name, param.value);
		}
	}

	if (args.pageSize !== null && args.pageSize !== DEFAULT_PAGE_SIZE) {
		searchParams.set("pageSize", String(args.pageSize));
	}

	const query = searchParams.toString();
	return query ? `${args.basePath}?${query}` : args.basePath;
}

export default function RiseopediaSearchBox({
	basePath,
	search,
	placeholder,
	params = EMPTY_PARAMS,
	pageSize,
}: RiseopediaSearchBoxProps): JSX.Element {
	const router = useRouter();
	const [searchValue, setSearchValue] = usePropBackedState(search ?? "");
	const hydratedRef = React.useRef(false);
	const searchTimerRef = React.useRef<number | null>(null);
	const committedSearchRef = React.useRef(search ?? "");
	const normalizedPageSize = typeof pageSize === "number" ? pageSize : null;
	const currentHref = React.useCallback(
		(searchDraft: string): string =>
			buildSearchHref({
				basePath,
				search: searchDraft,
				params,
				pageSize: normalizedPageSize,
			}),
		[basePath, normalizedPageSize, params],
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
			router.replace(currentHrefRef.current(searchValue), { scroll: false });
		}, SEARCH_DEBOUNCE_MS);

		return cancelSearchTimer;
	}, [cancelSearchTimer, router, searchValue]);

	React.useEffect(() => cancelSearchTimer, [cancelSearchTimer]);

	function submitSearch(event: FormEvent<HTMLFormElement>): void {
		event.preventDefault();
		cancelSearchTimer();
		router.replace(currentHref(searchValue), { scroll: false });
	}

	return (
		<form className="riseopedia-search-bar" onSubmit={submitSearch}>
			<label
				className="public-collection-sr-label"
				htmlFor="riseopedia-search-box"
			>
				Search
			</label>
			<Input
				id="riseopedia-search-box"
				type="search"
				value={searchValue}
				onChange={(event) => setSearchValue(event.currentTarget.value)}
				placeholder={placeholder}
			/>
		</form>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
