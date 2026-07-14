//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/detail/RiseopediaDetailLayout.tsx                                      ////
//// Language: TSX                                                                                            ////
//// Fixed public Riseopedia detail layout with header media, main body, and configured detail aside blocks.  ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX, ReactNode } from "react";
import Link from "next/link";

import type { RiseopediaEntitySectionRef } from "@/lib/data/riseopedia-sections";

export type RiseopediaBreadcrumbItem = {
	label: string;
	href?: string;
};

export type RiseopediaDetailLayoutProps = {
	breadcrumb: RiseopediaBreadcrumbItem[];
	title: string;
	summary?: string | null;
	brandName?: string | null;
	sections?: RiseopediaEntitySectionRef[];
	media?: ReactNode;
	controls?: ReactNode;
	overview?: ReactNode;
	aside?: ReactNode;
	selectedRarityCode?: string | null;
	body: ReactNode;
	bottom: ReactNode;
};

function RiseopediaBreadcrumb({
	items,
}: {
	items: RiseopediaBreadcrumbItem[];
}): JSX.Element | null {
	if (items.length === 0) {
		return null;
	}

	return (
		<nav
			className="riseopedia-detail-hero__breadcrumb"
			aria-label="Riseopedia classification path"
		>
			<ol className="riseopedia-detail-hero__breadcrumb-list">
				{items.map((item, index) => {
					const current = index === items.length - 1;
					const key = `${item.label}-${index}`;

					return (
						<li className="riseopedia-detail-hero__breadcrumb-item" key={key}>
							{item.href && !current ? (
								<Link
									className="riseopedia-detail-hero__breadcrumb-link"
									href={item.href}
								>
									{item.label}
								</Link>
							) : (
								<span
									className="riseopedia-detail-hero__breadcrumb-current"
									aria-current={current ? "page" : undefined}
								>
									{item.label}
								</span>
							)}
						</li>
					);
				})}
			</ol>
		</nav>
	);
}

function safeRarityCode(value: string | null | undefined): string | undefined {
	if (!value) {
		return undefined;
	}

	const normalized = value.trim().toLowerCase();
	return /^[a-z0-9_-]+$/.test(normalized) ? normalized : undefined;
}

export default function RiseopediaDetailLayout({
	breadcrumb,
	title,
	media,
	controls,
	overview,
	aside,
	selectedRarityCode,
	body,
	bottom,
}: RiseopediaDetailLayoutProps): JSX.Element {
	const hasOverview = overview !== null && overview !== undefined;
	const hasAsideBlocks = aside !== null && aside !== undefined;
	const hasDetailAside = hasOverview || hasAsideBlocks;
	const layoutClassName = [
		"riseopedia-detail-layout",
		hasDetailAside ? "riseopedia-detail-layout--with-aside" : null,
		hasAsideBlocks ? "riseopedia-detail-layout--with-aside-content" : null,
	]
		.filter((className): className is string => className !== null)
		.join(" ");
	const headerClassName = media
		? "riseopedia-detail-hero riseopedia-detail-hero--with-media"
		: "riseopedia-detail-hero";
	const selectedRarityDataCode = safeRarityCode(selectedRarityCode);

	return (
		<section className="riseopedia-detail-shell">
			<article
				className="card riseopedia-detail-page"
				data-rarity={selectedRarityDataCode}
			>
				<header className={headerClassName} data-rarity={selectedRarityDataCode}>
					<div className="riseopedia-detail-hero__copy">
						<RiseopediaBreadcrumb items={breadcrumb} />
						<h1 className="riseopedia-detail-hero__title">{title}</h1>
						{controls}
					</div>

					{media ? (
						<div className="riseopedia-detail-hero__media">{media}</div>
					) : null}
				</header>

				<section
					className="public-collection-panel riseopedia-detail-content-panel"
					data-rarity={selectedRarityDataCode}
				>
					<div className={layoutClassName}>
						<div className="riseopedia-detail-body">{body}</div>

						{hasDetailAside ? (
							<aside
								className="riseopedia-detail-aside"
								aria-label="Riseopedia detail aside"
							>
								{hasOverview ? (
									<div
										className="riseopedia-detail-overview"
										aria-label="Riseopedia overview"
									>
										{overview}
									</div>
								) : null}
								{hasAsideBlocks ? (
									<div className="riseopedia-detail-aside__blocks">{aside}</div>
								) : null}
							</aside>
						) : null}
					</div>
				</section>

				<section
					className="public-collection-panel riseopedia-detail-footer-panel"
					data-rarity={selectedRarityDataCode}
				>
					{bottom}
				</section>
			</article>
		</section>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
