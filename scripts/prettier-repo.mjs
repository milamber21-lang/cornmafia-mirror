//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: scripts/prettier-repo.mjs                                                                            ////
//// Language: JS                                                                                               ////
//// Formats or verifies supported repository files without traversing runtime data and deployment volumes.     ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { format, getFileInfo, resolveConfig } from "prettier";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(SCRIPT_PATH), "..");
const PRETTIER_IGNORE_PATH = join(REPO_ROOT, ".prettierignore");

const SKIPPED_RELATIVE_PATHS = new Set([
  "apps/web/next-env.d.ts",
  "docs/_db.md",
  "docs/_files.md",
  "docs/_snapshot.md",
]);

const SKIPPED_DIRECTORY_NAMES = new Set([
  ".git",
  ".next",
  ".turbo",
  "build",
  "coverage",
  "dist",
  "node_modules",
]);

const SKIPPED_RELATIVE_DIRECTORIES = new Set([
  ".cm-deploy",
  "apps/web/public",
  "apps/web/uploads",
  "data",
  "public",
  "uploads",
]);

function normalizeRelativePath(filePath) {
  return relative(REPO_ROOT, filePath).split("\\").join("/");
}

async function collectRepositoryFiles(directoryPath = REPO_ROOT) {
  const entries = await readdir(directoryPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries.sort((left, right) =>
    left.name.localeCompare(right.name),
  )) {
    const entryPath = join(directoryPath, entry.name);
    if (entry.isDirectory()) {
      const relativeDirectoryPath = normalizeRelativePath(entryPath);
      if (
        !SKIPPED_DIRECTORY_NAMES.has(entry.name) &&
        !SKIPPED_RELATIVE_DIRECTORIES.has(relativeDirectoryPath)
      ) {
        files.push(...(await collectRepositoryFiles(entryPath)));
      }
      continue;
    }
    if (entry.isFile()) {
      files.push(entryPath);
    }
  }

  return files;
}

async function collectPrettierFiles() {
  const repositoryFiles = await collectRepositoryFiles();
  const prettierFiles = [];

  for (const filePath of repositoryFiles) {
    const relativePath = normalizeRelativePath(filePath);
    if (SKIPPED_RELATIVE_PATHS.has(relativePath)) {
      continue;
    }

    const fileInfo = await getFileInfo(filePath, {
      ignorePath: PRETTIER_IGNORE_PATH,
      withNodeModules: false,
    });
    if (!fileInfo.ignored && fileInfo.inferredParser !== null) {
      prettierFiles.push(filePath);
    }
  }

  return prettierFiles;
}

async function formatFile(filePath) {
  const source = await readFile(filePath, "utf8");
  const resolvedConfig =
    (await resolveConfig(filePath, { editorconfig: true })) ?? {};
  const formattedSource = await format(source, {
    ...resolvedConfig,
    filepath: filePath,
  });

  return { source, formattedSource };
}

async function writeFormattedFiles() {
  const files = await collectPrettierFiles();
  let changedFiles = 0;

  for (const filePath of files) {
    const { source, formattedSource } = await formatFile(filePath);
    if (formattedSource !== source) {
      await writeFile(filePath, formattedSource, "utf8");
      changedFiles += 1;
    }
  }

  console.log(
    `Prettier write complete: ${files.length} checked, ${changedFiles} changed.`,
  );
}

async function verifyFormattedFiles() {
  const files = await collectPrettierFiles();
  const unformattedPaths = [];

  console.log("Checking formatting...");
  for (const filePath of files) {
    const { source, formattedSource } = await formatFile(filePath);
    if (formattedSource !== source) {
      unformattedPaths.push(normalizeRelativePath(filePath));
    }
  }

  if (unformattedPaths.length > 0) {
    for (const relativePath of unformattedPaths) {
      console.error(`[warn] ${relativePath}`);
    }
    console.error(
      `Prettier check failed: ${unformattedPaths.length} file(s) require formatting.`,
    );
    process.exitCode = 1;
    return;
  }

  console.log(`All ${files.length} matched files use Prettier code style.`);
}

const command = process.argv[2];
if (command === "write") {
  await writeFormattedFiles();
} else if (command === "check") {
  await verifyFormattedFiles();
} else {
  console.error("Usage: node scripts/prettier-repo.mjs <write|check>");
  process.exitCode = 2;
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
