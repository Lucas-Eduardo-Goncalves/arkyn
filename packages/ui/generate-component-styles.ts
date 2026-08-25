import { dirname, join, resolve } from "node:path";
import Bun from "bun";

const root = process.cwd();
const srcDir = resolve(root, "src");
const modulesDir = resolve(root, "dist/modules");

const indexContent = await Bun.file(resolve(srcDir, "index.ts")).text();

const exportRegex =
	/export\s+(?:\*|\{[\s\S]*?\}|type\s+\{[\s\S]*?\})\s+from\s+["'](.+)["']/g;

const importRegex = /from\s+["'](\.[^"']+)["']/g;

const entries: string[] = [];
for (const match of indexContent.matchAll(exportRegex)) {
	let importPath = match[1];

	if (!importPath.startsWith(".")) continue;

	importPath = importPath.replace(/^\.\//, "");

	// Only components ship CSS: hooks/providers/services have none.
	if (!importPath.startsWith("components/")) continue;

	entries.push(importPath);
}

async function collectStylesheets(entryJsPath: string): Promise<string[]> {
	const visited = new Set<string>();
	const stylesheets: string[] = [];

	async function walk(jsPath: string) {
		if (visited.has(jsPath) || !(await Bun.file(jsPath).exists())) return;
		visited.add(jsPath);

		const dir = dirname(jsPath);

		for (const cssName of ["styles.css", "style.css"]) {
			const cssPath = join(dir, cssName);
			if (
				!stylesheets.includes(cssPath) &&
				(await Bun.file(cssPath).exists())
			) {
				stylesheets.push(cssPath);
			}
		}

		const content = await Bun.file(jsPath).text();
		for (const match of content.matchAll(importRegex)) {
			await walk(resolve(dir, match[1]));
		}
	}

	await walk(entryJsPath);
	return stylesheets;
}

let generated = 0;

for (const importPath of entries) {
	const dir = resolve(modulesDir, importPath);
	const entryJsPath = join(dir, "index.js");

	if (!(await Bun.file(entryJsPath).exists())) continue;

	const stylesheets = await collectStylesheets(entryJsPath);
	if (stylesheets.length === 0) continue;

	const merged = (
		await Promise.all(stylesheets.map((file) => Bun.file(file).text()))
	).join("\n");

	await Bun.write(join(dir, "styles.css"), merged);
	generated++;
}

console.log(`Generated ${generated} self-contained component stylesheets.`);
