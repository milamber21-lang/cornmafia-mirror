//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/web/NavigationPanelDesigner.tsx                                          ////
//// Language: TSX                                                                                              ////
//// DB-first orchestration component for one admin navigation panel tree designer.                              ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

"use client";

import type { JSX } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	DndContext,
	DragOverlay,
	KeyboardSensor,
	MouseSensor,
	TouchSensor,
	closestCenter,
	type CollisionDetection,
	type DragEndEvent,
	type DragStartEvent,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	arrayMove,
	sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";

import {
	AlertBanner,
	Button,
	IconRender,
	UiChip,
} from "@/components/ui";
import { confirmAction } from "@/lib/client/confirm-dialog";
import type {
	NavigationCategoryLookupItem,
	NavigationContentLookupItem,
	NavigationSubcategoryLookupItem,
} from "@/lib/data/navigation";
import { readResponseMessage } from "@/lib/helpers/http-response";

import NavigationDesignerPickerModal from "./navigation-designer/NavigationDesignerPickerModal";
import {
	CategoryPicker,
	ContentPicker,
	SubcategoryPicker,
} from "./navigation-designer/NavigationDesignerPickers";
import NavigationDesignerTree from "./navigation-designer/NavigationDesignerTree";
import {
	buildDragPreview,
	findAnchorTarget,
	findCategoryIndexByEditorId,
	findContentIndexByEditorId,
	findSubcategoryIndexByEditorId,
	hasStaleNavigationItems,
	hydrateNavigationPanelTree,
	isDragData,
	isGuardedAnchor,
	isGuardedMouseClick,
	isLimitReached,
	makeLocalEditorId,
	normalizeLimit,
	stripDesignerItemsForSave,
	validateNavigationDesignerItems,
} from "./navigation-designer/navigation-designer-helpers";
import type {
	DesignerApiResponse,
	DesignerPanelTree,
	DragData,
	ModalMode,
	NavigationDesignerValidationIssue,
	NavigationPanelDesignerProps,
} from "./navigation-designer/navigation-designer-types";

