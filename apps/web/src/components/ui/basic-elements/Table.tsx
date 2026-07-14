//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/ui/basic-elements/Table.tsx                                                     ////
//// Language: TSX                                                                                                 ////
//// Exports shared table primitives                                                                               ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type {
	HTMLAttributes,
	TableHTMLAttributes,
	TdHTMLAttributes,
	ThHTMLAttributes,
} from "react";

import { cn } from "../../../lib/cn";

export function Table({
	className,
	...rest
}: TableHTMLAttributes<HTMLTableElement>) {
	return <table className={cn("ui-table", className)} {...rest} />;
}

export function THead({
	className,
	...rest
}: HTMLAttributes<HTMLTableSectionElement>) {
	return <thead className={cn("ui-table-head", className)} {...rest} />;
}

export function TBody({
	className,
	...rest
}: HTMLAttributes<HTMLTableSectionElement>) {
	return <tbody className={cn("ui-table-body", className)} {...rest} />;
}

export function TR({
	className,
	...rest
}: HTMLAttributes<HTMLTableRowElement>) {
	return <tr className={cn("ui-table-row", className)} {...rest} />;
}

export function TH({
	className,
	...rest
}: ThHTMLAttributes<HTMLTableCellElement>) {
	return <th className={cn("ui-table-header-cell", className)} {...rest} />;
}

export function TD({
	className,
	...rest
}: TdHTMLAttributes<HTMLTableCellElement>) {
	return <td className={cn("ui-table-cell", className)} {...rest} />;
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
