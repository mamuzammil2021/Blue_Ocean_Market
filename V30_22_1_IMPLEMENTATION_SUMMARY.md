# Blue Ocean Market V30.22.1 — Implementation Summary

V30.22.1 is a targeted regression and attachment-integrity hotfix built on V30.22.0.

## Fixed

1. Phone and email validation ownership is now isolated so legacy V30.20 listeners cannot reinterpret the V30.21 international-phone local input as an email field.
2. Public authentication forms remain excluded from business duplicate-contact checks.
3. Toast/action feedback is rendered above modal, confirmation and processing layers.
4. Non-count numeric fields use flexible browser stepping, allowing `100000` as well as manually entered decimals. Discrete count fields remain integer-step controls.
5. Attachment helper text derives the limit from the actual control: a non-`multiple` field reports and enforces one file.
6. New uploads retain their original file extension in storage and the server never transforms the uploaded bytes.
7. `attachment_file_registry` records original name, extension, MIME, byte size and SHA-256; existing document metadata is backfilled where available.
8. Authenticated attachment metadata/view/download routes restore original filenames and use authoritative MIME types.
9. Browser preview uses MIME metadata; unsupported office/file formats show a clean Download Original fallback.

The standing UI rule remains unchanged: short focused actions may use dialogs; heavy multi-section workflows should progressively move to dedicated screens in a later UI-architecture release.


## Verification

Source/regression QA passes **290/290**. Dependency-backed runtime smoke is not claimed: `npm ci` timed out in the build container, so `npm run qa:runtime` must be rerun on the target Mac/environment.
