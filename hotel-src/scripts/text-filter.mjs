// Which strings in the code are text a player sees (and so get translated), and which are code words (class names, ids, paths...).
// Used by scripts/extract-text.mjs (makes the list to translate) and scripts/danish-plugin.mjs (puts the translation into the build),
// so both always agree on what counts as text.
import ts from "typescript";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SKIP_DIRS = new Set(["avatar", "node_modules"]); // the vendored avatar library has no player-facing text
const SKIP_FILES = new Set(["firebaseConfig.ts", "apiConfig.ts", "logger.ts"]);
const ALWAYS_TEXT_FILES = new Set(["src/npc.ts", "src/items.ts", "src/emotes.ts"]); // lower-case lines like "psst" count here

/** Is this source file one whose text gets translated? (`rel` = path from the project root, forward slashes) */
export function translatable(rel) {
  if (!/\.ts$/.test(rel) || /\.d\.ts$/.test(rel)) return false;
  const parts = rel.split("/");
  if (parts[0] !== "src" && !(parts[0] === "server" && parts[1] === "src")) return false;
  if (parts.some((p) => SKIP_DIRS.has(p))) return false;
  if (SKIP_FILES.has(parts[parts.length - 1])) return false;
  if (parts[0] === "server" && parts.length === 3 && /^(auth|rtdb|env|index|economy|firebase)\.ts$/.test(parts[2])) return false;
  return true;
}

/** property names whose string is a code word, not text */
const SKIP_KEYS = new Set(["class", "className", "id", "type", "kind", "src", "href", "role", "key", "for", "icon", "color", "nitro", "path", "tab", "cmd", "step", "a", "item", "side", "slot", "access", "gesture", "actions", "motion", "fx", "cursor", "font", "mode", "dir", "action", "opens", "useSelf", "useOnObject", "useOnPlayer", "litIcon", "background", "border", "width", "height", "display", "position", "style", "fill", "stroke", "rel", "autocomplete", "inputMode", "accept", "method", "headers", "authorization", "content-type", "theme", "floorTex", "wallTex", "who", "room", "from", "to", "by", "state", "event", "ev", "mood", "layer", "part", "stage", "tag", "kindId", "owned", "floorA", "floorB", "wall", "rugColor", "textAlign", "textBaseline", "alt_", "viewBox"]);
/** property names that are text for sure */
const TEXT_KEYS = new Set(["label", "name", "title", "examine", "desc", "text", "placeholder", "alt", "aria-label", "note", "message", "line", "tooltip", "hint", "target", "textContent", "innerText"]);
/** calls whose string arguments are code words */
const SKIP_CALLS = /^(querySelector|querySelectorAll|getElementById|addEventListener|removeEventListener|setAttribute|getAttribute|removeAttribute|getItem|setItem|removeItem|ref|child|update|set|push|remove|get|onValue|onChildAdded|onChildChanged|onChildRemoved|fetch|assetUrl|loadImg|loadNitro|nitroIfReady|playSfx|logAction|call|act|require|import|resolve|join|hasOwnProperty|includes|startsWith|endsWith|test|exec|match|replace|split|toggle|add|contains|createElement|createElementNS|dispatchEvent|CustomEvent|on|off|emit|navigate|parse|stringify|log|warn|error|info|debug|has|getContext|hasAttribute|append|font|measureText|matches|closest|indexOf|localeCompare|padStart|padEnd|repeat|startsWith|setItem|sessionStorage|navigate|openTab|setTool|toDataURL|getPropertyValue|setProperty|styleOf|loadTexture|texture|loadScript|importScripts|Map|Set|toString|toFixed|fillStyle|strokeStyle)$/;

/** code words that slip through the filters */
export const NOISE = new Set(["emote_{id}", "{…}px Verdana, sans-serif", "no sprite sheet for {kind}", "s were", "uid {uid}", "Build → Authentication → enable the Email/Password provider (usernames are mapped onto it; no real emails are used)", "6ixty's room", "lighter", "kodimagnyl", "was", "dot", "aria-label", "dim", "has", "starter", "blood", "sel"]);

/** the form a text is looked up in: line breaks and edges tidied */
export const normalize = (text) => text.replace(/\s+\n\s+/g, " ").trim();

