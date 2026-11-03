# V30.70.3 Git ready source

This package is based directly on V30.70.2 and contains the November 2 QA fixes. See RELEASE_NOTES.md and QA_NOV2_703.md.

Install dependencies with npm ci under Node 22. Reuse the existing PostgreSQL environment. Startup applies migration 011 automatically; no additional environment variables are required. Keep a database backup before any hosted upgrade. Migrations 001–010 remain unchanged.

The release has not been pushed to Git or deployed. When pushing is authorized, use a new branch; do not pull or merge unless separately instructed.
