//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: scripts/game-data-import-manual.mjs                                                                ////
//// Language: JS                                                                                               ////
//// Imports every JSON file plus source media and prebuilt image variants from the shared Manual source root.   ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, extname, join, relative, resolve, sep } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(SCRIPT_PATH, "..", "..");
const WEB_PACKAGE_PATH = join(REPO_ROOT, "apps", "web", "package.json");

const DEFAULT_PATCHES_ROOT_REL_PATH = "data/gamedata/patches";
const DEFAULT_MANUAL_ROOT_REL_PATH = "data/gamedata/patches/Manual";
const SAFE_RELATIVE_PATH_PATTERN = /(^\/|(^|\/)[.][.](\/|$))/;
const MEDIA_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const JSON_EXTENSION = ".json";
const MANUAL_DERIVATIVE_VARIANT_CODES = new Set([
  "icon_64",
  "icon_128",
  "icon_256",
  "detail_1024",
]);
const MANUAL_MEDIA_PATH_PATTERN =
  /(?<path>(?:[.][/]?)?(?:Images\/(?:original|icon_64|Icon_64|icon_128|icon_256|detail_1024)|Locations)\/[^"'\n\r\t,;)]*?\.(?:png|jpg|jpeg|webp))/gi;
const MEDIA_CONTEXT_KEYS = new Set([
  "icon",
  "icons",
  "image",
  "images",
  "media",
  "picture",
  "thumbnail",
  "texture",
  "visual",
  "variants",
]);

function loadPgClient() {
  try {
    const requireFromWebApp = createRequire(pathToFileURL(WEB_PACKAGE_PATH));
    return requireFromWebApp("pg").Client;
  } catch (error) {
    throw new Error(
      `Could not load the pg package from apps/web. Run npm --prefix apps/web install first. ${getErrorMessage(error)}`,
    );
  }
}

function printUsage() {
  console.log(`Usage:
  node scripts/game-data-import-manual.mjs --patch <patch_code> [options]

Options:
  --patch <patch_code>          Required target patch code, for example 0.4.2.
  --patches-root <path>         Patch root directory. Default: ${DEFAULT_PATCHES_ROOT_REL_PATH}
  --manual-root <path>          Parent Manual source root. Default: ${DEFAULT_MANUAL_ROOT_REL_PATH}
  --manifest <path>             Optional compatibility hint only. The importer now scans every Manual JSON file.
  --actor-discord-id <id>       Optional Discord ID for the operator/admin that triggered the import.
  --env-file <path>             Optional env file to load before connecting. Default: .env when present.
  --database-url <url>          Optional owner database URL override.
  --skip-env-file               Do not load .env.
  --override-env-file           Let values from the env file replace already-set process env values.
  --help                        Show this help.

Database URL resolution order:
  1. --database-url
  2. GAME_DATA_DATABASE_URL
  3. Built from POSTGRES_USER, POSTGRES_PASSWORD, CM_POSTGRES_HOST, CM_POSTGRES_PORT, POSTGRES_DB
  4. CM_OWNER_DATABASE_URL

This importer writes only to existing game_data import tables. It creates a completed Manual scan batch for every
JSON file and source/original media file under the Manual root, then creates a completed media_derivatives batch that
registers prebuilt Manual variants found under Images/icon_64, Images/Icon_64, Images/icon_128, Images/icon_256, and
Images/detail_1024. It does not convert images and does not promote data into web_game canonical tables.

Manual image manifests are detected by JSON shape, not by file name. A JSON object with an entries array, or a JSON
array, is treated as a manifest when the entries look like image mapping rows with either image_key + variants
or image_key + icon.variants fields. DT_Manual_Classification_Icons uses the icon.variants shape and is flattened
to the same row payload contract as the older manifest format. All other JSON files are imported as normal game-data
source rows.
`);
}

function parseArgs(argv) {
  const options = {
    patchCode: "",
    patchesRootRelPath: DEFAULT_PATCHES_ROOT_REL_PATH,
    manualRootRelPath: DEFAULT_MANUAL_ROOT_REL_PATH,
    manifestRelPath: null,
    actorDiscordId: null,
    envFileRelPath: ".env",
    databaseUrl: null,
    loadEnvFile: true,
    overrideEnvFile: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    }

    if (arg === "--skip-env-file") {
      options.loadEnvFile = false;
      continue;
    }

    if (arg === "--override-env-file") {
      options.overrideEnvFile = true;
      continue;
    }

    const valueArgNames = new Set([
      "--patch",
      "--patches-root",
      "--manual-root",
      "--manifest",
      "--actor-discord-id",
      "--env-file",
      "--database-url",
    ]);

    if (!valueArgNames.has(arg)) {
      throw new Error(`Unknown argument: ${arg}`);
    }

    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for ${arg}`);
    }

    index += 1;

    if (arg === "--patch") {
      options.patchCode = value.trim();
      continue;
    }

    if (arg === "--patches-root") {
      options.patchesRootRelPath = normalizeRelPath(value.trim());
      continue;
    }

    if (arg === "--manual-root") {
      options.manualRootRelPath = normalizeRelPath(value.trim());
      continue;
    }

    if (arg === "--manifest") {
      options.manifestRelPath = normalizeRelPath(value.trim());
      continue;
    }

    if (arg === "--actor-discord-id") {
      options.actorDiscordId = value.trim();
      continue;
    }

    if (arg === "--env-file") {
      options.envFileRelPath = value.trim();
      continue;
    }

    if (arg === "--database-url") {
      options.databaseUrl = value.trim();
    }
  }

  if (!options.patchCode) {
    throw new Error("Missing required --patch value.");
  }

  assertSafeRelPath(options.patchCode, "patch code");
  assertSafeRelPath(options.patchesRootRelPath, "patches root");
  assertSafeRelPath(options.manualRootRelPath, "manual root");
  if (options.manifestRelPath) {
    assertSafeRelPath(options.manifestRelPath, "manifest path");
  }

  return options;
}

function loadEnvFile(relativePath, overrideExisting) {
  const absolutePath = resolve(REPO_ROOT, relativePath);
  if (!existsSync(absolutePath)) {
    return { loaded: false, absolutePath, valueCount: 0 };
  }

  const parsedValues = parseEnvFile(readFileSync(absolutePath, "utf8"));
  let valueCount = 0;
  for (const [key, rawValue] of parsedValues) {
    const value = expandEnvValue(rawValue, {
      ...process.env,
      ...Object.fromEntries(parsedValues),
    });
    if (
      overrideExisting ||
      !Object.prototype.hasOwnProperty.call(process.env, key)
    ) {
      process.env[key] = value;
      valueCount += 1;
    }
  }

  return { loaded: true, absolutePath, valueCount };
}

function parseEnvFile(content) {
  const values = [];
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const equalsIndex = findUnquotedEquals(trimmed);
    if (equalsIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, equalsIndex).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      continue;
    }

    const rawValue = stripEnvInlineComment(
      trimmed.slice(equalsIndex + 1).trim(),
    );
    values.push([key, unquoteEnvValue(rawValue)]);
  }

  return values;
}

function findUnquotedEquals(value) {
  let quote = null;
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if ((char === '"' || char === "'") && value[index - 1] !== "\\") {
      quote = quote === char ? null : quote || char;
      continue;
    }

    if (char === "=" && quote === null) {
      return index;
    }
  }

  return -1;
}

function stripEnvInlineComment(value) {
  let quote = null;
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if ((char === '"' || char === "'") && value[index - 1] !== "\\") {
      quote = quote === char ? null : quote || char;
      continue;
    }

    if (
      char === "#" &&
      quote === null &&
      (index === 0 || /\s/.test(value[index - 1]))
    ) {
      return value.slice(0, index).trimEnd();
    }
  }

  return value;
}

function expandEnvValue(value, values) {
  return value.replace(/\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g, (_match, key) => {
    const replacement = values[key];
    return typeof replacement === "string" ? replacement : "";
  });
}

function unquoteEnvValue(value) {
  if (value.length < 2) {
    return value;
  }

  const first = value[0];
  const last = value[value.length - 1];
  if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
    return value.slice(1, -1);
  }

  return value;
}

function resolveDatabaseUrl(explicitUrl) {
  if (explicitUrl) {
    return explicitUrl;
  }

  if (process.env.GAME_DATA_DATABASE_URL) {
    return process.env.GAME_DATA_DATABASE_URL;
  }

  const user = process.env.POSTGRES_USER;
  const password = process.env.POSTGRES_PASSWORD;
  const database = process.env.POSTGRES_DB;
  const host =
    process.env.CM_POSTGRES_HOST ||
    process.env.POSTGRES_HOST_BIND ||
    "127.0.0.1";
  const port =
    process.env.CM_POSTGRES_PORT ||
    process.env.POSTGRES_EXTERNAL_PORT ||
    "5432";

  if (user && password && database) {
    return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
  }

  if (process.env.CM_OWNER_DATABASE_URL) {
    return process.env.CM_OWNER_DATABASE_URL;
  }

  throw new Error(
    "Missing database connection. Set GAME_DATA_DATABASE_URL, CM_OWNER_DATABASE_URL, or POSTGRES_USER/POSTGRES_PASSWORD/POSTGRES_DB.",
  );
}

function normalizeRelPath(path) {
  return path
    .replace(/\\/g, "/")
    .replace(/^\.\//, "")
    .replace(/^\/+/, "")
    .replace(/\/+$/g, "");
}

function assertSafeRelPath(path, label) {
  if (!path || SAFE_RELATIVE_PATH_PATTERN.test(path.replace(/\\/g, "/"))) {
    throw new Error(`Unsafe ${label}: ${path}`);
  }
}

function assertInsideRoot(path, root, label) {
  const relativePath = relative(root, path).split(sep).join("/");
  if (
    relativePath.startsWith("../") ||
    relativePath === ".." ||
    relativePath.startsWith("/")
  ) {
    throw new Error(`${label} escapes root: ${path}`);
  }
}

function sha256(bufferOrString) {
  return createHash("sha256").update(bufferOrString).digest("hex");
}

function stableStringify(value) {
  return JSON.stringify(sortJsonValue(value));
}

function sortJsonValue(value) {
  if (Array.isArray(value)) {
    return value.map((item) => sortJsonValue(item));
  }

  if (isPlainObject(value)) {
    const sorted = {};
    for (const key of Object.keys(value).sort()) {
      sorted[key] = sortJsonValue(value[key]);
    }
    return sorted;
  }

  return value;
}

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function walkFiles(directory) {
  const rows = [];

  for (const dirent of readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = join(directory, dirent.name);

    if (dirent.isDirectory()) {
      rows.push(...walkFiles(absolutePath));
      continue;
    }

    if (dirent.isFile()) {
      rows.push(absolutePath);
    }
  }

  return rows.sort((left, right) => left.localeCompare(right));
}

function fileInfo(absolutePath, rootPath, roleOverride = null) {
  const relPath = normalizeRelPath(
    relative(rootPath, absolutePath).split(sep).join("/"),
  );
  const ext = extname(absolutePath).toLowerCase();
  const stem = basename(absolutePath, ext);
  const buffer = readFileSync(absolutePath);
  const stats = statSync(absolutePath);

  return {
    absolutePath,
    relPath,
    name: basename(absolutePath),
    stem,
    ext: ext.replace(/^\./, ""),
    roleCode:
      roleOverride ||
      (ext === JSON_EXTENSION
        ? "json"
        : MEDIA_EXTENSIONS.has(ext)
          ? "media"
          : "other"),
    mimeType: detectMimeType(ext),
    sizeBytes: stats.size,
    hash: sha256(buffer),
    buffer,
  };
}

function detectMimeType(ext) {
  if (ext === ".json") {
    return "application/json";
  }

  if (ext === ".png") {
    return "image/png";
  }

  if (ext === ".jpg" || ext === ".jpeg") {
    return "image/jpeg";
  }

  if (ext === ".webp") {
    return "image/webp";
  }

  return null;
}

function readImageDimensions(buffer, ext) {
  if (ext === "png") {
    return readPngDimensions(buffer);
  }

  if (ext === "jpg" || ext === "jpeg") {
    return readJpegDimensions(buffer);
  }

  if (ext === "webp") {
    return readWebpDimensions(buffer);
  }

  return { width: null, height: null };
}

function readPngDimensions(buffer) {
  if (buffer.length < 24) {
    return { width: null, height: null };
  }

  const signature = buffer.subarray(0, 8).toString("hex");
  if (signature !== "89504e470d0a1a0a") {
    return { width: null, height: null };
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function readJpegDimensions(buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return { width: null, height: null };
  }

  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = buffer[offset + 1];
    if (marker === 0xd9 || marker === 0xda) {
      break;
    }

    const size = buffer.readUInt16BE(offset + 2);
    if (size < 2) {
      break;
    }

    if (
      marker >= 0xc0 &&
      marker <= 0xcf &&
      ![0xc4, 0xc8, 0xcc].includes(marker)
    ) {
      return {
        width: buffer.readUInt16BE(offset + 7),
        height: buffer.readUInt16BE(offset + 5),
      };
    }

    offset += 2 + size;
  }

  return { width: null, height: null };
}

function readWebpDimensions(buffer) {
  if (
    buffer.length < 30 ||
    buffer.subarray(0, 4).toString("ascii") !== "RIFF" ||
    buffer.subarray(8, 12).toString("ascii") !== "WEBP"
  ) {
    return { width: null, height: null };
  }

  const chunk = buffer.subarray(12, 16).toString("ascii");
  if (chunk === "VP8X" && buffer.length >= 30) {
    return {
      width: 1 + buffer.readUIntLE(24, 3),
      height: 1 + buffer.readUIntLE(27, 3),
    };
  }

  if (chunk === "VP8 " && buffer.length >= 30) {
    return {
      width: buffer.readUInt16LE(26) & 0x3fff,
      height: buffer.readUInt16LE(28) & 0x3fff,
    };
  }

  if (chunk === "VP8L" && buffer.length >= 25) {
    const bits = buffer.readUInt32LE(21);
    return {
      width: (bits & 0x3fff) + 1,
      height: ((bits >> 14) & 0x3fff) + 1,
    };
  }

  return { width: null, height: null };
}

function parseSourceRows(jsonValue, fallbackStem) {
  const rows = [];
  const tables = Array.isArray(jsonValue) ? jsonValue : [jsonValue];
  const seenSourceRowNames = new Map();

  for (let tableIndex = 0; tableIndex < tables.length; tableIndex += 1) {
    const table = tables[tableIndex];

    if (isPlainObject(table) && isPlainObject(table.Rows)) {
      const sourceStructType = extractSourceStructType(table);
      let rowIndex = 0;
      for (const [sourceRowName, payload] of Object.entries(table.Rows)) {
        rows.push({
          sourceRowName: uniqueSourceRowName(sourceRowName, seenSourceRowNames),
          sourceRowIndex: rowIndex,
          sourceStructType,
          sourceIdentifierValue: extractSourceIdentifierValue(payload),
          payload,
        });
        rowIndex += 1;
      }
      continue;
    }

    if (Array.isArray(table)) {
      for (let rowIndex = 0; rowIndex < table.length; rowIndex += 1) {
        const payload = table[rowIndex];
        rows.push({
          sourceRowName: uniqueSourceRowName(
            `${fallbackStem}_${rowIndex}`,
            seenSourceRowNames,
          ),
          sourceRowIndex: rowIndex,
          sourceStructType: null,
          sourceIdentifierValue: extractSourceIdentifierValue(payload),
          payload,
        });
      }
      continue;
    }

    const sourceRowName =
      tableIndex === 0 ? fallbackStem : `${fallbackStem}_${tableIndex}`;
    rows.push({
      sourceRowName: uniqueSourceRowName(sourceRowName, seenSourceRowNames),
      sourceRowIndex: tableIndex,
      sourceStructType: extractSourceStructType(table),
      sourceIdentifierValue: extractSourceIdentifierValue(table),
      payload: table,
    });
  }

  return rows;
}

function uniqueSourceRowName(sourceRowName, seenSourceRowNames) {
  const cleanSourceRowName = String(sourceRowName || "").trim();
  const baseSourceRowName = cleanSourceRowName || "row";
  const seenCount = seenSourceRowNames.get(baseSourceRowName) || 0;
  seenSourceRowNames.set(baseSourceRowName, seenCount + 1);

  if (seenCount === 0) {
    return baseSourceRowName;
  }

  return `${baseSourceRowName}_${seenCount}`;
}

function extractSourceStructType(table) {
  if (!isPlainObject(table)) {
    return null;
  }

  const properties = table.Properties;
  if (!isPlainObject(properties)) {
    return null;
  }

  const rowStruct = properties.RowStruct;
  if (!isPlainObject(rowStruct)) {
    return null;
  }

  if (typeof rowStruct.ObjectName === "string" && rowStruct.ObjectName.trim()) {
    return rowStruct.ObjectName.trim();
  }

  if (typeof rowStruct.ObjectPath === "string" && rowStruct.ObjectPath.trim()) {
    return rowStruct.ObjectPath.trim();
  }

  return null;
}

function extractSourceIdentifierValue(payload) {
  if (!isPlainObject(payload)) {
    return null;
  }

  for (const key of [
    "DatatableIdentifier",
    "DataTableIdentifier",
    "Identifier",
    "Id",
    "ID",
    "Name",
    "DisplayName",
    "image_key",
  ]) {
    const value = payload[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function parseManualJsonRows(parsed, fallbackStem) {
  const manifestEntries = manifestEntriesFromJson(parsed);
  if (manifestEntries) {
    const seenSourceRowNames = new Map();
    const rows = manifestEntries.map((entry, index) => {
      const normalizedEntry = normalizeManifestEntry(entry);
      const imageKey =
        typeof normalizedEntry.image_key === "string" &&
        normalizedEntry.image_key.trim()
          ? normalizedEntry.image_key.trim()
          : `${fallbackStem}_${index}`;
      return {
        sourceRowName: uniqueSourceRowName(imageKey, seenSourceRowNames),
        sourceRowIndex: index,
        sourceStructType: "manual_riseopedia_image_manifest_entry",
        sourceIdentifierValue: imageKey,
        payload: normalizedEntry,
      };
    });

    return {
      kindCode: "manifest",
      rows,
      metadata: { manifestEntryCount: rows.length },
    };
  }

  return {
    kindCode: "json",
    rows: parseSourceRows(parsed, fallbackStem),
    metadata: {},
  };
}

function manifestEntriesFromJson(parsed) {
  const entries = Array.isArray(parsed)
    ? parsed
    : isPlainObject(parsed) && Array.isArray(parsed.entries)
      ? parsed.entries
      : null;
  if (!entries || entries.length === 0) {
    return null;
  }

  const manifestLikeEntryCount = entries.filter((entry) =>
    isManifestLikeEntry(entry),
  ).length;
  if (manifestLikeEntryCount === 0) {
    return null;
  }

  return entries;
}

function isManifestLikeEntry(entry) {
  if (!isPlainObject(entry) || typeof entry.image_key !== "string") {
    return false;
  }

  return (
    isPlainObject(entry.variants) ||
    (isPlainObject(entry.icon) && isPlainObject(entry.icon.variants))
  );
}

function normalizeManifestEntry(entry) {
  if (!isPlainObject(entry)) {
    return { value: entry };
  }

  const iconPayload = isPlainObject(entry.icon) ? entry.icon : null;
  const rawVariants = isPlainObject(entry.variants)
    ? entry.variants
    : iconPayload && isPlainObject(iconPayload.variants)
      ? iconPayload.variants
      : null;

  if (!rawVariants) {
    return { ...entry };
  }

  const variants = {};
  for (const [rawVariantCode, rawRelPath] of Object.entries(rawVariants)) {
    if (typeof rawRelPath !== "string" || !rawRelPath.trim()) {
      continue;
    }

    const variantCode = normalizeVariantCode(rawVariantCode);
    const relPath = normalizeRelPath(rawRelPath.trim());
    assertSafeRelPath(
      relPath,
      `variant path for ${entry.image_key || "manual image"}/${variantCode}`,
    );
    variants[variantCode] = relPath;
  }

  if (!iconPayload) {
    return { ...entry, variants };
  }

  const flattenedEntry = {
    ...entry,
    variants,
    pair_status_code:
      typeof entry.pair_status_code === "string"
        ? entry.pair_status_code
        : iconPayload.pair_status_code,
    pair_note:
      typeof entry.pair_note === "string"
        ? entry.pair_note
        : iconPayload.pair_note,
    source_stem:
      typeof entry.source_stem === "string"
        ? entry.source_stem
        : iconPayload.matched_stem,
    source_label:
      typeof entry.source_label === "string"
        ? entry.source_label
        : entry.canonical_filename_stem,
  };

  return flattenedEntry;
}

function extractManualMediaReferences(rowPayload, mediaLookup) {
  const references = [];
  const seen = new Set();
  const rowRoleCode = mediaRoleFromRowPayload(rowPayload);

  function addReference(rawPath, jsonPath) {
    const candidateRelPath = normalizeRelPath(rawPath);
    assertSafeRelPath(candidateRelPath, "manual media reference");
    if (!hasMediaExtension(candidateRelPath)) {
      return;
    }

    const resolvedTarget = targetSourceMediaRelPathFromReference(
      candidateRelPath,
      mediaLookup,
    );
    const targetMediaRelPath =
      resolvedTarget.targetMediaRelPath || candidateRelPath;
    const key = `${rowRoleCode}\u0000${targetMediaRelPath.toLowerCase()}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);

    references.push({
      refRoleCode: rowRoleCode,
      sourceRefValue: candidateRelPath,
      normalizedRefValue: targetMediaRelPath,
      targetMediaRelPath,
      jsonPath,
      derivedReferenceRelPath: resolvedTarget.derivedReferenceRelPath,
    });
  }

  function walk(value, path) {
    if (typeof value === "string") {
      for (const candidatePath of mediaCandidatePathsFromString(value)) {
        addReference(candidatePath, path.join("."));
      }
      return;
    }

    if (Array.isArray(value)) {
      for (let index = 0; index < value.length; index += 1) {
        walk(value[index], [...path, String(index)]);
      }
      return;
    }

    if (isPlainObject(value)) {
      for (const [key, nestedValue] of Object.entries(value)) {
        walk(nestedValue, [...path, key]);
      }
    }
  }

  walk(rowPayload, []);
  return references;
}

