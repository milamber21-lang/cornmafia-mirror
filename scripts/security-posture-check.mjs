//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: scripts/security-posture-check.mjs                                                                   ////
//// Language: JS                                                                                               ////
//// Static security posture regression checks for DB-first app boundaries and current operator scripts.          ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import {
  closeSync,
  existsSync,
  openSync,
  readFileSync,
  readSync,
  readdirSync,
} from "node:fs";
import { extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(SCRIPT_PATH, "..", "..");
const APP_SRC_ROOT = join(REPO_ROOT, "apps", "web", "src");
const TS_EXTENSIONS = new Set([".ts", ".tsx"]);

const failures = [];

function readProjectFile(relativePath) {
  return readFileSync(join(REPO_ROOT, relativePath), "utf8");
}

function assertCondition(condition, message) {
  if (!condition) {
    failures.push(message);
  }
}

function fileContainsFragment(path, fragment) {
  const descriptor = openSync(path, "r");
  const buffer = Buffer.allocUnsafe(64 * 1024);
  let carry = "";

  try {
    while (true) {
      const bytesRead = readSync(descriptor, buffer, 0, buffer.length, null);
      if (bytesRead === 0) {
        return false;
      }

      const text = carry + buffer.subarray(0, bytesRead).toString("utf8");
      if (text.includes(fragment)) {
        return true;
      }

      carry = text.slice(-Math.max(0, fragment.length - 1));
    }
  } finally {
    closeSync(descriptor);
  }
}

function walkFiles(directory) {
  const rows = [];

  if (!existsSync(directory)) {
    return rows;
  }

  for (const dirent of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, dirent.name);

    if (dirent.isDirectory()) {
      rows.push(...walkFiles(path));
      continue;
    }

    if (dirent.isFile()) {
      rows.push(path);
    }
  }

  return rows;
}

function checkStrictTypeScript() {
  const files = walkFiles(APP_SRC_ROOT).filter((path) =>
    TS_EXTENSIONS.has(extname(path)),
  );
  const forbiddenPatterns = [
    { label: "any[]", pattern: /\bany\s*\[\s*\]/ },
    {
      label: "Record<string, any>",
      pattern: /Record\s*<\s*string\s*,\s*any\s*>/,
    },
    { label: "standalone any", pattern: /\bany\b/ },
  ];

  for (const path of files) {
    const content = readFileSync(path, "utf8");

    for (const item of forbiddenPatterns) {
      assertCondition(
        !item.pattern.test(content),
        `${relative(REPO_ROOT, path)} contains forbidden TypeScript ${item.label}.`,
      );
    }
  }
}

function checkDbFirstBoundary() {
  const files = walkFiles(APP_SRC_ROOT).filter((path) =>
    TS_EXTENSIONS.has(extname(path)),
  );
  const privateSchemas = [
    "game_data",
    "web_analytics",
    "web_game",
    "web_priv",
    "web_riseopedia",
  ];

  for (const path of files) {
    const content = readFileSync(path, "utf8");

    for (const schema of privateSchemas) {
      assertCondition(
        !content.includes(`${schema}.`),
        `${relative(REPO_ROOT, path)} references ${schema} directly from app source.`,
      );
    }
  }
}

function checkRevalidationEndpoint() {
  const path = "apps/web/src/app/api/revalidate-tag/route.ts";
  const content = readProjectFile(path);

  assertCondition(
    content.includes("REVALIDATE_TOKEN"),
    `${path} must use REVALIDATE_TOKEN.`,
  );
  assertCondition(
    content.includes("authorization"),
    `${path} must read Authorization bearer tokens.`,
  );
  assertCondition(
    content.includes("x-revalidate-token"),
    `${path} must support the explicit revalidation token header.`,
  );
  assertCondition(
    content.includes("REVALIDATE_TAG_MAX_LENGTH"),
    `${path} must length-limit revalidation tags.`,
  );
  assertCondition(
    content.includes("ALLOWED_REVALIDATE_TAG_PREFIXES"),
    `${path} must allowlist revalidation tag prefixes.`,
  );
  assertCondition(
    !content.includes('searchParams.get("secret")'),
    `${path} must not accept URL secret parameters.`,
  );
  assertCondition(
    !content.includes("searchParams.get('secret')"),
    `${path} must not accept URL secret parameters.`,
  );
  assertCondition(
    !content.includes('readParam(url, "secret")'),
    `${path} must not accept URL secret parameters.`,
  );
  assertCondition(
    !content.includes("revalidateRequestedTag(bodyTag || readParam"),
    `${path} must not fall back to URL tag parameters.`,
  );
}

