//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/riseopedia/RiseopediaAdminConfigHelpers.ts                               ////
//// Language: TS                                                                                                ////
//// Shared pure helper builders for Riseopedia admin table fields, filters, links, and option lists.            ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { readResponseMessage } from "@/lib/helpers/http-response";

import {
	buildOptionsFromRows,
	readRowValue,
	toDisplayText,
} from "./RiseopediaAdminHelpers";

export { buildOptionsFromRows };
import type { RiseopediaAdminReadOnlyActionContext } from "./RiseopediaAdminTypes";
import type {
	RiseopediaAdminFieldConfig,
	RiseopediaAdminFilterConfig,
	RiseopediaAdminMeta,
	RiseopediaAdminOption,
	RiseopediaAdminRow,
	RiseopediaAdminRows,
} from "./RiseopediaAdminTypes";

export const BOOLEAN_ACTIVE_FIELD: RiseopediaAdminFieldConfig = {
	valueKey: "active",
	rowKey: "active_flag",
	label: "Active",
	type: "checkbox",
	defaultValue: true,
};

export const VISIBLE_FIELD: RiseopediaAdminFieldConfig = {
	valueKey: "visible",
	rowKey: "visible_flag",
	label: "Visible",
	type: "checkbox",
	defaultValue: true,
};

export const COMPACT_FIELD: RiseopediaAdminFieldConfig = {
	valueKey: "compact",
	rowKey: "compact_flag",
	label: "Compact",
	type: "checkbox",
	defaultValue: false,
};

export const ADMIN_NOTE_FIELD: RiseopediaAdminFieldConfig = {
	valueKey: "adminNote",
	rowKey: "admin_note",
	label: "Admin note",
	type: "textarea",
	textareaRows: 3,
	span: 12,
};

export function optionRows(rows: RiseopediaAdminRows | undefined): RiseopediaAdminRows {
	return rows ?? [];
}

export function idText(value: unknown): string {
	return toDisplayText(value).trim();
}

export function buildProfileOptions(displayProfiles: RiseopediaAdminRows): RiseopediaAdminOption[] {
	return displayProfiles.map((row) => {
		const value = idText(readRowValue(row, "display_profile_id"));
		const code = idText(readRowValue(row, "display_profile_code"));
		const name = idText(readRowValue(row, "display_profile_name"));
		return {
			value,
			label: [name || code || value, code ? `(${code})` : ""].filter(Boolean).join(" "),
		};
	}).filter((option) => option.value.length > 0).sort((left, right) => left.label.localeCompare(right.label));
}

export function buildScopedProfileOptions(
	displayProfiles: RiseopediaAdminRows,
	displayProfile: RiseopediaAdminRow | null | undefined,
): RiseopediaAdminOption[] {
	return buildProfileOptions(displayProfile ? [displayProfile] : displayProfiles);
}

export function buildSectionOptions(sections: RiseopediaAdminRows): RiseopediaAdminOption[] {
	return sections.map((row) => {
		const value = idText(readRowValue(row, "section_id"));
		const code = idText(readRowValue(row, "section_code"));
		const name = idText(readRowValue(row, "section_name"));
		return {
			value,
			label: [name || code || value, code ? `(${code})` : ""].filter(Boolean).join(" "),
		};
	}).filter((option) => option.value.length > 0).sort((left, right) => left.label.localeCompare(right.label));
}

export function buildRuleSetOptions(ruleSets: RiseopediaAdminRows): RiseopediaAdminOption[] {
	return ruleSets.map((row) => {
		const value = idText(readRowValue(row, "overview_card_rule_set_id"));
		const label = idText(readRowValue(row, "rule_set_label")) || idText(readRowValue(row, "rule_set_name"));
		const channel = idText(readRowValue(row, "channel_name")) || idText(readRowValue(row, "channel_code"));
		const placement = idText(readRowValue(row, "placement_code"));
		const mode = idText(readRowValue(row, "card_mode_code"));
		return {
			value,
			label: [channel, placement, mode, label || value].filter(Boolean).join(" · "),
		};
	}).filter((option) => option.value.length > 0).sort((left, right) => left.label.localeCompare(right.label));
}

export function buildEntityOptions(rows: RiseopediaAdminRows | undefined): RiseopediaAdminOption[] {
	return optionRows(rows).map((row) => {
		const value = idText(readRowValue(row, "entity_id"));
		const name = idText(readRowValue(row, "entity_name"));
		const type = idText(readRowValue(row, "entity_type_code"));
		const category = idText(readRowValue(row, "entity_category_name"));
		return {
			value,
			label: [name || value, type, category].filter(Boolean).join(" · "),
		};
	}).filter((option) => option.value.length > 0).sort((left, right) => left.label.localeCompare(right.label));
}

export function buildRenderingChannelOptions(meta: RiseopediaAdminMeta): RiseopediaAdminOption[] {
	const options = buildOptionsFromRows(optionRows(meta.renderingChannels), "channel_code", "channel_name");
	if (options.length > 0) {
		return options;
	}

	return [{ value: "riseopedia", label: "Riseopedia" }];
}

