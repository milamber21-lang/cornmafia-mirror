//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: scripts/audit-production-dependencies.mjs                                                          ////
//// Language: JS                                                                                               ////
//// Production dependency audit gate with expiring, owned exceptions for unresolved upstream advisories.      ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { spawnSync } from "node:child_process";

const WEB_DIRECTORY = "apps/web";
const TODAY = new Date();

const ALLOWED_MODERATE_ADVISORIES = new Map([
  [
    "uuid",
    new Map([
      [
        "GHSA-W5HQ-G745-H8PQ",
        {
          owner: "web-platform",
          reviewBy: "2026-10-01",
          reason:
            "next-auth 4.24.14 still depends on uuid ^8.3.2. Corn Mafia does not call the affected buffer-writing v3/v5/v6 API surface.",
        },
      ],
    ]),
  ],
  [
    "next-auth",
    new Map([
      [
        "GHSA-W5HQ-G745-H8PQ",
        {
          owner: "web-platform",
          reviewBy: "2026-10-01",
          reason:
            "Transitive uuid advisory inherited through next-auth 4.24.14; review on each next-auth release.",
        },
      ],
    ]),
  ],
]);

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeSeverity(value) {
  return typeof value === "string" ? value.toLowerCase() : "";
}

function extractGhsaId(value) {
  if (typeof value !== "string") {
    return null;
  }

  const match = value.match(/GHSA-[a-z0-9]+-[a-z0-9]+-[a-z0-9]+/i);
  return match ? match[0].toUpperCase() : null;
}

function getVulnerabilities(report) {
  if (!isRecord(report) || !isRecord(report.vulnerabilities)) {
    return new Map();
  }

  const rows = new Map();
  for (const [name, value] of Object.entries(report.vulnerabilities)) {
    if (isRecord(value)) {
      rows.set(name, value);
    }
  }

  return rows;
}

function collectAdvisoryIds(name, vulnerabilities, visited = new Set()) {
  if (visited.has(name)) {
    return new Set();
  }

  visited.add(name);
  const vulnerability = vulnerabilities.get(name);
  if (!vulnerability || !Array.isArray(vulnerability.via)) {
    return new Set();
  }

  const ids = new Set();
  for (const item of vulnerability.via) {
    if (typeof item === "string") {
      for (const id of collectAdvisoryIds(item, vulnerabilities, visited)) {
        ids.add(id);
      }
      continue;
    }

    if (!isRecord(item)) {
      continue;
    }

    const urlId = extractGhsaId(item.url);
    const titleId = extractGhsaId(item.title);
    if (urlId) {
      ids.add(urlId);
    }
    if (titleId) {
      ids.add(titleId);
    }
  }

  return ids;
}

function parseReviewDate(value) {
  const parsed = new Date(`${value}T23:59:59.999Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function evaluateModerateAllowance(name, advisoryIds) {
  const packageAllowances = ALLOWED_MODERATE_ADVISORIES.get(name);
  if (!packageAllowances || advisoryIds.size === 0) {
    return { allowed: false, labels: [] };
  }

  const labels = [];
  for (const id of advisoryIds) {
    const allowance = packageAllowances.get(id);
    if (!allowance) {
      return { allowed: false, labels: [] };
    }

    const reviewDate = parseReviewDate(allowance.reviewBy);
    if (!reviewDate || reviewDate < TODAY) {
      return { allowed: false, labels: [] };
    }

    labels.push(
      `${id}; owner=${allowance.owner}; reviewBy=${allowance.reviewBy}; reason=${allowance.reason}`,
    );
  }

  return { allowed: true, labels };
}

const audit = spawnSync(
  "npm",
  ["--prefix", WEB_DIRECTORY, "audit", "--omit=dev", "--json"],
  {
    encoding: "utf8",
  },
);

if (!audit.stdout.trim()) {
  console.error(audit.stderr.trim() || "npm audit did not return JSON output.");
  process.exit(1);
}

let report;
try {
  report = JSON.parse(audit.stdout);
} catch {
  console.error("npm audit returned invalid JSON.");
  console.error(audit.stdout);
  process.exit(1);
}

const vulnerabilities = getVulnerabilities(report);
const blockingRows = [];
const allowedRows = [];

for (const [name, vulnerability] of vulnerabilities) {
  const severity = normalizeSeverity(vulnerability.severity);
  const advisoryIds = collectAdvisoryIds(name, vulnerabilities);
  const advisoryLabel =
    advisoryIds.size > 0
      ? [...advisoryIds].sort().join(", ")
      : "unidentified advisory";

  if (severity === "critical" || severity === "high") {
    blockingRows.push(`${name}: ${severity} (${advisoryLabel})`);
    continue;
  }

  if (severity === "moderate") {
    const allowance = evaluateModerateAllowance(name, advisoryIds);
    if (allowance.allowed) {
      allowedRows.push(
        `${name}: ${severity} (${allowance.labels.join(" | ")})`,
      );
      continue;
    }

    blockingRows.push(`${name}: ${severity} (${advisoryLabel})`);
  }
}

if (allowedRows.length > 0) {
  console.warn("Allowed tracked moderate production advisories remain:");
  for (const row of allowedRows) {
    console.warn(`- ${row}`);
  }
}

if (blockingRows.length > 0) {
  console.error("Blocking production dependency advisories found:");
  for (const row of blockingRows) {
    console.error(`- ${row}`);
  }
  process.exit(1);
}

console.log("Production dependency audit gate passed.");

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
