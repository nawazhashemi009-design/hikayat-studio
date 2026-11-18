self.addEventListener('install',e=>{e.waitUntil(caches.open('hk2').then(c=>c.addAll(['./','icon.svg'])));});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||!e.request.url.startsWith(self.location.origin))return;e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));});