function checkMutationOriginGuard() {
  const helperPath = "apps/web/src/lib/server/mutation-origin.ts";
  const proxyPath = "apps/web/src/proxy.ts";
  const deprecatedMiddlewarePath = "apps/web/src/middleware.ts";

  assertCondition(
    existsSync(join(REPO_ROOT, helperPath)),
    `${helperPath} must exist.`,
  );
  assertCondition(
    existsSync(join(REPO_ROOT, proxyPath)),
    `${proxyPath} must exist.`,
  );
  assertCondition(
    !existsSync(join(REPO_ROOT, deprecatedMiddlewarePath)),
    `${deprecatedMiddlewarePath} must be removed; use ${proxyPath}.`,
  );

  if (existsSync(join(REPO_ROOT, helperPath))) {
    const helper = readProjectFile(helperPath);

    assertCondition(
      helper.includes("assertSameOriginMutation"),
      `${helperPath} must export assertSameOriginMutation.`,
    );
    assertCondition(
      helper.includes("sec-fetch-site"),
      `${helperPath} must inspect Sec-Fetch-Site.`,
    );
    assertCondition(
      helper.includes("origin"),
      `${helperPath} must inspect Origin.`,
    );
    assertCondition(
      helper.includes("referer"),
      `${helperPath} must inspect Referer when Origin is absent.`,
    );
    assertCondition(
      helper.includes("/api/auth/"),
      `${helperPath} must exempt NextAuth routes from the custom origin guard.`,
    );
    assertCondition(
      helper.includes("/api/revalidate-tag"),
      `${helperPath} must exempt token-protected revalidation from the custom origin guard.`,
    );
    assertCondition(
      helper.includes("SAME_ORIGIN_REQUIRED"),
      `${helperPath} must use stable same-origin rejection codes.`,
    );
    assertCondition(
      helper.includes("Mutation requests require same-origin proof."),
      `${helperPath} must fail closed when mutation origin proof is missing.`,
    );
  }

  if (existsSync(join(REPO_ROOT, proxyPath))) {
    const proxy = readProjectFile(proxyPath);

    assertCondition(
      proxy.includes("export function proxy"),
      `${proxyPath} must export proxy.`,
    );
    assertCondition(
      proxy.includes("assertSameOriginMutation"),
      `${proxyPath} must call assertSameOriginMutation.`,
    );
    assertCondition(
      proxy.includes("/api/:path*"),
      `${proxyPath} must match API routes.`,
    );
  }
}

function checkCentralSecurityHeaders() {
  const path = "apps/web/next.config.ts";
  const content = readProjectFile(path);
  const requiredHeaders = [
    "Content-Security-Policy",
    "Strict-Transport-Security",
    "X-Frame-Options",
    "Referrer-Policy",
    "Permissions-Policy",
    "X-Content-Type-Options",
  ];

  for (const header of requiredHeaders) {
    assertCondition(
      content.includes(header),
      `${path} must configure ${header}.`,
    );
  }
}

function checkSvgSanitizerPosture() {
  const path = "apps/web/src/lib/helpers/svg-sanitizer.ts";
  const content = readProjectFile(path);

  assertCondition(
    !content.includes("regexSanitize"),
    `${path} must not use the previous regex sanitizer fallback.`,
  );
  assertCondition(
    !content.includes("window.DOMParser"),
    `${path} must not rely on browser-only DOMParser for server sanitization.`,
  );
  assertCondition(
    content.includes("sanitizeSvg"),
    `${path} must expose sanitizeSvg.`,
  );
}