export function buildOverviewCardSlotOptions(args: {
	rows: RiseopediaAdminRows | undefined;
	ruleSet: RiseopediaAdminRow | null;
	usedRows: RiseopediaAdminRows;
	currentRow: RiseopediaAdminRow | null;
	ownerValue: unknown;
}): RiseopediaAdminOption[] {
	const cardModeCode = args.ruleSet ? idText(readRowValue(args.ruleSet, "card_mode_code")) : "full";
	const ruleSetId = idText(args.ownerValue)
		|| (args.ruleSet ? idText(readRowValue(args.ruleSet, "overview_card_rule_set_id")) : "");
	const currentSlotCode = args.currentRow ? idText(readRowValue(args.currentRow, "display_slot_code")) : "";
	const usedSlotCodes = new Set<string>();

	for (const row of args.usedRows) {
		if (ruleSetId && idText(readRowValue(row, "overview_card_rule_set_id")) !== ruleSetId) {
			continue;
		}

		const slotCode = idText(readRowValue(row, "display_slot_code"));
		if (slotCode && slotCode !== currentSlotCode) {
			usedSlotCodes.add(slotCode);
		}
	}

	const allowedSlotCodes = cardModeCode === "compact"
		? new Set(["compact_property"])
		: new Set(["body_1", "body_2", "body_3", "body_4", "body_5", "body_6", "body_7", "body_8", "body_9", "footer_1", "footer_2"]);

	return buildOptionsFromRows(
		optionRows(args.rows).filter((row) => {
			const slotCode = idText(readRowValue(row, "display_slot_code"));
			return allowedSlotCodes.has(slotCode) && !usedSlotCodes.has(slotCode);
		}),
		"display_slot_code",
		"display_slot_name",
	);
}

export function buildPatchOptions(rows: RiseopediaAdminRows | undefined): RiseopediaAdminOption[] {
	return optionRows(rows).map((row) => {
		const value = idText(readRowValue(row, "patch_id"));
		const label = idText(readRowValue(row, "patch_label")) || idText(readRowValue(row, "patch_code"));
		return { value, label: label || value };
	}).filter((option) => option.value.length > 0);
}

export function parseOptionalPositiveInt(value: unknown): number | null {
	const text = idText(value);
	if (!/^\d+$/.test(text)) {
		return null;
	}

	const parsed = Number.parseInt(text, 10);
	return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function createReleaseOverrideFromEvidence(
	row: RiseopediaAdminRow,
	overrideStateCode: "manual_live" | "manual_hidden",
): Promise<void> {
	const entityTypeCode = idText(readRowValue(row, "entity_type_code"));
	const entityId = parseOptionalPositiveInt(readRowValue(row, "entity_id"));
	const activeOverrideId = parseOptionalPositiveInt(readRowValue(row, "active_override_id"));
	if (!entityTypeCode || !entityId) {
		throw new Error("Release decision row is missing entity identity.");
	}

	const response = await fetch("/api/admin/riseopedia/release-overrides", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			op: "upsert",
			id: activeOverrideId ?? undefined,
			data: {
				entityTypeCode,
				entityId,
				patchId: parseOptionalPositiveInt(readRowValue(row, "patch_id")),
				overrideStateCode,
				overrideReasonCode: overrideStateCode === "manual_live" ? "admin_show" : "admin_hide",
				overrideNote: activeOverrideId
					? "Updated from Riseopedia release admin table."
					: "Created from Riseopedia release admin table.",
				active: true,
			},
		}),
	});

	if (!response.ok) {
		throw new Error(await readResponseMessage(response, "Failed to save release override."));
	}
}


export function textListContainsValue(rawValue: unknown, value: string): boolean {
	if (!value) {
		return false;
	}

	if (Array.isArray(rawValue)) {
		return rawValue.some((item) => idText(item) === value);
	}

	return idText(rawValue)
		.split(",")
		.map((part) => part.trim())
		.filter(Boolean)
		.includes(value);
}

export function propertyRowMatchesClassScope(propertyRow: RiseopediaAdminRow, classId: string): boolean {
	if (!classId) {
		return true;
	}

	const scopedClassIds = readRowValue(propertyRow, "class_scope_ids_text") ?? readRowValue(propertyRow, "entity_class_ids_text");
	if (idText(scopedClassIds)) {
		return textListContainsValue(scopedClassIds, classId);
	}

	const propertyClassId = idText(readRowValue(propertyRow, "entity_class_id"));
	return !propertyClassId || propertyClassId === classId;
}

