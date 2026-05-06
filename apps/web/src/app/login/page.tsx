//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/login/page.tsx                                                                        ////
//// Language: TSX                                                                                                ////
//// Login page entry that renders the session-aware login client                                                 ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import { getAuthSession } from "@/lib/auth/auth";
import LoginClient from "./LoginClient";

// don't pre-render at build (needs live session)
export const dynamic = "force-dynamic";

export default async function Page() {
	const session = await getAuthSession();
	return <LoginClient session={session} />;
}
