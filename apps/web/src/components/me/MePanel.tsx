//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/me/MePanel.tsx                                                                ////
//// Language: TSX                                                                                               ////
//// DB-first member profile popup with shared UI form primitives and CSS theme style selection.                  ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
"use client";

import * as React from "react";

import {
	AlertBanner,
	Button,
	DropdownMenuSingle,
	FieldError,
	Input,
	Label,
	Textarea,
} from "@/components/ui";

type ThemeStyleCode = "dark" | "light" | "vintage";

type SavePayload = {
	gameUsername: string | null;
	alias: string | null;
	themeStyleCode: ThemeStyleCode;
	notes: string | null;
};

type ThemeLike =
	| null
	| string
	| {
			id?: unknown;
			key?: unknown;
			label?: unknown;
			themeName?: unknown;
			className?: unknown;
			preview?: unknown;
	  };

type ThemeOption = {
	value: ThemeStyleCode;
	label: string;
	className: string;
};

export interface MePanelProps {
	open: boolean;
	onClose: () => void;
	initial: {
		gameUsername: string | null;
		alias: string | null;
		theme: ThemeLike;
		notes: string | null;
	} | null;
	onSaved?: () => void;
}

const DEFAULT_THEME_STYLE_CODE: ThemeStyleCode = "vintage";
const THEME_CLASSES = ["cm-dark", "cm-light", "cm-vintage"];

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isThemeStyleCode(value: string): value is ThemeStyleCode {
	return value === "dark" || value === "light" || value === "vintage";
}

function normalizeThemeStyleCode(value: unknown): ThemeStyleCode {
	if (typeof value !== "string") {
		return DEFAULT_THEME_STYLE_CODE;
	}

	const normalized = value.trim().toLowerCase();
	return isThemeStyleCode(normalized) ? normalized : DEFAULT_THEME_STYLE_CODE;
}

function getThemeStyleCode(theme: ThemeLike): ThemeStyleCode {
	if (theme === null) {
		return DEFAULT_THEME_STYLE_CODE;
	}

	if (typeof theme === "string") {
		return normalizeThemeStyleCode(theme);
	}

	return normalizeThemeStyleCode(theme.key ?? theme.id);
}

function getThemeLabel(theme: ThemeLike): string {
	if (theme === null) {
		return "Vintage";
	}

	if (typeof theme === "string") {
		return theme;
	}

	const label = theme.label ?? theme.themeName ?? theme.key ?? theme.id;
	return typeof label === "string" || typeof label === "number"
		? String(label)
		: "Vintage";
}

function normalizeInput(value: string): string | null {
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
}

function readErrorMessage(payload: unknown, fallback: string): string {
	if (!isRecord(payload)) {
		return fallback;
	}

	const error = payload.error ?? payload.message;
	return typeof error === "string" && error.trim().length > 0
		? error.trim()
		: fallback;
}

function readOptions(payload: unknown): ThemeOption[] {
	if (!isRecord(payload) || !Array.isArray(payload.options)) {
		return [];
	}

	const options: ThemeOption[] = [];
	for (const option of payload.options) {
		if (!isRecord(option)) {
			continue;
		}

		const value = option.value;
		const label = option.label;
		const className = option.className;
		if (typeof value !== "string" || typeof label !== "string") {
			continue;
		}

		const themeStyleCode = normalizeThemeStyleCode(value);
		options.push({
			value: themeStyleCode,
			label,
			className: typeof className === "string" ? className : `cm-${themeStyleCode}`,
		});
	}

	return options;
}

function mergeThemeOptions(
	current: ThemeOption[],
	incoming: ThemeOption[],
): ThemeOption[] {
	const seen = new Set<ThemeStyleCode>();
	const merged: ThemeOption[] = [];

	for (const option of [...current, ...incoming]) {
		if (seen.has(option.value)) {
			continue;
		}
		seen.add(option.value);
		merged.push(option);
	}

	return merged;
}

function applyThemeStyleCode(themeStyleCode: ThemeStyleCode): void {
	document.documentElement.classList.remove(...THEME_CLASSES);
	document.documentElement.classList.add(`cm-${themeStyleCode}`);
}

function stopEscapeAtSource(event: KeyboardEvent): void {
	event.preventDefault();
	event.stopPropagation();
	event.stopImmediatePropagation();
}