export function filterProfilePropertyRows(args: {
	propertyRows: RiseopediaAdminRows | undefined;
	displayProfiles: RiseopediaAdminRows;
	bindings: RiseopediaAdminRows | undefined;
	displayProfileId: unknown;
}): RiseopediaAdminRows {
	const profileId = idText(args.displayProfileId);
	if (!profileId) {
		return optionRows(args.propertyRows);
	}

	const profile = args.displayProfiles.find((row) => idText(readRowValue(row, "display_profile_id")) === profileId);
	const profileEntityType = profile ? idText(readRowValue(profile, "entity_type_code")) : "";
	const profileBindings = optionRows(args.bindings).filter((row) => idText(readRowValue(row, "display_profile_id")) === profileId);

	return optionRows(args.propertyRows).filter((propertyRow) => {
		const propertyEntityType = idText(readRowValue(propertyRow, "entity_type_code"));

		if (profileBindings.length === 0) {
			return !profileEntityType || propertyEntityType === profileEntityType;
		}

		return profileBindings.some((binding) => {
			const bindingEntityType = idText(readRowValue(binding, "entity_type_code"));
			const bindingClassId = idText(readRowValue(binding, "entity_class_id"));

			if (bindingEntityType && propertyEntityType !== bindingEntityType) {
				return false;
			}

			return !bindingClassId || propertyRowMatchesClassScope(propertyRow, bindingClassId);
		});
	});
}
export function humanizeCodeLabel(value: string): string {
	return value
		.split("_")
		.map((part) => part ? part[0]?.toUpperCase() + part.slice(1) : "")
		.filter(Boolean)
		.join(" ");
}

export function stripPropertyClassPrefix(label: string, row: RiseopediaAdminRow): string {
	const className = idText(readRowValue(row, "entity_class_name"));
	if (!className) {
		return label;
	}

	const normalizedLabel = label.toLocaleLowerCase();
	const normalizedClass = className.toLocaleLowerCase();
	if (!normalizedLabel.startsWith(`${normalizedClass} `)) {
		return label;
	}

	return label.slice(className.length).trim();
}

export function buildPropertyOptionLabel(row: RiseopediaAdminRow): string {
	const propertyCode = idText(readRowValue(row, "property_code"));
	const value = propertyCode || idText(readRowValue(row, "entity_property_id"));
	const rawName = idText(readRowValue(row, "property_label"))
		|| idText(readRowValue(row, "source_label"))
		|| idText(readRowValue(row, "property_name"))
		|| idText(readRowValue(row, "source_name"))
		|| humanizeCodeLabel(propertyCode);
	const label = rawName ? stripPropertyClassPrefix(rawName, row) : "";

	return label || value;
}

export function buildPropertyDedupeKey(row: RiseopediaAdminRow): string {
	return idText(readRowValue(row, "property_code")) || idText(readRowValue(row, "property_label")) || idText(readRowValue(row, "entity_property_id"));
}

export function buildPropertyOptions(args: {
	rows: RiseopediaAdminRows | undefined;
	usedRows: RiseopediaAdminRows;
	currentRow: RiseopediaAdminRow | null;
	ownerKey: string;
	ownerValue: unknown;
	usedKey: string;
}): RiseopediaAdminOption[] {
	const ownerValue = idText(args.ownerValue);
	const currentUsedValue = args.currentRow ? idText(readRowValue(args.currentRow, args.usedKey)) : "";
	const currentUsedDedupeKey = args.currentRow ? buildPropertyDedupeKey(args.currentRow) : "";
	const usedIds = new Set<string>();
	const usedKeys = new Set<string>();

	for (const row of args.usedRows) {
		if (idText(readRowValue(row, args.ownerKey)) !== ownerValue) {
			continue;
		}

		const usedValue = idText(readRowValue(row, args.usedKey));
		if (usedValue && usedValue !== currentUsedValue) {
			usedIds.add(usedValue);
		}

		const usedKey = buildPropertyDedupeKey(row);
		if (usedKey && usedKey !== currentUsedDedupeKey) {
			usedKeys.add(usedKey);
		}
	}

	const options = new Map<string, RiseopediaAdminOption>();
	for (const row of optionRows(args.rows)) {
		const value = idText(readRowValue(row, "property_code")) || idText(readRowValue(row, "entity_property_id"));
		const dedupeKey = buildPropertyDedupeKey(row);
		if (!value || usedIds.has(value) || usedKeys.has(dedupeKey) || options.has(dedupeKey)) {
			continue;
		}

		options.set(dedupeKey, {
			value,
			label: buildPropertyOptionLabel(row),
		});
	}

	return Array.from(options.values())
		.sort((left, right) => left.label.localeCompare(right.label));
}

export function isPropertySourceType(value: unknown): boolean {
	const sourceType = idText(value);
	return sourceType.length === 0 || sourceType === "property";
}

export function isBuiltinSourceType(value: unknown): boolean {
	return idText(value) === "builtin";
}

export function buildSourceTypeOptions(meta: RiseopediaAdminMeta): RiseopediaAdminOption[] {
	const options = buildOptionsFromRows(optionRows(meta.displayElementSourceTypes), "source_type_code", "source_type_name");
	if (options.length > 0) {
		return options;
	}

	return [
		{ value: "property", label: "Canonical property" },
		{ value: "builtin", label: "Builtin field" },
	];
}

export function buildBuiltinFieldLabel(row: RiseopediaAdminRow): string {
	const value = idText(readRowValue(row, "builtin_field_code"));
	const label = idText(readRowValue(row, "builtin_field_label")) || idText(readRowValue(row, "builtin_field_name"));
	return label || value;
}

