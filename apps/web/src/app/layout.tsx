//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/layout.tsx                                                                            ////
//// Language: TSX                                                                                                ////
//// Root application layout for the public shell and shared theme-aware page chrome.                             ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import "./globals.css";
import { cookies } from "next/headers";

import Header from "../components/Header";
import Menu from "../components/Menu";
import Footer from "../components/Footer";
import ScrollReset from "@/components/ScrollReset";

export const metadata = {
	title: "Corn Mafia",
	description: "Cornucopias guild",
};

type ThemeStyleCode = "dark" | "light" | "vintage";

const THEME_COOKIE_NAME = "cm_theme";
const THEME_CLASS_BY_CODE: Record<ThemeStyleCode, string> = {
	dark: "cm-dark",
	light: "cm-light",
	vintage: "cm-vintage",
};
function readThemeStyleCode(value: string | undefined): ThemeStyleCode {
	return value === "dark" || value === "light" ? value : "vintage";
}

export default async function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const cookieStore = await cookies();
	const themeStyleCode = readThemeStyleCode(
		cookieStore.get(THEME_COOKIE_NAME)?.value,
	);
	const themeClass = THEME_CLASS_BY_CODE[themeStyleCode];

	return (
		<html lang="en" className={themeClass}>
			<head>
				<link rel="icon" href="/logos/favicon-32x32.png" sizes="32x32" />
				<meta name="theme-color" content="#17110d" />
			</head>
			<body>
				<ScrollReset />
				<header className="header">
					<div className="container header-inner">
						<Header />
					</div>
				</header>
				<Menu />
				<main className="main">
					<div className="container">{children}</div>
				</main>

				<footer className="footer">
					<div className="container">
						<Footer />
					</div>
				</footer>
			</body>
		</html>
	);
}
