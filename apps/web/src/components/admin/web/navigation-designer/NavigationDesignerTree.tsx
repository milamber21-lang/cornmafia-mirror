//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/web/navigation-designer/NavigationDesignerTree.tsx                       ////
//// Language: TSX                                                                                              ////
//// Sortable tree rendering and bubble controls for the admin navigation panel designer.                        ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

"use client";

import type { CSSProperties, JSX, ReactNode } from "react";
import { useMemo } from "react";
import {
	SortableContext,
	rectSortingStrategy,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { IconRender, UiChip } from "@/components/ui";
import { confirmAction } from "@/lib/client/confirm-dialog";
import type {
	NavigationCategoryLookupItem,
	NavigationContentLookupItem,
	NavigationSubcategoryLookupItem,
} from "@/lib/data/navigation";

import {
	getCategoryIcon,
	getContentIcon,
	getSubcategoryIcon,
	isLimitReached,
	SUBCATEGORY_BUBBLE_MIN_HEIGHT,
} from "./navigation-designer-helpers";
import type {
	DesignerTreeCategory,
	DesignerTreeTarget,
	DragData,
} from "./navigation-designer-types";

type NavigationDesignerRuntimeStyle = CSSProperties &
	Partial<Record<"--admin-nav-designer-subcategory-min-height", string>>;

function classNames(
	...values: Array<string | undefined | false>
): string | undefined {
	const classes = values.filter((value): value is string => Boolean(value));
	return classes.length > 0 ? classes.join(" ") : undefined;
}

function RemoveX(props: { title?: string; onClick: () => void }): JSX.Element {
	return (
		<button
			type="button"
			aria-label={props.title ?? "Remove"}
			title={props.title ?? "Remove"}
			onClick={props.onClick}
			className="admin-nav-designer-remove-button"
		>
			×
		</button>
	);
}

function StaleMarker(props: { isSelectable: boolean }): JSX.Element | null {
	if (props.isSelectable) {
		return null;
	}

	return (
		<span
			title="This saved row no longer appears in current picker data. Remove it or replace it when ready."
			className="admin-nav-designer-stale-marker"
		>
			Stale
		</span>
	);
}

function LimitMessage(props: { children: ReactNode }): JSX.Element {
	return <p className="admin-nav-designer-limit-message">{props.children}</p>;
}

function useBubbleSortable(id: string, data: DragData) {
	const sortable = useSortable({ id, data });
	const style: CSSProperties = {
		transform: CSS.Transform.toString(sortable.transform),
		transition: sortable.isDragging ? undefined : sortable.transition,
		opacity: sortable.isDragging ? 0.32 : undefined,
		zIndex: sortable.isDragging ? 20 : undefined,
		willChange: sortable.isDragging ? "transform" : undefined,
	};

	return { ...sortable, style };
}

interface SortableItemRowProps {
	id: string;
	dragData: DragData;
	target: DesignerTreeTarget;
	icon: Pick<NavigationContentLookupItem, "iconKey" | "iconColor">;
	onRemove: () => void;
}

function SortableItemRow({
	id,
	dragData,
	target,
	icon,
	onRemove,
}: SortableItemRowProps): JSX.Element {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({
		id,
		data: dragData,
	});
	const style: CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition: isDragging ? undefined : transition,
		opacity: isDragging ? 0.32 : undefined,
		zIndex: isDragging ? 20 : undefined,
		willChange: isDragging ? "transform" : undefined,
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={classNames(
				"admin-nav-designer-item-row",
				isDragging && "admin-nav-designer-item-row--dragging",
			)}
		>
			<div className="admin-nav-designer-item-row__body">
				<span
					{...attributes}
					{...listeners}
					className="admin-nav-designer-drag-handle admin-nav-designer-drag-handle--fill"
				>
					<UiChip
						label={target.title}
						leftIcon={
							<IconRender
								iconKey={icon.iconKey}
								iconColor={icon.iconColor}
								fallback={{ lucideName: "FileText" }}
								mediaRouteScope="admin"
								size={16}
							/>
						}
						rightSlot={<StaleMarker isSelectable={target.isSelectable} />}
						draggable
						className="admin-nav-designer-item-chip"
						chipClassName="admin-nav-designer-transparent-chip-button"
					/>
				</span>
				<RemoveX title={`Remove ${target.title}`} onClick={onRemove} />
			</div>
		</div>
	);
}