export function buildBuiltinFieldOptions(args: {
	rows: RiseopediaAdminRows | undefined;
	usedRows: RiseopediaAdminRows;
	currentRow: RiseopediaAdminRow | null;
	ownerKey: string;
	ownerValue: unknown;
}): RiseopediaAdminOption[] {
	const ownerValue = idText(args.ownerValue);
	const currentUsedValue = args.currentRow ? idText(readRowValue(args.currentRow, "builtin_field_code")) : "";
	const usedCodes = new Set<string>();

	for (const row of args.usedRows) {
		if (idText(readRowValue(row, args.ownerKey)) !== ownerValue) {
			continue;
		}

		if (idText(readRowValue(row, "source_type_code")) !== "builtin") {
			continue;
		}

		const usedValue = idText(readRowValue(row, "builtin_field_code"));
		if (usedValue && usedValue !== currentUsedValue) {
			usedCodes.add(usedValue);
		}
	}

	return optionRows(args.rows)
		.map((row) => {
			const value = idText(readRowValue(row, "builtin_field_code"));
			return value && !usedCodes.has(value)
				? { value, label: buildBuiltinFieldLabel(row) }
				: null;
		})
		.filter((option): option is RiseopediaAdminOption => option !== null)
		.sort((left, right) => left.label.localeCompare(right.label));
}

export function displaySourceTypeField(meta: RiseopediaAdminMeta): RiseopediaAdminFieldConfig {
	return {
		valueKey: "sourceTypeCode",
		rowKey: "source_type_code",
		label: "Source type",
		type: "select",
		required: true,
		defaultValue: "property",
		options: buildSourceTypeOptions(meta),
		onChange: ({ value, setValue }) => {
			setValue("sourceValue", "");
			if (value === "property") {
				setValue("builtinFieldCode", "");
			}
			if (value === "builtin") {
				setValue("propertyCode", "");
			}
		},
	};
}


export function rowSortOrder(row: RiseopediaAdminRow): number {
	const rawValue = readRowValue(row, "sort_order");
	if (typeof rawValue === "number" && Number.isFinite(rawValue)) {
		return rawValue;
	}

	const parsed = Number(idText(rawValue));
	return Number.isFinite(parsed) ? parsed : 1000;
}

export function normalizedOptionKey(value: string): string {
	return value.trim().replace(/\s+/g, " ").toLowerCase();
}

interface RiseopediaSortedOption extends RiseopediaAdminOption {
	dedupeKey: string;
	sortOrder: number;
}

export function sortedDedupedOptions(options: RiseopediaSortedOption[]): RiseopediaAdminOption[] {
	const deduped = new Map<string, RiseopediaSortedOption>();

	for (const option of options) {
		if (!option.value || !option.dedupeKey) {
			continue;
		}

		const existing = deduped.get(option.dedupeKey);
		if (!existing || option.sortOrder < existing.sortOrder || (option.sortOrder === existing.sortOrder && option.label.localeCompare(existing.label) < 0)) {
			deduped.set(option.dedupeKey, option);
		}
	}

	return Array.from(deduped.values())
		.sort((left, right) => left.sortOrder - right.sortOrder || left.label.localeCompare(right.label))
		.map(({ value, label }) => ({ value, label }));
}

export function categoryOptionLabel(row: RiseopediaAdminRow): string {
	return idText(readRowValue(row, "entity_category_name")) || idText(readRowValue(row, "entity_category_code"));
}

export function categoryOptionKey(row: RiseopediaAdminRow): string {
	return normalizedOptionKey(categoryOptionLabel(row) || idText(readRowValue(row, "entity_category_code")) || idText(readRowValue(row, "entity_category_id")));
}

export function subcategoryOptionLabel(row: RiseopediaAdminRow, categorySelected: boolean): string {
	const subcategoryLabel = idText(readRowValue(row, "entity_subcategory_name")) || idText(readRowValue(row, "entity_subcategory_code"));
	if (categorySelected) {
		return subcategoryLabel;
	}

	const categoryLabel = categoryOptionLabel(row);
	return [categoryLabel, subcategoryLabel].filter(Boolean).join(" · ") || subcategoryLabel;
}

export function subcategoryOptionKey(row: RiseopediaAdminRow, categorySelected: boolean): string {
	const subcategoryLabel = idText(readRowValue(row, "entity_subcategory_name")) || idText(readRowValue(row, "entity_subcategory_code")) || idText(readRowValue(row, "entity_subcategory_id"));
	if (categorySelected) {
		return normalizedOptionKey(subcategoryLabel);
	}

	const categoryLabel = categoryOptionLabel(row) || idText(readRowValue(row, "entity_category_id"));
	return normalizedOptionKey([categoryLabel, subcategoryLabel].filter(Boolean).join("|"));
}

export function buildClassOptions(meta: RiseopediaAdminMeta, entityTypeCode: unknown): RiseopediaAdminOption[] {
	const selectedType = idText(entityTypeCode);
	return optionRows(meta.entityClasses)
		.filter((row) => !selectedType || idText(readRowValue(row, "entity_type_code")) === selectedType)
		.map((row) => ({
			value: idText(readRowValue(row, "entity_class_id")),
			label: idText(readRowValue(row, "entity_class_name")) || idText(readRowValue(row, "entity_class_code")),
		}))
		.filter((option) => option.value.length > 0)
		.sort((left, right) => left.label.localeCompare(right.label));
}

