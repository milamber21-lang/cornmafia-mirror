//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/test/contracts/content-live-preview-contract.test.ts                                    ////
//// Language: TS                                                                                                 ////
//// Locks guarded unsaved preview rendering to the real renderer and separate admin/member authoring paths.      ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const APP_ROOT = process.cwd();

function readSource(path: string): string {
	return readFileSync(resolve(APP_ROOT, path), "utf8");
}

const renderHelper = readSource("src/lib/server/content-preview-render.tsx");
const adminRoute = readSource("src/app/api/admin/web/content/preview/route.ts");
const memberRoute = readSource("src/app/api/me/content/preview/route.ts");
const adminPanel = readSource("src/components/admin/web/ContentPanel.tsx");
const memberPanel = readSource(
	"src/components/me/MemberContentCreatePanel.tsx",
);
const workspace = readSource(
	"src/components/authoring/ContentAuthoringWorkspace.tsx",
);
const livePreview = readSource(
	"src/components/authoring/ContentLivePreview.tsx",
);

describe("unsaved content live preview contract", () => {
	it("renders through the real shared ContentRenderer", () => {
		expect(renderHelper).toContain("<ContentRenderer model={model} />");
		expect(renderHelper).toContain('from "react-dom/static"');
		expect(renderHelper).toContain("prerender(");
	});

	it("guards admin and member preview endpoints independently", () => {
		expect(adminRoute).toContain("assertSameOriginMutation(request)");
		expect(adminRoute).toContain("requireAdminOrEditorResponse()");
		expect(adminRoute).toContain('surfaceScope: "admin"');
		expect(adminRoute).toContain('mediaRouteScope: "admin"');

		expect(memberRoute).toContain("assertSameOriginMutation(request)");
		expect(memberRoute).toContain("getCurrentActorDiscordId()");
		expect(memberRoute).toContain('bucket: "member:content:preview"');
		expect(memberRoute).toContain('surfaceScope: "member"');
		expect(memberRoute).toContain('mediaRouteScope: "app"');
	});

	it("connects both authoring contexts to the shared workspace with separate endpoints", () => {
		expect(adminPanel).toContain("<ContentAuthoringWorkspace");
		expect(adminPanel).toContain(
			'previewEndpoint="/api/admin/web/content/preview"',
		);
		expect(memberPanel).toContain("<ContentAuthoringWorkspace");
		expect(memberPanel).toContain('previewEndpoint="/api/me/content/preview"');
	});

	it("provides fields, preview, split, full-screen, desktop, and mobile modes", () => {
		for (const label of [
			"Fields",
			"Preview",
			"Split",
			"Full screen",
			"Desktop",
			"Mobile",
		]) {
			expect(workspace).toContain(label);
		}
		expect(livePreview).toContain("JSON.stringify(draft)");
		expect(livePreview).toContain("dangerouslySetInnerHTML");
		expect(livePreview).toContain('credentials: "include"');
	});
});

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