function checkUploadValidationPosture() {
  const path = "apps/web/src/lib/helpers/media-upload-validation.ts";
  const content = readProjectFile(path);
  const requiredFragments = [
    "hasPngSignature",
    "hasJpegSignature",
    "hasGifSignature",
    "hasWebpSignature",
    "hasMp4Signature",
    "hasWebmSignature",
    "detectBinaryMimeType",
    "assertDeclaredMimeCompatible",
  ];

  for (const fragment of requiredFragments) {
    assertCondition(
      content.includes(fragment),
      `${path} must include ${fragment}.`,
    );
  }
}

function checkDockerImagePinning() {
  const composePath = "docker-compose.yml";
  const dockerfilePath = "apps/web/Dockerfile";
  const compose = readProjectFile(composePath);
  const dockerfile = readProjectFile(dockerfilePath);

  assertCondition(
    /postgres:16-alpine@sha256:[a-f0-9]{64}/.test(compose),
    `${composePath} must pin postgres:16-alpine by digest.`,
  );
  assertCondition(
    /node:22\.17\.0-bookworm-slim@sha256:[a-f0-9]{64}/.test(dockerfile),
    `${dockerfilePath} must pin node:22.17.0-bookworm-slim by digest.`,
  );
}

function checkIgnoreFilePosture() {
  const requiredRootIgnoreFragments = [
    "*.sql",
    "*.dump",
    "*.tar.gz",
    "*.tsbuildinfo",
    "scripts/game-maps.txt",
    "apps/web/public/tiles",
    "support/_snapshot.txt",
    "support/_filelist.txt",
  ];

  const ignorePaths = [
    ".dockerignore",
    ".tarignore",
    ".gitignore",
    "apps/web/.dockerignore",
  ];

  for (const path of ignorePaths) {
    const content = readProjectFile(path);

    for (const fragment of requiredRootIgnoreFragments) {
      if (
        path === "apps/web/.dockerignore" &&
        (fragment.startsWith("apps/web/") ||
          fragment.startsWith("support/") ||
          fragment.startsWith("scripts/") ||
          fragment === "*.tsbuildinfo")
      ) {
        continue;
      }

      assertCondition(
        content.includes(fragment),
        `${path} must exclude ${fragment}.`,
      );
    }
  }

  assertCondition(
    existsSync(join(REPO_ROOT, ".prettierignore")),
    ".prettierignore must exist.",
  );

  const forbiddenShadowPaths = [
    "dockerignore",
    "editorconfig",
    "gitignore",
    "prettierignore",
    "tarignore",
    "github",
  ];
  for (const path of forbiddenShadowPaths) {
    assertCondition(
      !existsSync(join(REPO_ROOT, path)),
      `${path} is a non-hidden shadow path and must not exist.`,
    );
  }
}

function checkGeneratedDocsScriptPosture() {
  const path = "scripts/git-push-v1.sh";

  assertCondition(existsSync(join(REPO_ROOT, path)), `${path} must exist.`);

  if (!existsSync(join(REPO_ROOT, path))) {
    return;
  }

  const content = readProjectFile(path);
  const requiredFragments = [
    "docs/_files.md",
    "docs/_snapshot.md",
    "docs/_db.md",
    "git ls-files",
    "MAX_SNAPSHOT_FILE_BYTES",
    "write_db_doc_from_dump",
    "load_env_file",
    "POSTGRES_DB",
    "POSTGRES_USER",
    "CM_OWNER_DATABASE_URL",
    "package-lock.json|apps/web/package-lock.json",
    "*.pem|*.key|*.p12|*.pfx",
    ".env|.env.*|*/.env|*/.env.*",
  ];

  for (const fragment of requiredFragments) {
    assertCondition(
      content.includes(fragment),
      `${path} must include generated-doc hygiene fragment: ${fragment}.`,
    );
  }
}

