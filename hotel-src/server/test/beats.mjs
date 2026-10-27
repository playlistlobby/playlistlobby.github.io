// The BeatShop: buying the machine, listing beats (preview crop or whole), who can hear/read what, buying, taking a beat off, the chats and the rap replies
//   terminal 1: npm run emulators (project root)   terminal 2: npm run dev (server/)   terminal 3: node test/beats.mjs (server/)
const DB = "http://127.0.0.1:9000";
const NS = "demo-hotel-default-rtdb";
const AUTH = "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts";
const API = "http://127.0.0.1:8787";

async function account(name) {
  const email = `${name}@users.bobba.invalid`;
  for (const mode of ["signUp", "signInWithPassword"]) {
    const r = await fetch(`${AUTH}:${mode}?key=x`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password: "secret1", returnSecureToken: true }) });
    const j = await r.json();
    if (j.idToken) return { uid: j.localId, token: j.idToken, name };
  }
  throw new Error("auth failed for " + name);
}
const owner = async (method, path, body) => {
  const r = await fetch(`${DB}/${path}.json?ns=${NS}`, { method, headers: { Authorization: "Bearer owner", "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  return r.json();
};
const act = async (who, a, args = {}) => {
  for (let tries = 0; ; tries++) {
    const r = await fetch(`${API}/act`, { method: "POST", headers: { authorization: `Bearer ${who.token}`, "content-type": "application/json" }, body: JSON.stringify({ a, args }) });
    const j = await r.json();
    if (r.status === 429 && tries < 12 && !process.env.NO_RETRY) { await new Promise((x) => setTimeout(x, 800)); continue; }
    return { status: r.status, ...j };
  }
};
let fails = 0, passes = 0;
const check = (label, cond, extra = "") => { if (cond) passes++; else fails++; console.log(`${cond ? "PASS" : "FAIL"}  ${label} ${cond ? "" : extra}`); };
const ok = (label, r) => check(label, r.ok === true, JSON.stringify(r).slice(0, 220));
const bad = (label, r) => check(label, r.ok === false, JSON.stringify(r).slice(0, 220));
const fresh = async (name, extra = {}) => {
  const u = await account(name);
  await owner("PUT", `users/${u.uid}`, { name, gender: "M", figure: "hr-115-42.hd-190-1.ch-215-62.lg-285-91.sh-290-62", blood: 0, createdAt: Date.now(), ...extra });
  await owner("PUT", `profiles/${u.uid}`, { name, figure: "x" });
  return u;
};
const stand = (u, room) => owner("PUT", `rooms/${room}/players/${u.uid}`, { name: u.name, figure: "x", x: 5, y: 5, dir: 2 });
const bloodOf = async (u) => Number(await owner("GET", `users/${u.uid}/blood`)) || 0;
const state = async (u) => (await act(u, "sync")).state;
const clientWrite = (u, path, v) => fetch(`${DB}/${path}.json?ns=${NS}&auth=${u.token}`, { method: "PUT", body: JSON.stringify(v) });
const readAs = (u, path) => fetch(`${DB}/${path}.json?ns=${NS}&auth=${u.token}`).then(async (r) => ({ status: r.status, body: await r.json().catch(() => null) }));
const refused = (r) => r.status === 401 || r.status === 403;

const fakeAudio = (n, head = "ID3") => { const b = Buffer.alloc(n, 7); b.write(head, 0, "latin1"); b[3] = 3; return b; };
const fakeWav = (n) => { const b = Buffer.alloc(n, 3); b.write("RIFF", 0, "latin1"); b.write("WAVE", 8, "latin1"); return b; };
const PIECE = 510_000;
const pieces = (buf) => { const out = []; for (let i = 0; i < buf.length; i += PIECE) out.push(buf.subarray(i, i + PIECE).toString("base64")); return out; };
const writeAll = async (u, id, buf) => { const ps = pieces(buf); for (let i = 0; i < ps.length; i++) await clientWrite(u, `audio/${id}/${i}`, ps[i]); };

for (const p of ["beats", "beatBuys", "beatChats", "beatChatMsgs", "audioMeta", "audio", "audioUploads"]) await owner("DELETE", p);
const seller = await fresh("t_bs_seller", { blood: 200 }), buyer = await fresh("t_bs_buyer", { blood: 300 }), other = await fresh("t_bs_other", { blood: 300 }), poor = await fresh("t_bs_poor", { blood: 3 });
for (const u of [seller, buyer, other, poor]) await act(u, "sync");

console.log("--- the machine");
bad("only in the shop room", await act(seller, "buyBeatShop"));
for (const u of [seller, buyer, other, poor]) await stand(u, "shop");
bad("3 blood is not enough", await act(poor, "buyBeatShop"));
ok("buy it for 50", await act(seller, "buyBeatShop"));
check("150 left and the machine is in the pocket", (await bloodOf(seller)) === 150 && (await state(seller)).inventory.some((s) => s && s.item === "f_beatshop"));
bad("one per player", await act(seller, "buyBeatShop"));
bad("can't sell beats without a machine", await act(buyer, "beatBegin", { title: "x", price: 5, durMs: 30000, size: 5000, mime: "audio/mpeg", whole: true }));

console.log("--- listing a beat with a 30 second preview");
const begin = (u, o = {}) => act(u, "beatBegin", { title: "Dark Trap", price: 100, durMs: 120_000, size: 5000, mime: "audio/mpeg", whole: false, previewSize: 3000, previewMs: 30_000, previewMime: "audio/wav", ...o });
bad("a title is needed", await begin(seller, { title: "  " }));
bad("price 0", await begin(seller, { price: 0 }));
bad("price over 10,000", await begin(seller, { price: 10_001 }));
bad("a beat over 10 MB", await begin(seller, { size: 10_000_001 }));
bad("a preview that is not there", await begin(seller, { previewSize: undefined }));
bad("a preview over 31 seconds", await begin(seller, { previewMs: 40_000 }));
const b1 = await begin(seller);
ok("begin", b1);
const id1 = b1.data.id, pid1 = b1.data.previewId;
check("two uploads: the beat and the preview", id1 && pid1 && id1 !== pid1);
check("the beat is not on sale yet", (await owner("GET", `beats/${seller.uid}/${id1}/ready`)) === false);
bad("finishing before the pieces are there", await act(seller, "beatFinish", { id: id1 }));
await writeAll(seller, id1, fakeAudio(5000));
await writeAll(seller, pid1, fakeWav(3000));
ok("finish", await act(seller, "beatFinish", { id: id1 }));
check("on sale", (await owner("GET", `beats/${seller.uid}/${id1}/ready`)) === true);
check("everybody can see the list", (await readAs(buyer, `beats/${seller.uid}`)).status === 200);
check("everybody can hear the preview", (await readAs(buyer, `audio/${pid1}/0`)).status === 200);
check("a stranger can't read the full beat", refused(await readAs(buyer, `audio/${id1}/0`)));
check("the seller can", (await readAs(seller, `audio/${id1}/0`)).status === 200);

console.log("--- buying it");
bad("not your own beat", await act(seller, "beatBuy", { owner: seller.uid, id: id1 }));
bad("not enough blood", await act(poor, "beatBuy", { owner: seller.uid, id: id1 }));
bad("not a beat that isn't there", await act(buyer, "beatBuy", { owner: seller.uid, id: "nothere" }));
ok("buy for 100", await act(buyer, "beatBuy", { owner: seller.uid, id: id1 }));
check("100 moves from the buyer to the seller", (await bloodOf(buyer)) === 200 && (await bloodOf(seller)) === 250, JSON.stringify([await bloodOf(buyer), await bloodOf(seller)]));
check("the buyer can read the full beat now", (await readAs(buyer, `audio/${id1}/0`)).status === 200);
check("a third player still can't", refused(await readAs(other, `audio/${id1}/0`)));
check("the buyer's list has it with the seller's name", (await readAs(buyer, `beatBuys/${buyer.uid}/${id1}`)).body?.ownerName === seller.name);
check("nobody else can read the buyer's list", refused(await readAs(other, `beatBuys/${buyer.uid}`)));
bad("not twice", await act(buyer, "beatBuy", { owner: seller.uid, id: id1 }));
check("the beat counts a sale", (await owner("GET", `beats/${seller.uid}/${id1}/sold`)) === 1);

console.log("--- a whole beat is open to listen to");
const b2 = await begin(seller, { title: "Open Beat", whole: true, previewSize: undefined, previewMs: undefined, price: 7 });
ok("begin (whole)", b2);
check("only one upload", b2.data.previewId === null);
await writeAll(seller, b2.data.id, fakeAudio(5000));
ok("finish", await act(seller, "beatFinish", { id: b2.data.id }));
check("everybody can read it", (await readAs(other, `audio/${b2.data.id}/0`)).status === 200);
const row2 = (await readAs(other, `beats/${seller.uid}/${b2.data.id}`)).body;
check("the preview is the beat itself", row2.whole === true && row2.previewId === b2.data.id);

console.log("--- 15 at most");
for (let i = 0; i < 13; i++) { const r = await begin(seller, { title: `Beat ${i}`, whole: true, previewSize: undefined, previewMs: undefined }); if (!r.ok) { check(`beat ${i}`, false, JSON.stringify(r)); break; } await owner("PATCH", `beats/${seller.uid}/${r.data.id}`, { ready: true }); await owner("DELETE", `audioUploads/${seller.uid}`); }
const n = Object.keys((await owner("GET", `beats/${seller.uid}`)) ?? {}).length;
check("15 on sale (2 + 13)", n === 15, String(n));
bad("the 16th is refused", await begin(seller, { title: "one too many", whole: true, previewSize: undefined, previewMs: undefined }));

console.log("--- taking a beat off");
ok("take off the open beat (nobody bought it)", await act(seller, "beatRemove", { id: b2.data.id }));
check("its file is gone", (await owner("GET", `audioMeta/${b2.data.id}`)) === null && (await owner("GET", `audio/${b2.data.id}`)) === null);
ok("take off the sold beat", await act(seller, "beatRemove", { id: id1 }));
check("it is not on sale", (await owner("GET", `beats/${seller.uid}/${id1}`)) === null);
check("but the buyer can still read the file", (await readAs(buyer, `audio/${id1}/0`)).status === 200 && (await readAs(buyer, `beatBuys/${buyer.uid}/${id1}`)).status === 200);
check("the preview file is gone", (await owner("GET", `audioMeta/${pid1}`)) === null);
bad("a stranger can't take it off", await act(other, "beatRemove", { id: "x" + id1.slice(1) }));

console.log("--- the chat");
bad("no chat without buying", await act(other, "beatChatSend", { owner: seller.uid, beat: id1, text: "hey" }));
bad("an empty message", await act(buyer, "beatChatSend", { owner: seller.uid, beat: id1, text: "   " }));
ok("the buyer writes", await act(buyer, "beatChatSend", { owner: seller.uid, beat: id1, text: "yo this is fire <b>x</b>" }));
const key = `${id1}_${buyer.uid}`;
let meta = await owner("GET", `beatChats/${seller.uid}/${key}`);
check("a thread with the names, the beat and the owner's dot", meta && meta.buyerName === buyer.name && meta.ownerName === seller.name && meta.title === "Dark Trap" && meta.unreadOwner === true && meta.unreadBuyer === false && meta.lastText.startsWith("yo this is fire"), JSON.stringify(meta));
check("tags are taken out of the text", !JSON.stringify(await owner("GET", `beatChatMsgs/${seller.uid}/${key}`)).includes("<b>"));
check("the seller reads the inbox", (await readAs(seller, `beatChats/${seller.uid}`)).status === 200);
check("the buyer reads their own thread", (await readAs(buyer, `beatChats/${seller.uid}/${key}`)).status === 200 && (await readAs(buyer, `beatChatMsgs/${seller.uid}/${key}`)).status === 200);
check("the buyer can't read the inbox", refused(await readAs(buyer, `beatChats/${seller.uid}`)));
check("a stranger can't read the thread or the messages", refused(await readAs(other, `beatChats/${seller.uid}/${key}`)) && refused(await readAs(other, `beatChatMsgs/${seller.uid}/${key}`)));
ok("the seller marks it read", await act(seller, "beatChatRead", { owner: seller.uid, beat: id1, buyer: buyer.uid }));
check("no dot now", (await owner("GET", `beatChats/${seller.uid}/${key}/unreadOwner`)) === false);
ok("the seller answers", await act(seller, "beatChatSend", { owner: seller.uid, beat: id1, buyer: buyer.uid, text: "thanks, send me your rap" }));
meta = await owner("GET", `beatChats/${seller.uid}/${key}`);
check("now the buyer has the dot", meta.unreadBuyer === true && meta.unreadOwner === false);
ok("the buyer marks it read", await act(buyer, "beatChatRead", { owner: seller.uid, beat: id1 }));
check("the buyer has no dot", (await owner("GET", `beatChats/${seller.uid}/${key}/unreadBuyer`)) === false);

console.log("--- a rap in the chat");
bad("a recording for a chat you aren't in", await act(other, "beatReplyBegin", { owner: seller.uid, beat: id1, size: 4000, durMs: 20_000, mime: "audio/wav" }));
bad("over 3 MB", await act(buyer, "beatReplyBegin", { owner: seller.uid, beat: id1, size: 3_000_001, durMs: 20_000, mime: "audio/wav" }));
const rb = await act(buyer, "beatReplyBegin", { owner: seller.uid, beat: id1, size: 4000, durMs: 20_000, mime: "audio/wav" });
ok("begin the recording", rb);
check("nobody can hear it before it is sent", refused(await readAs(seller, `audio/${rb.data.id}/0`)));
await writeAll(buyer, rb.data.id, fakeWav(4000));
ok("send it", await act(buyer, "beatChatSend", { owner: seller.uid, beat: id1, audioId: rb.data.id }));
meta = await owner("GET", `beatChats/${seller.uid}/${key}`);
check("the thread says Audio reply and the owner has the dot", meta.lastAudio === true && meta.lastText === "Audio reply" && meta.unreadOwner === true);
check("the seller can hear it", (await readAs(seller, `audio/${rb.data.id}/0`)).status === 200);
check("so can the buyer", (await readAs(buyer, `audio/${rb.data.id}/0`)).status === 200);
check("a stranger can't", refused(await readAs(other, `audio/${rb.data.id}/0`)));
bad("somebody else's recording can't be sent", await act(seller, "beatChatSend", { owner: seller.uid, beat: id1, buyer: buyer.uid, audioId: rb.data.id }));

for (const p of ["beats", "beatBuys", "beatChats", "beatChatMsgs", "audioMeta", "audio", "audioUploads"]) await owner("DELETE", p);
for (const u of [seller, buyer, other, poor]) await owner("DELETE", `rooms/shop/players/${u.uid}`);
console.log(`\n${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
