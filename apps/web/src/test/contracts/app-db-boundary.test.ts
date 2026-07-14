//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/test/contracts/app-db-boundary.test.ts                                                   ////
//// Language: TS                                                                                                ////
//// Verifies app DB boundaries against the current SQL dump without depending on historical migrations.          ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import {
	createReadStream,
	existsSync,
	readdirSync,
	readFileSync,
	statSync,
} from "node:fs";
import { extname, join, relative, resolve } from "node:path";
import { createInterface } from "node:readline";

import { describe, expect, it } from "vitest";

const APP_ROOT = process.cwd();
const SOURCE_ROOT = resolve(APP_ROOT, "src");
const REPO_ROOT = resolve(APP_ROOT, "../..");
const SQL_DUMP_PATH = resolve(REPO_ROOT, "cm_web_full.sql");
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"]);
const FORBIDDEN_SCHEMA_PATTERN =
	/\b(?:web_priv|web_game|web_riseopedia|game_data|web_analytics)\s*\./;
const APPROVED_REFERENCE_PATTERN = /\b(web_view|web_api)\.([a-z][a-z0-9_]*)\b/g;
const RUN_SQL_DUMP_CONTRACTS =
	process.env.CM_TEST_SQL_DUMP === "1" && existsSync(SQL_DUMP_PATH);

type SourceFile = {
	path: string;
	content: string;
};

type DbReference = {
	schema: "web_api" | "web_view";
	objectName: string;
};

type DumpAnalysis = {
	references: Set<string>;
	privateRuntimeGrants: string[];
	broadFunctionGrants: string[];
};

function extension(path: string): string {
	return extname(path).toLowerCase();
}

function shouldIncludeSourceFile(path: string): boolean {
	const normalized = path.replaceAll("\\", "/");
	return (
		SOURCE_EXTENSIONS.has(extension(path)) &&
		!normalized.includes("/test/") &&
		!normalized.endsWith(".test.ts") &&
		!normalized.endsWith(".test.tsx") &&
		!normalized.endsWith(".spec.ts") &&
		!normalized.endsWith(".spec.tsx")
	);
}

function collectFiles(directory: string): string[] {
	if (!existsSync(directory)) {
		return [];
	}

	const files: string[] = [];
	for (const entry of readdirSync(directory)) {
		const absolutePath = join(directory, entry);
		const stats = statSync(absolutePath);

		if (stats.isDirectory()) {
			files.push(...collectFiles(absolutePath));
		} else if (stats.isFile()) {
			files.push(absolutePath);
		}
	}

	return files;
}

function collectSourceFiles(directory: string): SourceFile[] {
	return collectFiles(directory)
		.filter(shouldIncludeSourceFile)
		.map((absolutePath) => ({
			path: relative(REPO_ROOT, absolutePath).replaceAll("\\", "/"),
			content: readFileSync(absolutePath, "utf8"),
		}));
}

function collectDbReferences(
	sourceFiles: readonly SourceFile[],
): DbReference[] {
	const references = new Map<string, DbReference>();

	for (const file of sourceFiles) {
		for (const match of file.content.matchAll(APPROVED_REFERENCE_PATTERN)) {
			const schema = match[1];
			const objectName = match[2];
			if (
				(schema !== "web_api" && schema !== "web_view") ||
				typeof objectName !== "string"
			) {
				continue;
			}

			const key = `${schema}.${objectName}`;
			references.set(key, { schema, objectName });
		}
	}

	return [...references.values()].sort((left, right) =>
		`${left.schema}.${left.objectName}`.localeCompare(
			`${right.schema}.${right.objectName}`,
		),
	);
}

function collectSqlContractPaths(): string[] {
	return existsSync(SQL_DUMP_PATH) ? [SQL_DUMP_PATH] : [];
}

async function analyzeSqlContracts(): Promise<DumpAnalysis> {
	const references = new Set<string>();
	const privateRuntimeGrants: string[] = [];
	const broadFunctionGrants: string[] = [];

	for (const contractPath of collectSqlContractPaths()) {
		const reader = createInterface({
			input: createReadStream(contractPath, { encoding: "utf8" }),
			crlfDelay: Number.POSITIVE_INFINITY,
		});

		for await (const line of reader) {
			for (const match of line.matchAll(APPROVED_REFERENCE_PATTERN)) {
				const schema = match[1];
				const objectName = match[2];
				if (
					(schema === "web_api" || schema === "web_view") &&
					typeof objectName === "string"
				) {
					references.add(`${schema}.${objectName}`);
				}
			}

			if (
				/^GRANT\s+/i.test(line) &&
				/\bTO\s+cm_client\s*;/i.test(line) &&
				/\b(?:web_priv|web_game|web_riseopedia|game_data|web_analytics)(?:\.|\b)/i.test(
					line,
				)
			) {
				privateRuntimeGrants.push(
					`${relative(REPO_ROOT, contractPath)}: ${line.trim()}`,
				);
			}

			if (/^GRANT\s+ALL\s+ON\s+FUNCTION\b/i.test(line)) {
				broadFunctionGrants.push(
					`${relative(REPO_ROOT, contractPath)}: ${line.trim()}`,
				);
			}
		}
	}

	return { references, privateRuntimeGrants, broadFunctionGrants };
}

const sourceFiles = collectSourceFiles(SOURCE_ROOT);
const dbReferences = collectDbReferences(sourceFiles);
let dumpAnalysisPromise: Promise<DumpAnalysis> | null = null;

function getDumpAnalysis(): Promise<DumpAnalysis> {
	dumpAnalysisPromise ??= analyzeSqlContracts();
	return dumpAnalysisPromise;
}

describe("application database boundary", () => {
	it("contains no direct references to private, raw-import, or analytics schemas", () => {
		const violations = sourceFiles.flatMap((file) =>
			FORBIDDEN_SCHEMA_PATTERN.test(file.content) ? [file.path] : [],
		);

		expect(violations).toEqual([]);
	});

	it("contains explicit app-facing DB references for contract verification", () => {
		expect(dbReferences.length).toBeGreaterThan(0);
		expect(
			dbReferences.every(
				(reference) =>
					reference.schema === "web_view" || reference.schema === "web_api",
			),
		).toBe(true);
	});
});

describe.skipIf(!RUN_SQL_DUMP_CONTRACTS)(
	"application references against the current SQL contracts",
	() => {
		it("defines every web_view and web_api object referenced by app source", async () => {
			const analysis = await getDumpAnalysis();
			const missingObjects = dbReferences
				.map((reference) => `${reference.schema}.${reference.objectName}`)
				.filter((reference) => !analysis.references.has(reference));

			expect(missingObjects).toEqual([]);
		}, 120_000);

		it("does not grant cm_client direct private-schema privileges", async () => {
			const analysis = await getDumpAnalysis();
			expect(analysis.privateRuntimeGrants).toEqual([]);
		}, 120_000);

		it("uses explicit EXECUTE wording for app-callable function grants", async () => {
			const analysis = await getDumpAnalysis();
			expect(analysis.broadFunctionGrants).toEqual([]);
		}, 120_000);
	},
);

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