interface AddCategoryBubbleProps {
	itemsCount: number;
	categories: NavigationCategoryLookupItem[];
	usedCategoryIds: Set<string>;
	categorySlotLimit: number | null;
	onAddCategoryClick: () => void;
}

function AddCategoryBubble({
	itemsCount,
	categories,
	usedCategoryIds,
	categorySlotLimit,
	onAddCategoryClick,
}: AddCategoryBubbleProps): JSX.Element | null {
	const canAdd = !isLimitReached(itemsCount, categorySlotLimit);
	if (!canAdd) {
		return null;
	}

	const hasAvailable = categories.some(
		(row) => row.isSelectable && !usedCategoryIds.has(row.categoryId),
	);
	const disabledReason = hasAvailable
		? ""
		: "No unused categories are available.";

	return (
		<div className="admin-nav-designer-add-category-bubble">
			<div className="admin-nav-designer-add-category-bubble__header">
				<div>
					<div className="admin-nav-designer-add-category-bubble__title">
						Add another category
					</div>
					<div className="admin-nav-designer-add-category-bubble__description">
						Categories become the first level of this navigation panel.
					</div>
				</div>
				<UiChip
					label="+ Category"
					dashed
					disabled={!hasAvailable}
					onClick={() => {
						if (!hasAvailable) {
							return;
						}

						onAddCategoryClick();
					}}
					title={hasAvailable ? "Add a category to navigation" : disabledReason}
				/>
			</div>
			{disabledReason ? <LimitMessage>{disabledReason}</LimitMessage> : null}
		</div>
	);
}

interface AddSubcategoryBubbleProps {
	categoryEditorId: string;
	canAdd: boolean;
	onAddSubcategoryClick: (categoryEditorId: string) => void;
}

function AddSubcategoryBubble({
	categoryEditorId,
	canAdd,
	onAddSubcategoryClick,
}: AddSubcategoryBubbleProps): JSX.Element | null {
	if (!canAdd) {
		return null;
	}

	return (
		<div className="admin-nav-designer-add-subcategory-bubble">
			<div className="admin-nav-designer-add-subcategory-bubble__action">
				<UiChip
					label="+ Subcategory"
					dashed
					onClick={() => onAddSubcategoryClick(categoryEditorId)}
					title="Add a subcategory"
					className="admin-nav-designer-chip--brand-label"
				/>
			</div>
		</div>
	);
}

interface AddItemRowProps {
	categoryEditorId: string;
	subcategoryEditorId: string;
	canAdd: boolean;
	onAddContentClick: (
		categoryEditorId: string,
		subcategoryEditorId: string,
	) => void;
}

function AddItemRow({
	categoryEditorId,
	subcategoryEditorId,
	canAdd,
	onAddContentClick,
}: AddItemRowProps): JSX.Element | null {
	if (!canAdd) {
		return null;
	}

	return (
		<div className="admin-nav-designer-add-item-row">
			<div className="admin-nav-designer-add-item-row__frame">
				<UiChip
					label="+ Item"
					dashed
					onClick={() => onAddContentClick(categoryEditorId, subcategoryEditorId)}
					title="Add an item"
					className="admin-nav-designer-add-item-chip"
					chipClassName="admin-nav-designer-transparent-chip-button"
				/>
			</div>
		</div>
	);
}

interface ItemListColumnProps {
	category: DesignerTreeCategory;
	subcategoryEditorId: string;
	contentMap: Map<string, NavigationContentLookupItem>;
	targetSlotLimit: number | null;
	onAddContentClick: (
		categoryEditorId: string,
		subcategoryEditorId: string,
	) => void;
	onRemoveContent: (
		categoryEditorId: string,
		subcategoryEditorId: string,
		contentEditorId: string,
	) => void;
}

