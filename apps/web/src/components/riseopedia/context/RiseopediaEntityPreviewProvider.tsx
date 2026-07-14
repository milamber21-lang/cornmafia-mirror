//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/context/RiseopediaEntityPreviewProvider.tsx                      ////
//// Language: TSX                                                                                              ////
//// Delegated hover/focus preview shell for Riseopedia entity links across wiki and normal public content.      ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

"use client";

import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
	type CSSProperties,
	type FocusEvent as ReactFocusEvent,
	type JSX,
	type KeyboardEvent as ReactKeyboardEvent,
	type PointerEvent as ReactPointerEvent,
	type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import RiseopediaEntityCard from "@/components/riseopedia/browse/cards/RiseopediaEntityCard";
import type { RiseopediaEntityDoc } from "@/lib/data/riseopedia-entities";
import {
	mafiosopediaReleaseSearchParam,
	type MafiosopediaReleaseFilterCode,
} from "@/lib/data/mafiosopedia-release";
import type { OpediaWikiCode } from "@/lib/helpers/riseopedia-entity-links";

const OPEN_DELAY_MS = 220;
const CLOSE_DELAY_MS = 140;
const VIEWPORT_MARGIN_PX = 16;
const PREVIEW_GAP_PX = 12;
const ENTITY_LINK_PATTERN =
	/^\/info\/(riseopedia|mafiosopedia)\/entity\/([a-z0-9][a-z0-9-]{0,127})\/?$/;

const previewCache = new Map<string, RiseopediaEntityDoc | null>();
const previewRequests = new Map<string, Promise<RiseopediaEntityDoc | null>>();

type PreviewTarget = {
	anchor: HTMLAnchorElement;
	cacheKey: string;
	entitySlug: string;
	href: string;
	requestUrl: string;
};

type PreviewPosition = {
	left: number;
	top: number;
	placement: "above" | "below";
};

type PreviewStatus = "idle" | "loading" | "ready" | "error";

