// Hikayat Studio server: static files + secure proxy to Gemini TTS. No dependencies (Node 18+).
const http=require('http'),fs=require('fs'),path=require('path');
const PORT=process.env.PORT||3000,PUB=__dirname,OK=['index.html','manifest.json','icon.svg','sw.js'];
const MODEL=process.env.GEMINI_TTS_MODEL||'gemini-3.8-flash-tts';
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml'};
const send=(res,c,o)=>{res.writeHead(c,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(o));};
async function tts(req,res){
  let b='';for await(const c of req){b+=c;if(b.length>3e5)return send(res,413,{error:'too_long'});}
  let d;try{d=JSON.parse(b)}catch{return send(res,400,{error:'bad_request'})}
  const key=process.env.GEMINI_API_KEY||req.headers['x-api-key'];
  if(!key)return send(res,401,{error:'no_key'});
  if(!d.text||d.text.length>6000)return send(res,400,{error:'too_long'});
  // Gemini 3.8: text is the verbatim transcript; style goes in speech_metadata
  const body={contents:[{role:'user',parts:[{text:d.text,speech_metadata:{style:d.style||''}}]}],
    generationConfig:{responseModalities:['AUDIO'],speechConfig:{voiceConfig:{prebuiltVoiceConfig:{voiceName:d.voice||'Kore'}}}}};
  try{
    const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},body:JSON.stringify(body)});
    const j=await r.json().catch(()=>({}));
    if(!r.ok){const m=(j.error&&j.error.message)||'';
      let e='api_error';
      if(r.status===429)e='quota';else if(r.status===401||r.status===403||/API key/i.test(m))e='bad_key';
      return send(res,r.status,{error:e,message:m});}
    const p=j.candidates&&j.candidates[0]&&j.candidates[0].content&&j.candidates[0].content.parts;
    const a=p&&p.find(x=>x.inlineData);
    if(!a)return send(res,502,{error:'no_audio'});
    send(res,200,{pcm:a.inlineData.data,mime:a.inlineData.mimeType});
  }catch{send(res,503,{error:'network'});}
}
http.createServer((req,res)=>{
  if(req.method==='POST'&&req.url==='/api/tts')return tts(req,res);
  let f=req.url.split('?')[0];if(f==='/')f='/index.html';
  if(!OK.includes(f.slice(1)))return send(res,404,{});
  const p=path.join(PUB,f);
  fs.readFile(p,(e,c)=>{if(e)return send(res,404,{});res.writeHead(200,{'Content-Type':MIME[path.extname(p)]||'application/octet-stream'});res.end(c);});
}).listen(PORT,()=>console.log('Hikayat Studio: http://localhost:'+PORT));
