//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/RiseopediaEntityCard.tsx                                        ////
//// Language: TSX                                                                                            ////
//// Reusable compact and full Riseopedia entity overview card renderer.                                      ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/* eslint-disable @next/next/no-img-element */
import type { JSX } from "react";
import Link from "next/link";
import { ArrowRight, Box, ChefHat } from "lucide-react";

import type {
	RiseopediaEntityCardProperty,
	RiseopediaEntityDoc,
} from "@/lib/data/riseopedia-entities";
import {
	buildRiseopediaEntityHref,
	type OpediaWikiCode,
} from "@/lib/helpers/riseopedia-entity-links";

export type RiseopediaEntityCardMode = "compact" | "full";

export type RiseopediaFullCardPropertyDefinition = {
	key: string;
	label: string;
	slotCode: string;
	sortOrder: number;
};

export type RiseopediaEntityCardProps = {
	entity: RiseopediaEntityDoc;
	propertyDefinitions?: RiseopediaFullCardPropertyDefinition[];
	wikiCode?: OpediaWikiCode;
};

function formatEntityType(entity: RiseopediaEntityDoc): string {
	if (entity.entityTypeName && entity.entityTypeName.trim().length > 0) {
		return entity.entityTypeName;
	}

	if (entity.entityTypeCode === "recipe") {
		return "Recipe";
	}

	if (entity.entityTypeCode === "asset") {
		return "Asset";
	}

	return entity.entityTypeCode;
}

function metaLabel(entity: RiseopediaEntityDoc): string {
	return [formatEntityType(entity), entity.entityClassName]
		.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
		.join(" / ");
}

function summaryLabel(entity: RiseopediaEntityDoc): string {
	const categoryParts = [entity.categoryName, entity.subcategoryName].filter(
		(value): value is string => typeof value === "string" && value.trim().length > 0,
	);

	if (categoryParts.length > 0) {
		return categoryParts.join(" - ");
	}

	if (entity.sectionName && entity.sectionName.trim().length > 0) {
		return entity.sectionName;
	}

	if (entity.releaseStateName && entity.releaseStateName.trim().length > 0) {
		return entity.releaseStateName;
	}

	return "Open the entry detail page.";
}

function RiseopediaEntityCardIcon({ entity }: { entity: RiseopediaEntityDoc }): JSX.Element {
	if (entity.media) {
		return (
			<img
				className="riseopedia-result-card__image"
				src={entity.media.url}
				alt=""
				width={entity.media.width ?? undefined}
				height={entity.media.height ?? undefined}
				loading="lazy"
			/>
		);
	}

	if (entity.entityTypeCode === "recipe") {
		return <ChefHat className="riseopedia-result-card__fallback-icon" />;
	}

	return <Box className="riseopedia-result-card__fallback-icon" />;
}

function compactProperty(entity: RiseopediaEntityDoc): RiseopediaEntityCardProperty | null {
	return entity.cardProperties.find((property) => (
		property.displaySlotCode === "compact_property"
		&& typeof property.displayValue === "string"
		&& property.displayValue.trim().length > 0
	)) ?? null;
}

function isFullBodyProperty(property: RiseopediaEntityCardProperty): boolean {
	return /^body_\d+$/.test(property.displaySlotCode) || /^footer_\d+$/.test(property.displaySlotCode);
}

function sortFullCardProperties(
	left: RiseopediaEntityCardProperty,
	right: RiseopediaEntityCardProperty,
): number {
	if (left.sortOrder !== right.sortOrder) {
		return left.sortOrder - right.sortOrder;
	}

	return left.displaySlotCode.localeCompare(right.displaySlotCode);
}

export function buildRiseopediaFullCardPropertyDefinitions(
	rows: RiseopediaEntityDoc[],
): RiseopediaFullCardPropertyDefinition[] {
	const definitionsBySlot = new Map<string, RiseopediaFullCardPropertyDefinition>();

	for (const entity of rows) {
		if (entity.cardMode !== "full") {
			continue;
		}

		for (const property of entity.cardProperties) {
			if (!isFullBodyProperty(property)) {
				continue;
			}

			const existing = definitionsBySlot.get(property.displaySlotCode);
			if (!existing || property.sortOrder < existing.sortOrder) {
				definitionsBySlot.set(property.displaySlotCode, {
					key: property.displaySlotCode,
					label: property.displayLabel,
					slotCode: property.displaySlotCode,
					sortOrder: property.sortOrder,
				});
			}
		}
	}

	return Array.from(definitionsBySlot.values())
		.sort((left, right) => left.sortOrder - right.sortOrder || left.slotCode.localeCompare(right.slotCode));
}

