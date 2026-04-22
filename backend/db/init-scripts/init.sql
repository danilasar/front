-- Удаляем старые таблицы для чистой инициализации (в рамках разработки)
DROP TABLE IF EXISTS "invitations";
DROP TABLE IF EXISTS "team_members";
DROP TABLE IF EXISTS "teams";
DROP TABLE IF EXISTS "form_fields";
DROP TABLE IF EXISTS "hackathon_organizers";
DROP TABLE IF EXISTS "hackathons";
DROP TABLE IF EXISTS "refresh_tokens";
DROP TABLE IF EXISTS "users";

CREATE TABLE "users" (
  "id" UUID NOT NULL PRIMARY KEY,
  "full_name" varchar NOT NULL,
  "email" varchar NOT NULL UNIQUE,
  "role" text NOT NULL,
  "password_hash" varchar NOT NULL,
  "education" varchar,
  "course" varchar,
  "phone" varchar,
  "telegram" varchar,
  "vk" varchar,
  "food_allergies" text,
  "tshirt_size" varchar,
  "avatar_file_id" UUID,
  "profile_fields" JSONB DEFAULT '{}',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "refresh_tokens"(
  "user_id" UUID NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
  "token" text NOT NULL
);

CREATE TABLE "hackathons" (
  "id" UUID NOT NULL PRIMARY KEY,
  "title" varchar NOT NULL,
  "description" text,
  "status" text NOT NULL DEFAULT 'draft',
  "starts_at" TIMESTAMPTZ NOT NULL,
  "ends_at" TIMESTAMPTZ NOT NULL,
  "registration_opens_at" TIMESTAMPTZ,
  "registration_closes_at" TIMESTAMPTZ,
  "min_team_size" INT NOT NULL DEFAULT 1,
  "max_team_size" INT NOT NULL DEFAULT 5,
  "rules_file_id" UUID,
  "hero_title" varchar,
  "hero_subtitle" varchar,
  "cover_file_id" UUID,
  "landing_content" text,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "hackathon_organizers" (
  "hackathon_id" UUID NOT NULL REFERENCES "hackathons"("id") ON DELETE CASCADE,
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  PRIMARY KEY ("hackathon_id", "user_id")
);

CREATE TABLE "form_fields" (
  "id" UUID NOT NULL PRIMARY KEY,
  "hackathon_id" UUID NOT NULL REFERENCES "hackathons"("id") ON DELETE CASCADE,
  "scope" text NOT NULL, -- profile, team, feedback
  "key" varchar NOT NULL,
  "label" varchar NOT NULL,
  "description" text,
  "type" text NOT NULL,
  "required" boolean NOT NULL DEFAULT false,
  "visible" boolean NOT NULL DEFAULT true,
  "field_order" INT NOT NULL DEFAULT 0,
  "options" JSONB, -- для select/radio
  "validation" JSONB,
  UNIQUE("hackathon_id", "scope", "key")
);

CREATE TABLE "teams" (
  "id" UUID NOT NULL PRIMARY KEY,
  "hackathon_id" UUID NOT NULL REFERENCES "hackathons"("id") ON DELETE CASCADE,
  "name" varchar NOT NULL,
  "status" text NOT NULL DEFAULT 'draft',
  "fields" JSONB DEFAULT '{}',
  "submitted_at" TIMESTAMPTZ,
  "moderation_reason" text,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "team_members" (
  "id" UUID NOT NULL PRIMARY KEY,
  "team_id" UUID NOT NULL REFERENCES "teams"("id") ON DELETE CASCADE,
  "user_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "full_name" varchar NOT NULL,
  "email" varchar,
  "role" text NOT NULL DEFAULT 'member', -- member, captain
  "status" text NOT NULL DEFAULT 'active', -- active, pending_invitation, disqualified
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "invitations" (
  "id" UUID NOT NULL PRIMARY KEY,
  "token" varchar NOT NULL UNIQUE,
  "team_member_id" UUID NOT NULL REFERENCES "team_members"("id") ON DELETE CASCADE,
  "expires_at" TIMESTAMPTZ NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