export function buildCategoryOptions(meta: RiseopediaAdminMeta, entityTypeCode: unknown, entityClassId: unknown): RiseopediaAdminOption[] {
	const selectedType = idText(entityTypeCode);
	const selectedClass = idText(entityClassId);
	return sortedDedupedOptions(optionRows(meta.entityCategories)
		.filter((row) => !selectedType || idText(readRowValue(row, "entity_type_code")) === selectedType)
		.filter((row) => !selectedClass || idText(readRowValue(row, "entity_class_id")) === selectedClass)
		.map((row) => ({
			value: idText(readRowValue(row, "entity_category_id")),
			label: categoryOptionLabel(row),
			dedupeKey: categoryOptionKey(row),
			sortOrder: rowSortOrder(row),
		})));
}

export function buildSubcategoryOptions(meta: RiseopediaAdminMeta, entityTypeCode: unknown, entityClassId: unknown, entityCategoryId: unknown): RiseopediaAdminOption[] {
	const selectedType = idText(entityTypeCode);
	const selectedClass = idText(entityClassId);
	const selectedCategory = idText(entityCategoryId);
	const categorySelected = selectedCategory.length > 0;
	return sortedDedupedOptions(optionRows(meta.entitySubcategories)
		.filter((row) => !selectedType || idText(readRowValue(row, "entity_type_code")) === selectedType)
		.filter((row) => !selectedClass || idText(readRowValue(row, "entity_class_id")) === selectedClass)
		.filter((row) => !selectedCategory || idText(readRowValue(row, "entity_category_id")) === selectedCategory)
		.map((row) => ({
			value: idText(readRowValue(row, "entity_subcategory_id")),
			label: subcategoryOptionLabel(row, categorySelected),
			dedupeKey: subcategoryOptionKey(row, categorySelected),
			sortOrder: rowSortOrder(row),
		})));
}

export function selectedSectionRuleRows(meta: RiseopediaAdminMeta, sectionId: unknown): RiseopediaAdminRows {
	const selectedSectionId = idText(sectionId);
	if (!selectedSectionId) {
		return [];
	}

	return optionRows(meta.sectionClassificationRules).filter((row) => idText(readRowValue(row, "section_id")) === selectedSectionId);
}

export function rowAllowedBySectionRule(row: RiseopediaAdminRow, rules: RiseopediaAdminRows, rowKind: "type" | "class" | "category" | "subcategory"): boolean {
	if (rules.length === 0) {
		return true;
	}

	const rowType = idText(readRowValue(row, "entity_type_code"));
	const rowClass = idText(readRowValue(row, "entity_class_id"));
	const rowCategory = idText(readRowValue(row, "entity_category_id"));
	const rowSubcategory = idText(readRowValue(row, "entity_subcategory_id"));

	return rules.some((rule) => {
		if (idText(readRowValue(rule, "entity_type_code")) !== rowType) {
			return false;
		}

		const ruleClass = idText(readRowValue(rule, "entity_class_id"));
		if ((rowKind === "class" || rowKind === "category" || rowKind === "subcategory") && ruleClass && ruleClass !== rowClass) {
			return false;
		}

		const ruleCategory = idText(readRowValue(rule, "entity_category_id"));
		if ((rowKind === "category" || rowKind === "subcategory") && ruleCategory && ruleCategory !== rowCategory) {
			return false;
		}

		const ruleSubcategory = idText(readRowValue(rule, "entity_subcategory_id"));
		return rowKind !== "subcategory" || !ruleSubcategory || ruleSubcategory === rowSubcategory;
	});
}

export function buildSectionScopedEntityTypeOptions(meta: RiseopediaAdminMeta, sectionId: unknown): RiseopediaAdminOption[] {
	const rules = selectedSectionRuleRows(meta, sectionId);
	return optionRows(meta.entityTypes)
		.filter((row) => rowAllowedBySectionRule(row, rules, "type"))
		.map((row) => ({
			value: idText(readRowValue(row, "entity_type_code")),
			label: idText(readRowValue(row, "entity_type_name")) || idText(readRowValue(row, "entity_type_code")),
		}))
		.filter((option) => option.value.length > 0)
		.sort((left, right) => left.label.localeCompare(right.label));
}

export function buildSectionScopedClassOptions(meta: RiseopediaAdminMeta, sectionId: unknown, entityTypeCode: unknown): RiseopediaAdminOption[] {
	const rules = selectedSectionRuleRows(meta, sectionId);
	return optionRows(meta.entityClasses)
		.filter((row) => rowAllowedBySectionRule(row, rules, "class"))
		.filter((row) => !idText(entityTypeCode) || idText(readRowValue(row, "entity_type_code")) === idText(entityTypeCode))
		.map((row) => ({
			value: idText(readRowValue(row, "entity_class_id")),
			label: idText(readRowValue(row, "entity_class_name")) || idText(readRowValue(row, "entity_class_code")),
		}))
		.filter((option) => option.value.length > 0)
		.sort((left, right) => left.label.localeCompare(right.label));
}

