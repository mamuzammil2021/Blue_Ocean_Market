// Blue Ocean Market V28.6.0 — sale payment-source + payment-status UI support.
(function(){
  'use strict';
  const VERSION='28.6.0';
  window.__BLUE_OCEAN_V286_ACTIVE=true;

  try{if(typeof KO!=='undefined')Object.assign(KO,{
    'Payment Source':'결제 출처',
    'Choose how the full sale amount is being covered.':'판매 대금 전액을 어떤 방식으로 결제할지 선택하세요.',
    'Full payment required':'전액 결제 필요',
    'Payment Source *':'결제 출처 *',
    'Use Buyer Advance Balance':'구매자 선급금 잔액 사용',
    'Record New Payment':'새 결제 기록',
    'Available Advance':'사용 가능 선급금',
    'Sale Amount':'판매 금액',
    'After Allocation':'배정 후 잔액',
    'Payment reference and receipt are not entered again here. The allocation remains linked to the original buyer advance payment(s) and their evidence.':'여기에서 결제 참조와 영수증을 다시 입력하지 않습니다. 배정 내역은 기존 구매자 선급금 결제 및 증빙과 계속 연결됩니다.',
    'Record a new buyer payment for this sale. Reference and receipt/evidence are mandatory for a new payment.':'이 판매에 대한 새 구매자 결제를 기록합니다. 새 결제에는 참조와 영수증/증빙이 필수입니다.',
    'Payment Method *':'결제 방법 *',
    'Payment Date *':'결제일 *',
    'Payment Currency *':'결제 통화 *',
    'Conversion Rate to KRW *':'KRW 환산율 *',
    'Payment Reference *':'결제 참조 *',
    'Payment Receipt / Evidence *':'결제 영수증 / 증빙 *',
    'Payment Receipt / Evidence ':'결제 영수증 / 증빙 ',
    'Existing payment evidence will be retained if no new file is selected.':'새 파일을 선택하지 않으면 기존 결제 증빙이 유지됩니다.',
    'Required for a new sale payment.':'새 판매 결제에는 필수입니다.',
    'Advance covers sale':'선급금으로 판매대금 충당',
    'Check advance balance':'선급금 잔액 확인',
    'New payment will cover sale':'새 결제로 판매대금 충당',
    'Buyer Advance':'구매자 선급금',
    'Buyer advance allocation':'구매자 선급금 배정',
    'Sale Payment':'판매 결제',
    'Paid / Fully Paid':'전액 결제 완료',
    'Payment marked Paid':'결제 완료 처리',
    'Selected Buyer Details':'선택한 구매자 상세',
    'The existing sale record is loaded below. Saving updates the same sale, linked allocations/payment status, Finance record and sale document — no duplicate sale is created.':'기존 판매 기록을 불러왔습니다. 저장하면 동일한 판매 기록, 연결된 배정/결제 상태, 재무 기록 및 판매 문서가 업데이트되며 중복 판매는 생성되지 않습니다.',
    'Select whether this sale is covered from the buyer’s existing advance balance or by recording a new payment now. The machine becomes Sold / Completed only after full payment coverage is confirmed.':'구매자의 기존 선급금 잔액을 사용할지 새 결제를 기록할지 선택하세요. 전액 결제가 확인된 후에만 장비가 판매 완료 상태가 됩니다.',
    'Receipt / evidence is mandatory for a new sale payment.':'새 판매 결제에는 영수증/증빙이 필수입니다.',
    'Payment Date is required for a new sale payment.':'새 판매 결제에는 결제일이 필요합니다.',
    'Payment Reference is required for a new sale payment.':'새 판매 결제에는 결제 참조가 필요합니다.'
  })}catch(_){ }

  const style=document.createElement('style');
  style.id='v286-ui';
  style.textContent=`
    .v286-payment-source-card{border-color:#cfdff3!important;background:linear-gradient(180deg,#fbfdff,#f7fbff)}
    .v286-payment-source-card>.section-title{align-items:flex-start}.v286-payment-source-card .field{margin-bottom:10px}
    .v286-payment-info{padding:12px 14px;border:1px solid var(--line);border-radius:10px;background:#fff}
    .v286-payment-info .grid>div{min-width:0;display:flex;flex-direction:column;gap:5px}.v286-payment-info small{color:var(--muted);font-weight:750}.v286-payment-info b{font-size:18px;overflow-wrap:anywhere}
    #exPaymentCoverageStatus{white-space:normal;text-align:center}
    @media(max-width:700px){.v286-payment-source-card .grid.g3,.v286-payment-source-card .grid.g2{grid-template-columns:minmax(0,1fr)!important}.v286-payment-source-card .section-title{align-items:stretch}#exPaymentCoverageStatus{align-self:flex-start}}
  `;
  document.head.appendChild(style);
  console.info('Blue Ocean Market V28.6.0 sale payment synchronization UI loaded');
})();
