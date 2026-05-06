//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/discord/DiscordUsersTable.tsx                                             ////
//// Language: TSX                                                                                                 ////
//// Admin Discord users table with server-driven search, sorting, and pagination                                  ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
"use client";

import type { JSX } from "react";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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
import {
	getNextSortDirection,
	type SortDirection,
} from "@/lib/helpers/admin-table-sorting";
import { readResponseMessage } from "@/lib/helpers/http-response";

import DiscordUsersPanel, { type DiscordUserItem } from "./DiscordUsersPanel";

type Row = {
	id: string;
	discordId: string;
	username: string;
	globalName: string | null;
	isMember: boolean;
	rolesSyncedDt: string | null;
	lastLoginAt: string | null;
	isRoleRefreshDue: boolean;
	notes: string | null;
	updatedAt: string | null;
};

type JsonRecord = Record<string, unknown>;
type SearchParamsReader = {
	get(name: string): string | null;
};
type SortKey = "discordId" | "username" | "globalName" | "member" | "roleSync" | "notes";

type UsersResponse = {
	rows?: unknown[];
	totalDocs?: unknown;
	page?: unknown;
	pageSize?: unknown;
	totalPages?: unknown;
};

type QueryPatch = Partial<{
	page: number;
	search: string;
	pageSize: number;
	sortBy: SortKey;
	sortDir: SortDirection;
}>;

const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;
const SORT_KEYS = new Set<SortKey>([
	"discordId",
	"username",
	"globalName",
	"member",
	"roleSync",
	"notes",
]);

function isObject(value: unknown): value is JsonRecord {
	return typeof value === "object" && value !== null;
}

function parsePositiveInt(value: unknown): number | null {
	if (typeof value === "number" && Number.isInteger(value) && value > 0) {
		return value;
	}

	if (typeof value === "string" && /^\d+$/.test(value.trim())) {
		const parsed = Number(value.trim());
		return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
	}

	return null;
}

function readSearchParam(searchParams: SearchParamsReader): string {
	return searchParams.get("search") ?? "";
}

function readPageParam(searchParams: SearchParamsReader): number {
	return parsePositiveInt(searchParams.get("page")) ?? 1;
}

function readPageSizeParam(searchParams: SearchParamsReader): number {
	return parsePositiveInt(searchParams.get("pageSize")) ?? 20;
}

function readSortKeyParam(searchParams: SearchParamsReader): SortKey {
	const value = searchParams.get("sortBy");
	return value && SORT_KEYS.has(value as SortKey)
		? (value as SortKey)
		: "username";
}

function readSortDirectionParam(searchParams: SearchParamsReader): SortDirection {
	return searchParams.get("sortDir") === "desc" ? "desc" : "asc";
}

function daysAgoLabel(iso: string | null): string {
	if (!iso) {
		return "—";
	}

	const dateValue = new Date(iso);
	if (Number.isNaN(dateValue.getTime())) {
		return "—";
	}

	const diffMs = Math.max(0, Date.now() - dateValue.getTime());
	const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
	if (days <= 0) {
		return "today";
	}
	if (days === 1) {
		return "1 day ago";
	}
	return `${days} days ago`;
}

function notesPreview(notes: string | null): string {
	if (!notes) {
		return "—";
	}

	const trimmedValue = notes.trim();
	if (!trimmedValue) {
		return "—";
	}

	return trimmedValue.length > 48
		? `${trimmedValue.slice(0, 48)}...`
		: trimmedValue;
}

function mapRow(value: unknown): Row | null {
	if (!isObject(value)) {
		return null;
	}

	const id =
		typeof value.id === "string" || typeof value.id === "number"
			? String(value.id)
			: "";
	const discordId = typeof value.discordId === "string" ? value.discordId : "";
	const username = typeof value.username === "string" ? value.username : "";

	if (!id || !discordId || !username) {
		return null;
	}

	return {
		id,
		discordId,
		username,
		globalName: typeof value.globalName === "string" ? value.globalName : null,
		isMember: value.isMember === true,
		rolesSyncedDt:
			typeof value.rolesSyncedDt === "string" ? value.rolesSyncedDt : null,
		lastLoginAt: typeof value.lastLoginAt === "string" ? value.lastLoginAt : null,
		isRoleRefreshDue: value.isRoleRefreshDue === true,
		notes: typeof value.notes === "string" ? value.notes : null,
		updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : null,
	};
}

