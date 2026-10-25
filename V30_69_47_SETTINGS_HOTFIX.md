# V30.69.47 Settings entry hotfix

The previous settings-shell wrapper inserted the Receiving & Claims Policy button before its asynchronous render completed; rendering erased the button. The normal settings entry also bypassed that wrapper. The button now renders inside the completed System Settings layout for CEO / Owner, using the same renderer for menu, refresh, scope change and routed entry. The obsolete wrapper is removed. EN/KR labels remain localized; the actual policy and accounting rules are unchanged. Browser asset URLs are refreshed.

After deployment: sign in as CEO / Owner, select Pink Salt, open System Settings, click Receiving & Claims Policy, then Apply Approved Workbook Settings and authorize. The direct route is #systemSettings/receiving-policy?unit=YOUR_PINK_SALT_UNIT_ID.

Targeted browser check: qa/modernization/receiving47-settings.cjs covers menu visibility, duplicate prevention, refresh, opening the policy action, deep-route refresh and Korean labels. Full V47 verification remains documented separately; this hotfix changes navigation only. Preserve existing environment, database and persistent disk. No accounting workbook changes are needed.
