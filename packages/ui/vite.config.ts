import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { AtRule, type Root } from "postcss";
import { defineConfig, type Rollup } from "vite";

/**
 * Both outputs below share this exact function reference so Vite doesn't warn
 * about divergent assetFileNames patterns across build.rollupOptions.output.
 *
 * The single CSS asset tied to the `src/index.ts` entry, the aggregate
 * bundle in "./dist" and the (unused, later deleted) barrel file that
 * preserveModules also produces in "./dist/modules", becomes "style.css".
 * Every other asset is a single component's own stylesheet and keeps its
 * default name, which preserveModules already mirrors from its source path.
 */
function assetFileNames(assetInfo: Rollup.PreRenderedAsset) {
	if (assetInfo.originalFileName === "src/index.ts") return "style.css";
	return assetInfo.names[0] ?? "[name][extname]";
}

export default defineConfig({
	plugins: [react({ jsxRuntime: "automatic" })],
	css: {
		postcss: {
			plugins: [
				{
					postcssPlugin: "wrap-in-layer",
					Once(root: Root) {
						const layerNode = new AtRule({
							name: "layer",
							params: "arkyn",
						});

						root.each((node) => {
							layerNode.append(node.clone());
						});

						root.removeAll();
						root.append(layerNode);
					},
				},
			],
		},
	},
	build: {
		minify: true,
		outDir: "./dist",
		cssCodeSplit: true,
		sourcemap: true,
		lib: {
			entry: resolve(__dirname, "src/index.ts"),
			name: "@arkyn/ui",
			cssFileName: "style",
		},
		rollupOptions: {
			external: (id) =>
				!id.startsWith(".") && !id.startsWith("/") && !id.startsWith("\0"),
			output: [
				{
					dir: "./dist",
					entryFileNames: "index.js",
					assetFileNames,
				},
				{
					dir: "./dist/modules",
					preserveModules: true,
					preserveModulesRoot: "src",
					entryFileNames: "[name].js",
					assetFileNames,
				},
			],
		},
	},
});
