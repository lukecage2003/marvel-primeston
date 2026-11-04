/* Ajoute à data.js et images.js un numéro de version (?v=) calculé sur leur contenu, dans index.html.
   Le navigateur recharge ainsi ces fichiers dès qu'ils changent (le cache de GitHub Pages dure 10 min).
   À lancer après chaque modification des données : node tools/stamp.js   (les tests vérifient que c'est fait) */
const fs=require('fs'),path=require('path'),crypto=require('crypto'),root=path.resolve(__dirname,'..');
const hash=f=>crypto.createHash('sha1').update(fs.readFileSync(path.join(root,f))).digest('hex').slice(0,10);
const p=path.join(root,'explorer.html');let s=fs.readFileSync(p,'utf8'),n=0;
for(const f of ['data.js','images.js'])s=s.replace(new RegExp(`<script src="${f.replace('.','\\.')}(\\?v=[0-9a-f]*)?"></script>`,'g'),()=>{n++;return `<script src="${f}?v=${hash(f)}"></script>`});
fs.writeFileSync(p,s);console.log(n==2?'versions à jour':'balises introuvables : '+n);process.exit(n==2?0:1);
