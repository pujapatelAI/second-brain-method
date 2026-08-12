/* 30-Day Brain Extract — members gate.
   Buyers arriving from a challenge email carry a #e= fragment and never see
   the gate. Manual visitors enter the email they bought with; it's hashed
   (salted SHA-256) in the browser and checked against /challenge/members.json.
   Non-members are routed to the Stan store. Funnel gate, not DRM. */

/* Microsoft Clarity — challenge-page analytics (project xni1glpbqz).
   Loads on every /challenge/ page (day pages, map, archive) via this shared
   script, so challenge engagement is finally tracked. Site home already runs
   this same project; the challenge section was previously untracked. */
(function (c, l, a, r, i, t, y) {
  c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
  t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i;
  y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
})(window, document, "clarity", "script", "xni1glpbqz");

(function () {
  var SALT = "c30-brain-extract-2026";
  var STAN = "https://stan.store/PujaPatel";
  var KEY = "c30_email";

  function show() {
    document.body.classList.remove("locked");
    var g = document.getElementById("c30-gate");
    if (g) g.style.display = "none";
  }

  async function gateHash(email) {
    var data = new TextEncoder().encode(SALT + email.trim().toLowerCase());
    var buf = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(buf))
      .map(function (b) { return b.toString(16).padStart(2, "0"); })
      .join("")
      .slice(0, 20);
  }

  // 1) unlock fragment from a challenge email → straight in
  var frag = null;
  try { frag = new URLSearchParams(location.hash.slice(1)).get("e"); } catch (e) {}
  if (frag && frag.indexOf("@") > 0) {
    try { localStorage.setItem(KEY, frag.toLowerCase()); } catch (e) {}
    try { history.replaceState(null, "", location.pathname); } catch (e) {}
    show();
    return;
  }

  // 2) already unlocked on this device
  try { if (localStorage.getItem(KEY)) { show(); return; } } catch (e) {}

  // 3) manual entry
  document.addEventListener("DOMContentLoaded", function () {
    var form = document.getElementById("c30-form");
    var input = document.getElementById("c30-email");
    var msg = document.getElementById("c30-msg");
    if (!form) return;
    form.addEventListener("submit", async function (ev) {
      ev.preventDefault();
      var email = (input.value || "").trim().toLowerCase();
      if (!email || email.indexOf("@") < 1) return;
      var ok = false;
      try {
        var r = await fetch("/challenge/members.json", { cache: "no-store" });
        var j = await r.json();
        ok = j.hashes.indexOf(await gateHash(email)) !== -1;
      } catch (e) { ok = false; }
      if (ok) {
        try { localStorage.setItem(KEY, email); } catch (e) {}
        show();
      } else {
        msg.style.display = "block";
        setTimeout(function () { location.href = STAN; }, 2800);
      }
    });
  });
})();
