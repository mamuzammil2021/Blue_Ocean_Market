'use strict';
// Native tables introduced after the frozen SQLite migration baseline.
// Importing that baseline requires these tables to be empty; no data is inferred.
module.exports={nativeTables:Object.freeze(['warehouse_transfers','pink_sales_allocation_requests'])};
