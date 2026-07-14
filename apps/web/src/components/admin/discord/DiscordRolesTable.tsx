//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/discord/DiscordRolesTable.tsx                                             ////
//// Language: TSX                                                                                                 ////
//// Admin Discord roles table with server-driven search, sorting, and pagination                                  ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

"use client";

import type { JSX } from "react";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import DiscordRolesPanel from "@/components/admin/discord/DiscordRolesPanel";
import AdminSortableTH from "@/components/admin/common/AdminSortableTH";
import {
	AlertBanner,
	Button,
	AdminTableFrame,
	AdminTableSearchInput,
	Pagination,
	Table,
	TBody,
	TD,
	TH,
	THead,
	TR,
} from "@/components/ui";
import { confirmAction } from "@/lib/client/confirm-dialog";
import {
	getNextSortDirection,
	type SortDirection,
} from "@/lib/helpers/admin-table-sorting";
import { readResponseMessage } from "@/lib/helpers/http-response";

type RoleDoc = {
	id: string;
	name: string;
	source: "discord" | "virtual";
	roleId: string | null;
	rank: number;
	colorHex: string | null;
	isAccessRole: boolean;
	fullEditorialAccess: boolean;
	isAdmin: boolean;
	isPublicDefault: boolean;
	isAuthenticatedDefault: boolean;
	createdAt?: string | null;
	updatedAt?: string | null;
};

type JsonRecord = Record<string, unknown>;
type PanelMode = "create" | "edit";
type SortKey = "name" | "source" | "roleId" | "rank";

type RolesResponse = {
	rows?: unknown[];
	page?: unknown;
	pageSize?: unknown;
	totalDocs?: unknown;
	totalPages?: unknown;
};

const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;
const SORT_KEYS = new Set<SortKey>(["name", "source", "roleId", "rank"]);

type SearchParamsReader = {
	get(name: string): string | null;
};

type QueryPatch = Partial<{
	page: number;
	search: string;
	pageSize: number;
	sortBy: SortKey;
	sortDir: SortDirection;
}>;

function isObject(value: unknown): value is JsonRecord {
	return typeof value === "object" && value !== null;
}

function isRoleDoc(value: unknown): value is RoleDoc {
	return (
		isObject(value) &&
		typeof value.id === "string" &&
		typeof value.name === "string"
	);
}

function parsePositiveQueryValue(
	value: string | null,
	fallback: number,
): number {
	if (typeof value !== "string" || !/^\d+$/.test(value.trim())) {
		return fallback;
	}

	const parsed = Number(value.trim());
	return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parsePositiveEnvelopeValue(value: unknown, fallback: number): number {
	if (typeof value === "number" && Number.isInteger(value) && value > 0) {
		return value;
	}

	if (typeof value === "string" && /^\d+$/.test(value.trim())) {
		const parsed = Number(value.trim());
		return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
	}

	return fallback;
}

function parseNonNegativeEnvelopeValue(
	value: unknown,
	fallback: number,
): number {
	if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
		return value;
	}

	if (typeof value === "string" && /^\d+$/.test(value.trim())) {
		const parsed = Number(value.trim());
		return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
	}

	return fallback;
}

function readSearchParam(searchParams: SearchParamsReader): string {
	return searchParams.get("search") ?? "";
}

function readSortKeyParam(searchParams: SearchParamsReader): SortKey {
	const value = searchParams.get("sortBy");
	return value && SORT_KEYS.has(value as SortKey) ? (value as SortKey) : "name";
}

function readSortDirectionParam(
	searchParams: SearchParamsReader,
): SortDirection {
	return searchParams.get("sortDir") === "desc" ? "desc" : "asc";
}

