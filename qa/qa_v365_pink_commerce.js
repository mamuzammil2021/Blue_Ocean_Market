const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8')}
function ok(cond,msg){if(!cond)throw new Error(msg);console.log('PASS',msg)}
const server=read('server/v365-pink-commerce-foundation.js');
const v300=read('server/v300.js');
const ui=read('public/v365-pink-commerce.js');
const runtime=read('public/runtime-v30392.js');
const index=read('public/index.html');
const ko=read('public/i18n-ko.js');
ok(server.includes('commerce_channels')&&server.includes('commerce_product_channels'),'generic commerce channel + product-channel schema exists');
ok(server.includes('commerce_price_lists')&&server.includes('commerce_shipments')&&server.includes('commerce_external_transactions'),'future pricing/shipping/external transaction foundations exist');
ok(server.includes("inventory_mode TEXT NOT NULL DEFAULT 'Shared'")&&server.includes('safety_stock_units'),'channel inventory-policy foundation exists');
ok(server.includes('pink_salt_customer_addresses'),'future B2C/multi-address customer foundation exists');
ok(server.includes("addCol('pink_salt_products','name_en'")&&server.includes("addCol('pink_salt_products','name_ko'")&&server.includes("addCol('pink_salt_products','variant_label'"),'product bilingual + variant-ready foundation exists');
ok(server.includes("addCol('pink_salt_orders','source_channel_id'")&&server.includes("addCol('pink_salt_orders','fulfillment_status'"),'external order + fulfillment foundation exists');
ok(!v300.includes('Shipment cannot be received until the supplier purchase is fully paid.'),'physical receiving is no longer blocked by full supplier payment');
ok(!v300.includes("Supplier payments cannot be added after the shipment has been received."),'supplier settlement can continue after physical receipt');
ok(runtime.includes("psCommerce:'Commerce / Channels'")&&runtime.includes("['psCommerce','Commerce / Channels','🌐']"),'Pink Salt navigation exposes shared commerce foundation consistently');
ok(runtime.includes('Physical receipt and supplier settlement are tracked separately'),'Pink Salt import UI explains independent physical/financial statuses');
ok(ui.includes('/api/commerce/foundation-v365')&&ui.includes('Manage Product Channels'),'commerce management UI is wired');
ok(ui.includes("['Own Website','Marketplace','Social Commerce','B2B Portal','Other']"),'channel UI is channel-agnostic rather than Coupang/Naver-specific');
ok(index.includes('/v365-pink-commerce.js?v=30.65.0'),'V30.65 client is loaded');
ok(ko.includes("'Commerce / Channels':'커머스 / 판매 채널'")&&ko.includes("'Physical receipt and supplier settlement are tracked separately'"),'new V30.65 user-facing strings have Korean translations');
console.log('V30.65 Pink Salt foundation static QA passed.');
