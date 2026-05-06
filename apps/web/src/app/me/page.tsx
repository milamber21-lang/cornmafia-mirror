//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/me/page.tsx                                                                           ////
//// Language: TSX                                                                                                ////
//// Member profile page that renders the signed-in user workspace surface.                                       ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import { getAuthSession } from "@/lib/auth/auth";
import LoginClient from "@/components/login/LoginClient";
import MeTable from "@/components/me/MeTable";

export const dynamic = "force-dynamic";

export default async function MePage() {
	const session = await getAuthSession();

	if (!session?.user) {
		return (
					<section className="card member-page-card">
						<h1 className="member-page-title">Profile</h1>
						<p>You are not signed in.</p>
						<LoginClient session={null} />
					</section>
		);
	}

	const name = session.user.name ?? "User";
	const img = session.user.image ?? null;

	return (
				<section className="card">
					<MeTable name={name} image={img} />
				</section>
	);
}
