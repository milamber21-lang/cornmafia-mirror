//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: scripts/game-data-import.mjs                                                                        ////
//// Language: JS                                                                                               ////
//// Scans curated game patch dumps into the game_data import tables for validation and later promotion.         ////
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
const DEFAULT_SOURCE_ROOTS_REL_PATHS = ["Content", "Plugins"];
const EXCLUDED_DIRECTORY_NAMES = new Set([
  "derived",
  "reports",
  "FullDump",
  "full_dumps",
  ".git",
  "node_modules",
]);
const JSON_EXTENSION = ".json";
const MEDIA_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const DIRECT_MEDIA_PATH_PATTERN =
  /^(?:\/?)(?:Content|Plugins|Manual)\/.+\.(?:png|jpg|jpeg|webp)$/i;
const EMBEDDED_DIRECT_MEDIA_PATH_PATTERN =
  /(?:^|[\"'\s(,;])(?<path>\/?(?:Content|Plugins|Manual)\/[^\"'\s),;]+\.(?:png|jpg|jpeg|webp))/gi;
const UNREAL_QUOTED_REF_PATTERN = /[A-Za-z0-9_]+\'([^\']+)\'/g;
const UNREAL_BARE_REF_PATTERN =
  /(?<![A-Za-z0-9_])\/(?:Game|Engine|Corn[A-Za-z0-9_]+|[A-Za-z0-9_]+)\/[^\s\"',;)]+/g;
const SAFE_RELATIVE_PATH_PATTERN = /(^\/|(^|\/)\.\.(\/|$))/;
const MEDIA_CONTEXT_KEYS = new Set([
  "bigpicture",
  "brandlogo",
  "displayimage",
  "image",
  "icon",
  "itemicon",
  "itemiconspatial",
  "itemiconsquare",
  "itemiconwheelmenu",
  "itemiconsspatial",
  "itemiconssquare",
  "itemiconswheelmenu",
  "largeimage",
  "logo",
  "picture",
  "pointicon",
  "preview",
  "previewimage",
  "smallimage",
  "texture",
  "thumbnail",
]);
const MEDIA_VALUE_WORDS = new Set([
  "bigpicture",
  "icon",
  "icons",
  "image",
  "images",
  "inventoryicons",
  "logo",
  "picture",
  "preview",
  "render",
  "renders",
  "texture",
  "textures",
  "thumbnail",
]);
const PLUGIN_ROOTS = new Set(["CornNeeds", "CornNavigation"]);

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
  node scripts/game-data-import.mjs --patch <patch_code> [options]

Options:
  --patch <patch_code>          Required patch folder name/code, for example 0.4.0.
  --patches-root <path>         Patch root directory. Default: ${DEFAULT_PATCHES_ROOT_REL_PATH}
  --source-root <path>          Source subfolder under the patch folder to scan. Can be repeated. Default: Content and Plugins.
  --actor-discord-id <id>       Optional Discord ID for the operator/admin that triggered the scan.
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

This scanner writes only to game_data.* import tables. It does not generate media derivatives and does not
promote data into web_game canonical tables.

The scanner only reads patch source roots by default. It ignores generated folders such as derived/ and reports/ so
it can be rerun after media derivative generation without re-importing generated web files as source media.
Use scripts/game-data-import-manual.mjs for the parent Manual source root.
`);
}

function parseArgs(argv) {
  const options = {
    patchCode: "",
    patchesRootRelPath: DEFAULT_PATCHES_ROOT_REL_PATH,
    sourceRootsRelPaths: [],
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
      "--source-root",
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

    if (arg === "--source-root") {
      options.sourceRootsRelPaths.push(normalizeRelPath(value.trim()));
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
  if (options.sourceRootsRelPaths.length === 0) {
    options.sourceRootsRelPaths = [...DEFAULT_SOURCE_ROOTS_REL_PATHS];
  }
  for (const sourceRootRelPath of options.sourceRootsRelPaths) {
    assertSafeRelPath(sourceRootRelPath, "source root");
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
  const rows = [];
  for (const rawLine of content.split(/\r?\n/)) {
    const trimmedLine = rawLine.trim();
    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    const line = trimmedLine.startsWith("export ")
      ? trimmedLine.slice(7).trim()
      : trimmedLine;
    const separatorIndex = findEnvSeparator(line);
    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      continue;
    }

    const rawValue = stripEnvInlineComment(
      line.slice(separatorIndex + 1).trim(),
    );
    rows.push([key, unquoteEnvValue(rawValue)]);
  }

  return rows;
}

function findEnvSeparator(line) {
  let quote = null;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if ((char === '"' || char === "'") && line[index - 1] !== "\\") {
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
      if (EXCLUDED_DIRECTORY_NAMES.has(dirent.name)) {
        continue;
      }
      rows.push(...walkFiles(absolutePath));
      continue;
    }

    if (dirent.isFile()) {
      rows.push(absolutePath);
    }
  }

  return rows.sort((left, right) => left.localeCompare(right));
}

function walkSourceFiles(patchRootPath, sourceRootsRelPaths) {
  const rows = [];
  const missingRoots = [];

  for (const sourceRootRelPath of sourceRootsRelPaths) {
    const sourceRootPath = resolve(patchRootPath, sourceRootRelPath);
    assertInsideRoot(sourceRootPath, patchRootPath, "source root");

    if (!existsSync(sourceRootPath)) {
      missingRoots.push(sourceRootRelPath);
      continue;
    }

    const stats = statSync(sourceRootPath);
    if (!stats.isDirectory()) {
      missingRoots.push(sourceRootRelPath);
      continue;
    }

    rows.push(...walkFiles(sourceRootPath));
  }

  return {
    files: rows.sort((left, right) => left.localeCompare(right)),
    missingRoots,
  };
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

function fileInfo(absolutePath, patchRootPath) {
  const relPath = normalizeRelPath(
    relative(patchRootPath, absolutePath).split(sep).join("/"),
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
      ext === JSON_EXTENSION
        ? "json"
        : MEDIA_EXTENSIONS.has(ext)
          ? "media"
          : "other",
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

function sourceTopLevelShape(value) {
  if (isMapActorCatalogExport(value)) {
    return "map_actor_catalog_items";
  }

  if (Array.isArray(value)) {
    return "array";
  }

  if (isPlainObject(value) && isPlainObject(value.Rows)) {
    return "datatable_rows";
  }

  return typeof value;
}

function parseSourceRows(jsonValue, fallbackStem) {
  const rows = [];
  const seenSourceRowNames = new Map();

  if (isMapActorCatalogExport(jsonValue)) {
    return parseMapActorCatalogRows(jsonValue, seenSourceRowNames);
  }

  const tables = Array.isArray(jsonValue) ? jsonValue : [jsonValue];

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

function isMapActorCatalogExport(value) {
  if (!isPlainObject(value)) {
    return false;
  }

  if (!isPlainObject(value.map) || !Array.isArray(value.items)) {
    return false;
  }

  const itemIdStrategy = value.item_id_strategy;
  if (
    typeof itemIdStrategy === "string" &&
    itemIdStrategy.trim() === "map_local_actor_path"
  ) {
    return true;
  }

  const schemaVersion = value.schema_version;
  return (
    typeof schemaVersion === "number" &&
    value.items.every((item) => isPlainObject(item))
  );
}

function parseMapActorCatalogRows(mapExport, seenSourceRowNames) {
  const rows = [];
  const mapInfo = isPlainObject(mapExport.map) ? mapExport.map : {};
  const sourceStructType = `MapActorCatalogItem/v${String(mapExport.schema_version || "unknown")}`;

  for (let rowIndex = 0; rowIndex < mapExport.items.length; rowIndex += 1) {
    const item = mapExport.items[rowIndex];
    const payload = buildMapActorCatalogRowPayload(mapExport, item);
    rows.push({
      sourceRowName: uniqueSourceRowName(
        mapActorCatalogSourceRowName(item, rowIndex),
        seenSourceRowNames,
      ),
      sourceRowIndex: rowIndex,
      sourceStructType,
      sourceIdentifierValue: mapActorCatalogIdentifierValue(item),
      payload,
    });
  }

  if (rows.length === 0) {
    rows.push({
      sourceRowName: uniqueSourceRowName(
        mapInfo.code || "map_export_empty",
        seenSourceRowNames,
      ),
      sourceRowIndex: 0,
      sourceStructType,
      sourceIdentifierValue:
        typeof mapInfo.code === "string" ? mapInfo.code : null,
      payload: buildMapActorCatalogFilePayload(mapExport),
    });
  }

  return rows;
}

function buildMapActorCatalogRowPayload(mapExport, item) {
  const mapInfo = isPlainObject(mapExport.map) ? mapExport.map : {};
  const itemPayload = isPlainObject(item) ? item : { value: item };

  return {
    schema_version: mapExport.schema_version ?? null,
    item_id_strategy: mapExport.item_id_strategy ?? null,
    patch: mapExport.patch ?? null,
    map_code: stringOrNull(mapInfo.code),
    map_package_path: stringOrNull(mapInfo.package_path),
    map_display_name: stringOrNull(mapInfo.display_name),
    map_kind: stringOrNull(mapInfo.kind),
    map: mapInfo,
    item: itemPayload,
    id: itemPayload.id ?? null,
    export_index: itemPayload.export_index ?? null,
    class: itemPayload.class ?? null,
    class_reference_kind: itemPayload.class_reference_kind ?? null,
    class_reference: itemPayload.class_reference ?? null,
    class_evidence_path: itemPayload.class_evidence_path ?? null,
    class_reference_raw_kind: itemPayload.class_reference_raw_kind ?? null,
    class_reference_raw: itemPayload.class_reference_raw ?? null,
    category: itemPayload.category ?? null,
    name: itemPayload.name ?? null,
    path: itemPayload.path ?? null,
    transform: itemPayload.transform ?? null,
    properties: itemPayload.properties ?? {},
    dependencies: itemPayload.dependencies ?? [],
  };
}

function buildMapActorCatalogFilePayload(mapExport) {
  const mapInfo = isPlainObject(mapExport.map) ? mapExport.map : {};
  return {
    schema_version: mapExport.schema_version ?? null,
    item_id_strategy: mapExport.item_id_strategy ?? null,
    patch: mapExport.patch ?? null,
    map_code: stringOrNull(mapInfo.code),
    map_package_path: stringOrNull(mapInfo.package_path),
    map_display_name: stringOrNull(mapInfo.display_name),
    map_kind: stringOrNull(mapInfo.kind),
    map: mapInfo,
    items: [],
  };
}

function mapActorCatalogSourceRowName(item, rowIndex) {
  if (isPlainObject(item)) {
    for (const key of ["id", "path", "name"]) {
      const value = item[key];
      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }
    }

    if (typeof item.export_index === "number") {
      return `export_${item.export_index}`;
    }
  }

  return `item_${rowIndex}`;
}

function mapActorCatalogIdentifierValue(item) {
  if (!isPlainObject(item)) {
    return null;
  }

  for (const key of ["id", "path", "name", "class"]) {
    const value = item[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  if (typeof item.export_index === "number") {
    return String(item.export_index);
  }

  return null;
}

function stringOrNull(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
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
  ]) {
    const value = payload[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function extractReferences(rowPayload, sourceFileStem) {
  const references = [];
  const seen = new Set();

  function addReference(reference) {
    const key = [
      reference.refKindCode,
      reference.refRoleCode,
      reference.sourceRefValue,
      reference.targetMediaRelPath || "",
      reference.targetSourceRowName || "",
    ].join("\u0000");
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    references.push(reference);
  }

  function walk(value, path, parent) {
    if (typeof value === "string") {
      for (const directMediaPath of normalizeDirectMediaRelPaths(value)) {
        addReference({
          refKindCode: "media",
          refRoleCode: mediaRoleFromPath(path),
          sourceRefValue: value,
          normalizedRefValue: directMediaPath,
          targetSourceFileCode: null,
          targetSourceRowName: null,
          targetMediaRelPath: directMediaPath,
          metadata: { jsonPath: path.join(".") },
        });
      }

      for (const unrealMediaPath of mediaRelPathsFromUnrealReferences(
        value,
        path,
      )) {
        addReference({
          refKindCode: "media",
          refRoleCode: mediaRoleFromPath(path),
          sourceRefValue: value,
          normalizedRefValue: unrealMediaPath,
          targetSourceFileCode: null,
          targetSourceRowName: null,
          targetMediaRelPath: unrealMediaPath,
          metadata: { jsonPath: path.join("."), sourceFileStem },
        });
      }

      const assetReference = assetReferenceFromString(value, path, parent);
      if (assetReference) {
        addReference(assetReference);
      }

      return;
    }

    if (Array.isArray(value)) {
      for (let index = 0; index < value.length; index += 1) {
        walk(value[index], [...path, String(index)], value);
      }
      return;
    }

    if (isPlainObject(value)) {
      for (const [key, nestedValue] of Object.entries(value)) {
        walk(nestedValue, [...path, key], value);
      }
    }
  }

  walk(rowPayload, [], null);
  return references;
}

function normalizeDirectMediaRelPaths(value) {
  const trimmed = value.trim().replace(/\\/g, "/");
  const paths = [];
  const seen = new Set();

  function addPath(rawPath) {
    const relPath = normalizeRelPath(rawPath);
    assertSafeRelPath(relPath, "media reference");
    const key = relPath.toLowerCase();
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    paths.push(relPath);
  }

  if (DIRECT_MEDIA_PATH_PATTERN.test(trimmed)) {
    addPath(trimmed);
  }

  EMBEDDED_DIRECT_MEDIA_PATH_PATTERN.lastIndex = 0;
  let match = EMBEDDED_DIRECT_MEDIA_PATH_PATTERN.exec(trimmed);
  while (match) {
    const embeddedPath = match.groups?.path;
    if (embeddedPath) {
      addPath(embeddedPath);
    }
    match = EMBEDDED_DIRECT_MEDIA_PATH_PATTERN.exec(trimmed);
  }

  return paths;
}

function mediaRelPathsFromUnrealReferences(value, path) {
  if (!isMediaReferenceContext(path, value)) {
    return [];
  }

  const paths = [];
  const seen = new Set();
  for (const unrealReference of unrealReferencesFromString(value)) {
    const mediaPath = mediaRelPathFromUnrealReference(unrealReference);
    if (!mediaPath) {
      continue;
    }
    const key = mediaPath.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    paths.push(mediaPath);
  }

  return paths;
}

function unrealReferencesFromString(value) {
  const normalized = value.trim().replace(/\\/g, "/");
  const refs = [];
  const seen = new Set();

  function addRef(rawRef) {
    const ref = rawRef
      .trim()
      .replace(/\\/g, "/")
      .replace(/[.\]]+$/g, "");
    if (!ref || seen.has(ref)) {
      return;
    }
    seen.add(ref);
    refs.push(ref);
  }

  UNREAL_QUOTED_REF_PATTERN.lastIndex = 0;
  let quotedMatch = UNREAL_QUOTED_REF_PATTERN.exec(normalized);
  while (quotedMatch) {
    addRef(quotedMatch[1]);
    quotedMatch = UNREAL_QUOTED_REF_PATTERN.exec(normalized);
  }

  UNREAL_BARE_REF_PATTERN.lastIndex = 0;
  let bareMatch = UNREAL_BARE_REF_PATTERN.exec(normalized);
  while (bareMatch) {
    addRef(bareMatch[0]);
    bareMatch = UNREAL_BARE_REF_PATTERN.exec(normalized);
  }

  return refs;
}

function mediaRelPathFromUnrealReference(value) {
  const trimmed = value.trim().replace(/\\/g, "/");
  if (!trimmed.startsWith("/Game/") && !trimmed.startsWith("/Corn")) {
    return null;
  }

  if (trimmed.startsWith("/Script/")) {
    return null;
  }

  const slashParts = trimmed.split("/").filter(Boolean);
  if (slashParts.length < 2) {
    return null;
  }

  const root = slashParts[0];
  const restParts = slashParts.slice(1);
  const lastPart = restParts[restParts.length - 1] || "";
  const assetName = lastPart.includes(".") ? lastPart.split(".")[0] : lastPart;
  if (!assetName || assetName === "None") {
    return null;
  }

  restParts[restParts.length - 1] = `${assetName}.png`;

  if (root === "Game") {
    return normalizeRelPath(
      join("Content", ...restParts)
        .split(sep)
        .join("/"),
    );
  }

  if (PLUGIN_ROOTS.has(root)) {
    return normalizeRelPath(
      join("Plugins", root, "Content", ...restParts)
        .split(sep)
        .join("/"),
    );
  }

  return null;
}

function isMediaReferenceContext(path, value) {
  return isMediaContextPath(path) || isMediaReferenceValue(value);
}

function isMediaReferenceValue(value) {
  const normalizedValue = value.toLowerCase().replace(/[^a-z0-9]+/g, " ");
  for (const word of MEDIA_VALUE_WORDS) {
    if (normalizedValue.includes(word)) {
      return true;
    }
  }

  return false;
}

function isMediaContextPath(path) {
  for (const part of path) {
    const normalized = part.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (MEDIA_CONTEXT_KEYS.has(normalized)) {
      return true;
    }
  }

  return false;
}

function mediaRoleFromPath(path) {
  for (let index = path.length - 1; index >= 0; index -= 1) {
    const normalized = path[index].toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!MEDIA_CONTEXT_KEYS.has(normalized)) {
      continue;
    }

    if (normalized.includes("icon")) {
      return "icon";
    }

    if (normalized === "brandlogo") {
      return "brandlogo";
    }

    return normalized;
  }

  return "media_reference";
}

function assetReferenceFromString(value, path, parent) {
  if (!value.trim()) {
    return null;
  }

  const role = assetReferenceRole(path);
  if (!role) {
    return null;
  }

  if (!isPlainObject(parent) || typeof parent.Key !== "string") {
    return null;
  }

  const targetSourceFileCode =
    role === "recipe_component" || role === "recipe_output"
      ? "dt_inventoryitems"
      : null;

  return {
    refKindCode: "asset",
    refRoleCode: role,
    sourceRefValue: value,
    normalizedRefValue: value.trim(),
    targetSourceFileCode,
    targetSourceRowName: value.trim(),
    targetMediaRelPath: null,
    metadata: { jsonPath: path.join(".") },
  };
}

function assetReferenceRole(path) {
  const last = path[path.length - 1];
  if (last !== "Key") {
    return null;
  }

  if (path.includes("Components")) {
    return "recipe_component";
  }

  if (path.includes("Output")) {
    return "recipe_output";
  }

  return null;
}

function normalizeFileCode(stem) {
  return stem
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
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
																 source_rel_path,
																 source_row_name,
																 context_json)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb)
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
      message.sourceRelPath || null,
      message.sourceRowName || null,
      JSON.stringify(message.context || {}),
    ],
  );

  return result.rows[0].import_message_id;
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

  const databaseUrl = resolveDatabaseUrl(options.databaseUrl);
  const patchRootRelPath = normalizeRelPath(
    join(options.patchesRootRelPath, options.patchCode).split(sep).join("/"),
  );
  const patchRootPath = resolve(REPO_ROOT, patchRootRelPath);

  if (!existsSync(patchRootPath)) {
    throw new Error(`Patch folder does not exist: ${patchRootRelPath}`);
  }

  const stats = statSync(patchRootPath);
  if (!stats.isDirectory()) {
    throw new Error(`Patch path is not a directory: ${patchRootRelPath}`);
  }

  const sourceWalk = walkSourceFiles(
    patchRootPath,
    options.sourceRootsRelPaths,
  );
  const files = sourceWalk.files.map((absolutePath) =>
    fileInfo(absolutePath, patchRootPath),
  );
  const jsonFiles = files.filter((row) => row.roleCode === "json");
  const mediaFiles = files.filter((row) => row.roleCode === "media");
  const otherFiles = files.filter((row) => row.roleCode === "other");

  const Client = loadPgClient();
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  let patchId = null;
  let importBatchId = null;
  let rowCount = 0;
  let warningCount = 0;
  let errorCount = 0;
  let messageCount = 0;
  let referencedMediaCount = 0;
  const mediaByRelPath = new Map();
  const mediaByLowerRelPath = new Map();
  const rowsByFileCodeAndName = new Map();
  const rowsByName = new Map();
  const pendingReferences = [];

  try {
    const patchResult = await client.query(
      `INSERT INTO game_data.patches(patch_code,
												 source_root_rel_path,
												 patch_status_code,
												 created_by_discord_id,
												 updated_by_discord_id)
			 VALUES ($1, $2, 'draft', $3, $3)
			 ON CONFLICT (patch_code) DO UPDATE
			 SET source_root_rel_path = EXCLUDED.source_root_rel_path,
				 updated_by_discord_id = EXCLUDED.updated_by_discord_id,
				 updated_dt = now()
			 RETURNING patch_id`,
      [options.patchCode, patchRootRelPath, options.actorDiscordId],
    );
    patchId = patchResult.rows[0].patch_id;

    const batchResult = await client.query(
      `INSERT INTO game_data.import_batches_f(patch_id,
														 batch_type_code,
														 batch_status_code,
														 actor_discord_id,
														 source_root_rel_path,
														 started_dt)
			 VALUES ($1, 'scan', 'running', $2, $3, now())
			 RETURNING import_batch_id`,
      [patchId, options.actorDiscordId, patchRootRelPath],
    );
    importBatchId = batchResult.rows[0].import_batch_id;

    if (sourceWalk.missingRoots.length > 0) {
      const messageId = await insertMessage(client, {
        importBatchId,
        patchId,
        severityCode: "info",
        messageCode: "source_roots_missing",
        messageText: `${sourceWalk.missingRoots.length} configured source root(s) were not found and were skipped.`,
        context: {
          sourceRootsRelPaths: options.sourceRootsRelPaths,
          missingRoots: sourceWalk.missingRoots,
        },
      });
      messageCount += messageId ? 1 : 0;
    }

    if (otherFiles.length > 0) {
      const messageId = await insertMessage(client, {
        importBatchId,
        patchId,
        severityCode: "info",
        messageCode: "other_files_ignored",
        messageText: `${otherFiles.length} non-JSON/non-media source files were ignored by the scanner.`,
        context: { fileCount: otherFiles.length },
      });
      messageCount += messageId ? 1 : 0;
    }

    for (const mediaFile of mediaFiles) {
      const fileResult = await insertImportFile(
        client,
        importBatchId,
        patchId,
        mediaFile,
        "processed",
        0,
        {},
      );
      const dimensions = readImageDimensions(mediaFile.buffer, mediaFile.ext);
      const mediaResult = await client.query(
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
          fileResult.importFileId,
          mediaFile.relPath,
          mediaFile.ext,
          dimensions.width,
          dimensions.height,
          mediaFile.sizeBytes,
          mediaFile.hash,
          JSON.stringify({ mimeType: mediaFile.mimeType }),
        ],
      );

      const mediaRow = {
        importMediaFileId: mediaResult.rows[0].import_media_file_id,
        relPath: mediaFile.relPath,
      };
      mediaByRelPath.set(mediaFile.relPath, mediaRow);
      const lowerPath = mediaFile.relPath.toLowerCase();
      if (!mediaByLowerRelPath.has(lowerPath)) {
        mediaByLowerRelPath.set(lowerPath, []);
      }
      mediaByLowerRelPath.get(lowerPath).push(mediaRow);
    }

    for (const jsonFile of jsonFiles) {
      const importFile = await insertImportFile(
        client,
        importBatchId,
        patchId,
        jsonFile,
        "pending",
        0,
        {},
      );
      let parsed;
      try {
        parsed = JSON.parse(jsonFile.buffer.toString("utf8"));
      } catch (error) {
        const errorMessage = getErrorMessage(error);
        errorCount += 1;
        await client.query(
          `UPDATE game_data.import_files_f
					 SET parse_status_code = 'failed',
						 error_message = $2
					 WHERE import_file_id = $1`,
          [importFile.importFileId, errorMessage],
        );
        await insertMessage(client, {
          importBatchId,
          patchId,
          severityCode: "error",
          messageCode: "json_parse_failed",
          messageText: `Could not parse JSON file ${jsonFile.relPath}.`,
          importFileId: importFile.importFileId,
          sourceRelPath: jsonFile.relPath,
          context: { errorMessage },
        });
        messageCount += 1;
        continue;
      }

      const sourceRows = parseSourceRows(parsed, jsonFile.stem);
      let parsedRowsForFile = 0;
      const sourceFileCode = normalizeFileCode(jsonFile.stem);

      for (const sourceRow of sourceRows) {
        const payloadString = stableStringify(sourceRow.payload);
        const payloadHash = sha256(payloadString);
        const rowResult = await client.query(
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
            importFile.importFileId,
            sourceRow.sourceRowName,
            sourceRow.sourceRowIndex,
            sourceRow.sourceStructType,
            sourceRow.sourceIdentifierValue,
            JSON.stringify(sourceRow.payload),
            payloadHash,
          ],
        );

        const importRowId = rowResult.rows[0].import_row_id;
        rowCount += 1;
        parsedRowsForFile += 1;

        const rowLookupKey = `${sourceFileCode}\u0000${sourceRow.sourceRowName}`;
        rowsByFileCodeAndName.set(rowLookupKey, {
          importRowId,
          sourceFileCode,
          sourceRowName: sourceRow.sourceRowName,
        });

        const rowNameKey = sourceRow.sourceRowName;
        if (!rowsByName.has(rowNameKey)) {
          rowsByName.set(rowNameKey, []);
        }
        rowsByName.get(rowNameKey).push({
          importRowId,
          sourceFileCode,
          sourceRowName: sourceRow.sourceRowName,
        });

        const references = extractReferences(sourceRow.payload, jsonFile.stem);
        for (const reference of references) {
          pendingReferences.push({
            ...reference,
            importRowId,
            sourceRelPath: jsonFile.relPath,
            sourceRowName: sourceRow.sourceRowName,
          });
        }
      }

      await client.query(
        `UPDATE game_data.import_files_f
				 SET parse_status_code = 'processed',
					 row_count = $2,
					 metadata_json = $3::jsonb
				 WHERE import_file_id = $1`,
        [
          importFile.importFileId,
          parsedRowsForFile,
          JSON.stringify({
            sourceFileCode,
            topLevelShape: sourceTopLevelShape(parsed),
          }),
        ],
      );
    }

    const referencedMediaIds = new Set();
    for (const reference of pendingReferences) {
      const resolution = resolveReference(
        reference,
        mediaByRelPath,
        mediaByLowerRelPath,
        rowsByFileCodeAndName,
        rowsByName,
      );
      const refResult = await client.query(
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
				 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15::jsonb)
				 RETURNING import_row_ref_id`,
        [
          importBatchId,
          patchId,
          reference.importRowId,
          reference.refKindCode,
          reference.refRoleCode,
          reference.sourceRefValue,
          reference.normalizedRefValue,
          reference.targetSourceFileCode,
          reference.targetSourceRowName,
          reference.targetMediaRelPath,
          resolution.statusCode,
          resolution.resolvedImportRowId,
          resolution.resolvedImportMediaFileId,
          resolution.message,
          JSON.stringify({
            ...reference.metadata,
            sourceRelPath: reference.sourceRelPath,
            sourceRowName: reference.sourceRowName,
          }),
        ],
      );

      if (resolution.resolvedImportMediaFileId) {
        referencedMediaIds.add(resolution.resolvedImportMediaFileId);
      }

      if (
        resolution.statusCode === "missing" ||
        resolution.statusCode === "ambiguous"
      ) {
        warningCount += 1;
        await insertMessage(client, {
          importBatchId,
          patchId,
          severityCode: "warning",
          messageCode: `reference_${resolution.statusCode}`,
          messageText:
            resolution.message ||
            `Reference ${reference.sourceRefValue} is ${resolution.statusCode}.`,
          importRowId: reference.importRowId,
          sourceRelPath: reference.sourceRelPath,
          sourceRowName: reference.sourceRowName,
          context: {
            importRowRefId: refResult.rows[0].import_row_ref_id,
            refKindCode: reference.refKindCode,
            refRoleCode: reference.refRoleCode,
            sourceRefValue: reference.sourceRefValue,
            targetMediaRelPath: reference.targetMediaRelPath,
            targetSourceFileCode: reference.targetSourceFileCode,
            targetSourceRowName: reference.targetSourceRowName,
          },
        });
        messageCount += 1;
      }
    }

    if (referencedMediaIds.size > 0) {
      await client.query(
        `UPDATE game_data.import_media_files_f
				 SET referenced_flag = true,
					 media_status_code = 'referenced'
				 WHERE import_media_file_id = ANY($1::bigint[])`,
        [[...referencedMediaIds]],
      );
      referencedMediaCount = referencedMediaIds.size;
    }

    const finalPatchStatus = errorCount > 0 ? "failed" : "scanned";
    const finalBatchStatus = errorCount > 0 ? "failed" : "completed";
    const summary = {
      patchCode: options.patchCode,
      patchRootRelPath,
      sourceRootsRelPaths: options.sourceRootsRelPaths,
      jsonFileCount: jsonFiles.length,
      mediaFileCount: mediaFiles.length,
      otherFileCount: otherFiles.length,
      rowCount,
      referenceCount: pendingReferences.length,
      referencedMediaCount,
      warningCount,
      errorCount,
    };

    await client.query(
      `UPDATE game_data.import_batches_f
			 SET batch_status_code = $2,
				 finished_dt = now(),
				 json_file_count = $3,
				 media_file_count = $4,
				 row_count = $5,
				 message_count = $6,
				 error_count = $7,
				 warning_count = $8,
				 summary_json = $9::jsonb,
				 updated_dt = now(),
				 error_message = $10
			 WHERE import_batch_id = $1`,
      [
        importBatchId,
        finalBatchStatus,
        jsonFiles.length,
        mediaFiles.length,
        rowCount,
        messageCount,
        errorCount,
        warningCount,
        JSON.stringify(summary),
        errorCount > 0 ? "One or more source files failed to parse." : null,
      ],
    );

    await client.query(
      `UPDATE game_data.patches
			 SET patch_status_code = CASE
					 WHEN patch_status_code IN ('promoted', 'superseded') THEN patch_status_code
					 ELSE $2
				 END,
				 updated_by_discord_id = $3,
				 updated_dt = now()
			 WHERE patch_id = $1`,
      [patchId, finalPatchStatus, options.actorDiscordId],
    );

    console.log("Game data scan completed.");
    console.table(summary);
    console.log(`Import batch ID: ${importBatchId}`);
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    if (client && importBatchId && patchId) {
      await client
        .query(
          `UPDATE game_data.import_batches_f
				 SET batch_status_code = 'failed',
					 finished_dt = now(),
					 error_message = $2,
					 updated_dt = now()
				 WHERE import_batch_id = $1`,
          [importBatchId, errorMessage],
        )
        .catch(() => undefined);

      await client
        .query(
          `UPDATE game_data.patches
				 SET patch_status_code = CASE
						 WHEN patch_status_code IN ('promoted', 'superseded') THEN patch_status_code
						 ELSE 'failed'
					 END,
					 updated_dt = now()
				 WHERE patch_id = $1`,
          [patchId],
        )
        .catch(() => undefined);

      await insertMessage(client, {
        importBatchId,
        patchId,
        severityCode: "error",
        messageCode: "scanner_failed",
        messageText: "The game data scanner failed before completion.",
        context: { errorMessage },
      }).catch(() => undefined);
    }

    throw error;
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function insertImportFile(
  client,
  importBatchId,
  patchId,
  file,
  parseStatusCode,
  rowCount,
  metadata,
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
      file.roleCode,
      file.mimeType,
      file.sizeBytes,
      file.hash,
      parseStatusCode,
      rowCount,
      JSON.stringify(metadata || {}),
    ],
  );

  return {
    importFileId: result.rows[0].import_file_id,
  };
}

