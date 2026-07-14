//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/admin/web/content/[id]/show/page.tsx                                                  ////
//// Language: TSX                                                                                                ////
//// Admin content preview page using the shared content renderer with preview analytics below.                   ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { CSSProperties, JSX } from "react";
import Link from "next/link";

import ContentRenderer from "@/components/renderers/content/ContentRenderer";
import { hasRenderableValue } from "@/components/renderers/content/field-utils";
import RenderDebugFrame from "@/components/renderers/content/RenderDebugFrame";
import { createAdminContentRenderModel } from "@/components/renderers/content/render-model";
import type {
	ContentRenderDestinationCode,
	ContentRenderField,
	ContentRenderModel,
} from "@/components/renderers/content/types";
import {
	ButtonLink,
	StatusPill,
	SurfaceCard,
	type SurfaceTone,
} from "@/components/ui";
import { requireAdminOrEditor } from "@/lib/auth/authz";
import {
	findContentAdminPreviewById,
	type ContentAdminPreview,
	type ContentAdminPreviewField,
} from "@/lib/data/content";

export const dynamic = "force-dynamic";

const PREVIEW_DEBUG_DEFAULT = false;

type SearchParamValue = string | string[] | undefined;

type ContentShowPageProps = {
	params: Promise<{
		id: string;
	}>;
	searchParams?: Promise<Record<string, SearchParamValue>>;
};

type ContentHealthTone = "good" | "warning" | "danger" | "neutral";

type ContentPreviewWarning = {
	id: string;
	tone: ContentHealthTone;
	label: string;
	description: string;
};

type CountEntry = {
	key: string;
	label: string;
	count: number;
};

type MetricCardProps = {
	label: string;
	value: string;
	description: string;
	tone?: ContentHealthTone;
	debugEnabled: boolean;
};

type DistributionBarProps = {
	label: string;
	count: number;
	total: number;
};

const DESTINATION_ORDER: ContentRenderDestinationCode[] = [
	"hero",
	"top",
	"main",
	"bottom",
	"left",
	"right",
	"seo",
	"hidden",
];

const DESTINATION_LABELS: Record<ContentRenderDestinationCode, string> = {
	seo: "SEO",
	hero: "Hero",
	top: "Top",
	left: "Left",
	main: "Main",
	right: "Right",
	bottom: "Bottom",
	hidden: "Hidden",
};

