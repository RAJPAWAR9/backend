/* BOOSTER boot: points the player at the server. Everything else lives on the server. */
window.BOOSTER_SERVER=(function(){var s='';try{s=localStorage.getItem('bos_server')||''}catch(e){}return(s||'https://boostersever.raj-pawar091206.workers.dev').replace(/\/$/,'')})();
window.__boosterDown=function(){return false;}; window.__boosterMarkDown=function(){};
/* Optional yt-dlp audio server (see ydl_server/README.md). Leave empty to keep it OFF.
   Put your server URL here (https://..., or http://localhost:8787 for testing), or run once in the browser console:
   localStorage.setItem('bos_ydl','https://your-server') */
window.BOOSTER_YTDLP=(function(){
  var DEFAULT_YDL='https://booster-ydl.onrender.com';
  var s=''; try{s=localStorage.getItem('bos_ydl')||''}catch(e){}
  s=String(s||DEFAULT_YDL).replace(/\/$/,'');
  return /^(https:\/\/|http:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$))/.test(s)?s:'';
})();
(function(){
  var S=window.BOOSTER_SERVER; if(!/^https:\/\//.test(S)){ window.BOOSTER_SERVER=''; return; }
  var __bd=0; window.__boosterDown=function(){return Date.now()<__bd;}; window.__boosterMarkDown=function(){__bd=Date.now()+60000;};
  var of=window.fetch.bind(window); window.__origFetch=of;
  window.BOOSTER_DL_SERVER=S; window.BOOSTER_LY_SERVER=S;
  /* which services are switched ON (public, no secrets). Refreshed every minute. */
  window.__bosFlags={};
  (function pull(){ of(S+'/flags').then(function(r){return r.json();}).then(function(j){ if(j&&typeof j==='object') window.__bosFlags=j; }).catch(function(){}); setTimeout(pull,60000); })();
  /* your own lyrics now come from the server (My Lyrics plugin) */
  window.MY_LYRICS=window.MY_LYRICS||[];
  (function(){ try{ var sc=document.createElement('script'); sc.async=true; sc.src=S+'/lyrics.js'; sc.onerror=function(){}; (document.head||document.documentElement).appendChild(sc); }catch(e){} })();
  /* Every cross-site https request goes through the server's /p proxy, so the browser never talks to third parties.
     Direct fallback only if the server is unreachable AND strict mode is off (localStorage bos_strict=1 turns fallback off). */
  var strict=false; try{strict=localStorage.getItem('bos_strict')==='1';}catch(e){}
  window.fetch=function(i,o){
    var u=null; try{ if(typeof i==='string'||i instanceof URL) u=new URL(String(i),location.href); }catch(e){}
    if(u&&u.protocol==='https:'&&u.origin!==location.origin&&u.origin!==S&&!/\.workers\.dev$/.test(u.hostname)){
      if(window.__boosterDown()&&!strict) return of(i,o);
      return viaProxy(i,o,u);
    }
    return of(i,o);
  };
  function direct(i,o,res,rej){ if(strict) return rej(new TypeError('blocked')); of(i,o).then(res,rej); }
  function viaProxy(i,o,u){
    return new Promise(function(res,rej){
      var done=false, ac=(typeof AbortController!=='undefined')?new AbortController():null, opt=o?Object.assign({},o):{};
      if(ac&&!opt.signal) opt.signal=ac.signal;
      var tm=setTimeout(function(){ if(done) return; done=true; try{ if(ac) ac.abort(); }catch(e){} direct(i,o,res,rej); },12000);
      of(S+'/p?u='+encodeURIComponent(u.href),opt).then(function(r){
        if(done) return; done=true; clearTimeout(tm);
        if(r.status===403&&r.headers.get('X-Booster-Deny')) return direct(i,o,res,rej);
        res(r);
      },function(e){
        if(done) return; done=true; clearTimeout(tm);
        if(o&&o.signal&&o.signal.aborted) return rej(e);
        window.__boosterMarkDown(); direct(i,o,res,rej);
      });
    });
  }
})();
