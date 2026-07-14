//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/helpers/richtext-link-picker-options.ts                                               ////
//// Language: TS                                                                                                 ////
//// Distinct, parent-aware option normalization for rich-text link picker filter controls.                       ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

export type RichTextLinkPickerFilterOption = {
	value: string;
	label: string;
	parentValue?: string;
};

export function distinctRichTextLinkPickerOptions<
	T extends RichTextLinkPickerFilterOption,
>(options: readonly T[], parentValue: string | null = null): T[] {
	const normalizedParentValue = parentValue?.trim() ?? "";
	const distinctByLabel = new Map<string, T>();

	for (const option of options) {
		if (
			normalizedParentValue.length > 0 &&
			option.parentValue &&
			option.parentValue !== normalizedParentValue
		) {
			continue;
		}

		const normalizedValue = option.value.trim();
		const normalizedLabel = option.label.trim().toLocaleLowerCase();
		if (
			normalizedValue.length === 0 ||
			normalizedLabel.length === 0 ||
			distinctByLabel.has(normalizedLabel)
		) {
			continue;
		}

		distinctByLabel.set(normalizedLabel, option);
	}

	return Array.from(distinctByLabel.values()).sort((left, right) => {
		const labelComparison = left.label.localeCompare(right.label, undefined, {
			sensitivity: "base",
		});
		return labelComparison !== 0
			? labelComparison
			: left.value.localeCompare(right.value);
	});
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
