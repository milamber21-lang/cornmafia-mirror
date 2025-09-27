// FILE: apps/cms/src/payload.config.ts
// Language: TypeScript

import { postgresAdapter } from "@payloadcms/db-postgres";
import { payloadCloudPlugin } from "@payloadcms/payload-cloud";
import { lexicalEditor, FixedToolbarFeature } from "@payloadcms/richtext-lexical";
import path from "path";
import { buildConfig, type PayloadRequest } from "payload";
import { fileURLToPath } from "url";
import sharp from "sharp";

// ✅ Structured logger (real Pino instance; correct type for Payload)
import { payloadEnvLogger } from "./utils/payloadLogger";

// Collections / Globals
import { Users } from "./collections/Users";
import { Media } from "./collections/Media";
import { DiscordRoles } from "./collections/DiscordRoles";
import { DiscordUsers } from "./collections/DiscordUsers";
import { Categories } from "./collections/Categories";
import { Subcategories } from "./collections/Subcategories";
import { Series } from "./collections/Series";
import { Pages } from "./collections/Pages";
import { Templates } from "./collections/Templates";
import { Nav } from "./globals/Nav";
import { Footer } from "./globals/Footer";
import { Icons } from "./collections/Icons";
import { ThemeTokens } from "./collections/ThemeTokens";
import { Wallets } from "./collections/Wallets";
import { DAO } from "./collections/DAO";

// New collections
import { Resources } from "./collections/Resources";
import { ResourceTypes } from "./collections/ResourceTypes";
import { ResourceSizes } from "./collections/ResourceSizes";
import { Statuses } from "./collections/Statuses";
import { NftIndexes } from "./collections/NftIndexes";
import { NftOwners } from "./collections/NftOwners";
import { ClaimProgress } from "./collections/ClaimProgress";
import { ClaimOrders } from "./collections/ClaimOrders";

// Jobs
import { runClaimSync, scheduleClaimSync } from "./jobs/claimSync";

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

// Minimal response (avoid express types)
type MinimalResponse = {
  status: (code: number) => { json: (body: unknown) => unknown };
};
function isRes(u: unknown): u is MinimalResponse {
  return !!u && typeof u === "object" && typeof (u as { status?: unknown }).status === "function";
}
function toInt(u: unknown, fallback: number): number {
  if (typeof u === "string") {
    const n = Number(u);
    if (Number.isInteger(n) && n > 0) return n;
  }
  return fallback;
}

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
  },

  /** Structured, filterable logs (proper Pino instance → correct Payload type) */
  logger: payloadEnvLogger,

  cors: ALLOWED_ORIGINS,
  csrf: [CMS_PUBLIC, ...DEV_ORIGINS],

  collections: [
    Users,
    Media,
    DiscordRoles,
    DiscordUsers,
    Categories,
    Subcategories,
    Series,
    Templates,
    Pages,
    Icons,
    ThemeTokens,
    Wallets,
    DAO,

    // New stuff
    Resources,
    ResourceTypes,
    ResourceSizes,
    Statuses,
    NftIndexes,
    NftOwners,
    ClaimProgress,
    ClaimOrders,
  ],
  globals: [Nav, Footer],

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

  onInit: async (payload) => {
    if (process.env.CLAIM_SYNC_ENABLED === "1") {
      scheduleClaimSync(payload);
    }
  },

  // === Endpoints ===
  endpoints: [
    // 1) keep your existing job trigger
    {
      path: "/jobs/claim-sync",
      method: "post",
      handler: (async (...args: unknown[]) => {
        const req = args[0] as PayloadRequest;
        const res = args[1];
        const q = (req as unknown as { query?: unknown }).query as
          | Record<string, unknown>
          | undefined;
        const count = toInt(q?.count, 20);
        await runClaimSync(req.payload, count);
        if (isRes(res)) res.status(200).json({ ok: true, ran: true, upcomingCount: count });
      }) as never,
    },

    // 2) NEW: map numeric tags → owners even when DB stores full "Small Land Plot ... #00007"
    {
      path: "/nft-owner-map",
      method: "get",
      handler: (async (...args: unknown[]) => {
        const req = args[0] as PayloadRequest;
        const res = args[1];

        const raw = (req.query?.tags ?? "") as string;
        const tags = String(raw)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

        // Build OR conditions: nftId LIKE "%#00007"
        const orConds = tags.map((t) => ({
          nftId: { like: `%#${String(t).padStart(5, "0")}` },
        }));

        const result = await req.payload.find({
          collection: "nft-owners",
          depth: 0,
          limit: 10000,
          where: orConds.length ? { or: orConds } : undefined,
        });

        const docs = result.docs.map((d: any) => ({
          nftId: d.nftId, // stored full string, e.g. "Small Land Plot Claim CM #00007"
          wallet: d.wallet,
        }));

        if (isRes(res)) res.status(200).json({ docs });
      }) as never,
    },
  ],

  plugins: [
    payloadCloudPlugin(),
    // storage-adapter-placeholder
  ],
});