function ItemListColumn({
	category,
	subcategoryEditorId,
	contentMap,
	targetSlotLimit,
	onAddContentClick,
	onRemoveContent,
}: ItemListColumnProps): JSX.Element | null {
	const subcategory = category.subcategories.find(
		(row) => row.editorId === subcategoryEditorId,
	);
	if (!subcategory) {
		return null;
	}

	const targets = subcategory.content;
	const ids = targets.map((target) => target.editorId);

	return (
		<>
			<SortableContext items={ids} strategy={verticalListSortingStrategy}>
				<div className="admin-nav-designer-item-list">
					{targets.map((target) => {
						const targetIcon = getContentIcon(target, contentMap);

						return (
							<SortableItemRow
								key={target.editorId}
								id={target.editorId}
								dragData={{
									type: "content",
									categoryEditorId: category.editorId,
									subcategoryEditorId: subcategory.editorId,
									contentEditorId: target.editorId,
								}}
								target={target}
								icon={targetIcon}
								onRemove={() =>
									onRemoveContent(
										category.editorId,
										subcategory.editorId,
										target.editorId,
									)
								}
							/>
						);
					})}
				</div>
			</SortableContext>

			<AddItemRow
				categoryEditorId={category.editorId}
				subcategoryEditorId={subcategory.editorId}
				canAdd={!isLimitReached(targets.length, targetSlotLimit)}
				onAddContentClick={onAddContentClick}
			/>
		</>
	);
}

interface SubcategoryBubbleProps {
	category: DesignerTreeCategory;
	subcategoryEditorId: string;
	subcategoryMap: Map<string, NavigationSubcategoryLookupItem>;
	contentMap: Map<string, NavigationContentLookupItem>;
	targetSlotLimit: number | null;
	onAddContentClick: (
		categoryEditorId: string,
		subcategoryEditorId: string,
	) => void;
	onRemoveSubcategory: (
		categoryEditorId: string,
		subcategoryEditorId: string,
	) => void;
	onRemoveContent: (
		categoryEditorId: string,
		subcategoryEditorId: string,
		contentEditorId: string,
	) => void;
}

function SubcategoryBubble({
	category,
	subcategoryEditorId,
	subcategoryMap,
	contentMap,
	targetSlotLimit,
	onAddContentClick,
	onRemoveSubcategory,
	onRemoveContent,
}: SubcategoryBubbleProps): JSX.Element | null {
	const subcategory = category.subcategories.find(
		(row) => row.editorId === subcategoryEditorId,
	);
	const sortable = useBubbleSortable(subcategoryEditorId, {
		type: "subcategory",
		categoryEditorId: category.editorId,
		subcategoryEditorId,
	});

	if (!subcategory) {
		return null;
	}

	const bubbleStyle: NavigationDesignerRuntimeStyle = {
		...sortable.style,
		"--admin-nav-designer-subcategory-min-height": `${SUBCATEGORY_BUBBLE_MIN_HEIGHT}px`,
	};
	const subcategoryIcon = getSubcategoryIcon(subcategory, subcategoryMap);

	return (
		<div
			ref={sortable.setNodeRef}
			style={bubbleStyle}
			className={classNames(
				"admin-nav-designer-subcategory-bubble",
				sortable.isDragging && "admin-nav-designer-subcategory-bubble--dragging",
			)}
		>
			<div className="admin-nav-designer-subcategory-bubble__header">
				<div className="admin-nav-designer-subcategory-bubble__eyebrow">
					Subcategory
				</div>
				<div className="admin-nav-designer-subcategory-bubble__actions">
					<span
						{...sortable.attributes}
						{...sortable.listeners}
						className="admin-nav-designer-drag-handle"
					>
						<UiChip
							label={subcategory.title}
							leftIcon={
								<IconRender
									iconKey={subcategoryIcon.iconKey}
									iconColor={subcategoryIcon.iconColor}
									fallback={{ lucideName: "FolderOpen" }}
									mediaRouteScope="admin"
									size={16}
								/>
							}
							rightSlot={<StaleMarker isSelectable={subcategory.isSelectable} />}
							draggable
							className="admin-nav-designer-subcategory-chip admin-nav-designer-chip--brand-label"
							title="Drag this subcategory to reorder it inside the category."
						/>
					</span>
					<RemoveX
						title={`Remove ${subcategory.title}`}
						onClick={async () => {
							const confirmed = await confirmAction({
								title: "Remove subcategory?",
								message: `Remove subcategory "${subcategory.title}" from this category?`,
								confirmLabel: "Remove",
								destructive: true,
							});
							if (confirmed) {
								onRemoveSubcategory(category.editorId, subcategory.editorId);
							}
						}}
					/>
				</div>
			</div>

			<ItemListColumn
				category={category}
				subcategoryEditorId={subcategory.editorId}
				contentMap={contentMap}
				targetSlotLimit={targetSlotLimit}
				onAddContentClick={onAddContentClick}
				onRemoveContent={onRemoveContent}
			/>
		</div>
	);
}

