CREATE TABLE IF NOT EXISTS "users" (
  "id" UUID NOT NULL PRIMARY KEY,
  "name" varchar NOT NULL,
  "role" text NOT NULL,
  "email" varchar NOT NULL UNIQUE,
  "password_hash" varchar NOT NULL
);

CREATE TABLE IF NOT EXISTS "refresh_tokens"(
  "user_id" UUID NOT NULL UNIQUE,
  "token" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "hackathons" (
  "id" UUID NOT NULL PRIMARY KEY,
  "title" varchar NOT NULL,
  "description" text,
  "status" text NOT NULL,
  "starts_at" TIMESTAMPTZ NOT NULL,
  "ends_at" TIMESTAMPTZ NOT NULL,
  "registration_opens_at" TIMESTAMPTZ,
  "registration_closes_at" TIMESTAMPTZ,
  "min_team_size" INT NOT NULL DEFAULT 1,
  "max_team_size" INT NOT NULL DEFAULT 5,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

