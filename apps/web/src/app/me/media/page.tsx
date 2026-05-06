//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/me/media/page.tsx                                                                   ////
//// Language: TSX                                                                                              ////
//// Member route for owned/manageable media management.                                                        ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import { getAuthSession } from "@/lib/auth/auth";
import { listMemberAuthorableCollections } from "@/lib/data/member-authoring";
import { listMemberMedia } from "@/lib/data/member-media";
import { readDiscordIdFromSession } from "@/lib/server/current-actor";
import LoginClient from "@/components/login/LoginClient";
import MemberMediaDashboard from "@/components/me/MemberMediaDashboard";

export const dynamic = "force-dynamic";

export default async function MyMediaPage() {
	const session = await getAuthSession();
	const actorDiscordId = readDiscordIdFromSession(session);

	if (!session?.user || !actorDiscordId) {
		return (
			<main className="card member-page-card">
				<h1 className="member-page-title">My media</h1>
				<p>You are not signed in.</p>
				<LoginClient session={null} />
			</main>
		);
	}

	const [rows, collections] = await Promise.all([
		listMemberMedia(actorDiscordId),
		listMemberAuthorableCollections(actorDiscordId),
	]);

	return (
		<MemberMediaDashboard
			initialRows={rows}
			initialCollections={collections}
		/>
	);
}
