//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/admin/page.tsx                                                                       ////
//// Language: TSX                                                                                               ////
//// Permission-aware control center entry page for active DB-first admin surfaces.                               ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import {
	ArrowRight,
	FileText,
	Folder,
	Image,
	Layers3,
	LayoutTemplate,
	Link2,
	ListTree,
	Navigation,
	Palette,
	Settings,
	Shield,
	Star,
	Users,
	Video,
	type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { IconWell } from "@/components/ui";
import { requireAdmin, requireAdminOrEditor } from "@/lib/auth/authz";

type AdminAccessLevel = "admin" | "editor";

type AdminLink = {
	title: string;
	description: string;
	href: string;
	icon: LucideIcon;
	minimumAccess: AdminAccessLevel;
};

type AdminSection = {
	title: string;
	description: string;
	items: AdminLink[];
};

type VisibleAdminSection = AdminSection;

type AdminRailGroup = {
	title: string;
	items: Pick<AdminLink, "title" | "href" | "icon">[];
};

const discordLinks: AdminLink[] = [
	{
		title: "Roles",
		description: "Create and manage Discord-backed access roles and rank rules.",
		href: "/admin/discord/roles",
		icon: Shield,
		minimumAccess: "admin",
	},
	{
		title: "Users",
		description: "Review Discord users, memberships, and local admin notes.",
		href: "/admin/discord/users",
		icon: Users,
		minimumAccess: "admin",
	},
];

const webStructureLinks: AdminLink[] = [
	{
		title: "Templates",
		description: "Create and manage templates, fields, and placements.",
		href: "/admin/web/templates",
		icon: LayoutTemplate,
		minimumAccess: "admin",
	},
	{
		title: "Categories",
		description: "Organize primary content categories and access rules.",
		href: "/admin/web/categories",
		icon: Folder,
		minimumAccess: "admin",
	},
	{
		title: "Subcategories",
		description: "Manage category buckets used by routing and navigation.",
		href: "/admin/web/subcategories",
		icon: ListTree,
		minimumAccess: "admin",
	},
	{
		title: "Navigation",
		description: "Publish and manage DB-backed navigation menus.",
		href: "/admin/web/navigation",
		icon: Navigation,
		minimumAccess: "admin",
	},
	{
		title: "External Links",
		description: "Manage external host rules used by content validation.",
		href: "/admin/web/external-link-hosts",
		icon: Link2,
		minimumAccess: "admin",
	},
	{
		title: "YouTube Channels",
		description: "Allow trusted YouTube channels for future video validation.",
		href: "/admin/web/youtube-channels",
		icon: Video,
		minimumAccess: "admin",
	},
	{
		title: "Theme Colors",
		description: "Manage brand colors, icon colors, and UI theme tokens.",
		href: "/admin/web/theme-colors",
		icon: Palette,
		minimumAccess: "admin",
	},
	{
		title: "Icons",
		description: "Browse and manage Lucide or uploaded SVG icon references.",
		href: "/admin/web/icons",
		icon: Star,
		minimumAccess: "admin",
	},
	{
		title: "Content Kinds",
		description: "Define content families, route prefixes, and renderers.",
		href: "/admin/web/content-kinds",
		icon: Settings,
		minimumAccess: "admin",
	},
];

const publishingLinks: AdminLink[] = [
	{
		title: "Content",
		description: "Create and manage DB-first website content.",
		href: "/admin/web/content",
		icon: FileText,
		minimumAccess: "editor",
	},
	{
		title: "Media",
		description: "Upload, review, and organize reusable media files.",
		href: "/admin/web/media",
		icon: Image,
		minimumAccess: "admin",
	},
	{
		title: "Series",
		description: "Group related content into structured learning paths.",
		href: "/admin/web/series",
		icon: Layers3,
		minimumAccess: "editor",
	},
];

const sections: AdminSection[] = [
	{
		title: "Discord",
		description: "Manage Discord server settings, access roles, and members.",
		items: discordLinks,
	},
	{
		title: "Web Structure",
		description: "Configure templates, routing structure, navigation, links, colors, and icon rules.",
		items: webStructureLinks,
	},
	{
		title: "Publishing",
		description: "Create, organize, and publish content to the public site.",
		items: publishingLinks,
	},
];

