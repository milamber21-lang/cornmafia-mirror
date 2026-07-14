//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/renderers/content/ContentFieldFrame.tsx                                        ////
//// Language: TSX                                                                                                ////
//// Wraps rendered fields with semantic presentation, destination, and label classes for shared public styling.  ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX, ReactNode } from "react";

import { cn } from "@/lib/cn";

import { isUrlLikeField } from "./field-utils";
import type { ContentRenderField, ContentRenderLabelStyleCode } from "./types";

type ContentFieldFrameProps = {
	field: ContentRenderField;
	showLabel?: boolean;
	children: ReactNode;
	className?: string;
	valueTextClassName?: string;
};

type ContentFieldPresentationCode =
	| "prose"
	| "media"
	| "embed"
	| "status"
	| "link"
	| "fact";

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

function fieldPresentationCode(
	field: ContentRenderField,
): ContentFieldPresentationCode {
	if (field.fieldTypeCode === "rich_text") {
		return "prose";
	}

	if (field.fieldTypeCode === "media_id") {
		return "media";
	}

	if (field.fieldTypeCode === "youtube_url") {
		return "embed";
	}

	if (field.fieldTypeCode === "boolean" || field.fieldTypeCode === "option") {
		return "status";
	}

	if (field.fieldTypeCode === "content_id" || isUrlLikeField(field)) {
		return "link";
	}

	return "fact";
}

function frameClassName(args: {
	field: ContentRenderField;
	showLabel: boolean;
	className?: string;
}): string {
	return cn(
		"content-field-frame",
		`content-field-frame--presentation-${fieldPresentationCode(args.field)}`,
		`content-field-frame--destination-${args.field.renderDestinationCode}`,
		args.showLabel
			? "content-field-frame--with-label"
			: "content-field-frame--without-label",
		args.showLabel && `content-field-frame--label-${args.field.labelStyleCode}`,
		args.showLabel &&
			`content-field-frame--label-position-${args.field.labelPositionCode}`,
		args.className,
	);
}

export default function ContentFieldFrame({
	field,
	showLabel = true,
	children,
	className,
	valueTextClassName = "content-field-value",
}: ContentFieldFrameProps): JSX.Element {
	const shouldRenderLabel =
		showLabel && field.showLabel && field.label.trim().length > 0;
	const resolvedClassName = frameClassName({
		field,
		showLabel: shouldRenderLabel,
		className,
	});

	if (!shouldRenderLabel) {
		return <section className={resolvedClassName}>{children}</section>;
	}

	if (field.labelStyleCode === "title") {
		return (
			<section className={resolvedClassName}>
				<h2 className="content-field-title-label">{labelWithSeparator(field)}</h2>
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
			<section className={resolvedClassName}>
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
		<section className={resolvedClassName}>
			<div className={resolvedLabelClassName}>{labelWithSeparator(field)}</div>
			{children}
		</section>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
