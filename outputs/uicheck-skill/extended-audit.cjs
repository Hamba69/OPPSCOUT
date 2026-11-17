const {chromium}=require('playwright');
const fs=require('fs');
const path=require('path');
const out=__dirname;
const base='http://127.0.0.1:3107';
const axeSource=fs.readFileSync(require.resolve('axe-core'),'utf8');
const results=[];
const write=()=>fs.writeFileSync(path.join(out,'extended-audit.json'),JSON.stringify(results,null,2));
async function main(){
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  for(const route of ['/','/login','/opportunities','/organizations','/organizations/signup','/organizations/login']){
   const page=await browser.newPage({viewport:{width:1280,height:900}});
   try{
    await page.goto(base+route,{waitUntil:'domcontentloaded',timeout:60000});
    await page.locator('h1').waitFor();
    await page.waitForTimeout(500);
    for(const context of ['375','768','1920','text200','spacing','forced','dark','reduced']){
     await page.setViewportSize({width:/^\d+$/.test(context)?Number(context):375,height:900});
     await page.emulateMedia({forcedColors:context==='forced'?'active':'none',colorScheme:context==='dark'?'dark':'light',reducedMotion:context==='reduced'?'reduce':'no-preference'});
     await page.evaluate(()=>document.getElementById('audit-overrides')?.remove());
     if(context==='text200'||context==='spacing')await page.evaluate(css=>{const e=document.createElement('style');e.id='audit-overrides';e.textContent=css;document.head.appendChild(e)},context==='text200'?'html {font-size:200% !important}':'* {line-height:1.5 !important;letter-spacing:.12em !important;word-spacing:.16em !important} p {margin-bottom:2em !important}');
     const result={route,context,finalUrl:page.url()};
     result.layout=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('main *')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.right>innerWidth+2}).slice(0,8).map(e=>({tag:e.tagName,text:e.textContent.trim().slice(0,70),class:e.className})),animations:document.getAnimations().filter(a=>a.playState==='running').length}));
     if(['forced','text200','spacing'].includes(context))await page.screenshot({path:path.join(out,`extended-${route.replaceAll('/','_')}-${context}.png`),fullPage:true});
     if(context==='text200'){await page.evaluate(axeSource);result.axe=await page.evaluate(async()=>{const r=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}});return r.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}));});}
     results.push(result);write();
    }
    await page.setViewportSize({width:1280,height:900});
    await page.emulateMedia({forcedColors:'none',reducedMotion:'reduce'});
    const tabs=[];
    await page.locator('body').click({position:{x:1,y:1}});
    const count=await page.locator('a[href],button,input,select,textarea').count();
    for(let i=0;i<Math.min(count+3,90);i++){
     await page.keyboard.press('Tab');
     tabs.push(await page.evaluate(()=>{const e=document.activeElement,r=e.getBoundingClientRect(),s=getComputedStyle(e);const hit=document.elementFromPoint(Math.max(0,Math.min(innerWidth-1,r.x+r.width/2)),Math.max(0,Math.min(innerHeight-1,r.y+r.height/2)));return {tag:e.tagName,label:(e.getAttribute('aria-label')||e.textContent||e.getAttribute('name')||'').trim().slice(0,65),outline:s.outline,shadow:s.boxShadow,visible:r.width>0&&r.height>0,covered:hit&&!e.contains(hit)&&!hit.contains(e),x:r.x,y:r.y};}));
    }
    results.push({route,context:'keyboard',tabs});write();
    console.log(JSON.stringify({route,checks:9,overflow:results.filter(r=>r.route===route&&r.layout?.scrollWidth>r.layout?.width).map(r=>r.context)}));
   }catch(e){results.push({route,error:e.message});write();console.log(route,e.message)}finally{await page.close()}
  }
 }finally{await browser.close()}
}
main().catch(e=>{console.error(e);process.exitCode=1});
