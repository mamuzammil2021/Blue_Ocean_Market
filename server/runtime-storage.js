const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..');
const isRender=String(process.env.RENDER||'').toLowerCase()==='true';
const persistentRoot=path.resolve(process.env.RENDER_PERSISTENT_ROOT||(isRender?'/var/data':root));
const dataDir=path.resolve(process.env.DATA_DIR||(isRender?path.join(persistentRoot,'data'):path.join(root,'data')));
const uploadDir=path.resolve(process.env.UPLOAD_DIR||(isRender?path.join(persistentRoot,'uploads'):path.join(root,'uploads')));
if(isRender&&!process.env.APP_BASE_URL&&process.env.RENDER_EXTERNAL_URL)process.env.APP_BASE_URL=String(process.env.RENDER_EXTERNAL_URL).replace(/\/$/,'');
function within(child,parent){const rel=path.relative(path.resolve(parent),path.resolve(child));return rel===''||(!rel.startsWith('..')&&!path.isAbsolute(rel));}
function ensure(){for(const p of [persistentRoot,dataDir,uploadDir])fs.mkdirSync(p,{recursive:true});}
function mountDetected(){try{const txt=fs.readFileSync('/proc/self/mountinfo','utf8');const target=path.resolve(persistentRoot);for(const line of txt.split('\n')){const pre=line.split(' - ')[0]?.trim().split(/\s+/);if(!pre||pre.length<5)continue;const m=String(pre[4]||'').replace(/\\040/g,' ');if(path.resolve(m)===target)return true;}}catch(_){ }try{return fs.statSync(persistentRoot).dev!==fs.statSync(path.dirname(persistentRoot)).dev}catch(_){return false}}
function writable(p){try{const f=path.join(p,`.bom-write-test-${process.pid}-${Date.now()}`);fs.writeFileSync(f,'ok');fs.unlinkSync(f);return true}catch(_){return false}}
function status(){ensure();return {isRender,persistentRoot,dataDir,uploadDir,pathsPersistent:!isRender||(within(dataDir,persistentRoot)&&within(uploadDir,persistentRoot)),mountDetected:!isRender||mountDetected(),writable:writable(dataDir)&&writable(uploadDir)}}
function assertReady(){const s=status();if(isRender&&!s.pathsPersistent)throw new Error(`Render storage misconfiguration: DATA_DIR and UPLOAD_DIR must be inside ${persistentRoot}.`);if(!s.writable)throw new Error('Application storage is not writable.');const requireDisk=String(process.env.RENDER_REQUIRE_PERSISTENT_DISK||'').toLowerCase()==='true';if(isRender&&requireDisk&&!s.mountDetected)throw new Error(`Persistent disk is required but ${persistentRoot} is not detected as a mounted filesystem. Attach the Render disk at ${persistentRoot}.`);return s}
function log(){const s=status();console.log(`[storage] render=${s.isRender} root=${s.persistentRoot} data=${s.dataDir} uploads=${s.uploadDir} disk_mount_detected=${s.mountDetected} writable=${s.writable}`);if(s.isRender&&!s.mountDetected)console.warn(`[storage] WARNING: ${s.persistentRoot} is not detected as a separate mount. Data can be ephemeral unless a Render persistent disk is attached there.`);return s}
module.exports={root,isRender,persistentRoot,dataDir,uploadDir,ensure,status,assertReady,log,within,mountDetected};
