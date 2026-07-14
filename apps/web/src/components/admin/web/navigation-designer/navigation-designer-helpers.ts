//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/web/navigation-designer/navigation-designer-helpers.ts                   ////
//// Language: TS                                                                                               ////
//// Pure helpers for navigation designer limits, icons, guards, search, and local tree identity.                ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type {
	NavigationCategoryLookupItem,
	NavigationContentLookupItem,
	NavigationPanelTree,
	NavigationSubcategoryLookupItem,
	NavigationTreeCategory,
	NavigationTreeSubcategory,
	NavigationTreeTarget,
} from "@/lib/data/navigation";

import type {
	DesignerPanelTree,
	DesignerTreeCategory,
	DesignerTreeSubcategory,
	DesignerTreeTarget,
	DragData,
	DragPreview,
	NavigationDesignerValidationIssue,
	NavigationDesignerValidationResult,
} from "./navigation-designer-types";

export const SUBCATEGORY_BUBBLE_MIN_HEIGHT = 260;

function isNonEmptyNavigationId(value: string): boolean {
	return value.trim().length > 0;
}

function isLocalUnsavedTreeId(id: string, editorId: string): boolean {
	return id === editorId && editorId.includes(":local:");
}

function addValidationIssue(params: {
	issues: NavigationDesignerValidationIssue[];
	key: string;
	message: string;
}): void {
	if (params.issues.some((issue) => issue.key === params.key)) {
		return;
	}

	params.issues.push({ key: params.key, message: params.message });
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isDragData(value: unknown): value is DragData {
	if (!isRecord(value) || typeof value.type !== "string") {
		return false;
	}

	if (value.type === "category") {
		return typeof value.categoryEditorId === "string";
	}

	if (value.type === "subcategory") {
		return (
			typeof value.categoryEditorId === "string" &&
			typeof value.subcategoryEditorId === "string"
		);
	}

	if (value.type === "content") {
		return (
			typeof value.categoryEditorId === "string" &&
			typeof value.subcategoryEditorId === "string" &&
			typeof value.contentEditorId === "string"
		);
	}

	return false;
}

export function makeLocalEditorId(prefix: string, value: number): string {
	return `${prefix}:local:${value}`;
}

export function hydrateNavigationPanelTree(
	doc: NavigationPanelTree,
): DesignerPanelTree {
	return {
		...doc,
		items: doc.items.map((category): DesignerTreeCategory => {
			return {
				...category,
				editorId: `category:${category.id}`,
				subcategories: category.subcategories.map(
					(subcategory): DesignerTreeSubcategory => {
						return {
							...subcategory,
							editorId: `subcategory:${subcategory.id}`,
							content: subcategory.content.map((target): DesignerTreeTarget => {
								return {
									...target,
									editorId: `content:${target.id}`,
								};
							}),
						};
					},
				),
			};
		}),
	};
}

export function stripDesignerItemsForSave(
	items: DesignerTreeCategory[],
): NavigationTreeCategory[] {
	return items.map((category): NavigationTreeCategory => {
		return {
			id: category.id,
			categoryId: category.categoryId,
			title: category.title,
			slug: category.slug,
			isEnabled: category.isEnabled,
			isSelectable: category.isSelectable,
			subcategories: category.subcategories.map(
				(subcategory): NavigationTreeSubcategory => {
					return {
						id: subcategory.id,
						subcategoryId: subcategory.subcategoryId,
						title: subcategory.title,
						slug: subcategory.slug,
						isEnabled: subcategory.isEnabled,
						isSelectable: subcategory.isSelectable,
						content: subcategory.content.map((target): NavigationTreeTarget => {
							return {
								id: target.id,
								contentId: target.contentId,
								title: target.title,
								slug: target.slug,
								summary: target.summary,
								statusCode: target.statusCode,
								isEnabled: target.isEnabled,
								isSelectable: target.isSelectable,
								contentKindCode: target.contentKindCode,
								contentKindLabel: target.contentKindLabel,
								publicRoutePrefix: target.publicRoutePrefix,
								rendererCode: target.rendererCode,
							};
						}),
					};
				},
			),
		};
	});
}

export function findCategoryIndexByEditorId(
	items: DesignerTreeCategory[],
	categoryEditorId: string,
): number {
	return items.findIndex((category) => category.editorId === categoryEditorId);
}

export function findSubcategoryIndexByEditorId(
	category: DesignerTreeCategory,
	subcategoryEditorId: string,
): number {
	return category.subcategories.findIndex(
		(subcategory) => subcategory.editorId === subcategoryEditorId,
	);
}

export function findContentIndexByEditorId(
	subcategory: DesignerTreeSubcategory,
	contentEditorId: string,
): number {
	return subcategory.content.findIndex(
		(target) => target.editorId === contentEditorId,
	);
}

export function findCategoryByEditorId(
	items: DesignerTreeCategory[],
	categoryEditorId: string,
): DesignerTreeCategory | null {
	const index = findCategoryIndexByEditorId(items, categoryEditorId);
	return index >= 0 ? (items[index] ?? null) : null;
}

export function findSubcategoryByEditorId(params: {
	items: DesignerTreeCategory[];
	categoryEditorId: string;
	subcategoryEditorId: string;
}): DesignerTreeSubcategory | null {
	const category = findCategoryByEditorId(params.items, params.categoryEditorId);
	if (!category) {
		return null;
	}

	const index = findSubcategoryIndexByEditorId(
		category,
		params.subcategoryEditorId,
	);
	return index >= 0 ? (category.subcategories[index] ?? null) : null;
}

export function getCategoryIcon(
	category: DesignerTreeCategory,
	categoryMap: Map<string, NavigationCategoryLookupItem>,
): Pick<NavigationCategoryLookupItem, "iconKey" | "iconColor"> {
	const lookup = categoryMap.get(category.categoryId);
	return {
		iconKey: lookup?.iconKey ?? null,
		iconColor: lookup?.iconColor ?? null,
	};
}

export function getSubcategoryIcon(
	subcategory: DesignerTreeSubcategory,
	subcategoryMap: Map<string, NavigationSubcategoryLookupItem>,
): Pick<NavigationSubcategoryLookupItem, "iconKey" | "iconColor"> {
	const lookup = subcategoryMap.get(subcategory.subcategoryId);
	return {
		iconKey: lookup?.iconKey ?? null,
		iconColor: lookup?.iconColor ?? null,
	};
}

export function getContentIcon(
	target: DesignerTreeTarget,
	contentMap: Map<string, NavigationContentLookupItem>,
): Pick<NavigationContentLookupItem, "iconKey" | "iconColor"> {
	const lookup = contentMap.get(target.contentId);
	return {
		iconKey: lookup?.iconKey ?? null,
		iconColor: lookup?.iconColor ?? null,
	};
}

export function normalizeSearch(value: string): string {
	return value.trim().toLowerCase();
}

export function matchesSearch(text: string, search: string): boolean {
	return text.toLowerCase().includes(search);
}

export function isGuardedMouseClick(event: MouseEvent): boolean {
	return (
		event.button === 0 &&
		!event.defaultPrevented &&
		!event.metaKey &&
		!event.ctrlKey &&
		!event.shiftKey &&
		!event.altKey
	);
}

export function findAnchorTarget(
	target: EventTarget | null,
): HTMLAnchorElement | null {
	if (!(target instanceof Element)) {
		return null;
	}

	return target.closest<HTMLAnchorElement>("a[href]");
}

export function isGuardedAnchor(anchor: HTMLAnchorElement): boolean {
	const href = anchor.getAttribute("href");
	if (!href || href.startsWith("#")) {
		return false;
	}

	if (anchor.target && anchor.target !== "_self") {
		return false;
	}

	if (anchor.hasAttribute("download")) {
		return false;
	}

	const targetUrl = new URL(anchor.href, window.location.href);
	const currentUrl = new URL(window.location.href);

	if (targetUrl.href === currentUrl.href) {
		return false;
	}

	if (
		targetUrl.origin === currentUrl.origin &&
		targetUrl.pathname === currentUrl.pathname &&
		targetUrl.search === currentUrl.search
	) {
		return false;
	}

	return true;
}

export function normalizeLimit(value: number | null): number | null {
	if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
		return null;
	}

	return Math.max(1, Math.floor(value));
}

