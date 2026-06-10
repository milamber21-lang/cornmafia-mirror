//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/riseopedia/RiseopediaAccessControlNav.tsx                              ////
//// Language: TSX                                                                                               ////
//// Template-style toggle navigation for Riseopedia access-control admin pages.                                 ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
"use client";

import type { JSX } from "react";

import { ButtonLink } from "@/components/ui";

export type RiseopediaAccessControlNavKey = "publications" | "overrides" | "decisions";

export interface RiseopediaAccessControlNavProps {
	active: RiseopediaAccessControlNavKey;
}

const links: Array<{
	key: RiseopediaAccessControlNavKey;
	label: string;
	href: string;
}> = [
	{ key: "publications", label: "Patch Publications", href: "/admin/riseopedia/patch-publications" },
	{ key: "overrides", label: "Patch Overrides", href: "/admin/riseopedia/patch-scope-overrides" },
	{ key: "decisions", label: "Entity Decisions", href: "/admin/riseopedia/release-decisions" },
];

export default function RiseopediaAccessControlNav({ active }: RiseopediaAccessControlNavProps): JSX.Element {
	return (
		<div className="admin-template-nav">
			{links.map((link) => (
				<ButtonLink key={link.href} href={link.href} variant={active === link.key ? "green" : "neutral"}>
					{link.label}
				</ButtonLink>
			))}
		</div>
	);
}
