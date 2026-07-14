//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/test/contracts/template-authoring-system.test.ts                                        ////
//// Language: TS                                                                                                 ////
//// Locks current optional-series, system-field, member-template, and Page Hero authoring contracts.             ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { createReadStream, existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createInterface } from "node:readline";

import { describe, expect, it } from "vitest";

const APP_ROOT = process.cwd();
const REPO_ROOT = resolve(APP_ROOT, "../..");
const SQL_DUMP_PATH = resolve(REPO_ROOT, "cm_web_full.sql");
const RUN_SQL_DUMP_CONTRACTS =
	process.env.CM_TEST_SQL_DUMP === "1" && existsSync(SQL_DUMP_PATH);
const privateSchema = ["web", "priv"].join("_");
const COPY_TABLE_NAMES = [
	`${privateSchema}.web_template_field_list`,
	`${privateSchema}.web_template_fields`,
	`${privateSchema}.web_templates`,
] as const;
const CONTRACT_TOKENS = [
	"allows_series boolean DEFAULT false NOT NULL",
	"Template % does not allow series membership.",
	"IF p_series_id IS NULL THEN",
	"'allowsSeries'",
	"requires_series",
	"'requiresSeries'",
	"is system-backed and cannot accept submitted field values",
	"fl.value_source_code = 'content_field'",
	`CREATE TABLE ${privateSchema}.web_templates`,
	`CREATE TABLE ${privateSchema}.web_template_field_list`,
	`CREATE TABLE ${privateSchema}.web_template_fields`,
	"CREATE FUNCTION web_api.web_template_insert",
	`CREATE TABLE ${privateSchema}.web_page_header`,
] as const;

type CopyRow = Record<string, string | null>;

type SqlDumpAnalysis = {
	contractText: string;
	copyRows: Map<string, CopyRow[]>;
};

type ActiveCopyBlock = {
	tableName: string;
	columns: string[];
};

let sqlDumpAnalysisPromise: Promise<SqlDumpAnalysis> | null = null;

function readAppSource(path: string): string {
	return readFileSync(resolve(APP_ROOT, path), "utf8");
}

function parseCopyHeader(line: string, tableName: string): string[] | null {
	const marker = `COPY ${tableName} (`;
	if (!line.startsWith(marker) || !line.endsWith(") FROM stdin;")) {
		return null;
	}

	return line
		.slice(marker.length, -") FROM stdin;".length)
		.split(",")
		.map((column) => column.trim());
}

function parseCopyRow(args: {
	tableName: string;
	columns: readonly string[];
	line: string;
}): CopyRow {
	const values = args.line.split("\t");
	if (values.length !== args.columns.length) {
		throw new Error(
			`COPY row for ${args.tableName} has ${values.length} values; expected ${args.columns.length}.`,
		);
	}

	const row: CopyRow = {};
	for (const [index, column] of args.columns.entries()) {
		const value = values[index];
		row[column] = value === "\\N" || value === undefined ? null : value;
	}
	return row;
}

async function analyzeSqlDump(): Promise<SqlDumpAnalysis> {
	const copyRows = new Map<string, CopyRow[]>();
	for (const tableName of COPY_TABLE_NAMES) {
		copyRows.set(tableName, []);
	}
	const contractLines: string[] = [];
	const stream = createReadStream(SQL_DUMP_PATH, { encoding: "utf8" });
	const lines = createInterface({
		input: stream,
		crlfDelay: Number.POSITIVE_INFINITY,
	});
	let activeCopyBlock: ActiveCopyBlock | null = null;

	for await (const line of lines) {
		if (activeCopyBlock) {
			if (line === "\\.") {
				activeCopyBlock = null;
				continue;
			}

			copyRows.get(activeCopyBlock.tableName)?.push(
				parseCopyRow({
					tableName: activeCopyBlock.tableName,
					columns: activeCopyBlock.columns,
					line,
				}),
			);
			continue;
		}

		for (const tableName of COPY_TABLE_NAMES) {
			const columns = parseCopyHeader(line, tableName);
			if (columns) {
				activeCopyBlock = { tableName, columns };
				break;
			}
		}

		if (CONTRACT_TOKENS.some((token) => line.includes(token))) {
			contractLines.push(line);
		}
	}

	return {
		contractText: contractLines.join("\n"),
		copyRows,
	};
}

function getSqlDumpAnalysis(): Promise<SqlDumpAnalysis> {
	sqlDumpAnalysisPromise ??= analyzeSqlDump();
	return sqlDumpAnalysisPromise;
}

function requireRows(
	analysis: SqlDumpAnalysis,
	tableName: string,
): readonly CopyRow[] {
	const rows = analysis.copyRows.get(tableName);
	if (!rows || rows.length === 0) {
		throw new Error(`Missing COPY rows for ${tableName}.`);
	}
	return rows;
}

function requireRow(
	rows: readonly CopyRow[],
	column: string,
	value: string,
): CopyRow {
	const row = rows.find((candidate) => candidate[column] === value);
	if (!row) {
		throw new Error(`Missing row where ${column} = ${value}.`);
	}
	return row;
}

