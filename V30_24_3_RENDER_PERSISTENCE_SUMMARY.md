# V30.24.3 Git-ready Render Persistent Storage Summary

Functional baseline remains V30.24.3. This packaging variant prepares the repository for the paid Render web service with a persistent disk mounted at `/var/data`.

Persistent runtime locations:
- `/var/data/data/blue-ocean.sqlite` and SQLite WAL/SHM files
- `/var/data/data/backups/` for in-app database backups
- `/var/data/uploads/` for receipts, evidence, documents, attachments and generated PDFs

Safety additions:
- Render-aware storage resolver and startup preflight
- optional fail-fast check with `RENDER_REQUIRE_PERSISTENT_DISK=true`
- storage/mount/writability indicators in `/api/health`
- graceful SIGTERM/SIGINT SQLite checkpoint and close
- safe legacy SQLite backup/upload migration helper
- Git hygiene excluding databases, backups, uploads, node_modules and secrets
- deployment guide for existing Render service

QA:
- `npm run qa:current` PASS
- `npm run qa:render` PASS
- storage-check local and Render-path simulation PASS
