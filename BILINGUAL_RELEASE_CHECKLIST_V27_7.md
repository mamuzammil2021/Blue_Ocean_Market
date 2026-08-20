# Compulsory Bilingual Release Checklist

Before every future build:

1. Add every new static system phrase in English and Korean.
2. Add a Korean runtime pattern for any phrase containing names, dates, counts, amounts, statuses, or record IDs.
3. Verify the screen in both language selections, including empty, error, loading, and permission-denied states.
4. Verify dialogs, notifications, receipts, PDFs, placeholders, titles, and accessibility labels.
5. Keep user-entered names, notes, references, and uploaded content unchanged.
6. Keep stored role, status, and workflow values language-neutral; translate only their display labels.
7. Run `npm run qa:current` and do not package the release unless every suite passes.

