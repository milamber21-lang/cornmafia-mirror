//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/ui/RiseopediaPager.tsx                                                ////
//// Language: TSX                                                                                              ////
//// URL-backed Riseopedia pagination wrapper around the shared Pagination primitive.                            ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

"use client";

import type { JSX } from "react";
import { useRouter } from "next/navigation";

import { Pagination } from "@/components/ui";

export type RiseopediaPagerParam = {
	name: string;
	value: string | null;
};

export type RiseopediaPagerProps = {
	basePath: string;
	params: RiseopediaPagerParam[];
	page: number;
	pageSize: number;
	totalDocs: number;
	totalPages: number;
};

const DEFAULT_PAGE_SIZE = 24;
const PAGE_SIZE_OPTIONS = [24, 48, 96];

function buildPageHref(args: {
	basePath: string;
	params: RiseopediaPagerParam[];
	page: number;
	pageSize: number;
}): string {
	const searchParams = new URLSearchParams();

	for (const param of args.params) {
		if (param.value) {
			searchParams.set(param.name, param.value);
		}
	}

	if (args.page > 1) {
		searchParams.set("page", String(args.page));
	}

	if (args.pageSize !== DEFAULT_PAGE_SIZE) {
		searchParams.set("pageSize", String(args.pageSize));
	}

	const query = searchParams.toString();
	return query ? `${args.basePath}?${query}` : args.basePath;
}

export default function RiseopediaPager({
	basePath,
	params,
	page,
	pageSize,
	totalDocs,
	totalPages,
}: RiseopediaPagerProps): JSX.Element | null {
	const router = useRouter();
	const currentPage =
		totalPages > 0 ? Math.min(Math.max(1, page), totalPages) : 1;

	if (totalDocs <= 0) {
		return null;
	}

	return (
		<Pagination
			className="public-collection-pagination riseopedia-pagination"
			total={totalDocs}
			page={currentPage}
			pageSize={pageSize}
			pageSizeOptions={PAGE_SIZE_OPTIONS}
			pageSizeLabel="Items"
			onPageChange={(nextPage) => {
				router.push(
					buildPageHref({
						basePath,
						params,
						page: nextPage,
						pageSize,
					}),
				);
			}}
			onPageSizeChange={(nextPageSize) => {
				router.push(
					buildPageHref({
						basePath,
						params,
						page: 1,
						pageSize: nextPageSize,
					}),
				);
			}}
		/>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
