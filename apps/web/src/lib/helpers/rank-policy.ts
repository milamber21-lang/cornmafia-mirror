//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/helpers/rank-policy.ts                                                                 ////
//// Language: TS                                                                                                  ////
//// Shared role-rank policy formatting and selection helpers for admin web panels and tables                     ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

export type PolicyRoleRef = {
	id: string;
	name: string;
	rank: number;
	isPublicDefault?: boolean;
	isAuthenticatedDefault?: boolean;
};

export type PolicyCode = "public" | "rank_at_least" | "rank_equal";
export type InheritablePolicyCode = "inherit" | PolicyCode;

export function findRoleIdByRank(
	roles: PolicyRoleRef[],
	rank: number | null | undefined,
): string {
	if (typeof rank !== "number") {
		return "";
	}

	return roles.find((role) => role.rank === rank)?.id ?? "";
}

export function findRankByRoleId(
	roles: PolicyRoleRef[],
	roleId: string,
): number | null {
	const normalizedRoleId = roleId.trim();
	if (!normalizedRoleId) {
		return null;
	}

	return roles.find((role) => role.id === normalizedRoleId)?.rank ?? null;
}

export function findRoleByRank(
	roles: PolicyRoleRef[],
	rank: number | null | undefined,
): PolicyRoleRef | null {
	if (typeof rank !== "number") {
		return null;
	}

	return roles.find((role) => role.rank === rank) ?? null;
}

export function getPublicDefaultRole(
	roles: PolicyRoleRef[],
): PolicyRoleRef | null {
	return roles.find((role) => role.isPublicDefault === true) ?? null;
}

export function formatPublicDefaultSummary(roles: PolicyRoleRef[]): string {
	const publicRole = getPublicDefaultRole(roles);
	if (!publicRole) {
		return "Public";
	}

	return `${publicRole.name} (${publicRole.rank})`;
}

export function formatRankPolicySummary(
	policy: PolicyCode,
	rank: number | null | undefined,
	roles: PolicyRoleRef[],
): string {
	if (policy === "public") {
		return formatPublicDefaultSummary(roles);
	}

	const normalizedRank = typeof rank === "number" ? rank : 0;
	const matchedRole = findRoleByRank(roles, normalizedRank);
	const label = matchedRole?.name ?? `Rank ${normalizedRank}`;
	return policy === "rank_equal"
		? `${label} (= ${normalizedRank})`
		: `${label} (>= ${normalizedRank})`;
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
