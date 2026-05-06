//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/helpers/admin-table-sorting.ts                                                        ////
//// Language: TS                                                                                                  ////
//// Shared helpers for local admin table sorting                                                                  ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export type SortDirection = "asc" | "desc";

export function getNextSortDirection(
	isActiveSort: boolean,
	currentDirection: SortDirection,
): SortDirection {
	if (!isActiveSort) {
		return "asc";
	}

	return currentDirection === "asc" ? "desc" : "asc";
}

export function applyAdminSortDirection(
	comparison: number,
	direction: SortDirection,
): number {
	return direction === "asc" ? comparison : -comparison;
}

export function compareAdminText(left: string, right: string): number {
	return left.localeCompare(right, undefined, {
		numeric: true,
		sensitivity: "base",
	});
}

export function compareAdminOptionalText(
	left: string | null | undefined,
	right: string | null | undefined,
): number {
	return compareAdminText(left ?? "", right ?? "");
}

export function compareAdminNumber(left: number, right: number): number {
	return left - right;
}
