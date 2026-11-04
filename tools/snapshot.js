/* Instantané des données de l'atlas (fiches de data.js ET nœuds des 8 cartes, relations, catégories, niveaux)
   → content/atlas.json, lu par le générateur de pages (tools/build.js).
   Nécessite Playwright (outil de développement). Lancer : node tools/snapshot.js   (--check : vérifie sans écrire) */
const {chromium}=require('playwright'),path=require('path'),fs=require('fs'),http=require('http');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'content/atlas.json'),CHECK=process.argv.includes('--check');
const MIME={'.html':'text/html','.css':'text/css','.svg':'image/svg+xml','.js':'text/javascript','.webp':'image/webp','.png':'image/png','.json':'application/json'};
const srv=http.createServer((q,r)=>{const f=path.join(ROOT,decodeURIComponent(q.url.split('?')[0]));if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end()}
 r.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r)});
(async()=>{await new Promise(r=>srv.listen(0,'127.0.0.1',r));const b=await chromium.launch(),p=await b.newPage();
 await p.goto(`http://127.0.0.1:${srv.address().port}/explorer.html`);await p.waitForFunction(()=>typeof IDX!=='undefined');
 const d=await p.evaluate(()=>{const N={};for(const [id,x] of Object.entries(IDX)){if(x.u)continue;N[id]={map:x.m,name:x.t,en:x.en&&x.en!=x.t?x.en:undefined,sub:x.s||undefined,desc:x.d||undefined,cat:x.cat,cert:x.cert||'u',
   src:(EX[id]?EX[id][0]:x.src)||undefined,fact:(EX[id]?EX[id][2]:x.fact)||undefined,year:x.yr?Math.floor(x.yr):undefined,rel:[...(RELS[id]||[])].filter(r=>IDX[r]&&!IDX[r].u).sort()}}
  return{maps:MAPS.map(m=>({name:m.n,sub:m.sub})),cats:Object.fromEntries(Object.entries(CATS).map(([k,v])=>[k,{name:v[0],color:v[1]}])),cert:Object.fromEntries(Object.entries(CERT).map(([k,v])=>[k,{name:v[0],desc:v[1]}])),
   wiki:WQ,img:Object.fromEntries(Object.keys(N).map(id=>[id,(window.IMG||{})[id]||(window.IMG||{})[IMAP[id]]]).filter(x=>x[1])),nodes:N,
   cosmos:COS.map(r=>r[0])}});
 await b.close();srv.close();const txt=JSON.stringify(d,null,1)+'\n';
 if(CHECK){const ok=fs.existsSync(OUT)&&fs.readFileSync(OUT,'utf8')===txt;console.log(ok?'atlas.json à jour':'atlas.json périmé : node tools/snapshot.js');process.exit(ok?0:1)}
 fs.writeFileSync(OUT,txt);console.log(Object.keys(d.nodes).length,'fiches dans content/atlas.json')})().catch(e=>{console.error(e);process.exit(1)});
