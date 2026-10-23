// Dev tool (ui-export.html): renders the game's iOS 6 style interface pieces (buttons, text fields, tabs, bars, windows, slots...) with the game's own stylesheet
// and saves each one as a transparent PNG (4x) through scripts/export-server.mjs, for use in animations.
import "./style.css";

const log = document.getElementById("log")!;
const say = (m: string): void => { log.textContent += "\n" + m; };
const stage = document.getElementById("stage")!;
const SAVE = "http://127.0.0.1:8799/save?path=";
const SCALE = 4;

async function dataUrl(path: string): Promise<string> {
  const r = await fetch(path);
  const t = await r.text();
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(t);
}

/** Copies every computed style onto the element (and its children) so the picture does not need the page's stylesheet. */
function inlineStyles(src: Element, dst: Element): void {
  const cs = getComputedStyle(src);
  let css = "";
  for (let i = 0; i < cs.length; i++) css += `${cs[i]}:${cs.getPropertyValue(cs[i])};`;
  (dst as HTMLElement).setAttribute("style", css);
  const a = Array.from(src.children), b = Array.from(dst.children);
  for (let i = 0; i < a.length; i++) inlineStyles(a[i], b[i]);
}

async function toPng(el: HTMLElement, pad = 8): Promise<HTMLCanvasElement> {
  const r = el.getBoundingClientRect();
  const w = Math.ceil(r.width) + pad * 2, h = Math.ceil(r.height) + pad * 2;
  const clone = el.cloneNode(true) as HTMLElement;
  inlineStyles(el, clone);
  clone.style.margin = "0";
  if (getComputedStyle(el).position === "fixed") clone.style.position = "static";
  clone.style.transform = "none";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w * SCALE}" height="${h * SCALE}" viewBox="0 0 ${w} ${h}"><foreignObject x="0" y="0" width="${w}" height="${h}"><div xmlns="http://www.w3.org/1999/xhtml" style="padding:${pad}px;box-sizing:border-box;width:${w}px;height:${h}px;">${new XMLSerializer().serializeToString(clone)}</div></foreignObject></svg>`;
  const img = new Image();
  await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error("render failed")); img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg); });
  const c = document.createElement("canvas");
  c.width = w * SCALE; c.height = h * SCALE;
  c.getContext("2d")!.drawImage(img, 0, 0);
  return c;
}

async function save(rel: string, c: HTMLCanvasElement): Promise<void> {
  const blob = await new Promise<Blob>((res) => c.toBlob((b) => res(b!), "image/png"));
  const r = await fetch(SAVE + encodeURIComponent(rel).replace(/%2F/g, "/"), { method: "POST", body: blob });
  if (!r.ok) throw new Error("save failed: " + rel);
}