function canViewLink(item: AdminLink, isAdmin: boolean): boolean {
	return isAdmin || item.minimumAccess === "editor";
}

function buildVisibleSections(isAdmin: boolean): VisibleAdminSection[] {
	return sections
		.map((section) => ({
			...section,
			items: section.items.filter((item) => canViewLink(item, isAdmin)),
		}))
		.filter((section) => section.items.length > 0);
}

function buildRailGroups(visibleSections: VisibleAdminSection[]): AdminRailGroup[] {
	return visibleSections.map((section) => ({
		title: section.title,
		items: section.items.map(({ title, href, icon }) => ({ title, href, icon })),
	}));
}

function getHeaderText(isAdmin: boolean): string {
	return isAdmin
		? "Quick access to Discord management, website structure, publishing tools, and DB-first platform settings."
		: "Quick access to the content and series tools currently available to editors.";
}

function AdminIcon({ icon: Icon }: { icon: LucideIcon }) {
	return <Icon aria-hidden className="admin-control-icon" strokeWidth={1.8} />;
}

function AdminSectionCard({ item }: { item: AdminLink }) {
	return (
		<Link href={item.href} className="admin-control-card">
			<IconWell size="lg" className="admin-control-card__icon">
				<AdminIcon icon={item.icon} />
			</IconWell>

			<span className="admin-control-card__body">
				<span className="admin-control-card__title">{item.title}</span>
				<span className="admin-control-card__description">{item.description}</span>
			</span>

			<ArrowRight aria-hidden className="admin-control-card__arrow" />
		</Link>
	);
}

function AdminSectionPanel({ section }: { section: VisibleAdminSection }) {
	return (
		<section className="admin-control-section">
			<div className="admin-control-section__header">
				<h2 className="admin-control-section__title">{section.title}</h2>
				<p className="admin-control-section__description">{section.description}</p>
			</div>

			<div className="admin-control-section__grid">
				{section.items.map((item) => (
					<AdminSectionCard key={item.href} item={item} />
				))}
			</div>
		</section>
	);
}

function AdminRail({ groups }: { groups: AdminRailGroup[] }) {
	return (
		<aside className="admin-control-rail">
			<div className="admin-control-rail__header">
				<div className="admin-control-rail__title">
					<LayoutTemplate aria-hidden className="admin-control-rail__title-icon" />
					Control Center
				</div>
			</div>

			<nav aria-label="Control center sections" className="admin-control-rail__nav">
				{groups.map((group) => (
					<div key={group.title}>
						<div className="admin-control-rail__group-title">{group.title}</div>
						<div className="admin-control-rail__links">
							{group.items.map((item) => {
								const Icon = item.icon;

								return (
									<Link key={item.href} href={item.href} className="admin-control-rail__link">
										<Icon aria-hidden className="admin-control-rail__link-icon" strokeWidth={1.8} />
										<span className="admin-control-rail__link-label">{item.title}</span>
									</Link>
								);
							})}
						</div>
					</div>
				))}
			</nav>
		</aside>
	);
}

export default async function AdminIndex() {
	const adminOrEditorGuard = await requireAdminOrEditor();

	if (!adminOrEditorGuard.allowed) {
		return notFound();
	}

	const adminGuard = await requireAdmin();
	const isAdmin = adminGuard.allowed;
	const visibleSections = buildVisibleSections(isAdmin);
	const railGroups = buildRailGroups(visibleSections);

	return (
		<section className="card">
			<div className="admin-control-layout">
				<AdminRail groups={railGroups} />

				<div className="admin-control-main">
					<header className="admin-control-hero">
						<div className="admin-control-hero__content">
							<h1 className="admin-control-hero__title">Control Center</h1>
							<p className="admin-control-hero__description">{getHeaderText(isAdmin)}</p>
						</div>
					</header>

					{visibleSections.map((section) => (
						<AdminSectionPanel key={section.title} section={section} />
					))}
				</div>
			</div>
		</section>
	);
}