function parsePositiveInt(value: string): number | null {
	if (!/^\d+$/.test(value.trim())) {
		return null;
	}

	const parsed = Number(value.trim());
	return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function formatBoolean(value: boolean | null): string {
	if (value === null) {
		return "Inherited";
	}

	return value ? "Yes" : "No";
}

function formatPolicy(policyCode: string, rank: number | null): string {
	if (policyCode === "public") {
		return "Public";
	}

	if (policyCode === "rank_at_least") {
		return rank === null ? "Minimum rank" : `Minimum rank ${rank}`;
	}

	if (policyCode === "rank_equal") {
		return rank === null ? "Exact rank" : `Exact rank ${rank}`;
	}

	return policyCode;
}

function getPercent(count: number, total: number): number {
	if (total <= 0) {
		return 0;
	}

	return Math.round((count / total) * 100);
}

function getSurfaceTone(tone: ContentHealthTone): SurfaceTone {
	if (tone === "good") {
		return "success";
	}

	if (tone === "neutral") {
		return "default";
	}

	return tone;
}

function countByLabel(fields: ContentRenderField[]): CountEntry[] {
	const counts = new Map<string, CountEntry>();

	for (const field of fields) {
		const label =
			field.fieldTypeCode.trim().length > 0 ? field.fieldTypeCode : "unknown";
		const current = counts.get(label);
		if (current) {
			current.count += 1;
		} else {
			counts.set(label, {
				key: label,
				label,
				count: 1,
			});
		}
	}

	return [...counts.values()].sort((left, right) => {
		if (left.count !== right.count) {
			return right.count - left.count;
		}

		return left.label.localeCompare(right.label);
	});
}

function getRequiredMissingFields(
	preview: ContentAdminPreview,
): ContentAdminPreviewField[] {
	return preview.fields.filter(
		(field) => field.isRequired && !hasRenderableValue(field.value),
	);
}

function getMediaMissingFields(
	preview: ContentAdminPreview,
): ContentAdminPreviewField[] {
	return preview.fields.filter(
		(field) =>
			field.valueColumnName === "value_media_id" &&
			hasRenderableValue(field.value) &&
			!field.media,
	);
}

function buildPreviewWarnings(args: {
	preview: ContentAdminPreview;
	model: ContentRenderModel;
}): ContentPreviewWarning[] {
	const { preview, model } = args;
	const { doc } = preview;
	const warnings: ContentPreviewWarning[] = [];
	const requiredMissingFields = getRequiredMissingFields(preview);
	const mediaMissingFields = getMediaMissingFields(preview);
	const mainRenderableCount = model.fieldsByDestination.main.filter((field) =>
		hasRenderableValue(field.value),
	).length;

	if (doc.statusCode !== "published") {
		warnings.push({
			id: "status",
			tone: "warning",
			label: "Not published",
			description: `Current status is ${doc.statusCode}. Public routes may not render it yet.`,
		});
	}

	if (!doc.summary || doc.summary.trim().length === 0) {
		warnings.push({
			id: "summary",
			tone: "warning",
			label: "Missing summary",
			description:
				"A summary helps cards, previews, and public content pages scan better.",
		});
	}

	if (!model.doc.iconKey) {
		warnings.push({
			id: "icon",
			tone: "neutral",
			label: "No explicit icon",
			description:
				"The content may still inherit a template icon, but no explicit icon is set on this row.",
		});
	}

	if (!doc.subcategorySlug) {
		warnings.push({
			id: "subcategory",
			tone: "warning",
			label: "No subcategory route part",
			description:
				"Public content routes normally need category, subcategory, and content slugs.",
		});
	}

	if (doc.readEffectivePolicyCode !== "public") {
		warnings.push({
			id: "read-policy",
			tone: "neutral",
			label: "Role-gated read access",
			description: `Effective read policy is ${formatPolicy(doc.readEffectivePolicyCode, doc.readEffectiveRank)}.`,
		});
	}

	if (doc.navHiddenEffective) {
		warnings.push({
			id: "navigation",
			tone: "neutral",
			label: "Hidden from navigation",
			description:
				"The content can still be addressable, but it should not appear in normal navigation lists.",
		});
	}

	if (mainRenderableCount === 0) {
		warnings.push({
			id: "main-fields",
			tone: "warning",
			label: "No main fields filled",
			description:
				"The main content area has no filled fields, so the rendered page may look sparse.",
		});
	}

	if (requiredMissingFields.length > 0) {
		warnings.push({
			id: "required-fields",
			tone: "danger",
			label: "Required fields missing",
			description: `${requiredMissingFields.length} required field(s) are empty.`,
		});
	}

	if (mediaMissingFields.length > 0) {
		warnings.push({
			id: "media-fields",
			tone: "warning",
			label: "Media metadata missing",
			description: `${mediaMissingFields.length} media field(s) have an id but no resolved media row.`,
		});
	}

	return warnings;
}

function PreviewDebugLegend(): JSX.Element {
	return (
		<RenderDebugFrame
			enabled={true}
			label="Debug legend"
			description="How to read the colored borders"
			variant="generic"
		>
			<SurfaceCard className="admin-preview-debug-card">
				<p className="admin-preview-debug-card__title">Debug borders are enabled</p>
				<p className="admin-preview-debug-card__description">
					Different border colors show the preview page, renderer shell,
					destinations, analytics blocks, and individual rendered fields.
				</p>
			</SurfaceCard>
		</RenderDebugFrame>
	);
}

function MetricCard({
	label,
	value,
	description,
	tone = "neutral",
	debugEnabled,
}: MetricCardProps): JSX.Element {
	return (
		<RenderDebugFrame
			enabled={debugEnabled}
			label={`Metric / ${label}`}
			description={description}
			variant="metric"
		>
			<SurfaceCard tone={getSurfaceTone(tone)} className="admin-preview-metric">
				<p className="admin-preview-metric__label">{label}</p>
				<div className="admin-preview-metric__value">{value}</div>
				<p className="admin-preview-metric__description">{description}</p>
			</SurfaceCard>
		</RenderDebugFrame>
	);
}

function DistributionBar({
	label,
	count,
	total,
}: DistributionBarProps): JSX.Element {
	const percent = getPercent(count, total);
	const progressStyle: CSSProperties & {
		"--admin-preview-progress-value": string;
	} = {
		"--admin-preview-progress-value": `${percent}%`,
	};

	return (
		<div className="admin-preview-distribution">
			<div className="admin-preview-distribution__meta">
				<span>{label}</span>
				<span className="admin-preview-distribution__count">
					{count} / {total}
				</span>
			</div>
			<div className="admin-preview-progress">
				<div className="admin-preview-progress__bar" style={progressStyle} />
			</div>
		</div>
	);
}

function getSearchParamValue(value: SearchParamValue): string | null {
	if (Array.isArray(value)) {
		return value[0] ?? null;
	}

	return value ?? null;
}

function getPreviewDebugEnabled(
	searchParams: Record<string, SearchParamValue>,
): boolean {
	const value = getSearchParamValue(searchParams.debug);
	if (!value) {
		return PREVIEW_DEBUG_DEFAULT;
	}

	const normalized = value.trim().toLowerCase();
	return normalized !== "0" && normalized !== "false" && normalized !== "off";
}

function getPreviewDebugHref(contentId: string, debugEnabled: boolean): string {
	const nextValue = debugEnabled ? "0" : "1";
	return `/admin/web/content/${contentId}/show?debug=${nextValue}`;
}

function PreviewSeparator(): JSX.Element {
	return <div className="admin-preview-separator" />;
}

function MetadataBox({
	label,
	value,
}: {
	label: string;
	value: string;
}): JSX.Element {
	return (
		<SurfaceCard
			tone="subtle"
			density="compact"
			className="admin-preview-metadata-box"
		>
			<div className="admin-preview-metadata-box__label">{label}</div>
			<div className="admin-preview-metadata-box__value">{value}</div>
		</SurfaceCard>
	);
}

function PreviewHero({
	preview,
	model,
	debugEnabled,
}: {
	preview: ContentAdminPreview;
	model: ContentRenderModel;
	debugEnabled: boolean;
}): JSX.Element {
	const { doc } = preview;

	return (
		<RenderDebugFrame
			enabled={debugEnabled}
			label="Preview page header"
			description="Top actions and preview context"
			variant="page-header"
		>
			<section className="card admin-preview-hero">
				<div className="admin-preview-hero__header">
					<h1 className="admin-page-card-title">{doc.title}</h1>

					<div className="admin-preview-hero__actions">
						<ButtonLink href="/admin/web/content" variant="secondary">
							Back to content
						</ButtonLink>
						<ButtonLink
							href={getPreviewDebugHref(doc.id, debugEnabled)}
							variant="secondary"
						>
							{debugEnabled ? "Hide debug lines" : "Show debug lines"}
						</ButtonLink>
					</div>
				</div>

				<div className="admin-preview-metadata-grid">
					<MetadataBox label="Status" value={doc.statusCode} />
					<MetadataBox label="Template" value={doc.templateLabel} />
					<MetadataBox label="Kind" value={doc.contentKindLabel} />
					<MetadataBox label="Renderer" value={model.doc.rendererCode} />
				</div>
			</section>
		</RenderDebugFrame>
	);
}

function RenderedPreview({
	model,
	debugEnabled,
}: {
	model: ContentRenderModel;
	debugEnabled: boolean;
}): JSX.Element {
	return (
		<RenderDebugFrame
			enabled={debugEnabled}
			label="Rendered preview"
			description="Shared renderer output"
			variant="page-preview"
		>
			<section className="admin-preview-rendered">
				<h2 className="admin-preview-section-title">Page Preview</h2>
				<ContentRenderer model={model} debug={debugEnabled} />
			</section>
		</RenderDebugFrame>
	);
}

function getWarningToneLabel(tone: ContentHealthTone): string {
	if (tone === "danger") {
		return "Error";
	}

	if (tone === "warning") {
		return "Warning";
	}

	if (tone === "good") {
		return "Good";
	}

	return "Note";
}

function PreviewWarnings({
	warnings,
	debugEnabled,
}: {
	warnings: ContentPreviewWarning[];
	debugEnabled: boolean;
}): JSX.Element {
	return (
		<RenderDebugFrame
			enabled={debugEnabled}
			label="Preview warnings panel"
			description={`${warnings.length} issue item(s)`}
			variant="warnings"
		>
			<SurfaceCard tone="warning" className="admin-preview-warnings">
				<div className="admin-preview-warnings__header">
					<div>
						<p className="admin-preview-warnings__title">Preview warnings</p>
						<p className="admin-preview-warnings__description">
							Possible content, route, access, or media issues found in this preview.
						</p>
					</div>
					<StatusPill tone="warning">{warnings.length} item(s)</StatusPill>
				</div>

				{warnings.length === 0 ? (
					<SurfaceCard tone="success" className="admin-preview-warning-card">
						<p className="admin-preview-warning-card__title">No preview warnings</p>
						<p className="admin-preview-warning-card__description">
							The content has no obvious preview health warnings.
						</p>
					</SurfaceCard>
				) : (
					<div className="admin-preview-warning-list">
						{warnings.map((warning) => (
							<SurfaceCard
								key={warning.id}
								tone={getSurfaceTone(warning.tone)}
								className="admin-preview-warning-card"
							>
								<div className="admin-preview-warning-card__header">
									<StatusPill tone={getSurfaceTone(warning.tone)} size="xs">
										{getWarningToneLabel(warning.tone)}
									</StatusPill>
									<p className="admin-preview-warning-card__title">{warning.label}</p>
								</div>
								<p className="admin-preview-warning-card__description">
									{warning.description}
								</p>
							</SurfaceCard>
						))}
					</div>
				)}
			</SurfaceCard>
		</RenderDebugFrame>
	);
}

function DestinationAnalytics({
	model,
	debugEnabled,
}: {
	model: ContentRenderModel;
	debugEnabled: boolean;
}): JSX.Element {
	const totalFields = model.fields.length;

	return (
		<RenderDebugFrame
			enabled={debugEnabled}
			label="Analytics / Destinations"
			description="Field distribution by destination"
			variant="distribution"
		>
			<SurfaceCard className="admin-preview-analytics-card">
				<h3 className="admin-preview-analytics-card__title">
					Fields by destination
				</h3>
				<div className="admin-preview-analytics-list">
					{DESTINATION_ORDER.map((destination) => (
						<DistributionBar
							key={destination}
							label={DESTINATION_LABELS[destination]}
							count={model.fieldsByDestination[destination].length}
							total={totalFields}
						/>
					))}
				</div>
			</SurfaceCard>
		</RenderDebugFrame>
	);
}

function FieldTypeAnalytics({
	model,
	debugEnabled,
}: {
	model: ContentRenderModel;
	debugEnabled: boolean;
}): JSX.Element {
	const counts = countByLabel(model.fields);
	const totalFields = model.fields.length;

	return (
		<RenderDebugFrame
			enabled={debugEnabled}
			label="Analytics / Field types"
			description="Field distribution by type"
			variant="distribution"
		>
			<SurfaceCard className="admin-preview-analytics-card">
				<h3 className="admin-preview-analytics-card__title">Fields by type</h3>
				{counts.length === 0 ? (
					<p className="admin-preview-empty-note">No template fields were found.</p>
				) : (
					<div className="admin-preview-analytics-list">
						{counts.map((entry) => (
							<DistributionBar
								key={entry.key}
								label={entry.label}
								count={entry.count}
								total={totalFields}
							/>
						))}
					</div>
				)}
			</SurfaceCard>
		</RenderDebugFrame>
	);
}

function RouteAccessDetails({
	preview,
	model,
	debugEnabled,
}: {
	preview: ContentAdminPreview;
	model: ContentRenderModel;
	debugEnabled: boolean;
}): JSX.Element {
	const { doc } = preview;

	return (
		<RenderDebugFrame
			enabled={debugEnabled}
			label="Analytics / Route and access"
			description="Route path and policy summary"
			variant="route"
		>
			<SurfaceCard className="admin-preview-analytics-card">
				<h3 className="admin-preview-analytics-card__title">Route and access</h3>
				<dl className="admin-preview-route-grid">
					<div>
						<dt className="admin-preview-route-term">Direct content path</dt>
						<dd className="admin-preview-route-value admin-preview-route-value--break">
							{model.doc.publicHref ?? "Not available"}
						</dd>
					</div>
					<div>
						<dt className="admin-preview-route-term">Category</dt>
						<dd className="admin-preview-route-value">{doc.categoryTitle}</dd>
					</div>
					<div>
						<dt className="admin-preview-route-term">Subcategory</dt>
						<dd className="admin-preview-route-value">
							{doc.subcategoryTitle ?? "Not set"}
						</dd>
					</div>
					<div>
						<dt className="admin-preview-route-term">Read access</dt>
						<dd className="admin-preview-route-value">
							{formatPolicy(doc.readEffectivePolicyCode, doc.readEffectiveRank)}
						</dd>
					</div>
					<div>
						<dt className="admin-preview-route-term">Write access</dt>
						<dd className="admin-preview-route-value">
							{formatPolicy(doc.writeEffectivePolicyCode, doc.writeEffectiveRank)}
						</dd>
					</div>
					<div>
						<dt className="admin-preview-route-term">Navigation hidden</dt>
						<dd className="admin-preview-route-value">
							{formatBoolean(doc.navHiddenEffective)}
						</dd>
					</div>
				</dl>
			</SurfaceCard>
		</RenderDebugFrame>
	);
}

function FieldInventory({
	model,
	debugEnabled,
}: {
	model: ContentRenderModel;
	debugEnabled: boolean;
}): JSX.Element {
	return (
		<RenderDebugFrame
			enabled={debugEnabled}
			label="Analytics / Field inventory"
			description="Technical field list"
			variant="inventory"
		>
			<details className="admin-preview-field-inventory surface-card surface-card--default surface-card--comfortable">
				<summary className="admin-preview-field-inventory__summary">
					Technical field inventory
				</summary>
				<div className="admin-preview-field-inventory__table-wrap">
					<table className="admin-preview-field-inventory__table">
						<thead>
							<tr className="admin-preview-field-inventory__head-row">
								<th>Field</th>
								<th>Type</th>
								<th>Destination</th>
								<th>Filled</th>
								<th>Order</th>
							</tr>
						</thead>
						<tbody>
							{model.fields.map((field) => (
								<tr key={field.id} className="admin-preview-field-inventory__body-row">
									<td className="admin-preview-field-inventory__field-label">
										{field.label}
									</td>
									<td>{field.fieldTypeCode}</td>
									<td>{DESTINATION_LABELS[field.renderDestinationCode]}</td>
									<td>{hasRenderableValue(field.value) ? "Yes" : "No"}</td>
									<td>{field.displayOrder}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</details>
		</RenderDebugFrame>
	);
}

function PreviewAnalytics({
	preview,
	model,
	debugEnabled,
}: {
	preview: ContentAdminPreview;
	model: ContentRenderModel;
	debugEnabled: boolean;
}): JSX.Element {
	const totalFields = model.fields.length;
	const filledFields = model.fields.filter((field) =>
		hasRenderableValue(field.value),
	).length;
	const requiredMissingFields = getRequiredMissingFields(preview).length;
	const mediaMissingFields = getMediaMissingFields(preview).length;
	const warnings = buildPreviewWarnings({ preview, model });
	const fieldCoverage = getPercent(filledFields, totalFields);

	return (
		<RenderDebugFrame
			enabled={debugEnabled}
			label="Preview analytics"
			description="Health and structure diagnostics"
			variant="page-analytics"
		>
			<section className="card admin-preview-health">
				<div className="admin-preview-health__header">
					<div>
						<p className="admin-preview-health__eyebrow">Preview Analytics</p>
						<h2 className="admin-preview-section-title">
							Content health and structure
						</h2>
					</div>
					<p className="admin-preview-health__description">
						These checks are admin-only diagnostics. They do not replace DB access
						checks or public route resolution.
					</p>
				</div>

				<div className="admin-preview-metric-grid">
					<MetricCard
						label="Field coverage"
						value={`${fieldCoverage}%`}
						description={`${filledFields} of ${totalFields} fields filled`}
						tone={
							fieldCoverage >= 70 ? "good" : fieldCoverage >= 35 ? "warning" : "danger"
						}
						debugEnabled={debugEnabled}
					/>
					<MetricCard
						label="Warnings"
						value={String(warnings.length)}
						description="Preview health notes"
						tone={warnings.length === 0 ? "good" : "warning"}
						debugEnabled={debugEnabled}
					/>
					<MetricCard
						label="Required missing"
						value={String(requiredMissingFields)}
						description="Required template fields without values"
						tone={requiredMissingFields === 0 ? "good" : "danger"}
						debugEnabled={debugEnabled}
					/>
					<MetricCard
						label="Media gaps"
						value={String(mediaMissingFields)}
						description="Media ids without resolved metadata"
						tone={mediaMissingFields === 0 ? "good" : "warning"}
						debugEnabled={debugEnabled}
					/>
				</div>

				<div className="admin-preview-analytics-layout">
					<RenderDebugFrame
						enabled={debugEnabled}
						label="Analytics main column"
						description="Route and structural charts"
						variant="page-analytics"
					>
						<div className="admin-preview-analytics-stack">
							<RouteAccessDetails
								preview={preview}
								model={model}
								debugEnabled={debugEnabled}
							/>
							<div className="admin-preview-distribution-grid">
								<DestinationAnalytics model={model} debugEnabled={debugEnabled} />
								<FieldTypeAnalytics model={model} debugEnabled={debugEnabled} />
							</div>
							<FieldInventory model={model} debugEnabled={debugEnabled} />
						</div>
					</RenderDebugFrame>

					<RenderDebugFrame
						enabled={debugEnabled}
						label="Analytics side column"
						description="Warnings area"
						variant="page-analytics"
					>
						<aside className="admin-preview-warnings-aside">
							<PreviewWarnings warnings={warnings} debugEnabled={debugEnabled} />
						</aside>
					</RenderDebugFrame>
				</div>
			</section>
		</RenderDebugFrame>
	);
}

function ContentShowLoaded({
	preview,
	debugEnabled,
}: {
	preview: ContentAdminPreview;
	debugEnabled: boolean;
}): JSX.Element {
	const model = createAdminContentRenderModel(preview);

	return (
		<RenderDebugFrame
			enabled={debugEnabled}
			label="Admin preview page"
			description="Preview flow and diagnostics"
			variant="page"
		>
			<div className="admin-preview-analytics-stack">
				{debugEnabled ? <PreviewDebugLegend /> : null}
				<PreviewHero preview={preview} model={model} debugEnabled={debugEnabled} />
				<PreviewSeparator />
				<RenderedPreview model={model} debugEnabled={debugEnabled} />
				<PreviewSeparator />
				<PreviewAnalytics
					preview={preview}
					model={model}
					debugEnabled={debugEnabled}
				/>
			</div>
		</RenderDebugFrame>
	);
}

export default async function ContentShowPage({
	params,
	searchParams,
}: ContentShowPageProps): Promise<JSX.Element> {
	const guard = await requireAdminOrEditor();
	if (!guard.allowed) {
		if (guard.reason === "not-authenticated") {
			return (
				<div className="admin-guard-shell">
					<h1 className="admin-guard-title">Content Preview</h1>
					<p className="admin-guard-message">
						You need to sign in to access the admin area.
					</p>
					<Link href="/login" className="admin-guard-link">
						Go to login
					</Link>
				</div>
			);
		}

		return (
			<div className="admin-guard-shell">
				<h1 className="admin-guard-title">Content Preview</h1>
				<p className="admin-guard-message">Admin or editor access is required.</p>
				<ButtonLink href="/admin" variant="secondary">
					Go back
				</ButtonLink>
			</div>
		);
	}

	const resolvedSearchParams: Record<string, SearchParamValue> = searchParams
		? await searchParams
		: {};
	const debugEnabled = getPreviewDebugEnabled(resolvedSearchParams);
	const resolvedParams = await params;
	const contentId = parsePositiveInt(resolvedParams.id);
	if (!contentId) {
		return (
			<section className="card admin-state-card">
				<h1 className="admin-page-card-title">Content not found</h1>
				<p className="admin-preview-state-message">
					The content id in the URL is invalid.
				</p>
				<div>
					<ButtonLink href="/admin/web/content" variant="secondary">
						Back to content
					</ButtonLink>
				</div>
			</section>
		);
	}

	const preview = await findContentAdminPreviewById(contentId);
	if (!preview) {
		return (
			<section className="card admin-state-card">
				<h1 className="admin-page-card-title">Content not found</h1>
				<p className="admin-preview-state-message">
					No content exists for id {contentId}.
				</p>
				<div>
					<ButtonLink href="/admin/web/content" variant="secondary">
						Back to content
					</ButtonLink>
				</div>
			</section>
		);
	}

	return <ContentShowLoaded preview={preview} debugEnabled={debugEnabled} />;
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
