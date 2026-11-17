const {chromium}=require('playwright');
const fs=require('fs');
const path=require('path');
async function main(){
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const results=[];
 try{
  for(const route of ['/','/login','/organizations','/organizations/signup']){
   for(const width of [375,1280]){
    const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
    const response=await page.goto(`http://127.0.0.1:3107${route}`,{waitUntil:'domcontentloaded'});
    await page.locator('h1').waitFor();
    await page.locator('img').evaluateAll(async images=>{for(const image of images)image.loading='eager';await Promise.all(images.map(image=>image.decode().catch(()=>{})));});
    await page.evaluate(fs.readFileSync(require.resolve('axe-core'),'utf8'));
    const violations=await page.evaluate(async()=>{const r=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}});return r.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)}));});
    const layout=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,brokenImages:[...document.images].filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.getAttribute('src'))}));
    await page.screenshot({path:path.join(__dirname,`${route==='/'?'home':route.replaceAll('/','_')}-${width}.png`),fullPage:true,style:'nextjs-portal{display:none !important}'});
    const result={route,width,status:response.status(),finalUrl:page.url(),...layout,violations};results.push(result);console.log(JSON.stringify(result));
    await page.close();
   }
  }
 }finally{fs.writeFileSync(path.join(__dirname,'page-verification.json'),JSON.stringify(results,null,2));await browser.close();}
 if(results.some(r=>r.status!==200||r.brokenImages.length||r.scrollWidth>r.width||r.violations.length))process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1});
