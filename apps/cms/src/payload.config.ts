// FILE: apps/cms/src/payload.config.ts
// Language: TypeScript

import { postgresAdapter } from "@payloadcms/db-postgres";
import { payloadCloudPlugin } from "@payloadcms/payload-cloud";
import { lexicalEditor, FixedToolbarFeature } from "@payloadcms/richtext-lexical";
import path from "path";
import { buildConfig, type CollectionConfig, type GlobalConfig } from "payload";
import { fileURLToPath } from "url";
import sharp from "sharp";

// ✅ Structured logger (real Pino instance; correct type for Payload)
import { payloadEnvLogger } from "./utils/payloadLogger";

/* ──────────────────────────────────────────────────────────────────────────
   Collections / Access
   ────────────────────────────────────────────────────────────────────────── */
import { Users } from "./collections/access/Users";
import { DiscordRoles } from "./collections/access/DiscordRoles";
import { DiscordUsers } from "./collections/access/DiscordUsers";

/* ──────────────────────────────────────────────────────────────────────────
   Collections / Organization  (NOTE: ThemeTokens is a COLLECTION, not Global)
   ────────────────────────────────────────────────────────────────────────── */
import { Categories } from "./collections/organization/Categories";
import { Subcategories } from "./collections/organization/Subcategories";
import { ThemeTokens } from "./collections/organization/ThemeTokens";

/* ──────────────────────────────────────────────────────────────────────────
   Collections / Content
   ────────────────────────────────────────────────────────────────────────── */
import { Media } from "./collections/content/Media";
import { Series } from "./collections/content/Series";
import { Templates } from "./collections/content/Templates";
import { Pages } from "./collections/content/Pages";
import { Icons } from "./collections/content/Icons";

/* ──────────────────────────────────────────────────────────────────────────
   Collections / Game
   ────────────────────────────────────────────────────────────────────────── */
import { GameAssetTypes } from "./collections/game/GameAssetTypes";
import { GameAssetStatuses } from "./collections/game/GameAssetStatuses";
import { GameAssets } from "./collections/game/GameAssets";
import { GameAssetPlots } from "./collections/game/GameAssetPlots";

/* ──────────────────────────────────────────────────────────────────────────
   Collections / Map
   ────────────────────────────────────────────────────────────────────────── */
import { Maps } from "./collections/map/Maps";
import { MapFootprints } from "./collections/map/MapFootprints";

/* ──────────────────────────────────────────────────────────────────────────
   Globals / Organization (singletons)
   ────────────────────────────────────────────────────────────────────────── */
import { Nav } from "./collections/organization/Nav";
import { Footer } from "./collections/organization/Footer";

/* ──────────────────────────────────────────────────────────────────────────
   Path helpers
   ────────────────────────────────────────────────────────────────────────── */
const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

/** Public origins (what the browser actually uses) */
const CMS_PUBLIC = process.env.CMS_PUBLIC_URL || "http://localhost:5322";
const WEB_PUBLIC = process.env.WEB_PUBLIC_URL || "http://localhost:5323";

/** Dev browser origins */
const DEV_ORIGINS = [
  "http://localhost:5322",
  "http://127.0.0.1:5322",
  "http://localhost:5323",
  "http://127.0.0.1:5323",
];

/** IMPORTANT: do NOT include Docker hostnames (cm-cms, cm-web) here — browsers never use them. */
const ALLOWED_ORIGINS = Array.from(new Set([CMS_PUBLIC, WEB_PUBLIC, ...DEV_ORIGINS]));

/* ──────────────────────────────────────────────────────────────────────────
   Admin groups (sidebar) — set via each collection/global's admin.group.
   Ordering in the sidebar follows the order below.
   ────────────────────────────────────────────────────────────────────────── */

const ACCESS_COLLECTIONS: CollectionConfig[] = [
  Users,
  DiscordRoles,
  DiscordUsers,
];

const ORGANIZATION_COLLECTIONS: CollectionConfig[] = [
  Categories,
  Subcategories,
  ThemeTokens, // ← must be a collection, because other fields use relationTo: 'themeTokens'
];

const CONTENT_COLLECTIONS: CollectionConfig[] = [
  Media,
  Series,
  Templates,
  Pages,
  Icons,
];

const GAME_COLLECTIONS: CollectionConfig[] = [
  GameAssetTypes,
  GameAssetStatuses,
  GameAssets,
  GameAssetPlots,
];

const MAP_COLLECTIONS: CollectionConfig[] = [
  Maps,
  MapFootprints,
];

const ORGANIZATION_GLOBALS: GlobalConfig[] = [
  Nav,
  Footer,
];

/* ──────────────────────────────────────────────────────────────────────────
   Build config
   ────────────────────────────────────────────────────────────────────────── */
export default buildConfig({
  admin: {
    // MUST point to an auth-enabled collection present in `collections` below
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
  },

  /** Structured, filterable logs (proper Pino instance → correct Payload type) */
  logger: payloadEnvLogger,

  cors: ALLOWED_ORIGINS,
  csrf: [CMS_PUBLIC, ...DEV_ORIGINS],

  /** ✅ Payload expects only collections here (no globals) */
  collections: [
    ...ACCESS_COLLECTIONS,       // Admin group: "Access"
    ...ORGANIZATION_COLLECTIONS, // Admin group: "Organization"
    ...CONTENT_COLLECTIONS,      // Admin group: "Content"
    ...GAME_COLLECTIONS,         // Admin group: "Game"
    ...MAP_COLLECTIONS,          // Admin group: "Map"
  ],

  /** ✅ Globals are singletons (Nav, Footer) */
  globals: [
    ...ORGANIZATION_GLOBALS,     // Admin group (inside each global's config)
  ],

  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [
      ...defaultFeatures,
      FixedToolbarFeature({ applyToFocusedEditor: true }),
    ],
  }),

  secret: process.env.PAYLOAD_SECRET || "",

  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },

  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || process.env.DATABASE_URL || "",
    },
  }),

  sharp,

  plugins: [
    payloadCloudPlugin(),
  ],
});
