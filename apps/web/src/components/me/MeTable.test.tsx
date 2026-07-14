//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/me/MeTable.test.tsx                                                            ////
//// Language: TSX                                                                                                ////
//// Verifies the member profile hierarchy, workspace destinations, and optional profile-note rendering.         ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import MeTable from "@/components/me/MeTable";

vi.mock("@/components/login/RolesPanel", () => ({
	default: () => <div data-testid="roles-panel">Roles panel</div>,
}));

vi.mock("@/components/me/MePanel", () => ({
	default: ({ open }: { open: boolean }) =>
		open ? <div data-testid="profile-editor">Profile editor</div> : null,
}));

const PROFILE_RESPONSE = {
	id: 1000000001,
	userUid: "user-1",
	discordId: "123456789012345678",
	username: "woodenelf",
	globalName: "Wooden Elf",
	avatarHash: null,
	discriminator: null,
	createdFromSnowflake: null,
	isMember: true,
	roles: null,
	joinedAt: "2026-01-12T12:00:00.000Z",
	gameUsername: "WoodenElf",
	alias: "Wooden",
	entity: null,
	theme: { themeName: "Vintage" },
	notes: null,
	validFrom: null,
	validTo: null,
	lastLoginAt: "2026-07-13T07:00:00.000Z",
	updatedAt: "2026-07-12T10:30:00.000Z",
	createdAt: "2026-01-12T12:00:00.000Z",
};

function createJsonResponse(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

describe("MeTable", () => {
	beforeEach(() => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => createJsonResponse(PROFILE_RESPONSE)),
		);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("keeps Edit profile in the identity hero and exposes three workspace destinations", async () => {
		const { container } = render(<MeTable name="Session User" />);

		await screen.findByRole("heading", { name: "Wooden Elf", level: 1 });

		const editButton = screen.getByRole("button", { name: "Edit profile" });
		expect(editButton).toBeEnabled();
		expect(
			editButton.closest(".member-profile-header__secondary-actions"),
		).not.toBeNull();
		expect(editButton.closest(".browse-page-header__actions")).toBeNull();
		const headerActions = container.querySelector(".browse-page-header__actions");
		expect(headerActions).not.toBeNull();
		expect(headerActions).toHaveTextContent("Mafia Guild Member");
		expect(container.querySelector(".browse-page-header")).not.toBeNull();
		expect(container.querySelector(".surface-page-hero")).toBeNull();
		expect(container.querySelector(".member-profile-avatar--header")).toBeNull();
		expect(
			screen.queryByText(/Manage your profile, authoring workspace/i),
		).toBeNull();
		expect(screen.queryByText("Create and manage")).toBeNull();

		expect(screen.getByRole("link", { name: /My content/i })).toHaveAttribute(
			"href",
			"/me/content",
		);
		expect(screen.getByRole("link", { name: /My media/i })).toHaveAttribute(
			"href",
			"/me/media",
		);
		expect(screen.getByRole("link", { name: /My series/i })).toHaveAttribute(
			"href",
			"/me/series",
		);
		expect(container.querySelectorAll(".member-workspace-card")).toHaveLength(3);
		expect(
			container.querySelectorAll(".member-workspace-card .app-icon-visual"),
		).toHaveLength(3);
		expect(
			container.querySelectorAll(".member-workspace-card.browse-result-card"),
		).toHaveLength(3);
		expect(
			container.querySelector(".member-profile-workspace-panel"),
		).not.toBeNull();

		fireEvent.click(editButton);
		expect(screen.getByTestId("profile-editor")).toBeInTheDocument();
	});

	it("renders compact account groups without an empty profile-note module", async () => {
		const { container } = render(<MeTable name="Session User" />);

		await screen.findByText("Preferences");
		expect(screen.getByText("Account details")).toBeInTheDocument();
		expect(screen.getByText("WoodenElf")).toBeInTheDocument();
		expect(screen.queryByText("Profile notes")).toBeNull();
		expect(container.querySelector(".member-stat-grid--four")).toBeNull();
		expect(container.querySelectorAll(".member-profile-detail-row").length).toBe(
			9,
		);

		await waitFor(() => {
			expect(screen.getByTestId("roles-panel")).toBeInTheDocument();
		});
	});
});

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
