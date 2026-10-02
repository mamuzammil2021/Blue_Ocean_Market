const fs=require('fs');
const path=require('path');
const root=path.join(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const srv=read('server/v366-pink-product-master.js'),v300=read('server/v300.js'),client=read('public/v366-pink-product-master.js'),commerce=read('public/v365-pink-commerce.js'),html=read('public/index.html'),main=read('server/server.js');
const checks=[
 ['V30.66 server module wired',main.includes("v366-pink-product-master").toString&&main.includes("v366-pink-product-master")],
 ['Product media table',srv.includes('pink_salt_product_images')],
 ['Primary/order/EN-KR media metadata',/is_primary/.test(srv)&&/sort_order/.test(srv)&&/alt_text_en/.test(srv)&&/alt_text_ko/.test(srv)],
 ['Channel-image mapping foundation',srv.includes('commerce_product_channel_images')],
 ['Authenticated product image content route',srv.includes('/product-images/:imageId/content')&&srv.includes("auth,allow('inventory','sales','dashboard','purchases')")],
 ['Image upload restricted to image MIME',srv.includes("startsWith('image/')")],
 ['Product catalog fields saved by core product API',v300.includes('name_en,name_ko,product_family,variant_label')&&v300.includes('default_location_id')],
 ['Product image manager UI',client.includes('psProductImagesV366')&&client.includes('Upload Images')],
 ['Structured locations',srv.includes('pink_salt_storage_locations')&&client.includes('psLocationsV366')],
 ['Price list UI and channel assignment',client.includes('psPriceListsV366')&&commerce.includes('name="price_list_id"')],
 ['Customer multi-address UI',client.includes('psCustomerAddressesV366')&&srv.includes('/customers/:id/addresses')],
 ['Lot / best-before persisted',v300.includes('best_before_date')&&v300.includes('lot_no')&&client.includes('Best Before Date')],
 ['Separate fulfillment status control',srv.includes('/orders/:id/fulfillment')&&client.includes('psFulfillmentV366')],
 ['Commerce remains channel agnostic',!srv.includes('Coupang')&&!srv.includes('Naver')&&!srv.includes('Amazon')],
 ['No destructive schema reset',!srv.match(/DROP\s+TABLE|DELETE\s+FROM\s+pink_salt_products/i)],
 ['V30.66 client loaded',html.includes('/v366-pink-product-master.js?v=30.66.0')],
 ['Core asset version bumped',html.includes('runtime-v30392.js?v=30.66.0')],
 ['Excavator/shared design primitives reused',client.includes('section-title')&&client.includes('card')&&client.includes('grid g2')&&client.includes('actions')],
];
let fail=0;for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(!ok)fail++}console.log(`\nV30.66 Pink Salt Product Master QA: ${checks.length-fail}/${checks.length} passed`);process.exit(fail?1:0);
