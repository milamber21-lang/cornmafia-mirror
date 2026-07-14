//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/riseopedia/RiseopediaAdminTypes.ts                                      ////
//// Language: TS                                                                                                ////
//// Shared strict types for rebuilt Riseopedia admin table and panel components.                                ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

export type RiseopediaAdminRow = {
	[key: string]: unknown;
};

export type RiseopediaAdminRows = RiseopediaAdminRow[];

export type RiseopediaAdminMeta = {
	entityTypes?: RiseopediaAdminRows;
	entityClasses?: RiseopediaAdminRows;
	entityCategories?: RiseopediaAdminRows;
	entitySubcategories?: RiseopediaAdminRows;
	entityOptions?: RiseopediaAdminRows;
	propertyOptions?: RiseopediaAdminRows;
	renderingChannels?: RiseopediaAdminRows;
	bodyRenderers?: RiseopediaAdminRows;
	bodyBlockRenderers?: RiseopediaAdminRows;
	bodyBlockDataSources?: RiseopediaAdminRows;
	bodyBlockEmptyBehaviors?: RiseopediaAdminRows;
	variantGroups?: RiseopediaAdminRows;
	variantGroupScopes?: RiseopediaAdminRows;
	patchOptions?: RiseopediaAdminRows;
	releaseStates?: RiseopediaAdminRows;
	visibilityStates?: RiseopediaAdminRows;
	displaySlots?: RiseopediaAdminRows;
	displayElementSourceTypes?: RiseopediaAdminRows;
	builtinDisplayFields?: RiseopediaAdminRows;
	displayElementSourceOptions?: RiseopediaAdminRows;
	overviewCardPlacements?: RiseopediaAdminRows;
	overviewCardModes?: RiseopediaAdminRows;
	overviewCardDisplaySlots?: RiseopediaAdminRows;
	sections?: RiseopediaAdminRows;
	sectionClassificationRules?: RiseopediaAdminRows;
	relationshipTypes?: RiseopediaAdminRows;
	relationshipDisplayBlocks?: RiseopediaAdminRows;
	relationshipDisplayPerspectives?: RiseopediaAdminRows;
};

export type RiseopediaAdminOption = {
	value: string;
	label: string;
};

export type RiseopediaAdminFilterState = {
	[key: string]: string;
};

export type RiseopediaAdminButtonVariant =
	| "primary"
	| "secondary"
	| "quiet"
	| "danger"
	| "success";

export type RiseopediaAdminFieldType =
	| "text"
	| "textarea"
	| "checkbox"
	| "select"
	| "number";

export type RiseopediaAdminFieldValues = { [key: string]: unknown };

export type RiseopediaAdminFieldOptionBuilder = (
	values: RiseopediaAdminFieldValues,
) => RiseopediaAdminOption[];

export type RiseopediaAdminFieldPredicate = (
	values: RiseopediaAdminFieldValues,
) => boolean;

export type RiseopediaAdminFieldChangeHandler = (args: {
	value: string;
	values: RiseopediaAdminFieldValues;
	setValue: (name: string, value: unknown) => void;
}) => void;

export type RiseopediaAdminFieldConfig = {
	valueKey: string;
	rowKey: string;
	readValue?: (row: RiseopediaAdminRow) => unknown;
	label: string;
	type: RiseopediaAdminFieldType;
	required?: boolean;
	defaultValue?: unknown;
	helpText?: string;
	options?: RiseopediaAdminOption[] | RiseopediaAdminFieldOptionBuilder;
	textareaRows?: number;
	readOnlyOnEdit?: boolean;
	hidden?: boolean;
	visible?: RiseopediaAdminFieldPredicate;
	isDisabled?: RiseopediaAdminFieldPredicate;
	span?: 6 | 12;
	onChange?: RiseopediaAdminFieldChangeHandler;
};

export type RiseopediaAdminColumnKind =
	| "text"
	| "boolean"
	| "count"
	| "status"
	| "patchChannel";

export type RiseopediaAdminColumnWidth =
	| "narrow"
	| "compact"
	| "normal"
	| "wide"
	| "fluid";

export type RiseopediaAdminColumnConfig = {
	rowKey: string;
	label: string;
	kind?: RiseopediaAdminColumnKind;
	actionOp?: string;
	width?: RiseopediaAdminColumnWidth;
	wrap?: boolean;
	searchable?: boolean;
	sortable?: boolean;
	strong?: boolean;
};

export type RiseopediaAdminFilterConfig = {
	key: string;
	rowKey: string;
	label: string;
	options?: RiseopediaAdminOption[];
	optionsBuilder?: (
		filterState: RiseopediaAdminFilterState,
	) => RiseopediaAdminOption[];
	clearLabel: string;
	placeholder?: string;
	clearKeysOnChange?: string[];
};

export type RiseopediaAdminRowActionConfig = {
	label: string;
	href: (row: RiseopediaAdminRow) => string;
	variant?: RiseopediaAdminButtonVariant;
};

export type RiseopediaAdminPanelMode = "create" | "edit";

export type RiseopediaAdminFieldsBuilder = (args: {
	mode: RiseopediaAdminPanelMode;
	row: RiseopediaAdminRow | null;
	rows: RiseopediaAdminRow[];
}) => RiseopediaAdminFieldConfig[];

export type RiseopediaAdminReadOnlyActionContext = {
	search: string;
	filterState: RiseopediaAdminFilterState;
};

export type RiseopediaAdminReadOnlyRowActionConfig = {
	label: string | ((row: RiseopediaAdminRow) => string);
	columnLabel?: string;
	variant?:
		| RiseopediaAdminButtonVariant
		| ((row: RiseopediaAdminRow) => RiseopediaAdminButtonVariant);
	ariaLabel?: (row: RiseopediaAdminRow) => string;
	href?: (
		row: RiseopediaAdminRow,
		context: RiseopediaAdminReadOnlyActionContext,
	) => string;
	onClick?: (row: RiseopediaAdminRow) => Promise<void>;
	isVisible?: (row: RiseopediaAdminRow) => boolean;
};

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
