//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: eslint.config.mjs                                                                                   ////
//// Language: JS                                                                                              ////
//// Canonical root ESLint 9 flat config for the Corn Mafia web application.                                    ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import js from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";
import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
	{
		ignores: [
			"**/node_modules/**",
			"**/.next/**",
			"**/dist/**",
			"**/build/**",
			"**/coverage/**",
			"data/**",
			"apps/web/public/**",
		],
	},

	js.configs.recommended,

	{
		files: ["apps/web/**/*.{js,jsx,ts,tsx}"],
		languageOptions: {
			ecmaVersion: "latest",
			sourceType: "module",
			parser: tseslint.parser,
			globals: {
				...globals.node,
				...globals.browser,
				...globals.worker,
				...globals.serviceworker,
				AbortController: "readonly",
				BeforeUnloadEvent: "readonly",
				Blob: "readonly",
				BodyInit: "readonly",
				Buffer: "readonly",
				crypto: "readonly",
				DOMParser: "readonly",
				Element: "readonly",
				EventListener: "readonly",
				File: "readonly",
				FormData: "readonly",
				Headers: "readonly",
				HTMLAnchorElement: "readonly",
				HTMLButtonElement: "readonly",
				HTMLDivElement: "readonly",
				HTMLImageElement: "readonly",
				HTMLInputElement: "readonly",
				HTMLLabelElement: "readonly",
				HTMLSpanElement: "readonly",
				HTMLTableCellElement: "readonly",
				HTMLTableElement: "readonly",
				HTMLTableRowElement: "readonly",
				HTMLTableSectionElement: "readonly",
				HTMLTextAreaElement: "readonly",
				MouseEvent: "readonly",
				Node: "readonly",
				React: "readonly",
				ReadableStream: "readonly",
				Request: "readonly",
				RequestInit: "readonly",
				Response: "readonly",
				TextDecoder: "readonly",
				TextEncoder: "readonly",
				URL: "readonly",
				URLSearchParams: "readonly",
			},
		},
		plugins: {
			"@typescript-eslint": tseslint.plugin,
			react: reactPlugin,
			"react-hooks": reactHooks,
		},
		rules: {
			"@typescript-eslint/no-explicit-any": "error",
			"@typescript-eslint/no-unused-vars": [
				"warn",
				{
					argsIgnorePattern: "^_",
					caughtErrorsIgnorePattern: "^_",
					varsIgnorePattern: "^_",
				},
			],
			"max-len": "off",
			"no-empty": ["warn", { allowEmptyCatch: true }],
			"no-multiple-empty-lines": ["warn", { max: 2 }],
			"no-trailing-spaces": "warn",
			"no-undef": "off",
			"no-unused-vars": "off",
			"react/prop-types": "off",
			"react/react-in-jsx-scope": "off",
			...reactHooks.configs.recommended.rules,
		},
		settings: { react: { version: "detect" } },
	},

	{
		files: ["apps/web/**/*.{js,jsx,ts,tsx}"],
		plugins: { "@next/next": nextPlugin },
		rules: {
			...nextPlugin.configs.recommended.rules,
			"@next/next/no-html-link-for-pages": "off",
			"@next/next/no-img-element": "warn",
		},
		settings: {
			next: { rootDir: ["apps/web"] },
		},
	},

	{
		files: ["*.mjs", "*.cjs", "scripts/**/*.{js,mjs}", "**/*.config.{js,mjs,cjs,ts}"],
		languageOptions: { globals: { ...globals.node } },
	},

	{
		files: ["**/*.d.ts"],
		rules: { "no-undef": "off" },
	},
];