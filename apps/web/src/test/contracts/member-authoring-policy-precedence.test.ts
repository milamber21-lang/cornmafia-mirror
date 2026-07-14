//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/test/contracts/member-authoring-policy-precedence.test.ts                               ////
//// Language: TS                                                                                                ////
//// Verifies optional SQL-dump contracts use resolved subcategory authoring policy without category intersection. ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { createReadStream, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createInterface } from "node:readline";

import { describe, expect, it } from "vitest";

const APP_ROOT = process.cwd();
const REPO_ROOT = resolve(APP_ROOT, "../..");
const SQL_DUMP_PATH = resolve(REPO_ROOT, "cm_web_full.sql");
const RUN_SQL_DUMP_CONTRACTS =
	process.env.CM_TEST_SQL_DUMP === "1" && existsSync(SQL_DUMP_PATH);
const privateSchema = ["web", "priv"].join("_");
const privateAuthoringFunction = `${privateSchema}.web_member_actor_can_author_collection`;
const publicAuthoringFunction = "web_api.web_member_authorable_collections";
const functionNames = [
	privateAuthoringFunction,
	publicAuthoringFunction,
] as const;

let functionBlocksPromise: Promise<Map<string, string>> | null = null;

async function readFunctionBlocks(): Promise<Map<string, string>> {
	const stream = createReadStream(SQL_DUMP_PATH, { encoding: "utf8" });
	const lines = createInterface({
		input: stream,
		crlfDelay: Number.POSITIVE_INFINITY,
	});
	const blocks = new Map<string, string[]>();
	let activeName: string | null = null;

	for await (const line of lines) {
		if (!activeName) {
			activeName =
				functionNames.find((name) => line.startsWith(`CREATE FUNCTION ${name}(`)) ??
				null;
			if (activeName) {
				blocks.set(activeName, [line]);
			}
			continue;
		}

		blocks.get(activeName)?.push(line);
		if (line.startsWith(`ALTER FUNCTION ${activeName}(`)) {
			activeName = null;
			if (blocks.size === functionNames.length) {
				lines.close();
				stream.destroy();
				break;
			}
		}
	}

	return new Map(
		[...blocks.entries()].map(([name, blockLines]) => [
			name,
			blockLines.join("\n"),
		]),
	);
}

function getFunctionBlocks(): Promise<Map<string, string>> {
	functionBlocksPromise ??= readFunctionBlocks();
	return functionBlocksPromise;
}

describe.skipIf(!RUN_SQL_DUMP_CONTRACTS)(
	"member authoring policy precedence in the optional SQL dump contract",
	() => {
		it("checks only the resolved subcategory policy in both member authoring contracts", async () => {
			const functionBlocks = await getFunctionBlocks();

			for (const name of functionNames) {
				const block = functionBlocks.get(name) ?? "";
				expect(block).toContain("sc.write_effective_policy_code");
				expect(block).toContain("sc.write_effective_rank");
				expect(block).not.toMatch(/(^|[^a-z_])c\.write_effective_policy_code/m);
				expect(block).not.toMatch(/(^|[^a-z_])c\.write_effective_rank/m);
			}
		});

		it("preserves fixed search paths, owners, and the runtime grant boundary", async () => {
			const functionBlocks = await getFunctionBlocks();
			const privateBlock = functionBlocks.get(privateAuthoringFunction) ?? "";
			const publicBlock = functionBlocks.get(publicAuthoringFunction) ?? "";

			expect(privateBlock).toContain("SET search_path TO 'pg_catalog'");
			expect(publicBlock).toContain("SET search_path TO 'pg_catalog'");
			expect(privateBlock).toContain(`ALTER FUNCTION ${privateAuthoringFunction}`);
			expect(publicBlock).toContain(`ALTER FUNCTION ${publicAuthoringFunction}`);
			expect(publicBlock).not.toContain(
				`GRANT ALL ON FUNCTION ${privateAuthoringFunction}`,
			);
		});
	},
);

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
