BEGIN;

CREATE TABLE IF NOT EXISTS platform_community_preferences (
  id serial PRIMARY KEY,
  mentee_user_id integer NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  is_participating boolean NOT NULL DEFAULT false,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS platform_community_preferences_mentee_unique
  ON platform_community_preferences (mentee_user_id);

CREATE TABLE IF NOT EXISTS platform_community_raffle_winners (
  id serial PRIMARY KEY,
  week_key text NOT NULL,
  mentee_user_id integer NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
  entry_count integer NOT NULL,
  selected_at timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS platform_community_raffle_winners_week_mentee_unique
  ON platform_community_raffle_winners (week_key, mentee_user_id);

COMMIT;
