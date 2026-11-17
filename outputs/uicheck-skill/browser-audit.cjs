const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
async function main() {
  const browser = await chromium.launch({headless:true,channel:'msedge'});
  const results = [];
  try {
    for (const route of ['/', '/login', '/opportunities', '/organizations', '/organizations/signup']) {
      for (const width of [320,1280]) {
        const page = await browser.newPage({viewport:{width,height:900}, reducedMotion:'reduce'});
        const result = {route,width};
        try {
          const response = await page.goto('http://127.0.0.1:3107'+route,{waitUntil:'domcontentloaded',timeout:60000});
          await page.waitForTimeout(1500);
          result.status = response.status();
          result.url = page.url();
          result.requestedPageRendered = new URL(page.url()).pathname === route;
          if (!result.requestedPageRendered) result.coverageNote = 'Redirect destination tested; requested page content was not audited.';
          await page.evaluate(fs.readFileSync(require.resolve('axe-core'),'utf8'));
          result.axe = await page.evaluate(async()=> {
            const r = await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}});
            return {passes:r.passes.length,incomplete:r.incomplete.map(x=>x.id),violations:r.violations.map(x=>({id:x.id,impact:x.impact,description:x.description,nodes:x.nodes.map(n=>({target:n.target,html:n.html,summary:n.failureSummary}))}))};
          });
          result.layout = await page.evaluate(()=>({title:document.title,h1:[...document.querySelectorAll('h1')].map(x=>x.textContent),main:document.querySelectorAll('main').length,viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('body *')].filter(x=>x.getBoundingClientRect().right>innerWidth+1 && x.getBoundingClientRect().width>0).slice(0,12).map(x=>({tag:x.tagName,cls:x.className})),fields:[...document.querySelectorAll('input')].map(x=>({type:x.type,name:x.name,labels:[...x.labels||[]].map(l=>l.textContent),aria:x.getAttribute('aria-label')}))}));
          result.tabs=[];
          for(let i=0;i<10;i++) {
            await page.keyboard.press('Tab');
            result.tabs.push(await page.evaluate(()=>{const e=document.activeElement,s=getComputedStyle(e);return {tag:e.tagName,text:(e.textContent||e.getAttribute('aria-label')||'').trim().slice(0,70),outline:s.outline,shadow:s.boxShadow};}));
          }
          await page.screenshot({path:path.join(__dirname,`${route.replaceAll('/','_')||'home'}-${width}.png`),fullPage:true});
        } catch(e) {result.error=e.message;}
        results.push(result);
        fs.writeFileSync(path.join(__dirname,'browser-audit.json'),JSON.stringify(results,null,2));
        console.log(JSON.stringify({route,width,status:result.status,error:result.error,overflow:result.layout?.scrollWidth,violations:result.axe?.violations.map(x=>({id:x.id,nodes:x.nodes.length}))}));
        await page.close();
      }
    }
  } finally { await browser.close(); }
}
main().catch(e=>{console.error(e);process.exitCode=1;});
