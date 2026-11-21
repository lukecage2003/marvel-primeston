/* Contrôle de mise en page de toutes les cartes (Marvel et DC) : nœuds qui se touchent, étiquettes qui se chevauchent,
   étiquettes sur un autre nœud, titres de décor sur un nœud, nœuds qui débordent de leur panneau.
   Les mots des axes 3D de la carte des Axes tournent avec la vue : ils sont exclus.  Lancer : node tools/layout_check.js */
const {chromium}=require('playwright'),http=require('http'),fs=require('fs'),path=require('path');let bad=0;const ROOT=path.resolve(__dirname,'..');
const MIME={'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json'};
const srv=http.createServer((q,r)=>{const f=path.join(ROOT,decodeURIComponent(q.url.split('?')[0]));if(!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end()}r.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r)});
(async()=>{await new Promise(r=>srv.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${srv.address().port}/explorer.html`;const b=await chromium.launch();
for(const u of ['','?u=dc']){const p=await b.newPage({viewport:{width:1600,height:1000}});await p.goto(base+u);await p.waitForFunction(()=>typeof C!=='undefined'&&C&&C.nodes.length);
 const R=await p.evaluate(()=>MAPS.map((m,i)=>{render(i);const N=C.nodes,ov=[],lab=[],ln=[];
  for(let a=0;a<N.length;a++)for(let c=a+1;c<N.length;c++){const d=Math.hypot(N[a].x-N[c].x,N[a].y-N[c].y);if(d<N[a].r+N[c].r+10)ov.push(N[a].id+'/'+N[c].id)}
  const L=N.map(n=>{const ts=[...n.g.querySelectorAll(':scope > text')];if(!ts.length)return null;let x1=1e9,y1=1e9,x2=-1e9,y2=-1e9;ts.forEach(t=>{const bb=t.getBBox();x1=Math.min(x1,bb.x);y1=Math.min(y1,bb.y);x2=Math.max(x2,bb.x+bb.width);y2=Math.max(y2,bb.y+bb.height)});return[x1,y1,x2,y2]});
  for(let a=0;a<N.length;a++){if(!L[a])continue;for(let c=a+1;c<N.length;c++){if(!L[c])continue;const A=L[a],B=L[c];if(A[0]<B[2]-2&&B[0]<A[2]-2&&A[1]<B[3]-2&&B[1]<A[3]-2)lab.push(N[a].id+'/'+N[c].id)}
   for(let c=0;c<N.length;c++){if(c==a)continue;const A=L[a],n=N[c],cx=Math.max(A[0],Math.min(n.x,A[2])),cy=Math.max(A[1],Math.min(n.y,A[3]));if(Math.hypot(cx-n.x,cy-n.y)<n.r-2)ln.push(N[a].id+'>'+n.id)}}
  const deco=[],pan=[];const nodeBox=(n,a)=>{const A=L[a]||[n.x,n.y,n.x,n.y];return[Math.min(A[0],n.x-n.r),Math.min(A[1],n.y-n.r),Math.max(A[2],n.x+n.r),Math.max(A[3],n.y+n.r)]};
  const hit=(A,B,m=0)=>A[0]<B[2]-m&&B[0]<A[2]-m&&A[1]<B[3]-m&&B[1]<A[3]-m;
  [...svg.querySelectorAll('text')].filter(t=>!t.closest('.n')&&t.textContent.trim()&&getComputedStyle(t).display!='none').forEach(t=>{const b=t.getBBox(),T=[b.x,b.y,b.x+b.width,b.y+b.height];N.forEach((n,a)=>{if(hit(T,nodeBox(n,a),2))deco.push('«'+t.textContent.slice(0,22)+'»>'+n.id)})});
  [...svg.querySelectorAll('rect[rx]')].filter(r=>+r.getAttribute('width')>300).forEach(r=>{const x=+r.getAttribute('x'),y=+r.getAttribute('y'),R0=[x,y,x+ +r.getAttribute('width'),y+ +r.getAttribute('height')];N.forEach((n,a)=>{if(n.x>R0[0]&&n.x<R0[2]&&n.y>R0[1]&&n.y<R0[3]){const B=nodeBox(n,a);if(B[0]<R0[0]+8||B[2]>R0[2]-8||B[1]<R0[1]+8||B[3]>R0[3]-8)pan.push(n.id)}})});
  return{m:m.n,n:N.length,ov,lab,ln,deco,pan}}));
 R.forEach(r=>{if(/Axes/.test(r.m))r.deco=[];const n=r.ov.length+r.lab.length+r.ln.length+r.deco.length+r.pan.length;bad+=n;if(n)console.log(`${u||'marvel'} | ${r.m} | ${r.n} nœuds | nœuds ${r.ov.length} ${r.ov.slice(0,8).join(' ')} | étiquettes ${r.lab.length} ${r.lab.slice(0,8).join(' ')} | étiq/nœud ${r.ln.length} ${r.ln.slice(0,8).join(' ')} | décor ${r.deco.length} ${r.deco.slice(0,6).join(' ')} | panneau ${r.pan.length} ${r.pan.slice(0,8).join(' ')}`)});await p.close()}
await b.close();srv.close();console.log(bad?bad+' problèmes de mise en page':'mise en page nette sur toutes les cartes');process.exit(bad?1:0)})();
