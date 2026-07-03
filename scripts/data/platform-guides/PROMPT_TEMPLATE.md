Return only valid JSON matching `scripts/data/platform-guides/schema.json`.

Goal:
Create an ACADEA platform university guide blueprint that can be imported into the admin panel ecosystem.

Rules:
- Output strict JSON only.
- Use Polish for user-facing content unless the original application question must stay in English.
- Include one main `guide`.
- Add `itemGuides` only when an item needs extra hints in the platform.
- Add `materialTemplates` that separate common documents from essays/tasks when appropriate.
- For every material row:
  - use `check_only` for actions that should only be ticked off,
  - use `file_required` for mandatory uploads,
  - use `check_or_file` when a requirement can be satisfied either by proof upload or by simple confirmation,
  - use `file_or_doc` when the mentee may either upload a file or create a tab in the shared Essay Doc.
- For `file_or_doc` rows, provide `docTabTitle` and a useful `docTabPrompt`.
- Put alternative fulfilment paths into `alternativeOptions`.
- Keep checklist items operational and concise.
- Keep guide descriptions practical, not marketing-heavy.

Quality bar:
- Be specific about required documents and tasks.
- Avoid placeholders like “add something here”.
- Prefer concrete filenames such as `passport.pdf`, `cv.pdf`, `essay-1.pdf`.
