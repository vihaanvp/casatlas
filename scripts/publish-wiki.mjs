#!/usr/bin/env node
/**
 * Publish /wiki/*.md to the GitHub wiki repo.
 *
 * Usage:
 *   node scripts/publish-wiki.mjs            # actually push
 *   node scripts/publish-wiki.mjs --dry-run  # show diff, no push
 *   WIKI_REPO=git@github.com:... publish   # override remote
 *
 * Source files: <repo>/wiki/*.md
 * Target repo: <repo>.wiki.git on default branch (usually master)
 *
 * Each file becomes one wiki page. Filename "Foo-Bar.md" -> page "Foo-Bar".
 * GitHub wikis use the literal filename (minus .md) as the page slug.
 *
 * No external deps. Uses Node 20+ built-ins + child_process calls to git.
 */

import { execSync } from "node:child_process"
import { readdirSync, readFileSync, writeFileSync, existsSync, rmSync, mkdtempSync } from "node:fs"
import { join, dirname } from "node:path"
import { tmpdir } from "node:os"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, "..")
const WIKI_SRC = join(REPO_ROOT, "wiki")

const REPO_SLUG = "vihaanvp/casatlas"
const WIKI_REPO_ENV = process.env.WIKI_REPO
const WIKI_REPO = WIKI_REPO_ENV || `https://github.com/${REPO_SLUG}.wiki.git`

const DRY_RUN = process.argv.includes("--dry-run")
const MESSAGE =
  process.argv.find((a) => a.startsWith("--message="))?.slice("--message=".length) ||
  "docs(wiki): publish from /wiki source"

function run(cmd, opts = {}) {
  try {
    return execSync(cmd, {
      stdio: ["ignore", "pipe", "pipe"],
      encoding: "utf8",
      ...opts,
    })
  } catch (err) {
    const stderr = err.stderr ? err.stderr.toString() : ""
    const stdout = err.stdout ? err.stdout.toString() : ""
    throw new Error(`Command failed: ${cmd}\nstderr: ${stderr}\nstdout: ${stdout}`)
  }
}

function git(cmd, cwd) {
  return run(`git ${cmd}`, { cwd })
}

function detectDefaultBranch(wikiDir) {
  // GitHub wikis default to `master` historically — newer ones still use it.
  // Try symbolic-ref then fall back to `master`.
  try {
    const ref = git("symbolic-ref --short refs/remotes/origin/HEAD", wikiDir).trim()
    return ref.replace(/^origin\//, "")
  } catch {
    return "master"
  }
}

function main() {
  if (!existsSync(WIKI_SRC)) {
    console.error(`No /wiki directory at ${WIKI_SRC}. Nothing to publish.`)
    process.exit(1)
  }

  // 1. Collect source pages.
  const sourcePages = new Map() // filename (e.g. "Foo-Bar") -> absolute path
  for (const fname of readdirSync(WIKI_SRC)) {
    if (!fname.endsWith(".md")) continue
    const slug = fname.slice(0, -".md".length)
    sourcePages.set(slug, join(WIKI_SRC, fname))
  }
  if (sourcePages.size === 0) {
    console.error("No pages in /wiki.")
    process.exit(1)
  }

  // 2. Clone the wiki repo fresh into a temp dir.
  const tmpDir = mkdtempSync(join(tmpdir(), "publish-wiki-"))
  console.log(`Cloning ${WIKI_REPO} -> ${tmpDir}`)
  git(`clone --depth 1 "${WIKI_REPO}" "${tmpDir}"`)

  const branch = detectDefaultBranch(tmpDir)
  console.log(`Detected wiki default branch: ${branch}`)

  // 3. Sync pages.
  let changed = 0
  let deleted = 0
  for (const [slug, path] of sourcePages) {
    const destination = join(tmpDir, `${slug}.md`)
    const content = readFileSync(path, "utf8")
    if (!existsSync(destination) || readFileSync(destination, "utf8") !== content) {
      writeFileSync(destination, content)
      changed++
    }
  }
  // Remove pages in the wiki that no longer exist in source.
  for (const fname of readdirSync(tmpDir)) {
    if (!fname.endsWith(".md")) continue
    const slug = fname.slice(0, -".md".length)
    if (!sourcePages.has(slug)) {
      rmSync(join(tmpDir, fname))
      deleted++
    }
  }

  console.log(`Pages to update: ${changed}`)
  console.log(`Pages to delete: ${deleted}`)

  if (changed === 0 && deleted === 0) {
    console.log("Already up to date. Nothing to do.")
    return
  }

  if (DRY_RUN) {
    console.log("\n[DRY RUN] would commit & push. Aborting without changes.")
    console.log("Run without --dry-run to actually publish.")
    return
  }

  // 4. Commit & push.
  git(`add -A`, tmpDir)
  // Allow empty commit for cases where only metadata changed — but with our sync logic above, this shouldn't fire.
  try {
    git(`commit -m "${MESSAGE.replace(/"/g, '\\"')}"`, tmpDir)
  } catch (err) {
    if (/nothing to commit/.test(err.message)) {
      console.log("Nothing to commit.")
      return
    }
    throw err
  }
  git(`push origin "${branch}"`, tmpDir)

  console.log(`\n✅ Wiki published to ${WIKI_REPO} (${branch})`)
  console.log(`Browse: https://github.com/${REPO_SLUG}/wiki`)
}

main()
