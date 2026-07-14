//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/next.config.ts                                                                               ////
//// Language: TS                                                                                                ////
//// Next.js configuration for image hosts, package transpilation, and central browser security headers           ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";

const appRoot = fileURLToPath(new URL(".", import.meta.url));

const isProduction = process.env.NODE_ENV === "production";

const cspDirectives = [
	"default-src 'self'",
	"base-uri 'self'",
	"object-src 'none'",
	"frame-ancestors 'none'",
	"form-action 'self'",
	isProduction
		? "script-src 'self' 'unsafe-inline'"
		: "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
	"style-src 'self' 'unsafe-inline'",
	"img-src 'self' data: blob: https://cdn.discordapp.com https://media.discordapp.net",
	"font-src 'self' data:",
	isProduction ? "connect-src 'self'" : "connect-src 'self' ws: http:",
	"media-src 'self' blob:",
	"frame-src https://www.youtube-nocookie.com https://www.youtube.com",
	"child-src https://www.youtube-nocookie.com https://www.youtube.com",
	"worker-src 'self' blob:",
	"manifest-src 'self'",
	isProduction ? "upgrade-insecure-requests" : "",
].filter((directive) => directive.length > 0);

const securityHeaders = [
	{
		key: "Content-Security-Policy",
		value: cspDirectives.join("; "),
	},
	{
		key: "X-Content-Type-Options",
		value: "nosniff",
	},
	{
		key: "X-Frame-Options",
		value: "DENY",
	},
	{
		key: "Referrer-Policy",
		value: "strict-origin-when-cross-origin",
	},
	{
		key: "Permissions-Policy",
		value:
			"camera=(), microphone=(), geolocation=(), payment=(), usb=(), fullscreen=(self)",
	},
	{
		key: "Cross-Origin-Opener-Policy",
		value: "same-origin",
	},
	{
		key: "X-Permitted-Cross-Domain-Policies",
		value: "none",
	},
	...(isProduction
		? [
				{
					key: "Strict-Transport-Security",
					value: "max-age=63072000; includeSubDomains; preload",
				},
			]
		: []),
];

const nextConfig: NextConfig = {
	async headers() {
		return [
			{
				source: "/:path*",
				headers: securityHeaders,
			},
		];
	},

	images: {
		remotePatterns: [
			{ protocol: "https", hostname: "cdn.discordapp.com" },
			{ protocol: "https", hostname: "media.discordapp.net" },
		],
	},

	turbopack: {
		root: appRoot,
	},

	transpilePackages: [
		"lexical",
		"@lexical/react",
		"@lexical/rich-text",
		"@lexical/list",
		"@lexical/link",
	],
};

export default nextConfig;

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
