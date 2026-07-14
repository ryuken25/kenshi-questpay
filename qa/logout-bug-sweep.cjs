const { chromium }=require('@playwright/test');
const assert=require('node:assert/strict');
const base=process.env.BASE_URL||'http://127.0.0.1:3000';
(async()=>{
  const http=[];
  async function check(path,expected,options={}){const r=await fetch(base+path,{redirect:'manual',...options});http.push({path,status:r.status,location:r.headers.get('location')});assert.ok(expected.includes(r.status),`${path}: expected ${expected}, got ${r.status}`);return r;}
  await check('/api/health',[200]); await check('/api/health/auth',[200]); await check('/api/auth/session',[200]);
  const logout=await check('/api/auth/logout',[303],{method:'POST',headers:{cookie:'qp_session=fake-session'}});assert.match(logout.headers.get('set-cookie')||'',/qp_session=;.*Max-Age=0/i);assert.match(logout.headers.get('location')||'',/\/sign-in$/);
  for(const path of ['/','/services','/services/ux-quick-look','/checkout/ux-quick-look','/sign-in','/verify','/faq','/contact','/how-it-works','/privacy','/terms']) await check(path,[200,307,308]);
  for(const path of ['/account','/dashboard','/admin','/onboarding','/my-orders']) await check(path,[200,302,303,307,308]);
  await check('/api/profile',[401],{headers:{accept:'application/json'}});
  await check('/api/profile/onboarding',[401],{method:'POST',headers:{'content-type':'application/json'},body:'{}'});
  await check('/api/orders',[401],{method:'POST',headers:{'content-type':'application/json'},body:'{}'});
  await check('/api/auth/wallet/nonce',[400],{method:'POST',headers:{'content-type':'application/json'},body:'{}'});
  await check('/api/auth/wallet/verify',[400],{method:'POST',headers:{'content-type':'application/json'},body:'{}'});
  const browser=await chromium.launch({headless:true});const browserQA=[];
  for(const viewport of [{name:'desktop',width:1440,height:900},{name:'mobile',width:390,height:844}]){
    for(const path of ['/','/services','/checkout/ux-quick-look','/sign-in','/verify','/faq']){
      const p=await browser.newPage({viewport});const errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error') errors.push(m.text())});const r=await p.goto(base+path,{waitUntil:'networkidle'});await p.waitForTimeout(300);const row={viewport:viewport.name,path,status:r?.status(),overflow:await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),errors};browserQA.push(row);assert.equal(row.overflow,false,`${viewport.name} ${path} overflow`);assert.deepEqual(errors,[],`${viewport.name} ${path} browser errors`);await p.close();
    }
  }
  await browser.close();console.log(JSON.stringify({http,browserQA},null,2));
})().catch(e=>{console.error(e);process.exit(1)});
