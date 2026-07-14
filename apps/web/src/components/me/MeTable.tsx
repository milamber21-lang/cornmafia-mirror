//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/me/MeTable.tsx                                                                 ////
//// Language: TSX                                                                                                ////
//// Shared member workspace with compact profile header, authoring cards, account overview, and role summary.   ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

"use client";

import * as React from "react";
import { Pencil, ShieldCheck } from "lucide-react";

import RolesPanel from "@/components/login/RolesPanel";
import MePanel from "@/components/me/MePanel";
import {
	BrowsePageHeader,
	BrowseResultCard,
	BrowseResultsPanel,
	Button,
	IconVisual,
	SectionHeader,
	StatusPill,
	SurfacePanel,
	SurfaceState,
} from "@/components/ui";

/* ============================== Types & guards ============================== */
type EntityLike =
	| null
	| string
	| {
			id?: unknown;
			name?: unknown;
			slug?: unknown;
			type?: { type?: unknown } | unknown;
	  };

type ThemeLike =
	| null
	| string
	| {
			id?: unknown;
			themeName?: unknown;
			name?: unknown;
			title?: unknown;
			label?: unknown;
	  };

type DiscordUserRecord = {
	id: number;
	userUid: string | null;
	discordId: string;
	username: string | null;
	globalName: string | null;
	avatarHash: string | null;
	discriminator: string | null;
	createdFromSnowflake: string | null;
	isMember: boolean;
	roles: null;
	joinedAt: string | null;
	gameUsername: string | null;
	alias: string | null;
	entity: EntityLike;
	theme: ThemeLike;
	notes: string | null;
	validFrom: null;
	validTo: null;
	lastLoginAt: string | null;
	updatedAt: string | null;
	createdAt: string | null;
};

type WorkspaceAction = {
	title: string;
	description: string;
	href: string;
	lucideName: string;
};

type ProfileDetailRowProps = {
	label: string;
	children: React.ReactNode;
	monospace?: boolean;
};

const WORKSPACE_ACTIONS: WorkspaceAction[] = [
	{
		title: "My content",
		description: "Review and manage your authored pages across collections.",
		href: "/me/content",
		lucideName: "BookOpen",
	},
	{
		title: "My media",
		description: "Manage uploads prepared for your public and member content.",
		href: "/me/media",
		lucideName: "Clapperboard",
	},
	{
		title: "My series",
		description: "Organize serial content and future multi-part releases.",
		href: "/me/series",
		lucideName: "Layers3",
	},
];

function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isProfileRecord(value: unknown): value is DiscordUserRecord {
	return (
		isObject(value) &&
		typeof value.id === "number" &&
		typeof value.discordId === "string" &&
		(typeof value.userUid === "string" || value.userUid === null) &&
		(typeof value.username === "string" || value.username === null) &&
		(typeof value.globalName === "string" || value.globalName === null) &&
		typeof value.isMember === "boolean"
	);
}

