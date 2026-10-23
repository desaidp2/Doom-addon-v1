"use strict";
// Read-only site connectivity check. Does not bypass anti-bot controls.
const targets = [
 "https://bingebang.st/",
 "https://67movies.st/",
 "https://movienerds.site/",
 "https://pressplayx.to/"
];
async function check(url) {
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),10000);
 try {
  const r=await fetch(url,{redirect:"follow",signal:controller.signal,headers:{"Accept":"text/html,application/json;q=0.9,*/*;q=0.8"}});
  console.log(JSON.stringify({target:url,status:r.status,finalHost:new URL(r.url).hostname,contentType:r.headers.get("content-type"),cloudflareRayPresent:r.headers.has("cf-ray")}));
  await r.body?.cancel();
 } catch(e){console.log(JSON.stringify({target:url,error:e.name,detail:e.message}));}
 finally{clearTimeout(timeout);}
}
(async()=>{for(const url of targets)await check(url)})();
