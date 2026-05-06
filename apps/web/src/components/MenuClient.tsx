//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/MenuClient.tsx                                                                  ////
//// Language: TSX                                                                                                ////
//// Client-side mega menu using CSS-compatible menu triggers and normalized icon objects                          ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import IconRender from "@/components/ui/IconRender";

import type { MenuModel } from "./Menu";

type Props = {
	model: MenuModel;
};

type MenuPanelStyle = CSSProperties & {
	"--menu-panel-left"?: string;
	"--menu-panel-width"?: string;
};

type MenuGridStyle = CSSProperties & {
	"--menu-grid-template-columns"?: string;
};

export default function MenuClient({ model }: Props) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
	const hideTimerRef = useRef<number | null>(null);

	const [openId, setOpenId] = useState<string | null>(null);
	const [panelLeft, setPanelLeft] = useState(0);
	const [panelWidth, setPanelWidth] = useState(0);

	const current = useMemo(
		() => model.find((category) => category.id === openId) ?? null,
		[model, openId],
	);

	const clearHide = useCallback((): void => {
		if (hideTimerRef.current !== null) {
			window.clearTimeout(hideTimerRef.current);
			hideTimerRef.current = null;
		}
	}, []);

	const scheduleHide = useCallback((): void => {
		clearHide();
		hideTimerRef.current = window.setTimeout(() => setOpenId(null), 130);
	}, [clearHide]);

	const recomputePanelMetrics = useCallback(
		(categoryId: string): void => {
			const container = containerRef.current;
			const anchor = buttonRefs.current[categoryId];
			const category = model.find((item) => item.id === categoryId);

			if (!container || !anchor || !category) {
				return;
			}

			const columnCount = Math.min(4, Math.max(1, category.columns.length));
			const anchorRect = anchor.getBoundingClientRect();
			const containerRect = container.getBoundingClientRect();
			const contentWidth = columnCount * 210 + (columnCount - 1) * 10;
			const nextWidth = contentWidth + 20 + 2;

			let nextLeft = Math.round(anchorRect.left - containerRect.left);
			const maxLeft = Math.max(0, containerRect.width - nextWidth);

			if (nextLeft > maxLeft) {
				nextLeft = maxLeft;
			}

			if (nextLeft < 0) {
				nextLeft = 0;
			}

			setPanelWidth(nextWidth);
			setPanelLeft(nextLeft);
		},
		[model],
	);

	const openFor = useCallback(
		(categoryId: string): void => {
			clearHide();
			recomputePanelMetrics(categoryId);
			setOpenId(categoryId);
		},
		[clearHide, recomputePanelMetrics],
	);

	useEffect(() => {
		function handleResize(): void {
			if (openId) {
				recomputePanelMetrics(openId);
			}
		}

		window.addEventListener("resize", handleResize);

		return () => {
			window.removeEventListener("resize", handleResize);
		};
	}, [openId, recomputePanelMetrics]);

	useEffect(() => {
		return () => {
			if (hideTimerRef.current !== null) {
				window.clearTimeout(hideTimerRef.current);
			}
		};
	}, []);

	const panelStyle: MenuPanelStyle = {
		"--menu-panel-left": `${panelLeft}px`,
		"--menu-panel-width": `${panelWidth}px`,
	};

	const gridStyle: MenuGridStyle | undefined = current
		? {
				"--menu-grid-template-columns": `repeat(${Math.min(4, Math.max(1, current.columns.length))}, var(--menu-column-width))`,
			}
		: undefined;

	return (
		<div
			ref={containerRef}
			className="menu-nav"
			onMouseLeave={scheduleHide}
			onMouseEnter={clearHide}
		>
			<div className="menu-row">
				{model.map((category) => {
					const isOpen = openId === category.id;

					return (
						<div className="menu-item" key={category.id}>
							<button
								ref={(element) => {
									buttonRefs.current[category.id] = element;
								}}
								type="button"
								className={`menu-button${isOpen ? " is-open" : ""}`}
								onMouseEnter={() => openFor(category.id)}
								onFocus={() => openFor(category.id)}
								onClick={() => (isOpen ? setOpenId(null) : openFor(category.id))}
								aria-haspopup="menu"
								aria-expanded={isOpen}
							>
								{category.iconKey ? (
									<IconRender
										iconKey={category.iconKey}
										iconColor={category.iconColor}
										relationHint="pages"
										size={16}
												/>
								) : null}
								<span>{category.title}</span>
								<ChevronDown size={16} className="chev" aria-hidden />
							</button>
						</div>
					);
				})}
			</div>

			<AnimatePresence>
				{current ? (
					<motion.div
						key={current.id}
						className="menu-panel"
						style={panelStyle}
						initial={{ opacity: 0, y: -6 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -6 }}
						transition={{ duration: 0.16, ease: "easeOut" }}
						onMouseEnter={clearHide}
						onMouseLeave={scheduleHide}
					>
						<div className="menu-grid" style={gridStyle}>
							{current.columns.map((column) => (
								<div className="menu-col" key={column.id}>
									<a className="menu-col-title" href={column.seeAllHref}>
										<IconRender
											iconKey={column.iconKey}
											iconColor={column.iconColor}
											relationHint="pages"
											size={18}
										/>
										<span>{column.title}</span>
									</a>

									{column.pages.length > 0 ? (
										<ul className="menu-links">
											{column.pages.map((page) => (
												<li key={`${column.id}::page::${page.href}::${page.title}`}>
													<a
														className="menu-link"
														href={page.href}
														target={page.target ?? undefined}
														rel={page.rel ?? undefined}
													>
														<IconRender
															iconKey={page.iconKey}
															iconColor={page.iconColor}
															relationHint={page.href.startsWith("/map/") ? "maps" : "pages"}
															size={16}
														/>
														<span>{page.title}</span>
													</a>
												</li>
											))}
										</ul>
									) : null}
								</div>
							))}
						</div>
					</motion.div>
				) : null}
			</AnimatePresence>
		</div>
	);
}
