//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/data/discord-roles.ts                                                                 ////
//// Language: TS                                                                                                 ////
//// DB-first Discord role lookup helpers for access-aware admin taxonomy forms                                  ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import "server-only";

import { query } from "@/lib/data/pg";

export type DiscordRoleOption = {
	id: string;
	name: string;
	rank: number;
	isPublicDefault: boolean;
	isAuthenticatedDefault: boolean;
};

type DiscordRoleDbRow = {
	id: number | string;
	name: string;
	rank: number;
	is_public_default: boolean;
	is_authenticated_default: boolean;
};

export async function listDiscordRoleOptions(): Promise<DiscordRoleOption[]> {
	const result = await query<DiscordRoleDbRow>(
		`
      SELECT
        id,
        name,
        rank,
        is_public_default,
        is_authenticated_default
      FROM web_view.discord_roles
      WHERE is_access_role = true
      ORDER BY rank ASC, name ASC, id ASC
    `,
	);

	return result.rows.map((row) => ({
		id: String(row.id),
		name: row.name,
		rank: row.rank,
		isPublicDefault: row.is_public_default,
		isAuthenticatedDefault: row.is_authenticated_default,
	}));
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
