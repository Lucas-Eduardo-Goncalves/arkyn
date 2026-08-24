import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { configDefaults, defineConfig } from "vitest/config";

// The RichText editor is built on Slate, which relies on real
// `beforeinput`/Selection-API contenteditable behavior that jsdom doesn't
// implement. This one file's typing/selection scenarios run against a real
// Chromium instance via Vitest Browser Mode instead, while every other spec
// file keeps running under jsdom (fast, no browser launch).
const RICH_TEXT_BROWSER_SPEC =
	"src/components/__test__/richText.browser.spec.tsx";

export default defineConfig({
	plugins: [react({ jsxRuntime: "automatic" })],
	resolve: { mainFields: ["module"] },
	test: {
		setupFiles: ["./vitest.setup.ts"],
		testTimeout: 10000,
		hookTimeout: 10000,
		teardownTimeout: 5000,
		projects: [
			{
				extends: true,
				test: {
					name: "jsdom",
					environment: "jsdom",
					exclude: [...configDefaults.exclude, RICH_TEXT_BROWSER_SPEC],
				},
			},
			{
				// Deliberately not `extends: true`: that deep-merges arrays like
				// `setupFiles` instead of overriding them, so this project would
				// still inherit the root's jsdom-oriented `./vitest.setup.ts`
				// (jest-dom matchers this file's tests don't use, plus an
				// `isContentEditable` polyfill jsdom needs but real Chromium
				// doesn't). That file pulls in Node-oriented deps that assume a
				// `process` global, which real Chromium has no such global for.
				// This project instead declares only the plugins/resolve config
				// it actually needs.
				plugins: [react({ jsxRuntime: "automatic" })],
				resolve: { mainFields: ["module"] },
				test: {
					name: "browser",
					include: [RICH_TEXT_BROWSER_SPEC],
					testTimeout: 10000,
					hookTimeout: 10000,
					teardownTimeout: 5000,
					browser: {
						enabled: true,
						provider: playwright(),
						headless: true,
						instances: [{ browser: "chromium" }],
					},
				},
			},
		],
	},
});