export function isLimitReached(count: number, limit: number | null): boolean {
	return limit !== null && count >= limit;
}

function isLimitExceeded(count: number, limit: number | null): boolean {
	return limit !== null && count > limit;
}

export function limitReachedMessage(
	subject: string,
	limit: number | null,
): string {
	return limit === null
		? ""
		: `${subject} has reached its configured limit of ${limit}.`;
}

export function hasStaleNavigationItems(
	items: DesignerTreeCategory[],
): boolean {
	return items.some((category) => {
		return (
			!category.isSelectable ||
			category.subcategories.some((subcategory) => {
				return (
					!subcategory.isSelectable ||
					subcategory.content.some((target) => !target.isSelectable)
				);
			})
		);
	});
}

export function validateNavigationDesignerItems(params: {
	items: DesignerTreeCategory[];
	categorySlotLimit: number | null;
	subcategorySlotLimit: number | null;
	targetSlotLimit: number | null;
}): NavigationDesignerValidationResult {
	const issues: NavigationDesignerValidationIssue[] = [];
	const categoryIds = new Map<string, DesignerTreeCategory>();

	if (isLimitExceeded(params.items.length, params.categorySlotLimit)) {
		addValidationIssue({
			issues,
			key: "panel.category-limit",
			message: `This panel has more than its configured limit of ${params.categorySlotLimit}.`,
		});
	}

	params.items.forEach((category, categoryIndex) => {
		const categoryLabel =
			category.title.trim() || `Category ${categoryIndex + 1}`;

		if (!isNonEmptyNavigationId(category.categoryId)) {
			addValidationIssue({
				issues,
				key: `category.${category.editorId}.missing-target`,
				message: `${categoryLabel} is missing its category target.`,
			});
		}

		if (
			!category.isSelectable &&
			isLocalUnsavedTreeId(category.id, category.editorId)
		) {
			addValidationIssue({
				issues,
				key: `category.${category.editorId}.local-stale`,
				message: `${categoryLabel} is a new row but is marked stale. Remove and add it again.`,
			});
		}

		const existingCategory = categoryIds.get(category.categoryId);
		if (isNonEmptyNavigationId(category.categoryId) && existingCategory) {
			addValidationIssue({
				issues,
				key: `category.${category.categoryId}.duplicate`,
				message: `Category "${categoryLabel}" is used more than once in this panel.`,
			});
		} else if (isNonEmptyNavigationId(category.categoryId)) {
			categoryIds.set(category.categoryId, category);
		}

		if (
			isLimitExceeded(category.subcategories.length, params.subcategorySlotLimit)
		) {
			addValidationIssue({
				issues,
				key: `category.${category.editorId}.subcategory-limit`,
				message: `${categoryLabel} has more than its configured subcategory limit of ${params.subcategorySlotLimit}.`,
			});
		}

		const subcategoryIds = new Map<string, DesignerTreeSubcategory>();
		category.subcategories.forEach((subcategory, subcategoryIndex) => {
			const subcategoryLabel =
				subcategory.title.trim() || `Subcategory ${subcategoryIndex + 1}`;
			const subcategoryPath = `${categoryLabel} / ${subcategoryLabel}`;

			if (!isNonEmptyNavigationId(subcategory.subcategoryId)) {
				addValidationIssue({
					issues,
					key: `subcategory.${subcategory.editorId}.missing-target`,
					message: `${subcategoryPath} is missing its subcategory target.`,
				});
			}

			if (
				!subcategory.isSelectable &&
				isLocalUnsavedTreeId(subcategory.id, subcategory.editorId)
			) {
				addValidationIssue({
					issues,
					key: `subcategory.${subcategory.editorId}.local-stale`,
					message: `${subcategoryPath} is a new row but is marked stale. Remove and add it again.`,
				});
			}

			const existingSubcategory = subcategoryIds.get(subcategory.subcategoryId);
			if (
				isNonEmptyNavigationId(subcategory.subcategoryId) &&
				existingSubcategory
			) {
				addValidationIssue({
					issues,
					key: `subcategory.${category.editorId}.${subcategory.subcategoryId}.duplicate`,
					message: `${categoryLabel} uses subcategory "${subcategoryLabel}" more than once.`,
				});
			} else if (isNonEmptyNavigationId(subcategory.subcategoryId)) {
				subcategoryIds.set(subcategory.subcategoryId, subcategory);
			}

			if (isLimitExceeded(subcategory.content.length, params.targetSlotLimit)) {
				addValidationIssue({
					issues,
					key: `subcategory.${subcategory.editorId}.target-limit`,
					message: `${subcategoryPath} has more than its configured item limit of ${params.targetSlotLimit}.`,
				});
			}

			const contentIds = new Map<string, DesignerTreeTarget>();
			subcategory.content.forEach((target, targetIndex) => {
				const targetLabel = target.title.trim() || `Item ${targetIndex + 1}`;
				const targetPath = `${subcategoryPath} / ${targetLabel}`;

				if (!isNonEmptyNavigationId(target.contentId)) {
					addValidationIssue({
						issues,
						key: `content.${target.editorId}.missing-target`,
						message: `${targetPath} is missing its content target.`,
					});
				}

				if (
					!target.isSelectable &&
					isLocalUnsavedTreeId(target.id, target.editorId)
				) {
					addValidationIssue({
						issues,
						key: `content.${target.editorId}.local-stale`,
						message: `${targetPath} is a new row but is marked stale. Remove and add it again.`,
					});
				}

				const existingTarget = contentIds.get(target.contentId);
				if (isNonEmptyNavigationId(target.contentId) && existingTarget) {
					addValidationIssue({
						issues,
						key: `content.${subcategory.editorId}.${target.contentId}.duplicate`,
						message: `${subcategoryPath} uses content "${targetLabel}" more than once.`,
					});
				} else if (isNonEmptyNavigationId(target.contentId)) {
					contentIds.set(target.contentId, target);
				}
			});
		});
	});

	return {
		valid: issues.length === 0,
		issues,
	};
}

