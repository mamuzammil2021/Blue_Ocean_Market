const storage=require('../server/runtime-storage');
storage.assertReady();
storage.log();
require('../server/server');
