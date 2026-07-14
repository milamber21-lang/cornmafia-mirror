//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: scripts/wooden-engine-watermark.mjs                                                                  ////
//// Language: JS                                                                                               ////
//// Adds and verifies bounded space/tab source watermarks that decode to the Wooden Engine signature.          ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { readdir, readFile, writeFile } from "node:fs/promises";
import { basename, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(SCRIPT_PATH, "..", "..");
const WATERMARK_TEXT = "Wooden Engine";
const MARKER_PREFIX = "WE[";
const MARKER_SUFFIX = "]WE";

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

const SKIPPED_RELATIVE_PATHS = new Set([
  "apps/web/next-env.d.ts",
  "cm_web_full.sql",
  "docs/_db.md",
  "docs/_files.md",
  "docs/_snapshot.md",
]);

const SLASH_COMMENT_EXTENSIONS = new Set([
  ".cjs",
  ".js",
  ".jsx",
  ".mjs",
  ".ts",
  ".tsx",
]);
const HASH_COMMENT_EXTENSIONS = new Set([
  ".bash",
  ".py",
  ".sh",
  ".yaml",
  ".yml",
]);
const HTML_COMMENT_EXTENSIONS = new Set([".md", ".mdx"]);
const SUPPORTED_SPECIAL_BASENAMES = new Set([
  ".dockerignore",
  ".editorconfig",
  ".gitignore",
  ".npmrc",
  ".prettierignore",
  ".tarignore",
  "Makefile",
]);

function normalizeRelativePath(filePath) {
  return relative(REPO_ROOT, filePath).split("\\").join("/");
}

function encodeWatermark(value) {
  const bytes = Buffer.from(value, "utf8");
  let payload = "";

  for (const byte of bytes) {
    const binaryByte = byte.toString(2).padStart(8, "0");
    for (const bit of binaryByte) {
      payload += bit === "1" ? "\t" : " ";
    }
  }

  return payload;
}

function decodeWatermark(payload) {
  if (!/^[\t ]+$/.test(payload) || payload.length % 8 !== 0) {
    return null;
  }

  const bytes = [];
  for (let index = 0; index < payload.length; index += 8) {
    const binaryByte = payload
      .slice(index, index + 8)
      .replaceAll(" ", "0")
      .replaceAll("\t", "1");
    bytes.push(Number.parseInt(binaryByte, 2));
  }

  return Buffer.from(bytes).toString("utf8");
}

const WATERMARK_PAYLOAD = encodeWatermark(WATERMARK_TEXT);

function getCommentStyle(relativePath) {
  const fileBasename = basename(relativePath);
  const extension = extname(fileBasename).toLowerCase();

  if (fileBasename === "Dockerfile" || fileBasename.startsWith("Dockerfile.")) {
    return "hash";
  }
  if (SUPPORTED_SPECIAL_BASENAMES.has(fileBasename)) {
    return "hash";
  }
  if (SLASH_COMMENT_EXTENSIONS.has(extension)) {
    return "slash";
  }
  if (HASH_COMMENT_EXTENSIONS.has(extension)) {
    return "hash";
  }
  if (HTML_COMMENT_EXTENSIONS.has(extension)) {
    return "html";
  }
  if (extension === ".css") {
    return "block";
  }
  if (extension === ".sql") {
    return "sql";
  }

  return null;
}

function markerLineForStyle(style) {
  const hiddenPayload = `${MARKER_PREFIX}${WATERMARK_PAYLOAD}${MARKER_SUFFIX}`;

  switch (style) {
    case "slash":
      return `// ${hiddenPayload}`;
    case "hash":
      return `# ${hiddenPayload}`;
    case "html":
      return `<!-- ${hiddenPayload} -->`;
    case "block":
      return `/* ${hiddenPayload} */`;
    case "sql":
      return `-- ${hiddenPayload}`;
    default:
      throw new Error(`Unsupported comment style: ${String(style)}`);
  }
}

function markerPatternForStyle(style) {
  switch (style) {
    case "slash":
      return /^\/\/ WE\[([\t ]*)\]WE$/;
    case "hash":
      return /^# WE\[([\t ]*)\]WE$/;
    case "html":
      return /^<!-- WE\[([\t ]*)\]WE -->$/;
    case "block":
      return /^\/\* WE\[([\t ]*)\]WE \*\/$/;
    case "sql":
      return /^-- WE\[([\t ]*)\]WE$/;
    default:
      throw new Error(`Unsupported comment style: ${String(style)}`);
  }
}

function isSkippedPath(relativePath) {
  if (SKIPPED_RELATIVE_PATHS.has(relativePath)) {
    return true;
  }

  const fileBasename = basename(relativePath);
  if (
    fileBasename === "package-lock.json" ||
    fileBasename.endsWith(".lock") ||
    fileBasename.startsWith(".env") ||
    fileBasename.endsWith(".env")
  ) {
    return true;
  }

  return false;
}

async function collectEligibleFiles(directoryPath = REPO_ROOT) {
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
        files.push(...(await collectEligibleFiles(entryPath)));
      }
      continue;
    }
    if (!entry.isFile()) {
      continue;
    }

    const relativePath = normalizeRelativePath(entryPath);
    if (isSkippedPath(relativePath) || getCommentStyle(relativePath) === null) {
      continue;
    }
    files.push(entryPath);
  }

  return files;
}

