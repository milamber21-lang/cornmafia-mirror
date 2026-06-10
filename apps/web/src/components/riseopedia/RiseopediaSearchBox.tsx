//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/RiseopediaSearchBox.tsx                                           ////
//// Language: TSX                                                                                              ////
//// Shared dynamic URL-backed Riseopedia search control using project UI primitives.                            ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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
const SEARCH_DEBOUNCE_MS = 325;
const EMPTY_PARAMS: RiseopediaSearchParam[] = [];

function buildSearchHref(args: {
	basePath: string;
	search: string;
	params: RiseopediaSearchParam[];
	pageSize: number | null;
}): string {
	const searchParams = new URLSearchParams();
	const search = args.search.trim();

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
	const [searchValue, setSearchValue] = React.useState(search ?? "");
	const hydratedRef = React.useRef(false);
	const normalizedPageSize = typeof pageSize === "number" ? pageSize : null;

	React.useEffect(() => {
		setSearchValue(search ?? "");
	}, [search]);

	React.useEffect(() => {
		if (!hydratedRef.current) {
			hydratedRef.current = true;
			return undefined;
		}

		const timer = window.setTimeout(() => {
			router.replace(
				buildSearchHref({
					basePath,
					search: searchValue,
					params,
					pageSize: normalizedPageSize,
				}),
				{ scroll: false },
			);
		}, SEARCH_DEBOUNCE_MS);

		return () => window.clearTimeout(timer);
	}, [basePath, normalizedPageSize, params, router, searchValue]);

	function submitSearch(event: FormEvent<HTMLFormElement>): void {
		event.preventDefault();
		router.replace(
			buildSearchHref({
				basePath,
				search: searchValue,
				params,
				pageSize: normalizedPageSize,
			}),
			{ scroll: false },
		);
	}

	return (
		<form className="riseopedia-search-bar" onSubmit={submitSearch}>
			<label className="public-collection-sr-label" htmlFor="riseopedia-search-box">
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
