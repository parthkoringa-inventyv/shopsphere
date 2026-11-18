# Pre-Commit Checklist

Use this checklist before every commit to keep the ShopSphere codebase
formatted, type-safe, tested, and buildable.

> Run commands from the repository root unless a step says otherwise.
> The API and Angular app have separate `package.json` files, so run
> their scripts from their respective directories.

## 1. Review the changes

``` bash
git status --short
git diff --stat
git diff
git diff --check
```

Check that: - Only files related to the task are changed. - No generated
output, build artifacts, coverage reports, or local environment files
are staged. - No secrets, tokens, passwords, private keys, or real
production credentials are present. - No temporary debugging code or
accidental `console.log` statements remain. - Tests and documentation
are updated when behavior or setup has changed.

## 2. Validate the API (`apps/api`)

``` bash
cd apps/api
```

Run these scripts in order.

### 2.1 Formatting

``` bash
npm run format:check
```

If formatting fails, apply the formatter and check again:

``` bash
npm run format
npm run format:check
```

### 2.2 Lint

``` bash
npm run lint
```

Fix lint errors rather than suppressing rules without a clear reason.

### 2.3 Type check

``` bash
npm run typecheck
```

This runs TypeScript with `tsc --noEmit`; it checks types without
producing build output.

### 2.4 Tests

``` bash
npm test
```

All tests must pass. Error-level log entries from tests deliberately
exercising error handling can be expected; check the test result rather
than treating every log line as a failure.

### 2.5 Production build

``` bash
npm run build
```

The API build must complete successfully.

Return to the repository root:

``` bash
cd ../..
```

## 3. Validate the Angular app (`apps/web`)

``` bash
cd apps/web
```

### 3.1 Formatting

``` bash
npm run format:check
```

If formatting fails:

``` bash
npm run format
npm run format:check
```

### 3.2 Lint

``` bash
npm run lint
```

### 3.3 Tests

``` bash
npm test -- --watch=false
```

The `--watch=false` flag makes the test command finish after the test
run, suitable for a pre-commit check.

### 3.4 Type check and production compilation

``` bash
npm run build
```

The Angular project uses its strict TypeScript and template compiler
checks as part of the Angular build. There is no separate `typecheck`
script for the web app; a successful production build is the
type/template compilation gate.

Return to the repository root:

``` bash
cd ../..
```

## 4. Re-check the complete change set

After formatting or fixing lint issues, inspect the changes again:

``` bash
git status --short
git diff --check
git diff
```

Make sure formatting did not introduce unrelated changes.

## 5. Stage and inspect what will be committed

Stage only the intended files. Prefer explicit paths when practical:

``` bash
git add <file-or-directory>
```

Inspect the staged changes:

``` bash
git status --short
git diff --cached --check
git diff --cached --stat
git diff --cached
```

Do not commit if the staged diff contains unrelated files, secrets,
local configuration, or generated artifacts.

## 6. Commit

Use a clear commit message that describes the change:

``` bash
git commit -m "type(scope): short description"
```

Examples:

``` bash
git commit -m "feat(web): add landing page"
git commit -m "fix(api): handle invalid request payload"
git commit -m "test(api): cover readiness failure"
git commit -m "docs: add pre-commit checklist"
```

Follow the repository's established commit-message convention if it
differs.

## 7. Verify the commit

``` bash
git status --short
git log -1 --oneline
```

The working tree should be clean unless you intentionally have other
uncommitted work.

## 8. Push and verify CI

``` bash
git push
```

For `main`, confirm that the GitHub Actions workflow completes
successfully. A local pass does not replace the remote CI result.

If CI fails: 1. Open the failed workflow job and identify the failing
step. 2. Reproduce the relevant command locally. 3. Fix the underlying
issue. 4. Re-run the applicable checks in this document. 5. Commit and
push the fix. 6. Confirm that the new CI run passes.

------------------------------------------------------------------------

## Quick command reference

Run from the repository root:

``` bash
# API
cd apps/api
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
cd ../..

# Angular
cd apps/web
npm run format:check
npm run lint
npm test -- --watch=false
npm run build
cd ../..

# Repository review
git diff --check
git status --short
git diff
```

After reviewing the full diff, stage the intended files, inspect the
staged diff, commit, push, and verify GitHub Actions.

## Important notes

-   Run `npm run format` only when needed; it modifies files. Use
    `npm run format:check` as the non-modifying verification step.
-   Do not skip a failing check just to make a commit. Understand and
    resolve the failure, or document an explicitly agreed temporary
    exception.
-   If a change affects both API and web, validate both applications.
-   If a change affects only one application, you may run that
    application's checks during iteration, but run the full sequence
    before merging or treating the change as release-ready.
-   Database migrations, environment-variable changes, deployment
    configuration, and security-sensitive changes need additional
    targeted review and verification.
-   Do not run production migrations as part of an ordinary local
    pre-commit routine.