export default function NavigationPanelDesigner({
	initialDoc,
	initialCategories,
	initialSubcategories,
	initialContent,
}: NavigationPanelDesignerProps): JSX.Element {
	const [doc, setDoc] = useState<DesignerPanelTree>(() =>
		hydrateNavigationPanelTree(initialDoc),
	);
	const [categories, setCategories] = useState<NavigationCategoryLookupItem[]>(initialCategories);
	const [subcategories, setSubcategories] = useState<NavigationSubcategoryLookupItem[]>(initialSubcategories);
	const [content, setContent] = useState<NavigationContentLookupItem[]>(initialContent);
	const [dirty, setDirty] = useState(false);
	const dirtyRef = useRef(false);
	const confirmNavigationRef = useRef(false);
	const skipBeforeUnloadRef = useRef(false);
	const editorIdCounterRef = useRef(0);
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [validationIssues, setValidationIssues] = useState<NavigationDesignerValidationIssue[]>([]);
	const [modal, setModal] = useState<ModalMode | null>(null);
	const [activeDrag, setActiveDrag] = useState<DragData | null>(null);

	const categorySlotLimit = normalizeLimit(doc.panel.maxCategories);
	const subcategorySlotLimit = normalizeLimit(doc.panel.maxSubcategoriesPerCategory);
	const targetSlotLimit = normalizeLimit(doc.panel.maxTargetsPerSubcategory);

	const createEditorId = useCallback((prefix: string): string => {
		editorIdCounterRef.current += 1;
		return makeLocalEditorId(prefix, editorIdCounterRef.current);
	}, []);

	const sensors = useSensors(
		useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
		useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
	);

	const designerCollisionDetection = useCallback<CollisionDetection>((args) => {
		const activeData = args.active.data.current;
		if (!isDragData(activeData)) {
			return closestCenter(args);
		}

		const matchingContainers = args.droppableContainers.filter((container) => {
			const overData = container.data.current;
			if (!isDragData(overData)) {
				return false;
			}

			if (activeData.type === "category") {
				return overData.type === "category";
			}

			if (activeData.type === "subcategory") {
				return (
					overData.type === "subcategory" &&
					overData.categoryEditorId === activeData.categoryEditorId
				);
			}

			return (
				overData.type === "content" &&
				overData.categoryEditorId === activeData.categoryEditorId &&
				overData.subcategoryEditorId === activeData.subcategoryEditorId
			);
		});

		return closestCenter({
			...args,
			droppableContainers:
				matchingContainers.length > 0 ? matchingContainers : args.droppableContainers,
		});
	}, []);

	const categoryMap = useMemo(() => {
		return new Map(categories.map((row) => [row.categoryId, row]));
	}, [categories]);

	const subcategoryMap = useMemo(() => {
		return new Map(subcategories.map((row) => [row.subcategoryId, row]));
	}, [subcategories]);

	const contentMap = useMemo(() => {
		return new Map(content.map((row) => [row.contentId, row]));
	}, [content]);

	const usedCategoryIds = useMemo(() => {
		return new Set(doc.items.map((row) => row.categoryId));
	}, [doc.items]);

	const hasStaleItems = useMemo(() => {
		return hasStaleNavigationItems(doc.items);
	}, [doc.items]);

	const activeDragPreview = useMemo(() => {
		return buildDragPreview({
			activeDrag,
			items: doc.items,
			categoryMap,
			subcategoryMap,
			contentMap,
		});
	}, [activeDrag, categoryMap, contentMap, doc.items, subcategoryMap]);

	const activeCategoryForModal = useMemo(() => {
		if (modal?.type !== "subcategory" && modal?.type !== "content") {
			return null;
		}

		const categoryIndex = findCategoryIndexByEditorId(
			doc.items,
			modal.categoryEditorId,
		);
		return categoryIndex >= 0 ? (doc.items[categoryIndex] ?? null) : null;
	}, [doc.items, modal]);

	const activeSubcategoryForModal = useMemo(() => {
		if (modal?.type !== "content" || !activeCategoryForModal) {
			return null;
		}

		const subcategoryIndex = findSubcategoryIndexByEditorId(
			activeCategoryForModal,
			modal.subcategoryEditorId,
		);
		return subcategoryIndex >= 0
			? (activeCategoryForModal.subcategories[subcategoryIndex] ?? null)
			: null;
	}, [activeCategoryForModal, modal]);

	const confirmUnsavedNavigation = useCallback(async (): Promise<boolean> => {
		if (confirmNavigationRef.current) {
			return false;
		}

		confirmNavigationRef.current = true;
		try {
			return await confirmAction({
				title: "Leave designer?",
				message: "You have unsaved navigation changes. Leave without saving?",
				confirmLabel: "Leave",
				destructive: true,
			});
		} finally {
			confirmNavigationRef.current = false;
		}
	}, []);

	useEffect(() => {
		dirtyRef.current = dirty;
	}, [dirty]);

	useEffect(() => {
		const handler = (event: BeforeUnloadEvent) => {
			if (!dirtyRef.current || skipBeforeUnloadRef.current) {
				return;
			}

			event.preventDefault();
			event.returnValue = "";
		};

		window.addEventListener("beforeunload", handler);
		return () => window.removeEventListener("beforeunload", handler);
	}, []);

	useEffect(() => {
		const handler = (event: MouseEvent): void => {
			if (!dirtyRef.current || !isGuardedMouseClick(event)) {
				return;
			}

			const anchor = findAnchorTarget(event.target);
			if (!anchor || !isGuardedAnchor(anchor)) {
				return;
			}

			event.preventDefault();
			event.stopPropagation();
			event.stopImmediatePropagation();

			void (async () => {
				const confirmed = await confirmUnsavedNavigation();
				if (!confirmed) {
					return;
				}

				skipBeforeUnloadRef.current = true;
				dirtyRef.current = false;
				setDirty(false);
				window.location.assign(anchor.href);
			})();
		};

		document.addEventListener("click", handler, true);
		return () => document.removeEventListener("click", handler, true);
	}, [confirmUnsavedNavigation]);

	const updateItems = useCallback((items: DesignerPanelTree["items"]): void => {
		setValidationIssues([]);
		setDoc((current) => ({ ...current, items }));
		setDirty(true);
	}, []);

	const reload = useCallback(async (): Promise<void> => {
		if (dirty) {
			const confirmed = await confirmAction({
				title: "Discard unsaved changes?",
				message: "Discard unsaved changes and reload?",
				confirmLabel: "Reload",
				destructive: true,
			});
			if (!confirmed) {
				return;
			}
		}

		setLoading(true);
		setError("");
		setValidationIssues([]);

		try {
			const response = await fetch(
				`/api/admin/web/navigation-panels/${encodeURIComponent(doc.panel.panelKey)}/tree`,
				{ cache: "no-store" },
			);

			if (!response.ok) {
				throw new Error(
					await readResponseMessage(response, "Failed to reload navigation tree."),
				);
			}

			const payload = (await response.json()) as DesignerApiResponse;
			if (!payload.doc) {
				throw new Error("Invalid navigation tree payload.");
			}

			setDoc(hydrateNavigationPanelTree(payload.doc));
			setCategories(Array.isArray(payload.categories) ? payload.categories : []);
			setSubcategories(Array.isArray(payload.subcategories) ? payload.subcategories : []);
			setContent(Array.isArray(payload.content) ? payload.content : []);
			dirtyRef.current = false;
			setDirty(false);
		} catch (reloadError: unknown) {
			setError(
				reloadError instanceof Error
					? reloadError.message
					: "Failed to reload navigation tree.",
			);
		} finally {
			setLoading(false);
		}
	}, [dirty, doc.panel.panelKey]);

	const save = useCallback(async (): Promise<void> => {
		setError("");

		const validation = validateNavigationDesignerItems({
			items: doc.items,
			categorySlotLimit,
			subcategorySlotLimit,
			targetSlotLimit,
		});
		if (!validation.valid) {
			setValidationIssues(validation.issues);
			return;
		}

		setValidationIssues([]);
		setSaving(true);

		try {
			const response = await fetch(
				`/api/admin/web/navigation-panels/${encodeURIComponent(doc.panel.panelKey)}/tree`,
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ items: stripDesignerItemsForSave(doc.items) }),
				},
			);

			if (!response.ok) {
				throw new Error(
					await readResponseMessage(response, "Failed to save navigation tree."),
				);
			}

			const payload = (await response.json()) as DesignerApiResponse;
			if (payload.doc) {
				setDoc(hydrateNavigationPanelTree(payload.doc));
			}
			dirtyRef.current = false;
			setDirty(false);
		} catch (saveError: unknown) {
			setError(
				saveError instanceof Error
					? saveError.message
					: "Failed to save navigation tree.",
			);
		} finally {
			setSaving(false);
		}
	}, [
		categorySlotLimit,
		doc.items,
		doc.panel.panelKey,
		subcategorySlotLimit,
		targetSlotLimit,
	]);

	const addCategory = useCallback(
		(row: NavigationCategoryLookupItem): void => {
			if (isLimitReached(doc.items.length, categorySlotLimit)) {
				setModal(null);
				return;
			}

			if (usedCategoryIds.has(row.categoryId)) {
				return;
			}

			const editorId = createEditorId("category");
			updateItems([
				...doc.items,
				{
					editorId,
					id: editorId,
					categoryId: row.categoryId,
					title: row.title,
					slug: row.slug,
					isEnabled: true,
					isSelectable: true,
					subcategories: [],
				},
			]);
			setModal(null);
		},
		[categorySlotLimit, createEditorId, doc.items, updateItems, usedCategoryIds],
	);

	const addSubcategory = useCallback(
		(categoryEditorId: string, row: NavigationSubcategoryLookupItem): void => {
			const categoryIndex = findCategoryIndexByEditorId(doc.items, categoryEditorId);
			const category = categoryIndex >= 0 ? doc.items[categoryIndex] : null;
			if (!category) {
				return;
			}

			if (isLimitReached(category.subcategories.length, subcategorySlotLimit)) {
				setModal(null);
				return;
			}

			if (category.subcategories.some((item) => item.subcategoryId === row.subcategoryId)) {
				return;
			}

			const editorId = createEditorId("subcategory");
			const items = doc.items.slice();
			items[categoryIndex] = {
				...category,
				subcategories: [
					...category.subcategories,
					{
						editorId,
						id: editorId,
						subcategoryId: row.subcategoryId,
						title: row.title,
						slug: row.slug,
						isEnabled: true,
						isSelectable: true,
						content: [],
					},
				],
			};

			updateItems(items);
			setModal(null);
		},
		[createEditorId, doc.items, subcategorySlotLimit, updateItems],
	);

	const addContent = useCallback(
		(
			categoryEditorId: string,
			subcategoryEditorId: string,
			row: NavigationContentLookupItem,
		): void => {
			const categoryIndex = findCategoryIndexByEditorId(doc.items, categoryEditorId);
			const category = categoryIndex >= 0 ? doc.items[categoryIndex] : null;
			if (!category) {
				return;
			}

			const subcategoryIndex = findSubcategoryIndexByEditorId(
				category,
				subcategoryEditorId,
			);
			const subcategory =
				subcategoryIndex >= 0 ? category.subcategories[subcategoryIndex] : null;
			if (!subcategory) {
				return;
			}

			if (isLimitReached(subcategory.content.length, targetSlotLimit)) {
				setModal(null);
				return;
			}

			if (subcategory.content.some((item) => item.contentId === row.contentId)) {
				return;
			}

			setContent((currentContent) => {
				if (currentContent.some((item) => item.contentId === row.contentId)) {
					return currentContent;
				}

				return [...currentContent, row];
			});

			const editorId = createEditorId("content");
			const items = doc.items.slice();
			const subcategoriesNext = category.subcategories.slice();
			subcategoriesNext[subcategoryIndex] = {
				...subcategory,
				content: [
					...subcategory.content,
					{
						editorId,
						id: editorId,
						contentId: row.contentId,
						title: row.title,
						slug: row.slug,
						summary: row.summary,
						statusCode: row.statusCode,
						isEnabled: true,
						isSelectable: true,
						contentKindCode: row.contentKindCode,
						contentKindLabel: row.contentKindLabel,
						publicRoutePrefix: row.publicRoutePrefix,
						rendererCode: row.rendererCode,
					},
				],
			};
			items[categoryIndex] = { ...category, subcategories: subcategoriesNext };

			updateItems(items);
			setModal(null);
		},
		[createEditorId, doc.items, targetSlotLimit, updateItems],
	);

	const removeCategory = useCallback(
		(categoryEditorId: string): void => {
			updateItems(doc.items.filter((row) => row.editorId !== categoryEditorId));
		},
		[doc.items, updateItems],
	);

	const removeSubcategory = useCallback(
		(categoryEditorId: string, subcategoryEditorId: string): void => {
			const categoryIndex = findCategoryIndexByEditorId(doc.items, categoryEditorId);
			const category = categoryIndex >= 0 ? doc.items[categoryIndex] : null;
			if (!category) {
				return;
			}

			const items = doc.items.slice();
			items[categoryIndex] = {
				...category,
				subcategories: category.subcategories.filter(
					(row) => row.editorId !== subcategoryEditorId,
				),
			};
			updateItems(items);
		},
		[doc.items, updateItems],
	);

	const removeContent = useCallback(
		(
			categoryEditorId: string,
			subcategoryEditorId: string,
			contentEditorId: string,
		): void => {
			const categoryIndex = findCategoryIndexByEditorId(doc.items, categoryEditorId);
			const category = categoryIndex >= 0 ? doc.items[categoryIndex] : null;
			if (!category) {
				return;
			}

			const subcategoryIndex = findSubcategoryIndexByEditorId(
				category,
				subcategoryEditorId,
			);
			const subcategory =
				subcategoryIndex >= 0 ? category.subcategories[subcategoryIndex] : null;
			if (!subcategory) {
				return;
			}

			const items = doc.items.slice();
			const subcategoriesNext = category.subcategories.slice();
			subcategoriesNext[subcategoryIndex] = {
				...subcategory,
				content: subcategory.content.filter(
					(row) => row.editorId !== contentEditorId,
				),
			};
			items[categoryIndex] = { ...category, subcategories: subcategoriesNext };
			updateItems(items);
		},
		[doc.items, updateItems],
	);

	const handleDragStart = useCallback((event: DragStartEvent): void => {
		const activeData = event.active.data.current;
		setActiveDrag(isDragData(activeData) ? activeData : null);
	}, []);

	const handleDragCancel = useCallback((): void => {
		setActiveDrag(null);
	}, []);

	const handleDragEnd = useCallback(
		(event: DragEndEvent): void => {
			setActiveDrag(null);
			const activeData = event.active.data.current;
			const overData = event.over?.data.current;
			if (!isDragData(activeData) || !isDragData(overData)) {
				return;
			}

			if (activeData.type === "category" && overData.type === "category") {
				const activeIndex = findCategoryIndexByEditorId(
					doc.items,
					activeData.categoryEditorId,
				);
				const overIndex = findCategoryIndexByEditorId(
					doc.items,
					overData.categoryEditorId,
				);
				if (activeIndex < 0 || overIndex < 0 || activeIndex === overIndex) {
					return;
				}

				updateItems(arrayMove(doc.items, activeIndex, overIndex));
				return;
			}

			if (
				activeData.type === "subcategory" &&
				overData.type === "subcategory" &&
				activeData.categoryEditorId === overData.categoryEditorId
			) {
				const categoryIndex = findCategoryIndexByEditorId(
					doc.items,
					activeData.categoryEditorId,
				);
				const category = categoryIndex >= 0 ? doc.items[categoryIndex] : null;
				if (!category) {
					return;
				}

				const activeIndex = findSubcategoryIndexByEditorId(
					category,
					activeData.subcategoryEditorId,
				);
				const overIndex = findSubcategoryIndexByEditorId(
					category,
					overData.subcategoryEditorId,
				);
				if (activeIndex < 0 || overIndex < 0 || activeIndex === overIndex) {
					return;
				}

				const items = doc.items.slice();
				items[categoryIndex] = {
					...category,
					subcategories: arrayMove(category.subcategories, activeIndex, overIndex),
				};
				updateItems(items);
				return;
			}

			if (
				activeData.type === "content" &&
				overData.type === "content" &&
				activeData.categoryEditorId === overData.categoryEditorId &&
				activeData.subcategoryEditorId === overData.subcategoryEditorId
			) {
				const categoryIndex = findCategoryIndexByEditorId(
					doc.items,
					activeData.categoryEditorId,
				);
				const category = categoryIndex >= 0 ? doc.items[categoryIndex] : null;
				if (!category) {
					return;
				}

				const subcategoryIndex = findSubcategoryIndexByEditorId(
					category,
					activeData.subcategoryEditorId,
				);
				const subcategory =
					subcategoryIndex >= 0 ? category.subcategories[subcategoryIndex] : null;
				if (!subcategory) {
					return;
				}

				const activeIndex = findContentIndexByEditorId(
					subcategory,
					activeData.contentEditorId,
				);
				const overIndex = findContentIndexByEditorId(
					subcategory,
					overData.contentEditorId,
				);
				if (activeIndex < 0 || overIndex < 0 || activeIndex === overIndex) {
					return;
				}

				const items = doc.items.slice();
				const subcategoriesNext = category.subcategories.slice();
				subcategoriesNext[subcategoryIndex] = {
					...subcategory,
					content: arrayMove(subcategory.content, activeIndex, overIndex),
				};
				items[categoryIndex] = {
					...category,
					subcategories: subcategoriesNext,
				};
				updateItems(items);
			}
		},
		[doc.items, updateItems],
	);

	return (
		<>
			<div className="admin-nav-designer">
				<div className="admin-nav-designer-header">
					<div className="admin-nav-designer-header__body">
						<h2 className="admin-nav-designer-header__title">{doc.panel.label}</h2>
						<div className="admin-nav-designer-header__meta">
							{doc.panel.panelKey} · {doc.panel.panelSlotCode}
							{dirty ? " · Unsaved changes" : ""}
						</div>
					</div>
					<div className="admin-nav-designer-header__actions">
						<Button
							variant="accent"
							onClick={() => void reload()}
							type="button"
							disabled={loading || saving}
						>
							Reload
						</Button>
						<Button
							variant="green"
							onClick={() => void save()}
							disabled={!dirty || loading || saving}
							loading={saving}
							type="button"
						>
							Save changes
						</Button>
					</div>
				</div>

				{error ? (
					<div className="admin-nav-designer-alert">
						<AlertBanner tone="error" dismissible autoHideMs={0}>
							{error}
						</AlertBanner>
					</div>
				) : null}
				{validationIssues.length > 0 ? (
					<div className="admin-nav-designer-alert">
						<AlertBanner tone="error" dismissible autoHideMs={0}>
							<div className="admin-nav-designer-validation">
								<div className="admin-nav-designer-validation__title">Fix these navigation items before saving:</div>
								<ul className="admin-nav-designer-validation__list">
									{validationIssues.map((issue) => (
										<li key={issue.key}>{issue.message}</li>
									))}
								</ul>
							</div>
						</AlertBanner>
					</div>
				) : null}
				{loading ? (
					<div className="admin-nav-designer-alert">
						<AlertBanner tone="info">Loading...</AlertBanner>
					</div>
				) : null}
				{hasStaleItems ? (
					<div className="admin-nav-designer-alert">
						<AlertBanner tone="warning">
							Some saved navigation rows are stale. They remain visible so you can remove or replace them intentionally.
						</AlertBanner>
					</div>
				) : null}

				<DndContext
					sensors={sensors}
					collisionDetection={designerCollisionDetection}
					onDragStart={handleDragStart}
					onDragCancel={handleDragCancel}
					onDragEnd={handleDragEnd}
				>
					<NavigationDesignerTree
						items={doc.items}
						categories={categories}
						categoryMap={categoryMap}
						subcategoryMap={subcategoryMap}
						contentMap={contentMap}
						usedCategoryIds={usedCategoryIds}
						categorySlotLimit={categorySlotLimit}
						subcategorySlotLimit={subcategorySlotLimit}
						targetSlotLimit={targetSlotLimit}
						onAddCategoryClick={() => setModal({ type: "category" })}
						onAddSubcategoryClick={(categoryEditorId) =>
							setModal({ type: "subcategory", categoryEditorId })
						}
						onAddContentClick={(categoryEditorId, subcategoryEditorId) =>
							setModal({
								type: "content",
								categoryEditorId,
								subcategoryEditorId,
							})
						}
						onRemoveCategory={removeCategory}
						onRemoveSubcategory={removeSubcategory}
						onRemoveContent={removeContent}
					/>

					<DragOverlay dropAnimation={null}>
						{activeDragPreview ? (
							<div className="admin-nav-designer-drag-overlay-preview">
								<UiChip
									label={activeDragPreview.label}
									leftIcon={
										<IconRender
											iconKey={activeDragPreview.iconKey}
											iconColor={activeDragPreview.iconColor}
											fallback={{ lucideName: activeDragPreview.fallbackLucideName }}
											mediaRouteScope="admin"
											size={16}
										/>
									}
									draggable
									className="admin-nav-designer-drag-overlay-chip"
								/>
							</div>
						) : null}
					</DragOverlay>
				</DndContext>
			</div>

			<NavigationDesignerPickerModal
				open={modal?.type === "category"}
				title="Add category"
				onClose={() => setModal(null)}
			>
				<CategoryPicker
					categories={categories}
					usedCategoryIds={usedCategoryIds}
					onPick={addCategory}
				/>
			</NavigationDesignerPickerModal>

			<NavigationDesignerPickerModal
				open={modal?.type === "subcategory"}
				title="Add subcategory"
				onClose={() => setModal(null)}
			>
				{modal?.type === "subcategory" && activeCategoryForModal ? (
					<SubcategoryPicker
						categoryId={activeCategoryForModal.categoryId}
						subcategories={subcategories}
						usedSubcategoryIds={
							new Set(
								activeCategoryForModal.subcategories.map(
									(row) => row.subcategoryId,
								),
							)
						}
						onPick={(row) => addSubcategory(modal.categoryEditorId, row)}
					/>
				) : null}
			</NavigationDesignerPickerModal>

			<NavigationDesignerPickerModal
				open={modal?.type === "content"}
				title="Add content"
				onClose={() => setModal(null)}
			>
				{modal?.type === "content" && activeCategoryForModal && activeSubcategoryForModal ? (
					<ContentPicker
						categoryId={activeCategoryForModal.categoryId}
						subcategoryId={activeSubcategoryForModal.subcategoryId}
						usedContentIds={
							new Set(activeSubcategoryForModal.content.map((row) => row.contentId))
						}
						onPick={(row) =>
							addContent(
								modal.categoryEditorId,
								modal.subcategoryEditorId,
								row,
							)
						}
					/>
				) : null}
			</NavigationDesignerPickerModal>
		</>
	);
}
