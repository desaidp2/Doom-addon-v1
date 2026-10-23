const {execFileSync}=require('node:child_process');
const fs=require('node:fs');
const root='fmhy-core';
execFileSync('git',['clone','--depth','1','https://github.com/RisPNG/fmhywebstremio.git',root],{stdio:'inherit'});
const file=root+'/src/addon/stremio-adapter/runtime-adapter.ts';
let s=fs.readFileSync(file,'utf8');
const old="  const player = stream.hostExtractor?.trim() || 'N/A';";
if(!s.includes(old))throw Error('Upstream formatter changed');
s=s.replace(old,'');
const addition="\n  const matrix = ([[/67movies|sixty.seven/i,'🕶️ NEO'],[/movienerds/i,'🕴️ SMITH'],[/pressplayx/i,'💊 MORPHEUS'],[/cineruv/i,'⚡ TRINITY'],[/milkbox/i,'🔮 ORACLE'],[/bilibili/i,'♟️ ARCHITECT'],[/anicine/i,'🛡️ SERAPH']] as const).find(([re]) => re.test(brand) || re.test(website))?.[1] ?? '◈ MATRIX';";
s=s.replace("  const website =",addition+"\n  const website =");
const before='name: `${brand} ${resolution}\\n${language}`, title: `${website} . ${player}`';
const after='name: `${matrix} · ${resolution}`, title: `${language} · ${brand}`';
if(!s.includes(before))throw Error('Stremio return format changed');
s=s.replace(before,after);
const mapping='return { streams: result.streams.map((stream) => {';
if(!s.includes(mapping))throw Error('Stream mapping changed');
const filtered=`return { streams: result.streams.filter(stream => {
  const langs = [stream.language, ...(stream.audioLanguages ?? [])].filter(Boolean).map(x => String(x).toLowerCase());
  return !langs.length || langs.some(x => /^(en|eng|english|hi|hin|hindi)$/.test(x));
}).sort((a,b) => (b.resolution?.height ?? 0)-(a.resolution?.height ?? 0) ||
  (String(a.language??'').toLowerCase().startsWith('en')?0:1)-(String(b.language??'').toLowerCase().startsWith('en')?0:1)
).map((stream) => {`;
s=s.replace(mapping,filtered);
fs.writeFileSync(file,s);
execFileSync('npm',['install'],{cwd:root,stdio:'inherit'});
execFileSync('npm',['run','build'],{cwd:root,stdio:'inherit'});