function mediaCandidatePathsFromString(value) {
  const trimmed = value.trim().replace(/\\/g, "/");
  const paths = [];
  const seen = new Set();

  function addPath(rawPath) {
    const relPath = normalizeRelPath(rawPath.trim());
    if (!relPath || !hasMediaExtension(relPath)) {
      return;
    }

    if (!isManualMediaRelPath(relPath)) {
      return;
    }

    const key = relPath.toLowerCase();
    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    paths.push(relPath);
  }

  if (isManualMediaRelPath(trimmed) && hasMediaExtension(trimmed)) {
    addPath(trimmed);
  }

  MANUAL_MEDIA_PATH_PATTERN.lastIndex = 0;
  let match = MANUAL_MEDIA_PATH_PATTERN.exec(trimmed);
  while (match) {
    const embeddedPath = match.groups?.path;
    if (embeddedPath) {
      addPath(embeddedPath);
    }
    match = MANUAL_MEDIA_PATH_PATTERN.exec(trimmed);
  }

  return paths;
}

function mediaRoleFromRowPayload(rowPayload) {
  if (
    isPlainObject(rowPayload) &&
    typeof rowPayload.media_role_code === "string" &&
    rowPayload.media_role_code.trim()
  ) {
    return rowPayload.media_role_code.trim();
  }

  if (
    isPlainObject(rowPayload) &&
    typeof rowPayload.target_level_code === "string" &&
    rowPayload.target_level_code.trim()
  ) {
    return "navigation";
  }

  if (
    isPlainObject(rowPayload) &&
    typeof rowPayload.image_key === "string" &&
    rowPayload.image_key.trim()
  ) {
    return "navigation";
  }

  return "manual_media";
}

