//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/web/navigation-designer/navigation-designer-types.ts                     ////
//// Language: TS                                                                                               ////
//// Shared type definitions for the admin navigation panel designer.                                            ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type {
	NavigationCategoryLookupItem,
	NavigationContentLookupItem,
	NavigationPanelTree,
	NavigationSubcategoryLookupItem,
	NavigationTreeCategory,
	NavigationTreeSubcategory,
	NavigationTreeTarget,
} from "@/lib/data/navigation";

export type DesignerTreeTarget = NavigationTreeTarget & {
	editorId: string;
};

export type DesignerTreeSubcategory = Omit<
	NavigationTreeSubcategory,
	"content"
> & {
	editorId: string;
	content: DesignerTreeTarget[];
};

export type DesignerTreeCategory = Omit<
	NavigationTreeCategory,
	"subcategories"
> & {
	editorId: string;
	subcategories: DesignerTreeSubcategory[];
};

export type DesignerPanelTree = Omit<NavigationPanelTree, "items"> & {
	items: DesignerTreeCategory[];
};

export type DesignerApiResponse = {
	doc?: NavigationPanelTree;
	categories?: NavigationCategoryLookupItem[];
	subcategories?: NavigationSubcategoryLookupItem[];
	content?: NavigationContentLookupItem[];
};

export type DragData =
	| { type: "category"; categoryEditorId: string }
	| {
			type: "subcategory";
			categoryEditorId: string;
			subcategoryEditorId: string;
	  }
	| {
			type: "content";
			categoryEditorId: string;
			subcategoryEditorId: string;
			contentEditorId: string;
	  };

export type ModalMode =
	| { type: "category" }
	| { type: "subcategory"; categoryEditorId: string }
	| {
			type: "content";
			categoryEditorId: string;
			subcategoryEditorId: string;
	  };

export type DragPreview = {
	label: string;
	iconKey: NavigationCategoryLookupItem["iconKey"];
	iconColor: NavigationCategoryLookupItem["iconColor"];
	fallbackLucideName: "Folder" | "FolderOpen" | "FileText";
};

export type NavigationDesignerValidationIssue = {
	key: string;
	message: string;
};

export type NavigationDesignerValidationResult = {
	valid: boolean;
	issues: NavigationDesignerValidationIssue[];
};

export interface NavigationPanelDesignerProps {
	initialDoc: NavigationPanelTree;
	initialCategories: NavigationCategoryLookupItem[];
	initialSubcategories: NavigationSubcategoryLookupItem[];
	initialContent: NavigationContentLookupItem[];
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