(async () => {
  try {
    const blood = await dataUrl("/items/blood.svg");
    const weed = await dataUrl("/items/weed.svg");
    const GREY_DOWN = "background:linear-gradient(#c9ccd2,#b3b7be 50%,#a6aab2 51%,#b8bcc3);";
    const BLUE_DOWN = "background:linear-gradient(#3668c8,#1d4aa8 50%,#123a92 51%,#2a56b4);";
    const RED_DOWN = "background:linear-gradient(#b83030,#a01818 50%,#8a1010 51%,#a82a2a);";
    const FOCUS = "border-color:#4a7ad8;box-shadow:inset 0 1px 3px rgba(0,0,0,.2),0 0 0 2px rgba(74,122,216,.35);";
    const items: Array<[string, string, number]> = [];
    const add = (name: string, html: string, pad = 8): void => { items.push([name, html, name.startsWith("windows/") ? 34 : pad]); };

    // ---- buttons: with a label, and empty at three sizes (so the text can be animated on top) ----
    const kinds: Array<[string, string, string]> = [["grey", "btn", GREY_DOWN], ["blue", "btn primary", BLUE_DOWN], ["red", "btn danger", RED_DOWN], ["selected", "btn on", ""]];
    for (const [nm, cls, down] of kinds) {
      add(`buttons/${nm}-label`, `<button class="${cls}">Button</button>`);
      add(`buttons/${nm}-small-label`, `<button class="${cls} small">Button</button>`);
      add(`buttons/${nm}-empty-small`, `<button class="${cls} small" style="width:90px;min-height:26px;"></button>`);
      add(`buttons/${nm}-empty-medium`, `<button class="${cls}" style="width:150px;min-height:36px;"></button>`);
      add(`buttons/${nm}-empty-large`, `<button class="${cls}" style="width:260px;min-height:48px;border-radius:10px;"></button>`);
      if (down) add(`buttons/${nm}-pressed-empty-medium`, `<button class="${cls}" style="width:150px;min-height:36px;${down}box-shadow:inset 0 2px 4px rgba(0,0,0,.35);"></button>`);
    }
    add("buttons/grey-disabled-label", `<button class="btn" disabled>Disabled</button>`);
    add("buttons/blue-disabled-label", `<button class="btn primary" disabled>Disabled</button>`);

    // ---- text fields ----
    add("text-fields/field-empty", `<input class="mini-input" style="width:260px;" value="">`);
    add("text-fields/field-with-text", `<input class="mini-input" style="width:260px;" value="Username">`);
    add("text-fields/field-focused-empty", `<input class="mini-input" style="width:260px;${FOCUS}" value="">`);
    add("text-fields/field-focused-with-text", `<input class="mini-input" style="width:260px;${FOCUS}" value="Username">`);
    add("text-fields/field-placeholder-look", `<input class="mini-input" style="width:260px;color:#9aa2ae;" value="Username…">`);
    add("text-fields/chat-input-empty", `<input class="chat-input" style="width:340px;" value="">`);
    add("text-fields/chat-input-with-text", `<input class="chat-input" style="width:340px;" value="Sig noget. Tryk på gulvet for at gå.">`);
    add("text-fields/chat-bar-empty", `<div class="chat-bar" style="width:560px;padding-right:8px;"><input class="chat-input" value=""><button class="btn primary">Send</button></div>`);
    add("text-fields/settings-group-2-rows", `<div class="group" style="width:360px;margin:0;"><div class="cellrow"><span class="lbl">Username</span><input value="" style="width:200px;"></div><div class="cellrow"><span class="lbl">Password</span><input type="password" value="" style="width:200px;"></div></div>`);
    add("text-fields/settings-group-2-rows-filled", `<div class="group" style="width:360px;margin:0;"><div class="cellrow"><span class="lbl">Username</span><input value="Emil" style="width:200px;"></div><div class="cellrow"><span class="lbl">Password</span><input type="password" value="secret" style="width:200px;"></div></div>`);

    // ---- bars, tabs, pills ----
    add("bars/top-bar-empty", `<header class="navbar" style="width:900px;"></header>`);
    // (the top bar with its logo and blood pill: build it from top-bar-empty + blood-pill-60 + the button pieces)
    add("bars/blood-pill-empty", `<div class="nav-blood" style="min-width:120px;"></div>`);
    add("bars/blood-pill-60", `<div class="nav-blood"><img src="${blood}" style="width:16px;height:16px;margin-right:6px;image-rendering:pixelated">60</div>`);
    add("tabs/segmented-3", `<div class="nav-tabs"><div class="nav-tab">Room</div><div class="nav-tab on">Character</div><div class="nav-tab">Shop</div></div>`);
    add("tabs/segmented-3-empty", `<div class="nav-tabs"><div class="nav-tab" style="width:90px;"></div><div class="nav-tab on" style="width:90px;"></div><div class="nav-tab" style="width:90px;"></div></div>`);
    add("tabs/tabs-4", `<div class="tabs" style="width:360px;margin:0;display:flex;"><div class="tab">One</div><div class="tab on">Two</div><div class="tab">Three</div><div class="tab">Four</div></div>`);
    add("tabs/side-panel-strip-empty", `<div class="osrs-tabs" style="width:360px;display:flex;"><div class="osrs-tab" style="height:30px;"></div><div class="osrs-tab on" style="height:30px;"></div><div class="osrs-tab" style="height:30px;"></div><div class="osrs-tab" style="height:30px;"></div></div>`);
    add("tabs/tab-empty", `<div class="tab" style="width:90px;border-radius:5px;"></div>`);
    add("tabs/tab-empty-selected", `<div class="tab on" style="width:90px;border-radius:5px;"></div>`);
    add("badges/notification-badge-3", `<span class="badge">3</span>`);
    add("badges/notification-badge-empty", `<span class="badge" style="display:inline-block;min-width:18px;height:18px;"></span>`);

    // ---- windows and panels ----
    add("windows/light-panel-empty", `<div class="panel" style="width:340px;height:200px;"></div>`);
    add("windows/light-panel-with-title", `<div class="panel" style="width:340px;height:200px;"><b>Title</b><p>Some text goes here.</p></div>`);
    add("windows/dark-popup-empty", `<div class="cd-popup" style="position:static;width:300px;height:180px;"></div>`);
    add("windows/dark-popup-with-title-and-close", `<div class="cd-popup" style="position:static;width:300px;height:180px;"><div class="cd-head"><strong>Title</strong><button class="btn small">✕</button></div></div>`);
    add("windows/menu-list-3-items", `<div class="nav-pop" style="position:static;min-width:220px;"><button class="nav-pop-item">Settings</button><button class="nav-pop-item">Sign out</button><button class="nav-pop-item danger">Delete</button></div>`);
    add("windows/toast-message", `<div class="toast show" style="position:static;transform:none;opacity:1;">Message goes here</div>`);
    add("windows/toast-error", `<div class="toast err show" style="position:static;transform:none;opacity:1;">Something went wrong</div>`);
    add("windows/toast-empty", `<div class="toast show" style="position:static;transform:none;opacity:1;width:260px;height:20px;"></div>`);

    // ---- inventory slots, progress bar ----
    add("inventory/slot-empty", `<div class="inv-slot" style="width:64px;height:64px;"></div>`);
    add("inventory/slot-filled", `<div class="inv-slot filled" style="width:64px;height:64px;"><img src="${weed}"><span class="qty">3</span></div>`);
    add("inventory/slot-selected", `<div class="inv-slot selected filled" style="width:64px;height:64px;"><img src="${weed}"></div>`);
    add("inventory/slot-highlight-yellow", `<div class="inv-slot guide" style="width:64px;height:64px;animation:none;box-shadow:0 0 8px 2px rgba(255,201,51,.9);"></div>`);
    add("inventory/grid-4x2-empty", `<div class="inv-grid" style="display:grid;grid-template-columns:repeat(4,64px);gap:6px;">${'<div class="inv-slot" style="width:64px;height:64px;"></div>'.repeat(8)}</div>`);
    add("bars/progress-bar-empty", `<div class="cd-bar" style="width:260px;"><div class="cd-fill" style="width:0;"></div></div>`);
    add("bars/progress-bar-60", `<div class="cd-bar" style="width:260px;"><div class="cd-fill" style="width:60%;"></div></div>`);
    add("bars/progress-bar-full", `<div class="cd-bar" style="width:260px;"><div class="cd-fill" style="width:100%;"></div></div>`);
    add("shop/shop-tile-empty", `<div class="cell" style="width:100px;"></div>`);

    let n = 0;
    for (const [name, html, pad] of items) {
      stage.innerHTML = html;
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      const el = stage.firstElementChild as HTMLElement;
      const c = await toPng(el, pad);
      await save(`ui-assets/${name}.png`, c);
      n++;
    }
    say(`ui export done: ${n} pictures (4x, transparent)`);
    say("ALL DONE");
    document.title = "export done";
  } catch (e) { say("ERROR: " + (e as Error).message); document.title = "export error"; }
})();
