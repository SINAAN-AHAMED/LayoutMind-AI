# GitHub preparation — 26 October 2026

Application release: **2026.10.25.3**. This packaging revision updates documentation and Git ignore rules; the application revision is unchanged.

## Included changes

- Replaced the root README with an app overview, four selected screenshots, feature table, launch commands, workflow, development steps, troubleshooting, and the requested copyright notice.
- Preserved the previous complete README as `docs/USER_GUIDE.md`.
- Added `PUBLISHING.md` with no-clone branch and pull-request commands for direct access and forks.
- Added a concise GitHub pull-request template.
- Corrected root and frontend ignore rules so the Python launcher's prebuilt `frontend/dist` is committed. Dependency directories, local environments, caches, and private environment settings remain ignored.
- Retained the original GPL LICENSE and third-party notices. The new copyright notice does not replace the supplied licensing terms.
- Refreshed the ZIP integrity manifest to include the documentation changes.

## Checks performed for this package

- Verified every one of the original 274 manifest entries against the uploaded archive.
- Compared every original file after preparation: only the root README and two ignore files changed; application code, tests, dependency locks, local assets, existing licenses, and production frontend bytes were preserved.
- Exercised real Git staging and confirmed all 57 production frontend files and README screenshots are included; dependency and private environment paths remain ignored.
- Checked local README links, exact copyright wording, ZIP CRC, complete manifest coverage, and every packaged SHA-256 entry.
- Previously exercised the documented init/fetch/switch/commit/push sequence against a local test remote; shared history and existing repository files were preserved.

The application test suite and native macOS/Windows GUI flows were not rerun for this documentation-only preparation. Recorded application validation remains in `VALIDATION.md`.