function hasMediaExtension(relPath) {
  const lower = relPath.toLowerCase();
  return [...MEDIA_EXTENSIONS].some((extension) => lower.endsWith(extension));
}

function isManualMediaRelPath(relPath) {
  const normalized = normalizeRelPath(relPath);
  return (
    normalized.startsWith("Images/") || normalized.startsWith("Locations/")
  );
}

function manualImagePathParts(relPath) {
  const normalized = normalizeRelPath(relPath);
  const match = /^Images\/([^/]+)\/(.+)$/i.exec(normalized);
  if (!match) {
    return null;
  }

  return {
    variantCode: normalizeVariantCode(match[1]),
    suffixRelPath: match[2],
  };
}

function normalizeVariantCode(rawVariantCode) {
  const variantCode = String(rawVariantCode || "")
    .trim()
    .toLowerCase();
  if (variantCode === "icon64") {
    return "icon_64";
  }

  if (variantCode === "icon128") {
    return "icon_128";
  }

  if (variantCode === "icon256") {
    return "icon_256";
  }

  return variantCode;
}

function imageSuffixKey(relPath) {
  const normalized = normalizeRelPath(relPath);
  const extension = extname(normalized);
  const withoutExtension = extension
    ? normalized.slice(0, -extension.length)
    : normalized;
  return withoutExtension.toLowerCase();
}