export default function DiscordUsersTable(): JSX.Element {
	const router = useRouter();
	const searchParams = useSearchParams();

	const [rows, setRows] = useState<Row[]>([]);
	const [totalDocs, setTotalDocs] = useState(0);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [search, setSearch] = useState<string>(readSearchParam(searchParams));
	const [page, setPage] = useState<number>(readPageParam(searchParams));
	const [pageSize, setPageSize] = useState<number>(
		readPageSizeParam(searchParams),
	);
	const [sortKey, setSortKey] = useState<SortKey>(readSortKeyParam(searchParams));
	const [sortDirection, setSortDirection] = useState<SortDirection>(
		readSortDirectionParam(searchParams),
	);
	const [panelOpen, setPanelOpen] = useState(false);
	const [selectedRow, setSelectedRow] = useState<DiscordUserItem | null>(null);

	useEffect(() => {
		const nextSearch = readSearchParam(searchParams);
		const nextPage = readPageParam(searchParams);
		const nextPageSize = readPageSizeParam(searchParams);
		const nextSortKey = readSortKeyParam(searchParams);
		const nextSortDirection = readSortDirectionParam(searchParams);

		setSearch((previous) => (previous === nextSearch ? previous : nextSearch));
		setPage((previous) => (previous === nextPage ? previous : nextPage));
		setPageSize((previous) =>
			previous === nextPageSize ? previous : nextPageSize,
		);
		setSortKey((previous) => (previous === nextSortKey ? previous : nextSortKey));
		setSortDirection((previous) =>
			previous === nextSortDirection ? previous : nextSortDirection,
		);
	}, [searchParams]);

	const syncQueryParams = useCallback(
		(next: QueryPatch) => {
			const nextParams = new URLSearchParams(searchParams.toString());

			if (typeof next.page === "number") {
				nextParams.set("page", String(next.page));
			}
			if (typeof next.pageSize === "number") {
				nextParams.set("pageSize", String(next.pageSize));
			}
			if (typeof next.sortBy === "string") {
				nextParams.set("sortBy", next.sortBy);
			}
			if (typeof next.sortDir === "string") {
				nextParams.set("sortDir", next.sortDir);
			}
			if (typeof next.search === "string") {
				if (next.search.trim().length > 0) {
					nextParams.set("search", next.search.trim());
				} else {
					nextParams.delete("search");
				}
			}

			router.replace(`?${nextParams.toString()}`);
		},
		[router, searchParams],
	);

	const fetchRows = useCallback(
		async (
			queryValue: string,
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
				if (queryValue.trim().length > 0) {
					params.set("search", queryValue.trim());
				}

				const response = await fetch(
					`/api/admin/discord/users?${params.toString()}`,
					{ cache: "no-store" },
				);
				if (!response.ok) {
					throw new Error(
						await readResponseMessage(response, "Failed to load users."),
					);
				}

				const json = (await response.json()) as UsersResponse;
				const nextRows = Array.isArray(json.rows)
					? json.rows.map(mapRow).filter((value): value is Row => value !== null)
					: [];
				const resolvedPage = parsePositiveInt(json.page) ?? nextPage;
				const resolvedPageSize = parsePositiveInt(json.pageSize) ?? nextPageSize;
				const resolvedTotalDocs =
					typeof json.totalDocs === "number"
						? json.totalDocs
						: Number(json.totalDocs ?? 0);

				setRows(nextRows);
				setTotalDocs(Number.isFinite(resolvedTotalDocs) ? resolvedTotalDocs : 0);
				setPage((previous) =>
					previous === resolvedPage ? previous : resolvedPage,
				);
				setPageSize((previous) =>
					previous === resolvedPageSize ? previous : resolvedPageSize,
				);
			} catch (errorValue: unknown) {
				setRows([]);
				setTotalDocs(0);
				setError(
					errorValue instanceof Error ? errorValue.message : "Failed to load users.",
				);
			} finally {
				setLoading(false);
			}
		},
		[],
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

	const openEdit = useCallback((row: Row) => {
		setSelectedRow({
			id: row.id,
			discordId: row.discordId,
			username: row.username,
		});
		setPanelOpen(true);
	}, []);

	const closePanel = useCallback(() => {
		setPanelOpen(false);
		setSelectedRow(null);
	}, []);

	const handleSaved = useCallback(() => {
		void fetchRows(search, page, pageSize, sortKey, sortDirection);
	}, [fetchRows, page, pageSize, search, sortDirection, sortKey]);

	return (
		<>
			<div className="admin-table-stack">
				<div className="admin-table-toolbar admin-table-toolbar--discord-users">
					<div className="admin-table-toolbar-search admin-table-toolbar-search--start">
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
							placeholder="Search username / global name / Discord ID / notes..."
							aria-label="Search users"
							width="large"
							align="start"
						/>
					</div>

					<div className="admin-helper-note admin-helper-note--align-end">
						Discord users are system-owned. Admin UI edits notes only.
					</div>
				</div>

				{error ? <AlertBanner tone="error">{error}</AlertBanner> : null}

				<AdminTableFrame>
					<Table className="admin-data-table">
						<colgroup>
							<col className="table-col table-col--w-18" />
							<col className="table-col table-col--w-16" />
							<col className="table-col table-col--w-16" />
							<col className="table-col table-col--w-10" />
							<col className="table-col table-col--w-12" />
							<col className="table-col table-col--w-18" />
							<col className="table-col table-col--w-10" />
						</colgroup>

						<THead>
							<TR>
								<AdminSortableTH
									label="Discord ID"
									sortKey="discordId"
									activeSortKey={sortKey}
									sortDirection={sortDirection}
									onSortChange={handleSortChange}
								/>
								<AdminSortableTH
									label="Username"
									sortKey="username"
									activeSortKey={sortKey}
									sortDirection={sortDirection}
									onSortChange={handleSortChange}
								/>
								<AdminSortableTH
									label="Global name"
									sortKey="globalName"
									activeSortKey={sortKey}
									sortDirection={sortDirection}
									onSortChange={handleSortChange}
								/>
								<AdminSortableTH
									label="Member"
									sortKey="member"
									activeSortKey={sortKey}
									sortDirection={sortDirection}
									onSortChange={handleSortChange}
								/>
								<AdminSortableTH
									label="Role sync"
									sortKey="roleSync"
									activeSortKey={sortKey}
									sortDirection={sortDirection}
									onSortChange={handleSortChange}
								/>
								<AdminSortableTH
									label="Notes"
									sortKey="notes"
									activeSortKey={sortKey}
									sortDirection={sortDirection}
									onSortChange={handleSortChange}
								/>
								<TH className="admin-table-cell--center">Action</TH>
							</TR>
						</THead>

						<TBody>
							{loading ? (
								<TR>
									<TD colSpan={7} className="admin-table-cell--center">
										Loading...
									</TD>
								</TR>
							) : rows.length === 0 ? (
								<TR>
									<TD colSpan={7} className="admin-table-cell--center">
										No users found.
									</TD>
								</TR>
							) : (
								rows.map((row) => (
									<TR key={row.id}>
										<TD className="admin-table-cell--center admin-table-cell--mono">{row.discordId}</TD>
										<TD className="admin-table-cell--center">{row.username}</TD>
										<TD className="admin-table-cell--center">{row.globalName ?? "—"}</TD>
										<TD className="admin-table-cell--center">{row.isMember ? "Yes" : "No"}</TD>
										<TD className="admin-table-cell--center">
											{row.rolesSyncedDt ? daysAgoLabel(row.rolesSyncedDt) : "never"}
											{row.isRoleRefreshDue ? " (stale)" : ""}
										</TD>
										<TD className="admin-table-cell--center" title={row.notes ?? undefined}>
											{notesPreview(row.notes)}
										</TD>
										<TD className="admin-table-cell--center">
											<div className="admin-table-row-actions">
												<Button
													variant="neutral"
													onClick={() => openEdit(row)}
													aria-label={`Edit ${row.username}`}
												>
													Edit
												</Button>
											</div>
										</TD>
									</TR>
								))
							)}
						</TBody>
					</Table>
				</AdminTableFrame>

				<Pagination
					total={totalDocs}
					page={page}
					pageSize={pageSize}
					onPageChange={(nextPage: number) => {
						setPage(nextPage);
						syncQueryParams({
							page: nextPage,
							search,
							pageSize,
							sortBy: sortKey,
							sortDir: sortDirection,
						});
					}}
					onPageSizeChange={(nextPageSize: number) => {
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

			<DiscordUsersPanel
				open={panelOpen}
				mode="edit"
				user={selectedRow}
				onClose={closePanel}
				onSaved={handleSaved}
			/>
		</>
	);
}
