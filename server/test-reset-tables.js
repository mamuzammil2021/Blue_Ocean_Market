'use strict';
// Reset is one guarded PostgreSQL database/upload maintenance operation. There
// is no general runtime helper that drops triggers or disables foreign keys.
module.exports = { clearTestTables() {throw Error('Use the authorized PostgreSQL maintenance reset operation, including its pre-reset backup and upload recovery journal');} };