function isManualDerivativeMediaFile(file) {
  const parts = manualImagePathParts(file.relPath);
  return Boolean(
    parts && MANUAL_DERIVATIVE_VARIANT_CODES.has(parts.variantCode),
  );
}

function isManualSourceMediaFile(file) {
  return file.roleCode === "media" && !isManualDerivativeMediaFile(file);
}

function buildMediaLookup(sourceMediaFiles) {
  const byRelPath = new Map();
  const byLowerRelPath = new Map();
  const originalBySuffixKey = new Map();

  for (const file of sourceMediaFiles) {
    byRelPath.set(file.relPath, file);
    const lowerRelPath = file.relPath.toLowerCase();
    const lowerRows = byLowerRelPath.get(lowerRelPath) || [];
    lowerRows.push(file);
    byLowerRelPath.set(lowerRelPath, lowerRows);

    const parts = manualImagePathParts(file.relPath);
    if (parts && parts.variantCode === "original") {
      const key = imageSuffixKey(parts.suffixRelPath);
      const originalRows = originalBySuffixKey.get(key) || [];
      originalRows.push(file);
      originalBySuffixKey.set(key, originalRows);
    }
  }

  return { byRelPath, byLowerRelPath, originalBySuffixKey };
}

function targetSourceMediaRelPathFromReference(candidateRelPath, mediaLookup) {
  const exactSourceFile = mediaLookup.byRelPath.get(candidateRelPath);
  if (exactSourceFile) {
    return {
      targetMediaRelPath: exactSourceFile.relPath,
      derivedReferenceRelPath: null,
    };
  }

  const caseMatches =
    mediaLookup.byLowerRelPath.get(candidateRelPath.toLowerCase()) || [];
  if (caseMatches.length === 1) {
    return {
      targetMediaRelPath: caseMatches[0].relPath,
      derivedReferenceRelPath: null,
    };
  }

  const parts = manualImagePathParts(candidateRelPath);
  if (parts && MANUAL_DERIVATIVE_VARIANT_CODES.has(parts.variantCode)) {
    const originalMatches =
      mediaLookup.originalBySuffixKey.get(
        imageSuffixKey(parts.suffixRelPath),
      ) || [];
    if (originalMatches.length === 1) {
      return {
        targetMediaRelPath: originalMatches[0].relPath,
        derivedReferenceRelPath: candidateRelPath,
      };
    }
  }

  return { targetMediaRelPath: null, derivedReferenceRelPath: null };
}

