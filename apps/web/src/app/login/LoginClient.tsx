//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/login/LoginClient.tsx                                                                 ////
//// Language: TSX                                                                                                ////
//// Login page client showing the current user role summary                                                      ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

"use client";

import type { CSSProperties, JSX } from "react";
import { useEffect, useState } from "react";
import type { Session } from "next-auth";

type RoleSource = "discord" | "virtual";

type Role = {
	id: string;
	name: string;
	source: RoleSource;
	roleId?: string | null;
	colorHex?: string | null;
	rank: number;
	isPublicDefault?: boolean;
	isAuthenticatedDefault?: boolean;
};

type RolesOk = {
	ok: true;
	roleIds: string[];
	rank: number;
	roles: Role[];
	defaults?: { public: Role | null; authenticated: Role | null };
};

type RolesErr = {
	ok: false;
	error: string;
};

type RolesResponse = RolesOk | RolesErr;

type LoginClientProps = {
	session: Session | null;
};

export default function LoginClient({
	session,
}: LoginClientProps): JSX.Element {
	const [roles, setRoles] = useState<Role[]>([]);
	const [rank, setRank] = useState<number>(0);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;

		async function loadRoles(): Promise<void> {
			setLoading(true);

			try {
				const response = await fetch("/api/me/roles", { cache: "no-store" });
				const json: RolesResponse = await response.json();

				if (cancelled) {
					return;
				}

				if (json.ok) {
					setRoles(json.roles);
					setRank(json.rank);
					setError(null);
					return;
				}

				setError(json.error || "Failed to load roles.");
			} catch (requestError: unknown) {
				if (!cancelled) {
					setError(
						requestError instanceof Error
							? requestError.message
							: "Failed to load roles.",
					);
				}
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		}

		if (session) {
			void loadRoles();
		}

		return () => {
			cancelled = true;
		};
	}, [session]);

	return (
		<div className="login-role-summary">
			<section className="login-role-summary__section">
				<h2 className="login-role-summary__title">Your Discord roles</h2>

				{loading ? <p>Loading roles...</p> : null}
				{error ? <p className="login-role-summary__error">Error: {error}</p> : null}

				{!loading && !error ? (
					roles.length > 0 ? (
						<ul className="login-role-summary__list">
							{roles.map((role) => (
								<li
									key={role.id}
									className="login-role-summary__role"
									style={
										role.colorHex
											? ({ "--role-color": role.colorHex } as CSSProperties)
											: undefined
									}
									title={role.roleId ?? ""}
								>
									{role.name}
									<span className="login-role-summary__role-rank">
										· rank {role.rank}
									</span>
								</li>
							))}
						</ul>
					) : (
						<p>No guild roles found. You may only have default access right now.</p>
					)
				) : null}

				<p className="login-role-summary__rank">
					Computed read rank: <strong>{rank}</strong>
				</p>
			</section>
		</div>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
