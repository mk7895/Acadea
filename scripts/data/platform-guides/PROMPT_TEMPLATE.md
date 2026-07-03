Return only valid JSON matching `scripts/data/platform-guides/schema.json`.

Goal:
Create an ACADEA platform university guide blueprint that can be imported into the admin panel ecosystem.

Rules:
- Output strict JSON only.
- Use Polish for user-facing content unless the original application question must stay in English.
- Include one main `guide`.
- Add `itemGuides` only when an item needs extra hints in the platform.
- Add `materialTemplates` that separate common documents from essays/tasks when appropriate.
- If a new guide should extend an existing shell tile already present in the platform, set `targetTemplateTitle` to that exact tile name and set `mergeMode` to `append` instead of creating a new tile.
- If you only want to attach an existing tile to a new guide, you may use `targetTemplateTitle` + `mergeMode: "append"` + `appliesToGuideSlugs` with empty `rows`.
- For every material row:
  - use `check_only` for actions that should only be ticked off,
  - use `file_required` for mandatory uploads,
  - use `check_or_file` when a requirement can be satisfied either by proof upload or by simple confirmation,
  - use `file_or_doc` when the mentee may either upload a file or create a tab in the shared Essay Doc.
- For `file_or_doc` rows, provide `docTabTitle` and a useful `docTabPrompt`.
- By default leave `sourceDocumentId` and `sourceTabId` empty so the row uses plain text as the initial tab content.
- If a new row should land between existing rows in a tile, set `insertAfterTask` to the exact visible task label after which it should be inserted.
- If a `file_or_doc` row should reuse an existing admin Google Docs tab template, set `sourceDocumentId` and `sourceTabId`. Otherwise leave them empty and use `docTabPrompt`.
- Put alternative fulfilment paths into `alternativeOptions`.
- Keep checklist items operational and concise.
- Keep guide descriptions practical, not marketing-heavy.

Quality bar:
- Be specific about required documents and tasks.
- Avoid placeholders like “add something here”.
- Prefer concrete filenames such as `passport.pdf`, `cv.pdf`, `essay-1.pdf`.
