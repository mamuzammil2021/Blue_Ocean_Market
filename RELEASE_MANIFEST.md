# V30.69.40 release manifest

Release class: Tabler UI engineering staging candidate. Feature branch: `feature/v30.69.40-tabler-ui-completion`. No main branch changes, remote push or production deployment.

Protected source: `Blue_Ocean_Market_V30_69_39_OCT20_QA_PURCHASE_CART_GIT_READY.zip`, verified as the newest Library candidate before edits. Source SHA256: `4bfbd4101c96f5ae16a5b143688f0692a1ed167b8e4c6eaa8e11486a64776f9b` (6,054,038 bytes; 1,062 ZIP entries; integrity check passed).

Supplied Tabler source: `tabler-dev.zip`, SHA256 `b0b23e850adf705853bbfb2bc0c4fc4cca6b0ce58e9708cebdab506431248d3c` (47,114,372 bytes; 3,266 ZIP entries; integrity check passed). Core package declares 1.7.0/MIT. Selected source hashes and licenses are vendored; source and dependencies are pinned.

Brief text SHA256: `1f3a1267e7e6cfebfd4c2585009088fe6e967eb28c636cc6a7081f79be5a31f6`. DOCX SHA256: `e4148528f55af88ba856eeefc2619079a506d0aa55a358d76c0fdecb0a499973`. Both were read completely.

Runtime prerequisite: Node 22. Current package/lock/compiled frontend manifest version: 30.69.40. Build entry: npm run build:ui. Current acceptance runner: npm run qa:current. New code is isolated to presentation/build/QA; server JS and database schema logic are preserved byte-for-byte. See deployment notes for install-host limitations and PDF prerequisites.

Archives exclude .git, node_modules, .env/secrets, runtime databases/uploads, caches, scratch toolchains/fonts/browsers and screenshots. Screenshots are in a separate QA evidence ZIP. An outer SHA256SUMS.txt accompanies both archives. Historical documentation inside this inherited repository remains historical and does not supersede the current release notes.
