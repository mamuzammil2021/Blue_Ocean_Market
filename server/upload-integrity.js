'use strict';
const multer=require('multer');
const path=require('path');
const crypto=require('crypto');
function createIntegrityUpload(uploads,limits={}){
  const storage=multer.diskStorage({
    destination:(req,file,cb)=>cb(null,uploads),
    filename:(req,file,cb)=>{const extRaw=path.extname(String(file.originalname||'')).toLowerCase(),ext=/^\.[a-z0-9]{1,12}$/.test(extRaw)?extRaw:'';cb(null,`${Date.now()}-${crypto.randomBytes(16).toString('hex')}${ext}`)}
  });
  return multer({storage,limits});
}
module.exports={createIntegrityUpload};
