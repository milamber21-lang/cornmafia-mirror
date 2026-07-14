//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/detail/blocks/perk/RiseopediaPerkTreeBlock.tsx                                      ////
//// Language: TSX                                                                                            ////
//// Renders DB-configured direct Perk prerequisite and unlock branches around the current Perk.             ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import RiseopediaEntityVisual from "@/components/riseopedia/ui/RiseopediaEntityVisual";
import type { JSX } from "react";
import Link from "next/link";

import IconRender from "@/components/ui/IconRender";
import RiseopediaEmptyState from "@/components/riseopedia/ui/RiseopediaEmptyState";
import { useRiseopediaVariantKeyLookup } from "@/components/riseopedia/context/RiseopediaVariantLinkContext";

import type {
	RiseopediaEntityDetailDoc,
	RiseopediaEntityMediaRef,
	RiseopediaPerkTreeRow,
} from "@/lib/data/riseopedia-entity-detail";
import type { MafiosopediaReleaseFilterCode } from "@/lib/data/mafiosopedia-release";
import {
	buildRiseopediaEntityHref,
	buildRiseopediaMediaHref,
	type OpediaWikiCode,
} from "@/lib/helpers/riseopedia-entity-links";

export type RiseopediaPerkTreeBlockProps = {
	rows: RiseopediaPerkTreeRow[];
	selectedEntityVariantId: string | null;
	currentEntity: RiseopediaEntityDetailDoc;
	currentEntityIconMediaFileId: string | null;
	mediaByFileId: Map<string, RiseopediaEntityMediaRef>;
	wikiCode?: OpediaWikiCode;
	releaseFilters?: MafiosopediaReleaseFilterCode[];
};

type PerkTreeGroupKind = "requirements" | "unlocks";

type PerkTreeIconFallback = {
	key: string | null;
	source: "lucide" | "media";
	lucideName: string | null;
};

type PerkTreeGroupPresentation = {
	label: string;
	emptyLabel: string | null;
};