export type RiseopediaEntityPreviewProviderProps = {
	children: ReactNode;
	currentEntitySlug?: string | null;
	wikiCode: OpediaWikiCode;
	releaseFilters?: readonly MafiosopediaReleaseFilterCode[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNullableString(value: unknown): boolean {
	return value === null || typeof value === "string";
}

function isEntityDoc(value: unknown): value is RiseopediaEntityDoc {
	if (!isRecord(value)) {
		return false;
	}

	return (
		typeof value.entityId === "string" &&
		typeof value.entityTypeCode === "string" &&
		typeof value.entityKey === "string" &&
		typeof value.entityName === "string" &&
		typeof value.entitySlug === "string" &&
		isNullableString(value.entityTypeName) &&
		isNullableString(value.sectionCode) &&
		isNullableString(value.sectionName) &&
		isNullableString(value.entityClassCode) &&
		isNullableString(value.entityClassName) &&
		isNullableString(value.categoryCode) &&
		isNullableString(value.categoryName) &&
		isNullableString(value.categorySlug) &&
		isNullableString(value.subcategoryCode) &&
		isNullableString(value.subcategoryName) &&
		isNullableString(value.subcategorySlug) &&
		isNullableString(value.categorySubcategoryLabel) &&
		isNullableString(value.classificationPathLabel) &&
		isNullableString(value.releaseStateCode) &&
		isNullableString(value.releaseStateName) &&
		(value.cardMode === "compact" || value.cardMode === "full") &&
		Array.isArray(value.cardProperties)
	);
}

function previewDocFromPayload(value: unknown): RiseopediaEntityDoc | null {
	if (!isRecord(value)) {
		return null;
	}

	return isEntityDoc(value.doc) ? value.doc : null;
}

async function loadPreviewDoc(
	target: PreviewTarget,
): Promise<RiseopediaEntityDoc | null> {
	if (previewCache.has(target.cacheKey)) {
		return previewCache.get(target.cacheKey) ?? null;
	}

	const pending = previewRequests.get(target.cacheKey);
	if (pending) {
		return pending;
	}

	const request = fetch(target.requestUrl, {
		method: "GET",
		headers: { Accept: "application/json" },
	})
		.then(async (response) => {
			if (!response.ok) {
				return null;
			}

			const payload: unknown = await response.json();
			return previewDocFromPayload(payload);
		})
		.catch(() => null)
		.then((doc) => {
			previewCache.set(target.cacheKey, doc);
			previewRequests.delete(target.cacheKey);
			return doc;
		});

	previewRequests.set(target.cacheKey, request);
	return request;
}

function anchorFromTarget(
	target: EventTarget | null,
): HTMLAnchorElement | null {
	return target instanceof Element ? target.closest("a[href]") : null;
}

function relatedTargetInside(
	relatedTarget: EventTarget | null,
	element: Element | null,
): boolean {
	return (
		relatedTarget instanceof Node && element?.contains(relatedTarget) === true
	);
}

export default function RiseopediaEntityPreviewProvider({
	children,
	currentEntitySlug,
	wikiCode,
	releaseFilters,
}: RiseopediaEntityPreviewProviderProps): JSX.Element {
	const scopeRef = useRef<HTMLDivElement | null>(null);
	const panelRef = useRef<HTMLDivElement | null>(null);
	const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const requestSequenceRef = useRef(0);
	const [mounted, setMounted] = useState(false);
	const [target, setTarget] = useState<PreviewTarget | null>(null);
	const [doc, setDoc] = useState<RiseopediaEntityDoc | null>(null);
	const [status, setStatus] = useState<PreviewStatus>("idle");
	const [position, setPosition] = useState<PreviewPosition>({
		left: VIEWPORT_MARGIN_PX,
		top: VIEWPORT_MARGIN_PX,
		placement: "below",
	});

	const clearOpenTimer = useCallback(() => {
		if (openTimerRef.current) {
			clearTimeout(openTimerRef.current);
			openTimerRef.current = null;
		}
	}, []);

	const clearCloseTimer = useCallback(() => {
		if (closeTimerRef.current) {
			clearTimeout(closeTimerRef.current);
			closeTimerRef.current = null;
		}
	}, []);

	const closePreview = useCallback(() => {
		clearOpenTimer();
		clearCloseTimer();
		requestSequenceRef.current += 1;
		setTarget(null);
		setDoc(null);
		setStatus("idle");
	}, [clearCloseTimer, clearOpenTimer]);

	const scheduleClose = useCallback(() => {
		clearCloseTimer();
		closeTimerRef.current = setTimeout(closePreview, CLOSE_DELAY_MS);
	}, [clearCloseTimer, closePreview]);

	const targetForAnchor = useCallback(
		(anchor: HTMLAnchorElement): PreviewTarget | null => {
			let url: URL;
			try {
				url = new URL(anchor.href, window.location.origin);
			} catch {
				return null;
			}

			if (url.origin !== window.location.origin) {
				return null;
			}

			const match = url.pathname.match(ENTITY_LINK_PATTERN);
			if (
				!match ||
				match[1] !== wikiCode ||
				(currentEntitySlug !== null &&
					currentEntitySlug !== undefined &&
					match[2] === currentEntitySlug)
			) {
				return null;
			}

			const entitySlug = match[2];
			const release =
				wikiCode === "mafiosopedia"
					? (url.searchParams.get("release") ??
						mafiosopediaReleaseSearchParam(releaseFilters ?? []))
					: null;
			const releaseQuery = release
				? `?release=${encodeURIComponent(release)}`
				: "";
			const requestUrl = `/api/${wikiCode}/entity-preview/${encodeURIComponent(
				entitySlug,
			)}${releaseQuery}`;

			return {
				anchor,
				cacheKey: `${wikiCode}:${release ?? "public"}:${entitySlug}`,
				entitySlug,
				href: `${url.pathname}${url.search}`,
				requestUrl,
			};
		},
		[currentEntitySlug, releaseFilters, wikiCode],
	);

	const openPreview = useCallback(
		(nextTarget: PreviewTarget, immediate: boolean) => {
			clearOpenTimer();
			clearCloseTimer();

			const execute = () => {
				const requestSequence = requestSequenceRef.current + 1;
				requestSequenceRef.current = requestSequence;
				setTarget(nextTarget);
				setDoc(previewCache.get(nextTarget.cacheKey) ?? null);
				setStatus(previewCache.has(nextTarget.cacheKey) ? "ready" : "loading");

				void loadPreviewDoc(nextTarget).then((nextDoc) => {
					if (requestSequenceRef.current !== requestSequence) {
						return;
					}

					setDoc(nextDoc);
					setStatus(nextDoc ? "ready" : "error");
				});
			};

			if (immediate) {
				execute();
				return;
			}

			openTimerRef.current = setTimeout(execute, OPEN_DELAY_MS);
		},
		[clearCloseTimer, clearOpenTimer],
	);

	const updatePosition = useCallback(() => {
		if (!target || !panelRef.current) {
			return;
		}

		const anchorRect = target.anchor.getBoundingClientRect();
		const panelRect = panelRef.current.getBoundingClientRect();
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;
		const belowSpace = viewportHeight - anchorRect.bottom - PREVIEW_GAP_PX;
		const aboveSpace = anchorRect.top - PREVIEW_GAP_PX;
		const placement =
			belowSpace >= panelRect.height || belowSpace >= aboveSpace
				? "below"
				: "above";
		const desiredTop =
			placement === "below"
				? anchorRect.bottom + PREVIEW_GAP_PX
				: anchorRect.top - panelRect.height - PREVIEW_GAP_PX;
		const desiredLeft =
			anchorRect.left + anchorRect.width / 2 - panelRect.width / 2;
		const maxLeft = Math.max(
			VIEWPORT_MARGIN_PX,
			viewportWidth - panelRect.width - VIEWPORT_MARGIN_PX,
		);
		const maxTop = Math.max(
			VIEWPORT_MARGIN_PX,
			viewportHeight - panelRect.height - VIEWPORT_MARGIN_PX,
		);

		setPosition({
			left: Math.min(Math.max(desiredLeft, VIEWPORT_MARGIN_PX), maxLeft),
			top: Math.min(Math.max(desiredTop, VIEWPORT_MARGIN_PX), maxTop),
			placement,
		});
	}, [target]);

	useEffect(() => {
		setMounted(true);
		return () => {
			clearOpenTimer();
			clearCloseTimer();
		};
	}, [clearCloseTimer, clearOpenTimer]);

	useLayoutEffect(() => {
		updatePosition();
	}, [doc, status, target, updatePosition]);

	useEffect(() => {
		if (!target) {
			return;
		}

		const handleViewportChange = () => updatePosition();
		window.addEventListener("resize", handleViewportChange);
		window.addEventListener("scroll", handleViewportChange, true);
		return () => {
			window.removeEventListener("resize", handleViewportChange);
			window.removeEventListener("scroll", handleViewportChange, true);
		};
	}, [target, updatePosition]);

	const handlePointerOver = (event: ReactPointerEvent<HTMLDivElement>) => {
		if (event.pointerType === "touch") {
			return;
		}

		const anchor = anchorFromTarget(event.target);
		if (!anchor || !scopeRef.current?.contains(anchor)) {
			return;
		}

		if (relatedTargetInside(event.relatedTarget, anchor)) {
			return;
		}

		const nextTarget = targetForAnchor(anchor);
		if (nextTarget) {
			openPreview(nextTarget, false);
		}
	};

	const handlePointerOut = (event: ReactPointerEvent<HTMLDivElement>) => {
		const anchor = anchorFromTarget(event.target);
		if (!anchor || relatedTargetInside(event.relatedTarget, anchor)) {
			return;
		}

		if (relatedTargetInside(event.relatedTarget, panelRef.current)) {
			return;
		}

		scheduleClose();
	};

	const handleFocus = (event: ReactFocusEvent<HTMLDivElement>) => {
		const anchor = anchorFromTarget(event.target);
		const nextTarget = anchor ? targetForAnchor(anchor) : null;
		if (nextTarget) {
			openPreview(nextTarget, true);
		}
	};

	const handleBlur = (event: ReactFocusEvent<HTMLDivElement>) => {
		if (relatedTargetInside(event.relatedTarget, panelRef.current)) {
			return;
		}
		scheduleClose();
	};

	const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
		if (event.key === "Escape") {
			closePreview();
		}
	};

	const runtimeStyle = {
		"--riseopedia-entity-preview-left": `${position.left}px`,
		"--riseopedia-entity-preview-top": `${position.top}px`,
	} as CSSProperties;

	return (
		<>
			<div
				className="riseopedia-entity-preview-scope"
				ref={scopeRef}
				onBlur={handleBlur}
				onFocus={handleFocus}
				onKeyDown={handleKeyDown}
				onPointerOut={handlePointerOut}
				onPointerOver={handlePointerOver}
			>
				{children}
			</div>
			{mounted && target
				? createPortal(
						<div
							aria-label="Entity preview"
							className="riseopedia-entity-preview"
							data-placement={position.placement}
							ref={panelRef}
							role="dialog"
							style={runtimeStyle}
							onPointerEnter={clearCloseTimer}
							onPointerLeave={scheduleClose}
						>
							<div className="riseopedia-entity-preview__eyebrow">Entity preview</div>
							{status === "ready" && doc ? (
								<div className="riseopedia-entity-preview__card">
									<RiseopediaEntityCard
										entity={{ ...doc, cardMode: "full" }}
										wikiCode={wikiCode}
										releaseFilters={
											wikiCode === "mafiosopedia" ? [...(releaseFilters ?? [])] : undefined
										}
									/>
								</div>
							) : (
								<div className="riseopedia-entity-preview__state" aria-live="polite">
									{status === "error"
										? "Preview unavailable. The normal link remains available."
										: "Loading preview…"}
								</div>
							)}
						</div>,
						document.body,
					)
				: null}
		</>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
