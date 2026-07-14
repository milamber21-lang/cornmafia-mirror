//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/FooterExploreMenu.tsx                                                          ////
//// Language: TSX                                                                                                ////
//// Hover, focus, and click-open footer Explore popover for DB-driven footer navigation links.                    ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import {
	useCallback,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from "react";

import IconRender from "@/components/ui/IconRender";
import type {
	PublicMenuIcon,
	PublicMenuIconColor,
	PublicMenuModel,
} from "@/lib/data/public-navigation";

type FooterExploreLink = {
	id: string;
	title: string;
	href: string;
	iconKey: PublicMenuIcon;
	iconColor: PublicMenuIconColor;
	isExternal: boolean;
	target: string | null;
	rel: string | null;
};

type FooterExploreGroup = {
	id: string;
	title: string;
	seeAllHref: string;
	links: FooterExploreLink[];
};

type FooterExploreMenuProps = {
	model: PublicMenuModel;
};

const FOOTER_MENU_HIDE_DELAY_MS = 130;

function buildGroups(model: PublicMenuModel): FooterExploreGroup[] {
	return model.flatMap((category) =>
		category.columns.map((column) => ({
			id: `${category.id}::${column.id}`,
			title: column.title,
			seeAllHref: column.seeAllHref,
			links: column.pages.map((page) => ({
				id: page.id,
				title: page.title,
				href: page.href,
				iconKey: page.iconKey,
				iconColor: page.iconColor,
				isExternal: page.isExternal,
				target: page.target,
				rel: page.rel,
			})),
		})),
	);
}

function getTriggerLabel(model: PublicMenuModel): string {
	const firstCategoryTitle = model[0]?.title.trim();
	return firstCategoryTitle && firstCategoryTitle.length > 0
		? firstCategoryTitle
		: "Explore";
}

export default function FooterExploreMenu({ model }: FooterExploreMenuProps) {
	const popoverId = useId();
	const menuRef = useRef<HTMLDivElement | null>(null);
	const hideTimerRef = useRef<number | null>(null);
	const [open, setOpen] = useState(false);

	const groups = useMemo(() => buildGroups(model), [model]);
	const triggerLabel = useMemo(() => getTriggerLabel(model), [model]);
	const hasMenu = groups.some(
		(group) => group.links.length > 0 || group.seeAllHref.length > 0,
	);

	const clearHideTimer = useCallback((): void => {
		if (hideTimerRef.current !== null) {
			window.clearTimeout(hideTimerRef.current);
			hideTimerRef.current = null;
		}
	}, []);

	const openMenu = useCallback((): void => {
		clearHideTimer();
		setOpen(true);
	}, [clearHideTimer]);

	const closeMenu = useCallback((): void => {
		clearHideTimer();
		setOpen(false);
	}, [clearHideTimer]);

	const scheduleCloseMenu = useCallback((): void => {
		clearHideTimer();
		hideTimerRef.current = window.setTimeout(
			() => setOpen(false),
			FOOTER_MENU_HIDE_DELAY_MS,
		);
	}, [clearHideTimer]);

	useEffect(() => {
		return () => {
			if (hideTimerRef.current !== null) {
				window.clearTimeout(hideTimerRef.current);
			}
		};
	}, []);

	useEffect(() => {
		if (!open) {
			return;
		}

		function handlePointerDown(event: PointerEvent): void {
			const target = event.target;
			if (!(target instanceof Node)) {
				return;
			}

			if (!menuRef.current?.contains(target)) {
				closeMenu();
			}
		}

		function handleKeyDown(event: KeyboardEvent): void {
			if (event.key === "Escape") {
				closeMenu();
			}
		}

		document.addEventListener("pointerdown", handlePointerDown);
		document.addEventListener("keydown", handleKeyDown);

		return () => {
			document.removeEventListener("pointerdown", handlePointerDown);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [closeMenu, open]);

	if (!hasMenu) {
		return (
			<div className="footer-explore footer-explore--empty" aria-hidden="true" />
		);
	}

	return (
		<div
			ref={menuRef}
			className="footer-explore"
			onMouseEnter={openMenu}
			onMouseLeave={scheduleCloseMenu}
			onFocus={openMenu}
			onBlur={(event) => {
				const nextTarget = event.relatedTarget;
				if (nextTarget instanceof Node && menuRef.current?.contains(nextTarget)) {
					return;
				}
				scheduleCloseMenu();
			}}
		>
			<button
				type="button"
				className={`footer-explore-button${open ? " is-open" : ""}`}
				onClick={() => setOpen((current) => !current)}
				aria-controls={popoverId}
				aria-expanded={open}
			>
				<span>{triggerLabel}</span>
				<ChevronDown size={15} className="footer-explore-chevron" aria-hidden />
			</button>

			{open ? (
				<nav
					id={popoverId}
					className="footer-explore-panel"
					aria-label={`${triggerLabel} footer links`}
				>
					<div className="footer-explore-grid">
						{groups.map((group) => (
							<section className="footer-explore-group" key={group.id}>
								{group.seeAllHref.length > 0 ? (
									<Link
										className="footer-explore-title"
										href={group.seeAllHref}
										onClick={closeMenu}
									>
										{group.title}
									</Link>
								) : (
									<span className="footer-explore-title">{group.title}</span>
								)}
								{group.links.length > 0 ? (
									<ul className="footer-explore-links">
										{group.links.map((link) => (
											<li key={`${group.id}::${link.id}::${link.href}::${link.title}`}>
												{link.isExternal ? (
													<a
														href={link.href}
														target={link.target ?? undefined}
														rel={link.rel ?? undefined}
														onClick={closeMenu}
													>
														<IconRender
															iconKey={link.iconKey}
															iconColor={link.iconColor}
															relationHint="pages"
															size={14}
															className="footer-explore-link-icon"
														/>
														<span>{link.title}</span>
													</a>
												) : (
													<Link href={link.href} onClick={closeMenu}>
														<IconRender
															iconKey={link.iconKey}
															iconColor={link.iconColor}
															relationHint="pages"
															size={14}
															className="footer-explore-link-icon"
														/>
														<span>{link.title}</span>
													</Link>
												)}
											</li>
										))}
									</ul>
								) : null}
							</section>
						))}
					</div>
				</nav>
			) : null}
		</div>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
