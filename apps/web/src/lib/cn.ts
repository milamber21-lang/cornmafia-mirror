//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/cn.ts                                                                                 ////
//// Language: TS                                                                                                 ////
//// Simple className combiner with strict typing                                                                 ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
export function cn(...args: unknown[]): string {
	const out: string[] = [];

	for (const value of args) {
		if (!value) {
			continue;
		}

		if (typeof value === "string") {
			out.push(value);
			continue;
		}

		if (Array.isArray(value)) {
			out.push(cn(...value));
			continue;
		}

		if (typeof value === "object") {
			for (const [key, enabled] of Object.entries(
				value as Record<string, unknown>,
			)) {
				if (enabled) {
					out.push(key);
				}
			}
		}
	}

	return out.join(" ");
}
