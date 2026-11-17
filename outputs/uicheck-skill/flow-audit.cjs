const {chromium}=require('playwright');
const fs=require('fs');
const path=require('path');
const results=[];
const base='http://127.0.0.1:3107';
async function main(){
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  for(const route of ['/login','/organizations/login','/organizations/signup']){
   const page=await browser.newPage({viewport:{width:375,height:900}});
   const result={route,mode:'simulated authentication response; no provider request sent'};
   const intercepted=[];
   await page.route('**/auth/v1/**',async r=>{intercepted.push(new URL(r.request().url()).pathname);await new Promise(resolve=>setTimeout(resolve,700));await r.fulfill({status:400,contentType:'application/json',body:JSON.stringify({error:'invalid_grant',error_description:'Invalid login credentials',msg:'Invalid login credentials'})})});
   try{
    await page.goto(base+route,{waitUntil:'domcontentloaded'});
    const form=page.locator('form').filter({has:page.locator('input[type=email]')});
    await form.locator('button:not([type=button])').click();
    result.emptyValidation=await page.locator('input[type=email]').evaluate(e=>({invalid:!e.validity.valid,focused:e===document.activeElement}));
    await page.locator('input[type=email]').fill('ui-audit@example.invalid');
    await page.locator('input[name=password]').fill('Audit-only-Password-2026!');
    await page.getByRole('button',{name:'Show',exact:true}).click();
    result.passwordToggle=await page.locator('input[name=password]').getAttribute('type')==='text';
    await page.getByRole('button',{name:'Hide',exact:true}).click();
    await form.locator('button:not([type=button])').click();
    result.loadingDisabled=await form.locator('button:not([type=button])').isDisabled();
    await page.getByRole('status').waitFor({timeout:15000});
    result.error=await page.getByRole('status').textContent();
    result.retryEnabled=await form.locator('button:not([type=button])').isEnabled();
    result.inputRetained=(await page.locator('input[type=email]').inputValue())==='ui-audit@example.invalid'&&(await page.locator('input[name=password]').inputValue()).length>0;
    result.intercepted=intercepted;
    await page.screenshot({path:path.join(__dirname,`flow-${route.replaceAll('/','_')}.png`),fullPage:true});
   }catch(e){result.testError=e.message}finally{await page.close()}
   results.push(result);console.log(JSON.stringify(result));
  }
  const page=await browser.newPage({viewport:{width:375,height:900},reducedMotion:'reduce'});
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.getByRole('link',{name:'Jobs',exact:true}).click();
  await page.waitForURL('**/login?**');
  results.push({flow:'landing Jobs to authentication',finalPath:new URL(page.url()).pathname,next:new URL(page.url()).searchParams.get('next')});
  await page.goto(base+'/opportunities');
  const menu=page.getByRole('button',{name:'Menu',exact:true});
  results.push({flow:'anonymous catalogue',finalPath:new URL(page.url()).pathname,catalogueRendered:await page.getByRole('heading',{name:'Opportunities',exact:true}).count()});
  await page.close();
 }finally{fs.writeFileSync(path.join(__dirname,'flow-audit.json'),JSON.stringify(results,null,2));await browser.close()}
}
main().catch(e=>{console.error(e);process.exitCode=1});
