ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'pl';

UPDATE articles
SET language = 'pl'
WHERE language IS NULL OR language = '';

