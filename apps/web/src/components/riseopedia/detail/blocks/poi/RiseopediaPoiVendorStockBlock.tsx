//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/detail/blocks/poi/RiseopediaPoiVendorStockBlock.tsx                               ////
//// Language: TSX                                                                                            ////
//// Renders release-aware POI vendor stock as a compact media-led catalog with canonical variant price data.  ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import RiseopediaEntityVisual from "@/components/riseopedia/ui/RiseopediaEntityVisual";
import type { JSX } from "react";
import Link from "next/link";
import { Package } from "lucide-react";

import { RiseopediaDetailTable } from "@/components/riseopedia/detail/RiseopediaDetailVisualPrimitives";

import { useRiseopediaVariantKeyLookup } from "@/components/riseopedia/context/RiseopediaVariantLinkContext";

import type {
	RiseopediaEntityMediaRef,
	RiseopediaPoiVendorStockRow,
} from "@/lib/data/riseopedia-entity-detail";
import type { MafiosopediaReleaseFilterCode } from "@/lib/data/mafiosopedia-release";
import {
	buildRiseopediaEntityHref,
	buildRiseopediaMediaHref,
	type OpediaWikiCode,
} from "@/lib/helpers/riseopedia-entity-links";
import { formatRiseopediaNumber } from "@/lib/helpers/riseopedia-number-format";

export type RiseopediaPoiVendorStockBlockProps = {
	rows: RiseopediaPoiVendorStockRow[];
	selectedEntityVariantId: string | null;
	mediaByFileId: Map<string, RiseopediaEntityMediaRef>;
	wikiCode?: OpediaWikiCode;
	releaseFilters?: MafiosopediaReleaseFilterCode[];
};

function titleCaseCode(value: string): string {
	return value
		.split("_")
		.filter((part) => part.length > 0)
		.map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
		.join(" ");
}

function formatNumber(value: number): string {
	return formatRiseopediaNumber(value);
}

function rowsForSelectedVariant(args: {
	rows: RiseopediaPoiVendorStockRow[];
	selectedEntityVariantId: string | null;
}): RiseopediaPoiVendorStockRow[] {
	if (!args.selectedEntityVariantId) {
		return args.rows.filter((row) => row.entityVariantId === null);
	}

	const exactRows = args.rows.filter(
		(row) => row.entityVariantId === args.selectedEntityVariantId,
	);
	if (exactRows.length > 0) {
		return exactRows;
	}

	return args.rows.filter((row) => row.entityVariantId === null);
}

function orderedRows(
	rows: RiseopediaPoiVendorStockRow[],
): RiseopediaPoiVendorStockRow[] {
	return [...rows].sort((left, right) => {
		if (left.sortOrder !== right.sortOrder) {
			return left.sortOrder - right.sortOrder;
		}

		const leftName = left.itemEntityName ?? left.itemSourceValueText ?? "";
		const rightName = right.itemEntityName ?? right.itemSourceValueText ?? "";
		const nameCompare = leftName.localeCompare(rightName);
		if (nameCompare !== 0) {
			return nameCompare;
		}

		return left.lootTableEntryId.localeCompare(right.lootTableEntryId);
	});
}

function stockQuantityValue(row: RiseopediaPoiVendorStockRow): string | null {
	if (row.minQuantity === null && row.maxQuantity === null) {
		return null;
	}

	if (row.minQuantity === null) {
		return `Up to ${formatNumber(row.maxQuantity ?? 0)}`;
	}

	if (row.maxQuantity === null) {
		return `${formatNumber(row.minQuantity)}+`;
	}

	if (row.minQuantity === row.maxQuantity) {
		return formatNumber(row.minQuantity);
	}

	return `${formatNumber(row.minQuantity)}–${formatNumber(row.maxQuantity)}`;
}

function itemPriceValue(row: RiseopediaPoiVendorStockRow): string {
	if (row.itemPriceDisplayValue) {
		return row.itemPriceDisplayValue;
	}

	if (row.itemPriceValue !== null) {
		return formatNumber(row.itemPriceValue);
	}

	return "—";
}

function availabilityLabel(row: RiseopediaPoiVendorStockRow): string | null {
	const labels: string[] = [];
	if (row.availabilityCode !== "guaranteed") {
		labels.push(titleCaseCode(row.availabilityCode));
	}
	if (row.chanceValue !== null) {
		labels.push(`Chance: ${formatNumber(row.chanceValue)}`);
	}
	if (row.weightValue !== null) {
		labels.push(`Weight: ${formatNumber(row.weightValue)}`);
	}

	return labels.length > 0 ? labels.join(" · ") : null;
}