function removeGeneratedMarkers(lines, style) {
  const markerPattern = markerPatternForStyle(style);
  return lines.filter((line) => !markerPattern.test(line));
}

function findHeaderEndIndex(lines) {
  let index = lines[0]?.startsWith("#!") ? 1 : 0;
  while (index < lines.length && lines[index] === "") {
    index += 1;
  }

  const firstLine = lines[index] ?? "";
  if (firstLine.startsWith("/*")) {
    while (index < lines.length) {
      const currentLine = lines[index];
      index += 1;
      if (currentLine.includes("*/")) {
        break;
      }
    }
    return index;
  }
  if (firstLine.startsWith("<!--")) {
    while (index < lines.length) {
      const currentLine = lines[index];
      index += 1;
      if (currentLine.includes("-->")) {
        break;
      }
    }
    return index;
  }

  const lineCommentPrefix = firstLine.startsWith("//")
    ? "//"
    : firstLine.startsWith("#")
      ? "#"
      : firstLine.startsWith("--")
        ? "--"
        : null;

  if (lineCommentPrefix !== null) {
    while (index < lines.length && lines[index].startsWith(lineCommentPrefix)) {
      index += 1;
    }
    return index;
  }

  return lines[0]?.startsWith("#!") ? 1 : 0;
}

function normalizeBlankLinesAroundTopMarker(lines, markerLine) {
  const headerEndIndex = findHeaderEndIndex(lines);
  const beforeMarker = lines.slice(0, headerEndIndex);
  const afterMarker = lines.slice(headerEndIndex);

  while (afterMarker[0] === "") {
    afterMarker.shift();
  }

  return [...beforeMarker, markerLine, "", ...afterMarker];
}

function addMarkersToSource(source, style) {
  const markerLine = markerLineForStyle(style);
  const normalizedSource = source
    .replaceAll("\r\n", "\n")
    .replaceAll("\r", "\n");
  const originalLines = normalizedSource.endsWith("\n")
    ? normalizedSource.slice(0, -1).split("\n")
    : normalizedSource.split("\n");
  const linesWithoutMarkers = removeGeneratedMarkers(originalLines, style);
  let lines = normalizeBlankLinesAroundTopMarker(
    linesWithoutMarkers,
    markerLine,
  );

  while (lines.at(-1) === "") {
    lines.pop();
  }
  lines.push("", markerLine);

  return `${lines.join("\n")}\n`;
}

