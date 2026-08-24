import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runInit } from "../init";

// `writeFileSync` is wrapped in a pass-through `vi.fn` (still calling the
// real implementation) so the write-confinement tests below can inspect
// every path the CLI actually writes to. Directly `vi.spyOn`-ing the native
// "node:fs" ESM namespace isn't possible ("module namespace is not
// configurable in ESM"), so this mock is the supported way to observe calls
// made through named imports elsewhere in the module graph (e.g. init.ts).
vi.mock("node:fs", async (importOriginal) => {
	const actual = await importOriginal<typeof import("node:fs")>();
	return {
		...actual,
		writeFileSync: vi.fn(actual.writeFileSync),
	};
});

const START_MARKER = "<!-- arkyn:agents:start -->";
const END_MARKER = "<!-- arkyn:agents:end -->";

function writePackageJson(
	projectDir: string,
	pkg: Record<string, unknown>,
): void {
	writeFileSync(join(projectDir, "package.json"), JSON.stringify(pkg), "utf8");
}

// Creates a fake installed `@arkyn/*` (or arbitrary) package under
// node_modules, with its own package.json and AGENTS.md, mirroring what
// resolveAgentsDocs/findInstalledArkynPackages expect to find on disk.
function writeFakeArkynPackage(
	projectDir: string,
	name: string,
	agentsMdContent: string,
): void {
	const pkgDir = join(projectDir, "node_modules", ...name.split("/"));
	mkdirSync(pkgDir, { recursive: true });
	writeFileSync(
		join(pkgDir, "package.json"),
		JSON.stringify({ name, version: "1.0.0" }),
		"utf8",
	);
	writeFileSync(join(pkgDir, "AGENTS.md"), agentsMdContent, "utf8");
}

function expectPathConfinedTo(filePath: string, root: string): void {
	const resolvedRoot = resolve(root);
	const resolvedFile = resolve(filePath);
	expect(
		resolvedFile === resolvedRoot ||
			resolvedFile.startsWith(resolvedRoot + sep),
	).toBe(true);
}

