ALTER TABLE bom.users ADD COLUMN IF NOT EXISTS must_change_password integer NOT NULL DEFAULT 0;
