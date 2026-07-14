//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/ui/basic-elements/Pagination.tsx                                               ////
//// Language: TSX                                                                                                 ////
//// Shared pagination with centered pager, summary, and optional page-size selector                               ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

"use client";

import * as React from "react";

import { Button } from "./Button";
import DropdownMenuSingle from "./DropdownMenuSingle";

export type PaginationProps = {
	total: number;
	page: number;
	pageSize: number;
	onPageChange: (page: number) => void;
	className?: string;
	showEdges?: boolean;
	onPageSizeChange?: (pageSize: number) => void;
	pageSizeOptions?: number[];
	pageSizeLabel?: string;
};

export function Pagination({
	total,
	page,
	pageSize,
	onPageChange,
	className,
	showEdges = true,
	onPageSizeChange,
	pageSizeOptions = [20, 50, 100],
	pageSizeLabel = "Rows",
}: PaginationProps): React.JSX.Element {
	const pageCount = Math.max(1, Math.ceil(total / pageSize));
	const current = Math.min(Math.max(1, page), pageCount);
	const canPrev = current > 1;
	const canNext = current < pageCount;

	function goto(nextPage: number): void {
		if (nextPage < 1 || nextPage > pageCount) {
			return;
		}

		onPageChange(nextPage);
	}

	return (
		<div
			className={["ui-pagination", className ?? ""].join(" ")}
			role="navigation"
			aria-label="Pagination"
		>
			<div className="ui-pagination__page-size">
				{typeof onPageSizeChange === "function" ? (
					<>
						<span className="ui-pagination__label">{pageSizeLabel}</span>
						<DropdownMenuSingle
							className="ui-pagination__page-size-select"
							options={pageSizeOptions.map((value) => ({
								value: String(value),
								label: String(value),
							}))}
							value={String(pageSize)}
							onChange={(value) => {
								const nextPageSize = Number(value);
								if (Number.isInteger(nextPageSize) && nextPageSize > 0) {
									onPageSizeChange(nextPageSize);
								}
							}}
							ariaLabel="Rows per page"
						/>
					</>
				) : (
					<div />
				)}
			</div>

			<div className="ui-pagination__controls">
				{showEdges ? (
					<Button
						size="sm"
						variant="secondary"
						onClick={() => goto(1)}
						disabled={!canPrev}
						aria-label="First page"
					>
						First
					</Button>
				) : null}

				<Button
					size="sm"
					variant="secondary"
					onClick={() => goto(current - 1)}
					disabled={!canPrev}
					aria-label="Previous page"
				>
					Prev
				</Button>

				<span className="ui-pagination__count">
					{current} / {pageCount}
				</span>

				<Button
					size="sm"
					variant="secondary"
					onClick={() => goto(current + 1)}
					disabled={!canNext}
					aria-label="Next page"
				>
					Next
				</Button>

				{showEdges ? (
					<Button
						size="sm"
						variant="secondary"
						onClick={() => goto(pageCount)}
						disabled={!canNext}
						aria-label="Last page"
					>
						Last
					</Button>
				) : null}
			</div>

			<div className="ui-pagination__summary">
				Page {current} of {pageCount} - {total} items
			</div>
		</div>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