interface CategoryBubbleProps {
	category: DesignerTreeCategory;
	categoryMap: Map<string, NavigationCategoryLookupItem>;
	subcategoryMap: Map<string, NavigationSubcategoryLookupItem>;
	contentMap: Map<string, NavigationContentLookupItem>;
	subcategorySlotLimit: number | null;
	targetSlotLimit: number | null;
	onAddSubcategoryClick: (categoryEditorId: string) => void;
	onAddContentClick: (
		categoryEditorId: string,
		subcategoryEditorId: string,
	) => void;
	onRemoveCategory: (categoryEditorId: string) => void;
	onRemoveSubcategory: (
		categoryEditorId: string,
		subcategoryEditorId: string,
	) => void;
	onRemoveContent: (
		categoryEditorId: string,
		subcategoryEditorId: string,
		contentEditorId: string,
	) => void;
}

function CategoryBubble({
	category,
	categoryMap,
	subcategoryMap,
	contentMap,
	subcategorySlotLimit,
	targetSlotLimit,
	onAddSubcategoryClick,
	onAddContentClick,
	onRemoveCategory,
	onRemoveSubcategory,
	onRemoveContent,
}: CategoryBubbleProps): JSX.Element {
	const sortable = useBubbleSortable(category.editorId, {
		type: "category",
		categoryEditorId: category.editorId,
	});
	const subcategoryIds = category.subcategories.map(
		(subcategory) => subcategory.editorId,
	);
	const canAddSubcategory = !isLimitReached(
		category.subcategories.length,
		subcategorySlotLimit,
	);
	const categoryIcon = getCategoryIcon(category, categoryMap);

	return (
		<div
			ref={sortable.setNodeRef}
			style={sortable.style}
			className={classNames(
				"admin-nav-designer-category-bubble",
				sortable.isDragging && "admin-nav-designer-category-bubble--dragging",
			)}
		>
			<div className="admin-nav-designer-category-bubble__header">
				<div className="admin-nav-designer-category-bubble__actions">
					<span
						{...sortable.attributes}
						{...sortable.listeners}
						className="admin-nav-designer-drag-handle"
					>
						<UiChip
							label={category.title}
							leftIcon={
								<IconRender
									iconKey={categoryIcon.iconKey}
									iconColor={categoryIcon.iconColor}
									fallback={{ lucideName: "Folder" }}
									mediaRouteScope="admin"
									size={16}
								/>
							}
							rightSlot={<StaleMarker isSelectable={category.isSelectable} />}
							draggable
							className="admin-nav-designer-category-chip"
							title="Drag this category to reorder the top-level menu."
						/>
					</span>
					<RemoveX
						title={`Remove ${category.title}`}
						onClick={async () => {
							const confirmed = await confirmAction({
								title: "Remove category?",
								message: `Remove category "${category.title}" and all its subcategories/items from navigation?`,
								confirmLabel: "Remove",
								destructive: true,
							});
							if (confirmed) {
								onRemoveCategory(category.editorId);
							}
						}}
					/>
				</div>
				<div className="admin-nav-designer-category-bubble__level">
					Category level
				</div>
			</div>

			<SortableContext items={subcategoryIds} strategy={rectSortingStrategy}>
				<div className="admin-nav-designer-subcategory-grid">
					{category.subcategories.map((subcategory) => (
						<SubcategoryBubble
							key={subcategory.editorId}
							category={category}
							subcategoryEditorId={subcategory.editorId}
							subcategoryMap={subcategoryMap}
							contentMap={contentMap}
							targetSlotLimit={targetSlotLimit}
							onAddContentClick={onAddContentClick}
							onRemoveSubcategory={onRemoveSubcategory}
							onRemoveContent={onRemoveContent}
						/>
					))}

					<AddSubcategoryBubble
						categoryEditorId={category.editorId}
						canAdd={canAddSubcategory}
						onAddSubcategoryClick={onAddSubcategoryClick}
					/>
				</div>
			</SortableContext>
		</div>
	);
}

