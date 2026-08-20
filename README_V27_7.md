# Blue Ocean Market V27.7.0

V27.7.0 is the complete English/Korean localization release of the Blue Ocean Market Management OS.

## Language behavior

- English remains the initial default for a new browser or account.
- English and Korean can be selected before login, in the application header, or in My Profile.
- The selected language is saved in the browser and on the user's account.
- All system-managed interface text, navigation, forms, dialogs, statuses, alerts, validation messages, notification text, receipts, and Excavator sale reports follow the selected language.
- User-entered names, notes, references, and business documents remain exactly as entered.
- Korean screens use a Korean-readable font stack, correct word wrapping, and Korean locale number formatting.

## Compulsory bilingual development rule

Every new system-managed phrase must be delivered in both English and Korean. Add the English source phrase and its Korean translation to the locale catalog, and add a tested dynamic pattern when the phrase contains runtime values. The V27.7 localization QA gate must pass before a release is packaged.

Run the complete release checks with:

```bash
npm run qa:current
```

## Start

```bash
npm install
npm start
```

Open `http://localhost:3000`.

Demo administrator: `admin@blueocean.local` / `Admin@123`

## Data and generated files

- Application data remains under `data/`.
- Uploaded documents and generated sale PDFs remain under `uploads/`.
- V27.7 does not silently repair business records. The existing read-only data-integrity checks remain available from the CEO dashboard.

