/* Visit + click tracking for the Link Analyzer (Stan-style per-day analytics).
   Logs one "view" per page load, one "click" per link tap and one "optin" per email form
   submit to Supabase through an insert-only function (this key can't read anything back).
   No cookies and no names: a random visitor id in localStorage. Opt-ins send a SHA-256 of
   the email so the Link Analyzer can match a lead to the visit that brought them.
   Skip your own visits: open any page once with ?pp_me=1 on each device (?pp_me=0 undoes). */
(function () {
  var API = "https://elfcasizjccgjrwgebvv.supabase.co/rest/v1/rpc/track";
  var KEY = "sb_publishable_01CM_h2wN3ysZN52BcO1Sw_SDAatM00";
  var d = document, ua = navigator.userAgent || "";
  if (navigator.webdriver || /bot|crawl|spider|slurp|headless|lighthouse|facebookexternalhit|preview/i.test(ua)) return;

  function ls(k, v) {
    try {
      if (v === undefined) return localStorage.getItem(k);
      if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v);
    } catch (e) {}
    return null;
  }
  var q = new URLSearchParams(location.search);
  if (q.get("pp_me") === "1") ls("pp_me", "1");
  if (q.get("pp_me") === "0") ls("pp_me", null);
  if (ls("pp_me") === "1") return;

  function rid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }
  var vid = ls("pp_vid");
  if (!vid) { vid = rid(); ls("pp_vid", vid); }
  var now = Date.now(), sid = ls("pp_sid"), last = +(ls("pp_last") || 0);
  var newSession = !sid || now - last > 30 * 60 * 1000;
  if (newSession) { sid = rid(); ls("pp_sid", sid); }
  ls("pp_last", String(now));

  var refHost = "";
  try { if (d.referrer) refHost = new URL(d.referrer).hostname.replace(/^www\./, ""); } catch (e) {}
  if (refHost === location.hostname.replace(/^www\./, "")) refHost = "";
  // In-app browsers: TikTok and Instagram open bio links inside their app, often with no referrer.
  var app = /musical_ly|bytedance|tiktok/i.test(ua) ? "tiktok"
    : /instagram/i.test(ua) ? "instagram"
    : /FBAN|FBAV|FB_IAB|FBIOS/.test(ua) ? "facebook"
    : /LinkedInApp/i.test(ua) ? "linkedin"
    : /Barcelona/.test(ua) ? "threads" : "";

  var base = {
    vid: vid, sid: sid, path: location.pathname,
    utm_source: q.get("utm_source") || "", utm_medium: q.get("utm_medium") || "",
    utm_campaign: q.get("utm_campaign") || "", utm_content: q.get("utm_content") || "",
    ref_host: refHost, app: app, device: /Mobi|Android|iPhone|iPad/i.test(ua) ? "mobile" : "desktop"
  };
  function send(kind, extra) {
    var e = { kind: kind }, k;
    for (k in base) e[k] = base[k];
    for (k in extra || {}) e[k] = extra[k];
    try {
      fetch(API, { method: "POST", keepalive: true, body: JSON.stringify({ e: e }),
        headers: { "Content-Type": "application/json", "apikey": KEY } }).catch(function () {});
    } catch (err) {}
  }

  send("view", { new_session: newSession });

  d.addEventListener("click", function (ev) {
    var a = ev.target && ev.target.closest ? ev.target.closest("a[href], [data-track]") : null;
    if (!a) return;
    var href = a.href || "";
    if (href && href.split("#")[0] === location.href.split("#")[0]) return;   // same-page jump link
    var label = (a.getAttribute("data-track") || a.innerText || a.getAttribute("aria-label") || "")
      .replace(/\s+/g, " ").trim().slice(0, 80);
    send("click", { target: label, href: String(href).slice(0, 300) });
  }, true);

  d.addEventListener("submit", function (ev) {
    var f = ev.target, em = f && f.querySelector ? f.querySelector('input[type="email"]') : null;
    if (!em || (em.value || "").indexOf("@") < 1) return;
    var src = f.querySelector('input[name="form_source"]');
    var form = String(f.id || (src && src.value) || "form").slice(0, 80);
    var v = em.value.trim().toLowerCase();
    if (!window.crypto || !crypto.subtle || !window.TextEncoder) { send("optin", { target: form }); return; }
    crypto.subtle.digest("SHA-256", new TextEncoder().encode(v)).then(function (h) {
      var hex = Array.prototype.map.call(new Uint8Array(h), function (b) { return ("0" + b.toString(16)).slice(-2); }).join("");
      send("optin", { target: form, email_hash: hex });
    }, function () { send("optin", { target: form }); });
  }, true);
})();
