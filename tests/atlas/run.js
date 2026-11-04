/* Suite de tests de l'atlas Cosmologie Marvel (racine du dépôt).
   Lancer : node tests/atlas/run.js            (rapide, ~1 min)
            node tests/atlas/run.js --video    (ajoute un enregistrement vidéo de 15 s et le quiz vidéo)
   Prérequis : Playwright (npm i -D playwright puis npx playwright install chromium). */
const {chromium}=require('playwright'),path=require('path');
const ROOT=path.resolve(__dirname,'../..'),VIDEO=process.argv.includes('--video');let URL;
/* petit serveur statique local : même comportement que GitHub Pages (fetch, chemins relatifs) */
const http=require('http'),fsx=require('fs'),MIME={'.html':'text/html','.css':'text/css','.svg':'image/svg+xml','.js':'text/javascript','.webp':'image/webp','.png':'image/png','.json':'application/json'};
const srv=http.createServer((q,r)=>{const f=path.join(ROOT,decodeURIComponent(q.url.split('?')[0])==='/'?'explorer.html':decodeURIComponent(q.url.split('?')[0]));
 if(!f.startsWith(ROOT)||!fsx.existsSync(f)){r.writeHead(404);return r.end()}r.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});fsx.createReadStream(f).pipe(r)});
