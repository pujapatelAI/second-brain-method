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
  /* Puja, Nov 16 2026 ("$77 until Dec 4"): after Fri Nov 20 the $77 carries on for the Mon Dec 7 session until
     Fri Dec 4 11:59pm ET. Each window names its session ([data-l77-session] / [data-l77-sday] show it). */
  var D13=Date.parse('2026-11-13T23:59:00-05:00'), D20=Date.parse('2026-11-20T23:59:00-05:00'), D04=Date.parse('2026-12-04T23:59:00-05:00');
  var S23={at:Date.parse('2026-11-23T14:00:00-05:00'), label:'Mon Nov 23, 2pm ET', day:'Mon Nov 23'};
  var S07={at:Date.parse('2026-12-07T14:00:00-05:00'), label:'Mon Dec 7, 2pm ET', day:'Mon Dec 7'};
  var WINDOWS={'13':{at:D13,label:'Fri Nov 13',s:S23},'20':{at:D20,label:'Fri Nov 20',s:S23},'04':{at:D04,label:'Fri Dec 4',s:S07}};
  /* Puja, Nov 16 2026: the dates with "X spots left" on /live-setup/ ("Nov 20, 3 spots left / Nov 23, 2 spots left /
     Dec 7, 3 spots left"); buyers pick a date or "default into the nov 20 one", everywhere; Nov 20 stops selling
     Wednesday. Order = default order. Seats come from /assets/seats.json (apps/command/live77_sessions.py pushes it
     when a seat is taken); these numbers are the fallback. A session closes at its until (or when full). The pick
     rides on the Stripe link: client_reference_id = <email hash>-<code> ("x-<code>" when we don't know the email). */
  var SESS=[
    {code:'n20', at:Date.parse('2026-11-20T11:00:00-05:00'), until:Date.parse('2026-11-18T23:59:59-05:00'), day:'Fri Nov 20', time:'11am ET', pt:'8am PT', left:3},
    {code:'n23', at:Date.parse('2026-11-23T14:00:00-05:00'), until:Date.parse('2026-11-20T23:59:59-05:00'), day:'Mon Nov 23', time:'2pm ET', pt:'11am PT', left:2},
    {code:'d07', at:Date.parse('2026-12-07T14:00:00-05:00'), until:Date.parse('2026-12-04T23:59:59-05:00'), day:'Mon Dec 7', time:'2pm ET', pt:'11am PT', left:3}];
  SESS.forEach(function(x){ x.label=x.day+', '+x.time; });
  function selling(x){ return x.left>0 && Date.now()<x.until && Date.now()<x.at; }
  function sel(){   /* the picked session if still selling, else the first selling one, else the last (labels only) */
    var p=get('pp77_pick'), i;
    for(i=0;i<SESS.length;i++){ if(SESS[i].code===p && selling(SESS[i])) return SESS[i]; }
    for(i=0;i<SESS.length;i++){ if(selling(SESS[i])) return SESS[i]; }
    return SESS[SESS.length-1];
  }
  try{ fetch('/assets/seats.json',{cache:'no-store'}).then(function(r){ return r.ok ? r.json() : null; }).then(function(d){
    if(!d || !d.sessions) return;
    d.sessions.forEach(function(n){ SESS.forEach(function(x){ if(x.code===n.code && typeof n.left==='number') x.left=n.left; }); });
    try{ render(); }catch(x){}
  }).catch(function(){}); }catch(x){}
  function get(k){ try{ return localStorage.getItem(k)||''; }catch(e){ return ''; } }
  function put(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }
  (function(){ var q=''; try{ q=new URLSearchParams(location.search).get('dl')||''; }catch(e){} if(WINDOWS[q]) put('pp77_dl',q); })();
  function win(){
    /* Puja, Nov 12 2026: "leave it 13 for now - then extend it to 20 for everyone" (not announced).
       Once Fri Nov 13 11:59pm ET passes, EVERYONE gets $77 until Fri Nov 20, early visitors and ?dl=13 included. */
    if(Date.now()>=D20) return WINDOWS['04'];
    if(Date.now()>=D13) return WINDOWS['20'];
    var dl=get('pp77_dl'); if(WINDOWS[dl]) return WINDOWS[dl];
    var first=parseInt(get('pp77_first')||'0',10)||(get('pp77_deadline') ? D13-1 : 0)||Date.now();
    return first<D13 ? WINDOWS['13'] : WINDOWS['20'];
  }
  var L77='https://buy.stripe.com/8x2fZa5KOerpfX47cY6c007';
  var L147='https://buy.stripe.com/4gM28k4GK6YX26eeFq6c009';
  function email(){
    var e=''; try{ e=localStorage.getItem('pp_email')||''; }catch(x){}
    if(e.indexOf('@')<1){ var m=document.cookie.match(/(?:^|;\s*)_cioid=([^;]+)/); e=m?decodeURIComponent(m[1]):''; }
    return e.indexOf('@')>0 ? e : '';
  }
  /* Puja, Nov 16 2026: every $77 link carries the person. Stripe drops prefilled_email from the checkout session,
     so client_reference_id = first 16 hex of sha256(lowercased email) rides along too (Stripe keeps it); the
     abandoned-checkout job (apps/command/checkout_abandon.py) matches it to the lead. */
  var REF='', REF_FOR='';
  function ref(e){   /* hashes once per email (the map sets the email at sign-up, after this file loads), then re-renders */
    if(REF_FOR===e) return REF; REF_FOR=e; REF='';
    try{ crypto.subtle.digest('SHA-256', new TextEncoder().encode(e.trim().toLowerCase())).then(function(b){
      if(REF_FOR!==e) return;
      REF=Array.prototype.map.call(new Uint8Array(b), function(x){ return ('0'+x.toString(16)).slice(-2); }).join('').slice(0,16);
      try{ render(); }catch(x){}
    }); }catch(x){}
    return REF;
  }
  function withEmail(base){ var e=email(), r=e ? ref(e) : '', c=sel().code;
    return base+'?'+(e ? 'prefilled_email='+encodeURIComponent(e)+'&' : '')+'client_reference_id='+(r||'x')+'-'+c; }
  function dates(n){   /* [data-l77-dates]: one choice per date, "X spots left", full or closed ones can't be picked */
    var cur=sel().code, h='';
    SESS.forEach(function(x){
      if(Date.now()>=x.at) return;
      var ok=selling(x), note=x.left<=0 ? 'Full' : (Date.now()>=x.until ? 'Closed' : x.left+(x.left===1?' spot':' spots')+' left');
      h+='<button type="button" class="l77-date'+(x.code===cur&&ok?' on':'')+'" data-l77-pick="'+x.code+'"'+(ok?'':' disabled')+
         ' aria-pressed="'+(x.code===cur&&ok)+'"><b>'+x.day+'</b><span>'+x.time+'</span><i>'+note+'</i></button>';
    });
    n.innerHTML='<p class="l77-dates-h">Pick your date</p><div class="l77-dates-row">'+h+'</div>';
  }
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
    var s=sel();
    document.querySelectorAll('[data-l77-session]').forEach(function(n){ n.textContent=s.label; });
    document.querySelectorAll('[data-l77-sday]').forEach(function(n){ n.textContent=s.day; });
    document.querySelectorAll('[data-l77-when]').forEach(function(n){ n.textContent=s.day+' at '+s.time+' ('+s.pt+')'; });
    document.querySelectorAll('[data-l77-dates]').forEach(function(n){ var k=SESS.map(function(x){ return x.code+x.left+selling(x); }).join()+s.code;
      if(n.getAttribute('data-k')!==k){ n.setAttribute('data-k',k); dates(n); } });
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
    var d=ev.target.closest && ev.target.closest('[data-l77-pick]');
    if(d && !d.disabled){ put('pp77_pick', d.getAttribute('data-l77-pick')); render();
      try{ clarity('event','live_setup_pick_'+d.getAttribute('data-l77-pick')); }catch(x){} return; }
    var a=ev.target.closest && ev.target.closest('[data-l77-buy]'); if(!a) return;
    var v=parseInt(a.getAttribute('data-price')||'77',10);
    try{ if(window.fbq) fbq('track','InitiateCheckout',{ value:v, currency:'USD', content_name:'live_setup_'+v }); }catch(x){}
    try{ clarity('event','live_setup_checkout_'+v); }catch(x){}
  });
  window.ppLive77={ start:start, open:open, render:render, deadline:function(){ return win().at; }, sessionAhead:function(){ return Date.now()<sel().at; }, session:function(){ return sel(); }, sessions:function(){ return SESS; } };
})();
