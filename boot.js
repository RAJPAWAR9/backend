/* BOOSTER boot: points the player at YOUR server. Everything else (music API, YouTube, lyrics, proxy) lives on the server.
   Change server once without editing files:  localStorage.setItem('bos_server','https://your-worker.workers.dev')  */
window.BOOSTER_SERVER=(function(){var s='';try{s=localStorage.getItem('bos_server')||''}catch(e){}return(s||'https://boostersever.raj-pawar091206.workers.dev').replace(/\/$/,'')})();
window.__boosterDown=function(){return false;}; window.__boosterMarkDown=function(){};
(function(){
  var S=window.BOOSTER_SERVER; if(!/^https:\/\//.test(S)){ window.BOOSTER_SERVER=''; return; }
  var __bd=0; window.__boosterDown=function(){return Date.now()<__bd;}; window.__boosterMarkDown=function(){__bd=Date.now()+60000;};
  var of=window.fetch.bind(window); window.__origFetch=of;
  window.BOOSTER_DL_SERVER=S; window.BOOSTER_LY_SERVER=S;
  /* your own lyrics now come from the server (My Lyrics plugin) */
  document.write('<script defer src="'+S+'/lyrics.js"><\/script>');
  /* Every cross-site https request goes through the server's /p proxy, so the browser never talks to third parties.
     Direct fallback only if the server is unreachable AND strict mode is off (localStorage bos_strict=1 turns fallback off). */
  var strict=false; try{strict=localStorage.getItem('bos_strict')==='1';}catch(e){}
  window.fetch=function(i,o){
    var u=null; try{ if(typeof i==='string'||i instanceof URL) u=new URL(String(i),location.href); }catch(e){}
    if(u&&u.protocol==='https:'&&u.origin!==location.origin&&u.origin!==new URL(S).origin){
      if(window.__boosterDown()&&!strict) return of(i,o);
      return viaProxy(i,o,u);
    }
    return of(i,o);
  };
  function direct(i,o,res,rej){ if(strict) return rej(new TypeError('blocked')); of(i,o).then(res,rej); }
  function viaProxy(i,o,u){
    return new Promise(function(res,rej){
      var done=false, tm=setTimeout(function(){ if(done) return; done=true; window.__boosterMarkDown(); direct(i,o,res,rej); },7000);
      of(S+'/p?u='+encodeURIComponent(u.href),o).then(function(r){
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
