//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/helpers/content-system-fields.ts                                                     ////
//// Language: TS                                                                                                 ////
//// Resolves read-only canonical content metadata exposed through configured template fields.                   ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

export type ContentSystemFieldDoc = {
	authorUsername: string | null;
	publishedAt: string | null;
	updatedAt: string | null;
	seriesTitle: string | null;
	seriesPartNo: number | null;
};

export const CONTENT_SYSTEM_FIELD_LIST_CODES = [
	"system_author_username",
	"system_published_at",
	"system_updated_at",
	"system_series_title",
	"system_series_part_no",
] as const;

export type ContentSystemFieldListCode =
	(typeof CONTENT_SYSTEM_FIELD_LIST_CODES)[number];

export function isContentSystemFieldListCode(
	fieldListCode: string,
): fieldListCode is ContentSystemFieldListCode {
	return CONTENT_SYSTEM_FIELD_LIST_CODES.includes(
		fieldListCode as ContentSystemFieldListCode,
	);
}

export function resolveContentSystemFieldValue(args: {
	fieldListCode: string;
	doc: ContentSystemFieldDoc;
}): string | number | null {
	switch (args.fieldListCode) {
		case "system_author_username":
			return args.doc.authorUsername;
		case "system_published_at":
			return args.doc.publishedAt;
		case "system_updated_at":
			return args.doc.updatedAt;
		case "system_series_title":
			return args.doc.seriesTitle;
		case "system_series_part_no":
			return args.doc.seriesPartNo;
		default:
			return null;
	}
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
