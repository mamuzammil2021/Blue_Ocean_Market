# Blue Ocean Market V27.8.0

## Korean-first correction / 한국어 우선 개선

- Changed browser, account migration, authentication token, API, receipt, and PDF defaults from English to Korean.
- 브라우저, 계정 마이그레이션, 인증 토큰, API, 영수증, PDF의 기본 언어를 영어에서 한국어로 변경했습니다.
- Added explicit-language tracking so later English selections are preserved instead of being reset by the Korean-first migration.
- 한국어 우선 마이그레이션 후에도 사용자가 명시적으로 선택한 영어가 유지되도록 언어 선택 추적을 추가했습니다.
- Made the login-page selection authoritative for the login being performed, then persisted it to the account.
- 로그인 페이지의 언어 선택을 해당 로그인에 우선 적용하고 계정에 저장하도록 개선했습니다.

## Complete runtime localization / 완전한 런타임 번역

- Added translation for dynamically added text nodes, progress labels, count/status combinations, role lines, Finance type/category combinations, table states, and approval/error messages.
- Added Korean patterns for system-generated Finance source labels and descriptions while preserving buyer names, asset numbers, supplier names, references, and user-entered text.
- Prevented translated dropdown labels from changing the canonical value submitted to the server.
- Added an explicit user-content boundary and a safe system-value allowlist for mixed system/business-data views.
- Added runtime missing-translation tracking for development diagnostics.

## Release protection / 릴리스 보호

- Added `qa/qa_v278_korean_first_complete.js`.
- The release gate now checks 1,451 exact phrases and 101 dynamic patterns, including the previously observed English leaks.
- Retained all V27.7, V27.6, V27.5, Meetings, legacy, and supplier-machine regression gates.
- Added `KOREAN_FIRST_DEVELOPMENT_POLICY.md` as the compulsory rule for all future work.
