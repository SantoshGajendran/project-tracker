-- Drop NOT NULL constraint on password column
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;

-- Add OAuth2 fields
ALTER TABLE users ADD COLUMN auth_provider VARCHAR(20) DEFAULT 'LOCAL';
ALTER TABLE users ADD COLUMN provider_id VARCHAR(255);
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
