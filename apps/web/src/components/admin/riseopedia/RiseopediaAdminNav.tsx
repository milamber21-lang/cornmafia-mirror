//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/riseopedia/RiseopediaAdminNav.tsx                                        ////
//// Language: TSX                                                                                               ////
//// Intentionally empty placeholder for Riseopedia admin sub-navigation.                                        ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { JSX } from "react";

export type RiseopediaAdminNavKey =
	| "sections"
	| "section-rules"
	| "display-profiles"
	| "profile-bindings"
	| "profile-properties"
	| "profile-variant-selectors"
	| "overview-card-rules"
	| "overview-card-elements"
	| "patch-channels"
	| "patch-publications"
	| "patch-scope-overrides"
	| "release-decisions"
	| "release-evidence"
	| "release-overrides"
	| "relationship-display-rules";

export interface RiseopediaAdminNavProps {
	active: RiseopediaAdminNavKey;
}

export default function RiseopediaAdminNav({
	active: _active,
}: RiseopediaAdminNavProps): JSX.Element {
	return <></>;
}
