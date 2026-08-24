import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

type ReleaseType = "beta" | "patch" | "minor" | "major";

interface PackageJson {
	version: string;
	[key: string]: unknown;
}

const release = process.argv[2] as ReleaseType;

const VALID_RELEASES: ReleaseType[] = ["beta", "patch", "minor", "major"];

if (!VALID_RELEASES.includes(release)) {
	console.error("Usage: bun generate-version.ts [beta|patch|minor|major]");
	process.exit(1);
}

const PACKAGE_JSON = join(process.cwd(), "package.json");

function parseVersion(version: string) {
	const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-beta\.(\d+))?$/);

	if (!match) {
		throw new Error(`Invalid version: ${version}`);
	}

	return {
		major: Number(match[1]),
		minor: Number(match[2]),
		patch: Number(match[3]),
		beta: match[4] ? Number(match[4]) : null,
	};
}

function nextVersion(version: string, release: ReleaseType): string {
	const parsed = parseVersion(version);

	switch (release) {
		case "beta":
			return `${parsed.major}.${parsed.minor}.${parsed.patch}-beta.${
				parsed.beta === null ? 0 : parsed.beta + 1
			}`;

		case "patch":
			return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}`;

		case "minor":
			return `${parsed.major}.${parsed.minor + 1}.0`;

		case "major":
			return `${parsed.major + 1}.0.0`;
	}
}

async function main() {
	const pkg = JSON.parse(await readFile(PACKAGE_JSON, "utf8")) as PackageJson;

	const current = pkg.version;
	const next = nextVersion(current, release);

	pkg.version = next;

	await writeFile(PACKAGE_JSON, `${JSON.stringify(pkg, null, 2)}\n`);

	console.log(`Version updated`);
	console.log(`${current} -> ${next}`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
