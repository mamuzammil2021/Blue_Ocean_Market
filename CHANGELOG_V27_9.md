# Blue Ocean Market V27.9.0

## Remaining Korean-screen leaks fixed

- Localized the exact English message in the unsaved-form dialog.
- Localized the Excavator dashboard live-data subtitle.
- Added Korean labels for Export Preparation, Shipped, On Hold, Cancelled, and the complete JavaScript-generated lifecycle/enum set.
- Added Korean coverage for dialogs, confirmation descriptions, success/error toasts, page descriptions, Finance controls, user controls, Buyer/Supplier actions, Meetings, Tasks, Reports, Documents, Restaurant actions, and machine workflows.
- Localized dynamic order, document, report-review, and supplier-loading message framing while preserving record identifiers and error details.
- Applied translation explicitly before inserting lifecycle and machine-stage values into dashboard HTML.
- Bumped browser asset identities to V27.9 so older cached V27.8 language files are not reused.

## Stronger release gate

- Added `qa/qa_v279_korean_runtime_complete.js`.
- The gate scans literal arguments passed to translation-aware functions such as titles, dialogs, confirmations, guards, and toasts.
- The gate scans JavaScript enum arrays and lifecycle label arrays that generate UI at runtime.
- The six phrases visible in the supplied screenshots are permanent regression samples.
- Generated dynamic message framing is tested separately from preserved user/business data.

## 남은 한국어 화면 누락 수정

- 저장되지 않은 양식 대화상자의 영어 메시지를 한국어로 변경했습니다.
- 굴착기 대시보드 부제와 수출 준비, 선적 완료, 보류, 취소 단계를 한국어로 변경했습니다.
- JavaScript에서 동적으로 생성되는 대화상자, 알림, 화면 설명, 상태 및 선택 레이블을 전반적으로 보강했습니다.
- 사용자/업무 데이터는 그대로 보존하면서 시스템 표현만 번역합니다.
