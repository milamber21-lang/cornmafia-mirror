//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/data/riseopedia-card-properties.ts                                                  ////
//// Language: TS                                                                                              ////
//// Shared strict mapper for Riseopedia overview-card element JSON rows.                                      ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export type RiseopediaOverviewCardMode = "compact" | "full";

export type RiseopediaCardProperty = {
	placementCode: string;
	cardModeCode: RiseopediaOverviewCardMode;
	displaySlotCode: string;
	displaySlotName: string;
	sourceTypeCode: string;
	sourceCode: string;
	displayLabel: string;
	displayValue: string | null;
	valueTypeCode: string;
	sortOrder: number;
};

function isStringRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: Record<string, unknown>, key: string): string | null {
	const fieldValue = value[key];
	return typeof fieldValue === "string" && fieldValue.trim().length > 0
		? fieldValue
		: null;
}

function readNullableString(value: Record<string, unknown>, key: string): string | null {
	const fieldValue = value[key];
	if (fieldValue === null || fieldValue === undefined) {
		return null;
	}

	return typeof fieldValue === "string" && fieldValue.trim().length > 0
		? fieldValue
		: null;
}

function readNumber(value: Record<string, unknown>, key: string): number {
	const fieldValue = value[key];
	if (typeof fieldValue === "number" && Number.isFinite(fieldValue)) {
		return fieldValue;
	}

	if (typeof fieldValue === "string") {
		const parsed = Number(fieldValue);
		return Number.isFinite(parsed) ? parsed : 1000;
	}

	return 1000;
}

function normalizeCardMode(value: string | null): RiseopediaOverviewCardMode {
	return value === "full" ? "full" : "compact";
}

export function mapRiseopediaCardProperties(value: unknown): RiseopediaCardProperty[] {
	if (!Array.isArray(value)) {
		return [];
	}

	const rows: RiseopediaCardProperty[] = [];

	for (const item of value) {
		if (!isStringRecord(item)) {
			continue;
		}

		const placementCode = readString(item, "placementCode");
		const cardModeCode = readString(item, "cardModeCode");
		const displaySlotCode = readString(item, "displaySlotCode");
		const displaySlotName = readString(item, "displaySlotName");
		const sourceTypeCode = readString(item, "sourceTypeCode");
		const sourceCode = readString(item, "sourceCode");
		const displayLabel = readString(item, "displayLabel");
		const valueTypeCode = readString(item, "valueTypeCode");

		if (
			placementCode === null ||
			displaySlotCode === null ||
			displaySlotName === null ||
			sourceTypeCode === null ||
			sourceCode === null ||
			displayLabel === null ||
			valueTypeCode === null
		) {
			continue;
		}

		rows.push({
			placementCode,
			cardModeCode: normalizeCardMode(cardModeCode),
			displaySlotCode,
			displaySlotName,
			sourceTypeCode,
			sourceCode,
			displayLabel,
			displayValue: readNullableString(item, "displayValue"),
			valueTypeCode,
			sortOrder: readNumber(item, "sortOrder"),
		});
	}

	return rows.sort((left, right) => {
		if (left.sortOrder !== right.sortOrder) {
			return left.sortOrder - right.sortOrder;
		}

		return left.displayLabel.localeCompare(right.displayLabel);
	});
}

export function normalizeRiseopediaCardMode(value: string | null | undefined): RiseopediaOverviewCardMode {
	return value === "full" ? "full" : "compact";
}
