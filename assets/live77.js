/* Live Second Brain Setup: $77 for 60 minutes from the moment someone first sees the
   price, then $147 (Puja, Nov 11 2026: "it should always be for the 60 minutes before
   it becomes $147"). One clock per person: saved in this browser and never reset.
   A text/email link can carry ?until=<epoch seconds> so a second device keeps the same
   clock; the earlier deadline always wins. The deadline also goes to Customer.io
   (live77_deadline) so texts can follow up with the right price.

   Markup hooks (any page):
     [data-l77-clock]   mm:ss left while $77 is open
     [data-l77-buy]     href set to the current checkout ($77 or $147), email prefilled
     [data-l77-price]   "$77" or "$147"
     [data-l77-open]    shown only while $77 is open
     [data-l77-closed]  shown only after the hour is up                                */
(function(){
  var KEY='pp77_deadline', WIN=60*60*1000;
  var SESSION=Date.parse('2026-11-23T14:00:00-05:00');
  var L77='https://buy.stripe.com/8x2fZa5KOerpfX47cY6c007';
  var L147='https://buy.stripe.com/4gM28k4GK6YX26eeFq6c009';
  function read(){ try{ return parseInt(localStorage.getItem(KEY)||'0',10)||0; }catch(e){ return 0; } }
  function email(){
    var e=''; try{ e=localStorage.getItem('pp_email')||''; }catch(x){}
    if(e.indexOf('@')<1){ var m=document.cookie.match(/(?:^|;\s*)_cioid=([^;]+)/); e=m?decodeURIComponent(m[1]):''; }
    return e.indexOf('@')>0 ? e : '';
  }
  function withEmail(base){ var e=email(); return base+(e ? '?prefilled_email='+encodeURIComponent(e) : ''); }
  function start(){
    var d=read(), q=parseInt(new URLSearchParams(location.search).get('until')||'0',10)*1000;
    if(q && (!d || q<d)) d=q;
    var fresh=!d;
    if(!d) d=Date.now()+WIN;
    try{ localStorage.setItem(KEY,String(d)); }catch(x){}
    var e=email();
    if(e){ try{ if(window._cio) _cio.identify({ id:e, email:e, live77_deadline:Math.floor(d/1000) }); }catch(x){} }
    if(fresh){ try{ clarity('event','live77_timer_start'); }catch(x){} }
    render();
    if(!window.__l77t) window.__l77t=setInterval(render,1000);
    return d;
  }
  function open(){ var d=read(); return !!d && Date.now()<d; }
  function render(){
    var d=read(), left=Math.max(0,d-Date.now()), on=!!d && left>0;
    var m=Math.floor(left/60000), s=Math.floor(left%60000/1000);
    var clock=(m<10?'0':'')+m+':'+(s<10?'0':'')+s;
    document.querySelectorAll('[data-l77-clock]').forEach(function(n){ n.textContent=clock; });
    document.querySelectorAll('[data-l77-price]').forEach(function(n){ n.textContent=on?'$77':'$147'; });
    document.querySelectorAll('[data-l77-buy]').forEach(function(n){ n.href=withEmail(on?L77:L147); n.setAttribute('data-price',on?'77':'147'); });
    document.querySelectorAll('[data-l77-open]').forEach(function(n){ n.hidden=!on; });
    document.querySelectorAll('[data-l77-closed]').forEach(function(n){ n.hidden=on; });
  }
  document.addEventListener('click', function(ev){
    var a=ev.target.closest && ev.target.closest('[data-l77-buy]'); if(!a) return;
    var v=parseInt(a.getAttribute('data-price')||'77',10);
    try{ if(window.fbq) fbq('track','InitiateCheckout',{ value:v, currency:'USD', content_name:'live_setup_'+v }); }catch(x){}
    try{ clarity('event','live_setup_checkout_'+v); }catch(x){}
  });
  window.ppLive77={ start:start, open:open, render:render, sessionAhead:function(){ return Date.now()<SESSION; } };
})();