export default function MePanel({
	open,
	onClose,
	initial,
	onSaved,
}: MePanelProps) {
	const formId = React.useId();
	const [gameUsername, setGameUsername] = React.useState("");
	const [alias, setAlias] = React.useState("");
	const [themeStyleCode, setThemeStyleCode] = React.useState<ThemeStyleCode>(
		DEFAULT_THEME_STYLE_CODE,
	);
	const [notes, setNotes] = React.useState("");
	const [themeOptions, setThemeOptions] = React.useState<ThemeOption[]>([]);
	const [metaLoading, setMetaLoading] = React.useState(false);
	const [submitting, setSubmitting] = React.useState(false);
	const [topError, setTopError] = React.useState("");
	const [metaError, setMetaError] = React.useState("");

	React.useEffect(() => {
		if (!open) {
			return;
		}

		const initialThemeStyleCode = getThemeStyleCode(initial?.theme ?? null);
		const initialThemeLabel = getThemeLabel(initial?.theme ?? null);

		setGameUsername(initial?.gameUsername ?? "");
		setAlias(initial?.alias ?? "");
		setThemeStyleCode(initialThemeStyleCode);
		setNotes(initial?.notes ?? "");
		setTopError("");
		setMetaError("");
		setThemeOptions([
			{
				value: initialThemeStyleCode,
				label: initialThemeLabel || initialThemeStyleCode,
				className: `cm-${initialThemeStyleCode}`,
			},
		]);
	}, [initial, open]);

	React.useEffect(() => {
		if (!open) {
			return;
		}

		let cancelled = false;
		setMetaLoading(true);
		setMetaError("");

		fetch("/api/me/themes", { method: "GET", cache: "no-store" })
			.then(async (response) => {
				const payload = (await response.json()) as unknown;
				if (!response.ok) {
					throw new Error(readErrorMessage(payload, "Failed to load themes."));
				}
				return readOptions(payload);
			})
			.then((options) => {
				if (!cancelled) {
					setThemeOptions((current) => mergeThemeOptions(current, options));
				}
			})
			.catch((loadError: unknown) => {
				if (!cancelled) {
					setMetaError(
						loadError instanceof Error
							? loadError.message
							: "Failed to load themes.",
					);
				}
			})
			.finally(() => {
				if (!cancelled) {
					setMetaLoading(false);
				}
			});

		return () => {
			cancelled = true;
		};
	}, [open]);

	React.useEffect(() => {
		if (!open) {
			return;
		}

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key !== "Escape") {
				return;
			}

			stopEscapeAtSource(event);
			if (!submitting) {
				onClose();
			}
		};

		document.addEventListener("keydown", onKeyDown, true);
		return () => document.removeEventListener("keydown", onKeyDown, true);
	}, [onClose, open, submitting]);

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setSubmitting(true);
		setTopError("");

		const payload: SavePayload = {
			gameUsername: normalizeInput(gameUsername),
			alias: normalizeInput(alias),
			themeStyleCode,
			notes: normalizeInput(notes),
		};

		try {
			const response = await fetch("/api/me", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			const responsePayload = (await response.json()) as unknown;

			if (!response.ok) {
				throw new Error(
					readErrorMessage(responsePayload, "Failed to update profile."),
				);
			}

			applyThemeStyleCode(themeStyleCode);
			onSaved?.();
			onClose();
		} catch (submitError: unknown) {
			setTopError(
				submitError instanceof Error
					? submitError.message
					: "Failed to update profile.",
			);
		} finally {
			setSubmitting(false);
		}
	}

	if (!open) {
		return null;
	}

	return (
		<div
			className="member-profile-popup"
			role="presentation"
			onMouseDown={(event) => {
				if (event.target === event.currentTarget && !submitting) {
					onClose();
				}
			}}
		>
			<section
				className="member-profile-popup__surface"
				role="dialog"
				aria-modal="true"
				aria-labelledby={`${formId}-title`}
				onMouseDown={(event) => event.stopPropagation()}
			>
				<header className="member-profile-popup__header">
					<h2 id={`${formId}-title`} className="member-profile-popup__title">
						Edit profile
					</h2>
				</header>

				<form
					id={formId}
					onSubmit={handleSubmit}
					className="member-profile-popup__form"
				>
					<div className="member-profile-popup__body">
						{topError ? (
							<AlertBanner tone="error" autoHideMs={0}>
								{topError}
							</AlertBanner>
						) : null}

						<div className="member-profile-popup__field-grid">
							<div className="member-profile-popup__field">
								<Label htmlFor={`${formId}-game-username`}>Game username</Label>
								<Input
									id={`${formId}-game-username`}
									value={gameUsername}
									onChange={(event) => setGameUsername(event.target.value)}
									disabled={submitting}
									autoComplete="off"
								/>
							</div>

							<div className="member-profile-popup__field">
								<Label htmlFor={`${formId}-alias`}>Alias</Label>
								<Input
									id={`${formId}-alias`}
									value={alias}
									onChange={(event) => setAlias(event.target.value)}
									disabled={submitting}
									autoComplete="nickname"
								/>
							</div>

							<div className="member-profile-popup__field member-profile-popup__field--full">
								<Label>Site theme</Label>
								<DropdownMenuSingle
									options={themeOptions}
									value={themeStyleCode}
									onChange={(value) =>
										setThemeStyleCode(normalizeThemeStyleCode(value))
									}
									placeholder={metaLoading ? "Loading themes..." : "Select theme"}
									disabled={
										submitting || (metaLoading && themeOptions.length === 0)
									}
									ariaLabel="Site theme"
									className="member-control-full"
								/>
								{metaLoading ? (
									<span className="member-profile-popup__help">
										Loading theme choices...
									</span>
								) : null}
								<FieldError message={metaError} />
							</div>

							<div className="member-profile-popup__field member-profile-popup__field--full">
								<Label htmlFor={`${formId}-notes`}>Notes</Label>
								<Textarea
									id={`${formId}-notes`}
									value={notes}
									onChange={(event) => setNotes(event.target.value)}
									disabled={submitting}
									rows={5}
								/>
							</div>
						</div>
					</div>

					<footer className="member-profile-popup__footer">
						<Button
							type="button"
							variant="neutral"
							onClick={onClose}
							disabled={submitting}
						>
							Close
						</Button>
						<Button
							type="submit"
							variant="green"
							disabled={submitting}
							loading={submitting}
						>
							{submitting ? "Saving..." : "Save changes"}
						</Button>
					</footer>
				</form>
			</section>
		</div>
	);
}
