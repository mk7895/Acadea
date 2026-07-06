BEGIN;

ALTER TABLE mentee_profiles
  ADD COLUMN IF NOT EXISTS email_inbox_enabled boolean NOT NULL DEFAULT false;

ALTER TABLE mentee_profiles
  ADD COLUMN IF NOT EXISTS max_storage_mb integer NOT NULL DEFAULT 100;

ALTER TABLE mentee_profiles
  ALTER COLUMN max_active_guide_count SET DEFAULT 1;

ALTER TABLE mentee_profiles
  ALTER COLUMN max_hint_guide_count SET DEFAULT 1;

UPDATE mentee_profiles
SET
  max_active_guide_count = COALESCE(max_active_guide_count, 1),
  max_hint_guide_count = COALESCE(max_hint_guide_count, 1),
  max_storage_mb = COALESCE(max_storage_mb, 100),
  email_inbox_enabled = COALESCE(email_inbox_enabled, false);

ALTER TABLE platform_guides
  ADD COLUMN IF NOT EXISTS email_sender_domains jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS platform_products (
  id serial PRIMARY KEY,
  title text NOT NULL,
  slug text NOT NULL,
  summary text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  image_url text,
  stripe_price_id text,
  stripe_product_id text,
  currency text NOT NULL DEFAULT 'PLN',
  price_cents integer NOT NULL DEFAULT 0,
  product_type text NOT NULL DEFAULT 'bundle',
  is_package boolean NOT NULL DEFAULT false,
  guide_slot_delta integer NOT NULL DEFAULT 0,
  hint_slot_delta integer NOT NULL DEFAULT 0,
  storage_mb_delta integer NOT NULL DEFAULT 0,
  enables_email_inbox boolean NOT NULL DEFAULT false,
  mentor_user_id integer REFERENCES platform_users(id) ON DELETE SET NULL,
  included_product_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS platform_products_slug_unique
  ON platform_products(slug);

CREATE TABLE IF NOT EXISTS platform_popup_configs (
  id serial PRIMARY KEY,
  key text NOT NULL,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  primary_cta_label text NOT NULL DEFAULT 'Kup sugerowany pakiet',
  secondary_cta_label text NOT NULL DEFAULT 'Zobacz pakiety',
  recommended_product_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS platform_popup_configs_key_unique
  ON platform_popup_configs(key);

CREATE TABLE IF NOT EXISTS platform_cart_items (
  id serial PRIMARY KEY,
  user_id integer NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
  product_id integer NOT NULL REFERENCES platform_products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS platform_cart_items_user_product_unique
  ON platform_cart_items(user_id, product_id);

CREATE TABLE IF NOT EXISTS platform_university_emails (
  id serial PRIMARY KEY,
  mentee_user_id integer NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
  guide_id integer REFERENCES platform_guides(id) ON DELETE SET NULL,
  gmail_message_id text NOT NULL,
  thread_id text,
  from_email text NOT NULL DEFAULT '',
  subject text NOT NULL DEFAULT '',
  snippet text NOT NULL DEFAULT '',
  received_at timestamp NOT NULL,
  classification text NOT NULL DEFAULT 'info_only',
  action_required boolean NOT NULL DEFAULT false,
  action_summary text NOT NULL DEFAULT '',
  requires_manual_review boolean NOT NULL DEFAULT false,
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS platform_university_emails_gmail_message_unique
  ON platform_university_emails(gmail_message_id);

INSERT INTO platform_popup_configs (
  key,
  title,
  body,
  primary_cta_label,
  secondary_cta_label,
  recommended_product_ids,
  is_active
)
VALUES
  (
    'guide_limit',
    'Odblokuj więcej programów',
    'Wyczerpał się obecny limit aktywnych programów. Możesz dokupić kolejny pakiet i od razu zwiększyć limit.',
    'Kup sugerowany pakiet',
    'Zobacz pakiety',
    '[]'::jsonb,
    true
  ),
  (
    'hint_limit',
    'Odblokuj więcej wskazówek',
    'Masz już aktywne wskazówki dla maksymalnej liczby programów w obecnym planie. Możesz zwiększyć limit.',
    'Kup sugerowany pakiet',
    'Zobacz pakiety',
    '[]'::jsonb,
    true
  ),
  (
    'hint_locked',
    'Dodaj dostęp do wskazówek',
    'Ten program jest dodany, ale wskazówki nie są jeszcze aktywne. Możesz je odblokować odpowiednim pakietem.',
    'Odblokuj wskazówki',
    'Zobacz pakiety',
    '[]'::jsonb,
    true
  ),
  (
    'mentor_locked',
    'Dodaj dostęp do mentora',
    'Ten mentor nie jest jeszcze przypisany do Twojego konta. Możesz dokupić dostęp lub pakiet z mentoringiem.',
    'Dodaj mentora',
    'Zobacz pakiety',
    '[]'::jsonb,
    true
  ),
  (
    'email_locked',
    'Odblokuj maile od uczelni',
    'Ta funkcja analizuje maile z uczelni i pokazuje, co trzeba zrobić dalej. Dodaj ją do swojego pakietu, aby włączyć monitoring skrzynki.',
    'Odblokuj maile od uczelni',
    'Zobacz pakiety',
    '[]'::jsonb,
    true
  )
ON CONFLICT (key) DO UPDATE SET
  title = EXCLUDED.title,
  body = EXCLUDED.body,
  primary_cta_label = EXCLUDED.primary_cta_label,
  secondary_cta_label = EXCLUDED.secondary_cta_label,
  is_active = EXCLUDED.is_active,
  updated_at = now();

COMMIT;