describe("runInit", () => {
	let dir: string;

	beforeEach(() => {
		dir = mkdtempSync(join(tmpdir(), "arkyn-cli-init-"));
		vi.mocked(writeFileSync).mockClear();
	});

	afterEach(() => {
		rmSync(dir, { recursive: true, force: true });
		process.exitCode = undefined;
		vi.restoreAllMocks();
	});

	it("should report a clear, informative error instead of throwing on malformed package.json", () => {
		const packageJsonPath = join(dir, "package.json");
		writeFileSync(packageJsonPath, "{ this is not valid json", "utf8");

		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		expect(() => runInit(dir)).not.toThrow();

		expect(errorSpy).toHaveBeenCalledTimes(1);
		const [message] = errorSpy.mock.calls[0];
		expect(message).toContain(packageJsonPath);
		expect(message).toContain("Failed to parse");
		expect(process.exitCode).toBe(1);
	});

	it("should report an error for empty package.json content", () => {
		const packageJsonPath = join(dir, "package.json");
		writeFileSync(packageJsonPath, "", "utf8");

		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		expect(() => runInit(dir)).not.toThrow();

		expect(errorSpy).toHaveBeenCalledTimes(1);
		expect(errorSpy.mock.calls[0][0]).toContain(packageJsonPath);
		expect(process.exitCode).toBe(1);
	});

	it("should behave normally (no functional change) for valid package.json with no @arkyn/* deps", () => {
		writeFileSync(
			join(dir, "package.json"),
			JSON.stringify({ dependencies: { react: "^19.0.0" } }),
			"utf8",
		);

		const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		runInit(dir);

		expect(logSpy).toHaveBeenCalledWith(
			"No @arkyn/* packages found in dependencies or devDependencies.",
		);
		expect(errorSpy).not.toHaveBeenCalled();
		expect(process.exitCode).toBeUndefined();
	});

	it("should report a clear message and not throw when there is no package.json at all", () => {
		// `dir` is a freshly created empty temp directory: no package.json.
		const packageJsonPath = join(dir, "package.json");
		expect(existsSync(packageJsonPath)).toBe(false);

		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

		expect(() => runInit(dir)).not.toThrow();

		expect(errorSpy).toHaveBeenCalledTimes(1);
		const [message] = errorSpy.mock.calls[0];
		expect(message).toContain(dir);
		expect(message).toContain("No package.json found");
		expect(process.exitCode).toBe(1);
		expect(logSpy).not.toHaveBeenCalled();
		expect(existsSync(join(dir, "AGENTS.md"))).toBe(false);
	});

	it("should create AGENTS.md with the arkyn block when a single @arkyn package is installed and no AGENTS.md exists yet", () => {
		writePackageJson(dir, {
			dependencies: { "@arkyn/components": "^3.0.0" },
		});
		writeFakeArkynPackage(
			dir,
			"@arkyn/components",
			"# @arkyn/components agent docs\n",
		);

		const agentsPath = join(dir, "AGENTS.md");
		expect(existsSync(agentsPath)).toBe(false);

		const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		runInit(dir);

		expect(errorSpy).not.toHaveBeenCalled();
		expect(existsSync(agentsPath)).toBe(true);

		const content = readFileSync(agentsPath, "utf8");
		expect(content).toContain(START_MARKER);
		expect(content).toContain(END_MARKER);
		expect(content).toContain("## Arkyn");
		expect(content).toContain(
			"- [@arkyn/components](node_modules/@arkyn/components/AGENTS.md)",
		);
		expect(logSpy).toHaveBeenCalledWith(
			"Updated AGENTS.md with docs for: @arkyn/components",
		);
	});

	it("should be idempotent: running it twice does not duplicate the arkyn block", () => {
		writePackageJson(dir, {
			dependencies: { "@arkyn/components": "^3.0.0" },
		});
		writeFakeArkynPackage(
			dir,
			"@arkyn/components",
			"# @arkyn/components agent docs\n",
		);

		vi.spyOn(console, "log").mockImplementation(() => {});
		vi.spyOn(console, "error").mockImplementation(() => {});

		const agentsPath = join(dir, "AGENTS.md");

		runInit(dir);
		const firstRunContent = readFileSync(agentsPath, "utf8");

		runInit(dir);
		const secondRunContent = readFileSync(agentsPath, "utf8");

		expect(secondRunContent).toBe(firstRunContent);
		expect(secondRunContent.match(/arkyn:agents:start/g)?.length).toBe(1);
		expect(secondRunContent.match(/arkyn:agents:end/g)?.length).toBe(1);
		expect(
			secondRunContent.match(
				/@arkyn\/components\]\(node_modules\/@arkyn\/components\/AGENTS\.md\)/g,
			)?.length,
		).toBe(1);
	});

	it("should preserve unrelated existing AGENTS.md content and append the arkyn block", () => {
		writePackageJson(dir, {
			dependencies: { "@arkyn/components": "^3.0.0" },
		});
		writeFakeArkynPackage(
			dir,
			"@arkyn/components",
			"# @arkyn/components agent docs\n",
		);

		const agentsPath = join(dir, "AGENTS.md");
		const unrelatedContent =
			"# My Project\n\nSome hand-written notes that must survive.\n";
		writeFileSync(agentsPath, unrelatedContent, "utf8");

		vi.spyOn(console, "log").mockImplementation(() => {});
		vi.spyOn(console, "error").mockImplementation(() => {});

		runInit(dir);

		const content = readFileSync(agentsPath, "utf8");
		expect(content).toContain(unrelatedContent.trim());
		expect(content).toContain(START_MARKER);
		expect(content).toContain(
			"- [@arkyn/components](node_modules/@arkyn/components/AGENTS.md)",
		);
	});

	it("should replace a stale arkyn block from a previous run while preserving unrelated content around it", () => {
		writePackageJson(dir, {
			dependencies: {
				"@arkyn/components": "^3.0.0",
				"@arkyn/server": "^3.0.0",
			},
		});
		writeFakeArkynPackage(
			dir,
			"@arkyn/components",
			"# @arkyn/components agent docs\n",
		);
		writeFakeArkynPackage(dir, "@arkyn/server", "# @arkyn/server agent docs\n");

		const agentsPath = join(dir, "AGENTS.md");
		const staleBlock = [
			START_MARKER,
			"## Arkyn",
			"",
			"- [@arkyn/components](node_modules/@arkyn/components/AGENTS.md)",
			END_MARKER,
		].join("\n");
		const existing = `# My Project\n\nIntro notes.\n\n${staleBlock}\n\nMore notes below.\n`;
		writeFileSync(agentsPath, existing, "utf8");

		vi.spyOn(console, "log").mockImplementation(() => {});
		vi.spyOn(console, "error").mockImplementation(() => {});

		runInit(dir);

		const content = readFileSync(agentsPath, "utf8");
		expect(content).toContain("Intro notes.");
		expect(content).toContain("More notes below.");
		expect(content.match(/arkyn:agents:start/g)?.length).toBe(1);
		expect(content).toContain(
			"- [@arkyn/components](node_modules/@arkyn/components/AGENTS.md)",
		);
		expect(content).toContain(
			"- [@arkyn/server](node_modules/@arkyn/server/AGENTS.md)",
		);
	});

	it("should include doc links for every installed @arkyn package, not just the first one found", () => {
		writePackageJson(dir, {
			dependencies: {
				"@arkyn/components": "^3.0.0",
				"@arkyn/server": "^3.0.0",
			},
			devDependencies: {
				"@arkyn/shared": "^3.0.0",
			},
		});
		writeFakeArkynPackage(
			dir,
			"@arkyn/components",
			"# @arkyn/components agent docs\n",
		);
		writeFakeArkynPackage(dir, "@arkyn/server", "# @arkyn/server agent docs\n");
		writeFakeArkynPackage(dir, "@arkyn/shared", "# @arkyn/shared agent docs\n");

		vi.spyOn(console, "log").mockImplementation(() => {});
		vi.spyOn(console, "error").mockImplementation(() => {});

		runInit(dir);

		const content = readFileSync(join(dir, "AGENTS.md"), "utf8");
		expect(content).toContain(
			"- [@arkyn/components](node_modules/@arkyn/components/AGENTS.md)",
		);
		expect(content).toContain(
			"- [@arkyn/server](node_modules/@arkyn/server/AGENTS.md)",
		);
		expect(content).toContain(
			"- [@arkyn/shared](node_modules/@arkyn/shared/AGENTS.md)",
		);
		expect(content.match(/arkyn:agents:start/g)?.length).toBe(1);
	});

	it("should only ever write AGENTS.md inside the target project directory", () => {
		writePackageJson(dir, {
			dependencies: { "@arkyn/components": "^3.0.0" },
		});
		writeFakeArkynPackage(
			dir,
			"@arkyn/components",
			"# @arkyn/components agent docs\n",
		);

		vi.spyOn(console, "log").mockImplementation(() => {});
		vi.spyOn(console, "error").mockImplementation(() => {});

		// Fixture setup above (writePackageJson/writeFakeArkynPackage) also
		// calls writeFileSync; clear those calls so only runInit's own writes
		// are captured below.
		vi.mocked(writeFileSync).mockClear();

		runInit(dir);

		expect(writeFileSync).toHaveBeenCalledTimes(1);
		const [writtenPath] = vi.mocked(writeFileSync).mock.calls[0];
		expect(typeof writtenPath).toBe("string");
		expectPathConfinedTo(writtenPath as string, dir);
		expect(resolve(writtenPath as string)).toBe(
			resolve(join(dir, "AGENTS.md")),
		);
	});

	it("should not write anywhere outside the project root even when a malicious/invalid package name is present", () => {
		writePackageJson(dir, {
			dependencies: {
				"@arkyn/components": "^3.0.0",
				"@arkyn/../../../../etc/evil": "^1.0.0",
			},
		});
		writeFakeArkynPackage(
			dir,
			"@arkyn/components",
			"# @arkyn/components agent docs\n",
		);

		vi.spyOn(console, "log").mockImplementation(() => {});
		vi.spyOn(console, "error").mockImplementation(() => {});
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

		// Fixture setup above also calls writeFileSync; clear those calls so
		// only runInit's own writes are captured below.
		vi.mocked(writeFileSync).mockClear();

		expect(() => runInit(dir)).not.toThrow();

		// The malicious name is rejected before it ever reaches a path join.
		expect(warnSpy).toHaveBeenCalled();

		// The only write that happens is the project's own AGENTS.md.
		expect(writeFileSync).toHaveBeenCalledTimes(1);
		const [writtenPath] = vi.mocked(writeFileSync).mock.calls[0];
		expectPathConfinedTo(writtenPath as string, dir);
		expect(resolve(writtenPath as string)).toBe(
			resolve(join(dir, "AGENTS.md")),
		);

		const content = readFileSync(join(dir, "AGENTS.md"), "utf8");
		expect(content).toContain(
			"- [@arkyn/components](node_modules/@arkyn/components/AGENTS.md)",
		);
		expect(content).not.toContain("evil");
	});
});
