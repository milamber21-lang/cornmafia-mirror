//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/me/MeTable.tsx                                                                 ////
//// Language: TSX                                                                                                ////
//// Client member workspace surface with profile actions, overview cards, and role summary.                      ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
"use client";

import * as React from "react";
import Image from "next/image";
import { ArrowRight, BookOpen, Clapperboard, Layers3, Pencil, ShieldCheck } from "lucide-react";

import RolesPanel from "@/components/login/RolesPanel";
import MePanel from "@/components/me/MePanel";
import { Button, ButtonLink } from "@/components/ui/basic-elements/Button";

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
	icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
};

type OverviewItem = {
	label: string;
	value: string;
	tone?: "normal" | "good" | "muted";
};

const WORKSPACE_ACTIONS: WorkspaceAction[] = [
	{
		title: "My content",
		description: "Review and manage your authored pages across collections.",
		href: "/me/content",
		icon: BookOpen,
	},
	{
		title: "My media",
		description: "Manage uploads prepared for your public and member content.",
		href: "/me/media",
		icon: Clapperboard,
	},
	{
		title: "My series",
		description: "Organize serial content and future multi-part releases.",
		href: "/me/series",
		icon: Layers3,
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
		(typeof value.isMember === "boolean")
	);
}

/* ============================== Format helpers ============================= */
function formatDate(value: string | null): string {
	if (!value) {
		return "-";
	}

	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function formatShortDate(value: string | null): string {
	if (!value) {
		return "-";
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
		return "-";
	}

	if (typeof value === "string") {
		return value || "-";
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
	const pieces = [name || id || "-"];

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
		return "-";
	}

	if (typeof value === "string") {
		return value || "-";
	}

	const themeName =
		(typeof value.themeName === "string" && value.themeName) ||
		(typeof value.name === "string" && value.name) ||
		(typeof value.title === "string" && value.title) ||
		(typeof value.label === "string" && value.label) ||
		"";

	return themeName || "-";
}

function getDisplayName(record: DiscordUserRecord | null, sessionName: string): string {
	return record?.globalName || record?.username || sessionName;
}

function buildOverviewItems(record: DiscordUserRecord): OverviewItem[] {
	return [
		{
			label: "Membership",
			value: record.isMember ? "Mafia Guild Member" : "Signed in",
			tone: record.isMember ? "good" : "muted",
		},
		{
			label: "Game username",
			value: record.gameUsername ?? "Not set",
		},
		{
			label: "Alias",
			value: record.alias ?? "Not set",
		},
		{
			label: "Theme",
			value: formatTheme(record.theme),
		},
		{
			label: "Joined",
			value: formatShortDate(record.joinedAt),
		},
		{
			label: "Last login",
			value: formatDate(record.lastLoginAt),
		},
	];
}

function getToneClass(tone: OverviewItem["tone"]): string {
	if (tone === "good") {
		return "member-stat-card__value--good";
	}

	if (tone === "muted") {
		return "member-stat-card__value--muted";
	}

	return "member-stat-card__value--default";
}

/* ============================== Subcomponents ============================== */
function ProfileAvatar({ image, name }: { image: string | null; name: string }) {
	if (image) {
		return (
			<Image
				src={image}
				alt={name}
				width={88}
				height={88}
				unoptimized
				className="member-profile-avatar member-profile-avatar--image"
			/>
		);
	}

	return (
		<div className="member-profile-avatar member-profile-avatar--fallback">
			{name.slice(0, 1).toUpperCase()}
		</div>
	);
}

function ActionCard({ action }: { action: WorkspaceAction }) {
	const Icon = action.icon;

	return (
		<ButtonLink
			href={action.href}
			variant="neutral"
			className="member-action-card"
		>
			<span className="member-action-card__icon">
				<Icon className="member-action-card__glyph" aria-hidden />
			</span>
			<span className="member-action-card__body">
				<span className="member-action-card__title">
					{action.title}
				</span>
				<span className="member-action-card__text">
					{action.description}
				</span>
			</span>
			<ArrowRight className="member-action-card__arrow" aria-hidden />
		</ButtonLink>
	);
}

function OverviewCard({ item }: { item: OverviewItem }) {
	return (
		<div className="member-stat-card">
			<div className="member-stat-card__label">
				{item.label}
			</div>
			<div className={`member-stat-card__value member-stat-card__value--profile ${getToneClass(item.tone)}`}>
				{item.value}
			</div>
		</div>
	);
}

function LoadingState() {
	return (
		<div className="member-skeleton-grid">
			{["one", "two", "three", "four", "five", "six"].map((key) => (
				<div
					key={key}
					className="member-skeleton-card"
				/>
			))}
		</div>
	);
}

/* ============================== Component ============================== */
export default function MeTable({
	name,
	image,
}: {
	name: string;
	image: string | null;
}) {
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
	const overviewItems = record ? buildOverviewItems(record) : [];

	return (
		<div className="member-dashboard-main">
			<header className="member-hero">
				<ProfileAvatar image={image} name={displayName} />
				<div className="member-profile-hero__body">
					<div className="member-profile-badge">
						<ShieldCheck className="member-profile-badge__icon" aria-hidden />
						Member workspace
					</div>
					<h1 className="member-hero__title member-profile-title">
						{displayName}
					</h1>
					<p className="member-hero__text">
						{record?.username ? `Discord: ${record.username}` : "Discord profile"}
					</p>
				</div>
			</header>

			<div className="member-stat-grid member-stat-grid--four">
				{WORKSPACE_ACTIONS.map((action) => (
					<ActionCard key={action.href} action={action} />
				))}
				<Button
					variant="neutral"
					className="member-action-card"
					onClick={() => setOpen(true)}
				>
					<span className="member-action-card__icon member-action-card__icon--danger">
						<Pencil className="member-action-card__glyph" aria-hidden />
					</span>
					<span className="member-action-card__body">
						<span className="member-action-card__title">Edit profile</span>
						<span className="member-action-card__text">
							Update your member profile fields and display preferences.
						</span>
					</span>
					<ArrowRight className="member-action-card__arrow" aria-hidden />
				</Button>
			</div>

			<section className="member-profile-section">
				<div className="member-profile-section__header">
					<div>
						<h2 className="member-profile-section__title">Overview</h2>
						<p className="member-hero__text">
							Current profile details available from the member profile contract.
						</p>
					</div>
				</div>

				{loading ? (
					<LoadingState />
				) : error ? (
					<div className="member-error-banner">
						{error}
					</div>
				) : !record ? (
					<div className="member-profile-note">
						No profile was found for this account.
					</div>
				) : (
					<div className="member-profile-overview-stack">
						<div className="member-skeleton-grid">
							{overviewItems.map((item) => (
								<OverviewCard key={item.label} item={item} />
							))}
						</div>

						<div className="member-profile-card-grid">
							<div className="member-profile-card">
								<div className="member-stat-card__label">
									Discord identity
								</div>
								<dl className="member-profile-definition-list">
									<div className="member-profile-definition-row">
										<dt className="member-profile-definition-term">Discord ID</dt>
										<dd className="member-profile-definition-value member-profile-definition-value--mono">{record.discordId}</dd>
									</div>
									<div className="member-profile-definition-row">
										<dt className="member-profile-definition-term">Entity</dt>
										<dd className="member-profile-definition-value">{formatEntity(record.entity)}</dd>
									</div>
									<div className="member-profile-definition-row">
										<dt className="member-profile-definition-term">Profile updated</dt>
										<dd className="member-profile-definition-value">{formatDate(record.updatedAt)}</dd>
									</div>
								</dl>
							</div>

							<div className="member-profile-card">
								<div className="member-stat-card__label">
									Profile notes
								</div>
								<p className="member-profile-card__text">
									{record.notes ?? "No profile notes saved yet."}
								</p>
							</div>
						</div>
					</div>
				)}
			</section>

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
