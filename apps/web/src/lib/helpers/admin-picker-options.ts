//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/helpers/admin-picker-options.ts                                                        ////
//// Language: TS                                                                                                  ////
//// Small helpers for consistently sorting admin picker options by the visible option text                         ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export type AdminPickerOption = {
	value: string;
	label: string;
};

export function sortAdminPickerOptions<T extends AdminPickerOption>(options: T[]): T[] {
	return options.slice().sort((left, right) => {
		const labelCompare = left.label.localeCompare(right.label, undefined, {
			numeric: true,
			sensitivity: "base",
		});

		if (labelCompare !== 0) {
			return labelCompare;
		}

		return left.value.localeCompare(right.value, undefined, {
			numeric: true,
			sensitivity: "base",
		});
	});
}
