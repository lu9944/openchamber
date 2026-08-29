---
name: openchamber-offline-release
description: Sync this OpenChamber fork with upstream and build, verify, publish, download, or troubleshoot its Linux x64 offline npm installer through GitHub Actions and GitHub Releases.
---

# OpenChamber offline release

Keep the fork current without losing its installer behavior. A published release is complete only when one GitHub Actions run verifies the packed Web package without network access, starts the installed server, and uploads the verified archive to GitHub Releases.

## Load context first

1. Read the active root `AGENTS.md`.
2. Load `openchamber-change-discipline` and every project skill matched by incoming upstream changes.
3. Read `packages/web/README.md`, `packages/web/bin/lib/DOCUMENTATION.md`, and the nearest documentation for changed Web modules.
4. Inspect current source, tests, package scripts, and `.github/workflows/build-offline-npm-package.yml`.

Re-read the root guide and any changed project skills after merging. Upstream can change the rules during the task.

## Sync upstream

Use the official `upstream` remote and the fork branch requested by the user. Git and GitHub mutations still require the user's authorization.

1. Inspect the worktree, branch, remotes, HEAD, and fork-only commits.
2. Fetch `upstream` with pruning.
3. Measure both directions with `git rev-list --left-right --count HEAD...upstream/main`.
4. Review incoming commit subjects, changed paths, the latest tag, and commits after that tag.
5. Merge `upstream/main`. Preserve unrelated worktree changes and intentional fork behavior.
6. Resolve overlaps from current contracts. A clean merge is not proof that the fork behavior still matches the new package.
7. Confirm the right-side count is zero.

Summarize concrete user-visible themes by runtime. Report the latest tag and post-tag commits separately because `upstream/main` often runs ahead of the release tag.

## Preserve the fork installer contract

Audit these files after every merge:

- `scripts/install.sh`
- `packages/web/server/lib/package-manager.js`
- `packages/web/server/lib/package-manager.test.js`
- `packages/web/README.md`
- `packages/web/package.json`

The online installer supports npm, pnpm, cnpm, yarn, and bun. Interactive runs offer installed managers; non-interactive runs accept `--package-manager <name>` or `OPENCHAMBER_PACKAGE_MANAGER`. Save the chosen manager under the OpenChamber user config so `openchamber update` can prefer the same owner, but verify that manager still owns the current installation before using it.

Clear the shell command cache before checking an existing `openchamber` binary. Otherwise a removed pnpm installation can leave Bash pointing at a dead path.

Keep install, update, PATH guidance, and tests aligned for every supported manager. Do not infer package ownership only from availability when the actual global package path can prove it.

## Audit offline parity

The checked-in workflow owns the Linux x64 npm offline artifact. It is not a generic package-manager bundle.

- Build `packages/web` before `npm pack`.
- Derive the version from `packages/web/package.json`.
- Include a short source revision in the artifact name.
- Warm an isolated npm cache from the local tarball.
- Ignore user npm configuration during cache creation and installation.
- Run `npm cache verify`.
- Generate and verify `SHA256SUMS` before installation.
- Install with `npm --offline` while the test HOME points at an invalid registry.
- Require Linux x64, Node.js 22+, and npm in the generated installer.
- Check the installed version equals the packed version.
- Run `npm ls --all --global` against the isolated prefix.
- Run `openchamber --help`.
- Start the installed server and request `/health` and `/`.
- Disable speech-model downloads and state that models are not included.

For the server smoke test, provide a temporary executable through `OPENCODE_BINARY`, set `OPENCODE_SKIP_START=true`, and point `OPENCODE_HOST` at an unused loopback port. This proves OpenChamber startup, not OpenCode integration.

An npm cache cannot serve as a pnpm or cnpm offline store. A future pnpm offline artifact needs its own warmed pnpm store, installer path, dependency tree check, artifact name, and smoke test.

## Publish release assets

Publish only after the offline installation and runtime smoke test succeed in the same job.

- Grant `contents: write` only to the job or workflow that publishes the release.
- Name the release tag `offline-v<version>-<short-sha>` and target the exact workflow commit.
- Package the verified artifact directory as `<artifact-name>.tar.gz` and publish a sibling `<artifact-name>.tar.gz.sha256`.
- Keep the inner `SHA256SUMS` with the extracted installer. The sibling checksum verifies the downloaded release archive; the inner checksums verify its install inputs.
- State the Linux x64, Node.js 22+, npm-only, and network-backed feature boundaries in the release notes.
- Decide rerun behavior before publishing. If the deterministic tag already exists, verify that its target commit and assets match this run. Treat replacement or deletion of existing release assets as a separate mutation requiring user authorization.

The release step must fail on missing assets. A successful Actions artifact upload does not compensate for a failed GitHub Release upload when publication was requested.

## Build only through GitHub Actions

When the user requires cloud-only builds, local work is limited to source and configuration inspection, syntax checks, YAML parsing, diff checks, artifact download, and checksum verification. Run tests, dependency installation, production builds, package creation, offline installation, and runtime smoke tests in GitHub Actions.

1. Validate workflow YAML, shell syntax, and `git diff --check`.
2. Commit and push the exact branch the workflow will check out.
3. Resolve the fork repository from `origin`; pass `-R owner/repo` to every `gh` command so commands cannot silently target upstream.
4. Trigger `.github/workflows/build-offline-npm-package.yml` with an explicit ref.
5. Select the new run by exact `headSha`, not merely the newest timestamp.
6. Watch it through tests, type-check, lint, build, offline install, runtime smoke, artifact upload, archive creation, checksum creation, and GitHub Release publication.
7. If it fails, inspect only the failed logs, fix the cause, push a new commit, and trigger a fresh run.

A green Web build is insufficient. The offline install and runtime smoke step must pass in the same run that uploads the artifact and, when requested, publishes the GitHub Release. Inspect run annotations and report actionable deprecations even when the run succeeds.

## Download and verify

Download the exact Actions artifact from the successful run into a new ignored `artifacts/<artifact-name>/` directory. Refuse to overwrite an existing directory. Verify its inner `SHA256SUMS` after download.

When a GitHub Release was published, inspect the release by its exact tag. Confirm that it is published rather than draft, record every asset name and byte size, and verify the release archive against its sibling `.sha256`. Actions artifacts expire according to their retention setting; GitHub Release assets do not share that expiry.

When local installation is authorized, use a temporary HOME and install prefix, then repeat the dependency, version, help, health, and homepage checks. When the user requested Actions-only validation, keep the artifact and stop after the local checksum check.

## Completion report

Report:

- upstream commit, latest tag, and post-tag commit count
- fork HEAD and pushed branch
- user-visible upstream themes
- fork installer behavior preserved or changed
- exact GitHub Actions checks and result
- run URL
- Actions artifact name, byte size, expiration state, and local path
- release tag, URL, publication state, and each asset name and byte size
- inner installer checksum and outer release archive checksum results
- relevant successful-run annotations or deprecations
- anything not tested locally

Describe the result as an offline npm installation package. Network-backed providers, catalogs, updates, relay services, and speech models may still need network access.
