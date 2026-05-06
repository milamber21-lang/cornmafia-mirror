//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/client/confirm-dialog.tsx                                                            ////
//// Language: TSX                                                                                               ////
//// Imperative client confirmation and notice dialog helpers used instead of browser dialogs.                    ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
"use client";

import * as React from "react";
import { createRoot } from "react-dom/client";

import { Button } from "@/components/ui/basic-elements/Button";

export type ConfirmDialogOptions = {
	title: string;
	message: React.ReactNode;
	confirmLabel?: string;
	cancelLabel?: string;
	destructive?: boolean;
};

type ConfirmDialogHostProps = {
	options: ConfirmDialogOptions;
	onResolve: (value: boolean) => void;
};

function ConfirmDialogHost({
	options,
	onResolve,
}: ConfirmDialogHostProps): React.JSX.Element {
	const cancelLabel = options.cancelLabel ?? "Cancel";
	const confirmLabel = options.confirmLabel ?? "Confirm";

	React.useEffect(() => {
		function handleKeyDown(event: KeyboardEvent): void {
			if (event.key === "Escape") {
				event.preventDefault();
				onResolve(false);
			}
		}

		document.addEventListener("keydown", handleKeyDown, true);
		return () => {
			document.removeEventListener("keydown", handleKeyDown, true);
		};
	}, [onResolve]);

	return (
		<div
			className="ui-confirm-dialog-backdrop"
			role="presentation"
			onMouseDown={() => onResolve(false)}
		>
			<div
				role="dialog"
				aria-modal="true"
				aria-label={options.title}
				className="ui-confirm-dialog"
				onMouseDown={(event) => event.stopPropagation()}
			>
				<div className="ui-confirm-dialog__header">
					<h2 className="ui-confirm-dialog__title">
						{options.title}
					</h2>
				</div>

				<div className="ui-confirm-dialog__body">
					{options.message}
				</div>

				<div className="ui-confirm-dialog__footer">
					<Button type="button" variant="neutral" onClick={() => onResolve(false)}>
						{cancelLabel}
					</Button>
					<Button
						type="button"
						variant={options.destructive ? "accent" : "green"}
						onClick={() => onResolve(true)}
					>
						{confirmLabel}
					</Button>
				</div>
			</div>
		</div>
	);
}

export function confirmAction(options: ConfirmDialogOptions): Promise<boolean> {
	if (typeof document === "undefined") {
		return Promise.resolve(false);
	}

	return new Promise<boolean>((resolve) => {
		const container = document.createElement("div");
		document.body.appendChild(container);

		const root = createRoot(container);
		let resolved = false;

		function finish(value: boolean): void {
			if (resolved) {
				return;
			}

			resolved = true;
			root.unmount();
			container.remove();
			resolve(value);
		}

		root.render(<ConfirmDialogHost options={options} onResolve={finish} />);
	});
}

export function showClientNotice(options: {
	title: string;
	message: React.ReactNode;
	confirmLabel?: string;
}): Promise<void> {
	return confirmAction({
		title: options.title,
		message: options.message,
		confirmLabel: options.confirmLabel ?? "OK",
		cancelLabel: "Close",
	}).then(() => undefined);
}
