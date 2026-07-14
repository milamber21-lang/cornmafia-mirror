//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/server/admin-route.test.ts                                                           ////
//// Language: TS                                                                                                ////
//// Verifies admin API denial responses, actor extraction, and shared route parsing behavior.                   ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	getAuthSession: vi.fn(),
	requireAdmin: vi.fn(),
	requireAdminOrEditor: vi.fn(),
}));

vi.mock("@/lib/auth/auth", () => ({
	getAuthSession: mocks.getAuthSession,
}));

vi.mock("@/lib/auth/authz", () => ({
	requireAdmin: mocks.requireAdmin,
	requireAdminOrEditor: mocks.requireAdminOrEditor,
}));

import {
	getActorDiscordId,
	normalizeCode,
	parsePageSizeParam,
	parsePositiveInt,
	requireActorDiscordId,
	requireAdminOrEditorResponse,
	requireAdminResponse,
} from "@/lib/server/admin-route";

type ErrorPayload = {
	ok: boolean;
	code: string;
	message: string;
};

async function readError(response: Response): Promise<ErrorPayload> {
	return (await response.json()) as ErrorPayload;
}

beforeEach(() => {
	mocks.getAuthSession.mockReset();
	mocks.requireAdmin.mockReset();
	mocks.requireAdminOrEditor.mockReset();
});

describe("admin guard responses", () => {
	it("returns 401 when no authenticated user exists", async () => {
		mocks.requireAdmin.mockResolvedValue({
			allowed: false,
			reason: "not-authenticated",
		});

		const response = await requireAdminResponse();

		expect(response?.status).toBe(401);
		expect(response ? await readError(response) : null).toEqual({
			ok: false,
			code: "AUTH_REQUIRED",
			message: "Sign in required.",
		});
	});

	it("returns 403 when the actor is authenticated without admin access", async () => {
		mocks.requireAdmin.mockResolvedValue({
			allowed: false,
			reason: "not-admin",
		});

		const response = await requireAdminResponse();

		expect(response?.status).toBe(403);
		expect(response ? await readError(response) : null).toMatchObject({
			code: "PERMISSION_DENIED",
			message: "Admin access required.",
		});
	});

	it("returns null for an allowed admin", async () => {
		mocks.requireAdmin.mockResolvedValue({ allowed: true });

		await expect(requireAdminResponse()).resolves.toBeNull();
	});

	it("returns the editor-aware denial message for shared admin/editor routes", async () => {
		mocks.requireAdminOrEditor.mockResolvedValue({
			allowed: false,
			reason: "not-admin-or-editor",
		});

		const response = await requireAdminOrEditorResponse();

		expect(response?.status).toBe(403);
		expect(response ? await readError(response) : null).toMatchObject({
			code: "PERMISSION_DENIED",
			message: "Admin or editor access required.",
		});
	});
});

describe("admin actor extraction", () => {
	it("normalizes the Discord ID from a valid session", () => {
		expect(
			getActorDiscordId({ user: { discordId: " 123456789012345678 " } }),
		).toBe("123456789012345678");
	});

	it("rejects malformed and empty actor values", () => {
		expect(getActorDiscordId(null)).toBeNull();
		expect(getActorDiscordId({ user: null })).toBeNull();
		expect(getActorDiscordId({ user: { discordId: "  " } })).toBeNull();
	});

	it("returns a 401 response when a successful guard has no actor identity", async () => {
		mocks.requireAdmin.mockResolvedValue({ allowed: true });
		mocks.getAuthSession.mockResolvedValue({ user: { id: "1001" } });

		const result = await requireActorDiscordId();

		expect(typeof result).not.toBe("string");
		if (typeof result !== "string") {
			expect(result.status).toBe(401);
			expect(await readError(result)).toMatchObject({ code: "AUTH_REQUIRED" });
		}
	});

	it("returns the actor Discord ID after a successful guard", async () => {
		mocks.requireAdmin.mockResolvedValue({ allowed: true });
		mocks.getAuthSession.mockResolvedValue({
			user: { discordId: "123456789012345678" },
		});

		await expect(requireActorDiscordId()).resolves.toBe("123456789012345678");
	});
});

describe("shared route parsers", () => {
	it("accepts positive integers and rejects invalid values", () => {
		expect(parsePositiveInt("42")).toBe(42);
		expect(parsePositiveInt(5)).toBe(5);
		expect(parsePositiveInt("0")).toBeNull();
		expect(parsePositiveInt("4.2")).toBeNull();
	});

	it("clamps page sizes to the configured range", () => {
		expect(
			parsePageSizeParam("500", {
				defaultPageSize: 20,
				minPageSize: 5,
				maxPageSize: 100,
			}),
		).toBe(100);
		expect(
			parsePageSizeParam("2", {
				defaultPageSize: 20,
				minPageSize: 5,
				maxPageSize: 100,
			}),
		).toBe(5);
	});

	it("normalizes route codes without accepting empty values", () => {
		expect(normalizeCode("  Release_Ready ")).toBe("release_ready");
		expect(normalizeCode("   ")).toBeNull();
	});
});

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