function verifySource(relativePath, source, style) {
  const errors = [];
  const markerLine = markerLineForStyle(style);
  const markerPattern = markerPatternForStyle(style);
  const normalizedSource = source
    .replaceAll("\r\n", "\n")
    .replaceAll("\r", "\n");
  const lines = normalizedSource.endsWith("\n")
    ? normalizedSource.slice(0, -1).split("\n")
    : normalizedSource.split("\n");
  const markerIndexes = [];

  for (const [index, line] of lines.entries()) {
    const match = markerPattern.exec(line);
    if (match === null) {
      continue;
    }
    markerIndexes.push(index);
    if (line !== markerLine) {
      errors.push(
        `${relativePath}: marker ${index + 1} has an unexpected payload or wrapper.`,
      );
      continue;
    }
    if (match[1].length !== WATERMARK_PAYLOAD.length) {
      errors.push(
        `${relativePath}: marker ${index + 1} has an invalid payload length.`,
      );
    }
    if (decodeWatermark(match[1]) !== WATERMARK_TEXT) {
      errors.push(
        `${relativePath}: marker ${index + 1} does not decode to the expected signature.`,
      );
    }
  }

  if (markerIndexes.length !== 2) {
    errors.push(
      `${relativePath}: expected exactly 2 markers, found ${markerIndexes.length}.`,
    );
    return errors;
  }

  const linesWithoutMarkers = lines.filter((line) => !markerPattern.test(line));
  const expectedTopIndex = findHeaderEndIndex(linesWithoutMarkers);
  if (markerIndexes[0] !== expectedTopIndex) {
    errors.push(
      `${relativePath}: top marker is on line ${markerIndexes[0] + 1}; expected line ${expectedTopIndex + 1}.`,
    );
  }

  let lastContentIndex = lines.length - 1;
  while (lastContentIndex >= 0 && lines[lastContentIndex] === "") {
    lastContentIndex -= 1;
  }
  if (markerIndexes[1] !== lastContentIndex) {
    errors.push(
      `${relativePath}: final marker is not the last non-empty line.`,
    );
  }

  if (!normalizedSource.endsWith("\n")) {
    errors.push(`${relativePath}: file is missing its final newline.`);
  }

  return errors;
}

async function addWatermarks() {
  const files = await collectEligibleFiles();
  let changedFiles = 0;

  for (const filePath of files) {
    const relativePath = normalizeRelativePath(filePath);
    const style = getCommentStyle(relativePath);
    if (style === null) {
      continue;
    }

    const source = await readFile(filePath, "utf8");
    const watermarkedSource = addMarkersToSource(source, style);
    if (watermarkedSource !== source) {
      await writeFile(filePath, watermarkedSource, "utf8");
      changedFiles += 1;
    }
  }

  console.log(
    `Wooden Engine watermark add complete: ${files.length} eligible files, ${changedFiles} changed.`,
  );
}

async function verifyWatermarks() {
  const files = await collectEligibleFiles();
  const errors = [];

  for (const filePath of files) {
    const relativePath = normalizeRelativePath(filePath);
    const style = getCommentStyle(relativePath);
    if (style === null) {
      continue;
    }

    const source = await readFile(filePath, "utf8");
    errors.push(...verifySource(relativePath, source, style));
  }

  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    console.error(
      `Wooden Engine watermark verification failed with ${errors.length} error(s).`,
    );
    process.exitCode = 1;
    return;
  }

  console.log(
    `Wooden Engine watermark verification passed: ${files.length} files, ${WATERMARK_PAYLOAD.length}-bit payload.`,
  );
}

function printUsage() {
  console.error("Usage: node scripts/wooden-engine-watermark.mjs <add|verify>");
}

const command = process.argv[2];
if (command === "add") {
  await addWatermarks();
} else if (command === "verify") {
  await verifyWatermarks();
} else {
  printUsage();
  process.exitCode = 2;
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
