//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/ui/basic-elements/Upload.tsx                                                   ////
//// Language: TSX                                                                                                ////
//// Upload control with centered shared FilePreview rendering for selected files                                 ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

"use client";

import * as React from "react";

import { Button } from "@/components/ui/basic-elements/Button";
import FilePreview from "@/components/ui/basic-elements/FilePreview";
import { cn } from "@/lib/cn";

type Props = {
	onFilesSelected: (files: File[]) => void;
	accept?: string;
	multiple?: boolean;
	disabled?: boolean;
	title?: string;
	description?: string;
	buttonText?: string;
	ariaLabel?: string;
	selected?: File | File[] | null;
	showPreview?: boolean;
	className?: string;
};

export default function Upload({
	onFilesSelected,
	accept,
	multiple = false,
	disabled = false,
	title = "Upload file",
	description = "Drag & drop files here, or click to browse.",
	buttonText = "Choose file",
	ariaLabel = "File upload",
	selected,
	showPreview = true,
	className,
}: Props): React.JSX.Element {
	const inputRef = React.useRef<HTMLInputElement | null>(null);
	const [isDragging, setIsDragging] = React.useState(false);
	const [localFiles, setLocalFiles] = React.useState<File[]>([]);

	const isControlled = selected !== undefined;
	const files = React.useMemo(() => {
		if (isControlled) {
			if (!selected) {
				return [];
			}

			return Array.isArray(selected) ? selected : [selected];
		}

		return localFiles;
	}, [isControlled, localFiles, selected]);

	function pickFiles(): void {
		if (disabled) {
			return;
		}

		inputRef.current?.click();
	}

	function applySelection(nextFiles: File[]): void {
		const resolvedFiles =
			!multiple && nextFiles.length > 1 ? nextFiles.slice(0, 1) : nextFiles;

		if (!isControlled) {
			setLocalFiles(resolvedFiles);
		}

		onFilesSelected(resolvedFiles);
	}

	function handleInputChange(event: React.ChangeEvent<HTMLInputElement>): void {
		if (disabled) {
			return;
		}

		applySelection(Array.from(event.currentTarget.files ?? []));
		event.currentTarget.value = "";
	}

	function handleDrop(event: React.DragEvent<HTMLDivElement>): void {
		event.preventDefault();
		event.stopPropagation();
		setIsDragging(false);

		if (disabled) {
			return;
		}

		applySelection(Array.from(event.dataTransfer?.files ?? []));
	}

	function handleDragOver(event: React.DragEvent<HTMLDivElement>): void {
		event.preventDefault();

		if (!disabled) {
			setIsDragging(true);
		}
	}

	function handleDragLeave(event: React.DragEvent<HTMLDivElement>): void {
		event.preventDefault();
		setIsDragging(false);
	}

	const hasSelection = files.length > 0;
	const previewWidth = multiple ? 220 : 320;

	return (
		<div className="ui-upload">
			<div
				role="group"
				aria-label={ariaLabel}
				className={cn(
					"ui-upload__dropzone",
					disabled && "ui-upload__dropzone--disabled",
					isDragging && "ui-upload__dropzone--dragging",
					className,
				)}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}
				onClick={(event) => {
					if (disabled) {
						return;
					}

					const target = event.target as HTMLElement;
					if (
						target.tagName !== "BUTTON" &&
						target.getAttribute("role") !== "button"
					) {
						pickFiles();
					}
				}}
			>
				<div className="ui-upload__content">
					<div className="ui-upload__main">
						<span aria-hidden="true" className="ui-upload__icon">
							<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
								<path
									d="M12 16V7m0 0l-4 4m4-4l4 4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
									fill="none"
									stroke="currentColor"
									strokeWidth="1.8"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
						</span>

						<div className="ui-upload__copy">
							<div className="ui-upload__title">{title}</div>
							<div className="ui-upload__description">
								{hasSelection
									? multiple
										? `${files.length} file${files.length > 1 ? "s" : ""} selected`
										: files[0]?.name || description
									: description}
							</div>
						</div>
					</div>

					<div className="ui-upload__actions">
						<Button
							type="button"
							size="md"
							variant="secondary"
							onClick={pickFiles}
							disabled={disabled}
						>
							{buttonText}
						</Button>
					</div>
				</div>

				<input
					ref={inputRef}
					type="file"
					accept={accept}
					multiple={multiple}
					onChange={handleInputChange}
					disabled={disabled}
					className="ui-upload__input"
					tabIndex={-1}
				/>
			</div>

			{hasSelection && showPreview ? (
				<div className="media-preview-list media-preview-list--centered">
					{files.map((currentFile, index) => (
						<FilePreview
							key={`${currentFile.name}-${currentFile.size}-${index}`}
							file={currentFile}
							filename={currentFile.name}
							mimeType={currentFile.type}
							sizeBytes={currentFile.size}
							alt={currentFile.name}
							width={previewWidth}
							showMeta
						/>
					))}
				</div>
			) : null}
		</div>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
