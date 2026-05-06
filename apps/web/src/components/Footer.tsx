//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/Footer.tsx                                                                     ////
//// Language: TSX                                                                                                ////
//// Footer shell with static legal links and optional DB-driven Explore navigation.                               ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import Link from "next/link";

import FooterExploreMenu from "./FooterExploreMenu";

import { getPublicNavigationMenuModel } from "@/lib/data/public-navigation";
import { getCurrentActorDiscordId } from "@/lib/server/current-actor";

export default async function Footer() {
	const actorDiscordId = await getCurrentActorDiscordId();
	const footerModel = await getPublicNavigationMenuModel({
		actorDiscordId,
		panelSlotCode: "footer_main",
	});

	return (
		<div className="footer-shell">
			<div className="footer-brand" aria-label="Corn Mafia Guild copyright">
				<span>Corn Mafia Guild</span>
				<span aria-hidden="true">&copy;</span>
				<span>{new Date().getFullYear()}</span>
			</div>

			<FooterExploreMenu model={footerModel} />

			<nav className="footer-legal" aria-label="Legal links">
				<Link href="/privacy">Privacy</Link>
				<span aria-hidden="true">/</span>
				<Link href="/terms">Terms</Link>
			</nav>
		</div>
	);
}