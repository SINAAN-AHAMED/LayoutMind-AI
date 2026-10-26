# Publish LayoutMind to an existing GitHub repository

This uses `git init` and `git fetch`, with no `git clone` command. Fetching the target branch supplies the existing history needed for a normal pull request.

## Before starting

- Install Git and the GitHub CLI (`gh`): https://git-scm.com/downloads and https://cli.github.com/.
- Extract this complete project ZIP. The application root is `LayoutMind-Studio-2026.10.25.3`, containing `start.py`, `frontend`, and `softcomputing-service`.
- Replace `FRIEND/REPO` with the existing repository owner/name. Replace `main` with the intended target branch if different.
- Choose a new branch name if `layoutmind/studio-update` already exists.
- Keep the existing repository's license and ownership files. The supplied README contains the requested copyright notice. The uploaded project already included a GPL-3.0 LICENSE; it and all third-party notices are retained.

The commands work in macOS Terminal and Windows PowerShell. Run them in order, checking each result before continuing.

## 1. Sign in

```bash
gh auth login
gh auth setup-git
gh repo view FRIEND/REPO --json defaultBranchRef --jq .defaultBranchRef.name
```

Choose GitHub.com, HTTPS, and browser sign-in when prompted. The last command prints the default branch; use the agreed PR target branch below.

If Git has no author configured, set it for the new working repository after the next step:

```bash
git config user.name "YOUR NAME"
git config user.email "YOUR VERIFIED OR GITHUB NOREPLY EMAIL"
```

## 2A. If your friend gave you push access

Start from a new, empty folder. Do this **before** copying project files, to avoid checkout conflicts with untracked files.

```bash
mkdir LayoutMind-publish
cd LayoutMind-publish
git init
git remote add origin https://github.com/FRIEND/REPO.git
git fetch origin main
git switch --no-track -c layoutmind/studio-update FETCH_HEAD
```

Continue with step 3. Use the direct-access commands in steps 4 and 5.

## 2B. If you do not have push access

Create a fork on GitHub without cloning it:

```bash
gh repo fork FRIEND/REPO --clone=false --remote=false
mkdir LayoutMind-publish
cd LayoutMind-publish
git init
git remote add upstream https://github.com/FRIEND/REPO.git
git remote add origin https://github.com/YOUR_USERNAME/REPO.git
git fetch upstream main
git switch --no-track -c layoutmind/studio-update FETCH_HEAD
```

Use the actual fork name printed by GitHub if it differs from `YOUR_USERNAME/REPO`. Private repositories may require your friend's permission or organization policy changes to allow forks. If forking is unavailable, your friend needs to grant branch push access.

## 3. Copy the project into this branch

Open `LayoutMind-publish` in Finder or File Explorer. Copy the **contents** of your latest complete LayoutMind source directory into it. For an application stored at the repository root, `start.py`, `frontend`, and `softcomputing-service` should sit directly inside `LayoutMind-publish`, not inside an extra versioned ZIP folder. If the existing repo uses a subdirectory for the app, keep that structure instead.

This ZIP already contains the updated README, screenshot images, publishing guide, and PR template. Copy all project contents, including hidden `.gitignore` and `.github` entries. Keep screenshot paths together with the README. Preview the README on GitHub after pushing.

Include the complete source, dependency manifests and lockfiles, tests, local assets, launchers, and the release's bundled frontend so `start.py` still works without a development build. Preserve existing repo-only files. Deliberately remove any obsolete app files that the new version replaces; simply overlaying a ZIP cannot identify those deletions.

Do not copy a source `.git` directory, `.venv`, `venv`, `node_modules`, caches, private `.env` files, credentials, or nested ZIPs. Finder may hide dotfiles: use `Cmd+Shift+.` to see them. On Windows enable hidden items. Merge any existing repository-specific ignore rules with the included `.gitignore` files. Keep the explicit `frontend/dist` exceptions: the bundled browser launcher depends on those files being committed.

After copying, the project's `MANIFEST.sha256.json` describes the ZIP contents; regenerate it if you intentionally change those files. The supplied `docs/GITHUB_PREPARATION.md` records the packaging checks.

Validate the application in this folder using `python3.12 start.py` on macOS or `py -3.12 start.py` on Windows, plus the development checks documented in the README when available.

## 4. Review, commit, and push

```bash
git status --short
git add -A
git diff --cached --stat
git diff --cached --check
git diff --cached
```

Review the staged files, including added images and removals. If the preview opens a pager, press `q` to exit. Then:

```bash
git commit -m "Update LayoutMind Studio and project documentation"
git push -u origin layoutmind/studio-update
```

Only the new branch is pushed. Do not use a force push or push to the target branch.

## 5. Open the pull request

**Direct push access:**

```bash
gh pr create --repo FRIEND/REPO --base main --head layoutmind/studio-update --title "Update LayoutMind Studio" --web
```

**Through your fork:**

```bash
gh pr create --repo FRIEND/REPO --base main --head YOUR_USERNAME:layoutmind/studio-update --title "Update LayoutMind Studio" --web
```

The browser opens the pull-request form. Describe the actual changes and checks you ran, review the changed files, then click **Create pull request**. GitHub may report merge conflicts if the target branch changed; resolve them before merging. Your friend can review and merge the PR.

## Common issues

| Message / situation | Next step |
| --- | --- |
| `gh` or `git` not found | Install the missing tool and reopen the terminal. |
| `Permission denied` or HTTP 403 on push | Check the signed-in account; use the fork route or ask your friend for collaborator access. |
| `couldn't find remote ref main` | Check the target branch using `gh repo view`; replace `main` in the fetch and PR commands. |
| `Author identity unknown` | Set repository-local `user.name` and `user.email`, then retry the commit. |
| `nothing to commit` | Check that the latest project contents were copied into the correct working folder. |
| GitHub says there is nothing to compare | Confirm that files changed and the new branch was pushed; use the correct `--head`, including your username for a fork. |
| Push rejected for an oversized file | Remove generated archives or dependencies from the commit; large required assets may need Git LFS. Recommit before retrying. |
| README images are broken | Ensure `docs/images` was committed alongside the README with the same names and capitalization. |

## Command references

- https://git-scm.com/docs/git-fetch
- https://git-scm.com/docs/git-switch
- https://cli.github.com/manual/gh_repo_fork
- https://cli.github.com/manual/gh_pr_create
