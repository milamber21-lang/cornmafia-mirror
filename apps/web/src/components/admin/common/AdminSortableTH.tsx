//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/common/AdminSortableTH.tsx                                                ////
//// Language: TSX                                                                                                 ////
//// Shared sortable admin table header cell for admin table surfaces.                                             ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

"use client";

import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import type { JSX, ReactNode } from "react";

import { TH } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { SortDirection } from "@/lib/helpers/admin-table-sorting";

export interface AdminSortableTHProps<TSortKey extends string> {
	label: ReactNode;
	sortKey: TSortKey;
	activeSortKey: string;
	sortDirection: SortDirection;
	onSortChange: (sortKey: TSortKey) => void;
	className?: string;
}

function getAriaSort(
	active: boolean,
	direction: SortDirection,
): "ascending" | "descending" | "none" {
	if (!active) {
		return "none";
	}

	return direction === "asc" ? "ascending" : "descending";
}

export default function AdminSortableTH<TSortKey extends string>({
	label,
	sortKey,
	activeSortKey,
	sortDirection,
	onSortChange,
	className,
}: AdminSortableTHProps<TSortKey>): JSX.Element {
	const active = sortKey === activeSortKey;
	const Icon = active
		? sortDirection === "asc"
			? ArrowUp
			: ArrowDown
		: ChevronsUpDown;

	return (
		<TH
			className={className}
			scope="col"
			aria-sort={getAriaSort(active, sortDirection)}
		>
			<button
				type="button"
				className={cn(
					"inline-flex w-full items-center justify-center gap-1.5 rounded-sm",
					"text-xs uppercase tracking-wide transition-colors",
					"hover:text-[var(--theme-accent)] focus:outline-none",
					"focus-visible:ring-2 focus-visible:ring-[var(--theme-focus)]",
					active && "text-[var(--theme-accent)]",
				)}
				onClick={() => onSortChange(sortKey)}
			>
				<span>{label}</span>
				<Icon size={13} aria-hidden />
			</button>
		</TH>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
