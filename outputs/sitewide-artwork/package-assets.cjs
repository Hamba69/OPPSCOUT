const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function main() {
  const generated = JSON.parse(fs.readFileSync(path.join(__dirname,'generation.json'),'utf8'));
  const originalDir = path.join(__dirname,'originals');
  const publicDir = path.resolve('public/images/icons');
  fs.mkdirSync(originalDir,{recursive:true});
  fs.mkdirSync(publicDir,{recursive:true});
  const manifest=[];
  for(const [name,result] of Object.entries(generated)) {
    if(!/^[a-zA-Z]+$/.test(name)) throw new Error('Unexpected asset name');
    const match=result.hint.match(/ as (.+\.png) by default\./);
    if(!match)throw new Error(`Missing generated file path: ${name}`);
    const source=match[1];
    fs.copyFileSync(source,path.join(originalDir,`${name}.png`));
    const destination=path.join(publicDir,`${name}.webp`);
    await sharp(source).resize(160,160).webp({quality:85,alphaQuality:100}).toFile(destination);
    const metadata=await sharp(destination).metadata();
    const stats=await sharp(destination).stats();
    if(!metadata.hasAlpha||stats.channels.at(-1).min!==0)throw new Error(`Transparency missing: ${name}`);
    manifest.push({name,file:`/images/icons/${name}.webp`,width:metadata.width,height:metadata.height,bytes:fs.statSync(destination).size,transparent:true});
  }
  fs.writeFileSync(path.join(__dirname,'manifest.json'),JSON.stringify(manifest,null,2));
  console.log(JSON.stringify({assets:manifest.length,totalBytes:manifest.reduce((n,a)=>n+a.bytes,0)}));
}
main().catch(error=>{console.error(error);process.exitCode=1;});
