/* Live Second Brain Setup: $77 until a fixed Friday deadline, then $147 until the session.
   Puja, Nov 11 2026: "keep the fixed deadline friday night", then "for new leads after friday -
   their $77 date is until nov 20". Two windows, chosen per person:
     - first saw the $77 before Fri Nov 13 11:59pm ET  -> $77 until Fri Nov 13 11:59pm ET
     - first sees it after that (new leads from Sat)    -> $77 until Fri Nov 20 11:59pm ET
   First-seen time is saved in this browser (pp77_first) the first time start() runs.
   A text/email link can carry ?dl=13 or ?dl=20 to pick the window on any device (saved as pp77_dl).
   This replaced the per-person 60-minute clock (pp77_deadline / ?until=).

   Markup hooks (any page):
     [data-l77-clock]   time left while $77 is open: "8d 4h 12m", "4h 12m 05s", or mm:ss in the last hour
     [data-l77-until]   "Fri Nov 13" or "Fri Nov 20", this person's deadline day
     [data-l77-buy]     href set to the current checkout ($77 or $147), email prefilled
     [data-l77-price]   "$77" or "$147"
     [data-l77-open]    shown only while $77 is open
     [data-l77-closed]  shown only after the $77 price ends                              */
(function(){
  var D13=Date.parse('2026-11-13T23:59:00-05:00'), D20=Date.parse('2026-11-20T23:59:00-05:00');
  var WINDOWS={'13':{at:D13,label:'Fri Nov 13'},'20':{at:D20,label:'Fri Nov 20'}};
  function get(k){ try{ return localStorage.getItem(k)||''; }catch(e){ return ''; } }
  function put(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }
  (function(){ var q=''; try{ q=new URLSearchParams(location.search).get('dl')||''; }catch(e){} if(WINDOWS[q]) put('pp77_dl',q); })();
  function win(){
    var dl=get('pp77_dl'); if(WINDOWS[dl]) return WINDOWS[dl];
    var first=parseInt(get('pp77_first')||'0',10)||(get('pp77_deadline') ? D13-1 : 0)||Date.now();
    return first<D13 ? WINDOWS['13'] : WINDOWS['20'];
  }
  var SESSION=Date.parse('2026-11-23T14:00:00-05:00');
  var L77='https://buy.stripe.com/8x2fZa5KOerpfX47cY6c007';
  var L147='https://buy.stripe.com/4gM28k4GK6YX26eeFq6c009';
  function email(){
    var e=''; try{ e=localStorage.getItem('pp_email')||''; }catch(x){}
    if(e.indexOf('@')<1){ var m=document.cookie.match(/(?:^|;\s*)_cioid=([^;]+)/); e=m?decodeURIComponent(m[1]):''; }
    return e.indexOf('@')>0 ? e : '';
  }
  function withEmail(base){ var e=email(); return base+(e ? '?prefilled_email='+encodeURIComponent(e) : ''); }
  function pad(n){ return (n<10?'0':'')+n; }
  function fmt(left){
    var s=Math.floor(left/1000), d=Math.floor(s/86400), h=Math.floor(s%86400/3600), m=Math.floor(s%3600/60), sec=s%60;
    if(d>0) return d+'d '+h+'h '+m+'m';
    if(h>0) return h+'h '+pad(m)+'m '+pad(sec)+'s';
    return pad(m)+':'+pad(sec);
  }
  function open(){ return Date.now()<win().at; }
  function render(){
    var w=win(), left=Math.max(0,w.at-Date.now()), on=left>0, clock=fmt(left);
    document.querySelectorAll('[data-l77-until]').forEach(function(n){ n.textContent=w.label; });
    document.querySelectorAll('[data-l77-clock]').forEach(function(n){ n.textContent=clock; });
    document.querySelectorAll('[data-l77-price]').forEach(function(n){ n.textContent=on?'$77':'$147'; });
    document.querySelectorAll('[data-l77-buy]').forEach(function(n){ n.href=withEmail(on?L77:L147); n.setAttribute('data-price',on?'77':'147'); });
    document.querySelectorAll('[data-l77-open]').forEach(function(n){ n.hidden=!on; });
    document.querySelectorAll('[data-l77-closed]').forEach(function(n){ n.hidden=on; });
  }
  function start(){
    /* someone who saw the old 60-minute clock (pp77_deadline, before Nov 12) counts as a pre-Friday lead */
    if(!get('pp77_first')) put('pp77_first',String(get('pp77_deadline') ? D13-1 : Date.now()));
    render();
    if(!window.__l77t) window.__l77t=setInterval(render,1000);
    return win().at;
  }
  document.addEventListener('click', function(ev){
    var a=ev.target.closest && ev.target.closest('[data-l77-buy]'); if(!a) return;
    var v=parseInt(a.getAttribute('data-price')||'77',10);
    try{ if(window.fbq) fbq('track','InitiateCheckout',{ value:v, currency:'USD', content_name:'live_setup_'+v }); }catch(x){}
    try{ clarity('event','live_setup_checkout_'+v); }catch(x){}
  });
  window.ppLive77={ start:start, open:open, render:render, deadline:function(){ return win().at; }, sessionAhead:function(){ return Date.now()<SESSION; } };
})();
