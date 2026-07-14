//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/editors/richtext/RichTextEditorLoader.ts                                       ////
//// Language: TS                                                                                                 ////
//// Client-safe dynamic loader for the RichText editor surface.                                                  ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import * as React from "react";

export type LoadedDeps = {
	lexical: Record<string, unknown> | null;

	// React components/plugins
	LexicalComposer: React.ComponentType<unknown> | null;
	RichTextPlugin: React.ComponentType<unknown> | null;
	ContentEditable: React.ComponentType<unknown> | null;
	HistoryPlugin: React.ComponentType<unknown> | null;
	OnChangePlugin: React.ComponentType<unknown> | null;
	ListPlugin: React.ComponentType<unknown> | null;
	CheckListPlugin: React.ComponentType<unknown> | null;
	LinkPlugin: React.ComponentType<unknown> | null;

	// We deliberately do NOT use a HorizontalRule plugin from @lexical/react
	HorizontalRulePlugin: React.ComponentType<unknown> | null;

	// Lexical’s error boundary component
	LexicalErrorBoundary: React.ComponentType<unknown> | null;

	// Nodes / creators
	ListNode: unknown | null;
	ListItemNode: unknown | null;
	HeadingNode: unknown | null;
	QuoteNode: unknown | null;
	LinkNode: unknown | null;

	HorizontalRuleNode: unknown | null;
	HorizontalRuleCreator: (() => unknown) | null;
};

const isFn = (x: unknown): x is (...args: unknown[]) => unknown =>
	typeof x === "function";

function pickAnyComponent<T = React.ComponentType<unknown>>(
	mod: unknown,
	named: string,
): T | null {
	const m = (mod ?? {}) as Record<string, unknown>;
	const cand = (m[named] ?? m.default) as unknown;
	if (!cand) return null;
	if (isFn(cand)) return cand as T;
	if (
		typeof cand === "object" &&
		cand !== null &&
		(cand as { $$typeof?: unknown }).$$typeof
	) {
		return cand as T;
	}
	return null;
}

function mergeKeys(
	target: Record<string, unknown>,
	source: Record<string, unknown> | null,
	keys: string[],
) {
	if (!source) return;
	for (const k of keys) {
		const v = (source as Record<string, unknown>)[k];
		if (typeof v !== "undefined") target[k] = v as unknown;
	}
}