function ownFullCardProperties(entity: RiseopediaEntityDoc): RiseopediaEntityCardProperty[] {
	return entity.cardProperties
		.filter(isFullBodyProperty)
		.sort(sortFullCardProperties);
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function sentenceCase(value: string): string {
	if (value.length <= 0) {
		return value;
	}

	return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
}

function cleanedPropertyLabel(
	entity: RiseopediaEntityDoc,
	property: RiseopediaEntityCardProperty,
): string {
	let label = property.displayLabel.trim();
	const prefixCandidates = [
		entity.entityClassName,
		entity.categoryName,
		entity.subcategoryName,
	]
		.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
		.map((value) => value.trim())
		.sort((left, right) => right.length - left.length);

	for (const prefix of prefixCandidates) {
		const pattern = new RegExp(`^${escapeRegExp(prefix)}(?:\\s+|[-_:]+\\s*)`, "i");
		label = label.replace(pattern, "").trim();
	}

	return sentenceCase(label.length > 0 ? label : property.displayLabel.trim());
}

function propertyValue(property: RiseopediaEntityCardProperty): string {
	const value = property.displayValue?.trim();

	return value && value.length > 0 ? value : "N/A";
}

function RiseopediaCompactEntityCard({
	entity,
	wikiCode,
}: {
	entity: RiseopediaEntityDoc;
	wikiCode: OpediaWikiCode | undefined;
}): JSX.Element {
	const href = buildRiseopediaEntityHref({
		entityTypeCode: entity.entityTypeCode,
		entitySlug: entity.entitySlug,
		wikiCode,
	});
	const quickFact = compactProperty(entity);
	const body = (
		<>
			<span className="public-collection-card__icon riseopedia-result-card__icon riseopedia-entity-card-compact__icon" aria-hidden>
				<RiseopediaEntityCardIcon entity={entity} />
			</span>

			<span className="public-collection-card__body riseopedia-entity-card-compact__body">
				<span className="public-collection-card__meta">
					<span className="public-collection-card__meta-item">{metaLabel(entity)}</span>
				</span>
				<span className="public-collection-card__title">{entity.entityName}</span>
				<span className="public-collection-card__summary">{summaryLabel(entity)}</span>
				{quickFact && quickFact.displayValue ? (
					<span className="riseopedia-entity-card-compact__property">
						{cleanedPropertyLabel(entity, quickFact)}: {quickFact.displayValue}
					</span>
				) : null}
			</span>

			<ArrowRight className="public-collection-card__arrow" aria-hidden />
		</>
	);
	const className = "public-collection-card riseopedia-result-card riseopedia-entity-card riseopedia-entity-card--compact";

	if (!href) {
		return <article className={className}>{body}</article>;
	}

	return (
		<Link className={className} href={href}>
			{body}
		</Link>
	);
}

function RiseopediaFullEntityCard({
	entity,
	propertyDefinitions,
	wikiCode,
}: {
	entity: RiseopediaEntityDoc;
	propertyDefinitions: RiseopediaFullCardPropertyDefinition[];
	wikiCode: OpediaWikiCode | undefined;
}): JSX.Element {
	const href = buildRiseopediaEntityHref({
		entityTypeCode: entity.entityTypeCode,
		entitySlug: entity.entitySlug,
		wikiCode,
	});
	const ownProperties = ownFullCardProperties(entity);
	const rowCount = Math.max(propertyDefinitions.length, ownProperties.length);
	const blankRowCount = Math.max(0, rowCount - ownProperties.length);
	const body = (
		<>
			<div className="riseopedia-entity-card-full__header">
				<div className="riseopedia-entity-card-full__heading">
					<span className="public-collection-card__meta">
						<span className="public-collection-card__meta-item">{metaLabel(entity)}</span>
					</span>
					<span className="public-collection-card__title riseopedia-entity-card-full__title">{entity.entityName}</span>
					<span className="public-collection-card__summary riseopedia-entity-card-full__classification">{summaryLabel(entity)}</span>
					<span className="riseopedia-entity-card-full__separator" aria-hidden />
				</div>
				<span className="public-collection-card__icon riseopedia-result-card__icon riseopedia-entity-card-full__icon" aria-hidden>
					<RiseopediaEntityCardIcon entity={entity} />
				</span>
			</div>

			{rowCount > 0 ? (
				<dl className="riseopedia-entity-card-full__properties">
					{ownProperties.map((property) => (
						<div className="riseopedia-entity-card-full__property-row" key={`${property.displaySlotCode}:${property.sourceCode}`}>
							<dt className="riseopedia-entity-card-full__property-label">
								{cleanedPropertyLabel(entity, property)}
							</dt>
							<dd className="riseopedia-entity-card-full__property-value">
								{propertyValue(property)}
							</dd>
						</div>
					))}
					{Array.from({ length: blankRowCount }, (_, index) => (
						<div
							className="riseopedia-entity-card-full__property-row riseopedia-entity-card-full__property-row--empty"
							key={`empty:${index}`}
							aria-hidden
						>
							<dt className="riseopedia-entity-card-full__property-label">&nbsp;</dt>
							<dd className="riseopedia-entity-card-full__property-value">&nbsp;</dd>
						</div>
					))}
				</dl>
			) : null}
		</>
	);
	const className = "riseopedia-entity-card riseopedia-entity-card--full";

	if (!href) {
		return <article className={className}>{body}</article>;
	}

	return (
		<Link className={className} href={href}>
			{body}
		</Link>
	);
}

export default function RiseopediaEntityCard({
	entity,
	propertyDefinitions = [],
	wikiCode,
}: RiseopediaEntityCardProps): JSX.Element {
	if (entity.cardMode === "full") {
		return (
			<RiseopediaFullEntityCard
				entity={entity}
				propertyDefinitions={propertyDefinitions}
				wikiCode={wikiCode}
			/>
		);
	}

	return <RiseopediaCompactEntityCard entity={entity} wikiCode={wikiCode} />;
}
