# Git-ready package

Release baseline: **V30.24.3**.

This package is safe to place at the root of the existing Blue Ocean Market Git repository. It excludes runtime databases, uploaded company files, `node_modules`, `.env`, secrets and local caches.

Render persistence additions in this Git-ready variant:
- automatic Render storage defaults under `/var/data`
- persistent-disk startup preflight
- public health indicators for disk/storage status
- graceful SQLite WAL checkpoint/close on SIGTERM/SIGINT
- optional storage migration/check scripts
- Render deployment guide and Blueprint example
- stronger Git ignore rules for database backups/WAL/uploads
