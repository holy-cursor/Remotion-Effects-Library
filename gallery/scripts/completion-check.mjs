import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
const base='http://127.0.0.1:4198';
const manifest=await(await fetch(base+'/components.json')).json();
const all=manifest.effects,newEffects=all.filter(e=>e.file.startsWith('Complete'));
const out=path.resolve('../review/completion-2026-11-25');fs.mkdirSync(out,{recursive:true});
const errors=[],network=[],sheets=[];
const browser=await puppeteer.launch({executablePath:process.env.CHROME??'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox','--disable-crash-reporter','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage();await page.setViewport({width:1010,height:900,deviceScaleFactor:1});
page.on('pageerror',e=>errors.push(String(e)));
page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico'))network.push([r.status(),r.url()])});
page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('404'))errors.push(m.text())});
let renders=0;
async function visit(effects,frames,theme,values={}){
 await page.goto(base+'/check.html?'+new URLSearchParams({slugs:effects.map(e=>e.slug).join(','),progress:frames.join(','),theme,values:JSON.stringify(values)}),{waitUntil:'networkidle0',timeout:120000});
 await page.waitForFunction('window.__ready === true',{timeout:120000});
 errors.push(...await page.evaluate('window.__fxCheck'));
 const invalid=await page.evaluate(()=>Array.from(document.querySelectorAll('svg *')).flatMap(e=>Array.from(e.attributes).filter(a=>/NaN|Infinity/.test(a.value)).map(a=>({element:e.tagName,attribute:a.name,value:a.value}))));
 errors.push(...invalid);renders+=effects.length*frames.length;
}
for(const theme of ['light','dark'])for(let offset=0;offset<newEffects.length;offset+=10){
 const batch=newEffects.slice(offset,offset+10);await visit(batch,[.2,.5,.85],theme);
 const file=path.join(out,`${theme}-${offset/10+1}.jpg`);await page.screenshot({path:file,fullPage:true,type:'jpeg',quality:85});sheets.push(file);
 console.log(theme,offset+batch.length,'/',newEffects.length,'errors',errors.length);
}
// All collection endpoints, including existing effects, to catch integration errors.
for(let offset=0;offset<all.length;offset+=20)await visit(all.slice(offset,offset+20),[0,1],'light');
// User-supplied data and zero-length sequences must not produce invalid geometry.
const dataEffects=newEffects.filter(e=>['items','values','points','paths','cues','data'].some(k=>k in e.props));
for(let offset=0;offset<dataEffects.length;offset+=12)await visit(dataEffects.slice(offset,offset+12),[0,.5,1],'dark',{items:[],values:[],points:[],edges:[],paths:[],cues:[],data:[]});
const singleton={items:['One'],values:[42],points:[{x:320,y:180}],edges:[],paths:['M270 130H370V230H270Z'],cues:[{start:0,end:1,text:'One'}],data:[{open:2,close:3,low:1,high:4}]};
for(let offset=0;offset<dataEffects.length;offset+=12)await visit(dataEffects.slice(offset,offset+12),[.25,.75,1],'light',singleton);
await browser.close();
const report={count:all.length,added:newEffects.length,renders,sheets,errors,network};
fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({count:all.length,added:newEffects.length,renders,errors:errors.length,network:network.length}));
if(errors.length||network.length||all.length!==146||newEffects.length!==80)process.exit(1);
