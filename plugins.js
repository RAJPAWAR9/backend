/* Server plugin switches inside Settings. Needs your ADMIN_KEY once per device (kept only in this browser). */
(function(){
  var S=window.BOOSTER_SERVER; if(!S) return;
  var F=function(){return (window.__origFetch||window.fetch).apply(window,arguments);};
  var KEY=function(){try{return localStorage.getItem('bos_admin_key')||'';}catch(e){return '';}};
  var st=null, loading=false, note='';
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function say(m,t){try{if(typeof window.toast==='function')window.toast(m,t||'');else if(typeof window.BOS_TOAST==='function')window.BOS_TOAST(m,t||'');}catch(e){}}
  function api(p,b){
    return F(S+'/admin/api/'+p,{method:b?'POST':'GET',headers:{'x-admin-key':KEY(),'content-type':'application/json'},body:b?JSON.stringify(b):undefined})
      .then(function(r){return r.json();});
  }
  function load(){
    if(!KEY()||loading) return; loading=true;
    api('state').then(function(j){
      loading=false;
      if(!j.success){ note=j.message||'Could not load'; if(/wrong key/i.test(note)) try{localStorage.removeItem('bos_admin_key');}catch(e){} st=null; }
      else { st=j.plugins; note=''; if(!j.kv) note='KV not bound on server: changes will not save'; }
      draw();
    },function(){ loading=false; note='Server unreachable'; draw(); });
  }
  function row(title,desc,inner,attr){
    return '<div class="setting-row"'+(attr||'')+'><div class="setting-row-text"><div class="setting-row-title">'+esc(title)+'</div>'
      +(desc?'<div class="setting-row-desc">'+esc(desc)+'</div>':'')+'</div>'+(inner?'<div class="setting-row-action">'+inner+'</div>':'')+'</div>';
  }
  function html(){
    var rows=[];
    if(!KEY()) rows.push(row('Unlock server controls',note||'Enter your admin key to switch services on or off','',' data-bos="unlock" style="cursor:pointer"'));
    else if(!st) rows.push(row(note||'Loading...','','', ''));
    else {
      st.forEach(function(p){ rows.push(row(p.name,p.desc,'<div class="toggle'+(p.on?' on':'')+'" data-bos="toggle" data-id="'+esc(p.id)+'"></div>')); });
      if(note) rows.push(row(note,'',''));
      rows.push(row('Clear server cache','Use if search or lyrics look stale','',' data-bos="purge" style="cursor:pointer"'));
      rows.push(row('Lock controls','Forget the admin key on this device','',' data-bos="lock" style="cursor:pointer"'));
    }
    return '<div class="settings-group" id="bos-plugins-group"><div class="settings-group-title">Server services</div><div class="settings-card glass-1">'+rows.join('')+'</div></div>';
  }
  function draw(){
    var host=document.getElementById('view-settings'); if(!host||!host.firstChild) return;
    var old=document.getElementById('bos-plugins-group'), tmp=document.createElement('div'); tmp.innerHTML=html();
    var g=tmp.firstChild;
    if(old){ old.replaceWith(g); return; }
    var groups=host.querySelectorAll('.settings-group'), last=groups[groups.length-1];
    if(last) last.parentNode.insertBefore(g,last); else host.appendChild(g);
  }
  function setFlag(id,on){ window.__bosFlags=window.__bosFlags||{}; window.__bosFlags[id]=on; }
  document.addEventListener('click',function(e){
    var el=e.target&&e.target.closest?e.target.closest('[data-bos]'):null; if(!el) return;
    var a=el.getAttribute('data-bos');
    if(a==='unlock'){
      var k=window.prompt('Admin key'); if(!k) return;
      try{localStorage.setItem('bos_admin_key',k.trim());}catch(x){}
      st=null; note=''; draw(); load();
    } else if(a==='lock'){
      try{localStorage.removeItem('bos_admin_key');}catch(x){} st=null; note=''; draw();
    } else if(a==='purge'){
      api('purge',{}).then(function(j){say(j.success?'Server cache cleared':(j.message||'Failed'),j.success?'':'error');});
    } else if(a==='toggle'){
      var id=el.getAttribute('data-id'), p=st&&st.filter(function(x){return x.id===id;})[0]; if(!p) return;
      var want=!p.on; p.on=want; el.classList.toggle('on',want);
      var body={plugins:{}}; body.plugins[id]={on:want};
      api('save',body).then(function(j){
        if(j.success){ setFlag(id,want); say(p.name+(want?' is ON':' is OFF')); }
        else { p.on=!want; el.classList.toggle('on',!want); say(j.message||'Could not save','error'); }
      },function(){ p.on=!want; el.classList.toggle('on',!want); say('Server unreachable','error'); });
    }
    e.stopPropagation();
  },true);
  function start(){
    var host=document.getElementById('view-settings'); if(!host) return;
    var busy=false;
    new MutationObserver(function(){ if(busy) return; busy=true; setTimeout(function(){ busy=false; if(host.firstChild&&!document.getElementById('bos-plugins-group')){ draw(); if(KEY()&&!st&&!loading) load(); } },0); }).observe(host,{childList:true});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
})();