function checkReleaseScriptPosture() {
  const path = "scripts/git-release-main.sh";

  assertCondition(existsSync(join(REPO_ROOT, path)), `${path} must exist.`);

  if (!existsSync(join(REPO_ROOT, path))) {
    return;
  }

  const content = readProjectFile(path);
  const requiredFragments = [
    "merge --ff-only",
    "git pull --ff-only",
    "require_clean_tree",
    "SOURCE_BRANCH",
    "MAIN_BRANCH",
  ];

  for (const fragment of requiredFragments) {
    assertCondition(
      content.includes(fragment),
      `${path} must include release safety fragment: ${fragment}.`,
    );
  }
}

function checkMirrorScriptPosture() {
  const path = "scripts/git-mirror-public.sh";

  assertCondition(existsSync(join(REPO_ROOT, path)), `${path} must exist.`);

  if (!existsSync(join(REPO_ROOT, path))) {
    return;
  }

  const content = readProjectFile(path);
  const requiredFragments = [
    "MIRROR_GIT_URL",
    "MIRROR_SSH_KEY",
    "cornmafia-mirror",
    "ls-files",
    "git worktree add",
    "should_skip_mirror_path",
    ".env|.env.*|*/.env|*/.env.*",
    "*.sql|*.dump|*.backup",
    "*.tar|*.tar.gz|*.tgz|*.zip|*.7z|*.gz",
    "*.pem|*.key|*.p12|*.pfx",
    "*id_rsa*|*id_ed25519*|*mirror_key*|*cornmafia_mirror*|*authorized_keys*|*known_hosts*",
    "apps/web/public/fonts/*",
    "apps/web/public/tiles/*",
    "support/*",
    "docs/_files.md|docs/_snapshot.md|docs/_db.md",
    "dependabot/*",
  ];

  for (const fragment of requiredFragments) {
    assertCondition(
      content.includes(fragment),
      `${path} must include mirror hygiene fragment: ${fragment}.`,
    );
  }
}

function checkSqlGrantWording() {
  const sqlPaths = walkFiles(
    join(REPO_ROOT, "infra", "bootstrap", "sql"),
  ).filter((path) => extname(path) === ".sql");

  for (const path of sqlPaths) {
    assertCondition(
      !fileContainsFragment(path, "GRANT ALL ON FUNCTION"),
      `${relative(REPO_ROOT, path)} must use GRANT EXECUTE ON FUNCTION, not GRANT ALL ON FUNCTION.`,
    );
  }
}

function checkRateLimitPosture() {
  const helperPath = "apps/web/src/lib/server/rate-limit.ts";
  const runtimeTestPath =
    "apps/web/src/test/contracts/runtime-db-boundary.test.ts";
  const helper = readProjectFile(helperPath);
  const runtimeTest = readProjectFile(runtimeTestPath);

  assertCondition(
    helper.includes("web_api.web_consume_rate_limit"),
    `${helperPath} must use the shared DB-backed rate-limit contract.`,
  );
  assertCondition(
    !helper.includes("new Map<"),
    `${helperPath} must not use process-local rate-limit buckets.`,
  );
  assertCondition(
    helper.includes("CM_TRUST_PROXY_HEADERS"),
    `${helperPath} must require explicit proxy-header trust.`,
  );
  assertCondition(
    runtimeTest.includes("web_api.web_consume_rate_limit"),
    `${runtimeTestPath} must verify the deployed shared rate-limit contract.`,
  );
}

function checkRichTextLinkPickerPosture() {
  const helperPath = "apps/web/src/lib/data/richtext-link-picker.ts";
  const runtimeTestPath =
    "apps/web/src/test/contracts/runtime-db-boundary.test.ts";
  const helper = readProjectFile(helperPath);
  const runtimeTest = readProjectFile(runtimeTestPath);

  assertCondition(
    helper.includes("web_view.riseopedia_entity_link_picker_rows"),
    `${helperPath} must use the dedicated Riseopedia link-picker read model.`,
  );
  assertCondition(
    helper.includes("web_richtext_internal_link_picker_meta"),
    `${helperPath} must load internal link-picker metadata separately.`,
  );
  assertCondition(
    helper.includes("web_richtext_internal_link_picker_rows"),
    `${helperPath} must load internal link-picker rows separately.`,
  );
  assertCondition(
    runtimeTest.includes("web_view.riseopedia_entity_link_picker_rows"),
    `${runtimeTestPath} must verify the deployed Riseopedia picker view.`,
  );
  assertCondition(
    runtimeTest.includes("web_api.web_richtext_internal_link_picker_meta"),
    `${runtimeTestPath} must verify the deployed internal picker metadata function.`,
  );
  assertCondition(
    runtimeTest.includes("web_api.web_richtext_internal_link_picker_rows"),
    `${runtimeTestPath} must verify the deployed internal picker rows function.`,
  );
}