function manualDerivativeRows(derivativeMediaFiles, mediaLookup) {
  const rows = [];
  const skipped = [];
  const seen = new Set();

  for (const derivativeFile of derivativeMediaFiles) {
    const parts = manualImagePathParts(derivativeFile.relPath);
    if (!parts || !MANUAL_DERIVATIVE_VARIANT_CODES.has(parts.variantCode)) {
      continue;
    }

    const originalMatches =
      mediaLookup.originalBySuffixKey.get(
        imageSuffixKey(parts.suffixRelPath),
      ) || [];
    if (originalMatches.length !== 1) {
      skipped.push({
        variantCode: parts.variantCode,
        derivedRelPath: derivativeFile.relPath,
        reasonCode:
          originalMatches.length === 0
            ? "manual_original_missing"
            : "manual_original_ambiguous",
        message:
          originalMatches.length === 0
            ? `Manual derivative has no matching Images/original source: ${derivativeFile.relPath}`
            : `Manual derivative matched multiple Images/original sources: ${derivativeFile.relPath}`,
      });
      continue;
    }

    const originalFile = originalMatches[0];
    const key = `${originalFile.relPath}\u0000${parts.variantCode}`;
    if (seen.has(key)) {
      skipped.push({
        variantCode: parts.variantCode,
        derivedRelPath: derivativeFile.relPath,
        reasonCode: "manual_derivative_duplicate",
        message: `Manual derivative duplicate for source ${originalFile.relPath} and variant ${parts.variantCode}: ${derivativeFile.relPath}`,
      });
      continue;
    }
    seen.add(key);

    rows.push({
      importSourceRelPath: originalFile.relPath,
      variantCode: parts.variantCode,
      derivedRelPath: derivativeFile.relPath,
      derivedFile: derivativeFile,
    });
  }

  return { rows, skipped };
}

async function insertMessage(client, message) {
  const result = await client.query(
    `INSERT INTO game_data.import_messages_f(import_batch_id,
											 patch_id,
											 severity_code,
											 message_code,
											 message_text,
											 import_file_id,
											 import_row_id,
											 import_media_file_id,
											 import_media_derivative_id,
											 source_rel_path,
											 source_row_name,
											 context_json)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb)
		 RETURNING import_message_id`,
    [
      message.importBatchId,
      message.patchId,
      message.severityCode,
      message.messageCode,
      message.messageText,
      message.importFileId || null,
      message.importRowId || null,
      message.importMediaFileId || null,
      message.importMediaDerivativeId || null,
      message.sourceRelPath || null,
      message.sourceRowName || null,
      JSON.stringify(message.context || {}),
    ],
  );

  return result.rows[0].import_message_id;
}

async function insertImportFile(
  client,
  importBatchId,
  patchId,
  file,
  parseStatusCode,
  rowCount,
  metadata,
  roleCodeOverride = null,
) {
  const result = await client.query(
    `INSERT INTO game_data.import_files_f(import_batch_id,
										 patch_id,
										 source_rel_path,
										 source_file_name,
										 source_file_stem,
										 source_file_ext,
										 file_role_code,
										 mime_type,
										 file_size_bytes,
										 file_hash_sha256,
										 parse_status_code,
										 row_count,
										 metadata_json)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb)
		 RETURNING import_file_id`,
    [
      importBatchId,
      patchId,
      file.relPath,
      file.name,
      file.stem,
      file.ext,
      roleCodeOverride || file.roleCode,
      file.mimeType,
      file.sizeBytes,
      file.hash,
      parseStatusCode,
      rowCount,
      JSON.stringify(metadata || {}),
    ],
  );

  return result.rows[0].import_file_id;
}

async function insertImportRow(
  client,
  importBatchId,
  patchId,
  importFileId,
  sourceRow,
) {
  const payloadString = stableStringify(sourceRow.payload);
  const result = await client.query(
    `INSERT INTO game_data.import_rows_f(import_batch_id,
									 patch_id,
									 import_file_id,
									 source_row_name,
									 source_row_index,
									 source_struct_type,
									 source_identifier_value,
									 source_payload_json,
									 source_payload_hash_sha256,
									 row_change_code,
									 row_status_code)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, 'unknown', 'parsed')
		 RETURNING import_row_id`,
    [
      importBatchId,
      patchId,
      importFileId,
      sourceRow.sourceRowName,
      sourceRow.sourceRowIndex,
      sourceRow.sourceStructType,
      sourceRow.sourceIdentifierValue,
      JSON.stringify(sourceRow.payload),
      sha256(payloadString),
    ],
  );

  return result.rows[0].import_row_id;
}

