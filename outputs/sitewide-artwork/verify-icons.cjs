require('tsx/cjs');
global.React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { Icon } = require('../../src/components/custom-icon.tsx');
const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const { chromium } = require('playwright');

async function main() {
  const source = ts.createSourceFile('custom-icon.tsx', fs.readFileSync('src/components/custom-icon.tsx','utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const declaration = source.statements.find(s => ts.isVariableStatement(s) && s.declarationList.declarations[0].name.getText(source) === 'assets').declarationList.declarations[0];
  const names = declaration.initializer.expression.properties.map(p => p.name.getText(source));
  const cards = names.map(name => `<section><h2>${name}</h2><div class="samples">${[18,24,44].map(size => renderToStaticMarkup(React.createElement(Icon,{name,size}))).join('')}<div class="dark">${renderToStaticMarkup(React.createElement(Icon,{name,size:24}))}</div></div></section>`).join('');
  const html = `<!doctype html><html lang="en"><head><base href="http://127.0.0.1:3107/"><meta charset="utf-8"><title>OppScout custom icon QA</title><style>body{background:#fafaf6;color:#1e293b;font:14px system-ui;padding:24px}h1{font-size:24px}main{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}section{border:1px solid #dedbd0;background:white;border-radius:16px;padding:16px}h2{font-size:14px;margin:0 0 12px}.samples{display:flex;align-items:center;gap:16px}.custom-icon{display:inline-block;flex-shrink:0;vertical-align:middle}.custom-icon img{display:block;width:100%;height:100%;object-fit:contain}.dark{padding:10px;border-radius:10px;background:#1e293b}</style></head><body><h1>Custom artwork: 18px / 24px / 44px / dark surface</h1><main>${cards}</main></body></html>`;
  fs.writeFileSync(path.join(__dirname,'gallery.html'),html);
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try {
    const page=await browser.newPage({viewport:{width:1280,height:1600}});
    await page.setContent(html);
    await page.locator('img').evaluateAll(async images => { for(const image of images){image.loading='eager';} await Promise.all(images.map(image=>image.decode().catch(()=>{}))); });
    const broken=await page.locator('img').evaluateAll(images=>images.filter(image=>!image.complete||image.naturalWidth===0).map(image=>image.getAttribute('src')));
    await page.screenshot({path:path.join(__dirname,'gallery.png'),fullPage:true});
    const result={iconNames:names.length,renderedImages:names.length*4,broken:[...new Set(broken)]};
    fs.writeFileSync(path.join(__dirname,'asset-verification.json'),JSON.stringify(result,null,2));
    console.log(JSON.stringify(result));
    if(broken.length)process.exitCode=1;
  } finally {await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
