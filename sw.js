self.addEventListener('install',e=>{e.waitUntil(caches.open('hk1').then(c=>c.addAll(['/','/icon.svg'])));});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));});