async function insertImportMediaFile(
  client,
  importBatchId,
  patchId,
  importFileId,
  mediaFile,
) {
  const dimensions = readImageDimensions(mediaFile.buffer, mediaFile.ext);
  const result = await client.query(
    `INSERT INTO game_data.import_media_files_f(import_batch_id,
											 patch_id,
											 import_file_id,
											 source_rel_path,
											 source_format_code,
											 source_width_px,
											 source_height_px,
											 source_size_bytes,
											 source_hash_sha256,
											 media_status_code,
											 metadata_json)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'found', $10::jsonb)
		 RETURNING import_media_file_id`,
    [
      importBatchId,
      patchId,
      importFileId,
      mediaFile.relPath,
      mediaFile.ext,
      dimensions.width,
      dimensions.height,
      mediaFile.sizeBytes,
      mediaFile.hash,
      JSON.stringify({
        mimeType: mediaFile.mimeType,
        sourceRootCode: "manual",
      }),
    ],
  );

  return result.rows[0].import_media_file_id;
}

async function insertImportRowRef(client, row) {
  await client.query(
    `INSERT INTO game_data.import_row_refs_f(import_batch_id,
										 patch_id,
										 import_row_id,
										 ref_kind_code,
										 ref_role_code,
										 source_ref_value,
										 normalized_ref_value,
										 target_source_file_code,
										 target_source_row_name,
										 target_media_rel_path,
										 resolution_status_code,
										 resolved_import_row_id,
										 resolved_import_media_file_id,
										 message,
										 metadata_json)
		 VALUES ($1, $2, $3, 'media', $4, $5, $6, NULL, NULL, $7, $8, NULL, $9, $10, $11::jsonb)`,
    [
      row.importBatchId,
      row.patchId,
      row.importRowId,
      row.refRoleCode,
      row.sourceRefValue,
      row.normalizedRefValue,
      row.targetMediaRelPath,
      row.resolutionStatusCode,
      row.resolvedImportMediaFileId,
      row.message,
      JSON.stringify(row.metadata || {}),
    ],
  );
}

