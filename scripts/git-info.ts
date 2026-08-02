import { execSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

export interface BuildInfo {
	version: string
	commit: string
	commitFull: string
	date: string
	branch: string
}

const packageJson = JSON.parse(
	readFileSync(
		resolve(dirname(fileURLToPath(import.meta.url)), "../package.json"),
		"utf-8",
	),
)

function gitCommand(command: string): string {
	try {
		return execSync(command, { encoding: "utf-8" }).trim()
	} catch {
		return "unknown"
	}
}

const version: string =
	process.env.npm_package_version || packageJson.version || "0.0.0"
const commitHash: string =
	process.env.GIT_COMMIT || gitCommand("git rev-parse --short HEAD")
const commitFull: string =
	process.env.GIT_COMMIT_FULL || gitCommand("git rev-parse HEAD")
const commitDate: string =
	process.env.GIT_COMMIT_DATE || gitCommand("git log -1 --format=%cI")
const branch: string =
	process.env.GIT_BRANCH || gitCommand("git rev-parse --abbrev-ref HEAD")

export const buildInfo: BuildInfo = {
	version,
	commit: commitHash,
	commitFull,
	date: commitDate,
	branch,
}

export const buildDefine: Record<string, string> = {
	__APP_VERSION__: JSON.stringify(version),
	__GIT_COMMIT__: JSON.stringify(commitHash),
	__GIT_COMMIT_FULL__: JSON.stringify(commitFull),
	__GIT_COMMIT_DATE__: JSON.stringify(commitDate),
	__GIT_BRANCH__: JSON.stringify(branch),
	__BUILD_INFO__: JSON.stringify(buildInfo),
}
