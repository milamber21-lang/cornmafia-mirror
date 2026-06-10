//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: scripts/audit-production-dependencies.mjs                                                          ////
//// Language: JS                                                                                               ////
//// Production dependency audit gate with explicit tracking for currently unresolved upstream advisories.       ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { spawnSync } from "node:child_process";

const WEB_DIRECTORY = "apps/web";

const ALLOWED_MODERATE_ADVISORIES = new Map([
	["postcss", new Set(["GHSA-qx2v-qp2m-jg93"])],
	["next", new Set(["GHSA-qx2v-qp2m-jg93"])],
	["next-auth", new Set(["GHSA-qx2v-qp2m-jg93", "GHSA-w5hq-g745-h8pq"])],
	["uuid", new Set(["GHSA-w5hq-g745-h8pq"])],
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
	return match ? match[0] : null;
}

function getVulnerabilities(report) {
	if (!isRecord(report)) {
		return new Map();
	}

	const rawVulnerabilities = report.vulnerabilities;
	if (!isRecord(rawVulnerabilities)) {
		return new Map();
	}

	const rows = new Map();
	for (const [name, value] of Object.entries(rawVulnerabilities)) {
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
	if (!vulnerability) {
		return new Set();
	}

	const ids = new Set();
	const via = vulnerability.via;

	if (!Array.isArray(via)) {
		return ids;
	}

	for (const item of via) {
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
		if (urlId) {
			ids.add(urlId);
		}

		const titleId = extractGhsaId(item.title);
		if (titleId) {
			ids.add(titleId);
		}
	}

	return ids;
}

function isAllowedModerate(name, advisoryIds) {
	const allowedIds = ALLOWED_MODERATE_ADVISORIES.get(name);

	if (!allowedIds || advisoryIds.size === 0) {
		return false;
	}

	for (const id of advisoryIds) {
		if (!allowedIds.has(id)) {
			return false;
		}
	}

	return true;
}

const audit = spawnSync("npm", ["--prefix", WEB_DIRECTORY, "audit", "--omit=dev", "--json"], {
	encoding: "utf8",
});

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
	const advisoryLabel = advisoryIds.size > 0 ? [...advisoryIds].sort().join(", ") : "unidentified advisory";

	if (severity === "critical" || severity === "high") {
		blockingRows.push(`${name}: ${severity} (${advisoryLabel})`);
		continue;
	}

	if (severity === "moderate") {
		if (isAllowedModerate(name, advisoryIds)) {
			allowedRows.push(`${name}: ${severity} (${advisoryLabel})`);
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