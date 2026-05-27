//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/RiseopediaEmptyState.tsx                                         ////
//// Language: TSX                                                                                            ////
//// Small reusable empty-state surface for public Riseopedia detail blocks.                                   ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { JSX } from "react";

export type RiseopediaEmptyStateProps = {
	title: string;
	message?: string;
};

export default function RiseopediaEmptyState({
	title,
	message,
}: RiseopediaEmptyStateProps): JSX.Element {
	return (
		<div className="riseopedia-empty-state">
			<p className="riseopedia-empty-state__title">{title}</p>
			{message ? (
				<p className="riseopedia-empty-state__message">{message}</p>
			) : null}
		</div>
	);
}
