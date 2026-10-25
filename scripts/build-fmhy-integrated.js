const {execFileSync}=require('node:child_process');
const fs=require('node:fs');
const root='fmhy-core';
// Render may restore a previous fmhy-core clone from its build cache.
fs.rmSync(root,{recursive:true,force:true});
execFileSync('git',['clone','--depth','1','https://github.com/RisPNG/fmhywebstremio.git',root],{stdio:'inherit'});
const file=root+'/src/addon/stremio-adapter/runtime-adapter.ts';
let s=fs.readFileSync(file,'utf8');
const old="  const player = stream.hostExtractor?.trim() || 'N/A';";
if(!s.includes(old))throw Error('Upstream formatter changed');
s=s.replace(old,'');
const addition="\n  const matrix = ([[/67movies|sixty.seven/i,'🕶️ NEO'],[/movienerds/i,'🕴️ SMITH'],[/pressplay(?:x)?/i,'💊 MORPHEUS'],[/cineruv/i,'⚡ TRINITY'],[/milkbox/i,'🔮 ORACLE'],[/bilibili/i,'♟️ ARCHITECT'],[/anicine/i,'🛡️ SERAPH']] as const).find(([re]) => re.test(brand) || re.test(website))?.[1] ?? '◈ MATRIX';";
// Batman formatting is resolution-based; no unused Matrix variable is injected.
const before='name: `${brand} ${resolution}\\n${language}`, title: `${website} . ${player}`';
const after='name: `${resolution.startsWith("8K") || resolution.startsWith("4320") ? "🦇 [8K ULTRA] ║ GOTHAM PRIME" : resolution.startsWith("4K") || resolution.startsWith("2160") ? "🦇 [4K UHD] ║ WAYNE-NET CORE" : resolution.startsWith("1080") ? "🦇 [1080p HD] ║ BAT-RADAR" : resolution.startsWith("720") ? "🃏 [720p] ║ JOKER CHAOS" : /cam/i.test(resolution) ? "🃏 [CAM] ║ JOKER CHAOS" : /480|sd/i.test(resolution) ? "🕸️ [480p] ║ ARKHAM MONITOR" : "❓ [UNKNOWN] ║ RIDDLER MYSTERY"}`, title: `${resolution.startsWith("8K") || resolution.startsWith("4320") ? "🎬 DARK KNIGHT // 4320p ULTRA HD" : resolution.startsWith("4K") || resolution.startsWith("2160") ? "🎬 TACTICAL LINK // 2160p KNIGHTFALL" : resolution.startsWith("1080") ? "🎬 RECON FEED // 1080p HIGH-RES" : resolution.startsWith("720") ? "🎬 JOKER TRANSMISSION // 720p HD" : /cam/i.test(resolution) ? "🎬 BOOTLEG TRANSMISSION // CAM" : /480|sd/i.test(resolution) ? "🎬 CELL CAM // 480p LOW-RES" : "🎬 RESOLUTION NOT DETECTED"}\ · 🔊 ${language || "Audio: Not specified"}\ · 📡 ${brand} · ${website}`}';
if(!s.includes(before))throw Error('Stremio return format changed');
s=s.replace(before,after);
// Provider-specific matrix variable is superseded by resolution-based labels.

const mapping='return { streams: result.streams.map((stream) => {';
if(!s.includes(mapping))throw Error('Stream mapping changed');
const filtered=`return { streams: result.streams.filter(stream => {
  const langs = [stream.language, ...(stream.audioLanguages ?? [])].filter(Boolean).map(x => String(x).toLowerCase());
  return !langs.length || langs.some(x => /^(en|eng|english|hi|hin|hindi)$/.test(x));
}).sort((a,b) => (b.resolution?.height ?? 0)-(a.resolution?.height ?? 0) ||
  (String(a.language??'').toLowerCase().startsWith('en')?0:1)-(String(b.language??'').toLowerCase().startsWith('en')?0:1)
).map((stream) => {`;
s=s.replace(mapping,filtered);
const startMark="    const result = await this.engine.findStreams(";
if(!s.includes(startMark))throw Error('Engine request code changed');
s=s.replace(startMark,"    const matrixStartedAt = Date.now();\n"+startMark);
const cacheDecl="export class RuntimeStremioAdapter implements StremioStreamProvider {";
const cacheCode="const matrixResultCache = new Map<string, {expires: number; promise: ReturnType<StreamEngine['findStreams']>}>();\n";
if(!s.includes(cacheDecl))throw Error('adapter class changed');
s=s.replace(cacheDecl,cacheCode+cacheDecl);
const originalFind="    const result = await this.engine.findStreams(parseStremioMediaRequest(type, rawId), { excludedSourceIds: Object.keys(ctx.config).flatMap(key => key.startsWith('disableFmhySource_') ? [key.slice('disableFmhySource_'.length)] : []) });";
if(!s.includes(originalFind))throw Error('engine find call changed');
const cachedFind="    const excludedSourceIds = Object.keys(ctx.config).flatMap(key => key.startsWith('disableFmhySource_') ? [key.slice('disableFmhySource_'.length)] : []);\n    const matrixCacheKey = type + ':' + rawId + ':' + excludedSourceIds.sort().join(',');\n    let matrixCached = matrixResultCache.get(matrixCacheKey);\n    if (!matrixCached || matrixCached.expires < Date.now()) {\n      if(matrixResultCache.size > 100) matrixResultCache.clear();\n      const promise = this.engine.findStreams(parseStremioMediaRequest(type, rawId), { excludedSourceIds });\n      matrixCached = {expires: Date.now()+120000, promise};\n      matrixResultCache.set(matrixCacheKey, matrixCached);\n      promise.catch(() => matrixResultCache.delete(matrixCacheKey));\n    }\n    const result = await matrixCached.promise;";
s=s.replace(originalFind,cachedFind);

const returnsMark="    return { streams: result.streams.filter(stream => {";
if(!s.includes(returnsMark))throw Error('Result return changed');
s=s.replace(returnsMark,"    console.info('[FMHY Integrated] '+type+'/'+rawId+' upstream='+result.streams.length+' elapsedMs='+(Date.now()-matrixStartedAt)+' providers='+JSON.stringify(Object.fromEntries([...new Set(result.streams.map(x=>x.sourceId))].map(id=>[id,result.streams.filter(x=>x.sourceId===id).length]))));\n"+returnsMark);

const failureAnchor="    return { streams: result.streams.filter(stream => {";
if(!s.includes(failureAnchor))throw Error('FMHY failure-log anchor missing');
s=s.replace(failureAnchor,"    console.info('[FMHY failures] '+type+'/'+rawId+' '+JSON.stringify(result.failures.map(f => ({code:f.code,stage:f.stage,sourceId:f.sourceId,familyId:f.familyId}))));\n"+failureAnchor);

fs.writeFileSync(file,s);

execFileSync('npm',['install'],{cwd:root,stdio:'inherit'});
execFileSync('npm',['run','build'],{cwd:root,stdio:'inherit'});