let pass=0,fail=0;const ok=(c,m)=>{c?pass++:fail++;console.log((c?'  ✓ ':'  ✗ ')+m)};
(async()=>{await new Promise(r=>srv.listen(0,'127.0.0.1',r));URL=`http://127.0.0.1:${srv.address().port}/explorer.html`;const b=await chromium.launch(),errs=[];
 const page=async(vp={width:1280,height:800},q='')=>{const p=await b.newPage({viewport:vp,acceptDownloads:true});p.on('pageerror',e=>errs.push(e.message));await p.goto(URL+q);await p.waitForFunction(()=>typeof IDX!=='undefined'&&document.querySelector('#svg g'));return p};
 const L=(t)=>console.log('\n'+t);
 let p=await page();
 L('Données');
 const d=await p.evaluate(()=>{const bad=[],nos=[];Object.entries(IDX).forEach(([id,x])=>{((EX[id]?EX[id][1]:x.rel)||'').split(' ').forEach(r=>r&&!IDX[r]&&bad.push(id+'>'+r));if(x.m>=6&&!x.src)nos.push(id)});
  const E=window.DB.E,shape=Object.entries(E).filter(([,r])=>r.length!=9||!'cdtu'.includes(r[6])||!CATS[r[2]]).map(([k])=>k);
  return{n:Object.keys(IDX).length,bad,nos,shape,wq:Object.keys(E).filter(i=>!WQ[i])}});
 ok(d.n>=300,`${d.n} fiches (≥ 300)`);ok(!d.bad.length,'aucun lien cassé '+d.bad.slice(0,5));ok(!d.nos.length,'aucune source manquante '+d.nos.slice(0,5));
 ok(!d.shape.length,'format des fiches (9 champs, certitude, catégorie) '+d.shape.slice(0,5));ok(!d.wq.length,'titre wiki (WQ) pour chaque fiche '+d.wq.slice(0,5));
 {const fs=require('fs'),crypto=require('crypto'),root=path.resolve(__dirname,'../..'),html=fs.readFileSync(root+'/explorer.html','utf8');
  const st=['data.js','images.js'].every(f=>html.includes(`${f}?v=${crypto.createHash('sha1').update(fs.readFileSync(root+'/'+f)).digest('hex').slice(0,10)}`));
  ok(st,'versions ?v= à jour (sinon : node tools/stamp.js)')}
 {const r=require('child_process').spawnSync('node',[path.join(ROOT,'tools/comics.js'),'--check']);ok(r.status===0,'comics.json à jour (sinon : node tools/comics.js)')}
 {const n=await p.evaluate(async()=>{const u=Object.values(window.IMG);const r=await Promise.all(u.map(x=>fetch(x).then(r=>r.ok).catch(()=>false)));return r.filter(Boolean).length});ok(n==Object.keys(await p.evaluate(()=>window.IMG)).length,'portraits img/*.webp accessibles ('+n+')')}
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
  if(f&&x=='html'){const t=require('fs').readFileSync(await f.path(),'utf8');ok(t.includes('window.DB=')&&t.includes('data:image/webp')&&!/src="(data|images)\.js/.test(t),'HTML autonome : données et portraits intégrés (hors ligne)')}}
 L('Quiz');
 await p.click('#bquiz');await p.waitForTimeout(300);const deck=await p.evaluate(()=>QZ.d.every(([a,b])=>Math.abs(POW[a]-POW[b])>=8&&IDX[a]&&IDX[b]));ok(deck,'duels valides (écart ≥ 8, entités existantes)');
 await p.click('#qza');ok(/1$/.test(await p.textContent('#qzs')),'score mis à jour après réponse');await p.click('[data-q=x]');
 L('Langue');
 await p.click('#blang');ok((await p.textContent('#tabs')).includes('The Tree'),'interface en anglais');await p.click('#blang');ok((await p.textContent('#tabs')).includes('L’Arbre'),'retour en français');
 L('Sécurité');
 const sec=await p.evaluate(()=>{const id='x_galan';WC[id]={u:'https://static.wikia.nocookie.net/x.jpg',t:'<img src=x onerror="window.__x=1">'};select(C.nodes.findIndex(n=>n.id==id));return{esc:escH('<a href="x">'),inj:!!document.querySelector('#panel .src img'),win:window.__x||0}});
 ok(sec.esc=='&lt;a href=&quot;x&quot;&gt;','escH échappe le HTML');ok(!sec.inj&&!sec.win,'titre wiki malveillant non interprété');await p.close();
 L('Pages éditoriales');
 {const cp=require('child_process');for(const [tool,lbl] of [['build.js','pages générées à jour (sinon : node tools/build.js)'],['snapshot.js','content/atlas.json à jour (sinon : node tools/snapshot.js)']]){const r=cp.spawnSync('node',[path.join(ROOT,'tools',tool),'--check']);ok(r.status===0,lbl+(r.status?' · '+String(r.stderr).slice(0,120):''))}}
 {const fs=require('fs'),files=['index.html','encyclopedie.html','cosmos.html','structures.html','chronologie.html','archive.html','dossiers.html','recherche.html',...fs.readdirSync(ROOT+'/fiche').map(f=>'fiche/'+f),...fs.readdirSync(ROOT+'/dossier').map(f=>'dossier/'+f)];
  const broken=[],noh1=[],noalt=[];for(const f of files){const h=fs.readFileSync(path.join(ROOT,f),'utf8'),dir=path.dirname(f);
   if(!/<h1[\s>]/.test(h))noh1.push(f);if(/<img(?![^>]*\balt=)[^>]*>/.test(h))noalt.push(f);
   for(const m of h.matchAll(/(?:href|src)="([^"#?]+)[^"]*"/g)){const u=m[1];if(/^(https?:|mailto:|data:)/.test(u))continue;if(!fs.existsSync(path.join(ROOT,dir,u)))broken.push(f+' → '+u)}}
  ok(!broken.length,`liens internes valides dans ${files.length} pages `+broken.slice(0,3));ok(!noh1.length,'chaque page a un titre h1 '+noh1.slice(0,3));ok(!noalt.length,'chaque image a un texte alternatif '+noalt.slice(0,3))}
 {const q=await b.newPage({viewport:{width:390,height:844}}),pe=[];q.on('pageerror',e=>pe.push(e.message));const base=URL.replace('explorer.html','');
  await q.goto(base+'encyclopedie.html');const all=await q.locator('[data-filter-list] > :not([hidden])').count();await q.click('[data-filter=cat][data-value=cel]');const cel=await q.locator('[data-filter-list] > :not([hidden])').count();ok(all>290&&cel>0&&cel<all,`filtre de l’encyclopédie (${all} → ${cel})`);
  await q.goto(base+'recherche.html?q=galactus');await q.waitForTimeout(600);ok(await q.locator('#results a').count()>0,'recherche « galactus » sur la page Recherche');
  await q.fill('#q2','Firelord');await q.waitForTimeout(400);ok((await q.textContent('#results')).includes('Firelord'),'recherche par nom anglais');
  await q.goto(base+'index.html#h_firelord');await q.waitForURL(/explorer\.html#h_firelord/,{timeout:5000}).catch(()=>0);ok(q.url().includes('explorer.html#h_firelord'),'ancien lien #id redirigé vers l’explorateur');
  for(const u of ['index.html','encyclopedie.html','fiche/x_galan.html','chronologie.html','archive.html']){await q.goto(base+u);const o=await q.evaluate(()=>document.documentElement.scrollWidth-innerWidth);if(o>1)pe.push('débordement '+u)}
  ok(!pe.length,'pages éditoriales sans erreur JS ni débordement à 390 px '+pe.slice(0,3));await q.close()}
 L('Responsive');
 for(const [w,h] of [[360,740],[768,1024],[1280,800],[1920,1080]]){const q=await page({width:w,height:h});const o=await q.evaluate(()=>document.documentElement.scrollWidth-innerWidth);ok(o<=1,`pas de défilement horizontal à ${w}px`);await q.close()}
 if(VIDEO){L('Vidéo');const q=await page();const dls=[];q.on('download',x=>dls.push(x.suggestedFilename()));await q.evaluate(()=>{render(0);$('#vwhat').value='map';$('#vlen').value='15';makeVideo('v916')});
 await q.waitForTimeout(26000);ok(dls.some(x=>/\.(mp4|webm)$/.test(x))&&dls.some(x=>x.endsWith('.srt')),'vidéo TikTok 15 s + .srt : '+dls.join(', '));await q.close()}
 ok(!errs.length,'aucune erreur JS pendant toute la suite '+errs.slice(0,3));
 console.log(`\n${pass} réussis, ${fail} échoués`);await b.close();srv.close();process.exit(fail?1:0)})().catch(e=>{console.error(e);process.exit(1)});