export function buildSectionScopedCategoryOptions(meta: RiseopediaAdminMeta, sectionId: unknown, entityTypeCode: unknown, entityClassId: unknown): RiseopediaAdminOption[] {
	const rules = selectedSectionRuleRows(meta, sectionId);
	const selectedType = idText(entityTypeCode);
	const selectedClass = idText(entityClassId);
	return sortedDedupedOptions(optionRows(meta.entityCategories)
		.filter((row) => rowAllowedBySectionRule(row, rules, "category"))
		.filter((row) => !selectedType || idText(readRowValue(row, "entity_type_code")) === selectedType)
		.filter((row) => !selectedClass || idText(readRowValue(row, "entity_class_id")) === selectedClass)
		.map((row) => ({
			value: idText(readRowValue(row, "entity_category_id")),
			label: categoryOptionLabel(row),
			dedupeKey: categoryOptionKey(row),
			sortOrder: rowSortOrder(row),
		})));
}

export function buildSectionScopedSubcategoryOptions(meta: RiseopediaAdminMeta, sectionId: unknown, entityTypeCode: unknown, entityClassId: unknown, entityCategoryId: unknown): RiseopediaAdminOption[] {
	const rules = selectedSectionRuleRows(meta, sectionId);
	const selectedType = idText(entityTypeCode);
	const selectedClass = idText(entityClassId);
	const selectedCategory = idText(entityCategoryId);
	const categorySelected = selectedCategory.length > 0;
	return sortedDedupedOptions(optionRows(meta.entitySubcategories)
		.filter((row) => rowAllowedBySectionRule(row, rules, "subcategory"))
		.filter((row) => !selectedType || idText(readRowValue(row, "entity_type_code")) === selectedType)
		.filter((row) => !selectedClass || idText(readRowValue(row, "entity_class_id")) === selectedClass)
		.filter((row) => !selectedCategory || idText(readRowValue(row, "entity_category_id")) === selectedCategory)
		.map((row) => ({
			value: idText(readRowValue(row, "entity_subcategory_id")),
			label: subcategoryOptionLabel(row, categorySelected),
			dedupeKey: subcategoryOptionKey(row, categorySelected),
			sortOrder: rowSortOrder(row),
		})));
}

export function classificationFields(meta: RiseopediaAdminMeta): RiseopediaAdminFieldConfig[] {
	return [
		{
			valueKey: "entityTypeCode",
			rowKey: "entity_type_code",
			label: "Entity type",
			type: "select",
			required: true,
			options: buildOptionsFromRows(optionRows(meta.entityTypes), "entity_type_code", "entity_type_name"),
			onChange: ({ setValue }) => {
				setValue("entityClassId", "");
				setValue("entityCategoryId", "");
				setValue("entitySubcategoryId", "");
			},
		},
		{
			valueKey: "entityClassId",
			rowKey: "entity_class_id",
			label: "Class",
			type: "select",
			options: (values) => buildClassOptions(meta, values.entityTypeCode),
			onChange: ({ setValue }) => {
				setValue("entityCategoryId", "");
				setValue("entitySubcategoryId", "");
			},
		},
		{
			valueKey: "entityCategoryId",
			rowKey: "entity_category_id",
			label: "Category",
			type: "select",
			options: (values) => buildCategoryOptions(meta, values.entityTypeCode, values.entityClassId),
			onChange: ({ setValue }) => {
				setValue("entitySubcategoryId", "");
			},
		},
		{
			valueKey: "entitySubcategoryId",
			rowKey: "entity_subcategory_id",
			label: "Subcategory",
			type: "select",
			options: (values) => buildSubcategoryOptions(meta, values.entityTypeCode, values.entityClassId, values.entityCategoryId),
		},
	];
}

export function optionalClassificationFields(meta: RiseopediaAdminMeta): RiseopediaAdminFieldConfig[] {
	return [
		{
			valueKey: "entityTypeCode",
			rowKey: "entity_type_code",
			label: "Entity type",
			type: "select",
			options: buildOptionsFromRows(optionRows(meta.entityTypes), "entity_type_code", "entity_type_name"),
			onChange: ({ setValue }) => {
				setValue("entityClassId", "");
				setValue("entityCategoryId", "");
				setValue("entitySubcategoryId", "");
			},
		},
		{
			valueKey: "entityClassId",
			rowKey: "entity_class_id",
			label: "Class",
			type: "select",
			options: (values) => values.entityTypeCode ? buildClassOptions(meta, values.entityTypeCode) : [],
			onChange: ({ setValue }) => {
				setValue("entityCategoryId", "");
				setValue("entitySubcategoryId", "");
			},
		},
		{
			valueKey: "entityCategoryId",
			rowKey: "entity_category_id",
			label: "Category",
			type: "select",
			options: (values) => values.entityTypeCode && values.entityClassId ? buildCategoryOptions(meta, values.entityTypeCode, values.entityClassId) : [],
			onChange: ({ setValue }) => {
				setValue("entitySubcategoryId", "");
			},
		},
		{
			valueKey: "entitySubcategoryId",
			rowKey: "entity_subcategory_id",
			label: "Subcategory",
			type: "select",
			options: (values) => values.entityTypeCode && values.entityClassId && values.entityCategoryId
				? buildSubcategoryOptions(meta, values.entityTypeCode, values.entityClassId, values.entityCategoryId)
				: [],
		},
	];
}

