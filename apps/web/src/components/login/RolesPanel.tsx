//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/login/RolesPanel.tsx                                                           ////
//// Language: TSX                                                                                                ////
//// Client member access summary using compact role rows and shared material states.                             ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { Shield, ShieldCheck } from "lucide-react";

import {
	IconWell,
	SectionHeader,
	StatusPill,
	SurfacePanel,
	SurfaceState,
} from "@/components/ui";

type Role = {
	id: string;
	name: string;
	source: "discord" | "virtual";
	roleId?: string | null;
	colorHex?: string | null;
	isPublicDefault?: boolean;
	isAuthenticatedDefault?: boolean;
	isAdmin?: boolean;
	isEditor?: boolean;
};

type RolesResponse =
	| {
			ok: true;
			roles: Role[];
			defaults?: { public: Role | null; authenticated: Role | null };
	  }
	| { ok: false; error: string };

function getRoleTone(role: Role): string {
	if (role.isAdmin) {
		return "member-role-row--admin";
	}

	if (role.isEditor) {
		return "member-role-row--editor";
	}

	if (role.isAuthenticatedDefault) {
		return "member-role-row--authenticated";
	}

	return "member-role-row--default";
}

function getRoleLabel(role: Role): string {
	if (role.isAdmin) {
		return "Admin";
	}

	if (role.isEditor) {
		return "Editor";
	}

	if (role.isAuthenticatedDefault) {
		return "Member access";
	}

	if (role.isPublicDefault) {
		return "Public default";
	}

	return role.source === "virtual" ? "Virtual" : "Discord";
}

function RoleSwatch({ role }: { role: Role }) {
	const style = role.colorHex
		? ({ "--role-color": `#${role.colorHex.replace(/^#/, "")}` } as CSSProperties)
		: undefined;

	return <span className="member-role-swatch" style={style} aria-hidden />;
}

export default function RolesPanel() {
	const [roles, setRoles] = useState<Role[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;

		async function loadRoles() {
			setLoading(true);
			setError(null);

			try {
				const response = await fetch("/api/me/roles", { cache: "no-store" });
				const payload = (await response.json()) as RolesResponse;

				if (cancelled) {
					return;
				}

				if (payload.ok) {
					setRoles(payload.roles ?? []);
				} else {
					setError(payload.error || "Failed to load roles.");
				}
			} catch (errorValue: unknown) {
				if (!cancelled) {
					setError(
						errorValue instanceof Error
							? errorValue.message
							: "Failed to load roles.",
					);
				}
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		}

		void loadRoles();

		return () => {
			cancelled = true;
		};
	}, []);

	return (
		<SurfacePanel
			material="structure"
			density="spacious"
			className="member-roles-panel"
		>
			<SectionHeader
				eyebrow="Access"
				title="Guild roles"
				description="Current Discord and virtual access roles resolved by the platform."
				action={
					<StatusPill tone="info">
						<ShieldCheck className="member-roles-panel__status-icon" aria-hidden />
						Access resolved
					</StatusPill>
				}
			/>

			{loading ? (
				<SurfaceState
					kind="loading"
					density="compact"
					title="Loading guild roles"
					description="Resolving Discord and virtual access for this account."
				/>
			) : error ? (
				<SurfaceState
					kind="error"
					density="compact"
					title="Roles unavailable"
					description={error}
				/>
			) : roles.length > 0 ? (
				<ul className="member-role-list">
					{roles.map((role) => (
						<li key={role.id} className={`member-role-row ${getRoleTone(role)}`}>
							<IconWell size="sm" className="member-role-row__icon">
								{role.isAdmin || role.isEditor ? (
									<ShieldCheck className="member-role-row__icon-svg" aria-hidden />
								) : (
									<Shield className="member-role-row__icon-svg" aria-hidden />
								)}
							</IconWell>
							<div className="member-role-row__copy">
								<div className="member-role-row__title">
									<RoleSwatch role={role} />
									<span className="member-role-row__name">{role.name}</span>
								</div>
								<span className="member-role-row__label">{getRoleLabel(role)}</span>
							</div>
						</li>
					))}
				</ul>
			) : (
				<SurfaceState
					kind="empty"
					density="compact"
					title="No guild roles"
					description="No Discord or virtual roles were found for this account."
				/>
			)}
		</SurfacePanel>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