export interface NavigationDesignerTreeProps {
	items: DesignerTreeCategory[];
	categories: NavigationCategoryLookupItem[];
	categoryMap: Map<string, NavigationCategoryLookupItem>;
	subcategoryMap: Map<string, NavigationSubcategoryLookupItem>;
	contentMap: Map<string, NavigationContentLookupItem>;
	usedCategoryIds: Set<string>;
	categorySlotLimit: number | null;
	subcategorySlotLimit: number | null;
	targetSlotLimit: number | null;
	onAddCategoryClick: () => void;
	onAddSubcategoryClick: (categoryEditorId: string) => void;
	onAddContentClick: (
		categoryEditorId: string,
		subcategoryEditorId: string,
	) => void;
	onRemoveCategory: (categoryEditorId: string) => void;
	onRemoveSubcategory: (
		categoryEditorId: string,
		subcategoryEditorId: string,
	) => void;
	onRemoveContent: (
		categoryEditorId: string,
		subcategoryEditorId: string,
		contentEditorId: string,
	) => void;
}

export default function NavigationDesignerTree({
	items,
	categories,
	categoryMap,
	subcategoryMap,
	contentMap,
	usedCategoryIds,
	categorySlotLimit,
	subcategorySlotLimit,
	targetSlotLimit,
	onAddCategoryClick,
	onAddSubcategoryClick,
	onAddContentClick,
	onRemoveCategory,
	onRemoveSubcategory,
	onRemoveContent,
}: NavigationDesignerTreeProps): JSX.Element {
	const categoryIds = useMemo(() => {
		return items.map((row) => row.editorId);
	}, [items]);

	return (
		<div className="admin-nav-designer-tree">
			{items.length > 0 ? (
				<SortableContext items={categoryIds} strategy={verticalListSortingStrategy}>
					<div className="admin-nav-designer-category-list">
						{items.map((category) => (
							<CategoryBubble
								key={category.editorId}
								category={category}
								categoryMap={categoryMap}
								subcategoryMap={subcategoryMap}
								contentMap={contentMap}
								subcategorySlotLimit={subcategorySlotLimit}
								targetSlotLimit={targetSlotLimit}
								onAddSubcategoryClick={onAddSubcategoryClick}
								onAddContentClick={onAddContentClick}
								onRemoveCategory={onRemoveCategory}
								onRemoveSubcategory={onRemoveSubcategory}
								onRemoveContent={onRemoveContent}
							/>
						))}
					</div>
				</SortableContext>
			) : (
				<div className="admin-nav-designer-empty-message">
					No categories in navigation yet. Add a category below to start building
					this panel.
				</div>
			)}

			<AddCategoryBubble
				itemsCount={items.length}
				categories={categories}
				usedCategoryIds={usedCategoryIds}
				categorySlotLimit={categorySlotLimit}
				onAddCategoryClick={onAddCategoryClick}
			/>
		</div>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
