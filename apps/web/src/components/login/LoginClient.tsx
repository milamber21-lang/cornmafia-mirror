//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/login/LoginClient.tsx                                                          ////
//// Language: TSX                                                                                                ////
//// Session avatar and user menu for shared login surfaces                                                       ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
"use client";

import type { JSX } from "react";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { Session } from "next-auth";
import { signIn, signOut } from "next-auth/react";

import { Button, ButtonLink } from "@/components/ui";

type LoginClientProps = {
	session: Session | null;
	canAccessAdmin?: boolean;
};

type SignedInMenuProps = {
	name: string;
	image: string | null;
	canAccessAdmin?: boolean;
};

function isHttpUrl(value: string | null | undefined): boolean {
	if (!value || typeof value !== "string") {
		return false;
	}

	try {
		const url = new URL(value);
		return url.protocol === "http:" || url.protocol === "https:";
	} catch {
		return false;
	}
}

function SignedOutButton(): JSX.Element {
	return (
		<Button
			size="md"
			variant="accent"
			onClick={() => signIn("discord", { callbackUrl: "/" })}
			aria-label="Log-in with Discord"
		>
			Log-in Discord
		</Button>
	);
}

function initials(name?: string | null): string {
	if (!name) {
		return "U";
	}

	const parts = name.trim().split(/\s+/);
	const firstInitial = parts[0]?.[0] ?? "";
	const lastInitial = parts.length > 1 ? parts[parts.length - 1][0] : "";

	return (firstInitial + lastInitial || firstInitial).toUpperCase();
}

function SignedInMenu({
	name,
	image,
	canAccessAdmin,
}: SignedInMenuProps): JSX.Element {
	const [open, setOpen] = useState(false);
	const [imageOk, setImageOk] = useState(true);
	const popoverRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (!open) {
			return undefined;
		}

		const handleDocumentMouseDown = (event: MouseEvent): void => {
			if (!popoverRef.current) {
				return;
			}

			if (!popoverRef.current.contains(event.target as Node)) {
				setOpen(false);
			}
		};

		document.addEventListener("mousedown", handleDocumentMouseDown);

		return () => {
			document.removeEventListener("mousedown", handleDocumentMouseDown);
		};
	}, [open]);

	const avatarSrc = isHttpUrl(image) ? image : null;

	return (
		<div className="header-avatar-menu" ref={popoverRef}>
			<button
				type="button"
				onClick={() => setOpen((currentValue) => !currentValue)}
				className="header-avatar-button"
				aria-haspopup="menu"
				aria-expanded={open}
				aria-label="User menu"
			>
				<div className="header-avatar-frame">
					{avatarSrc && imageOk ? (
						<Image
							src={avatarSrc}
							alt={name}
							width={256}
							height={256}
							unoptimized
							onError={() => setImageOk(false)}
							referrerPolicy="no-referrer"
							className="avatar-img header-avatar-image"
							priority={false}
						/>
					) : (
						<div className="avatar-img header-avatar-fallback">
							<span className="header-avatar-fallback-text">{initials(name)}</span>
						</div>
					)}
				</div>
			</button>

			{open ? (
				<div
					role="menu"
					className="header-avatar-panel"
					onMouseDown={(event) => event.preventDefault()}
				>
					<div className="header-avatar-actions">
						<ButtonLink
							size="sm"
							variant="neutral"
							href="/me"
							block
							onClick={() => setOpen(false)}
						>
							Profile
						</ButtonLink>

						{canAccessAdmin ? (
							<ButtonLink
								size="sm"
								variant="neutral"
								href="/admin"
								block
								onClick={() => setOpen(false)}
							>
								Admin
							</ButtonLink>
						) : null}

						<Button
							size="sm"
							variant="accent"
							block
							onClick={() => {
								setOpen(false);
								signOut({ callbackUrl: "/" });
							}}
						>
							Log-out
						</Button>
					</div>
				</div>
			) : null}
		</div>
	);
}

export default function LoginClient({
	session,
	canAccessAdmin,
}: LoginClientProps): JSX.Element {
	const user = session?.user;

	if (!user) {
		return <SignedOutButton />;
	}

	return (
		<SignedInMenu
			name={user.name ?? "User"}
			image={user.image ?? null}
			canAccessAdmin={canAccessAdmin}
		/>
	);
}
