import { resolve } from "node:path";
import Bun from "bun";

interface ExportEntry {
	import: string;
	types?: string;
	default?: string;
}

interface PackageJson {
	exports?: Record<string, ExportEntry>;
	typesVersions?: Record<string, Record<string, string[]>>;
	[key: string]: unknown;
}

const root = process.cwd();
const srcDir = resolve(root, "src");

const indexContent = await Bun.file(resolve(root, "src/index.ts")).text();

const packageJson = (await Bun.file(
	resolve(root, "package.json"),
).json()) as PackageJson;

const exportsMap: Record<string, ExportEntry> = {};
const typesVersionsMap: Record<string, string[]> = {};

const regex =
	/export\s+(?:\*|\{[\s\S]*?\}|type\s+\{[\s\S]*?\})\s+from\s+["'](.+)["']/g;

for (const match of indexContent.matchAll(regex)) {
	let importPath = match[1];

	if (!importPath.startsWith(".")) continue;

	importPath = importPath.replace(/^\.\//, "");

	const exportName = importPath.split("/").pop() as string;

	const srcPath = resolve(srcDir, importPath);
	const isDirectory =
		(await Bun.file(`${srcPath}/index.ts`).exists()) ||
		(await Bun.file(`${srcPath}/index.tsx`).exists());

	const distImport = isDirectory
		? `./dist/modules/${importPath}/index.js`
		: `./dist/modules/${importPath}.js`;

	const distTypes = isDirectory
		? `./dist/${importPath}/index.d.ts`
		: `./dist/${importPath}.d.ts`;

	exportsMap[`./${exportName}`] = {
		import: distImport,
		types: distTypes,
		default: distImport,
	};

	typesVersionsMap[exportName] = [distTypes];
}

packageJson.exports = {
	".": {
		import: "./dist/index.js",
		types: "./dist/index.d.ts",
		default: "./dist/index.js",
	},
	...Object.fromEntries(
		Object.entries(exportsMap).sort(([a], [b]) => a.localeCompare(b)),
	),
};

packageJson.typesVersions = {
	"*": Object.fromEntries(
		Object.entries(typesVersionsMap).sort(([a], [b]) => a.localeCompare(b)),
	),
};

await Bun.write(
	resolve(root, "package.json"),
	`${JSON.stringify(packageJson, null, 2)}\n`,
);

console.log(`Added ${Object.keys(exportsMap).length + 2} exports.`);
console.log(
	`Added ${Object.keys(typesVersionsMap).length} typesVersions fallbacks.`,
);
