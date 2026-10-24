# V30.69.45 — simple receiving / 간편 입고

## Receive goods / 물품 입고

1. Open the Import or Packaging purchase and choose **Receive Goods**. / 수입 또는 포장재 구매를 열고 **물품 입고**를 선택하세요.
2. Select the categories/materials in this delivery. Enter actual quantities, receiving date and location. Salt bags and actual net weight are independent. **Fill Expected Quantities** is only a convenience; the physical-check box stays unchecked. / 이번 납품 항목을 선택하고 실제 수량, 입고일 및 위치를 입력하세요. 소금 포대 수와 실제 순중량은 별도입니다. **예상 수량 입력**은 편의 기능이며 실물 확인을 대신하지 않습니다.
3. If quantities differ, choose what happens to the missing balance. / 차이가 있으면 누락 잔량 처리 방법을 선택하세요.
4. If some goods are damaged, enter only the inspection-hold or rejected quantities. Those goods do not enter usable inventory. / 일부 물품이 손상되면 검사 보류 또는 거부 수량만 입력하세요. 해당 물품은 사용 가능 재고에 포함되지 않습니다.
5. Confirm physical inspection, review and receive. / 실물 확인 후 검토하여 입고를 저장하세요.

| Choice / 선택 | Result / 결과 |
| --- | --- |
| Arriving later / 추후 입고 | Save delivered goods; keep the ordinary remaining balance pending delivery. No claim task is created. / 받은 물품을 저장하고 잔량을 입고 대기로 유지합니다. 클레임 작업은 생성되지 않습니다. |
| Needs investigation / 조사 필요 | Save received goods, hold the disputed missing quantity, and create one linked investigation task. / 받은 물품을 저장하고 분쟁 중 누락 수량을 보류하며 연결된 조사 작업 하나를 생성합니다. |
| Part later, part investigation / 일부 추후 입고·일부 조사 | Hold only the quantity entered for investigation; the rest remains eligible for later delivery. / 조사 수량만 보류하고 나머지는 추후 입고 가능 상태로 유지합니다. |

Notes, photos, assignment and follow-up date are under **Notes, photos & follow-up (optional)**. Financial settlement, exchange-rate entry and responsibility allocation are not part of ordinary receiving. / 메모, 사진, 담당자 및 후속 조치일은 **메모, 사진 및 후속 조치 (선택)**에 있습니다. 일반 입고에서 재무 정산, 환율 또는 책임 배분을 입력하지 않습니다.

## Resolve an issue / 문제 해결

Open the pending indicator on the purchase or supplier, or use **Resolve Receiving Issue** in the task. The issue shows the purchase, supplier, receipt, ordered/received/missing quantities and original invoice estimate. / 구매 또는 공급업체의 대기 표시를 열거나 작업의 **입고 문제 해결**을 선택하세요. 구매, 공급업체, 입고 기록, 주문·입고·누락 수량과 송장 기준 예상액이 표시됩니다.

- **Goods will arrive later:** authorize a linked delivery; keep the original task pending until accepted. / **추후 도착:** 연결된 납품을 승인하고 합격 입고까지 원래 작업을 유지합니다.
- **Supplier responsible:** choose credit, unpaid-invoice reduction, actual refund due or replacement. / **공급업체 책임:** 크레딧, 미지급 송장 감액, 환불 예정 또는 대체품을 선택합니다.
- **Our company accepts loss / no supplier claim:** record the approved company loss. / **당사 손실 부담 / 공급업체 클레임 없음:** 승인된 회사 손실을 기록합니다.
- **Shared responsibility:** show the percentage slider and precise percentage input only when needed. / **책임 분담:** 필요한 경우에만 슬라이더와 정확한 비율 입력을 표시합니다.
- **Carrier/insurer:** name the responsible counterparty and track its recovery separately. / **운송사·보험사:** 책임 주체를 지정하고 회수를 별도로 추적합니다.
- **Receiving measurement was wrong:** review and authorize reversing the entire original receipt, then enter the correct receipt. Dependent stock or financial transactions must be resolved first. / **입고 측정 오류:** 원래 입고 전체를 검토·승인하여 취소하고 올바른 입고를 다시 입력합니다. 연결된 재고 또는 재무 거래는 먼저 해결해야 합니다.

Invoice unit price, net settlement unit price, estimate, currency and original KRW valuation are filled automatically. Changing the agreed amount requires a reason. Bag and weight differences for the same missing goods are not added twice. / 송장 단가, 정산 순단가, 예상액, 통화 및 원래 원화 평가액은 자동 입력됩니다. 합의 금액 변경에는 사유가 필요합니다. 동일 누락 물품의 포대와 중량 차이를 이중 합산하지 않습니다.

Actual refunds are recorded only when money is received, with receiving company account and evidence. A replacement is complete only when accepted. A credit can resolve the issue when issued and available under policy; it does not have to be spent on another purchase first. / 실제 환불은 회사 계좌에 입금된 후 증빙과 함께 기록합니다. 대체품은 합격 입고 후 완료됩니다. 크레딧은 정책에 따라 발행·사용 가능해지면 문제를 해결하며, 다른 구매에 먼저 사용해야 하는 것은 아닙니다.

## Indicators and receiving buttons / 표시 및 입고 버튼

**Pending delivery**, **Under investigation**, **Awaiting approval** and **Awaiting supplier settlement** distinguish the pending work. Purchase and supplier lists/profiles link to the relevant record. / **입고 대기**, **조사 중**, **승인 대기**, **공급업체 정산 대기**로 작업을 구분하며 관련 구매·공급업체 화면에서 열 수 있습니다.

When no eligible quantity remains, receiving actions are hidden and the server rejects another normal receipt. **View Receiving History** remains available. Approved corrections can deliberately restore receiving eligibility. / 입고 가능 잔량이 없으면 입고 작업을 숨기고 서버에서도 추가 일반 입고를 거부합니다. **입고 이력 보기**는 유지되며 승인된 수정으로 입고 가능 잔량을 복원할 수 있습니다.

**History & advanced settlement** retains controlled mixed settlements, partial disputes and reversals. Existing V44 historical cases remain available without guessing new historical tasks or holds. / **이력 및 고급 정산**에서 혼합 정산, 일부 분쟁 및 통제된 취소를 처리합니다. 기존 V44 사례는 과거 작업이나 보류 수량을 추정 생성하지 않고 유지합니다.