async function upsertDerivative(client, row) {
  const result = await client.query(
    `INSERT INTO game_data.import_media_derivatives_f(import_batch_id,
												 patch_id,
												 import_media_file_id,
												 variant_code,
												 derived_rel_path,
												 derived_format_code,
												 derived_width_px,
												 derived_height_px,
												 derived_size_bytes,
												 derived_hash_sha256,
												 generation_status_code,
												 error_message)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'generated', NULL)
		 ON CONFLICT (import_media_file_id, variant_code) DO UPDATE
		 SET import_batch_id = EXCLUDED.import_batch_id,
			 patch_id = EXCLUDED.patch_id,
			 derived_rel_path = EXCLUDED.derived_rel_path,
			 derived_format_code = EXCLUDED.derived_format_code,
			 derived_width_px = EXCLUDED.derived_width_px,
			 derived_height_px = EXCLUDED.derived_height_px,
			 derived_size_bytes = EXCLUDED.derived_size_bytes,
			 derived_hash_sha256 = EXCLUDED.derived_hash_sha256,
			 generation_status_code = EXCLUDED.generation_status_code,
			 error_message = EXCLUDED.error_message,
			 created_dt = now()
		 RETURNING import_media_derivative_id`,
    [
      row.importBatchId,
      row.patchId,
      row.importMediaFileId,
      row.variantCode,
      row.derivedRelPath,
      row.derivedFormatCode,
      row.derivedWidthPx,
      row.derivedHeightPx,
      row.derivedSizeBytes,
      row.derivedHashSha256,
    ],
  );

  return result.rows[0].import_media_derivative_id;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.loadEnvFile) {
    const envLoadResult = loadEnvFile(
      options.envFileRelPath,
      options.overrideEnvFile,
    );
    if (envLoadResult.loaded) {
      console.log(
        `Loaded env file: ${normalizeRelPath(relative(REPO_ROOT, envLoadResult.absolutePath).split(sep).join("/"))}`,
      );
    } else {
      console.log(
        `Env file not found, continuing without it: ${options.envFileRelPath}`,
      );
    }
  }

  const manualRootPath = resolve(REPO_ROOT, options.manualRootRelPath);
  if (!existsSync(manualRootPath) || !statSync(manualRootPath).isDirectory()) {
    throw new Error(
      `Manual root does not exist or is not a directory: ${options.manualRootRelPath}`,
    );
  }

  if (options.manifestRelPath) {
    const hintedManifestPath = resolve(manualRootPath, options.manifestRelPath);
    assertInsideRoot(hintedManifestPath, manualRootPath, "manifest path");
    if (
      !existsSync(hintedManifestPath) ||
      !statSync(hintedManifestPath).isFile()
    ) {
      console.warn(
        `Manifest hint was not found, continuing with full Manual JSON discovery: ${options.manualRootRelPath}/${options.manifestRelPath}`,
      );
    }
  }

  const allManualFiles = walkFiles(manualRootPath).map((absolutePath) =>
    fileInfo(absolutePath, manualRootPath),
  );
  const jsonFiles = allManualFiles.filter((file) => file.roleCode === "json");
  const sourceMediaFiles = allManualFiles.filter((file) =>
    isManualSourceMediaFile(file),
  );
  const derivativeMediaFiles = allManualFiles.filter(
    (file) => file.roleCode === "media" && isManualDerivativeMediaFile(file),
  );
  const mediaLookup = buildMediaLookup(sourceMediaFiles);
  const derivativePlan = manualDerivativeRows(
    derivativeMediaFiles,
    mediaLookup,
  );

  const databaseUrl = resolveDatabaseUrl(options.databaseUrl);
  const patchRootRelPath = normalizeRelPath(
    join(options.patchesRootRelPath, options.patchCode).split(sep).join("/"),
  );
  const Client = loadPgClient();
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  let patchId = null;
  let scanBatchId = null;
  let derivativeBatchId = null;
  let scanMessageCount = 0;
  let derivativeMessageCount = 0;
  let scanWarningCount = 0;
  let derivativeWarningCount = 0;
  let jsonRowCount = 0;
  let manifestFileCount = 0;
  let manifestRowCount = 0;
  let genericJsonFileCount = 0;
  let genericJsonRowCount = 0;
  let mediaFileCount = 0;
  let derivativeCount = 0;
  const mediaByRelPath = new Map();

  try {
    const patchResult = await client.query(
      `INSERT INTO game_data.patches(patch_code,
										 source_root_rel_path,
										 patch_status_code,
										 created_by_discord_id,
										 updated_by_discord_id)
			 VALUES ($1, $2, 'draft', $3, $3)
			 ON CONFLICT (patch_code) DO UPDATE
			 SET source_root_rel_path = COALESCE(NULLIF(game_data.patches.source_root_rel_path, ''), EXCLUDED.source_root_rel_path),
				 updated_by_discord_id = EXCLUDED.updated_by_discord_id,
				 updated_dt = now()
			 RETURNING patch_id`,
      [options.patchCode, patchRootRelPath, options.actorDiscordId],
    );
    patchId = patchResult.rows[0].patch_id;

    const scanBatchResult = await client.query(
      `INSERT INTO game_data.import_batches_f(patch_id,
											 batch_type_code,
											 batch_status_code,
											 actor_discord_id,
											 source_root_rel_path,
											 started_dt,
											 summary_json)
			 VALUES ($1, 'scan', 'running', $2, $3, now(), $4::jsonb)
			 RETURNING import_batch_id`,
      [
        patchId,
        options.actorDiscordId,
        options.manualRootRelPath,
        JSON.stringify({
          targetPatchCode: options.patchCode,
          sourceRootCode: "manual",
          jsonFileCount: jsonFiles.length,
          sourceMediaFileCount: sourceMediaFiles.length,
          derivativeMediaFileCount: derivativeMediaFiles.length,
        }),
      ],
    );
    scanBatchId = scanBatchResult.rows[0].import_batch_id;

    for (const mediaFile of sourceMediaFiles) {
      const importFileId = await insertImportFile(
        client,
        scanBatchId,
        patchId,
        mediaFile,
        "processed",
        0,
        {
          sourceRootCode: "manual",
          manualMediaKindCode:
            manualImagePathParts(mediaFile.relPath)?.variantCode === "original"
              ? "original"
              : "source",
        },
      );
      const importMediaFileId = await insertImportMediaFile(
        client,
        scanBatchId,
        patchId,
        importFileId,
        mediaFile,
      );
      mediaByRelPath.set(mediaFile.relPath, {
        importMediaFileId,
        relPath: mediaFile.relPath,
      });
      mediaFileCount += 1;
    }

    for (const jsonFile of jsonFiles) {
      const importFileId = await insertImportFile(
        client,
        scanBatchId,
        patchId,
        jsonFile,
        "pending",
        0,
        { sourceRootCode: "manual" },
      );
      let parsed;
      try {
        parsed = JSON.parse(jsonFile.buffer.toString("utf8"));
      } catch (error) {
        await client.query(
          `UPDATE game_data.import_files_f
					 SET parse_status_code = 'failed',
						 error_message = $2
					 WHERE import_file_id = $1`,
          [importFileId, getErrorMessage(error)],
        );
        scanWarningCount += 1;
        await insertMessage(client, {
          importBatchId: scanBatchId,
          patchId,
          severityCode: "warning",
          messageCode: "manual_json_parse_failed",
          messageText: `Could not parse manual JSON file ${jsonFile.relPath}.`,
          importFileId,
          sourceRelPath: jsonFile.relPath,
          context: { errorMessage: getErrorMessage(error) },
        });
        scanMessageCount += 1;
        continue;
      }

      const parsedManualJson = parseManualJsonRows(parsed, jsonFile.stem);
      const roleCodeOverride =
        parsedManualJson.kindCode === "manifest" ? "manifest" : "json";
      const sourceFileCode = normalizeFileCode(jsonFile.stem);
      let parsedRowsForFile = 0;

      if (parsedManualJson.kindCode === "manifest") {
        manifestFileCount += 1;
      } else {
        genericJsonFileCount += 1;
      }

      await client.query(
        `UPDATE game_data.import_files_f
				 SET file_role_code = $2,
					 metadata_json = $3::jsonb
				 WHERE import_file_id = $1`,
        [
          importFileId,
          roleCodeOverride,
          JSON.stringify({
            sourceFileCode,
            topLevelShape: Array.isArray(parsed) ? "array" : typeof parsed,
            sourceRootCode: "manual",
            manualJsonKindCode: parsedManualJson.kindCode,
            ...parsedManualJson.metadata,
          }),
        ],
      );

      for (const row of parsedManualJson.rows) {
        const importRowId = await insertImportRow(
          client,
          scanBatchId,
          patchId,
          importFileId,
          row,
        );
        jsonRowCount += 1;
        parsedRowsForFile += 1;
        if (parsedManualJson.kindCode === "manifest") {
          manifestRowCount += 1;
        } else {
          genericJsonRowCount += 1;
        }

        for (const reference of extractManualMediaReferences(
          row.payload,
          mediaLookup,
        )) {
          const resolvedMedia =
            mediaByRelPath.get(reference.targetMediaRelPath) || null;
          await insertImportRowRef(client, {
            importBatchId: scanBatchId,
            patchId,
            importRowId,
            refRoleCode: reference.refRoleCode,
            sourceRefValue: reference.sourceRefValue,
            normalizedRefValue: reference.normalizedRefValue,
            targetMediaRelPath: reference.targetMediaRelPath,
            resolutionStatusCode: resolvedMedia ? "resolved" : "missing",
            resolvedImportMediaFileId: resolvedMedia
              ? resolvedMedia.importMediaFileId
              : null,
            message: resolvedMedia
              ? null
              : `Manual JSON media reference was not found as source media on disk: ${reference.targetMediaRelPath}`,
            metadata: {
              jsonPath: reference.jsonPath,
              source:
                parsedManualJson.kindCode === "manifest"
                  ? "manual_manifest"
                  : "manual_json",
              derivedReferenceRelPath: reference.derivedReferenceRelPath,
            },
          });

          if (!resolvedMedia) {
            scanWarningCount += 1;
          }
        }
      }

      await client.query(
        `UPDATE game_data.import_files_f
				 SET parse_status_code = 'processed',
					 row_count = $2,
					 metadata_json = metadata_json || $3::jsonb
				 WHERE import_file_id = $1`,
        [
          importFileId,
          parsedRowsForFile,
          JSON.stringify({ rowCount: parsedRowsForFile }),
        ],
      );
    }

    const scanSummary = {
      patchCode: options.patchCode,
      patchRootRelPath,
      manualRootRelPath: options.manualRootRelPath,
      jsonFileCount: jsonFiles.length,
      manifestFileCount,
      manifestRowCount,
      genericJsonFileCount,
      genericJsonRowCount,
      jsonRowCount,
      mediaFileCount,
      derivativeMediaFileCount: derivativeMediaFiles.length,
      warningCount: scanWarningCount,
    };

    await client.query(
      `UPDATE game_data.import_batches_f
			 SET batch_status_code = 'completed',
				 finished_dt = now(),
				 json_file_count = $2,
				 media_file_count = $3,
				 row_count = $4,
				 message_count = $5,
				 error_count = 0,
				 warning_count = $6,
				 summary_json = $7::jsonb,
				 updated_dt = now()
			 WHERE import_batch_id = $1`,
      [
        scanBatchId,
        jsonFiles.length,
        mediaFileCount,
        jsonRowCount,
        scanMessageCount,
        scanWarningCount,
        JSON.stringify(scanSummary),
      ],
    );

    const derivativeBatchResult = await client.query(
      `INSERT INTO game_data.import_batches_f(patch_id,
											 batch_type_code,
											 batch_status_code,
											 actor_discord_id,
											 source_root_rel_path,
											 started_dt,
											 summary_json)
			 VALUES ($1, 'media_derivatives', 'running', $2, $3, now(), $4::jsonb)
			 RETURNING import_batch_id`,
      [
        patchId,
        options.actorDiscordId,
        options.manualRootRelPath,
        JSON.stringify({
          targetPatchCode: options.patchCode,
          sourceRootCode: "manual",
          scanBatchId,
          plannedDerivativeCount: derivativePlan.rows.length,
          skippedDerivativeCount: derivativePlan.skipped.length,
        }),
      ],
    );
    derivativeBatchId = derivativeBatchResult.rows[0].import_batch_id;

    for (const skipped of derivativePlan.skipped) {
      derivativeWarningCount += 1;
      await insertMessage(client, {
        importBatchId: derivativeBatchId,
        patchId,
        severityCode: "warning",
        messageCode: skipped.reasonCode,
        messageText: skipped.message,
        sourceRelPath: skipped.derivedRelPath,
        context: {
          variantCode: skipped.variantCode,
          derivedRelPath: skipped.derivedRelPath,
        },
      });
      derivativeMessageCount += 1;
    }

    for (const derivativeRow of derivativePlan.rows) {
      const originalMedia =
        mediaByRelPath.get(derivativeRow.importSourceRelPath) || null;
      if (!originalMedia) {
        derivativeWarningCount += 1;
        await insertMessage(client, {
          importBatchId: derivativeBatchId,
          patchId,
          severityCode: "warning",
          messageCode: "manual_derivative_source_not_imported",
          messageText: `Manual derivative source media was not imported: ${derivativeRow.importSourceRelPath}`,
          sourceRelPath: derivativeRow.derivedRelPath,
          context: {
            variantCode: derivativeRow.variantCode,
            importSourceRelPath: derivativeRow.importSourceRelPath,
          },
        });
        derivativeMessageCount += 1;
        continue;
      }

      const derivedFile = derivativeRow.derivedFile;
      const dimensions = readImageDimensions(
        derivedFile.buffer,
        derivedFile.ext,
      );
      if (!dimensions.width || !dimensions.height) {
        derivativeWarningCount += 1;
        await insertMessage(client, {
          importBatchId: derivativeBatchId,
          patchId,
          severityCode: "warning",
          messageCode: "manual_derivative_dimensions_unknown",
          messageText: `Manual derivative dimensions could not be read: ${derivedFile.relPath}`,
          importMediaFileId: originalMedia.importMediaFileId,
          sourceRelPath: derivedFile.relPath,
          context: {
            variantCode: derivativeRow.variantCode,
            derivedRelPath: derivedFile.relPath,
          },
        });
        derivativeMessageCount += 1;
        continue;
      }

      await upsertDerivative(client, {
        importBatchId: derivativeBatchId,
        patchId,
        importMediaFileId: originalMedia.importMediaFileId,
        variantCode: derivativeRow.variantCode,
        derivedRelPath: derivedFile.relPath,
        derivedFormatCode: derivedFile.ext,
        derivedWidthPx: dimensions.width,
        derivedHeightPx: dimensions.height,
        derivedSizeBytes: derivedFile.sizeBytes,
        derivedHashSha256: derivedFile.hash,
      });
      derivativeCount += 1;
    }

    const derivativeSummary = {
      patchCode: options.patchCode,
      manualRootRelPath: options.manualRootRelPath,
      scanBatchId,
      registeredDerivativeCount: derivativeCount,
      plannedDerivativeCount: derivativePlan.rows.length,
      skippedDerivativeCount: derivativePlan.skipped.length,
      warningCount: derivativeWarningCount,
    };

    await client.query(
      `UPDATE game_data.import_batches_f
			 SET batch_status_code = 'completed',
				 finished_dt = now(),
				 media_file_count = $2,
				 row_count = $3,
				 message_count = $4,
				 error_count = 0,
				 warning_count = $5,
				 summary_json = $6::jsonb,
				 updated_dt = now()
			 WHERE import_batch_id = $1`,
      [
        derivativeBatchId,
        mediaFileCount,
        derivativeCount,
        derivativeMessageCount,
        derivativeWarningCount,
        JSON.stringify(derivativeSummary),
      ],
    );

    await client.query(
      `UPDATE game_data.patches
			 SET patch_status_code = CASE
					 WHEN patch_status_code IN ('promoted', 'superseded') THEN patch_status_code
					 ELSE 'processed'
				 END,
				 updated_by_discord_id = $2,
				 updated_dt = now()
			 WHERE patch_id = $1`,
      [patchId, options.actorDiscordId],
    );

    const combinedSummary = {
      patchCode: options.patchCode,
      manualRootRelPath: options.manualRootRelPath,
      scanBatchId,
      derivativeBatchId,
      jsonFileCount: jsonFiles.length,
      manifestFileCount,
      manifestRowCount,
      genericJsonFileCount,
      genericJsonRowCount,
      mediaFileCount,
      derivativeCount,
      scanWarningCount,
      derivativeWarningCount,
    };

    console.log("Manual game data import completed.");
    console.table(combinedSummary);
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    if (client && scanBatchId && patchId) {
      await client
        .query(
          `UPDATE game_data.import_batches_f
				 SET batch_status_code = 'failed',
					 finished_dt = now(),
					 error_message = $2,
					 updated_dt = now()
				 WHERE import_batch_id = $1`,
          [scanBatchId, errorMessage],
        )
        .catch(() => undefined);

      if (derivativeBatchId) {
        await client
          .query(
            `UPDATE game_data.import_batches_f
					 SET batch_status_code = 'failed',
						 finished_dt = now(),
						 error_message = $2,
						 updated_dt = now()
					 WHERE import_batch_id = $1`,
            [derivativeBatchId, errorMessage],
          )
          .catch(() => undefined);
      }

      await insertMessage(client, {
        importBatchId: derivativeBatchId || scanBatchId,
        patchId,
        severityCode: "error",
        messageCode: "manual_import_failed",
        messageText: "The manual game data import failed before completion.",
        context: { errorMessage },
      }).catch(() => undefined);
    }

    throw error;
  } finally {
    await client.end().catch(() => undefined);
  }
}

function normalizeFileCode(stem) {
  return stem
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function getErrorMessage(error) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Unknown error";
}

main().catch((error) => {
  console.error(getErrorMessage(error));
  process.exit(1);
});

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