export function overviewCardRuleSetFields(meta: RiseopediaAdminMeta): RiseopediaAdminFieldConfig[] {
	return [
		{
			valueKey: "channelCode",
			rowKey: "channel_code",
			label: "Channel",
			type: "select",
			required: true,
			defaultValue: "riseopedia",
			options: buildRenderingChannelOptions(meta),
		},
		{
			valueKey: "placementCode",
			rowKey: "placement_code",
			label: "Placement",
			type: "select",
			required: true,
			options: buildOptionsFromRows(optionRows(meta.overviewCardPlacements), "placement_code", "placement_name"),
		},
		{
			valueKey: "cardModeCode",
			rowKey: "card_mode_code",
			label: "Card mode",
			type: "select",
			required: true,
			defaultValue: "compact",
			options: buildOptionsFromRows(optionRows(meta.overviewCardModes), "card_mode_code", "card_mode_name"),
		},
		{
			valueKey: "entityTypeCode",
			rowKey: "entity_type_code",
			label: "Section",
			type: "select",
			options: buildOptionsFromRows(optionRows(meta.entityTypes), "entity_type_code", "entity_type_name"),
			onChange: ({ setValue }) => {
				setValue("entityClassId", "");
				setValue("entityCategoryId", "");
				setValue("entitySubcategoryId", "");
			},
		},
		{
			valueKey: "entityClassId",
			rowKey: "entity_class_id",
			label: "Class",
			type: "select",
			options: (values) => buildClassOptions(meta, values.entityTypeCode),
			onChange: ({ setValue }) => {
				setValue("entityCategoryId", "");
				setValue("entitySubcategoryId", "");
			},
		},
		{
			valueKey: "entityCategoryId",
			rowKey: "entity_category_id",
			label: "Category",
			type: "select",
			options: (values) => buildCategoryOptions(meta, values.entityTypeCode, values.entityClassId),
			onChange: ({ setValue }) => {
				setValue("entitySubcategoryId", "");
			},
		},
		{
			valueKey: "entitySubcategoryId",
			rowKey: "entity_subcategory_id",
			label: "Subcategory",
			type: "select",
			options: (values) => buildSubcategoryOptions(meta, values.entityTypeCode, values.entityClassId, values.entityCategoryId),
		},
		BOOLEAN_ACTIVE_FIELD,
		ADMIN_NOTE_FIELD,
	];
}

export function propertyMatchesRuleSet(propertyRow: RiseopediaAdminRow, ruleSet: RiseopediaAdminRow | null, _meta: RiseopediaAdminMeta): boolean {
	if (!ruleSet) {
		return true;
	}

	const ruleEntityType = idText(readRowValue(ruleSet, "entity_type_code"));
	const ruleClassId = idText(readRowValue(ruleSet, "entity_class_id"));
	const propertyEntityType = idText(readRowValue(propertyRow, "entity_type_code"));

	if (ruleEntityType && propertyEntityType && propertyEntityType !== ruleEntityType) {
		return false;
	}

	return propertyRowMatchesClassScope(propertyRow, ruleClassId);
}

export function filterOverviewCardPropertyRows(args: {
	propertyRows: RiseopediaAdminRows | undefined;
	ruleSet: RiseopediaAdminRow | null;
	meta: RiseopediaAdminMeta;
}): RiseopediaAdminRows {
	return optionRows(args.propertyRows).filter((propertyRow) => propertyMatchesRuleSet(propertyRow, args.ruleSet, args.meta));
}

export function activeFilter(): RiseopediaAdminFilterConfig {
	return {
		key: "active",
		rowKey: "active_flag",
		label: "Active",
		clearLabel: "All statuses",
		options: [
			{ value: "Enabled", label: "Enabled" },
			{ value: "Disabled", label: "Disabled" },
		],
	};
}

export function sectionFilter(meta: RiseopediaAdminMeta): RiseopediaAdminFilterConfig {
	return {
		key: "section",
		rowKey: "section_id",
		label: "Section",
		clearLabel: "All sections",
		options: buildSectionOptions(optionRows(meta.sections)),
	};
}

export function entityTypeFilter(meta: RiseopediaAdminMeta): RiseopediaAdminFilterConfig {
	return {
		key: "entityType",
		rowKey: "entity_type_code",
		label: "Entity type",
		clearLabel: "All entity types",
		options: buildOptionsFromRows(optionRows(meta.entityTypes), "entity_type_code", "entity_type_name"),
	};
}

export function overviewCardSectionFilter(meta: RiseopediaAdminMeta): RiseopediaAdminFilterConfig {
	return {
		key: "entityType",
		rowKey: "entity_type_code",
		label: "Section",
		clearLabel: "All sections",
		options: buildOptionsFromRows(optionRows(meta.entityTypes), "entity_type_code", "entity_type_name"),
	};
}

