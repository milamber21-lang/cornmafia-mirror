//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/login/RolesPanel.tsx                                                           ////
//// Language: TSX                                                                                                ////
//// Client component that shows the current user role summary as readable member cards.                          ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { Shield, ShieldCheck } from "lucide-react";

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
		return "member-role-card--admin";
	}

	if (role.isEditor) {
		return "member-role-card--editor";
	}

	if (role.isAuthenticatedDefault) {
		return "member-role-card--authenticated";
	}

	return "member-role-card--default";
}

function getRoleLabel(role: Role): string {
	if (role.isAdmin) {
		return "Admin";
	}

	if (role.isEditor) {
		return "Editor";
	}

	if (role.isAuthenticatedDefault) {
		return "Mafia Guild Member";
	}

	if (role.isPublicDefault) {
		return "Public default";
	}

	return role.source === "virtual" ? "Virtual" : "Discord";
}

function getRoleLabelClass(role: Role): string {
	if (role.isAuthenticatedDefault) {
		return "member-role-card__label member-role-card__label--member";
	}

	return "member-role-card__label";
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
		<section className="member-roles-section">
			<header className="member-roles-header">
				<div>
					<h2 className="member-roles-title">Guild roles</h2>
					<p className="member-roles-description">
						Current Discord and virtual access roles resolved by the platform.
					</p>
				</div>
				<div className="member-roles-resolved-badge">
					<ShieldCheck className="member-roles-resolved-badge__icon" aria-hidden />
					Access resolved
				</div>
			</header>

			{loading ? (
				<div className="member-roles-grid">
					{["one", "two", "three"].map((key) => (
						<div
							key={key}
							className="member-roles-skeleton"
						/>
					))}
				</div>
			) : error ? (
				<div className="member-roles-error">
					{error}
				</div>
			) : roles.length > 0 ? (
				<ul className="member-roles-list">
					{roles.map((role) => (
						<li
							key={role.id}
							className={`member-role-card ${getRoleTone(role)}`}
						>
							<div className="member-role-card__inner">
								<div className="member-role-card__icon">
									{role.isAdmin || role.isEditor ? (
										<ShieldCheck className="member-role-card__icon-svg" aria-hidden />
									) : (
										<Shield className="member-role-card__icon-svg" aria-hidden />
									)}
								</div>
								<div className="member-role-card__body">
									<div className="member-role-card__title-row">
										<RoleSwatch role={role} />
										<div className="member-role-card__name">
											{role.name}
										</div>
									</div>
									<div className="member-role-card__label-row">
										<span className={getRoleLabelClass(role)}>{getRoleLabel(role)}</span>
									</div>
								</div>
							</div>
						</li>
					))}
				</ul>
			) : (
				<div className="member-roles-empty">
					No guild roles found for this account.
				</div>
			)}
		</section>
	);
}
