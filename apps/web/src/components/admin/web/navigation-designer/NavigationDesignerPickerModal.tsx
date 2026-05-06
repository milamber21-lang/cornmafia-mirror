//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/web/navigation-designer/NavigationDesignerPickerModal.tsx                ////
//// Language: TSX                                                                                              ////
//// Shared modal shell for navigation designer picker dialogs.                                                  ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

"use client";

import type { JSX, ReactNode } from "react";
import { useEffect } from "react";

import { Button } from "@/components/ui";

export interface NavigationDesignerPickerModalProps {
	open: boolean;
	title: string;
	onClose: () => void;
	children: ReactNode;
}

export default function NavigationDesignerPickerModal({
	open,
	title,
	onClose,
	children,
}: NavigationDesignerPickerModalProps): JSX.Element | null {
	useEffect(() => {
		if (!open) {
			return;
		}

		const handleKeyDown = (event: KeyboardEvent): void => {
			if (event.key !== "Escape") {
				return;
			}

			event.preventDefault();
			event.stopPropagation();
			event.stopImmediatePropagation();
			onClose();
		};

		document.addEventListener("keydown", handleKeyDown, true);
		return () => document.removeEventListener("keydown", handleKeyDown, true);
	}, [onClose, open]);

	if (!open) {
		return null;
	}

	return (
		<div
			role="dialog"
			aria-modal="true"
			className="admin-picker-modal"
		>
			<button
				type="button"
				aria-label="Close picker"
				className="admin-picker-modal__backdrop"
				onClick={onClose}
			/>
			<div className="admin-picker-modal__surface">
				<div className="admin-picker-modal__header">
					<h3 className="admin-picker-modal__title">{title}</h3>
				</div>
				<div className="admin-picker-modal__body">{children}</div>
				<div className="admin-picker-modal__footer">
					<Button variant="accent" size="sm" type="button" onClick={onClose}>
						Close
					</Button>
				</div>
			</div>
		</div>
	);
}
