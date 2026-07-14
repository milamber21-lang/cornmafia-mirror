//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/context/RiseopediaVariantLinkContext.tsx                                  ////
//// Language: TSX                                                                                              ////
//// Shares channel-validated variant keys with detail renderers for readable variant entity URLs.               ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

"use client";

import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	type JSX,
	type ReactNode,
} from "react";

export type RiseopediaVariantLinkKey = {
	entityVariantId: string;
	variantKey: string;
};

type RiseopediaVariantLinkContextValue = {
	variantKeyByEntityVariantId: ReadonlyMap<string, string>;
};

const RiseopediaVariantLinkContext =
	createContext<RiseopediaVariantLinkContextValue | null>(null);

export function RiseopediaVariantLinkProvider({
	children,
	variantLinkKeys,
}: {
	children: ReactNode;
	variantLinkKeys: readonly RiseopediaVariantLinkKey[];
}): JSX.Element {
	const value = useMemo<RiseopediaVariantLinkContextValue>(() => {
		const variantKeyByEntityVariantId = new Map<string, string>();

		for (const row of variantLinkKeys) {
			variantKeyByEntityVariantId.set(row.entityVariantId, row.variantKey);
		}

		return {
			variantKeyByEntityVariantId,
		};
	}, [variantLinkKeys]);

	return (
		<RiseopediaVariantLinkContext.Provider value={value}>
			{children}
		</RiseopediaVariantLinkContext.Provider>
	);
}

export function useRiseopediaVariantKeyLookup(): (
	entityVariantId: string | null | undefined,
) => string | null {
	const context = useContext(RiseopediaVariantLinkContext);

	return useCallback(
		(entityVariantId: string | null | undefined): string | null => {
			if (!entityVariantId || !context) {
				return null;
			}

			return context.variantKeyByEntityVariantId.get(entityVariantId) ?? null;
		},
		[context],
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
