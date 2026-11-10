/* YouTube Music albums / artists: full lists from the BOOSTER server (/ytm/find, /list). Old sources stay as fallback. */
(function(){
  var S=window.BOOSTER_SERVER, I=window.BosIT; if(!S||!I) return;
  var raw=function(u){ return (window.__origFetch||window.fetch)(u).then(function(r){ if(!r.ok) throw 0; return r.json(); }); };
  var o={albums:I.albums,artists:I.artists,albumTracks:I.albumTracks,artistSongs:I.artistSongs};
  function old(n,a){ return o[n]?o[n].apply(I,a):Promise.resolve([]); }
  function ok(l){ if(!Array.isArray(l)||!l.length) throw 0; return l; }
  function find(type,n,a){ return raw(S+'/ytm/find?type='+type+'&q='+encodeURIComponent(a[0])).then(ok).catch(function(){ return old(n,a); }); }
  I.albums=function(){ return find('albums','albums',arguments); };
  I.artists=function(){ return find('artists','artists',arguments); };
  I.albumTracks=function(id){ var a=arguments; return /^MPREb_/.test(id)?raw(S+'/list?kind=album&id='+encodeURIComponent(id)).then(ok).catch(function(){return[];}):old('albumTracks',a); };
  I.artistSongs=function(id){ var a=arguments; return /^UC[\w-]{20,}$/.test(id)?raw(S+'/list?kind=artist&id='+encodeURIComponent(id)).then(ok).catch(function(){return[];}):old('artistSongs',a); };
})();
