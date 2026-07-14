//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/me/roles/route.ts                                                              ////
//// Language: TS                                                                                               ////
//// Returns DB-resolved role labels and access summary for the signed-in member profile surface.                ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { NextResponse } from "next/server";

import type { DiscordRoleDoc } from "@/lib/access/roles-index";
import {
	resolveAccessForUser,
	type ResolvedAccess,
} from "@/lib/access/resolve";
import { getAuthSession, verifyDiscordRolesIfDue } from "@/lib/auth/auth";

export const dynamic = "force-dynamic";

type SessionUserShape = {
	id?: string | null;
	discordId?: string | null;
};

type RoleResponse = {
	id: string;
	name: string;
	source: "discord" | "virtual";
	roleId: string | null;
	colorHex: string | null;
	rank: number;
	isPublicDefault: boolean;
	isAuthenticatedDefault: boolean;
	isAdmin: boolean;
	isEditor: boolean;
};

type RolesOkResponse = {
	ok: true;
	roles: RoleResponse[];
	roleIds: string[];
	rank: number;
	isAuthenticated: boolean;
	isMember: boolean;
	isRoleRefreshDue: boolean;
};

function toRoleResponse(role: DiscordRoleDoc): RoleResponse {
	return {
		id: role.id,
		name: role.name,
		source: role.source,
		roleId: role.roleId,
		colorHex: role.colorHex,
		rank: role.rank,
		isPublicDefault: role.isPublicDefault,
		isAuthenticatedDefault: role.isAuthenticatedDefault,
		isAdmin: role.isAdmin,
		isEditor: role.isEditor,
	};
}

async function resolveFreshAccess(
	user: SessionUserShape,
): Promise<ResolvedAccess> {
	let access = await resolveAccessForUser(user.discordId);

	if (access.isRoleRefreshDue && user.id && user.discordId) {
		const refreshed = await verifyDiscordRolesIfDue({
			authUserId: user.id,
			discordUserId: user.discordId,
		});

		if (refreshed) {
			access = await resolveAccessForUser(user.discordId);
		}
	}

	return access;
}

function buildRolesOkResponse(access: ResolvedAccess): RolesOkResponse {
	return {
		ok: true,
		roles: access.matchedRoles.map(toRoleResponse),
		roleIds: access.roleIds,
		rank: access.effectiveRank,
		isAuthenticated: access.isAuthenticated,
		isMember: access.isMember,
		isRoleRefreshDue: access.isRoleRefreshDue,
	};
}

export async function GET(): Promise<NextResponse> {
	try {
		const session = await getAuthSession();
		const user = (session?.user ?? null) as SessionUserShape | null;

		if (!user?.discordId) {
			return NextResponse.json(
				{ ok: false, error: "Not signed in" },
				{ status: 401 },
			);
		}

		const access = await resolveFreshAccess(user);

		return NextResponse.json(buildRolesOkResponse(access));
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : String(error);

		return NextResponse.json({ ok: false, error: message }, { status: 500 });
	}
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
