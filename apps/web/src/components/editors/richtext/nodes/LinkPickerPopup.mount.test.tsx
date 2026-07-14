/** @vitest-environment jsdom */
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/editors/richtext/nodes/LinkPickerPopup.mount.test.tsx                         ////
//// Language: TSX                                                                                               ////
//// Regression tests for cached metadata, fast rows, and opening the RichText link picker inside Lexical.       ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import * as React from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import RichTextEditorToolbar, {
	type SelectionSummary,
} from "../RichTextEditorToolbar";
import LinkPickerPopup from "./LinkPickerPopup";
import { clearRichTextLinkPickerCache } from "./richtext-link-picker-cache";

const EMPTY_SELECTION: SelectionSummary = {
	formats: {
		bold: false,
		italic: false,
		underline: false,
		strikethrough: false,
		code: false,
		subscript: false,
		superscript: false,
	},
	block: "paragraph",
	list: null,
	hasLink: false,
	at: { hr: false, image: false },
};

const EMPTY_META_RESPONSE = {
	internal: { categories: [], subcategories: [] },
	riseopedia: {
		entityTypes: [],
		classes: [],
		categories: [],
		subcategories: [],
	},
};

function jsonResponse(payload: unknown): Response {
	return new Response(JSON.stringify(payload), {
		headers: { "Content-Type": "application/json" },
		status: 200,
	});
}

function emptyPickerFetch(): ReturnType<typeof vi.fn> {
	return vi.fn(async (input: RequestInfo | URL) => {
		const url = String(input);
		return url.endsWith("/meta")
			? jsonResponse(EMPTY_META_RESPONSE)
			: jsonResponse({ rows: [] });
	});
}

function renderInsideLexical(
	children: React.ReactNode,
): ReturnType<typeof render> {
	return render(
		<LexicalComposer
			initialConfig={{
				namespace: "link-picker-mount-test",
				nodes: [],
				onError(error: Error) {
					throw error;
				},
				theme: {},
			}}
		>
			{children}
		</LexicalComposer>,
	);
}

afterEach(() => {
	clearRichTextLinkPickerCache();
	vi.unstubAllGlobals();
});

describe("LinkPickerPopup mount", () => {
	it("mounts without reading Lexical selection outside editor state", () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(() => new Promise<Response>(() => undefined)),
		);

		expect(() =>
			renderInsideLexical(
				<LinkPickerPopup
					open
					mediaContext="admin"
					onApply={() => undefined}
					onClose={() => undefined}
				/>,
			),
		).not.toThrow();
	});

	it("mounts as a viewport-centered modal instead of an anchored popup", () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(() => new Promise<Response>(() => undefined)),
		);

		const rendered = renderInsideLexical(
			<LinkPickerPopup
				open
				mediaContext="admin"
				onApply={() => undefined}
				onClose={() => undefined}
			/>,
		);

		const dialog = screen.getByRole("dialog", { name: "Create a link" });
		expect(dialog.getAttribute("aria-modal")).toBe("true");
		expect(dialog.getAttribute("style") ?? "").not.toContain("top:");
		expect(dialog.getAttribute("style") ?? "").not.toContain("left:");
		expect(
			rendered.container.querySelector(".editor-link-picker-modal"),
		).toBeTruthy();
	});

	it("does not open from the initial link signal and opens only after the signal changes", async () => {
		const fetchMock = emptyPickerFetch();
		vi.stubGlobal("fetch", fetchMock);

		function SignalHarness(): React.JSX.Element {
			const [signal, setSignal] = React.useState(0);

			return (
				<>
					<button type="button" onClick={() => setSignal((value) => value + 1)}>
						Trigger link signal
					</button>
					<RichTextEditorToolbar
						features={{ link_toggle: true }}
						layout={["link_toggle"]}
						selection={EMPTY_SELECTION}
						linkPickerContext="admin"
						openLinkOnSignal={signal}
					/>
				</>
			);
		}

		renderInsideLexical(<SignalHarness />);

		expect(screen.queryByRole("dialog", { name: "Create a link" })).toBeNull();
		expect(fetchMock).not.toHaveBeenCalled();

		fireEvent.click(screen.getByRole("button", { name: "Trigger link signal" }));

		expect(screen.getByRole("dialog", { name: "Create a link" })).toBeTruthy();
		await waitFor(() => {
			expect(fetchMock).toHaveBeenCalledTimes(2);
		});
	});

	it("opens from the toolbar and starts metadata and internal-row requests", async () => {
		const fetchMock = emptyPickerFetch();
		vi.stubGlobal("fetch", fetchMock);

		renderInsideLexical(
			<RichTextEditorToolbar
				features={{ link_toggle: true }}
				layout={["link_toggle"]}
				selection={EMPTY_SELECTION}
				linkPickerContext="admin"
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Add link" }));

		expect(screen.getByRole("dialog", { name: "Create a link" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Internal Page" })).toBeTruthy();

		await waitFor(() => {
			const requestedUrls = fetchMock.mock.calls.map((call) => String(call[0]));
			expect(requestedUrls).toContain("/api/admin/web/richtext-links/meta");
			expect(requestedUrls).toContain("/api/admin/web/richtext-links/internal");
		});
	});

	it("renders dense rows from the rows endpoint while metadata comes from the cached meta endpoint", async () => {
		const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
			const url = String(input);
			if (url.endsWith("/meta")) {
				return jsonResponse({
					internal: {
						categories: [{ value: "10", label: "Learn" }],
						subcategories: [{ value: "20", label: "Crafting", parentValue: "10" }],
					},
					riseopedia: EMPTY_META_RESPONSE.riseopedia,
				});
			}

			return jsonResponse({
				rows: [
					{
						id: "30",
						title: "Crafting Basics",
						summary: "A readable introduction.",
						categoryId: "10",
						categoryLabel: "Learn",
						subcategoryId: "20",
						subcategoryLabel: "Crafting",
						contentKindCode: "rich_text",
						contentKindLabel: "Page",
						href: "/learn/crafting/crafting-basics",
					},
				],
			});
		});
		vi.stubGlobal("fetch", fetchMock);

		const rendered = renderInsideLexical(
			<LinkPickerPopup
				open
				mediaContext="admin"
				onApply={() => undefined}
				onClose={() => undefined}
			/>,
		);

		expect(
			screen.getByPlaceholderText("Search readable content").className,
		).toContain("ui-input");

		await waitFor(() => {
			expect(screen.getByText("Crafting Basics")).toBeTruthy();
		});

		const resultRow = screen.getByRole("button", {
			name: /Crafting Basics/i,
		});
		expect(resultRow.className).toContain("editor-link-picker-result");
		expect(rendered.container.querySelectorAll(".ui-dropdown")).toHaveLength(2);
	});

	it("reuses fresh session-cache responses when the picker is reopened", async () => {
		const fetchMock = emptyPickerFetch();
		vi.stubGlobal("fetch", fetchMock);

		const rendered = renderInsideLexical(
			<LinkPickerPopup
				open
				mediaContext="admin"
				onApply={() => undefined}
				onClose={() => undefined}
			/>,
		);

		await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
		rendered.rerender(
			<LexicalComposer
				initialConfig={{
					namespace: "link-picker-mount-test",
					nodes: [],
					onError(error: Error) {
						throw error;
					},
					theme: {},
				}}
			>
				<LinkPickerPopup
					open
					mediaContext="admin"
					onApply={() => undefined}
					onClose={() => undefined}
				/>
			</LexicalComposer>,
		);

		await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
	});
});

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
