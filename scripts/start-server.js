const storage=require('../server/runtime-storage');
storage.assertReady();
require('./test-reset-startup').applyPending(storage);
storage.log();
require('../server/server');
