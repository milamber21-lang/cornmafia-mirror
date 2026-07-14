//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/test/contracts/member-workspace-shared-ui.test.ts                                       ////
//// Language: TS                                                                                                 ////
//// Verifies member profile and management dashboards use the shared browse UI rather than legacy shells.       ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = join(process.cwd(), "src");
const MEMBER_CSS = readFileSync(join(ROOT, "styles/member.css"), "utf8");

function read(relativePath: string): string {
	return readFileSync(join(ROOT, relativePath), "utf8");
}

const DASHBOARDS = [
	"components/me/MemberContentDashboard.tsx",
	"components/me/MemberCollectionContentDashboard.tsx",
	"components/me/MemberMediaDashboard.tsx",
	"components/me/MemberSeriesDashboard.tsx",
] as const;

describe("member workspace shared UI", () => {
	it("migrates every member management dashboard to shared browse surfaces", () => {
		for (const relativePath of DASHBOARDS) {
			const source = read(relativePath);
			expect(source).toContain("BrowsePageHeader");
			expect(source).toContain("BrowseFilterPanel");
			expect(source).toContain("BrowseResultsPanel");
			expect(source).toContain("MemberManagementCard");
			expect(source).not.toContain('className="member-hero');
			expect(source).not.toContain('className="member-panel"');
			expect(source).not.toContain('className="member-card"');
			expect(source).not.toContain('className="member-stat-grid');
		}
	});

	it("keeps the profile header compact and workspace cards on the shared card shell", () => {
		const source = read("components/me/MeTable.tsx");
		expect(source).toContain("member-profile-header__secondary-actions");
		expect(source).toContain("BrowseResultsPanel");
		expect(source).toContain("BrowseResultCard");
		expect(source).not.toContain("ProfileAvatar");
		expect(source).not.toContain("Manage your profile, authoring workspace");
		expect(source).not.toContain('eyebrow="Workspace"');
	});

	it("places counts on the title row and member actions on the reserved second row", () => {
		const forbiddenDescriptions = [
			"Manage content you authored where your current member permissions still allow authoring.",
			"Manage your content in this collection. Access is checked against your current member permissions.",
			"Manage image uploads that can be attached to your public and member content.",
			"Create and maintain series used by your public and member content.",
		];

		for (const relativePath of DASHBOARDS) {
			const source = read(relativePath);
			expect(source).toContain('className="member-browse-header"');
			expect(source).toContain("member-browse-header__secondary-actions");
			expect(source).toMatch(/actions=\{<StatusPill tone="info">/);
			for (const description of forbiddenDescriptions) {
				expect(source).not.toContain(description);
			}
		}
	});

	it("uses the same one-row filter geometry as the public browse system", () => {
		expect(MEMBER_CSS).toMatch(
			/\.member-browse-filter-controls\s*\{[\s\S]*?width:\s*100%;[\s\S]*?flex-wrap:\s*nowrap;/,
		);
		expect(MEMBER_CSS).toMatch(
			/\.member-browse-filter__control\s*\{[\s\S]*?min-width:\s*7\.75rem;[\s\S]*?flex:\s*0 1 11rem;/,
		);
		expect(MEMBER_CSS).toMatch(
			/\.member-browse-filter__search\s*\{[\s\S]*?min-width:\s*8rem;[\s\S]*?flex:\s*1 2 16rem;/,
		);
		expect(MEMBER_CSS).toMatch(
			/\.member-browse-filter__control \.ui-dropdown__button,[\s\S]*?\.member-browse-filter__search \.ui-input\s*\{[\s\S]*?min-height:\s*var\(--btn-md-h\);[\s\S]*?height:\s*100%;/,
		);
	});
});

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
