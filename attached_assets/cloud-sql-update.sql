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

BEGIN;

ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS translation_key text;

UPDATE articles
SET translation_key = slug
WHERE translation_key IS NULL OR btrim(translation_key) = '';

ALTER TABLE articles
  ALTER COLUMN translation_key SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS articles_translation_language_unique
  ON articles(translation_key, language);

COMMIT;

BEGIN;

ALTER TABLE article_category_groups
  ADD COLUMN IF NOT EXISTS name_en text;

ALTER TABLE article_categories
  ADD COLUMN IF NOT EXISTS name_en text;

UPDATE article_category_groups
SET name_en = CASE slug
  WHEN 'etap-aplikacji' THEN 'Application stage'
  WHEN 'kraje' THEN 'Countries'
  WHEN 'kierunki' THEN 'Subjects'
  WHEN 'finansowanie' THEN 'Funding'
  ELSE COALESCE(name_en, name)
END
WHERE name_en IS NULL OR btrim(name_en) = '';

UPDATE article_categories
SET name_en = CASE slug
  WHEN 'strategia' THEN 'Strategy and fit'
  WHEN 'dokumenty' THEN 'Documents'
  WHEN 'terminy' THEN 'Deadlines'
  WHEN 'eseje-i-listy' THEN 'Essays and letters'
  WHEN 'egzaminy' THEN 'Exams'
  WHEN 'rekomendacje' THEN 'Recommendations'
  WHEN 'common-app' THEN 'Common App'
  WHEN 'mentoring' THEN 'Mentoring'
  WHEN 'dla-rodzicow' THEN 'For parents'
  WHEN 'europa' THEN 'Europe'
  WHEN 'usa' THEN 'USA'
  WHEN 'wielka-brytania' THEN 'United Kingdom'
  WHEN 'holandia' THEN 'Netherlands'
  WHEN 'niemcy' THEN 'Germany'
  WHEN 'hiszpania' THEN 'Spain'
  WHEN 'wlochy' THEN 'Italy'
  WHEN 'dania' THEN 'Denmark'
  WHEN 'szwecja' THEN 'Sweden'
  WHEN 'kanada' THEN 'Canada'
  WHEN 'ekonomia' THEN 'Economics and business'
  WHEN 'prawo' THEN 'Law'
  WHEN 'psychologia' THEN 'Psychology'
  WHEN 'medycyna' THEN 'Medicine'
  WHEN 'informatyka' THEN 'Computer science'
  WHEN 'koszty' THEN 'Tuition and costs'
  WHEN 'stypendia' THEN 'Scholarships'
  WHEN 'financial-aid' THEN 'Financial aid'
  WHEN 'darmowe-studia' THEN 'Tuition-free study'
  ELSE COALESCE(name_en, name)
END
WHERE name_en IS NULL OR btrim(name_en) = '';

COMMIT;
