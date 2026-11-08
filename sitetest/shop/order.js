// The order form's checks (the product, size and colour are chosen and checked in shop.js and by the Worker). Ported from the album-event t-shirt shop of the game (hotel-src/src/shared/tshirt.ts):
// the same sizes and the same rules for the name, email, phone number and address.
// (The game's shop also paid through the game's server, for logged-in players standing on the event stage. That part is not reusable on this site.)

const clean = (v, min, max, what) => {
  const s = typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f<>]/g, "").replace(/\s+/g, " ").trim() : "";
  if (s.length < min) throw new Error(`Fill in ${what}.`);
  if (s.length > max) throw new Error(`${what[0].toUpperCase()}${what.slice(1)} is too long.`);
  return s;
};

/** checks what was typed; throws a message that can be shown, or returns the cleaned order */
export function cleanOrder(raw) {
  const o = raw && typeof raw === "object" ? raw : {};
  const zip = clean(o.zip, 3, 10, "your postcode");
  if (!/^[A-Za-z0-9 -]{3,10}$/.test(zip)) throw new Error("That postcode doesn't look right.");
  const email = clean(o.email, 5, 100, "your email");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new Error("That email doesn't look right.");
  const phone = clean(o.phone, 6, 20, "your phone number");
  if (!/^\+?[0-9 ()-]{6,20}$/.test(phone) || phone.replace(/\D/g, "").length < 6) throw new Error("That phone number doesn't look right.");
  return { name: clean(o.name, 3, 60, "your full name"), email, phone, street: clean(o.street, 4, 80, "your street and number"), zip, city: clean(o.city, 2, 50, "your city"), country: clean(o.country, 2, 40, "your country") };
}
