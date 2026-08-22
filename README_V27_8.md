# Blue Ocean Market V27.8.0

## Korean-first behavior / 한국어 우선 동작

- Korean is the primary and default language for new browsers, inherited accounts, server responses, receipts, and generated Excavator sale PDFs.
- 한국어는 새 브라우저, 기존 계정, 서버 응답, 영수증, 생성된 굴착기 판매 PDF의 기본 언어입니다.
- English remains a complete selectable language before login, in the header, and in My Profile.
- 영어는 로그인 전, 헤더, 내 프로필에서 선택할 수 있는 완전한 보조 언어입니다.
- The pre-login selection is saved to the authenticated account, and a user's explicit selection is respected on later logins.
- 로그인 전 선택한 언어는 계정에 저장되며, 사용자가 명시적으로 선택한 언어는 다음 로그인에서도 유지됩니다.

## Localization coverage / 번역 범위

V27.8 covers navigation, dashboards, forms, field labels, dropdown labels, statuses, roles, business-unit labels, dialogs, validation and API errors, progress states, notifications, finance-generated descriptions and source labels, receipts, and PDFs.

V27.8은 탐색, 대시보드, 폼, 필드 레이블, 드롭다운 레이블, 상태, 역할, 사업부 표시, 대화상자, 유효성 검사 및 API 오류, 진행 상태, 알림, 재무 시스템 설명과 출처 레이블, 영수증, PDF를 포함합니다.

System framing is translated while user/business data is preserved. Names, free-text notes, references, serial numbers, machine models, counterparties, file names, and document content are never automatically translated.

시스템 표현만 번역하고 사용자 및 업무 데이터는 보존합니다. 이름, 자유 메모, 참조, 일련번호, 장비 모델, 거래처, 파일명, 문서 내용은 자동 번역하지 않습니다.

## Start / 실행

```bash
npm install
npm start
```

Open `http://localhost:3000`.

Administrator credentials must be supplied securely through environment variables before first startup. / 최초 시작 전에 관리자 자격 증명을 환경 변수로 안전하게 설정해야 합니다.

## Verification / 검증

```bash
npm run qa:current
```

The V27.8 gate verifies 1,451 exact Korean phrases, 101 dynamic runtime patterns, Korean defaults and preference precedence, stable stored dropdown values, dynamic DOM text, protected user content, server errors, receipts, PDF language handling, and all retained regression suites.

V27.8 검증은 1,451개의 정확한 한국어 문구, 101개의 동적 런타임 패턴, 한국어 기본값과 선호 순서, 안정적인 드롭다운 저장값, 동적 DOM 텍스트, 보호된 사용자 데이터, 서버 오류, 영수증, PDF 언어 처리 및 기존 회귀 테스트를 검증합니다.
