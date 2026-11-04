/* Suite de tests de l'atlas Cosmologie Marvel (racine du dépôt).
   Lancer : node tests/atlas/run.js            (rapide, ~1 min)
            node tests/atlas/run.js --video    (ajoute un enregistrement vidéo de 15 s et le quiz vidéo)
   Prérequis : Playwright (npm i -D playwright puis npx playwright install chromium). */
const {chromium}=require('playwright'),path=require('path');
const URL='file://'+path.resolve(__dirname,'../../index.html'),VIDEO=process.argv.includes('--video');
let pass=0,fail=0;const ok=(c,m)=>{c?pass++:fail++;console.log((c?'  ✓ ':'  ✗ ')+m)};
(async()=>{const b=await chromium.launch(),errs=[];
 const page=async(vp={width:1280,height:800},q='')=>{const p=await b.newPage({viewport:vp,acceptDownloads:true});p.on('pageerror',e=>errs.push(e.message));await p.goto(URL+q);await p.waitForFunction(()=>typeof IDX!=='undefined'&&document.querySelector('#svg g'));return p};
 const L=(t)=>console.log('\n'+t);
 let p=await page();
 L('Données');
 const d=await p.evaluate(()=>{const bad=[],nos=[];Object.entries(IDX).forEach(([id,x])=>{((EX[id]?EX[id][1]:x.rel)||'').split(' ').forEach(r=>r&&!IDX[r]&&bad.push(id+'>'+r));if(x.m>=6&&!x.src)nos.push(id)});
  const E=window.DB.E,shape=Object.entries(E).filter(([,r])=>r.length!=9||!'cdtu'.includes(r[6])||!CATS[r[2]]).map(([k])=>k);
  return{n:Object.keys(IDX).length,bad,nos,shape,wq:Object.keys(E).filter(i=>!WQ[i])}});
 ok(d.n>=300,`${d.n} fiches (≥ 300)`);ok(!d.bad.length,'aucun lien cassé '+d.bad.slice(0,5));ok(!d.nos.length,'aucune source manquante '+d.nos.slice(0,5));
 ok(!d.shape.length,'format des fiches (9 champs, certitude, catégorie) '+d.shape.slice(0,5));ok(!d.wq.length,'titre wiki (WQ) pour chaque fiche '+d.wq.slice(0,5));
 {const fs=require('fs'),crypto=require('crypto'),root=path.resolve(__dirname,'../..'),html=fs.readFileSync(root+'/index.html','utf8');
  const st=['data.js','images.js'].every(f=>html.includes(`${f}?v=${crypto.createHash('sha1').update(fs.readFileSync(root+'/'+f)).digest('hex').slice(0,10)}`));
  ok(st,'versions ?v= à jour (sinon : node tools/stamp.js)')}
 L('Cartes et formats');
 for(const f of ['free','916','169','45','11'])for(let m=0;m<8;m++){await p.evaluate(([f,m])=>{setFmt(f);render(m);select(0);select(-1)},[f,m])}
 ok(!errs.length,'8 cartes × 5 formats sans erreur JS');
 const counts=[];for(let m=0;m<8;m++)counts.push(await p.evaluate(m=>{render(m);return svg.querySelectorAll('*').length},m));
 ok(Math.max(...counts)<6000,'budget SVG < 6000 éléments par carte : '+counts.join(' '));
 L('Codex et recherche');
 await p.evaluate(()=>codex(1));await p.fill('#cxq','galactus');await p.waitForTimeout(200);ok(await p.locator('#cxg .cxe').count()>3,'recherche FR « galactus »');
 await p.fill('#cxq','Firelord');await p.waitForTimeout(200);ok(await p.locator('#cxg .cxe').count()>=1,'recherche EN « Firelord »');await p.evaluate(()=>codex(0));
 await p.evaluate(()=>{location.hash='#h_firelord'});await p.waitForTimeout(1500);ok(await p.evaluate(()=>C.nodes[S.sel]?.id)=='h_firelord','lien #id ouvre la fiche');
 L('Exports');
 for(const [x,ext] of [['svg','.svg'],['html','.html'],['png','.png']]){const dl=p.waitForEvent('download',{timeout:20000}).catch(()=>null);await p.evaluate(x=>exp(x),x);const f=await dl;ok(f&&f.suggestedFilename().endsWith(ext),'export '+x);
  if(f&&x=='html'){const t=require('fs').readFileSync(await f.path(),'utf8');ok(t.includes('window.DB=')&&t.includes('window.IMG=')&&!/src="(data|images)\.js/.test(t),'HTML autonome : données et images intégrées')}}
 L('Quiz');
 await p.click('#bquiz');await p.waitForTimeout(300);const deck=await p.evaluate(()=>QZ.d.every(([a,b])=>Math.abs(POW[a]-POW[b])>=8&&IDX[a]&&IDX[b]));ok(deck,'duels valides (écart ≥ 8, entités existantes)');
 await p.click('#qza');ok(/1$/.test(await p.textContent('#qzs')),'score mis à jour après réponse');await p.click('[data-q=x]');
 L('Langue');
 await p.click('#blang');ok((await p.textContent('#tabs')).includes('The Tree'),'interface en anglais');await p.click('#blang');ok((await p.textContent('#tabs')).includes('L’Arbre'),'retour en français');
 L('Sécurité');
 const sec=await p.evaluate(()=>{const id='x_galan';WC[id]={u:'https://static.wikia.nocookie.net/x.jpg',t:'<img src=x onerror="window.__x=1">'};select(C.nodes.findIndex(n=>n.id==id));return{esc:escH('<a href="x">'),inj:!!document.querySelector('#panel .src img'),win:window.__x||0}});
 ok(sec.esc=='&lt;a href=&quot;x&quot;&gt;','escH échappe le HTML');ok(!sec.inj&&!sec.win,'titre wiki malveillant non interprété');await p.close();
 L('Responsive');
 for(const [w,h] of [[360,740],[768,1024],[1280,800],[1920,1080]]){const q=await page({width:w,height:h});const o=await q.evaluate(()=>document.documentElement.scrollWidth-innerWidth);ok(o<=1,`pas de défilement horizontal à ${w}px`);await q.close()}
 if(VIDEO){L('Vidéo');const q=await page();const dls=[];q.on('download',x=>dls.push(x.suggestedFilename()));await q.evaluate(()=>{render(0);$('#vwhat').value='map';$('#vlen').value='15';makeVideo('v916')});
 await q.waitForTimeout(26000);ok(dls.some(x=>/\.(mp4|webm)$/.test(x))&&dls.some(x=>x.endsWith('.srt')),'vidéo TikTok 15 s + .srt : '+dls.join(', '));await q.close()}
 ok(!errs.length,'aucune erreur JS pendant toute la suite '+errs.slice(0,3));
 console.log(`\n${pass} réussis, ${fail} échoués`);await b.close();process.exit(fail?1:0)})().catch(e=>{console.error(e);process.exit(1)});