function rowsForSelectedVariant(args: {
	rows: RiseopediaPerkTreeRow[];
	selectedEntityVariantId: string | null;
}): RiseopediaPerkTreeRow[] {
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

function relationshipMeta(row: RiseopediaPerkTreeRow): string | null {
	const values = [row.targetEntityVariantLabel, row.targetClassName].filter(
		(value): value is string => value !== null && value !== "",
	);

	return values.length > 0 ? values.join(" · ") : null;
}

function relationshipFallback(
	row: RiseopediaPerkTreeRow,
): PerkTreeIconFallback {
	return {
		key: row.fallbackIconKey,
		source: row.fallbackIconSourceCode === "media" ? "media" : "lucide",
		lucideName: row.fallbackIconLucideName,
	};
}

function currentFallback(row: RiseopediaPerkTreeRow): PerkTreeIconFallback {
	return {
		key: row.currentFallbackIconKey,
		source: row.currentFallbackIconSourceCode === "media" ? "media" : "lucide",
		lucideName: row.currentFallbackIconLucideName,
	};
}

function groupPresentation(args: {
	kind: PerkTreeGroupKind;
	contextRow: RiseopediaPerkTreeRow;
}): PerkTreeGroupPresentation {
	if (args.kind === "requirements") {
		return {
			label: args.contextRow.requirementsSectionLabel,
			emptyLabel: args.contextRow.requirementsSectionEmptyLabel,
		};
	}

	return {
		label: args.contextRow.unlocksSectionLabel,
		emptyLabel: args.contextRow.unlocksSectionEmptyLabel,
	};
}

function mediaHref(args: {
	mediaFileId: string | null;
	mediaByFileId: Map<string, RiseopediaEntityMediaRef>;
	wikiCode: OpediaWikiCode | undefined;
}): string | null {
	if (!args.mediaFileId) {
		return null;
	}

	return (
		args.mediaByFileId.get(args.mediaFileId)?.url ??
		buildRiseopediaMediaHref(args.mediaFileId, args.wikiCode)
	);
}

function PerkTreeIcon({
	mediaFileId,
	fallback,
	mediaByFileId,
	wikiCode,
	className,
}: {
	mediaFileId: string | null;
	fallback: PerkTreeIconFallback;
	mediaByFileId: Map<string, RiseopediaEntityMediaRef>;
	wikiCode: OpediaWikiCode | undefined;
	className: string;
}): JSX.Element {
	const href = mediaHref({ mediaFileId, mediaByFileId, wikiCode });

	if (!href) {
		return (
			<IconRender
				className={`${className}-fallback`}
				iconKey={fallback}
				fallback={{ lucideName: "CircleDot" }}
				size={18}
			/>
		);
	}

	return (
		<RiseopediaEntityVisual
			className={`${className}-visual riseopedia-entity-visual--embedded`}
			media={{ url: href }}
			alt=""
			placeholderLabel="Perk"
			size="inline"
			decorative
		/>
	);
}

function PerkTreeRowItem({
	row,
	mediaByFileId,
	wikiCode,
	releaseFilters,
}: {
	row: RiseopediaPerkTreeRow;
	mediaByFileId: Map<string, RiseopediaEntityMediaRef>;
	wikiCode: OpediaWikiCode | undefined;
	releaseFilters: MafiosopediaReleaseFilterCode[] | undefined;
}): JSX.Element {
	const variantKeyFor = useRiseopediaVariantKeyLookup();
	const href = buildRiseopediaEntityHref({
		entityTypeCode: "perk",
		entitySlug: row.targetEntitySlug,
		targetEntityVariantKey: variantKeyFor(row.targetEntityVariantId),
		wikiCode,
		releaseFilters,
	});
	const meta = relationshipMeta(row);

	return (
		<li className="riseopedia-perk-tree__row">
			<span className="riseopedia-perk-tree__icon" aria-hidden="true">
				<PerkTreeIcon
					mediaFileId={row.targetIconMediaFileId}
					fallback={relationshipFallback(row)}
					mediaByFileId={mediaByFileId}
					wikiCode={wikiCode}
					className="riseopedia-perk-tree__icon"
				/>
			</span>
			<div className="riseopedia-perk-tree__copy">
				{href ? (
					<Link className="riseopedia-perk-tree__link" href={href}>
						{row.targetEntityName}
					</Link>
				) : (
					<span className="riseopedia-perk-tree__name">{row.targetEntityName}</span>
				)}
				{meta ? <span className="riseopedia-perk-tree__meta">{meta}</span> : null}
			</div>
		</li>
	);
}

function PerkTreeGroup({
	kind,
	rows,
	contextRow,
	mediaByFileId,
	wikiCode,
	releaseFilters,
}: {
	kind: PerkTreeGroupKind;
	rows: RiseopediaPerkTreeRow[];
	contextRow: RiseopediaPerkTreeRow;
	mediaByFileId: Map<string, RiseopediaEntityMediaRef>;
	wikiCode: OpediaWikiCode | undefined;
	releaseFilters: MafiosopediaReleaseFilterCode[] | undefined;
}): JSX.Element {
	const presentation = groupPresentation({ kind, contextRow });

	return (
		<section
			className={`riseopedia-perk-tree__group riseopedia-perk-tree__group--${kind}`}
		>
			<h3 className="riseopedia-perk-tree__group-title">{presentation.label}</h3>
			{rows.length > 0 ? (
				<ul className="riseopedia-perk-tree__list">
					{rows.map((row) => (
						<PerkTreeRowItem
							key={row.entityRelationshipId}
							row={row}
							mediaByFileId={mediaByFileId}
							wikiCode={wikiCode}
							releaseFilters={releaseFilters}
						/>
					))}
				</ul>
			) : (
				<RiseopediaEmptyState
					title={presentation.emptyLabel ?? "No rows available."}
				/>
			)}
		</section>
	);
}

function PerkTreeCurrentNode({
	currentEntity,
	currentEntityIconMediaFileId,
	contextRow,
	mediaByFileId,
	wikiCode,
}: {
	currentEntity: RiseopediaEntityDetailDoc;
	currentEntityIconMediaFileId: string | null;
	contextRow: RiseopediaPerkTreeRow;
	mediaByFileId: Map<string, RiseopediaEntityMediaRef>;
	wikiCode: OpediaWikiCode | undefined;
}): JSX.Element {
	return (
		<section
			className="riseopedia-perk-tree__current"
			aria-label={contextRow.currentSectionLabel}
		>
			<p className="riseopedia-perk-tree__current-label">
				{contextRow.currentSectionLabel}
			</p>
			<span className="riseopedia-perk-tree__current-icon" aria-hidden="true">
				<PerkTreeIcon
					mediaFileId={currentEntityIconMediaFileId}
					fallback={currentFallback(contextRow)}
					mediaByFileId={mediaByFileId}
					wikiCode={wikiCode}
					className="riseopedia-perk-tree__current-icon"
				/>
			</span>
			<span className="riseopedia-perk-tree__current-name">
				{currentEntity.entityName}
			</span>
			<span className="riseopedia-perk-tree__current-meta">
				{contextRow.currentMetaDisplayLabel}
			</span>
		</section>
	);
}

export default function RiseopediaPerkTreeBlock({
	rows,
	selectedEntityVariantId,
	currentEntity,
	currentEntityIconMediaFileId,
	mediaByFileId,
	wikiCode,
	releaseFilters,
}: RiseopediaPerkTreeBlockProps): JSX.Element | null {
	const selectedRows = rowsForSelectedVariant({
		rows,
		selectedEntityVariantId,
	});
	const contextRow = selectedRows.at(0);

	if (!contextRow) {
		return null;
	}

	const requirements = selectedRows.filter(
		(row) => row.relationshipRoleCode === "requirement",
	);
	const unlocks = selectedRows.filter(
		(row) => row.relationshipRoleCode === "unlock",
	);

	return (
		<section className="riseopedia-body-section riseopedia-perk-tree">
			<div className="riseopedia-perk-tree__grid">
				<PerkTreeGroup
					kind="requirements"
					rows={requirements}
					contextRow={contextRow}
					mediaByFileId={mediaByFileId}
					wikiCode={wikiCode}
					releaseFilters={releaseFilters}
				/>
				<PerkTreeCurrentNode
					currentEntity={currentEntity}
					currentEntityIconMediaFileId={currentEntityIconMediaFileId}
					contextRow={contextRow}
					mediaByFileId={mediaByFileId}
					wikiCode={wikiCode}
				/>
				<PerkTreeGroup
					kind="unlocks"
					rows={unlocks}
					contextRow={contextRow}
					mediaByFileId={mediaByFileId}
					wikiCode={wikiCode}
					releaseFilters={releaseFilters}
				/>
			</div>
		</section>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
