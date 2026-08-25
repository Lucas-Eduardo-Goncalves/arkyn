import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [react({ jsxRuntime: "automatic" })],
	resolve: { mainFields: ["module"] },
	test: {
		environment: "jsdom",
		setupFiles: ["./vitest.setup.ts"],
		testTimeout: 10000,
		hookTimeout: 10000,
		teardownTimeout: 5000,
	},
});