function itemDisplayName(row: RiseopediaPoiVendorStockRow): string {
	return row.itemEntityName ?? row.itemSourceValueText ?? "Unresolved item";
}

function RiseopediaPoiVendorStockIcon({
	row,
	mediaByFileId,
	wikiCode,
}: {
	row: RiseopediaPoiVendorStockRow;
	mediaByFileId: Map<string, RiseopediaEntityMediaRef>;
	wikiCode: OpediaWikiCode | undefined;
}): JSX.Element {
	const media = row.itemIconMediaFileId
		? (mediaByFileId.get(row.itemIconMediaFileId) ?? null)
		: null;
	const iconHref =
		media?.url ?? buildRiseopediaMediaHref(row.itemIconMediaFileId, wikiCode);

	return (
		<span className="riseopedia-poi-vendor-stock__icon" aria-hidden>
			{iconHref ? (
				<RiseopediaEntityVisual
					className="riseopedia-poi-vendor-stock__visual riseopedia-entity-visual--embedded"
					media={{
						url: iconHref,
						width: media?.width ?? null,
						height: media?.height ?? null,
					}}
					alt=""
					placeholderLabel="Vendor item"
					size="inline"
					decorative
				/>
			) : (
				<Package className="riseopedia-poi-vendor-stock__icon-fallback" />
			)}
		</span>
	);
}

export default function RiseopediaPoiVendorStockBlock({
	rows,
	selectedEntityVariantId,
	mediaByFileId,
	wikiCode,
	releaseFilters,
}: RiseopediaPoiVendorStockBlockProps): JSX.Element | null {
	const variantKeyFor = useRiseopediaVariantKeyLookup();
	const visibleRows = orderedRows(
		rowsForSelectedVariant({ rows, selectedEntityVariantId }),
	);
	if (visibleRows.length === 0) {
		return null;
	}

	return (
		<section className="riseopedia-body-section riseopedia-poi-vendor-stock">
			<RiseopediaDetailTable variant="standard">
				<ul className="riseopedia-poi-vendor-stock__list">
					<li className="riseopedia-poi-vendor-stock__header" aria-hidden>
						<span className="riseopedia-poi-vendor-stock__header-item">Item</span>
						<span className="riseopedia-poi-vendor-stock__header-price">Price</span>
						<span className="riseopedia-poi-vendor-stock__header-stock">Stock</span>
					</li>
					{visibleRows.map((row) => {
						const href = buildRiseopediaEntityHref({
							entityTypeCode: row.itemEntityTypeCode,
							entitySlug: row.itemEntitySlug,
							targetEntityVariantKey: variantKeyFor(row.itemEntityVariantId),
							wikiCode,
							releaseFilters,
						});
						const classification = [
							row.itemEntityVariantLabel,
							row.itemEntityClassName,
						]
							.filter((value): value is string => value !== null && value !== "")
							.join(" · ");
						const quantity = stockQuantityValue(row);
						const availability = availabilityLabel(row);

						return (
							<li
								className="riseopedia-poi-vendor-stock__row"
								data-resolution-status={row.resolutionStatusCode}
								key={row.lootTableEntryId}
							>
								<div className="riseopedia-poi-vendor-stock__item">
									<RiseopediaPoiVendorStockIcon
										row={row}
										mediaByFileId={mediaByFileId}
										wikiCode={wikiCode}
									/>
									<div className="riseopedia-poi-vendor-stock__copy">
										{href ? (
											<Link className="riseopedia-poi-vendor-stock__link" href={href}>
												{itemDisplayName(row)}
											</Link>
										) : (
											<span className="riseopedia-poi-vendor-stock__name">
												{itemDisplayName(row)}
											</span>
										)}
										{classification ? (
											<span className="riseopedia-poi-vendor-stock__meta">
												{classification}
											</span>
										) : null}
									</div>
								</div>
								<span
									className="riseopedia-poi-vendor-stock__price"
									data-missing-price={
										row.itemPriceDisplayValue === null && row.itemPriceValue === null
									}
								>
									{itemPriceValue(row)}
								</span>
								<div className="riseopedia-poi-vendor-stock__facts">
									{quantity ? (
										<span className="riseopedia-poi-vendor-stock__quantity">
											{quantity}
										</span>
									) : (
										<span className="riseopedia-poi-vendor-stock__quantity">—</span>
									)}
									{availability ? (
										<span className="riseopedia-poi-vendor-stock__availability">
											{availability}
										</span>
									) : null}
									{row.resolutionStatusCode !== "resolved" ? (
										<span className="riseopedia-poi-vendor-stock__status">
											{titleCaseCode(row.resolutionStatusCode)}
										</span>
									) : null}
								</div>
							</li>
						);
					})}
				</ul>
			</RiseopediaDetailTable>
		</section>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