const contentFieldInputs = readAppSource(
	"src/components/admin/web/ContentFieldInputs.tsx",
);
const memberPanel = readAppSource(
	"src/components/me/MemberContentCreatePanel.tsx",
);

describe("template authoring app contracts", () => {
	it("keeps series optional in member authoring", () => {
		expect(memberPanel).toContain(
			'{ value: NO_SERIES_VALUE, label: "No series" }',
		);
		expect(memberPanel).toContain("seriesMode:");
		expect(memberPanel).toContain('? "none"');
		expect(memberPanel).toContain("seriesChoice !== NO_SERIES_VALUE ? (");
	});

	it("prevents system-backed fields from being submitted as content field values", () => {
		expect(contentFieldInputs).toContain("isContentSystemFieldListCode");
		expect(contentFieldInputs).toContain(
			"!isContentSystemFieldListCode(field.fieldListCode)",
		);
	});
});

describe.skipIf(!RUN_SQL_DUMP_CONTRACTS)(
	"template authoring database contracts in the optional SQL dump",
	() => {
		it("uses optional series capability in the current schema and business functions", async () => {
			const { contractText } = await getSqlDumpAnalysis();

			expect(contractText).toContain(
				"allows_series boolean DEFAULT false NOT NULL",
			);
			expect(contractText).toContain(
				"Template % does not allow series membership.",
			);
			expect(contractText).toContain("IF p_series_id IS NULL THEN");
			expect(contractText).toContain("'allowsSeries'");
			expect(contractText).not.toContain("requires_series");
			expect(contractText).not.toContain("'requiresSeries'");
		});

		it("defines canonical system-backed Top fields and rejects submitted values", async () => {
			const analysis = await getSqlDumpAnalysis();
			const fieldLists = requireRows(
				analysis,
				`${privateSchema}.web_template_field_list`,
			);
			const expectedSources: Record<string, string> = {
				system_author_username: "content_author_username",
				system_published_at: "content_published_at",
				system_updated_at: "content_updated_at",
				system_series_title: "content_series_title",
				system_series_part_no: "content_series_part_no",
			};

			for (const [fieldListCode, valueSourceCode] of Object.entries(
				expectedSources,
			)) {
				const row = requireRow(fieldLists, "field_list_code", fieldListCode);
				expect(row.render_destination_code).toBe("top");
				expect(row.value_source_code).toBe(valueSourceCode);
			}

			expect(analysis.contractText).toContain(
				"is system-backed and cannot accept submitted field values",
			);
			expect(analysis.contractText).toContain(
				"fl.value_source_code = 'content_field'",
			);
		});

		it("configures the four public member templates while retaining YouTube admin templates", async () => {
			const analysis = await getSqlDumpAnalysis();
			const templates = requireRows(analysis, `${privateSchema}.web_templates`);

			for (const templateCode of [
				"story_chronicle",
				"tutorial",
				"strategy_guide",
				"quick_tip",
			]) {
				const row = requireRow(templates, "template_code", templateCode);
				expect(row.content_kind_code).toBe("page");
				expect(row.surface_scope_code).toBe("public");
				expect(row.allows_series).toBe("t");
				expect(row.is_enabled).toBe("t");
			}

			for (const templateCode of ["youtube_video", "youtube_series"]) {
				const row = requireRow(templates, "template_code", templateCode);
				expect(row.surface_scope_code).toBe("admin");
			}
		});

		it("keeps Hero media as the only authored Page Hero field", async () => {
			const analysis = await getSqlDumpAnalysis();
			const templates = requireRows(analysis, `${privateSchema}.web_templates`);
			const fieldLists = requireRows(
				analysis,
				`${privateSchema}.web_template_field_list`,
			);
			const templateFields = requireRows(
				analysis,
				`${privateSchema}.web_template_fields`,
			);
			const pageTemplate = requireRow(templates, "template_code", "page");
			const heroMedia = requireRow(fieldLists, "field_list_code", "hero_media_id");
			const assignment = templateFields.find(
				(row) =>
					row.template_id === pageTemplate.template_id &&
					row.field_list_id === heroMedia.field_list_id &&
					row.is_enabled === "t",
			);

			expect(assignment).toBeDefined();
			expect(heroMedia.render_destination_code).toBe("hero");
			expect(
				fieldLists.some((row) => row.field_list_code === "hero_overline"),
			).toBe(false);
		});

		it("keeps authoring inside the existing universal template families", async () => {
			const { contractText } = await getSqlDumpAnalysis();

			expect(contractText).toContain(
				`CREATE TABLE ${privateSchema}.web_templates`,
			);
			expect(contractText).toContain(
				`CREATE TABLE ${privateSchema}.web_template_field_list`,
			);
			expect(contractText).toContain(
				`CREATE TABLE ${privateSchema}.web_template_fields`,
			);
			expect(contractText).toContain(
				"CREATE FUNCTION web_api.web_template_insert",
			);
			expect(contractText).not.toContain(
				`CREATE TABLE ${privateSchema}.web_page_header`,
			);
		});
	},
);

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