function resolveReference(
  reference,
  mediaByRelPath,
  mediaByLowerRelPath,
  rowsByFileCodeAndName,
  rowsByName,
) {
  if (reference.refKindCode === "media") {
    const targetPath = reference.targetMediaRelPath;
    if (!targetPath) {
      return {
        statusCode: "unsupported",
        resolvedImportRowId: null,
        resolvedImportMediaFileId: null,
        message: "Media reference did not produce a target source path.",
      };
    }

    const exactMedia = mediaByRelPath.get(targetPath);
    if (exactMedia) {
      return {
        statusCode: "resolved",
        resolvedImportRowId: null,
        resolvedImportMediaFileId: exactMedia.importMediaFileId,
        message: null,
      };
    }

    const caseMatches = mediaByLowerRelPath.get(targetPath.toLowerCase()) || [];
    if (caseMatches.length === 1) {
      return {
        statusCode: "resolved",
        resolvedImportRowId: null,
        resolvedImportMediaFileId: caseMatches[0].importMediaFileId,
        message: `Resolved media reference by case-insensitive match: ${targetPath}`,
      };
    }

    if (caseMatches.length > 1) {
      return {
        statusCode: "ambiguous",
        resolvedImportRowId: null,
        resolvedImportMediaFileId: null,
        message: `Media reference matched multiple files by case-insensitive path: ${targetPath}`,
      };
    }

    return {
      statusCode: "missing",
      resolvedImportRowId: null,
      resolvedImportMediaFileId: null,
      message: `Referenced media file was not found in the curated patch dump: ${targetPath}`,
    };
  }

  if (reference.refKindCode === "asset") {
    const targetName = reference.targetSourceRowName;
    if (!targetName) {
      return {
        statusCode: "unsupported",
        resolvedImportRowId: null,
        resolvedImportMediaFileId: null,
        message: "Asset reference did not include a target row name.",
      };
    }

    if (reference.targetSourceFileCode) {
      const row = rowsByFileCodeAndName.get(
        `${reference.targetSourceFileCode}\u0000${targetName}`,
      );
      if (row) {
        return {
          statusCode: "resolved",
          resolvedImportRowId: row.importRowId,
          resolvedImportMediaFileId: null,
          message: null,
        };
      }
    }

    const rows = rowsByName.get(targetName) || [];
    if (rows.length === 1) {
      return {
        statusCode: "resolved",
        resolvedImportRowId: rows[0].importRowId,
        resolvedImportMediaFileId: null,
        message: null,
      };
    }

    if (rows.length > 1) {
      return {
        statusCode: "ambiguous",
        resolvedImportRowId: null,
        resolvedImportMediaFileId: null,
        message: `Asset reference matched multiple imported source rows: ${targetName}`,
      };
    }

    return {
      statusCode: "missing",
      resolvedImportRowId: null,
      resolvedImportMediaFileId: null,
      message: `Referenced asset source row was not found in this import batch: ${targetName}`,
    };
  }

  return {
    statusCode: "unsupported",
    resolvedImportRowId: null,
    resolvedImportMediaFileId: null,
    message: `Reference kind is not resolved by this scanner: ${reference.refKindCode}`,
  };
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
