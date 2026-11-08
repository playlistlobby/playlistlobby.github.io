/* playlist.mag: moving between the tabs (projects, shop, contact) slides the page the way the tabs are laid out:
   to a tab on the right the page slides out to the left and the next one slides in from the right; to a tab on the left, the other way.
   The banner stays still. Only these three pages take part (home has no slide, so going to or from home is unchanged).
   Works in every browser (plain animations, no page-transition API). Loaded as a blocking script in <head>. */
(function () {
  var ORDER = ["projects", "shop", "contact"], KEY = "pm-slide";
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion:reduce)").matches;
  var MS = 480, EASE = "cubic-bezier(.3,.8,.3,1)";

  function indexOf(url) {
    try {
      var parts = new URL(url, location.href).pathname.split("/").filter(Boolean);
      for (var i = parts.length - 1; i >= 0; i--) { var k = ORDER.indexOf(parts[i]); if (k >= 0) return k; }
    } catch (e) { /* not a url */ }
    return -1;
  }
  var here = indexOf(location.href);
  if (here < 0) return;

  // everything on the page except the banner (and scripts) is what slides
  function movers() { return [].filter.call(document.body.children, function (el) { return !el.matches(".banner,script,style,link,.toast"); }); }
  function store(v) { try { if (v == null) sessionStorage.removeItem(KEY); else sessionStorage.setItem(KEY, v); } catch (e) { /* no storage: no slide */ } }
  function read() { try { return sessionStorage.getItem(KEY); } catch (e) { return null; } }

  /* ---- arriving: the page starts off to the side (set before the first paint) and glides in ---- */
  var dir = read(); store(null);
  if (dir === "1" || dir === "-1") {
    var w = innerWidth, from = (dir === "1" ? w : -w) + "px 0";
    var st = document.createElement("style");
    st.textContent = "html{overflow-x:clip}body>*:not(.banner):not(script):not(style):not(link){translate:" + from + "}";
    document.head.appendChild(st);
    var run = function () {
      var els = movers(), done = 0;
      if (reduce || !els.length || !els[0].animate) { st.remove(); return; }
      els.forEach(function (el) {
        el.animate([{ translate: from }, { translate: "0 0" }], { duration: MS, easing: EASE }).finished.then(function () { if (++done === els.length) st.remove(); }, function () { st.remove(); });
      });
      setTimeout(function () {                                // safety: never leave the page stuck to the side (a throttled tab can stall animations)
        st.remove();
        els.forEach(function (el) { el.getAnimations().forEach(function (an) { try { if (an.effect.getKeyframes().some(function (k) { return k.translate; })) an.cancel(); } catch (e) { /* ignore */ } }); });
      }, MS + 400);
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run); else run();
  }

  /* ---- leaving: the page slides away, then the next one loads ---- */
  var leaving = false;
  document.addEventListener("click", function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || leaving || reduce) return;
    var a = e.target.closest && e.target.closest(".tabs a[href]");
    if (!a) return;
    var to = indexOf(a.href);
    if (to < 0 || to === here || a.target) return;
    var els = movers();
    if (!els.length || !els[0].animate) return;
    e.preventDefault(); leaving = true;
    var d = to > here ? 1 : -1;                              // forward = the tab on the right
    document.documentElement.style.overflowX = "clip";
    els.forEach(function (el) { el.animate([{ translate: "0 0" }, { translate: (-d * innerWidth) + "px 0" }], { duration: MS * 0.8, easing: EASE, fill: "forwards" }); });
    store(String(d));
    setTimeout(function () { location.href = a.href; }, MS * 0.8);
  });

  /* ---- warm the other two tabs while the visitor looks at this one ----
     Once this page is loaded and the browser is idle, the other tabs' pages and everything they list (styles, scripts, pictures) are fetched
     into the browser cache at low priority, so going there only has to wait for its own data. Nothing is shown or run. */
  var warmed = false;
  function warm() {
    if (warmed) return; warmed = true;
    var c = navigator.connection;
    if (c && (c.saveData || /(^|-)2g$/.test(c.effectiveType || ""))) return;       // not on a slow or metered connection
    ORDER.forEach(function (name, k) {
      if (k === here) return;
      var a = document.querySelector('.tabs a[href*="/' + name + '/"]');
      if (!a || !window.fetch) return;
      var url = a.href;
      fetch(url, { priority: "low" }).then(function (r) { return r.ok ? r.text() : ""; }).then(function (html) {
        var seen = {};
        html.replace(/(?:href|src)="([^"#]+\.(?:css|js|webp|png|jpe?g)(?:\?[^"]*)?)"/g, function (m, u) {
          var abs = new URL(u, url).href;
          if (seen[abs] || abs === url) return m;
          seen[abs] = 1;
          var l = document.createElement("link"); l.rel = "prefetch"; l.href = abs; document.head.appendChild(l);
          return m;
        });
      }).catch(function () { /* offline: nothing to warm */ });
    });
  }
  function whenIdle() { (window.requestIdleCallback || function (f) { setTimeout(f, 300); })(warm, { timeout: 2500 }); }
  if (document.readyState === "complete") whenIdle(); else addEventListener("load", whenIdle);
  document.addEventListener("pointerover", function (e) { if (e.target.closest && e.target.closest(".tabs a")) warm(); }, { passive: true });   // hovering a tab warms them at once

  // coming back with the browser's back button: show the page normally
  addEventListener("pageshow", function (e) {
    if (!e.persisted) return;
    leaving = false; store(null);
    document.documentElement.style.overflowX = "";
    movers().forEach(function (el) { el.getAnimations().forEach(function (an) { an.cancel(); }); });
  });
})();
