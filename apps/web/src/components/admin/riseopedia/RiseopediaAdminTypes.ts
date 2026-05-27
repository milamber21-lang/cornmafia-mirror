//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/riseopedia/RiseopediaAdminTypes.ts                                      ////
//// Language: TS                                                                                                ////
//// Shared strict types for Riseopedia admin table and panel components.                                        ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export type RiseopediaAdminRow = {
	[key: string]: unknown;
};

export type RiseopediaAdminRows = RiseopediaAdminRow[];

export type RiseopediaAdminMeta = {
	entityTypes?: RiseopediaAdminRows;
	visibilityStates?: RiseopediaAdminRows;
	sectionModes?: RiseopediaAdminRows;
	ruleKinds?: RiseopediaAdminRows;
	assetClasses?: RiseopediaAdminRows;
	propertyOrigins?: RiseopediaAdminRows;
	displaySlots?: RiseopediaAdminRows;
	profileSelectorKinds?: RiseopediaAdminRows;
	relationshipBlockTypes?: RiseopediaAdminRows;
};

export type RiseopediaAdminOption = {
	value: string;
	label: string;
};

export type RiseopediaAdminFieldType =
	| "text"
	| "textarea"
	| "checkbox"
	| "select"
	| "number";

export type RiseopediaAdminFieldConfig = {
	valueKey: string;
	rowKey: string;
	label: string;
	type: RiseopediaAdminFieldType;
	required?: boolean;
	defaultValue?: unknown;
	helpText?: string;
	options?: RiseopediaAdminOption[];
	textareaRows?: number;
	readOnlyOnEdit?: boolean;
};

export type RiseopediaAdminColumnKind = "text" | "boolean" | "count" | "status";

export type RiseopediaAdminColumnConfig = {
	rowKey: string;
	label: string;
	kind?: RiseopediaAdminColumnKind;
	searchable?: boolean;
	sortable?: boolean;
	strong?: boolean;
};

export type RiseopediaAdminFilterConfig = {
	key: string;
	rowKey: string;
	label: string;
	options: RiseopediaAdminOption[];
	clearLabel: string;
	placeholder?: string;
};