export function classificationFilters(meta: RiseopediaAdminMeta): RiseopediaAdminFilterConfig[] {
	return [
		{
			...entityTypeFilter(meta),
			clearKeysOnChange: ["entityClass", "entityCategory", "entitySubcategory"],
		},
		{
			key: "entityClass",
			rowKey: "entity_class_id",
			label: "Class",
			clearLabel: "All classes",
			optionsBuilder: (filterState) => buildClassOptions(meta, filterState.entityType),
			clearKeysOnChange: ["entityCategory", "entitySubcategory"],
		},
		{
			key: "entityCategory",
			rowKey: "entity_category_id",
			label: "Category",
			clearLabel: "All categories",
			optionsBuilder: (filterState) => buildCategoryOptions(meta, filterState.entityType, filterState.entityClass),
			clearKeysOnChange: ["entitySubcategory"],
		},
		{
			key: "entitySubcategory",
			rowKey: "entity_subcategory_id",
			label: "Subcategory",
			clearLabel: "All subcategories",
			optionsBuilder: (filterState) => buildSubcategoryOptions(meta, filterState.entityType, filterState.entityClass, filterState.entityCategory),
		},
	];
}

export function patchFilter(meta: RiseopediaAdminMeta): RiseopediaAdminFilterConfig {
	return {
		key: "patch",
		rowKey: "patch_id",
		label: "Patch",
		clearLabel: "All patches",
		options: buildPatchOptions(meta.patchOptions),
	};
}

export function releaseStateFilter(meta: RiseopediaAdminMeta): RiseopediaAdminFilterConfig {
	return {
		key: "releaseState",
		rowKey: "effective_release_state_code",
		label: "Release state",
		clearLabel: "All release states",
		options: buildOptionsFromRows(optionRows(meta.releaseStates), "release_state_code", "release_state_name"),
	};
}

export function releaseDecisionClassificationFilters(meta: RiseopediaAdminMeta): RiseopediaAdminFilterConfig[] {
	return [
		{
			...entityTypeFilter(meta),
			clearKeysOnChange: ["entityClass", "entityCategory"],
		},
		{
			key: "entityClass",
			rowKey: "entity_class_id",
			label: "Class",
			clearLabel: "All classes",
			optionsBuilder: (filterState) => buildClassOptions(meta, filterState.entityType),
			clearKeysOnChange: ["entityCategory"],
		},
		{
			key: "entityCategory",
			rowKey: "entity_category_id",
			label: "Category",
			clearLabel: "All categories",
			optionsBuilder: (filterState) => buildCategoryOptions(meta, filterState.entityType, filterState.entityClass),
		},
	];
}

export function releaseOverrideFilter(): RiseopediaAdminFilterConfig {
	return {
		key: "overrideSource",
		rowKey: "release_state_source_code",
		label: "Override",
		clearLabel: "All release sources",
		options: [
			{ value: "manual_override", label: "Manual overrides" },
			{ value: "calculated", label: "Calculated only" },
		],
	};
}

export function buildReleaseDecisionReturnHref(context: RiseopediaAdminReadOnlyActionContext): string {
	const params = new URLSearchParams();
	const search = context.search.trim();
	if (search) {
		params.set("search", search);
	}

	for (const key of ["entityType", "entityClass", "entityCategory", "patch", "releaseState", "overrideSource"] as const) {
		const value = context.filterState[key]?.trim();
		if (value) {
			params.set(key, value);
		}
	}

	const query = params.toString();
	return query ? `/admin/riseopedia/release-decisions?${query}` : "/admin/riseopedia/release-decisions";
}

export function buildReleaseDecisionDetailHref(
	row: RiseopediaAdminRow,
	context: RiseopediaAdminReadOnlyActionContext,
): string {
	const params = new URLSearchParams();
	params.set("entityId", idText(readRowValue(row, "entity_id")));
	params.set("returnTo", buildReleaseDecisionReturnHref(context));
	return `/admin/riseopedia/release-evidence?${params.toString()}`;
}

export function buildReleaseDecisionOverrideHref(
	row: RiseopediaAdminRow,
	context: RiseopediaAdminReadOnlyActionContext,
): string {
	const params = new URLSearchParams();
	params.set("entityId", idText(readRowValue(row, "entity_id")));
	params.set("returnTo", buildReleaseDecisionReturnHref(context));
	return `/admin/riseopedia/release-overrides?${params.toString()}`;
}

export function hasManualReleaseOverride(row: RiseopediaAdminRow): boolean {
	return Boolean(parseOptionalPositiveInt(readRowValue(row, "active_override_id")))
		|| idText(readRowValue(row, "release_state_source_code")) === "manual_override";
}

export function basicCodeFields(args: {
	codeKey: string;
	codeRowKey: string;
	codeLabel: string;
	nameKey: string;
	nameRowKey: string;
	nameLabel: string;
	descriptionKey?: string;
	descriptionRowKey?: string;
}): RiseopediaAdminFieldConfig[] {
	return [
		{ valueKey: args.codeKey, rowKey: args.codeRowKey, label: args.codeLabel, type: "text", required: true, readOnlyOnEdit: true },
		{ valueKey: args.nameKey, rowKey: args.nameRowKey, label: args.nameLabel, type: "text", required: true },
		{ valueKey: args.descriptionKey ?? "description", rowKey: args.descriptionRowKey ?? "description", label: "Description", type: "textarea", textareaRows: 3, span: 12 },
		BOOLEAN_ACTIVE_FIELD,
	];
}
