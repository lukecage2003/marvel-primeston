/* Construit comics.json : chaque référence citée dans data.js, découpée en notice (série, volume, numéro, année)
   et la liste des fiches qui la citent. Base de la future archive des preuves (DATA_MODEL.md, Comic/Evidence).
   Les références d'arc sans numéro (« Immortal Hulk (Al Ewing, 2018-21) ») sont gardées telles quelles, type « arc ».
   Lancer : node tools/comics.js   (les tests vérifient que le fichier est à jour) */
const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'..');global.window={};require(path.join(root,'data.js'));
const C={};
for(const [id,r] of Object.entries(window.DB.E))for(let part of String(r[5]).split(' · ')){
 part=part.replace(/\s*—.*$/,'').replace(/^1ʳᵉ apparition selon marvel\.fandom\.com :\s*/,'').trim();if(!part)continue;
 const m=part.match(/^(.*?)(?: vol\. (\d+))? #([\w.-]+(?:-\d+)?)(?: \(([^)]*)\))?$/),y=(part.match(/\b(19|20)\d\d\b/)||[])[0]||null;
 const key=m?`${m[1]}|${m[2]||1}|${m[3]}`:part;
 const e=C[key]||(C[key]=m?{type:'issue',series:m[1].trim(),volume:+(m[2]||1),issue:m[3],year:y,label:part.replace(/\s*\([^)]*\)$/,'')}:{type:'arc',label:part,year:y});
 if(e.year==null&&y)e.year=y;(e.citedBy=e.citedBy||[]).includes(id)||e.citedBy.push(id)}
const out=Object.values(C).sort((a,b)=>(a.year||'9999').localeCompare(b.year||'9999')||a.label.localeCompare(b.label));
const txt=JSON.stringify(out,null,1)+'\n',f=path.join(root,'comics.json');
if(process.argv.includes('--check')){const okk=fs.existsSync(f)&&fs.readFileSync(f,'utf8')===txt;console.log(okk?'comics.json à jour':'comics.json périmé : node tools/comics.js');process.exit(okk?0:1)}
fs.writeFileSync(f,txt);
console.log(out.length,'références :',out.filter(x=>x.type=='issue').length,'numéros,',out.filter(x=>x.type=='arc').length,'arcs ;',out.filter(x=>!x.year).length,'sans année');
