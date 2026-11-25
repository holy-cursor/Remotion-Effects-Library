import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
const out=path.resolve('../review/revision-2026-11-25');fs.mkdirSync(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox','--disable-crash-reporter','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.setViewport({width:1010,height:900,deviceScaleFactor:1});
const slugs='shape-transform,corner-peel,form-send-flight,timeline-rise,device-conditions';
for(const theme of ['light','dark']) {
 await page.goto(`http://127.0.0.1:4198/check.html?theme=${theme}&slugs=${slugs}&progress=0,.5,.8`,{waitUntil:'networkidle0'});
 await page.waitForFunction('window.__ready === true');
 errors.push(...await page.evaluate('window.__fxCheck'));
 await page.screenshot({path:path.join(out,`changes-${theme}.png`),fullPage:true});
}
for(const slug of ['corner-peel','form-send-flight']) {
 await page.goto(`http://127.0.0.1:4198/check.html?slugs=${slug}&progress=0,.25,.4,.5,.6,.67,.75,.85,1`,{waitUntil:'networkidle0'});
 await page.waitForFunction('window.__ready === true');
 await page.screenshot({path:path.join(out,`${slug}-sequence.png`),fullPage:true});
}
for(const [slug,values,expected] of [
 ['device-conditions',{conditions:[{label:'Touch input',at:.1},{label:'Offline',at:.3,passed:false},{label:'Reduced motion',at:.5}],fromDevice:{width:440,height:180},toDevice:{width:230,height:210},darkScreen:false},'Reduced motion'],
 ['device-conditions',{conditions:[],showConditions:false},null],
 ['timeline-rise',{segments:[{label:'Q1',color:'#FB4001'},{label:'Q2',color:'#FBA107'}],fromValue:100,toValue:25,unit:'k',riseStart:0,riseEnd:1},'+25k'],
 ['timeline-rise',{labels:[],fromValue:40,toValue:40,showSegments:false,showAxes:false,showArea:false,unit:' units'},'+40 units'],
]) {
 await page.goto(`http://127.0.0.1:4198/check.html?slugs=${slug}&progress=0,.5,1&values=${encodeURIComponent(JSON.stringify(values))}`,{waitUntil:'networkidle0'});
 await page.waitForFunction('window.__ready === true');
 errors.push(...await page.evaluate('window.__fxCheck'));
 if(expected && !(await page.evaluate(()=>document.body.textContent)).includes(expected)) errors.push(`Missing custom content: ${expected}`);
}
const results=await page.evaluate(async()=>{
 const {EFFECTS}=await import('/@fs/C:/Users/HomePC/Desktop/PROJECTS/remotion projects/shared-effects/meta/effects.ts');
 const FX=await import('/@fs/C:/Users/HomePC/Desktop/PROJECTS/remotion projects/shared-effects/index.ts');
 const removed=['venetian-blinds','document-mosaic','particle-gather','pendulum','node-lockup','weighted-toggle','chat-send','message-reroute','curve-crossfade'];
 const centers=[0,.1,.25,.5,.75,1].map(progress=>FX.ShapeTransform({progress,from:{x:320,y:180,width:56,height:56,radius:28},to:{x:450,y:80,width:300,height:110,radius:22}}).props.style);
 return {count:EFFECTS.length,removedAbsent:removed.every(s=>!EFFECTS.some(m=>m.slug===s)),centerFixed:centers.every(s=>s.left===320&&s.top===180),sizes:centers.map(s=>[s.width,s.height]),exports:['DeviceFrame','ConditionChecklist','TimelineSegments','RisePlot'].every(k=>typeof FX[k]==='function')};
});
await browser.close();
fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify({results,errors},null,2));
console.log(JSON.stringify({results,errors}));
if(errors.length||results.count!==66||!results.removedAbsent||!results.centerFixed||!results.exports)process.exit(1);
