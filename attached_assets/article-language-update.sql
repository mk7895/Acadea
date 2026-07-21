ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'pl';

UPDATE articles
SET language = 'pl'
WHERE language IS NULL OR language = '';

ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS translation_key text;

UPDATE articles
SET translation_key = slug
WHERE translation_key IS NULL OR btrim(translation_key) = '';

ALTER TABLE articles
  ALTER COLUMN translation_key SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS articles_translation_language_unique
  ON articles(translation_key, language);
