# Korean-First Bilingual Development Policy

# 한국어 우선 이중 언어 개발 정책

This policy is compulsory for every future Blue Ocean Market change.

이 정책은 향후 모든 Blue Ocean Market 변경에 필수로 적용됩니다.

1. Korean is the primary/default language. English is a compulsory, complete secondary language.
   한국어는 주요/기본 언어이고, 영어는 반드시 완전히 제공해야 하는 보조 언어입니다.
2. Every new system-managed string must have both Korean and English before merge.
   새로운 모든 시스템 문구는 병합 전에 한국어와 영어를 모두 제공해야 합니다.
3. This includes screens, menus, forms, placeholders, tooltips, accessibility labels, loading/empty/error states, API errors, dialogs, confirmations, notifications, emails, exports, receipts, and PDFs.
   화면, 메뉴, 폼, 플레이스홀더, 툴팁, 접근성 레이블, 로딩/빈 화면/오류 상태, API 오류, 대화상자, 확인, 알림, 이메일, 내보내기, 영수증, PDF를 포함합니다.
4. Store stable canonical values for roles, statuses, types, categories, and workflow keys. Translate only their display labels.
   역할, 상태, 유형, 분류, 워크플로 키는 안정적인 표준값으로 저장하고 표시 레이블만 번역합니다.
5. Use semantic message keys or tested runtime patterns for text containing names, counts, amounts, dates, statuses, or IDs.
   이름, 개수, 금액, 날짜, 상태, ID가 포함된 문구는 의미 기반 메시지 키 또는 테스트된 런타임 패턴을 사용합니다.
6. Never automatically translate user-entered/business content, including names, notes, references, models, serials, counterparties, filenames, and document bodies.
   이름, 메모, 참조, 모델, 일련번호, 거래처, 파일명, 문서 본문 등 사용자/업무 내용은 자동 번역하지 않습니다.
7. Test both languages across desktop and mobile layouts, including all permission, validation, and failure paths.
   모든 권한, 유효성 검사, 실패 경로를 포함하여 데스크톱과 모바일 레이아웃에서 두 언어를 모두 테스트합니다.
8. A release must fail when either language is missing. Run `npm run qa:current` and package only after every gate passes.
   두 언어 중 하나라도 누락되면 릴리스를 실패 처리합니다. `npm run qa:current`를 실행하고 모든 검증을 통과한 후에만 패키지합니다.
9. QA must scan JavaScript arguments and enum/lifecycle arrays that generate visible UI, not only static HTML text.
   QA는 정적 HTML 텍스트뿐만 아니라 표시 UI를 생성하는 JavaScript 인자와 선택/수명주기 배열도 검사해야 합니다.
