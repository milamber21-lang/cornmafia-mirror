//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/detail/blocks/shared/RiseopediaBodyBlockShell.tsx                                    ////
//// Language: TSX                                                                                             ////
//// Supplies the shared semantic shell for every configured Riseopedia-family detail body block.              ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX, ReactNode } from "react";

import type { RiseopediaBodyBlock } from "@/lib/data/riseopedia-entity-detail";
import type {
	RiseopediaBodyBlockFamily,
	RiseopediaBodyBlockVariant,
} from "@/components/riseopedia/detail/blocks/riseopedia-body-block-registry";

export type RiseopediaBodyBlockShellProps = {
	block: RiseopediaBodyBlock;
	family: RiseopediaBodyBlockFamily;
	variant: RiseopediaBodyBlockVariant;
	children: ReactNode;
	showHeading?: boolean;
};

function headingId(block: RiseopediaBodyBlock): string {
	return `riseopedia-body-block-${block.displayProfileBodyBlockId}`;
}

export default function RiseopediaBodyBlockShell({
	block,
	family,
	variant,
	children,
	showHeading = true,
}: RiseopediaBodyBlockShellProps): JSX.Element {
	const labelId = showHeading ? headingId(block) : undefined;

	return (
		<section
			className="riseopedia-body-block"
			data-body-block-code={block.bodyBlockCode}
			data-body-block-family={family}
			data-body-block-renderer={block.bodyBlockRendererCode}
			data-body-block-variant={variant}
			data-visual-family={family}
			data-visual-variant={variant}
			aria-label={showHeading ? undefined : block.bodyBlockLabel}
			aria-labelledby={labelId}
		>
			{showHeading ? (
				<header className="riseopedia-body-block__header">
					<h2 className="riseopedia-body-block__title" id={labelId}>
						{block.bodyBlockLabel}
					</h2>
				</header>
			) : null}
			<div className="riseopedia-body-block__content">{children}</div>
		</section>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
