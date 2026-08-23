const fs=require('fs');
const http=require('http');
const os=require('os');
const path=require('path');
const crypto=require('crypto');
const {spawn}=require('child_process');

const projectRoot=path.resolve(__dirname,'..');
const runtimeRoot=fs.mkdtempSync(path.join(os.tmpdir(),'blue-ocean-v282-runtime-'));
const dataDir=path.join(runtimeRoot,'data'),uploadDir=path.join(runtimeRoot,'uploads');
const port=Number(process.env.V282_PORT||3282),baseUrl=`http://127.0.0.1:${port}`;
const adminEmail=`v282-admin-${Date.now()}@example.test`,adminPassword=crypto.randomBytes(24).toString('base64url'),qaUserPassword=crypto.randomBytes(24).toString('base64url'),jwtSecret=crypto.randomBytes(48).toString('base64url');
fs.mkdirSync(dataDir,{recursive:true});fs.mkdirSync(uploadDir,{recursive:true});

const server=spawn(process.execPath,['server/server.js'],{cwd:projectRoot,env:{...process.env,PORT:String(port),DATA_DIR:dataDir,UPLOAD_DIR:uploadDir,JWT_SECRET:jwtSecret,ADMIN_EMAIL:adminEmail,ADMIN_PASSWORD:adminPassword,SEED_DEMO_USERS:'true',DEMO_USER_PASSWORD:qaUserPassword,NODE_ENV:'test'},stdio:['ignore','pipe','pipe']});
let serverOutput='';server.stdout.on('data',chunk=>{serverOutput+=chunk.toString()});server.stderr.on('data',chunk=>{serverOutput+=chunk.toString()});
function healthReady(){return new Promise(resolve=>{const req=http.get(`${baseUrl}/api/health`,response=>{response.resume();resolve(response.statusCode===200)});req.setTimeout(750,()=>req.destroy());req.on('error',()=>resolve(false))})}
async function waitForServer(){for(let attempt=0;attempt<100;attempt+=1){if(server.exitCode!==null)throw new Error(`Server stopped before QA started.\n${serverOutput}`);if(await healthReady())return;await new Promise(resolve=>setTimeout(resolve,125))}throw new Error(`Timed out waiting for V28.2 QA server.\n${serverOutput}`)}
function runScript(script,env){return new Promise((resolve,reject)=>{const qa=spawn(process.execPath,[script],{cwd:projectRoot,env:{...process.env,...env},stdio:'inherit'});qa.on('error',reject);qa.on('exit',code=>code===0?resolve():reject(new Error(`${script} exited with code ${code}`)))})}
async function cleanup(){if(server.exitCode===null){server.kill('SIGTERM');await new Promise(resolve=>{const timer=setTimeout(resolve,2000);server.once('exit',()=>{clearTimeout(timer);resolve()})})}fs.rmSync(runtimeRoot,{recursive:true,force:true})}

(async()=>{
  try{
    await waitForServer();
    await runScript('qa/qa_v280_runtime_api.js',{V280_BASE_URL:baseUrl,V280_ADMIN_EMAIL:adminEmail,V280_ADMIN_PASSWORD:adminPassword,V280_FINANCE_EMAIL:'bilal.ahmed@blueocean.local',V280_FINANCE_PASSWORD:qaUserPassword,V280_EXPECTED_VERSION:'28.2.0'});
    await runScript('qa/qa_v281_runtime_api.js',{V281_BASE_URL:baseUrl,V281_ADMIN_EMAIL:adminEmail,V281_ADMIN_PASSWORD:adminPassword,V281_USER_PASSWORD:qaUserPassword,V281_EXPECTED_VERSION:'28.2.0'});
    await runScript('qa/qa_v282_runtime_api.js',{V282_BASE_URL:baseUrl,V282_ADMIN_EMAIL:adminEmail,V282_ADMIN_PASSWORD:adminPassword,V282_USER_PASSWORD:qaUserPassword});
    if(serverOutput.trim())console.log(serverOutput.trim());
  }catch(error){console.error(error.stack||error);if(serverOutput.trim())console.error(serverOutput.trim());process.exitCode=1}
  finally{await cleanup()}
})();
