//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/server/info-route.test.ts                                                            ////
//// Language: TS                                                                                                ////
//// Verifies shared Riseopedia and Mafiosopedia route recognition and DB-gated actor forwarding.                ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	findPublicCollectionByPath: vi.fn(),
	findPublicContentByPath: vi.fn(),
	getCurrentActorDiscordId: vi.fn(),
}));

vi.mock("@/lib/data/public-content", () => ({
	findPublicCollectionByPath: mocks.findPublicCollectionByPath,
	findPublicContentByPath: mocks.findPublicContentByPath,
}));

vi.mock("@/lib/server/current-actor", () => ({
	getCurrentActorDiscordId: mocks.getCurrentActorDiscordId,
}));

import {
	findInfoRouteContent,
	findInfoSubcategoryRoute,
	isInfoWikiCategory,
	normalizeInfoRouteSegment,
} from "@/lib/server/info-route";

beforeEach(() => {
	mocks.findPublicCollectionByPath.mockReset();
	mocks.findPublicContentByPath.mockReset();
	mocks.getCurrentActorDiscordId.mockReset();
	mocks.getCurrentActorDiscordId.mockResolvedValue("123456789012345678");
});

describe("info route recognition", () => {
	it("accepts only the supported wiki channel slugs", () => {
		expect(isInfoWikiCategory("riseopedia")).toBe(true);
		expect(isInfoWikiCategory("mafiosopedia")).toBe(true);
		expect(isInfoWikiCategory("wiki")).toBe(false);
	});

	it("normalizes path segments consistently", () => {
		expect(normalizeInfoRouteSegment(" /Riseopedia/ ")).toBe("riseopedia");
		expect(normalizeInfoRouteSegment("   ")).toBeNull();
		expect(normalizeInfoRouteSegment(null)).toBeNull();
	});
});

describe("DB-gated info route reads", () => {
	it("passes the fresh actor to collection resolution", async () => {
		mocks.findPublicCollectionByPath.mockResolvedValue({
			categorySlug: "riseopedia",
			subcategorySlug: "browse",
		});

		await findInfoSubcategoryRoute({
			categorySlug: "riseopedia",
			subcategorySlug: "browse",
		});

		expect(mocks.getCurrentActorDiscordId).toHaveBeenCalledTimes(1);
		expect(mocks.findPublicCollectionByPath).toHaveBeenCalledWith({
			actorDiscordId: "123456789012345678",
			categorySlug: "riseopedia",
			subcategorySlug: "browse",
		});
	});

	it("uses the same protected resolver shape for Mafiosopedia", async () => {
		mocks.findPublicCollectionByPath.mockResolvedValue({
			categorySlug: "mafiosopedia",
			subcategorySlug: "sections",
		});

		await findInfoSubcategoryRoute({
			categorySlug: "mafiosopedia",
			subcategorySlug: "sections",
		});

		expect(mocks.findPublicCollectionByPath).toHaveBeenCalledWith({
			actorDiscordId: "123456789012345678",
			categorySlug: "mafiosopedia",
			subcategorySlug: "sections",
		});
	});

	it("does not query content when a content slug is absent", async () => {
		await expect(
			findInfoRouteContent({
				categorySlug: "riseopedia",
				subcategorySlug: "entity",
			}),
		).resolves.toBeNull();

		expect(mocks.getCurrentActorDiscordId).not.toHaveBeenCalled();
		expect(mocks.findPublicContentByPath).not.toHaveBeenCalled();
	});

	it("forwards the fresh actor and info route prefix to content resolution", async () => {
		mocks.findPublicContentByPath.mockResolvedValue({
			contentId: "1001",
			slug: "corn-seed",
		});

		await findInfoRouteContent({
			categorySlug: "riseopedia",
			subcategorySlug: "entity",
			contentSlug: "corn-seed",
		});

		expect(mocks.findPublicContentByPath).toHaveBeenCalledWith({
			actorDiscordId: "123456789012345678",
			publicRoutePrefix: "info",
			categorySlug: "riseopedia",
			subcategorySlug: "entity",
			contentSlug: "corn-seed",
		});
	});
});

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
