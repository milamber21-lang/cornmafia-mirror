//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/riseopedia/RiseopediaAdminNav.tsx                                        ////
//// Language: TSX                                                                                               ////
//// Shared navigation across the active Riseopedia and Mafiosopedia administration families.                    ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

"use client";

import type { JSX } from "react";

import { ButtonLink } from "@/components/ui";

export type RiseopediaAdminNavKey =
	| "sections"
	| "section-rules"
	| "properties"
	| "display-profiles"
	| "profile-bindings"
	| "profile-body-blocks"
	| "profile-properties"
	| "profile-variant-selectors"
	| "overview-card-rules"
	| "overview-card-elements"
	| "relationship-display-rules"
	| "patch-channels"
	| "patch-publications"
	| "patch-scope-overrides"
	| "release-decisions"
	| "release-evidence"
	| "release-overrides";

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
		key: "profile-body-blocks",
		label: "Body Blocks",
		href: "/admin/riseopedia/profile-body-blocks",
	},
	{
		key: "profile-properties",
		label: "Profile Properties",
		href: "/admin/riseopedia/profile-properties",
	},
	{
		key: "profile-variant-selectors",
		label: "Variant Selectors",
		href: "/admin/riseopedia/profile-variant-selectors",
	},
	{
		key: "overview-card-rules",
		label: "Card Rules",
		href: "/admin/riseopedia/overview-card-rules",
	},
	{
		key: "overview-card-elements",
		label: "Card Elements",
		href: "/admin/riseopedia/overview-card-elements",
	},
	{
		key: "relationship-display-rules",
		label: "Relationship Rules",
		href: "/admin/riseopedia/relationship-display-rules",
	},
	{
		key: "patch-channels",
		label: "Patch Channels",
		href: "/admin/riseopedia/patch-channels",
	},
	{
		key: "patch-publications",
		label: "Publications",
		href: "/admin/riseopedia/patch-publications",
	},
	{
		key: "patch-scope-overrides",
		label: "Scope Overrides",
		href: "/admin/riseopedia/patch-scope-overrides",
	},
	{
		key: "release-decisions",
		label: "Release Decisions",
		href: "/admin/riseopedia/release-decisions",
	},
	{
		key: "release-evidence",
		label: "Release Evidence",
		href: "/admin/riseopedia/release-evidence",
	},
	{
		key: "release-overrides",
		label: "Release Overrides",
		href: "/admin/riseopedia/release-overrides",
	},
];

export default function RiseopediaAdminNav({
	active,
}: RiseopediaAdminNavProps): JSX.Element {
	return (
		<nav className="admin-template-nav" aria-label="Riseopedia administration">
			{links.map((link) => (
				<ButtonLink
					key={link.href}
					href={link.href}
					size="sm"
					variant={active === link.key ? "primary" : "secondary"}
					aria-current={active === link.key ? "page" : undefined}
				>
					{link.label}
				</ButtonLink>
			))}
		</nav>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