export default function DiscordRolesTable(): JSX.Element {
	const router = useRouter();
	const searchParams = useSearchParams();

	const [rows, setRows] = useState<RoleDoc[]>([]);
	const [totalDocs, setTotalDocs] = useState(0);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [search, setSearch] = useState(readSearchParam(searchParams));
	const [panelOpen, setPanelOpen] = useState(false);
	const [panelMode, setPanelMode] = useState<PanelMode>("create");
	const [selectedRole, setSelectedRole] = useState<RoleDoc | null>(null);
	const [page, setPage] = useState<number>(
		parsePositiveQueryValue(searchParams.get("page"), 1),
	);
	const [pageSize, setPageSize] = useState<number>(
		parsePositiveQueryValue(searchParams.get("pageSize"), 20),
	);
	const [sortKey, setSortKey] = useState<SortKey>(
		readSortKeyParam(searchParams),
	);
	const [sortDirection, setSortDirection] = useState<SortDirection>(
		readSortDirectionParam(searchParams),
	);
	const [busyId, setBusyId] = useState<string | null>(null);

	useEffect(() => {
		setSearch(readSearchParam(searchParams));
		setPage(parsePositiveQueryValue(searchParams.get("page"), 1));
		setPageSize(parsePositiveQueryValue(searchParams.get("pageSize"), 20));
		setSortKey(readSortKeyParam(searchParams));
		setSortDirection(readSortDirectionParam(searchParams));
	}, [searchParams]);

	const syncQueryParams = useCallback(
		(next: QueryPatch) => {
			const nextPage = typeof next.page === "number" ? next.page : page;
			const nextPageSize =
				typeof next.pageSize === "number" ? next.pageSize : pageSize;
			const nextSearch = typeof next.search === "string" ? next.search : search;
			const nextSortBy = typeof next.sortBy === "string" ? next.sortBy : sortKey;
			const nextSortDir =
				typeof next.sortDir === "string" ? next.sortDir : sortDirection;
			const nextParams = new URLSearchParams();

			nextParams.set("page", String(nextPage));
			nextParams.set("pageSize", String(nextPageSize));
			nextParams.set("sortBy", nextSortBy);
			nextParams.set("sortDir", nextSortDir);

			if (nextSearch.trim().length > 0) {
				nextParams.set("search", nextSearch.trim());
			}

			router.replace(`?${nextParams.toString()}`);
		},
		[page, pageSize, router, search, sortDirection, sortKey],
	);

	const fetchRows = useCallback(
		async (
			searchValue: string,
			nextPage: number,
			nextPageSize: number,
			nextSortKey: SortKey,
			nextSortDirection: SortDirection,
		): Promise<void> => {
			setLoading(true);
			setError("");

			try {
				const params = new URLSearchParams({
					page: String(nextPage),
					pageSize: String(nextPageSize),
					sortBy: nextSortKey,
					sortDir: nextSortDirection,
				});
				if (searchValue.trim().length > 0) {
					params.set("search", searchValue.trim());
				}

				const response = await fetch(
					`/api/admin/discord/roles?${params.toString()}`,
					{ method: "GET", cache: "no-store" },
				);
				if (!response.ok) {
					throw new Error(
						await readResponseMessage(response, "Failed to load roles."),
					);
				}

				const json = (await response.json()) as RolesResponse;
				const nextRows = Array.isArray(json.rows)
					? json.rows.filter(isRoleDoc)
					: [];
				const normalizedPage = parsePositiveEnvelopeValue(json.page, nextPage);
				const normalizedPageSize = parsePositiveEnvelopeValue(
					json.pageSize,
					nextPageSize,
				);
				const normalizedTotalDocs = parseNonNegativeEnvelopeValue(
					json.totalDocs,
					0,
				);

				setRows(nextRows);
				setTotalDocs(normalizedTotalDocs);

				if (normalizedPage !== nextPage) {
					setPage(normalizedPage);
				}
				if (normalizedPageSize !== nextPageSize) {
					setPageSize(normalizedPageSize);
				}
				if (normalizedPage !== nextPage || normalizedPageSize !== nextPageSize) {
					syncQueryParams({
						page: normalizedPage,
						pageSize: normalizedPageSize,
						search: searchValue,
						sortBy: nextSortKey,
						sortDir: nextSortDirection,
					});
				}
			} catch (errorValue: unknown) {
				setRows([]);
				setTotalDocs(0);
				setError(
					errorValue instanceof Error ? errorValue.message : "Failed to load roles.",
				);
			} finally {
				setLoading(false);
			}
		},
		[syncQueryParams],
	);

	useEffect(() => {
		const timeoutId = window.setTimeout(() => {
			void fetchRows(search, page, pageSize, sortKey, sortDirection);
		}, 250);
		return () => window.clearTimeout(timeoutId);
	}, [fetchRows, page, pageSize, search, sortDirection, sortKey]);

	const handleSortChange = useCallback(
		(nextSortKey: SortKey): void => {
			const nextSortDirection = getNextSortDirection(
				sortKey === nextSortKey,
				sortDirection,
			);
			setSortKey(nextSortKey);
			setSortDirection(nextSortDirection);
			setPage(1);
			syncQueryParams({
				page: 1,
				search,
				pageSize,
				sortBy: nextSortKey,
				sortDir: nextSortDirection,
			});
		},
		[pageSize, search, sortDirection, sortKey, syncQueryParams],
	);

	const openCreate = useCallback(() => {
		setError("");
		setPanelMode("create");
		setSelectedRole(null);
		setPanelOpen(true);
	}, []);

	const openEdit = useCallback((role: RoleDoc) => {
		setError("");
		setPanelMode("edit");
		setSelectedRole(role);
		setPanelOpen(true);
	}, []);

	const closePanel = useCallback(() => {
		setPanelOpen(false);
		setPanelMode("create");
		setSelectedRole(null);
	}, []);

	const handleSaved = useCallback(() => {
		void fetchRows(search, page, pageSize, sortKey, sortDirection);
	}, [fetchRows, page, pageSize, search, sortDirection, sortKey]);

	const toggleFlag = useCallback(
		async (
			role: RoleDoc,
			key: "isAccessRole" | "fullEditorialAccess" | "isAdmin",
		) => {
			if (busyId !== null) {
				return;
			}

			const nextValue = !role[key];
			setBusyId(role.id);
			setError("");
			setRows((previousRows) =>
				previousRows.map((row) =>
					row.id === role.id ? { ...row, [key]: nextValue } : row,
				),
			);

			try {
				const response = await fetch("/api/admin/discord/roles", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						op: "update",
						id: role.id,
						data: { [key]: nextValue },
					}),
				});
				if (!response.ok) {
					throw new Error(await readResponseMessage(response, "Update failed."));
				}
				await fetchRows(search, page, pageSize, sortKey, sortDirection);
			} catch (errorValue: unknown) {
				setRows((previousRows) =>
					previousRows.map((row) =>
						row.id === role.id ? { ...row, [key]: !nextValue } : row,
					),
				);
				setError(
					errorValue instanceof Error ? errorValue.message : "Update failed.",
				);
			} finally {
				setBusyId(null);
			}
		},
		[busyId, fetchRows, page, pageSize, search, sortDirection, sortKey],
	);

	const handleDelete = useCallback(
		async (role: RoleDoc) => {
			if (busyId !== null) {
				return;
			}

			const confirmed = await confirmAction({
				title: "Delete role?",
				message: `Delete role "${role.name}"?`,
				confirmLabel: "Delete",
				destructive: true,
			});
			if (!confirmed) {
				return;
			}

			setBusyId(role.id);
			setError("");

			try {
				const response = await fetch("/api/admin/discord/roles", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ op: "delete", id: role.id }),
				});
				if (!response.ok) {
					throw new Error(await readResponseMessage(response, "Delete failed."));
				}
				await fetchRows(search, page, pageSize, sortKey, sortDirection);
			} catch (errorValue: unknown) {
				setError(
					errorValue instanceof Error ? errorValue.message : "Delete failed.",
				);
			} finally {
				setBusyId(null);
			}
		},
		[busyId, fetchRows, page, pageSize, search, sortDirection, sortKey],
	);

	return (
		<>
			<div className="admin-table-stack">
				<div className="admin-table-toolbar admin-table-toolbar--discord-roles">
					<div className="admin-table-toolbar-spacer" aria-hidden="true" />
					<div className="admin-table-toolbar-search">
						<AdminTableSearchInput
							value={search}
							onChange={(event) => {
								const nextValue = event.target.value;
								setSearch(nextValue);
								setPage(1);
								syncQueryParams({
									search: nextValue,
									page: 1,
									pageSize,
									sortBy: sortKey,
									sortDir: sortDirection,
								});
							}}
							placeholder="Search by name, role ID, or rank..."
							aria-label="Search roles"
						/>
					</div>
					<div className="admin-table-toolbar-action">
						<Button
							onClick={openCreate}
							variant="primary"
							aria-label="Create Role"
							disabled={busyId !== null}
						>
							New Role
						</Button>
					</div>
				</div>

				{error ? <AlertBanner tone="error">{error}</AlertBanner> : null}

				<AdminTableFrame>
					<Table className="admin-data-table">
						<colgroup>
							<col className="table-col table-col--w-15" />
							<col className="table-col table-col--w-10" />
							<col className="table-col table-col--w-15" />
							<col className="table-col table-col--w-10" />
							<col className="table-col table-col--w-10" />
							<col className="table-col table-col--w-10" />
							<col className="table-col table-col--w-10" />
							<col className="table-col table-col--w-10" />
							<col className="table-col table-col--w-10" />
						</colgroup>
						<THead>
							<TR>
								<AdminSortableTH
									label="Name"
									sortKey="name"
									activeSortKey={sortKey}
									sortDirection={sortDirection}
									onSortChange={handleSortChange}
								/>
								<AdminSortableTH
									label="Source"
									sortKey="source"
									activeSortKey={sortKey}
									sortDirection={sortDirection}
									onSortChange={handleSortChange}
								/>
								<AdminSortableTH
									label="Role ID"
									sortKey="roleId"
									activeSortKey={sortKey}
									sortDirection={sortDirection}
									onSortChange={handleSortChange}
								/>
								<AdminSortableTH
									label="Rank"
									sortKey="rank"
									activeSortKey={sortKey}
									sortDirection={sortDirection}
									onSortChange={handleSortChange}
								/>
								<TH className="admin-table-cell--center">Access</TH>
								<TH className="admin-table-cell--center">Editor</TH>
								<TH className="admin-table-cell--center">Admin</TH>
								<TH className="admin-table-cell--center">Delete</TH>
								<TH className="admin-table-cell--center">Action</TH>
							</TR>
						</THead>
						<TBody>
							{loading ? (
								<TR>
									<TD colSpan={9} className="admin-table-cell--center">
										Loading...
									</TD>
								</TR>
							) : rows.length === 0 ? (
								<TR>
									<TD colSpan={9} className="admin-table-cell--center">
										No roles found.
									</TD>
								</TR>
							) : (
								rows.map((row) => {
									const rowBusy = busyId === row.id;

									return (
										<TR key={row.id}>
											<TD className="admin-table-cell--center">{row.name}</TD>
											<TD className="admin-table-cell--center">{row.source}</TD>
											<TD className="admin-table-cell--center">{row.roleId ?? "-"}</TD>
											<TD className="admin-table-cell--center">{row.rank}</TD>
											<TD className="admin-table-cell--center">
												<Button
													variant={row.isAccessRole ? "success" : "secondary"}
													onClick={() => void toggleFlag(row, "isAccessRole")}
													disabled={rowBusy || busyId !== null}
												>
													{row.isAccessRole ? "Access" : "Ignored"}
												</Button>
											</TD>
											<TD className="admin-table-cell--center">
												<Button
													variant={row.fullEditorialAccess ? "success" : "secondary"}
													onClick={() => void toggleFlag(row, "fullEditorialAccess")}
													disabled={rowBusy || busyId !== null}
												>
													{row.fullEditorialAccess ? "Yes" : "No"}
												</Button>
											</TD>
											<TD className="admin-table-cell--center">
												<Button
													variant={row.isAdmin ? "success" : "secondary"}
													onClick={() => void toggleFlag(row, "isAdmin")}
													disabled={rowBusy || busyId !== null}
												>
													{row.isAdmin ? "Yes" : "No"}
												</Button>
											</TD>
											<TD className="admin-table-cell--center">
												<Button
													variant="danger"
													onClick={() => void handleDelete(row)}
													disabled={rowBusy || busyId !== null}
												>
													Delete
												</Button>
											</TD>
											<TD className="admin-table-cell--center">
												<Button
													variant="secondary"
													onClick={() => openEdit(row)}
													disabled={rowBusy || busyId !== null}
												>
													Edit
												</Button>
											</TD>
										</TR>
									);
								})
							)}
						</TBody>
					</Table>
				</AdminTableFrame>

				<div className="admin-table-pagination-centered">
					<Pagination
						total={totalDocs}
						page={page}
						pageSize={pageSize}
						onPageChange={(nextPage) => {
							setPage(nextPage);
							syncQueryParams({
								page: nextPage,
								search,
								pageSize,
								sortBy: sortKey,
								sortDir: sortDirection,
							});
						}}
						onPageSizeChange={(nextPageSize) => {
							setPageSize(nextPageSize);
							setPage(1);
							syncQueryParams({
								page: 1,
								search,
								pageSize: nextPageSize,
								sortBy: sortKey,
								sortDir: sortDirection,
							});
						}}
						pageSizeOptions={[...PAGE_SIZE_OPTIONS]}
					/>
				</div>
			</div>

			<DiscordRolesPanel
				open={panelOpen}
				onClose={closePanel}
				onSaved={handleSaved}
				mode={panelMode}
				role={selectedRole}
			/>
		</>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
