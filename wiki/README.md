# `/wiki` — source of truth for the GitHub wiki

This directory is the **canonical source** for the CASAtlas GitHub wiki. Pages are written as Markdown here and published with `pnpm wiki:publish`.

## Why

GitHub wikis are editable through the web UI only. We need:

1. **Version control** — wiki changes live alongside code, can be reviewed in PRs, can be reverted.
2. **Review before publish** — contributors open PRs against `/wiki/*.md`. After merge, an authorised maintainer runs `pnpm wiki:publish`.
3. **Local authoring** — full editor support, spell-check, link-check, consistent style.

## Authoring

Each file in this folder becomes one wiki page. The wiki page slug is the filename without `.md`:

| File | Wiki page |
|------|-----------|
| `Home.md` | `Home` |
| `Self-Hosting-Docker.md` | `Self-Hosting-Docker` |
| `OAuth-Setup.md` | `OAuth-Setup` |

Cross-page links use GitHub-flavored markdown:

```markdown
[OAuth Setup](OAuth-Setup)               <!-- wiki page -->
[CHANGELOG](https://github.com/.../blob/main/CHANGELOG.md)   <!-- main repo file -->
```

Cross-page anchors use `#anchor-name` after the slug: `[Restore order](Operating-Casatlas#restore-order)`.

> ⚠️ **Be careful with internal links.** GitHub wikis don't auto-link `SelfHostingWithDocker` camelCase — that works only on classic Gollum-style wikis, and GitHub now requires explicit `[Label](Slug)` style.

## Publishing

```bash
pnpm wiki:publish                 # publish to https://github.com/vihaanvp/casatlas.wiki.git
pnpm wiki:publish --dry-run       # show what would change, no push
```

The publish script lives at `scripts/publish-wiki.mjs`. No external dependencies — pure Node 20 + `git` CLI. It clones the wiki into a temp dir, syncs files, commits, and pushes.

Set `WIKI_REPO` if you want to publish to a fork:

```bash
WIKI_REPO=https://github.com/<you>/casatlas.wiki.git pnpm wiki:publish
```

## Initialisation

The wiki repo (`<name>.wiki.git`) is auto-created on the **first push**. To initialise:

1. Merge a PR adding `/wiki/` files.
2. Locally, run `pnpm wiki:publish`.
3. GitHub creates the wiki repo on push.
4. Subsequent publishes operate normally.

## What happens if the wiki falls out of sync

`scripts/publish-wiki.mjs` is a one-way sync: source -> wiki. Pages in the wiki that aren't in source get deleted. If you need to start over:

```bash
rm -rf wiki.bak  # safety
mv wiki wiki.bak
mkdir wiki
cp -r wiki.bak/*.md wiki/        # choose which to keep
pnpm wiki:publish
```
