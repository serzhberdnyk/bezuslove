# Bezuslove

Personal Bezuslove website, logical version 0.8.0. This source snapshot is derived from Sites version 21, source commit `0fd66b0f91c4766f65552b02e971e12e092bf9aa` (source tree `3799e1ee4db27047d1ac40432ed9d7e7d12feaf3`).

The published source snapshot is a separate artifact from the running website. A GitHub update does not deploy Sites or change production data.

## Contents

* `public/`: Russian and English pages, CSS, browser scripts, and existing site assets.
* `scripts/build-worker.py`: standard-library Python builder for the static Worker bundle.
* `tests/`: page, locale, redirect, support-link, and historical QR contracts.
* `.openai/hosting.json`: original Sites project identifier, without access credentials.

There are no npm packages to install for the build. Use Python 3 and Node.js for the JavaScript tests. Validation used Python 3.12.14 and Node.js 24.15.0.

## Local build and checks

Run from this repository directory, with Python UTF-8 mode enabled on Windows:

```text
python -X utf8 scripts/build-worker.py
node tests/redirect-contract.mjs
node tests/locale-selection.mjs
python -X utf8 tests/support-links-contract.py
```

The builder recreates `dist/` locally. That generated directory is ignored and is not part of this source release. These checks make no production writes.

Two portability changes normalize filesystem paths to URL slashes in the builder and redirect test. All original website files and assets retain their source snapshot bytes.

## Historical checks and limits

`tests/english-contract.py` expects an older Git commit, which is intentionally absent from this clean history. `tests/qr-contract.py` requires Pillow, the Linux ZBar library, and supplied rendered QR images. Neither historical check was run for this candidate. The existing QR SVG is retained byte-for-byte; do not log its decoded payload.

The completed checks cover the local build, asset routing, locale selection, support links, and a bounded heuristic text and image-metadata review. They are not an exhaustive security proof. No browser visual QA or fresh QR decoding was performed.

## Source and update process

The current source of truth is the approved Sites source commit, not the default branch of the older `bezuslove-source` repository. That older repository contains unrelated historical RA content and must not be merged into this source release.

For each update, record the approved Sites version and exact source commit, export the intended file allowlist into an isolated directory, review the diff and asset rights, run these checks, and scan the final staged files. Obtain review for the exact candidate commit before pushing only its selected branch. Keep generated bundles, credentials, private imports, databases, and operational backups excluded. A source update and a site deployment are separate decisions. Automatic synchronization is not configured.

## Licensing and assets

No project-wide open-source license is granted by this snapshot. Existing photographs, illustrations, service-card images, brand assets, and donation QR remain separately subject to their owners' rights. Availability on the live website alone does not establish redistribution permission. Confirm rights before publishing or reusing those assets.