export function buildDragPreview(params: {
	activeDrag: DragData | null;
	items: DesignerTreeCategory[];
	categoryMap: Map<string, NavigationCategoryLookupItem>;
	subcategoryMap: Map<string, NavigationSubcategoryLookupItem>;
	contentMap: Map<string, NavigationContentLookupItem>;
}): DragPreview | null {
	if (!params.activeDrag) {
		return null;
	}

	if (params.activeDrag.type === "category") {
		const category = findCategoryByEditorId(
			params.items,
			params.activeDrag.categoryEditorId,
		);
		if (!category) {
			return null;
		}

		const icon = getCategoryIcon(category, params.categoryMap);
		return {
			label: category.title,
			iconKey: icon.iconKey,
			iconColor: icon.iconColor,
			fallbackLucideName: "Folder",
		};
	}

	if (params.activeDrag.type === "subcategory") {
		const subcategory = findSubcategoryByEditorId({
			items: params.items,
			categoryEditorId: params.activeDrag.categoryEditorId,
			subcategoryEditorId: params.activeDrag.subcategoryEditorId,
		});
		if (!subcategory) {
			return null;
		}

		const icon = getSubcategoryIcon(subcategory, params.subcategoryMap);
		return {
			label: subcategory.title,
			iconKey: icon.iconKey,
			iconColor: icon.iconColor,
			fallbackLucideName: "FolderOpen",
		};
	}

	const subcategory = findSubcategoryByEditorId({
		items: params.items,
		categoryEditorId: params.activeDrag.categoryEditorId,
		subcategoryEditorId: params.activeDrag.subcategoryEditorId,
	});
	if (!subcategory) {
		return null;
	}

	const targetIndex = findContentIndexByEditorId(
		subcategory,
		params.activeDrag.contentEditorId,
	);
	const target = targetIndex >= 0 ? subcategory.content[targetIndex] : null;
	if (!target) {
		return null;
	}

	const icon = getContentIcon(target, params.contentMap);
	return {
		label: target.title,
		iconKey: icon.iconKey,
		iconColor: icon.iconColor,
		fallbackLucideName: "FileText",
	};
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