const looksLikeCode = (t) =>
  /^(hd|hr|ch|lg|sh|ea|fa|cc|ca|wa|he|ha|bd)-\d|^data:|^sfx\/|^[a-z0-9_]+\/[a-z0-9_./-]+$|=>|\bfunction\b|rgba?\(|hsla?\(|^#[0-9a-f]{3,8}$|https?:|^\/|\.(png|svg|jpg|jpeg|mp3|ogg|json|nitro|css|js|ts)\b|[{};]\s*$|^\.|^\[|\bpx\b|^[a-z]+:\/\/|^\d+(\.\d+)?(px|%|ms|s)?$|^[a-z0-9_]+\.[a-z0-9_.]+$|^\W+$/i.test(t);
export const hasLetters = (t) => (t.match(/[A-Za-zÆØÅæøå]/g) ?? []).length >= 2;
const textual = (t, always, key) => {
  if (t === "ready!") return true; // drawn on the canvas over a grown plant
  // a {placeholder} (an expression in a template) is not part of the words: judge the text without it
  const bare = t.replace(/\{[^{}]*\}/g, "0");
  if (!hasLetters(bare) || looksLikeCode(bare)) return false;
  if (key && TEXT_KEYS.has(key)) return true;
  if (/\s/.test(t) && !/^[a-z0-9_-]+( [a-z0-9_-]+)*$/.test(t)) return true; // several words with a capital or punctuation
  if (/[.!?…:]/.test(t) && /\s/.test(t)) return true;
  if (always && !/^[a-z0-9_-]+$/.test(t) ? true : always && /\s|[.!?,]/.test(t)) return true;
  if (/^[A-Z][a-zA-Z' ]{2,}$/.test(t)) return true; // "Send", "Inventory", "Dumpster"
  if (always && /^[a-z][a-z' ]{2,}$/.test(t)) return true;
  return false;
};

function nameOf(node) { return ts.isIdentifier(node) || ts.isStringLiteral(node) ? node.text : undefined; }
function callName(call) {
  const e = call.expression;
  if (ts.isIdentifier(e)) return e.text;
  if (ts.isPropertyAccessExpression(e)) return e.name.text;
  return undefined;
}

/** the label a ${...} gets in the list: its name if it has one, else "…" */
export function labelOf(e) {
  if (ts.isIdentifier(e)) return e.text;
  if (ts.isPropertyAccessExpression(e)) return e.name.text;
  if (ts.isCallExpression(e) && ts.isIdentifier(e.expression)) return e.expression.text;
  return "…";
}

/** the text of a string / template, with `{label}` where an expression goes */
export function templateText(node) {
  if (ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  let out = node.head.text;
  for (const span of node.templateSpans) out += `{${labelOf(span.expression)}}` + span.literal.text;
  return out;
}

function inSkippedContext(node) {
  let p = node.parent;
  if (!p) return true;
  { // a code word inside an array or a condition that belongs to a property like  actions: ["wav"]
    let q = node.parent;
    while (q && (ts.isArrayLiteralExpression(q) || ts.isConditionalExpression(q) || ts.isParenthesizedExpression(q) || ts.isAsExpression(q) || ts.isNonNullExpression(q) || ts.isBinaryExpression(q))) q = q.parent;
    if (q && ts.isPropertyAssignment(q)) { const k = nameOf(q.name); if (k && SKIP_KEYS.has(k)) return true; }
  }
  if (ts.isImportDeclaration(p) || ts.isExportDeclaration(p) || ts.isLiteralTypeNode(p) || ts.isCaseClause(p) || ts.isEnumMember(p)) return true;
  if (ts.isElementAccessExpression(p) && p.argumentExpression === node) return true;
  if (ts.isBinaryExpression(p)) {
    const op = p.operatorToken.kind;
    if ([ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsEqualsToken, ts.SyntaxKind.EqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsToken].includes(op)) return true; // comparisons with a code word
    if (op === ts.SyntaxKind.EqualsToken && ts.isPropertyAccessExpression(p.left) && /^(className|id|src|href|type|style|cursor|font|fillStyle|strokeStyle|textAlign|textBaseline|globalCompositeOperation|shadowColor|display|position|value|dataset|name|rel|accept)$/.test(p.left.name.text) && p.right === node && p.left.name.text !== "value") return true;
  }
  if (ts.isPropertyAssignment(p) && p.initializer === node) {
    const k = nameOf(p.name);
    if (k && SKIP_KEYS.has(k)) return true;
  }
  if (ts.isCallExpression(p) || ts.isNewExpression(p)) {
    const cn = ts.isCallExpression(p) ? callName(p) : p.expression.getText();
    if (cn && SKIP_CALLS.test(cn)) return true;
    if (cn === "h" && p.arguments[0] === node) return true; // the tag name
  }
  return false;
}

/** Every string / template in the file that is text for a player: { node, text (as written, `{label}` for expressions), norm, line } */
export function collectTexts(sf, rel) {
  const always = ALWAYS_TEXT_FILES.has(rel);
  const found = [];
  const visit = (node) => {
    let text = null;
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) text = node.text;
    else if (ts.isTemplateExpression(node)) text = templateText(node);
    if (text !== null && !inSkippedContext(node)) {
      let key;
      const p = node.parent;
      if (p && ts.isPropertyAssignment(p) && p.initializer === node) key = nameOf(p.name);
      // inside a template/addition chain the key sits further up (or it is the property on the left of an  x.placeholder = ...)
      if (!key) { let q = node.parent; for (let i = 0; i < 4 && q; i++, q = q.parent) { if (ts.isPropertyAssignment(q)) { key = nameOf(q.name); break; } if (ts.isBinaryExpression(q) && q.operatorToken.kind === ts.SyntaxKind.EqualsToken && ts.isPropertyAccessExpression(q.left)) { key = q.left.name.text; break; } } }
      const keyed = key && !SKIP_KEYS.has(key) ? key : undefined;
      const norm = normalize(text);
      if (norm && !NOISE.has(norm) && textual(text, always, keyed)) found.push({ node, text, norm, line: sf.getLineAndCharacterOfPosition(node.getStart()).line + 1, key: keyed });
    }
    // a template's own literal parts are not strings; its expressions can hold more
    if (ts.isTemplateExpression(node)) { for (const s of node.templateSpans) visit(s.expression); return; }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return found;
}
