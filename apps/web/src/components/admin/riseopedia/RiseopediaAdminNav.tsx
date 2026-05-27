//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/riseopedia/RiseopediaAdminNav.tsx                                        ////
//// Language: TSX                                                                                               ////
//// Shared navigation for Riseopedia admin sub-surfaces.                                                        ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { JSX } from "react";

import { ButtonLink } from "@/components/ui";

export type RiseopediaAdminNavKey =
	| "sections"
	| "section-rules"
	| "section-items"
	| "visibility"
	| "properties"
	| "display-profiles"
	| "profile-bindings"
	| "profile-properties"
	| "blocks";

export interface RiseopediaAdminNavProps {
	active: RiseopediaAdminNavKey;
}

const links: Array<{
	key: RiseopediaAdminNavKey;
	label: string;
	href: string;
}> = [
	{ key: "sections", label: "Sections", href: "/admin/riseopedia/sections" },
	{
		key: "section-rules",
		label: "Section Rules",
		href: "/admin/riseopedia/section-rules",
	},
	{
		key: "section-items",
		label: "Section Manual Overrides",
		href: "/admin/riseopedia/section-items",
	},
	{
		key: "visibility",
		label: "Item Visibility Overrides",
		href: "/admin/riseopedia/visibility",
	},
	{
		key: "properties",
		label: "Properties",
		href: "/admin/riseopedia/properties",
	},
	{
		key: "display-profiles",
		label: "Display Profiles",
		href: "/admin/riseopedia/display-profiles",
	},
	{
		key: "profile-bindings",
		label: "Profile Bindings",
		href: "/admin/riseopedia/profile-bindings",
	},
	{
		key: "profile-properties",
		label: "Profile Properties",
		href: "/admin/riseopedia/profile-properties",
	},
	{ key: "blocks", label: "Profile Blocks", href: "/admin/riseopedia/blocks" },
];

export default function RiseopediaAdminNav({
	active,
}: RiseopediaAdminNavProps): JSX.Element {
	return (
		<div className="admin-template-nav admin-riseopedia-nav">
			{links.map((link) => (
				<ButtonLink
					key={link.href}
					href={link.href}
					variant={active === link.key ? "green" : "neutral"}
				>
					{link.label}
				</ButtonLink>
			))}
		</div>
	);
}