/* ============================== Format helpers ============================= */
function formatDate(value: string | null): string {
	if (!value) {
		return "Not available";
	}

	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function formatShortDate(value: string | null): string | null {
	if (!value) {
		return null;
	}

	const date = new Date(value);
	return Number.isNaN(date.getTime())
		? value
		: date.toLocaleDateString(undefined, {
				year: "numeric",
				month: "short",
				day: "numeric",
			});
}

function formatEntity(value: EntityLike): string {
	if (!value) {
		return "Not linked";
	}

	if (typeof value === "string") {
		return value || "Not linked";
	}

	const id =
		typeof value.id === "string" || typeof value.id === "number"
			? String(value.id)
			: "";
	const name = typeof value.name === "string" ? value.name : "";
	const slug = typeof value.slug === "string" ? value.slug : "";
	const type =
		isObject(value.type) && typeof value.type.type === "string"
			? value.type.type
			: "";
	const pieces = [name || id || "Not linked"];

	if (type) {
		pieces.push(type);
	}

	if (slug) {
		pieces.push(slug);
	}

	return pieces.join(" / ");
}

function formatTheme(value: ThemeLike): string {
	if (!value) {
		return "Not set";
	}

	if (typeof value === "string") {
		return value || "Not set";
	}

	const themeName =
		(typeof value.themeName === "string" && value.themeName) ||
		(typeof value.name === "string" && value.name) ||
		(typeof value.title === "string" && value.title) ||
		(typeof value.label === "string" && value.label) ||
		"";

	return themeName || "Not set";
}

function getDisplayName(
	record: DiscordUserRecord | null,
	sessionName: string,
): string {
	return record?.globalName || record?.username || sessionName;
}

/* ============================== Subcomponents ============================== */
function WorkspaceActionCard({ action }: { action: WorkspaceAction }) {
	return (
		<BrowseResultCard
			href={action.href}
			visual={
				<IconVisual
					iconKey={null}
					iconColor={null}
					fallback={{ lucideName: action.lucideName }}
					mediaRouteScope="app"
					size="card"
					title={action.title}
				/>
			}
			title={action.title}
			summary={action.description}
			className="member-workspace-card"
		/>
	);
}

function ProfileDetailRow({
	label,
	children,
	monospace = false,
}: ProfileDetailRowProps) {
	return (
		<div className="member-profile-detail-row">
			<dt className="member-profile-detail-row__term">{label}</dt>
			<dd
				className={
					monospace
						? "member-profile-detail-row__value member-profile-detail-row__value--mono"
						: "member-profile-detail-row__value"
				}
			>
				{children}
			</dd>
		</div>
	);
}

/* ============================== Component ============================== */
export default function MeTable({ name }: { name: string }) {
	const [open, setOpen] = React.useState(false);
	const [loading, setLoading] = React.useState(true);
	const [error, setError] = React.useState<string | undefined>();
	const [record, setRecord] = React.useState<DiscordUserRecord | null>(null);

	const load = React.useCallback(async () => {
		setLoading(true);
		setError(undefined);

		try {
			const response = await fetch("/api/me", {
				method: "GET",
				cache: "no-store",
			});
			const payload = (await response.json()) as unknown;

			if (!response.ok) {
				const message =
					isObject(payload) && typeof payload.error === "string"
						? payload.error
						: `Failed (${response.status})`;
				throw new Error(message);
			}

			setRecord(isProfileRecord(payload) ? payload : null);
		} catch (loadError: unknown) {
			setError(
				loadError instanceof Error ? loadError.message : "Failed to load profile.",
			);
			setRecord(null);
		} finally {
			setLoading(false);
		}
	}, []);

	React.useEffect(() => {
		void load();
	}, [load]);

	const displayName = getDisplayName(record, name);
	const notes = record?.notes?.trim() || null;

	return (
		<div className="member-dashboard-main member-profile-workspace">
			<BrowsePageHeader
				className="member-profile-header"
				breadcrumbs={[{ label: "Member" }, { label: "Profile" }]}
				title={displayName}
				actions={
					record ? (
						<StatusPill tone={record.isMember ? "success" : "muted"}>
							<ShieldCheck
								className="member-profile-header__status-icon"
								aria-hidden
							/>
							{record.isMember ? "Mafia Guild Member" : "Signed in"}
						</StatusPill>
					) : loading ? (
						<StatusPill tone="muted">Loading profile</StatusPill>
					) : null
				}
				description={
					<div className="member-profile-header__secondary-actions">
						<Button
							size="sm"
							variant="secondary"
							leftIcon={
								<Pencil className="member-profile-header__edit-icon" aria-hidden />
							}
							onClick={() => setOpen(true)}
							disabled={loading || !record}
						>
							Edit profile
						</Button>
					</div>
				}
			/>

			<BrowseResultsPanel
				className="member-profile-workspace-panel"
				aria-label="Member workspace"
			>
				<div className="member-workspace-grid">
					{WORKSPACE_ACTIONS.map((action) => (
						<WorkspaceActionCard key={action.href} action={action} />
					))}
				</div>
			</BrowseResultsPanel>

			<SurfacePanel
				material="structure"
				density="spacious"
				className="member-profile-overview"
			>
				<SectionHeader
					eyebrow="Account"
					title="Profile overview"
					description="Your member-facing preferences and the account facts resolved by the platform."
				/>

				{loading ? (
					<SurfaceState
						kind="loading"
						title="Loading profile"
						description="Resolving your current member profile and account details."
					/>
				) : error ? (
					<SurfaceState
						kind="error"
						title="Profile unavailable"
						description={error}
						actions={
							<Button variant="secondary" onClick={() => void load()}>
								Try again
							</Button>
						}
					/>
				) : !record ? (
					<SurfaceState
						kind="empty"
						title="No profile found"
						description="No member profile is currently available for this account."
					/>
				) : (
					<div className="member-profile-overview__layout">
						<div className="member-profile-overview__group">
							<h3 className="member-profile-overview__group-title">Preferences</h3>
							<dl className="member-profile-detail-list">
								<ProfileDetailRow label="Membership">
									<StatusPill tone={record.isMember ? "success" : "muted"}>
										{record.isMember ? "Mafia Guild Member" : "Signed in"}
									</StatusPill>
								</ProfileDetailRow>
								<ProfileDetailRow label="Game username">
									{record.gameUsername ?? "Not set"}
								</ProfileDetailRow>
								<ProfileDetailRow label="Alias">
									{record.alias ?? "Not set"}
								</ProfileDetailRow>
								<ProfileDetailRow label="Theme">
									{formatTheme(record.theme)}
								</ProfileDetailRow>
								<ProfileDetailRow label="Joined">
									{formatShortDate(record.joinedAt) ?? "Not available"}
								</ProfileDetailRow>
								<ProfileDetailRow label="Last login">
									{formatDate(record.lastLoginAt)}
								</ProfileDetailRow>
							</dl>
						</div>

						<div className="member-profile-overview__group">
							<h3 className="member-profile-overview__group-title">Account details</h3>
							<dl className="member-profile-detail-list">
								<ProfileDetailRow label="Discord ID" monospace>
									{record.discordId}
								</ProfileDetailRow>
								<ProfileDetailRow label="Linked entity">
									{formatEntity(record.entity)}
								</ProfileDetailRow>
								<ProfileDetailRow label="Profile updated">
									{formatDate(record.updatedAt)}
								</ProfileDetailRow>
							</dl>

							{notes ? (
								<div className="member-profile-overview__notes">
									<div className="member-profile-overview__notes-label">
										Profile notes
									</div>
									<p>{notes}</p>
								</div>
							) : null}
						</div>
					</div>
				)}
			</SurfacePanel>

			<RolesPanel />

			<MePanel
				open={open}
				onClose={() => setOpen(false)}
				initial={
					record
						? {
								gameUsername: record.gameUsername,
								alias: record.alias,
								theme: record.theme,
								notes: record.notes,
							}
						: null
				}
				onSaved={load}
			/>
		</div>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
