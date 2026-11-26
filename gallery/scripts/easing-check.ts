import assert from 'node:assert/strict';
import {applyEasing,normalizeEasing} from '../../core/easing';
import {EFFECTS} from '../../meta/effects';
import {supportsEasing} from '../src/lib/easing';
import {usageSnippet} from '../src/lib/snippet';

const curves=[[0,0,1,1],[.42,0,1,1],[0,0,.58,1],[.42,0,.58,1],[0,1,0,1],[1,0,1,0]];
for(const c of curves){
 assert.equal(applyEasing(0,c),0);assert.equal(applyEasing(1,c),1);
 let previous=0;
 for(let i=0;i<=100;i++){const y=applyEasing(i/100,c);assert(y>=previous-1e-8&&y>=0&&y<=1);previous=y;}
}
assert.equal(applyEasing(.37),.37);
assert.equal(applyEasing(.37,[0,0,1,1]),.37);
assert(Math.abs(applyEasing(.5,[.42,0,.58,1])-.5)<1e-7);
assert(applyEasing(.25,[.42,0,1,1])<.25);
assert(applyEasing(.25,[0,0,.58,1])>.25);
assert.deepEqual(normalizeEasing([null,Infinity,2,3]),[0,0,1,1]);
for(const meta of EFFECTS){
 const code=usageSnippet(meta,{easingCurve:[.42,0,.58,1]},{});
 assert.equal(code.includes('applyEasing(rawProgress'),supportsEasing(meta));
 assert(!code.includes('easingCurve='),'Gallery-only control must not leak into component props');
 if(meta.file==='CompleteOptional.tsx')assert(code.includes('import {applyEasing} from "./effects";'));
}
console.log(`Easing math and copied-code checks passed for ${EFFECTS.length} effects.`);
