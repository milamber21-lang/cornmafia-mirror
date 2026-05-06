//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/types/next-auth.d.ts                                                                   ////
//// Language: TS                                                                                               ////
//// NextAuth session type augmentation with Discord identity fields.                                           ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import "next-auth";

declare module "next-auth" {
	interface Session {
		user?: {
			id?: string;
			name?: string | null;
			email?: string | null;
			image?: string | null;
			discordId?: string | null;
		};
	}
}
