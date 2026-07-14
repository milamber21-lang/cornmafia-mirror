//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/web/TemplatesAdminNav.tsx                                                 ////
//// Language: TSX                                                                                                 ////
//// Shared grouped navigation for the templates admin family                                                      ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

"use client";

import type { JSX } from "react";

import { ButtonLink } from "@/components/ui";

type TemplatesAdminNavKey =
	| "templates"
	| "field-list"
	| "field-types"
	| "field-tools"
	| "field-options"
	| "field-list-tools"
	| "template-fields";

export interface TemplatesAdminNavProps {
	active: TemplatesAdminNavKey;
	contextualHref?: string;
	contextualLabel?: string;
}

export default function TemplatesAdminNav({
	active,
	contextualHref,
	contextualLabel,
}: TemplatesAdminNavProps): JSX.Element {
	const links: Array<{
		key: TemplatesAdminNavKey;
		label: string;
		href: string;
	}> = [
		{ key: "templates", label: "Templates", href: "/admin/web/templates" },
		{
			key: "field-list",
			label: "Field List",
			href: "/admin/web/templates/field-list",
		},
		{
			key: "field-types",
			label: "Field Types",
			href: "/admin/web/templates/field-types",
		},
		{
			key: "field-tools",
			label: "Field Tools",
			href: "/admin/web/templates/field-tools",
		},
	];

	if (
		contextualHref &&
		contextualLabel &&
		(active === "field-options" ||
			active === "field-list-tools" ||
			active === "template-fields")
	) {
		links.push({
			key: active,
			label: contextualLabel,
			href: contextualHref,
		});
	}

	return (
		<div className="admin-template-nav">
			{links.map((link) => (
				<ButtonLink
					key={link.href}
					href={link.href}
					variant={active === link.key ? "primary" : "secondary"}
				>
					{link.label}
				</ButtonLink>
			))}
		</div>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
