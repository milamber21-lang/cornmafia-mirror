//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/renderers/content/ContentFieldFrame.tsx                                        ////
//// Language: TSX                                                                                                ////
//// Wraps rendered content field values with template-controlled label display behavior.                         ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { JSX, ReactNode } from "react";

import type { ContentRenderField, ContentRenderLabelStyleCode } from "./types";

type ContentFieldFrameProps = {
	field: ContentRenderField;
	showLabel?: boolean;
	children: ReactNode;
	className?: string;
	valueTextClassName?: string;
};

function compactClassName(parts: string[]): string {
	return parts
		.map((part) => part.trim())
		.filter((part) => part.length > 0)
		.join(" ");
}

function labelSeparatorText(field: ContentRenderField): string | null {
	if (field.labelSeparatorCode === "none") {
		return null;
	}

	return field.labelSeparatorCode === "dash" ? "-" : ":";
}

function labelWithSeparator(field: ContentRenderField): string {
	const separator = labelSeparatorText(field);
	return separator ? `${field.label}${separator}` : field.label;
}

function labelTextClassName(args: {
	labelStyleCode: ContentRenderLabelStyleCode;
	valueTextClassName: string;
}): string {
	if (args.labelStyleCode === "label") {
		return compactClassName([
			args.valueTextClassName,
			"content-field-label--semibold",
		]);
	}

	if (args.labelStyleCode === "muted") {
		return compactClassName([
			args.valueTextClassName,
			"content-field-label--muted",
		]);
	}

	return args.valueTextClassName;
}

export default function ContentFieldFrame({
	field,
	showLabel = true,
	children,
	className = "content-field-frame",
	valueTextClassName = "content-field-value",
}: ContentFieldFrameProps): JSX.Element {
	const shouldRenderLabel = showLabel && field.showLabel && field.label.trim().length > 0;
	if (!shouldRenderLabel) {
		return <section className={className}>{children}</section>;
	}

	if (field.labelStyleCode === "title") {
		return (
			<section className={className}>
				<h2 className="content-field-title-label">
					{labelWithSeparator(field)}
				</h2>
				{children}
			</section>
		);
	}

	const resolvedLabelClassName = labelTextClassName({
		labelStyleCode: field.labelStyleCode,
		valueTextClassName,
	});

	if (field.labelPositionCode === "inline") {
		const separator = labelSeparatorText(field);

		return (
			<section className={className}>
				<div className="content-field-inline-row">
					<span className={resolvedLabelClassName}>{field.label}</span>
					{separator ? (
						<span aria-hidden="true" className={valueTextClassName}>
							{separator}
						</span>
					) : null}
					<div className="content-field-inline-value">{children}</div>
				</div>
			</section>
		);
	}

	return (
		<section className={className}>
			<div className={resolvedLabelClassName}>{labelWithSeparator(field)}</div>
			{children}
		</section>
	);
}