export async function loadLexicalDeps(): Promise<LoadedDeps> {
	let lexicalNS: Record<string, unknown> | null = null;
	try {
		lexicalNS = (await import("lexical")) as unknown as Record<string, unknown>;
	} catch {}

	const selectionMod = await import("@lexical/selection").catch(() => null);
	const listMod = await import("@lexical/list").catch(() => null);
	const linkMod = await import("@lexical/link").catch(() => null);
	const richTextMod = await import("@lexical/rich-text").catch(() => null);

	const mergedLexical: Record<string, unknown> = { ...(lexicalNS ?? {}) };

	// Selection creators/commands
	mergeKeys(
		mergedLexical,
		(selectionMod ?? undefined) as unknown as Record<string, unknown> | null,
		["$setBlocksType", "INDENT_CONTENT_COMMAND", "OUTDENT_CONTENT_COMMAND"],
	);

	// List creators + commands
	mergeKeys(
		mergedLexical,
		(listMod ?? undefined) as unknown as Record<string, unknown> | null,
		[
			"INSERT_UNORDERED_LIST_COMMAND",
			"INSERT_ORDERED_LIST_COMMAND",
			"INSERT_CHECK_LIST_COMMAND",
			"REMOVE_LIST_COMMAND",
			"$createListNode",
			"$createListItemNode",
		],
	);

	// Link toggle + **creator**
	mergeKeys(
		mergedLexical,
		(linkMod ?? undefined) as unknown as Record<string, unknown> | null,
		["TOGGLE_LINK_COMMAND", "$createLinkNode"],
	);

	// Rich text helpers + line break
	mergeKeys(
		mergedLexical,
		(richTextMod ?? undefined) as unknown as Record<string, unknown> | null,
		["$createHeadingNode", "$createQuoteNode", "$createLineBreakNode"],
	);

	const composerMod = await import("@lexical/react/LexicalComposer").catch(
		() => null,
	);
	const LexicalComposer = composerMod
		? pickAnyComponent(composerMod, "LexicalComposer")
		: null;

	const rtpMod = await import("@lexical/react/LexicalRichTextPlugin").catch(
		() => null,
	);
	const RichTextPlugin = rtpMod
		? pickAnyComponent(rtpMod, "RichTextPlugin")
		: null;

	const ceMod = await import("@lexical/react/LexicalContentEditable").catch(
		() => null,
	);
	const ContentEditable = ceMod
		? pickAnyComponent(ceMod, "ContentEditable")
		: null;

	const histMod = await import("@lexical/react/LexicalHistoryPlugin").catch(
		() => null,
	);
	const HistoryPlugin = histMod
		? pickAnyComponent(histMod, "HistoryPlugin")
		: null;

	const ocMod = await import("@lexical/react/LexicalOnChangePlugin").catch(
		() => null,
	);
	const OnChangePlugin = ocMod
		? pickAnyComponent(ocMod, "OnChangePlugin")
		: null;

	const listPluginMod = await import("@lexical/react/LexicalListPlugin").catch(
		() => null,
	);
	const ListPlugin = listPluginMod
		? pickAnyComponent(listPluginMod, "ListPlugin")
		: null;

	const checkListMod =
		await import("@lexical/react/LexicalCheckListPlugin").catch(() => null);
	const CheckListPlugin = checkListMod
		? pickAnyComponent(checkListMod, "CheckListPlugin")
		: null;

	const linkPluginMod = await import("@lexical/react/LexicalLinkPlugin").catch(
		() => null,
	);
	const LinkPlugin = linkPluginMod
		? pickAnyComponent(linkPluginMod, "LinkPlugin")
		: null;

	const ebMod = await import("@lexical/react/LexicalErrorBoundary").catch(
		() => null,
	);
	const LexicalErrorBoundary = ebMod
		? pickAnyComponent(ebMod, "LexicalErrorBoundary")
		: null;

	const ListNode = (listMod as { ListNode?: unknown } | null)?.ListNode ?? null;
	const ListItemNode =
		(listMod as { ListItemNode?: unknown } | null)?.ListItemNode ?? null;

	const LinkNode = (linkMod as { LinkNode?: unknown } | null)?.LinkNode ?? null;

	const HeadingNode =
		(richTextMod as { HeadingNode?: unknown } | null)?.HeadingNode ?? null;
	const QuoteNode =
		(richTextMod as { QuoteNode?: unknown } | null)?.QuoteNode ?? null;

	let HorizontalRuleNode: unknown | null = null;
	let HorizontalRuleCreator: (() => unknown) | null = null;
	let HorizontalRulePlugin: React.ComponentType<unknown> | null = null;

	try {
		const plain = await import("./nodes/HorizontalRuleNode");
		HorizontalRuleNode =
			(plain as { HorizontalRuleNode?: unknown })?.HorizontalRuleNode ?? null;
		HorizontalRuleCreator = isFn(
			(plain as { $createHorizontalRuleNode?: unknown })
				?.$createHorizontalRuleNode,
		)
			? (plain as { $createHorizontalRuleNode: () => unknown })
					.$createHorizontalRuleNode
			: null;
		HorizontalRulePlugin = null;
	} catch {
		HorizontalRuleNode = null;
		HorizontalRuleCreator = null;
		HorizontalRulePlugin = null;
	}

	return {
		lexical: mergedLexical,
		LexicalComposer,
		RichTextPlugin,
		ContentEditable,
		HistoryPlugin,
		OnChangePlugin,
		ListPlugin,
		CheckListPlugin,
		LinkPlugin,
		HorizontalRulePlugin,
		LexicalErrorBoundary,
		ListNode,
		ListItemNode,
		HeadingNode,
		QuoteNode,
		LinkNode,
		HorizontalRuleNode,
		HorizontalRuleCreator,
	};
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