function checkDiscordSyncFailClosed() {
  const authPath = "apps/web/src/lib/auth/auth.ts";
  const authzPath = "apps/web/src/lib/auth/authz.ts";
  const auth = readProjectFile(authPath);
  const authz = readProjectFile(authzPath);

  assertCondition(
    auth.includes("async signIn"),
    `${authPath} must use the signIn callback for login-time Discord sync.`,
  );
  assertCondition(
    auth.includes("syncDiscordUserForSignIn"),
    `${authPath} must fail closed when login-time Discord sync fails.`,
  );
  assertCondition(
    auth.includes("return false"),
    `${authPath} must be able to block sign-in on Discord sync failure.`,
  );
  assertCondition(
    !auth.includes("events: {"),
    `${authPath} must not rely on NextAuth signIn events for required Discord sync.`,
  );
  assertCondition(
    authz.includes("if (state.isRoleRefreshDue)"),
    `${authzPath} must deny stale elevated guards while role refresh remains due.`,
  );
}

function checkSecurityAutomationFiles() {
  const qualityPath = ".github/workflows/security-checks.yml";
  const mirrorPath = ".github/workflows/sync-to-public-mirror.yml";

  assertCondition(
    existsSync(join(REPO_ROOT, qualityPath)),
    `${qualityPath} must exist.`,
  );
  assertCondition(
    existsSync(join(REPO_ROOT, mirrorPath)),
    `${mirrorPath} must exist.`,
  );

  if (existsSync(join(REPO_ROOT, qualityPath))) {
    const quality = readProjectFile(qualityPath);
    const requiredQualityFragments = [
      "npm run format:check",
      "npm run watermark:verify",
      "npm run test:security",
      "npm run audit:web:prod",
      "npm run lint",
      "npm run typecheck:web",
      "npm run test:web",
      "npm run build:web",
      "test:db:setup",
      "CM_TEST_SQL_DUMP",
      "CM_TEST_DATABASE_URL",
      "services:",
      "postgres:",
    ];

    for (const fragment of requiredQualityFragments) {
      assertCondition(
        quality.includes(fragment),
        `${qualityPath} must include ${fragment}.`,
      );
    }
  }

  if (existsSync(join(REPO_ROOT, mirrorPath))) {
    const mirror = readProjectFile(mirrorPath);
    const requiredMirrorFragments = [
      "workflow_run:",
      'workflows: ["Quality and security checks"]',
      "github.event.workflow_run.conclusion == 'success'",
      "github.event.workflow_run.head_branch == 'main'",
      "github.event.workflow_run.head_sha",
    ];

    for (const fragment of requiredMirrorFragments) {
      assertCondition(
        mirror.includes(fragment),
        `${mirrorPath} must include ${fragment}.`,
      );
    }
  }
}

checkStrictTypeScript();
checkDbFirstBoundary();
checkRevalidationEndpoint();
checkMutationOriginGuard();
checkCentralSecurityHeaders();
checkSvgSanitizerPosture();
checkUploadValidationPosture();
checkDockerImagePinning();
checkIgnoreFilePosture();
checkGeneratedDocsScriptPosture();
checkReleaseScriptPosture();
checkMirrorScriptPosture();
checkSqlGrantWording();
checkRateLimitPosture();
checkRichTextLinkPickerPosture();
checkDiscordSyncFailClosed();
checkSecurityAutomationFiles();

if (failures.length > 0) {
  console.error("Security posture checks failed:");

  for (const failure of failures) {
    console.error(`- ${failure}`);
  }

  process.exit(1);
}

console.log("Security posture checks passed.");

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
