//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/Menu.tsx                                                                        ////
//// Language: TSX                                                                                                ////
//// DB-first public menu loader with the original CSS-compatible menu wrapper                                     ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import MenuClient from "./MenuClient";

import {
	getPublicNavigationMenuModel,
	type PublicMenuModel,
} from "@/lib/data/public-navigation";
import { getCurrentActorDiscordId } from "@/lib/server/current-actor";

export type MenuModel = PublicMenuModel;

export default async function Menu() {
	const actorDiscordId = await getCurrentActorDiscordId();
	const model = await getPublicNavigationMenuModel({
		actorDiscordId,
		panelSlotCode: "header_main",
	});

	return (
		<div className="menu">
			<div className="container menu-inner">
				<MenuClient model={model} />
			</div>
		</div>
	);
}
