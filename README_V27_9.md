# Blue Ocean Market V27.9.0

## Complete Korean runtime coverage / 완전한 한국어 런타임 적용

V27.9 fixes the remaining English text reported on Korean screens and expands the release gate so the same class of problem cannot pass unnoticed again.

V27.9는 한국어 화면에서 보고된 남은 영어 문구를 수정하고, 동일한 유형의 문제가 다시 누락되지 않도록 릴리스 검증을 확장했습니다.

### Corrected examples / 수정된 예시

- Unsaved-form confirmation message / 저장되지 않은 양식 확인 메시지
- Excavator dashboard subtitle / 굴착기 대시보드 부제
- Export Preparation, Shipped, On Hold, and Cancelled lifecycle labels / 수출 준비, 선적 완료, 보류, 취소 수명주기 레이블
- Dialogs, confirmations, notifications, success messages, failure messages, screen descriptions, and JavaScript-generated enum labels / 대화상자, 확인, 알림, 성공 메시지, 실패 메시지, 화면 설명, JavaScript 생성 선택 레이블

### Language behavior / 언어 동작

- Korean remains the primary and default language.
- 한국어는 계속 주요 및 기본 언어입니다.
- English remains a complete selectable secondary language.
- 영어는 완전히 선택 가능한 보조 언어입니다.
- User-entered business data is never automatically translated.
- 사용자가 입력한 업무 데이터는 자동 번역하지 않습니다.

## Verification / 검증

```bash
npm run qa:current
```

The V27.9 gate validates 1,683 exact Korean phrases, 106 runtime patterns, every translation-aware JavaScript argument, enum/lifecycle arrays, the reported screenshot phrases, generated UI framing, receipts, PDFs, and all retained regression suites.

V27.9 검증은 1,683개의 정확한 한국어 문구, 106개의 런타임 패턴, 번역 대상 JavaScript 인자, 선택/수명주기 배열, 보고된 스크린샷 문구, 생성된 UI 표현, 영수증, PDF 및 모든 기존 회귀 테스트를 검증합니다.

## Start / 실행

```bash
npm install
npm start
```

After upgrading, restart the server and refresh the browser so the V27.9 cache-busted language files are loaded.

업그레이드 후 서버를 재시작하고 브라우저를 새로고침하여 V27.9 언어 파일을 불러오세요.
